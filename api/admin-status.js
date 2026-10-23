
const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");
const {
    S3Client,
    GetObjectCommand,
    HeadObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

module.exports = async function handler(req, res) {
    if (req.method !== "GET" && req.method !== "POST") {
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

    if (req.method === "GET" && action === "merch-preview") {
    if (!isAdmin) {
        return res.status(403).json({
            error: "Admin access required"
        });
    }

    const objectKey = String(
        requestUrl.searchParams.get("objectKey") || ""
    ).trim();

    if (!/^merch-images\/[a-zA-Z0-9._-]+$/.test(objectKey)) {
        return res.status(400).json({
            error: "Invalid merch image key"
        });
    }

    const sql = neon(process.env.POSTGRES_URL);

    const matching = await sql`
        SELECT id
        FROM merch_products
        WHERE status = 'pending'
          AND photos @> ${JSON.stringify([objectKey])}::jsonb
        LIMIT 1
    `;

    if (matching.length === 0) {
        return res.status(404).json({
            error: "Pending merch image not found"
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

    const imageUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
            Bucket: "ossvarium-private-audio",
            Key: objectKey
        }),
        { expiresIn: 300 }
    );

    return res.status(200).json({
        success: true,
        imageUrl
    });
}

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

        if (req.method === "GET" && action === "pending-merch") {
    if (!isAdmin) {
        return res.status(403).json({
            error: "Admin access required"
        });
    }

    const sql = neon(process.env.POSTGRES_URL);

    const products = await sql`
        SELECT *
        FROM merch_products
        WHERE status = 'pending'
        ORDER BY created_at DESC;
    `;

    return res.status(200).json({
        success: true,
        products
    });
}


if (req.method === "POST") {
    if (!isAdmin) {
        return res.status(403).json({
            error: "Admin access required"
        });
    }

    const { id, action: reviewAction } = req.body || {};
    const productId = Number(id);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
        return res.status(400).json({
            error: "Invalid merch ID"
        });
    }

    if (reviewAction !== "approve" && reviewAction !== "reject") {
        return res.status(400).json({
            error: "Invalid review action"
        });
    }

    const sql = neon(process.env.POSTGRES_URL);

    if (reviewAction === "approve") {
    const products = await sql`
        SELECT photos
        FROM merch_products
        WHERE id = ${productId}
          AND status = 'pending'
    `;

    if (products.length === 0) {
        return res.status(404).json({
            error: "Pending merch not found"
        });
    }

    const photos = products[0].photos;

    if (!Array.isArray(photos) || photos.length === 0) {
        return res.status(400).json({
            error: "Merch product has no photos"
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

    for (const photoKey of photos) {
        if (
            typeof photoKey !== "string" ||
            !/^merch-images\/[a-zA-Z0-9._-]+$/.test(photoKey)
        ) {
            return res.status(400).json({
                error: "Invalid merch photo reference"
            });
        }

        try {
            const photoInfo = await s3.send(
                new HeadObjectCommand({
                    Bucket: "ossvarium-private-audio",
                    Key: photoKey
                })
            );

            if (
                !["image/jpeg", "image/png", "image/webp"].includes(photoInfo.ContentType) ||
                !Number.isSafeInteger(photoInfo.ContentLength) ||
                photoInfo.ContentLength <= 0 ||
                photoInfo.ContentLength > 10 * 1024 * 1024
            ) {
                return res.status(400).json({
                    error: "Invalid merch photo type or size"
                });
            }
        } catch (error) {
            console.error("Merch approval photo check:", error);

            return res.status(400).json({
                error: "Merch photo unavailable"
            });
        }
    }
}

    const updated = await sql`
        UPDATE merch_products
        SET
            status = ${reviewAction === "approve" ? "approved" : "rejected"},
            updated_at = NOW()
        WHERE id = ${productId}
          AND status = 'pending'
        RETURNING id, product_name, status;
    `;

    if (updated.length === 0) {
        return res.status(404).json({
            error: "Pending merch not found"
        });
    }

    return res.status(200).json({
        success: true,
        product: updated[0]
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

        const merchResult = await sql`
    SELECT COUNT(*)::int AS count
    FROM merch_products
    WHERE status = 'pending';
`;

        return res.status(200).json({
    admin: true,
    pending: result[0].count,
    pendingMerch: merchResult[0].count
});

    } catch (error) {
        console.error("OSSVARIUM admin status error:", error);

        return res.status(500).json({
            error: "Failed to process admin request"
        });
    }
};
