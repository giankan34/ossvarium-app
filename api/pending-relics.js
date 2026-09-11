const { neon } = require("@neondatabase/serverless");

module.exports = async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const sql = neon(process.env.POSTGRES_URL);

        const relics = await sql`
            SELECT
                id,
                relic_id,
                artist,
                release_title,
                country,
                genre,
                release_year,
                description,
                bio,
                cover,
                artist_image,
                banner,
                price_pi,
                supporters,
                contact_email,
                links,
                tracks,
                submitted_at,
                status
            FROM relics
            WHERE status = 'pending'
            ORDER BY submitted_at DESC;
        `;

        return res.status(200).json({
            success: true,
            relics: relics
        });

    } catch (error) {

        console.error(
            "OSSVARIUM pending relics error:",
            error
        );

        return res.status(500).json({
            error: "Failed to load pending relics"
        });
    }
};