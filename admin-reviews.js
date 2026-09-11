async function unlockAdmin() {

    const password =
        document.getElementById("adminPassword").value;

    const error =
        document.getElementById("adminError");

    error.style.display = "none";

    try {

        const response =
            await fetch("/api/admin-login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    password: password
                })
            });

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Login failed"
            );
        }

        document.getElementById(
            "adminGate"
        ).style.display = "none";

        document.getElementById(
            "adminContent"
        ).style.display = "block";

        sessionStorage.setItem(
            "ossvariumAdminUnlocked",
            "true"
        );

        loadPendingRelics();

    } catch (error) {

        console.error(
            "OSSVARIUM admin login error:",
            error
        );

        document.getElementById(
            "adminError"
        ).style.display = "block";
    }
}

window.addEventListener("DOMContentLoaded", () => {

    const isUnlocked =
        sessionStorage.getItem(
            "ossvariumAdminUnlocked"
        );

    if (isUnlocked === "true") {

        document.getElementById(
            "adminGate"
        ).style.display = "none";

        document.getElementById(
            "adminContent"
        ).style.display = "block";

    }

});

async function loadPendingRelics() {

    const container =
        document.getElementById("pendingRelics");

    let submissions = [];

try {

    const response =
        await fetch("/api/pending-relics");

    const result =
        await response.json();

    if (!response.ok) {
        throw new Error(
            result.error ||
            "Failed to load pending relics"
        );
    }

    submissions =
        result.relics.map(item => ({

            id: item.id,
            relicId: item.relic_id,

            artist: item.artist,
            release: item.release_title,

            country: item.country,
            genre: item.genre,
            year: item.release_year,

            description: item.description,
            bio: item.bio,

            cover: item.cover,
            artistImage: item.artist_image,
            banner: item.banner,

            pricePi: item.price_pi,
            contactEmail: item.contact_email,

            bandcamp:
                item.links?.bandcamp || "",

            spotify:
                item.links?.spotify || "",

            youtube:
                item.links?.youtube || "",

            instagram:
                item.links?.instagram || "",

            facebook:
                item.links?.facebook || "",

            website:
                item.links?.website || "",

            merch:
                item.links?.merch || "",

            tracks:
                item.tracks || [],

            status:
                item.status

        }));

} catch (error) {

    console.error(
        "ADMIN pending relics error:",
        error
    );

    container.innerHTML = `
        <p class="submission-text">
            ☠ DATABASE CONNECTION FAILED ☠
        </p>
    `;

    return;
}

    if (submissions.length === 0) {

        container.innerHTML = `
            <p class="submission-text">
                ☠ NO RELICS AWAITING JUDGEMENT ☠
            </p>
        `;

        return;
    }

    container.innerHTML =
        submissions.map(submission => `

            <div class="review-relic-card">

                <h2>${submission.artist}</h2>

                <h3>${submission.release}</h3>

                <p>🌍 ${submission.country}</p>

                <p>☠ ${submission.genre}</p>

                <p>
                    📅 ${submission.year || "Unknown year"}
                </p>

                <p>
                    🜏 Price:
                    ${submission.pricePi || "0"} Pi
                </p>

                ${
                    submission.cover
                    ? `
                        <img
                        src="${submission.cover}"
                        class="review-cover"
                        alt="${submission.release}">
                    `
                    : ""
                }

                ${
                    submission.trackInfo
                    ? `<p>${submission.trackInfo}</p>`
                    : ""
                }

                ${
                    submission.officialLink
                    ? `
                        <p>
                            <a
                            href="${submission.officialLink}"
                            target="_blank">
                                OFFICIAL LINK
                            </a>
                        </p>
                    `
                    : ""
                }

                <p>
                    Contact:
                    ${submission.contactEmail}
                </p>

                ${submission.description
? `
<p>
    <b>DESCRIPTION</b>
    <br>
    ${submission.description}
</p>
`
: ""}

${submission.bio
? `
<p>
    <b>ARTIST BIO</b>
    <br>
    ${submission.bio}
</p>
`
: ""}

${submission.artistImage
? `
<p>
    <b>ARTIST IMAGE</b>
</p>

<img
    src="${submission.artistImage}"
    class="review-cover"
    alt="${submission.artist}">
`
: ""}

${submission.banner
? `
<p>
    <b>ARTIST BANNER</b>
</p>

<img
    src="${submission.banner}"
    class="review-cover"
    alt="${submission.artist} banner">
`
: ""}

<div class="review-links">

    ${submission.bandcamp
    ? `<a class="submit-btn" href="${submission.bandcamp}" target="_blank">BANDCAMP</a>`
    : ""}

    ${submission.spotify
    ? `<a class="submit-btn" href="${submission.spotify}" target="_blank">SPOTIFY</a>`
    : ""}

    ${submission.youtube
    ? `<a class="submit-btn" href="${submission.youtube}" target="_blank">YOUTUBE</a>`
    : ""}

    ${submission.instagram
    ? `<a class="submit-btn" href="${submission.instagram}" target="_blank">INSTAGRAM</a>`
    : ""}

    ${submission.facebook
    ? `<a class="submit-btn" href="${submission.facebook}" target="_blank">FACEBOOK</a>`
    : ""}

    ${submission.website
    ? `<a class="submit-btn" href="${submission.website}" target="_blank">WEBSITE</a>`
    : ""}

    ${submission.merch
    ? `<a class="submit-btn" href="${submission.merch}" target="_blank">MERCH</a>`
    : ""}

</div>

${submission.tracks && submission.tracks.length
? `
<div class="review-tracklist">

    <h3>🎵 TRACKLIST</h3>

    ${submission.tracks.map((track,index) => `

        <div class="review-track">

            ${String(index + 1).padStart(2,"0")}
            —
            ${track.title}

            <br>

            ${
                track.forSale
                ? `Price: ${track.pricePi || 0} Pi`
                : "Not for individual sale"
            }

            ${
                track.audio
                ? `<br>Audio: ${track.audio}`
                : ""
            }

        </div>

    `).join("")}

</div>
`
: ""}

                <div class="review-actions">

                    <button
                    class="submit-btn"
                    onclick="approveRelic(${submission.id})">
                        ⚔ APPROVE ⚔
                    </button>

                    <button
                    class="submit-btn"
                    onclick="rejectRelic(${submission.id})">
                        ☠ REJECT ☠
                    </button>

                </div>

            </div>

        `).join("");
}


