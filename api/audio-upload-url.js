const {
    S3Client,
    PutObjectCommand
} = require("@aws-sdk/client-s3");

const {
    getSignedUrl
} = require("@aws-sdk/s3-request-presigner");

module.exports = async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const {
            fileName,
            contentType
        } = req.body || {};

        if (!fileName) {
            return res.status(400).json({
                error: "Missing file name"
            });
        }

        if (
            contentType !== "audio/mpeg"
        ) {
            return res.status(400).json({
                error: "Only MP3 files are allowed"
            });
        }

        const safeName =
            fileName.replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );

        const objectKey =
            `uploads/${Date.now()}-${safeName}`;

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
                    "audio/mpeg"
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