const crypto = require("crypto");

const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand
} = require("@aws-sdk/client-s3");

const {
    getSignedUrl
} = require("@aws-sdk/s3-request-presigner");

module.exports = async function handler(req, res) {

    if (req.method === "GET") {
    try {
        const objectKey =
            String(req.query?.objectKey || "").trim();

        if (
            !objectKey ||
            !objectKey.startsWith("artist-images/")
        ) {
            return res.status(400).json({
                error: "Invalid image object key"
            });
        }

        const s3 = new S3Client({
            endpoint:
                process.env.AWS_ENDPOINT_URL_S3,

            region:
                process.env.AWS_REGION,

            credentials: {
                accessKeyId:
                    process.env.AWS_ACCESS_KEY_ID,

                secretAccessKey:
                    process.env.AWS_SECRET_ACCESS_KEY
            },

            forcePathStyle: true
        });

        const command =
            new GetObjectCommand({
                Bucket:
                    "ossvarium-private-audio",

                Key:
                    objectKey
            });

        const imageUrl =
            await getSignedUrl(
                s3,
                command,
                {
                    expiresIn: 3600
                }
            );

        return res.status(200).json({
            success: true,
            imageUrl: imageUrl
        });

    } catch (error) {
        console.error(
            "OSSVARIUM image URL error:",
            error
        );

        return res.status(500).json({
            error:
                "Failed to create image URL"
        });
    }
}

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    // Creator authentication headers for MERCH
const creatorSessionHeader =
    req.headers["x-creator-session"] || "";

const authHeader =
    req.headers.authorization || "";

    // Verify email creator session for MERCH
if (
    req.body?.uploadPurpose === "merch" &&
    creatorSessionHeader &&
    !authHeader.startsWith("Bearer ")
) {
    try {
        const [payload, signature] =
            creatorSessionHeader.split(".");

        if (!payload || !signature) {
            throw new Error("Invalid session format");
        }

        const expectedSignature = crypto
            .createHmac(
                "sha256",
                process.env.CREATOR_SESSION_SECRET
            )
            .update(payload)
            .digest("base64url");

        const supplied = Buffer.from(signature);
        const expected = Buffer.from(expectedSignature);

        if (
            supplied.length !== expected.length ||
            !crypto.timingSafeEqual(supplied, expected)
        ) {
            throw new Error("Invalid session signature");
        }

        const session = JSON.parse(
            Buffer.from(payload, "base64url").toString("utf8")
        );

        if (
            !session.email ||
            !session.expiresAt ||
            Date.now() >= Number(session.expiresAt)
        ) {
            throw new Error("Session expired");
        }

    } catch (error) {
        return res.status(401).json({
            error: "Invalid or expired creator session"
        });
    }
}

// Verify Pi creator authentication for MERCH
if (
    req.body?.uploadPurpose === "merch" &&
    authHeader.startsWith("Bearer ")
) {
    try {
        const accessToken = authHeader.substring(7);

        const piResponse = await fetch(
            "https://api.minepi.com/v2/me",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        if (!piResponse.ok) {
            throw new Error("Pi authentication failed");
        }

        const piUser = await piResponse.json();

        if (!piUser.uid) {
            throw new Error("Missing Pi user ID");
        }

    } catch (error) {
        return res.status(401).json({
            error: "Invalid Pi authentication"
        });
    }
}

    // Require creator authentication for MERCH uploads
if (
    req.body?.uploadPurpose === "merch" &&
    !creatorSessionHeader &&
    !authHeader.startsWith("Bearer ")
) {
    return res.status(401).json({
        error: "Creator authentication required for merch uploads"
    });
}

    try {

        const {
            fileName,
            contentType,
            uploadPurpose,
            fileSize
        } = req.body || {};

        if (!fileName) {
            return res.status(400).json({
                error: "Missing file name"
            });
        }

        const allowedContentTypes = [
    "audio/mpeg",
    "image/jpeg",
    "image/png",
    "image/webp"
];

if (!allowedContentTypes.includes(contentType)) {
    return res.status(400).json({
        error: "Only MP3, JPEG, PNG and WEBP files are allowed"
    });
}

        const safeName =
            fileName.replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );

            // Validate merch image size
if (uploadPurpose === "merch") {
    const imageSize = Number(fileSize);

    if (
        !Number.isSafeInteger(imageSize) ||
        imageSize <= 0 ||
        imageSize > 10 * 1024 * 1024
    ) {
        return res.status(400).json({
            error: "Merch image must be 10 MB or smaller"
        });
    }
}

            // Validate upload purpose
if (
    uploadPurpose !== undefined &&
    uploadPurpose !== "merch"
) {
    return res.status(400).json({
        error: "Invalid upload purpose"
    });
}

            // Merch uploads must contain images only
if (
    uploadPurpose === "merch" &&
    contentType === "audio/mpeg"
) {
    return res.status(400).json({
        error: "Merch uploads must be images"
    });
}

        const uploadFolder =
    contentType === "audio/mpeg"
        ? "uploads"
        : uploadPurpose === "merch"
            ? "merch-images"
            : "artist-images";

        const objectKey =
            `${uploadFolder}/${Date.now()}-${safeName}`;

        const s3 = new S3Client({
            endpoint:
                process.env.AWS_ENDPOINT_URL_S3,

            region:
                process.env.AWS_REGION,

            credentials: {
                accessKeyId:
                    process.env.AWS_ACCESS_KEY_ID,

                secretAccessKey:
                    process.env.AWS_SECRET_ACCESS_KEY
            },

            forcePathStyle: true
        });

        const command =
    new PutObjectCommand({
        Bucket:
            "ossvarium-private-audio",

        Key:
            objectKey,

        ContentType:
            contentType,

        ...(uploadPurpose === "merch"
            ? { ContentLength: Number(fileSize) }
            : {})
    });

        const uploadUrl =
            await getSignedUrl(
                s3,
                command,
                {
                    expiresIn: 300
                }
            );

        return res.status(200).json({
            success: true,
            uploadUrl: uploadUrl,
            objectKey: objectKey
        });

    } catch (error) {

        console.error(
            "OSSVARIUM audio upload URL error:",
            error
        );

        return res.status(500).json({
            error:
                "Failed to create audio upload URL"
        });
    }
};