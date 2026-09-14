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

    const userUid =
        req.query.userUid;

    if (!userUid) {
        return res.status(400).json({
            error: "Missing userUid"
        });
    }

    try {

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