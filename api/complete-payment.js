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

if (
    metadata.purpose !== "track_purchase" ||
    !metadata.relicId ||
    !metadata.trackTitle
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

await sql`
    INSERT INTO purchases (
        payment_id,
        txid,
        user_uid,
        relic_id,
        track_title,
        amount_pi,
        artist_share_pi,
        ossvarium_fee_pi
    )
    VALUES (
        ${paymentId},
        ${txid},
        ${userUid},
        ${metadata.relicId},
        ${metadata.trackTitle},
        ${amountPi},
        ${artistSharePi},
        ${ossvariumFeePi}
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