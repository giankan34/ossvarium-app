const axios = require("axios");

const crypto = require("crypto");

const {
    neon
} = require(
    "@neondatabase/serverless"
);

const {
    S3Client,
    GetObjectCommand
} = require(
    "@aws-sdk/client-s3"
);

const {
    getSignedUrl
} = require(
    "@aws-sdk/s3-request-presigner"
);

function createDownloadTicket(payload) {

    const data =
        Buffer.from(
            JSON.stringify(payload)
        ).toString("base64url");

    const signature =
        crypto
            .createHmac(
                "sha256",
                process.env.ADMIN_SESSION_SECRET
            )
            .update(data)
            .digest("base64url");

    return `${data}.${signature}`;
}


function verifyDownloadTicket(ticket) {

    if (!ticket) {
        return null;
    }

    const parts =
        ticket.split(".");

    if (parts.length !== 2) {
        return null;
    }

    const [data, signature] =
        parts;

    const expectedSignature =
        crypto
            .createHmac(
                "sha256",
                process.env.ADMIN_SESSION_SECRET
            )
            .update(data)
            .digest("base64url");

    const signatureBuffer =
        Buffer.from(signature);

    const expectedBuffer =
        Buffer.from(expectedSignature);

    if (
        signatureBuffer.length !==
        expectedBuffer.length
    ) {
        return null;
    }

    if (
        !crypto.timingSafeEqual(
            signatureBuffer,
            expectedBuffer
        )
    ) {
        return null;
    }

    try {

        const payload =
            JSON.parse(
                Buffer.from(
                    data,
                    "base64url"
                ).toString("utf8")
            );

        if (
            !payload.exp ||
            Date.now() > payload.exp
        ) {
            return null;
        }

        return payload;

    } catch {
        return null;
    }
}

module.exports = async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

   // ---------------------------------
// CREATE SECURE DOWNLOAD TICKET
// ---------------------------------

if (mode === "download") {

    const ticket =
        createDownloadTicket({
            relicId,
            trackTitle,
            audioKey: track.audio,
            allowDownload: true,
            exp:
                Date.now() +
                (2 * 60 * 1000)
        });

    const downloadUrl =
        `/api/my-purchases?ticket=${encodeURIComponent(
            ticket
        )}`;

    return res.status(200).json({
        success: true,
        downloadUrl
    });
}

    const authHeader =
        req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {
        return res.status(401).json({
            error: "Missing Pi access token"
        });
    }

    const accessToken =
        authHeader.substring(7);

    try {

        // ---------------------------------
        // VERIFY PI USER
        // ---------------------------------

        const meResponse =
            await axios.get(
                "https://api.minepi.com/v2/me",
                {
                    headers: {
                        Authorization:
                            `Bearer ${accessToken}`
                    }
                }
            );

        const userUid =
            meResponse.data?.uid;

        if (!userUid) {
            return res.status(401).json({
                error: "Invalid Pi user"
            });
        }

        const sql =
            neon(process.env.POSTGRES_URL);

        const relicId =
            req.query.relicId;

        const trackTitle =
            req.query.trackTitle;

        const mode =
            req.query.mode || "stream";

        // ---------------------------------
        // NORMAL MODE:
        // RETURN USER PURCHASES
        // ---------------------------------

        if (!relicId || !trackTitle) {

            const purchases = await sql`
                SELECT
                    relic_id,
                    track_title,
                    amount_pi,
                    created_at
                FROM purchases
                WHERE user_uid = ${userUid}
                ORDER BY created_at DESC;
            `;

            return res.status(200).json({
                success: true,
                purchases: purchases
            });
        }

        // ---------------------------------
        // PROTECTED AUDIO MODE
        // ---------------------------------

        const ownership = await sql`
            SELECT 1
            FROM purchases
            WHERE user_uid = ${userUid}
              AND relic_id = ${relicId}
              AND track_title = ${trackTitle}
            LIMIT 1;
        `;

        if (ownership.length === 0) {
            return res.status(403).json({
                error: "Track not owned"
            });
        }

        // ---------------------------------
        // LOAD RELIC
        // ---------------------------------

        const relicRows = await sql`
            SELECT tracks
            FROM relics
            WHERE relic_id = ${relicId}
              AND status = 'approved'
            LIMIT 1;
        `;

        if (relicRows.length === 0) {
            return res.status(404).json({
                error: "Relic not found"
            });
        }

        const tracks =
            relicRows[0].tracks;

        const track =
            Array.isArray(tracks)
                ? tracks.find(
                    item =>
                        item.title === trackTitle
                )
                : null;

        if (
            !track ||
            !track.audio
        ) {
            return res.status(404).json({
                error: "Private audio not found"
            });
        }

        if (
    mode === "download" &&
    track.allowDownload !== true
) {
    return res.status(403).json({
        error: "Download not allowed"
    });
}

        // ---------------------------------
        // SAFETY:
        // ONLY PRIVATE UPLOAD PATHS
        // ---------------------------------

        if (
            !track.audio.startsWith(
                "uploads/"
            )
        ) {
            return res.status(400).json({
                error: "Invalid private audio path"
            });
        }

        // ---------------------------------
        // CREATE TEMPORARY AUDIO URL
        // ---------------------------------

        const s3 =
            new S3Client({

                endpoint:
                    process.env
                        .AWS_ENDPOINT_URL_S3,

                region:
                    process.env
                        .AWS_REGION,

                credentials: {

                    accessKeyId:
                        process.env
                            .AWS_ACCESS_KEY_ID,

                    secretAccessKey:
                        process.env
                            .AWS_SECRET_ACCESS_KEY
                },

                forcePathStyle: true
            });


// ---------------------------------
// DIRECT DOWNLOAD MODE
// ---------------------------------

if (mode === "download") {

    const command =
        new GetObjectCommand({

            Bucket:
                "ossvarium-private-audio",

            Key:
                track.audio
        });

    const object =
        await s3.send(
            command
        );

    const chunks = [];

    for await (
        const chunk of object.Body
    ) {
        chunks.push(chunk);
    }

    const audioBuffer =
        Buffer.concat(chunks);

    res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
    );

    res.setHeader(
        "Pragma",
        "no-cache"
    );

    res.setHeader(
        "Expires",
        "0"
    );

    res.removeHeader(
        "ETag"
    );

    res.setHeader(
        "Content-Type",
        "application/octet-stream"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${downloadFileName}"`
    );

    res.setHeader(
        "Content-Length",
        audioBuffer.length
    );

    return res.status(200).send(
        audioBuffer
    );
}


// ---------------------------------
// NORMAL PROTECTED STREAM MODE
// ---------------------------------

const command =
    new GetObjectCommand({

        Bucket:
            "ossvarium-private-audio",

        Key:
            track.audio
    });

const audioUrl =
    await getSignedUrl(
        s3,
        command,
        {
            expiresIn: 300
        }
    );

return res.status(200).json({
    success: true,
    owned: true,
    audioUrl: audioUrl,
    expiresIn: 300
});            
       
    } catch (error) {

        console.error(
            "OSSVARIUM my purchases error:",
            error
        );

        if (
            error.response?.status === 401
        ) {
            return res.status(401).json({
                error:
                    "Invalid Pi authentication"
            });
        }

        return res.status(500).json({
            error:
                "Failed to load protected content"
        });
    }
};