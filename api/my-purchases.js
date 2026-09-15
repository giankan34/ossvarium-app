const axios = require("axios");

const {
    neon
} = require(
    "@neondatabase/serverless"
);

module.exports = async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const authHeader =
    req.headers.authorization;

if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
) {
    return res.status(401).json({
        error: "Missing Pi access token"
    });
}

const accessToken =
    authHeader.substring(7);

    try {

        const meResponse = await axios.get(
    "https://api.minepi.com/v2/me",
    {
        headers: {
            Authorization:
                `Bearer ${accessToken}`
        }
    }
);

const userUid =
    meResponse.data?.uid;

if (!userUid) {
    return res.status(401).json({
        error: "Invalid Pi user"
    });
}

        const sql =
            neon(process.env.POSTGRES_URL);

        const purchases = await sql`
            SELECT
                relic_id,
                track_title,
                amount_pi,
                created_at
            FROM purchases
            WHERE user_uid = ${userUid}
            ORDER BY created_at DESC;
        `;

        return res.status(200).json({
            success: true,
            purchases: purchases
        });

    } catch (error) {

        console.error(
            "OSSVARIUM my purchases error:",
            error
        );

        return res.status(500).json({
            error: "Failed to load purchases"
        });
    }
};