
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

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

        if (
            provided.length !== expected.length ||
            !crypto.timingSafeEqual(provided, expected)
        ) {
            return res.status(403).json({
                error: "Admin access required"
            });
        }

        const objectKey = String(req.query?.objectKey || "").trim();

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

    } catch (error) {
        console.error("OSSVARIUM admin audio preview error:", error);

        return res.status(500).json({
            error: "Failed to create audio preview"
        });
    }
};
