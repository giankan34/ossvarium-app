const axios = require("axios");

const {
    neon
} = require(
    "@neondatabase/serverless"
);

module.exports = async (req, res) => {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const { paymentId, txid } = req.body;

    if (!paymentId || !txid) {
        return res.status(400).json({
            error: "Missing paymentId or txid"
        });
    }

    try {

        const paymentInfoResponse = await axios.get(
    `https://api.minepi.com/v2/payments/${paymentId}`,
    {
        headers: {
            Authorization: `Key ${process.env.PI_API_KEY}`
        }
    }
);

const paymentInfo = paymentInfoResponse.data;

if (paymentInfo?.metadata?.purpose === "merch_purchase") {

    const checkoutToken = String(
    paymentInfo.metadata.checkoutToken || ""
);

if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(checkoutToken)) {
    return res.status(400).json({
        error: "Invalid merch checkout token"
    });
}

const sql = neon(process.env.POSTGRES_URL);

const orders = await sql`
    SELECT
        id,
        pi_payment_id,
        buyer_pi_uid,
        pi_txid,
        total_price_pi,
        status,
        expires_at
    FROM merch_orders
    WHERE checkout_token = ${checkoutToken}::uuid
    LIMIT 1
`;

const order = orders[0];

if (
    order?.status === "paid" &&
    order.pi_payment_id === paymentId &&
    order.buyer_pi_uid === paymentInfo.user_uid &&
    Number(order.total_price_pi) === Number(paymentInfo.amount) &&
    order.pi_txid === txid &&
    paymentInfo?.status?.developer_completed === true &&
    paymentInfo?.metadata?.purpose === "merch_purchase" &&
    paymentInfo?.metadata?.checkoutToken === checkoutToken &&
    paymentInfo?.transaction?.txid === txid
){
    return res.status(200).json({
        success: true,
        purpose: "merch_purchase",
        orderId: String(order.id),
        paymentId,
        status: "paid",
        alreadyCompleted: true
    });
}

if (
    !order ||
    order.status !== "pending" ||
    order.pi_payment_id !== paymentId ||
    order.buyer_pi_uid !== paymentInfo.user_uid ||
    Number(order.total_price_pi) !== Number(paymentInfo.amount)
) {
    return res.status(409).json({
        error: "Merch payment does not match the order"
    });
}

    const blockchainTxid =
        paymentInfo?.transaction?.txid;

    if (blockchainTxid && blockchainTxid !== txid) {
        return res.status(400).json({
            error: "Merch transaction ID mismatch"
        });
    }

    
let completedPayment;

if (paymentInfo.status?.developer_completed === true) {
    // Pi has already completed this payment.
    // Recover it without requesting completion again.
    completedPayment = paymentInfo;
} else {
    const completionResponse = await axios.post(
        `https://api.minepi.com/v2/payments/${paymentId}/complete`,
        { txid },
        {
            headers: {
                Authorization: `Key ${process.env.PI_API_KEY}`
            }
        }
    );

    completedPayment = completionResponse.data;
}


if (
    completedPayment?.status?.developer_completed !== true ||
    completedPayment?.user_uid !== order.buyer_pi_uid ||
    completedPayment?.metadata?.purpose !== "merch_purchase" ||
    completedPayment?.metadata?.checkoutToken !== checkoutToken ||
    Number(completedPayment?.amount) !== Number(order.total_price_pi) ||
    completedPayment?.transaction?.txid !== txid
) {
    return res.status(409).json({
        error: "Merch payment verification failed"
    });
}

const finalized = await sql`
    SELECT finalize_merch_order(
        ${order.id}::bigint,
        ${paymentId}::text,
        ${txid}::text,
        ${order.buyer_pi_uid}::text
    ) AS success
`;

if (finalized[0]?.success !== true) {
    console.error("Merch payment completed but order not finalized", {
        orderId: order.id,
        paymentId
    });

    return res.status(409).json({
        error: "Payment completed but order requires review"
    });
}

return res.status(200).json({
    success: true,
    purpose: "merch_purchase",
    orderId: String(order.id),
    paymentId,
    status: "paid"
});
}

        const response = await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/complete`,
            {
                txid: txid
            },
            {
                headers: {
                    Authorization: `Key ${process.env.PI_API_KEY}`
                }
            }
        );

        const completedPayment =
    response.data;

    const metadata =
    completedPayment?.metadata || {};

    // Merch payments require a separate completion flow.
// Do not record them as relic purchases.
if (metadata.purpose === "merch_purchase") {
    return res.status(400).json({
        error: "Merch payment completion is not enabled yet"
    });
}

const validPurpose =
    metadata.purpose === "track_purchase" ||
    metadata.purpose === "artist_support";

if (
    !validPurpose ||
    !metadata.relicId ||
    (
        metadata.purpose === "track_purchase" &&
        !metadata.trackTitle
    )
) {
    return res.status(400).json({
        error: "Invalid completed payment metadata"
    });
}

if (
    completedPayment?.status?.developer_completed !== true
) {
    console.error(
        "OSSVARIUM payment not confirmed as completed:",
        completedPayment
    );

    return res.status(400).json({
        error: "Payment was not confirmed as completed"
    });
}

const userUid =
    completedPayment?.user_uid;

if (!userUid) {
    return res.status(400).json({
        error: "Missing Pi user UID"
    });
}

const sql =
    neon(process.env.POSTGRES_URL);

const amountPi =
    Number(completedPayment.amount);

const artistSharePi =
    Number((amountPi * 0.90).toFixed(4));

const ossvariumFeePi =
    Number((amountPi * 0.10).toFixed(4));

    const relicRows = await sql`
    SELECT tracks, creator_pi_uid
    FROM relics
    WHERE relic_id = ${metadata.relicId}
      AND status = 'approved'
    LIMIT 1;
`;

if (relicRows.length === 0) {
    return res.status(404).json({
        error: "Relic not found"
    });
}

if (metadata.purpose === "artist_support") {
    const amountPi =
        Number(completedPayment.amount);

    if (!amountPi || amountPi <= 0) {
        return res.status(400).json({
            error: "Invalid support amount"
        });
    }

    const creatorPiUid =
        relicRows[0].creator_pi_uid;

    if (!creatorPiUid) {
        return res.status(400).json({
            error: "Artist has no connected Pi account"
        });
    }

    const artistSharePi =
        Number((amountPi * 0.90).toFixed(4));

    const ossvariumFeePi =
        Number((amountPi * 0.10).toFixed(4));

    await sql`
        INSERT INTO artist_supports (
            payment_id,
            txid,
            supporter_pi_uid,
            relic_id,
            track_title,
            creator_pi_uid,
            amount_pi,
            artist_share_pi,
            ossvarium_fee_pi,
            status
        )
        VALUES (
            ${paymentId},
            ${txid},
            ${userUid},
            ${metadata.relicId},
            ${metadata.trackTitle},
            ${creatorPiUid},
            ${amountPi},
            ${artistSharePi},
            ${ossvariumFeePi},
            'completed'
        )
        ON CONFLICT (payment_id)
        DO NOTHING;
    `;

    return res.status(200).json({
        success: true,
        purpose: "artist_support",
        payment: completedPayment
    });
}

const tracks = Array.isArray(relicRows[0].tracks)
    ? relicRows[0].tracks
    : [];

const track = tracks.find(
    item => item.title === metadata.trackTitle
);

if (
    !track ||
    !track.supportPi ||
    Number(track.supportPi) <= 0
) {
    return res.status(400).json({
        error: "Invalid track Pi price"
    });
}

await sql`
    INSERT INTO purchases (
        payment_id,
        txid,
        user_uid,
        relic_id,
        track_title,
        amount_pi,
        artist_share_pi,
        ossvarium_fee_pi,
        payment_method
    )
    VALUES (
        ${paymentId},
        ${txid},
        ${userUid},
        ${metadata.relicId},
        ${metadata.trackTitle},
        ${amountPi},
        ${artistSharePi},
        ${ossvariumFeePi},
        'pi'
    )
    ON CONFLICT
    DO NOTHING;
`;

        return res.status(200).json({
    success: true,
    payment: completedPayment
});

    } catch (error) {

        console.error(
            "Pi complete payment error:",
            error.response?.data || error.message
        );

        return res.status(
            error.response?.status || 500
        ).json({
            error: "Payment completion failed",
            details: error.response?.data || error.message
        });
    }
};