function approveRelic(id) {

    let submissions =
        JSON.parse(
            localStorage.getItem(
                "ossvariumPendingSubmissions"
            ) || "[]"
        );

    const submission =
        submissions.find(
            item => item.id === id
        );

    if (!submission) return;

    const approved =
        JSON.parse(
            localStorage.getItem(
                "ossvariumApprovedSubmissions"
            ) || "[]"
        );

    const duplicate =
        approved.some(item =>
            item.artist.toLowerCase() ===
            submission.artist.toLowerCase()
            &&
            item.release.toLowerCase() ===
            submission.release.toLowerCase()
        );

    if (duplicate) {

        alert(
            "☠ THIS RELIC IS ALREADY APPROVED ☠"
        );

        return;
    }

    const allIds = approved
    .map(item => item.relicId)
    .filter(Boolean)
    .map(id =>
        Number(
            id.replace("OSV-", "")
        )
    )
    .filter(Number.isFinite);

const highestApprovedId =
    allIds.length > 0
    ? Math.max(...allIds)
    : 3;

const nextNumber =
    highestApprovedId + 1;

const relicId =
    "OSV-" +
    String(nextNumber)
    .padStart(5, "0");

    const relic = {

        id: submission.id,

        relicId: relicId,

        artist:
            submission.artist,

        release:
            submission.release,

        genre:
            submission.genre,

        year:
            submission.year,

        country:
            submission.country,

        price:
            submission.pricePi || "0",

        supporters: "0",

        description:
            submission.description || "",

        bio:
            submission.bio || "",

        tracks:
            submission.tracks || [],

        cover:
            submission.cover || "",

        artistImage:
            submission.artistImage || "",

        banner:
            submission.banner || "",

        links: {

            bandcamp:
                submission.bandcamp || "",

            spotify:
                submission.spotify || "",

            youtube:
                submission.youtube || "",

            website:
                submission.website || "",

            merch:
                submission.merch || "",

            instagram:
                submission.instagram || "",

            facebook:
                submission.facebook || ""

        },

        similar: [],

        contactEmail:
            submission.contactEmail || "",

        submittedAt:
            submission.submittedAt,

        approvedAt:
            new Date().toISOString(),

        status: "approved"

    };

    approved.push(relic);

    localStorage.setItem(
        "ossvariumApprovedSubmissions",
        JSON.stringify(approved)
    );

    submissions =
        submissions.filter(
            item => item.id !== id
        );

    localStorage.setItem(
        "ossvariumPendingSubmissions",
        JSON.stringify(submissions)
    );

    alert(
        "⚔ RELIC APPROVED ⚔\n\n" +
        relic.relicId +
        "\n" +
        relic.artist +
        " — " +
        relic.release
    );

    loadPendingRelics();
}


function rejectRelic(id) {

    let submissions =
        JSON.parse(
            localStorage.getItem(
                "ossvariumPendingSubmissions"
            ) || "[]"
        );

    const relic =
        submissions.find(
            item => item.id === id
        );

    if (!relic) return;

    const confirmed =
        confirm(
            "☠ REJECT THIS RELIC? ☠\n\n" +
            relic.artist +
            " — " +
            relic.release
        );

    if (!confirmed) return;

    submissions =
        submissions.filter(
            item => item.id !== id
        );

    localStorage.setItem(
        "ossvariumPendingSubmissions",
        JSON.stringify(submissions)
    );

    alert(
        "☠ RELIC REJECTED ☠\n\n" +
        relic.artist +
        " — " +
        relic.release
    );

    loadPendingRelics();
}


loadPendingRelics();