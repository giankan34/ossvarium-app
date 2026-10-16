
const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        // ADMIN AUTH
        const cookieHeader = req.headers.cookie || "";

        const cookies = Object.fromEntries(
            cookieHeader
                .split(";")
                .map(cookie => cookie.trim())
                .filter(Boolean)
                .map(cookie => {
                    const index = cookie.indexOf("=");
                    return [
                        cookie.slice(0, index),
                        cookie.slice(index + 1)
                    ];
                })
        );

        const adminToken = cookies.ossvarium_admin;

        const expectedToken = crypto
            .createHmac(
                "sha256",
                process.env.ADMIN_SESSION_SECRET
            )
            .update("ossvarium-admin")
            .digest("hex");

        const provided = Buffer.from(adminToken || "", "utf8");
        const expected = Buffer.from(expectedToken, "utf8");

        if (
            provided.length !== expected.length ||
            !crypto.timingSafeEqual(provided, expected)
        ) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }

        const { id, action } = req.body || {};

        if (!id) {
            return res.status(400).json({
                error: "Missing relic id"
            });
        }

        if (action !== "approve" && action !== "reject") {
            return res.status(400).json({
                error: "Invalid review action"
            });
        }

        const sql = neon(process.env.POSTGRES_URL);

        if (action === "approve") {
            const publicIdResult = await sql`
                SELECT nextval('relic_public_id_seq') AS public_id;
            `;

            const publicId = Number(publicIdResult[0].public_id);

            const relicId =
                `OSV-${String(publicId).padStart(5, "0")}`;

            const updated = await sql`
                UPDATE relics
                SET
                    relic_id = ${relicId},
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
        }

        // REJECT
        const updated = await sql`
            UPDATE relics
            SET
                status = 'rejected',
                rejected_at = NOW(),
                approved_at = NULL,
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
        console.error("OSSVARIUM review relic error:", error);

        return res.status(500).json({
            error: "Failed to review relic"
        });
    }
};
