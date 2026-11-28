
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

                if (req.method === "GET" && action === "sales-overview") {
            if (!isAdmin) {
                return res.status(403).json({ error: "Admin access required" });
            }

            const sql = neon(process.env.POSTGRES_URL);

            try {
                await sql`
                    CREATE TABLE IF NOT EXISTS pioneer_logins (
                        id SERIAL PRIMARY KEY,
                        pi_uid TEXT UNIQUE NOT NULL,
                        username TEXT,
                        last_seen_at TIMESTAMPTZ DEFAULT NOW(),
                        login_count INTEGER DEFAULT 1
                    );
                `;
            } catch (tableErr) {
                console.warn("Table pioneer_logins check:", tableErr.message);
            }

                        try {
                await sql`
                    CREATE TABLE IF NOT EXISTS artist_payouts (
                        id SERIAL PRIMARY KEY,
                        artist TEXT NOT NULL,
                        relic_id TEXT,
                        creator_pi_uid TEXT,
                        amount_pi NUMERIC(14, 4) NOT NULL DEFAULT 0,
                        amount_eur NUMERIC(14, 2) DEFAULT 0,
                        payout_method TEXT DEFAULT 'pi',
                        txid TEXT,
                        notes TEXT,
                        admin_recorded_by TEXT DEFAULT 'admin',
                        created_at TIMESTAMPTZ DEFAULT NOW()
                    );
                `;
            } catch (payoutTableErr) {
                console.warn("Table artist_payouts check:", payoutTableErr.message);
            }


            const purchasesTotals = await sql`
                SELECT
                    COALESCE(SUM(amount_pi), 0)::float AS total_sales_pi,
                    COALESCE(SUM(artist_share_pi), 0)::float AS total_artist_share_pi,
                    COALESCE(SUM(ossvarium_fee_pi), 0)::float AS total_fee_pi,
                    COUNT(*)::int AS count_purchases,
                    COUNT(*) FILTER (WHERE track_title = '__FULL_RELEASE__')::int AS count_full_releases,
                    COUNT(*) FILTER (WHERE track_title != '__FULL_RELEASE__')::int AS count_tracks
                FROM purchases;
            `;

            const supportTotals = await sql`
                SELECT
                    COALESCE(SUM(amount_pi), 0)::float AS total_support_pi,
                    COALESCE(SUM(artist_share_pi), 0)::float AS total_artist_share_pi,
                    COALESCE(SUM(ossvarium_fee_pi), 0)::float AS total_fee_pi,
                    COUNT(*)::int AS count_supports
                FROM artist_supports
                WHERE status = 'completed';
            `;

            let merchTotals = [{ total_merch_pi: 0, count_merch_orders: 0 }];
            try {
                merchTotals = await sql`
                    SELECT
                        COALESCE(SUM(total_price_pi), 0)::float AS total_merch_pi,
                        COUNT(*)::int AS count_merch_orders
                    FROM merch_orders
                    WHERE status = 'paid';
                `;
            } catch (merchErr) {
                console.warn("Merch totals query:", merchErr.message);
            }

            const relicPurchases = await sql`
                SELECT
                    r.relic_id,
                    r.artist,
                    r.release_title,
                    r.creator_pi_uid,
                    r.contact_email,
                    COALESCE(SUM(p.amount_pi), 0)::float AS purchases_gross_pi,
                    COALESCE(SUM(p.artist_share_pi), 0)::float AS purchases_artist_pi,
                    COALESCE(SUM(p.ossvarium_fee_pi), 0)::float AS purchases_fee_pi,
                    COUNT(p.id)::int AS purchases_count
                FROM relics r
                LEFT JOIN purchases p ON p.relic_id = r.relic_id
                GROUP BY r.relic_id, r.artist, r.release_title, r.creator_pi_uid, r.contact_email
                ORDER BY purchases_gross_pi DESC, r.artist ASC;
            `;

            let relicSupports = [];
            try {
                relicSupports = await sql`
                    SELECT
                        relic_id,
                        COALESCE(SUM(amount_pi), 0)::float AS support_gross_pi,
                        COALESCE(SUM(artist_share_pi), 0)::float AS support_artist_pi,
                        COALESCE(SUM(ossvarium_fee_pi), 0)::float AS support_fee_pi,
                        COUNT(id)::int AS support_count
                    FROM artist_supports
                    WHERE status = 'completed'
                    GROUP BY relic_id;
                `;
            } catch (supErr) {
                console.warn("Relic supports query error:", supErr.message);
            }

            const supportMap = new Map();
            relicSupports.forEach(s => supportMap.set(s.relic_id, s));

            const artistBreakdown = relicPurchases.map(r => {
                const s = supportMap.get(r.relic_id) || {
                    support_gross_pi: 0, support_artist_pi: 0, support_fee_pi: 0, support_count: 0
                };
                return {
                    relicId: r.relic_id,
                    artist: r.artist,
                    releaseTitle: r.release_title,
                    creatorPiUid: r.creator_pi_uid || null,
                    contactEmail: r.contact_email || null,
                    grossPi: Number(((r.purchases_gross_pi || 0) + (s.support_gross_pi || 0)).toFixed(4)),
                    artistSharePi: Number(((r.purchases_artist_pi || 0) + (s.support_artist_pi || 0)).toFixed(4)),
                    ossvariumFeePi: Number(((r.purchases_fee_pi || 0) + (s.support_fee_pi || 0)).toFixed(4)),
                    purchasesCount: r.purchases_count || 0,
                    supportsCount: s.support_count || 0
                };
            });

            let recentTransactions = [];
            try {
                recentTransactions = await sql`
                    (
                        SELECT
                            'purchase' AS type,
                            p.id::text AS id,
                            p.relic_id,
                            r.artist,
                            r.release_title,
                            p.track_title,
                            p.user_uid AS buyer_uid,
                            p.amount_pi::float AS amount_pi,
                            p.artist_share_pi::float AS artist_share_pi,
                            p.ossvarium_fee_pi::float AS ossvarium_fee_pi,
                            p.txid,
                            p.created_at
                        FROM purchases p
                        LEFT JOIN relics r ON r.relic_id = p.relic_id
                    )
                    UNION ALL
                    (
                        SELECT
                            'support' AS type,
                            s.id::text AS id,
                            s.relic_id,
                            r.artist,
                            r.release_title,
                            COALESCE(NULLIF(s.track_title, ''), 'DIRECT SUPPORT') AS track_title,
                            s.supporter_pi_uid AS buyer_uid,
                            s.amount_pi::float AS amount_pi,
                            s.artist_share_pi::float AS artist_share_pi,
                            s.ossvarium_fee_pi::float AS ossvarium_fee_pi,
                            s.txid,
                            s.created_at
                        FROM artist_supports s
                        LEFT JOIN relics r ON r.relic_id = s.relic_id
                        WHERE s.status = 'completed'
                    )
                    ORDER BY created_at DESC
                    LIMIT 50;
                `;
            } catch (txErr) {
                console.warn("Recent transactions query error:", txErr.message);
            }

            let pioneerLogins = [];
            try {
                pioneerLogins = await sql`
                    SELECT pi_uid, username, last_seen_at, login_count
                    FROM pioneer_logins
                    ORDER BY last_seen_at DESC
                    LIMIT 50;
                `;
            } catch (loginQueryErr) {
                console.warn("Pioneers query error:", loginQueryErr.message);
            }

            let knownBuyers = [];
            try {
                knownBuyers = await sql`
                    SELECT
                        user_uid,
                        COUNT(*)::int AS orders_count,
                        COALESCE(SUM(amount_pi), 0)::float AS total_spent_pi,
                        MAX(created_at) AS last_order_at
                    FROM purchases
                    GROUP BY user_uid
                    ORDER BY last_order_at DESC
                    LIMIT 50;
                `;
            } catch (buyerQueryErr) {
                console.warn("Buyers query error:", buyerQueryErr.message);
            }

                        let recordedPayouts = [];
            try {
                recordedPayouts = await sql`
                    SELECT
                        id,
                        artist,
                        relic_id,
                        creator_pi_uid,
                        amount_pi::float AS amount_pi,
                        amount_eur::float AS amount_eur,
                        payout_method,
                        txid,
                        notes,
                        created_at
                    FROM artist_payouts
                    ORDER BY created_at DESC;
                `;
            } catch (payoutQueryErr) {
                console.warn("Recorded payouts query error:", payoutQueryErr.message);
            }

            const totalPaidOutPi = recordedPayouts.reduce((sum, p) => sum + (Number(p.amount_pi) || 0), 0);

            const payoutsByArtist = new Map();
            recordedPayouts.forEach(p => {
                const key = (p.artist || "").trim().toLowerCase();
                if (!key) return;
                const current = payoutsByArtist.get(key) || 0;
                payoutsByArtist.set(key, current + (Number(p.amount_pi) || 0));
            });

            // Group aggregated finances per Band / Artist
            const bandMap = new Map();

            relicPurchases.forEach(r => {
                const rawArtist = (r.artist || "Unknown Artist").trim();
                const artistKey = rawArtist.toLowerCase();
                const s = supportMap.get(r.relic_id) || {
                    support_gross_pi: 0, support_artist_pi: 0, support_fee_pi: 0, support_count: 0
                };

                const relicGross = Number(((r.purchases_gross_pi || 0) + (s.support_gross_pi || 0)).toFixed(4));
                const relicArtistShare = Number(((r.purchases_artist_pi || 0) + (s.support_artist_pi || 0)).toFixed(4));
                const relicFee = Number(((r.purchases_fee_pi || 0) + (s.support_fee_pi || 0)).toFixed(4));

                if (!bandMap.has(artistKey)) {
                    bandMap.set(artistKey, {
                        artist: rawArtist,
                        creatorPiUid: r.creator_pi_uid || null,
                        contactEmail: r.contact_email || null,
                        releases: [],
                        grossPi: 0,
                        lifetimeEarnedPi: 0,
                        ossvariumFeePi: 0,
                        purchasesCount: 0,
                        supportsCount: 0
                    });
                }

                const band = bandMap.get(artistKey);
                if (!band.creatorPiUid && r.creator_pi_uid) band.creatorPiUid = r.creator_pi_uid;
                if (!band.contactEmail && r.contact_email) band.contactEmail = r.contact_email;

                band.grossPi = Number((band.grossPi + relicGross).toFixed(4));
                band.lifetimeEarnedPi = Number((band.lifetimeEarnedPi + relicArtistShare).toFixed(4));
                band.ossvariumFeePi = Number((band.ossvariumFeePi + relicFee).toFixed(4));
                band.purchasesCount += (r.purchases_count || 0);
                band.supportsCount += (s.support_count || 0);

                band.releases.push({
                    relicId: r.relic_id,
                    releaseTitle: r.release_title,
                    grossPi: relicGross,
                    artistSharePi: relicArtistShare,
                    purchasesCount: r.purchases_count || 0,
                    supportsCount: s.support_count || 0
                });
            });

            recordedPayouts.forEach(p => {
                const rawArtist = (p.artist || "").trim();
                const artistKey = rawArtist.toLowerCase();
                if (artistKey && !bandMap.has(artistKey)) {
                    bandMap.set(artistKey, {
                        artist: rawArtist,
                        creatorPiUid: p.creator_pi_uid || null,
                        contactEmail: null,
                        releases: [],
                        grossPi: 0,
                        lifetimeEarnedPi: 0,
                        ossvariumFeePi: 0,
                        purchasesCount: 0,
                        supportsCount: 0
                    });
                }
            });

            const bandBreakdown = Array.from(bandMap.values()).map(b => {
                const key = b.artist.trim().toLowerCase();
                const paidOutPi = Number((payoutsByArtist.get(key) || 0).toFixed(4));
                const owedBalancePi = Math.max(0, Number((b.lifetimeEarnedPi - paidOutPi).toFixed(4)));

                return {
                    ...b,
                    paidOutPi,
                    owedBalancePi
                };
            }).sort((a, b) => b.owedBalancePi - a.owedBalancePi || b.lifetimeEarnedPi - a.lifetimeEarnedPi);

            const pTotals = purchasesTotals[0] || {};
            const sTotals = supportTotals[0] || {};
            const mTotals = merchTotals[0] || {};
            const totalLifetimeArtistPi = Number(((pTotals.total_artist_share_pi || 0) + (sTotals.total_artist_share_pi || 0)).toFixed(4));
            const totalOwedBalancePi = Math.max(0, Number((totalLifetimeArtistPi - totalPaidOutPi).toFixed(4)));

            return res.status(200).json({
                success: true,
                overview: {
                    grossPi: Number(((pTotals.total_sales_pi || 0) + (sTotals.total_support_pi || 0) + (mTotals.total_merch_pi || 0)).toFixed(4)),
                    artistSharePi: totalLifetimeArtistPi,
                    totalPaidOutPi: Number(totalPaidOutPi.toFixed(4)),
                    totalOwedBalancePi: totalOwedBalancePi,
                    ossvariumFeePi: Number(((pTotals.total_fee_pi || 0) + (sTotals.total_fee_pi || 0)).toFixed(4)),
                    countPurchases: pTotals.count_purchases || 0,
                    countFullReleases: pTotals.count_full_releases || 0,
                    countTracks: pTotals.count_tracks || 0,
                    countSupports: sTotals.count_supports || 0,
                    countMerchOrders: mTotals.count_merch_orders || 0
                },
                bandBreakdown,
                artistBreakdown,
                payoutHistory: recordedPayouts,
                recentTransactions,
                pioneerLogins,
                knownBuyers
            });

        }


        if (req.method === "GET" && action === "pending-merch") {
    if (!isAdmin) {
        return res.status(403).json({
            error: "Admin access required"
        });
    }

        let body = req.body;
    if (typeof body === "string") {
        try {
            body = JSON.parse(body);
        } catch (_) {}
    }

    const actionPost = body?.action || req.query?.action;

    if (actionPost === "record-payout") {
        const artist = String(body?.artist || "").trim();
        const amountPi = Number(body?.amount_pi);
        const payoutMethod = String(body?.payout_method || "pi").trim();
        const txid = body?.txid ? String(body.txid).trim() : null;
        const notes = body?.notes ? String(body.notes).trim() : null;
        const relicId = body?.relic_id ? String(body.relic_id).trim() : null;
        const creatorPiUid = body?.creator_pi_uid ? String(body.creator_pi_uid).trim() : null;

        if (!artist) {
            return res.status(400).json({ error: "Artist name is required" });
        }
        if (!Number.isFinite(amountPi) || amountPi <= 0) {
            return res.status(400).json({ error: "Amount must be a positive number" });
        }

        const sql = neon(process.env.POSTGRES_URL);

        await sql`
            CREATE TABLE IF NOT EXISTS artist_payouts (
                id SERIAL PRIMARY KEY,
                artist TEXT NOT NULL,
                relic_id TEXT,
                creator_pi_uid TEXT,
                amount_pi NUMERIC(14, 4) NOT NULL DEFAULT 0,
                amount_eur NUMERIC(14, 2) DEFAULT 0,
                payout_method TEXT DEFAULT 'pi',
                txid TEXT,
                notes TEXT,
                admin_recorded_by TEXT DEFAULT 'admin',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;

        const inserted = await sql`
            INSERT INTO artist_payouts (
                artist,
                relic_id,
                creator_pi_uid,
                amount_pi,
                payout_method,
                txid,
                notes
            )
            VALUES (
                ${artist},
                ${relicId},
                ${creatorPiUid},
                ${amountPi},
                ${payoutMethod},
                ${txid},
                ${notes}
            )
            RETURNING *;
        `;

        return res.status(200).json({
            success: true,
            payout: inserted[0]
        });
    }

    if (actionPost === "delete-payout") {
        const payoutId = Number(body?.payoutId || body?.id);
        if (!Number.isSafeInteger(payoutId) || payoutId <= 0) {
            return res.status(400).json({ error: "Invalid payout ID" });
        }

        const sql = neon(process.env.POSTGRES_URL);
        const deleted = await sql`
            DELETE FROM artist_payouts
            WHERE id = ${payoutId}
            RETURNING id, artist, amount_pi;
        `;

        if (deleted.length === 0) {
            return res.status(404).json({ error: "Payout record not found" });
        }

        return res.status(200).json({
            success: true,
            deleted: deleted[0]
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
