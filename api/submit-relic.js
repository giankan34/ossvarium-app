const { neon } = require("@neondatabase/serverless");

module.exports = async function handler(req, res) {

    if (
    req.method !== "POST" &&
    req.method !== "GET"
) {
    return res.status(405).json({
        error: "Method not allowed"
    });
}
    try {

        const sql = neon(process.env.POSTGRES_URL);

        let verifiedCreatorPiUid = null;
let verifiedCreatorPiUsername = null;

const authHeader =
    req.headers.authorization || "";

if (authHeader.startsWith("Bearer ")) {

    const accessToken =
        authHeader.substring(7);

    try {

        const piResponse = await fetch(
            "https://api.minepi.com/v2/me",
            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                }
            }
        );

        if (!piResponse.ok) {
            throw new Error(
                "Pi authentication verification failed"
            );
        }

        const piUser =
            await piResponse.json();

        verifiedCreatorPiUid =
            piUser.uid || null;

        verifiedCreatorPiUsername =
            piUser.username || null;

    } catch (error) {

        console.error(
            "OSSVARIUM creator Pi verification error:",
            error
        );

        return res.status(401).json({
            error: "Invalid Pi authentication"
        });
    }
}

// ---------------------------------
// MY RELICS (GET)
// ---------------------------------

if (req.method === "GET") {

    if (!verifiedCreatorPiUid) {
        return res.status(401).json({
            error: "Pi login required"
        });
    }

    const relics = await sql`
    SELECT
        r.relic_id,
        r.artist,
        r.release_title,
        r.status,
        r.created_at,
        r.cover,
        r.genre,
        r.country,

        COUNT(p.id)::int AS track_sales,

        COALESCE(
            SUM(p.amount_pi),
            0
        ) AS pi_earned

    FROM relics r

    LEFT JOIN purchases p
        ON p.relic_id = r.relic_id

    WHERE
        r.creator_pi_uid = ${verifiedCreatorPiUid}

    GROUP BY
        r.relic_id,
        r.artist,
        r.release_title,
        r.status,
        r.created_at,
        r.cover,
        r.genre,
        r.country

    ORDER BY
        r.created_at DESC;
`;

    return res.status(200).json({
        success: true,
        username: verifiedCreatorPiUsername,
        relics
    });
}

        const {
            artist,
            release,
            country,
            genre,
            year,
            description,
            bio,
            artistImage,
            banner,
            cover,
            bandcamp,
            spotify,
            youtube,
            instagram,
            facebook,
            website,
            merch,
            contactEmail,
            priceEur,
            tracks
        } = req.body;

        if (!artist || !release) {
            return res.status(400).json({
                error: "Artist and release title are required"
            });
        }

        const links = {
            bandcamp: bandcamp || "",
            spotify: spotify || "",
            youtube: youtube || "",
            instagram: instagram || "",
            facebook: facebook || "",
            website: website || "",
            merch: merch || ""
        };

        const inserted = await sql`
            INSERT INTO relics (
                artist,
                release_title,
                country,
                genre,
                release_year,
                description,
                bio,
                artist_image,
                banner,
                cover,
                price_eur,
                contact_email,
                creator_pi_uid,
                creator_pi_username,
                status,
                source,
                links,
                tracks
            )
            VALUES (
                ${artist},
                ${release},
                ${country || ""},
                ${genre || ""},
                ${year ? Number(year) : null},
                ${description || ""},
                ${bio || ""},
                ${artistImage || ""},
                ${banner || ""},
                ${cover || ""},
                ${priceEur ? Number(priceEur) : 0},
                ${contactEmail || ""},
                ${verifiedCreatorPiUid},
                ${verifiedCreatorPiUsername},
                'pending',
                'submission',
                ${JSON.stringify(links)}::jsonb,
                ${JSON.stringify(tracks || [])}::jsonb
            )
            RETURNING id;
        `;

        const id = inserted[0].id;

        const relicId =
            `OSV-${String(id).padStart(5, "0")}`;

        const updated = await sql`
            UPDATE relics
            SET
                relic_id = ${relicId},
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *;
        `;

        return res.status(201).json({
            success: true,
            relic: updated[0]
        });

    } catch (error) {

        console.error(
            "OSSVARIUM submit relic error:",
            error
        );

        return res.status(500).json({
            error: "Failed to submit relic"
        });
    }
};