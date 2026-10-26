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

    const { paymentId } = req.body;

    if (!paymentId) {
        return res.status(400).json({
            error: "Missing paymentId"
        });
    }

    try {

        const paymentResponse = await axios.get(
    `https://api.minepi.com/v2/payments/${paymentId}`,
    {
        headers: {
            Authorization: `Key ${process.env.PI_API_KEY}`
        }
    }
);

const payment =
    paymentResponse.data;

const metadata =
    payment.metadata || {};

    // Merch payments use a separate validation flow.
if (metadata.purpose === "merch_purchase") {
    const checkoutToken = String(metadata.checkoutToken || "");

    if (!/^[0-9a-f-]{36}$/i.test(checkoutToken)) {
        return res.status(400).json({
            error: "Invalid merch checkout token"
        });
    }

    const sql = neon(process.env.POSTGRES_URL);

    const orders = await sql`
        SELECT
            o.id,
            o.buyer_pi_uid,
            o.total_price_pi,
            o.expires_at,
            o.status,
            m.status AS product_status,
            m.quantity AS stock
        FROM merch_orders o
        JOIN merch_products m ON m.id = o.product_id
        WHERE o.checkout_token = ${checkoutToken}::uuid
        LIMIT 1
    `;

    const order = orders[0];

    if (
        !order ||
        order.status !== "pending" ||
        order.product_status !== "approved" ||
        Number(order.stock) < 1 ||
        new Date(order.expires_at).getTime() <= Date.now()
    ) {
        return res.status(409).json({
            error: "Merch order unavailable or expired"
        });
    }

    const buyerPiUid = String(payment.user_uid || "").trim();

    if (order.buyer_pi_uid !== buyerPiUid) {
    return res.status(403).json({
        error: "Pi buyer does not match checkout owner"
    });
}

if (!buyerPiUid) {
    return res.status(400).json({
        error: "Missing Pi buyer identity"
    });
}

if (
    payment.status?.developer_completed === true ||
    payment.status?.cancelled === true
) {
    return res.status(409).json({
        error: "Pi payment already completed or cancelled"
    });
}

if (payment.direction !== "user_to_app") {
    return res.status(400).json({
        error: "Invalid Pi payment direction"
    });
}

    if (
        Number(payment.amount) !== Number(order.total_price_pi)
    ) {
        return res.status(400).json({
            error: "Merch payment amount mismatch"
        });
    }

    const linkedOrders = await sql`
    UPDATE merch_orders
    SET
        pi_payment_id = ${paymentId},
        buyer_pi_uid = ${buyerPiUid}
    WHERE id = ${order.id}
      AND status = 'pending'
      AND expires_at > NOW()
      AND (
          pi_payment_id IS NULL
          OR pi_payment_id = ${paymentId}
      )
      AND (
          buyer_pi_uid IS NULL
          OR buyer_pi_uid = ${buyerPiUid}
      )
    RETURNING id, pi_payment_id
`;

if (linkedOrders.length !== 1) {
    return res.status(409).json({
        error: "Merch order already linked to another payment"
    });
}

let approvalResponse;

if (payment.status?.developer_approved === true) {
  approvalResponse = { data: payment };
} else {
  approvalResponse = await axios.post(
    `https://api.minepi.com/v2/payments/${paymentId}/approve`,
    {},
    {
      headers: {
        Authorization: `Key ${process.env.PI_API_KEY}`
      }
    }
  );
}

return res.status(200).json({
    success: true,
    orderId: String(linkedOrders[0].id),
    paymentId: linkedOrders[0].pi_payment_id,
    paymentLinked: true,
    paymentApproved: true,
    payment: approvalResponse.data
});
}

const relicId =
    metadata.relicId;

const trackTitle =
    metadata.trackTitle;

const validPurpose =
    metadata.purpose === "track_purchase" ||
    metadata.purpose === "artist_support";

if (
    !validPurpose ||
    !relicId ||
    !trackTitle
) {
    return res.status(400).json({
        error: "Invalid payment metadata"
    });
}

const sql =
    neon(process.env.POSTGRES_URL);

const relicRows = await sql`
    SELECT
        relic_id,
        tracks
    FROM relics
    WHERE relic_id = ${relicId}
      AND status = 'approved'
    LIMIT 1;
`;

if (relicRows.length === 0) {
    return res.status(404).json({
        error: "Relic not found"
    });
}

const relic =
    relicRows[0];

const track =
    Array.isArray(relic.tracks)
        ? relic.tracks.find(
            item =>
                item.title === trackTitle
        )
        : null;

        if (metadata.purpose === "track_purchase") {

if (
    !track ||
    !track.supportPi ||
    Number(track.supportPi) <= 0
) {
    return res.status(400).json({
        error: "Invalid track purchase"
    });
}

const expectedPi =
    Number(track.supportPi);

const paymentAmount =
    Number(payment.amount);

if (
    !paymentAmount ||
    paymentAmount <= 0
) {
    return res.status(400).json({
        error: "Invalid payment amount"
    });
}

const tolerance =
    expectedPi * 0.02;

if (
    Math.abs(
        paymentAmount - expectedPi
    ) > tolerance
) {
    console.error(
        "OSSVARIUM payment amount mismatch:",
        {
    relicId,
    trackTitle,
    expectedPi,
    paymentAmount
}
    );

    return res.status(400).json({
        error: "Payment amount mismatch"
    });
}

}
        const response = await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/approve`,
            {},
            {
                headers: {
                    Authorization: `Key ${process.env.PI_API_KEY}`
                }
            }
        );

        return res.status(200).json(response.data);

    } catch (error) {

        console.error(
            "Pi approve payment error:",
            error.response?.data || error.message
        );

        return res.status(
            error.response?.status || 500
        ).json({
            error: "Payment approval failed",
            details: error.response?.data || error.message
        });
    }
};