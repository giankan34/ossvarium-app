const { neon } = require("@neondatabase/serverless");
const PiNetwork = require("pi-backend").default;

const pi = new PiNetwork(
    process.env.PI_API_KEY,
    process.env.PI_WALLET_PRIVATE_SEED
);

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
) AS gross_pi,

COALESCE(
    SUM(p.artist_share_pi),
    0
) AS pi_earned,

COALESCE(
    SUM(p.ossvarium_fee_pi),
    0
) AS ossvarium_fee_pi

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

const payoutSummary = await sql`
    SELECT
        COALESCE(
            SUM(amount_pi)
                FILTER (WHERE status = 'completed'),
            0
        ) AS paid_out_pi,

        COALESCE(
            SUM(amount_pi)
                FILTER (WHERE status = 'pending'),
            0
        ) AS pending_payout_pi

    FROM creator_payouts

    WHERE
        creator_pi_uid =
            ${verifiedCreatorPiUid};
`;

const totalEarnedPi =
    relics.reduce(
        (sum, relic) =>
            sum + Number(relic.pi_earned || 0),
        0
    );

const paidOutPi =
    Number(
        payoutSummary[0]?.paid_out_pi || 0
    );

const pendingPayoutPi =
    Number(
        payoutSummary[0]?.pending_payout_pi || 0
    );

const availableBalancePi =
    Math.max(
        0,
        totalEarnedPi -
        paidOutPi -
        pendingPayoutPi
    );

    return res.status(200).json({
    success: true,
    username: verifiedCreatorPiUsername,
    relics,
    earnings: {
        total_earned_pi:
            Number(totalEarnedPi.toFixed(4)),

        pending_payout_pi:
            Number(pendingPayoutPi.toFixed(4)),

        paid_out_pi:
            Number(paidOutPi.toFixed(4)),

        available_balance_pi:
            Number(availableBalancePi.toFixed(4))
    }
});
}

