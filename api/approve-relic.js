const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");

module.exports = async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        // ----- ADMIN AUTH -----

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

        // ----- RELIC ID -----

        const { id } = req.body || {};

        if (!id) {
            return res.status(400).json({
                error: "Missing relic id"
            });
        }

        const sql =
            neon(process.env.POSTGRES_URL);

        // ----- APPROVE -----

        const updated = await sql`
            UPDATE relics
            SET
                status = 'approved',
                approved_at = NOW(),
                rejected_at = NULL,
                updated_at = NOW()
            WHERE
                id = ${id}
                AND status = 'pending'
            RETURNING *;
        `;

        if (updated.length === 0) {
            return res.status(404).json({
                error: "Pending relic not found"
            });
        }

        return res.status(200).json({
            success: true,
            relic: updated[0]
        });

    } catch (error) {

        console.error(
            "OSSVARIUM approve relic error:",
            error
        );

        return res.status(500).json({
            error: "Failed to approve relic"
        });
    }
};