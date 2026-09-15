const {
    S3Client,
    PutObjectCommand
} = require("@aws-sdk/client-s3");

module.exports = async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

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

        await s3.send(
            new PutObjectCommand({
                Bucket:
                    "ossvarium-private-audio",

                Key:
                    "tests/ossvarium-awakened.txt",

                Body:
                    "OSSVARIUM PRIVATE STORAGE ONLINE"
            })
        );

        return res.status(200).json({
            success: true,
            message:
                "Private storage connected"
        });

    } catch (error) {

        console.error(
            "OSSVARIUM storage test error:",
            error
        );

        return res.status(500).json({
            error:
                "Private storage connection failed"
        });
    }
};