const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");

module.exports = async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const cookieHeader =
            req.headers.cookie || "";

        const cookies =
            Object.fromEntries(
                cookieHeader
                    .split(";")
                    .map(cookie => cookie.trim())
                    .filter(Boolean)
                    .map(cookie => {
                        const index =
                            cookie.indexOf("=");

                        return [
                            cookie.slice(0, index),
                            cookie.slice(index + 1)
                        ];
                    })
            );

        const adminToken =
            cookies.ossvarium_admin;

        const expectedToken =
            crypto
                .createHmac(
                    "sha256",
                    process.env.ADMIN_SESSION_SECRET
                )
                .update("ossvarium-admin")
                .digest("hex");

        if (
            !adminToken ||
            adminToken !== expectedToken
        ) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }

        const sql =
            neon(process.env.POSTGRES_URL);

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