const { neon } = require("@neondatabase/serverless");

module.exports = async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const sql =
            neon(process.env.POSTGRES_URL);

        const relics = await sql`
    SELECT
        r.id,
        r.relic_id,
        r.artist,
        r.release_title,
        r.country,
        r.genre,
        r.release_year,
        r.description,

        COALESCE(ap.bio, r.bio) AS bio,

        r.cover,

        COALESCE(
            NULLIF(ap.artist_image, ''),
            r.artist_image
        ) AS artist_image,

        COALESCE(
            NULLIF(ap.banner, ''),
            r.banner
        ) AS banner,

        r.price_pi,
        r.price_eur,
        r.supporters,

        CASE
            WHEN ap.creator_pi_uid IS NOT NULL
            THEN ap.links
            ELSE r.links
        END AS links,

        r.tracks,
        r.similar_artists,
        r.approved_at,
        r.status

    FROM relics r

    LEFT JOIN artist_profiles ap
        ON ap.creator_pi_uid = r.creator_pi_uid

    WHERE r.status = 'approved'

    ORDER BY r.approved_at DESC;
`;

        return res.status(200).json({
            success: true,
            relics: relics
        });

    } catch (error) {

        console.error(
            "OSSVARIUM approved relics error:",
            error
        );

        return res.status(500).json({
            error: "Failed to load approved relics"
        });
    }
};