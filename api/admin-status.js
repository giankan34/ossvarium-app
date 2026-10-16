
const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
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

        const isAdmin =
            provided.length === expected.length &&
            crypto.timingSafeEqual(provided, expected);

        // Admin-only audio preview
        const requestUrl = new URL(
    req.url,
    "https://www.ossvarium.com"
);

const action =
    req.query?.action ||
    requestUrl.searchParams.get("action");

if (action === "audio-preview") {
            if (!isAdmin) {
                return res.status(403).json({
                    error: "Admin access required"
                });
            }

            const objectKey = String(
    requestUrl.searchParams.get("objectKey") || ""
).trim();

            if (
                !objectKey.startsWith("uploads/") ||
                objectKey.includes("..") ||
                !objectKey.toLowerCase().endsWith(".mp3")
            ) {
                return res.status(400).json({
                    error: "Invalid audio object key"
                });
            }

            const s3 = new S3Client({
                endpoint: process.env.AWS_ENDPOINT_URL_S3,
                region: process.env.AWS_REGION,
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                },
                forcePathStyle: true
            });

            const command = new GetObjectCommand({
                Bucket: "ossvarium-private-audio",
                Key: objectKey
            });

            const audioUrl = await getSignedUrl(s3, command, {
                expiresIn: 300
            });

            return res.status(200).json({
                success: true,
                audioUrl
            });
        }

        // Original admin status functionality
        if (!isAdmin) {
            return res.status(200).json({
                admin: false,
                pending: 0
            });
        }

        const sql = neon(process.env.POSTGRES_URL);

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
        console.error("OSSVARIUM admin status error:", error);

        return res.status(500).json({
            error: "Failed to process admin request"
        });
    }
};
