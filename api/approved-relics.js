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
        r.creator_pi_uid,
        r.artist,
        r.release_title,
        r.country,
        r.genre,
        r.release_year,
        r.description,

        COALESCE(
    NULLIF(ap.bio, ''),
    r.bio
) AS bio,

COALESCE(
  NULLIF(ap.public_email, ''),
  NULLIF(r.public_email, '')
) AS "publicEmail",

        r.cover,

        COALESCE(
    NULLIF(r.artist_image, ''),
    ap.artist_image
) AS artist_image,

COALESCE(
    NULLIF(r.banner, ''),
    ap.banner
) AS banner,

        r.price_pi,
        r.price_eur,
        r.supporters,

        
(
  COALESCE(ap.links, '{}'::jsonb) ||
  COALESCE(r.links, '{}'::jsonb)
) AS links,

        r.tracks,
        r.similar_artists,
        r.approved_at,
        r.status

    FROM relics r

    LEFT JOIN artist_profiles ap
  ON (
    (
      r.creator_pi_uid IS NOT NULL
      AND ap.creator_pi_uid = r.creator_pi_uid
    )
    OR (
      r.creator_pi_uid IS NULL
      AND r.contact_email IS NOT NULL
      AND LOWER(ap.creator_email) = LOWER(r.contact_email)
    )
  )

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

const signLinks = async (links) => {
    if (!links || typeof links !== "object") {
        return links;
    }

    const rawPhotos = links.photos || links.gallery || links.vault;
    if (!rawPhotos) {
        return links;
    }

    let photoList = [];
    if (Array.isArray(rawPhotos)) {
        photoList = rawPhotos;
    } else if (typeof rawPhotos === "string") {
        photoList = rawPhotos.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
    }

    const signedPhotos = await Promise.all(
        photoList.map(async (item) => {
            if (typeof item === "string") {
                if (item.startsWith("artist-images/")) {
                    return await signPublicImage(item);
                }
                return item;
            }
            if (item && typeof item === "object") {
                const url = String(item.url || item.src || item.image || "").trim();
                if (url.startsWith("artist-images/")) {
                    const signedUrl = await signPublicImage(url);
                    return {
                        ...item,
                        url: signedUrl
                    };
                }
            }
            return item;
        })
    );

    return {
        ...links,
        photos: signedPhotos
    };
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
                ),

                links:
                await signLinks(
                    relic.links
                )

        }))
    );

    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
     return res.status(200).json({
            success: true,
            relics: relicsWithSignedImages
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