const { neon } = require("@neondatabase/serverless");

const {
    S3Client,
    GetObjectCommand
} = require("@aws-sdk/client-s3");

const {
    getSignedUrl
} = require("@aws-sdk/s3-request-presigner");

module.exports = async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const sql =
            neon(process.env.POSTGRES_URL);

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

        const relics = await sql`
    SELECT
        r.id,
        r.relic_id,
        r.artist,
        r.release_title,
        r.country,
        r.genre,
        r.release_year,
        r.description,

        COALESCE(ap.bio, r.bio) AS bio,

        r.cover,

        COALESCE(
            NULLIF(ap.artist_image, ''),
            r.artist_image
        ) AS artist_image,

        COALESCE(
            NULLIF(ap.banner, ''),
            r.banner
        ) AS banner,

        r.price_pi,
        r.price_eur,
        r.supporters,

        CASE
            WHEN ap.creator_pi_uid IS NOT NULL
            THEN ap.links
            ELSE r.links
        END AS links,

        r.tracks,
        r.similar_artists,
        r.approved_at,
        r.status

    FROM relics r

    LEFT JOIN artist_profiles ap
        ON ap.creator_pi_uid = r.creator_pi_uid

    WHERE r.status = 'approved'

    ORDER BY r.approved_at DESC;
`;

const signPublicImage = async (objectKey) => {
    if (
        !objectKey ||
        !objectKey.startsWith("artist-images/")
    ) {
        return objectKey;
    }

    const command = new GetObjectCommand({
        Bucket: "ossvarium-private-audio",
        Key: objectKey
    });

    return await getSignedUrl(
        s3,
        command,
        {
            expiresIn: 3600
        }
    );
};

const relicsWithSignedImages =
    await Promise.all(
        relics.map(async (relic) => ({
            ...relic,

            cover:
                await signPublicImage(
                    relic.cover
                ),

            artist_image:
                await signPublicImage(
                    relic.artist_image
                ),

            banner:
                await signPublicImage(
                    relic.banner
                )
        }))
    );

        return res.status(200).json({
            success: true,
            relics: relics
        });

    } catch (error) {

        console.error(
            "OSSVARIUM approved relics error:",
            error
        );

        return res.status(500).json({
            error: "Failed to load approved relics"
        });
    }
};