if (
    req.method === "POST" &&
    req.body?.action === "request_payout"
) {
    if (!verifiedCreatorPiUid) {
        return res.status(401).json({
            error: "Pi login required"
        });
    }

    // -------------------------------------------------
    // 1. RESUME AN EXISTING PENDING PAYOUT FIRST
    // -------------------------------------------------

    const existingPendingPayouts = await sql`
        SELECT
            id,
            amount_pi,
            status,
            pi_payment_id,
            txid,
            created_at
        FROM creator_payouts
        WHERE
            creator_pi_uid = ${verifiedCreatorPiUid}
            AND status = 'pending'
        ORDER BY created_at ASC
        LIMIT 1;
    `;

    if (existingPendingPayouts.length > 0) {
        const existingPayout = existingPendingPayouts[0];

        // ---------------------------------------------
        // 2. RECOVER OR CREATE PI PAYMENT ID
        // ---------------------------------------------

        if (!existingPayout.pi_payment_id) {
            const incompletePayments =
                await pi.getIncompleteServerPayments();

            const matchingIncompletePayment =
                incompletePayments.find(
                    payment =>
                        Number(payment.metadata?.payoutId) ===
                        Number(existingPayout.id)
                );

            if (matchingIncompletePayment) {
                existingPayout.pi_payment_id =
                    matchingIncompletePayment.identifier;

                await sql`
                    UPDATE creator_payouts
                    SET pi_payment_id =
                        ${existingPayout.pi_payment_id}
                    WHERE
                        id = ${existingPayout.id}
                        AND creator_pi_uid =
                            ${verifiedCreatorPiUid}
                        AND status = 'pending'
                        AND pi_payment_id IS NULL;
                `;

                if (matchingIncompletePayment.transaction?.txid) {
                    existingPayout.txid =
                        matchingIncompletePayment.transaction.txid;

                    await sql`
                        UPDATE creator_payouts
                        SET txid = ${existingPayout.txid}
                        WHERE
                            id = ${existingPayout.id}
                            AND creator_pi_uid =
                                ${verifiedCreatorPiUid}
                            AND status = 'pending'
                            AND txid IS NULL;
                    `;
                }
            } else {
                if (incompletePayments.length > 0) {
                    return res.status(409).json({
                        error:
                            "Another incomplete Pi payment already exists"
                    });
                }

                const paymentData = {
                    amount: Number(existingPayout.amount_pi),
                    memo:
                        `OSSVARIUM creator payout #${existingPayout.id}`,
                    metadata: {
                        payoutId: existingPayout.id,
                        type: "creator_payout"
                    },
                    uid: verifiedCreatorPiUid
                };

                existingPayout.pi_payment_id =
                    await pi.createPayment(paymentData);

                await sql`
                    UPDATE creator_payouts
                    SET pi_payment_id =
                        ${existingPayout.pi_payment_id}
                    WHERE
                        id = ${existingPayout.id}
                        AND creator_pi_uid =
                            ${verifiedCreatorPiUid}
                        AND status = 'pending'
                        AND pi_payment_id IS NULL;
                `;
            }
        }

        // ---------------------------------------------
        // 3. RECOVER TXID FROM PI IF IT ALREADY EXISTS
        // ---------------------------------------------

        if (
            existingPayout.pi_payment_id &&
            !existingPayout.txid
        ) {
            const piPayment =
                await pi.getPayment(
                    existingPayout.pi_payment_id
                );

            if (piPayment.transaction?.txid) {
                existingPayout.txid =
                    piPayment.transaction.txid;

                await sql`
                    UPDATE creator_payouts
                    SET txid = ${existingPayout.txid}
                    WHERE
                        id = ${existingPayout.id}
                        AND creator_pi_uid =
                            ${verifiedCreatorPiUid}
                        AND status = 'pending'
                        AND txid IS NULL;
                `;
            }
        }

        // ---------------------------------------------
        // 4. SUBMIT ONLY IF NO TXID EXISTS
        // ---------------------------------------------

        if (
            existingPayout.pi_payment_id &&
            !existingPayout.txid
        ) {
            existingPayout.txid =
                await pi.submitPayment(
                    existingPayout.pi_payment_id
                );

            await sql`
                UPDATE creator_payouts
                SET txid = ${existingPayout.txid}
                WHERE
                    id = ${existingPayout.id}
                    AND creator_pi_uid =
                        ${verifiedCreatorPiUid}
                    AND status = 'pending'
                    AND pi_payment_id =
                        ${existingPayout.pi_payment_id}
                    AND txid IS NULL;
            `;
        }

        // ---------------------------------------------
        // 5. COMPLETE AND ONLY THEN MARK PAID
        // ---------------------------------------------

        if (
            existingPayout.pi_payment_id &&
            existingPayout.txid
        ) {
            const completedPayment =
                await pi.completePayment(
                    existingPayout.pi_payment_id,
                    existingPayout.txid
                );

            if (
                completedPayment.status
                    ?.developer_completed !== true
            ) {
                return res.status(502).json({
                    error:
                        "Pi payment was not confirmed as completed"
                });
            }

            await sql`
                UPDATE creator_payouts
                SET
                    status = 'completed',
                    completed_at = NOW()
                WHERE
                    id = ${existingPayout.id}
                    AND creator_pi_uid =
                        ${verifiedCreatorPiUid}
                    AND status = 'pending'
                    AND pi_payment_id =
                        ${existingPayout.pi_payment_id}
                    AND txid =
                        ${existingPayout.txid};
            `;

            existingPayout.status = "completed";
        }

        return res.status(200).json({
            success: true,
            payout: existingPayout,
            resumed: true
        });
    }

    // -------------------------------------------------
    // 6. NO PENDING PAYOUT:
    //    CALCULATE AVAILABLE CREATOR BALANCE
    // -------------------------------------------------

    const earnings = await sql`
        SELECT
            COALESCE(
                SUM(p.artist_share_pi),
                0
            ) AS total_earned_pi
        FROM purchases p
        INNER JOIN relics r
            ON r.relic_id = p.relic_id
        WHERE
            r.creator_pi_uid =
                ${verifiedCreatorPiUid};
    `;

    const payouts = await sql`
        SELECT
            COALESCE(
                SUM(amount_pi)
                    FILTER (
                        WHERE status IN (
                            'pending',
                            'completed'
                        )
                    ),
                0
            ) AS reserved_pi
        FROM creator_payouts
        WHERE
            creator_pi_uid =
                ${verifiedCreatorPiUid};
    `;

    const totalEarnedPi =
        Number(
            earnings[0]?.total_earned_pi || 0
        );

    const reservedPi =
        Number(
            payouts[0]?.reserved_pi || 0
        );

    const availablePi =
        Number(
            Math.max(
                0,
                totalEarnedPi - reservedPi
            ).toFixed(4)
        );

    if (availablePi <= 0) {
        return res.status(400).json({
            error: "No balance available for payout"
        });
    }

    // -------------------------------------------------
    // 7. CREATE NEW LOCAL PAYOUT REQUEST ONLY
    // -------------------------------------------------

    const payout = await sql`
        INSERT INTO creator_payouts (
            creator_pi_uid,
            creator_pi_username,
            amount_pi,
            status
        )
        VALUES (
            ${verifiedCreatorPiUid},
            ${verifiedCreatorPiUsername},
            ${availablePi},
            'pending'
        )
        RETURNING
            id,
            amount_pi,
            status,
            created_at;
    `;

    return res.status(201).json({
        success: true,
        payout: payout[0]
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