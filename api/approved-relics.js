const { neon } = require("@neondatabase/serverless");

const {
    S3Client,
    GetObjectCommand
} = require("@aws-sdk/client-s3");

const {
    getSignedUrl
} = require("@aws-sdk/s3-request-presigner");

function sanitizeText(str, maxLength = 500) {
    if (typeof str !== "string") return "";
    return str
        .replace(/<[^>]*>/g, "")
        .trim()
        .slice(0, maxLength);
}

module.exports = async function handler(req, res) {

    if (req.method !== "GET" && req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    // ==========================================
    // ☠ RITUAL REVIEWS & ARTIST GUESTBOOK ACTION
    // ==========================================
    const isReviewAction =
        req.query?.action === "reviews" ||
        req.body?.action === "inscribe_review";

    if (isReviewAction) {
        if (req.method === "GET") {
            res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");

            try {
                const sql = neon(process.env.POSTGRES_URL);
                const { relic_id, artist, type } = req.query;

                let reviews = [];

                if (relic_id) {
                    reviews = await sql`
                        SELECT
                            id,
                            target_type,
                            relic_id,
                            artist_name,
                            pi_username,
                            rating,
                            comment,
                            is_verified_keeper,
                            created_at
                        FROM ritual_reviews
                        WHERE relic_id = ${String(relic_id).trim()}
                          AND target_type = 'relic'
                        ORDER BY created_at DESC
                        LIMIT 50;
                    `;
                } else if (artist) {
                    const cleanArtist = String(artist).trim().toLowerCase();
                    if (type === "artist") {
                        reviews = await sql`
                            SELECT
                                id,
                                target_type,
                                relic_id,
                                artist_name,
                                pi_username,
                                rating,
                                comment,
                                is_verified_keeper,
                                created_at
                            FROM ritual_reviews
                            WHERE LOWER(TRIM(artist_name)) = ${cleanArtist}
                              AND target_type = 'artist'
                            ORDER BY created_at DESC
                            LIMIT 50;
                        `;
                    } else {
                        reviews = await sql`
                            SELECT
                                id,
                                target_type,
                                relic_id,
                                artist_name,
                                pi_username,
                                rating,
                                comment,
                                is_verified_keeper,
                                created_at
                            FROM ritual_reviews
                            WHERE LOWER(TRIM(artist_name)) = ${cleanArtist}
                            ORDER BY created_at DESC
                            LIMIT 50;
                        `;
                    }
                } else {
                    return res.status(400).json({ error: "relic_id or artist parameter required" });
                }

                return res.status(200).json({
                    success: true,
                    reviews: reviews || []
                });
            } catch (error) {
                console.error("GET /api/approved-relics?action=reviews error:", error);
                return res.status(500).json({ error: "Failed to load ritual chronicles" });
            }
        }

        if (req.method === "POST") {
            res.setHeader("Cache-Control", "no-store");

            try {
                const sql = neon(process.env.POSTGRES_URL);
                const body = req.body || {};

                const target_type = body.target_type === "artist" ? "artist" : "relic";
                const relic_id = body.relic_id ? sanitizeText(String(body.relic_id), 100) : null;
                const artist_name = sanitizeText(String(body.artist_name || ""), 150);
                const pi_uid = sanitizeText(String(body.pi_uid || ""), 100);
                const pi_username = sanitizeText(String(body.pi_username || "").replace(/^@/, ""), 100);
                const comment = sanitizeText(String(body.comment || ""), 500);

                let rating = null;
                if (body.rating !== undefined && body.rating !== null && body.rating !== "") {
                    const parsed = parseInt(body.rating, 10);
                    if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
                        rating = parsed;
                    }
                }

                if (!artist_name) {
                    return res.status(400).json({ error: "Artist name is required" });
                }

                if (!pi_uid || !pi_username) {
                    return res.status(401).json({ error: "Pi authentication is required to inscribe a review" });
                }

                if (comment.length < 3) {
                    return res.status(400).json({ error: "Testimony must be at least 3 characters long" });
                }

                if (target_type === "relic" && !relic_id) {
                    return res.status(400).json({ error: "Relic ID is required for release reviews" });
                }

                if (target_type === "relic" && !rating) {
                    rating = 5;
                }

                const recent = await sql`
                    SELECT id FROM ritual_reviews
                    WHERE pi_uid = ${pi_uid}
                      AND created_at > NOW() - INTERVAL '10 seconds'
                    LIMIT 1;
                `;

                if (recent.length > 0) {
                    return res.status(429).json({ error: "Please wait a few seconds before inscribing another testimony." });
                }

                let isVerifiedKeeper = false;
                if (target_type === "relic" && relic_id) {
                    try {
                        const purchases = await sql`
                            SELECT 1 FROM purchases
                            WHERE user_uid = ${pi_uid}
                              AND relic_id = ${relic_id}
                            LIMIT 1;
                        `;
                        if (purchases.length > 0) {
                            isVerifiedKeeper = true;
                        }
                    } catch (checkErr) {
                        console.warn("Verified keeper check warning:", checkErr);
                    }
                }

                const inserted = await sql`
                    INSERT INTO ritual_reviews (
                        target_type,
                        relic_id,
                        artist_name,
                        pi_uid,
                        pi_username,
                        rating,
                        comment,
                        is_verified_keeper
                    ) VALUES (
                        ${target_type},
                        ${relic_id},
                        ${artist_name},
                        ${pi_uid},
                        ${pi_username},
                        ${rating},
                        ${comment},
                        ${isVerifiedKeeper}
                    )
                    RETURNING
                        id,
                        target_type,
                        relic_id,
                        artist_name,
                        pi_username,
                        rating,
                        comment,
                        is_verified_keeper,
                        created_at;
                `;

                return res.status(200).json({
                    success: true,
                    review: inserted[0]
                });
            } catch (error) {
                console.error("POST inscribe_review error:", error);
                return res.status(500).json({ error: "Failed to inscribe testimony" });
            }
        }
    }

    // ==========================================
    // ☠ PUBLIC APPROVED RELICS CATALOG
    // ==========================================
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
