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

        if (!adminToken) {
            return res.status(200).json({
                admin: false,
                pending: 0
            });
        }

        const expectedToken =
            crypto
                .createHmac(
                    "sha256",
                    process.env.ADMIN_PASSWORD
                )
                .update("ossvarium-admin")
                .digest("hex");

        if (adminToken !== expectedToken) {
            return res.status(200).json({
                admin: false,
                pending: 0
            });
        }

        const sql =
            neon(process.env.POSTGRES_URL);

        const result = await sql`
            SELECT COUNT(*)::int AS count
            FROM relics
            WHERE status = 'pending';
        `;

        return res.status(200).json({
            admin: true,
            pending: result[0].count
        });

    } catch (error) {

        console.error(
            "OSSVARIUM admin status error:",
            error
        );

        return res.status(500).json({
            error: "Failed to check admin status"
        });
    }
};