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

const relicId =
    metadata.relicId;

const trackTitle =
    metadata.trackTitle;

if (
    metadata.purpose !== "track_purchase" ||
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

if (
    !track ||
    track.forSale !== true ||
    !track.priceEur ||
    Number(track.priceEur) <= 0
) {
    return res.status(400).json({
        error: "Invalid track purchase"
    });
}

const priceEur =
    Number(track.priceEur);

    const rateResponse = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price",
    {
        params: {
            ids: "pi-network",
            vs_currencies: "eur"
        },
        timeout: 5000
    }
);

const piEur =
    Number(
        rateResponse.data?.["pi-network"]?.eur
    );

if (
    !piEur ||
    piEur <= 0
) {
    return res.status(503).json({
        error: "Pi exchange rate unavailable"
    });
}

const expectedPi =
    priceEur / piEur;

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
            priceEur,
            piEur,
            expectedPi,
            paymentAmount
        }
    );

    return res.status(400).json({
        error: "Payment amount mismatch"
    });
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