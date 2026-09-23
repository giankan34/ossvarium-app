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

async function getPrivateImageUrl(objectKey) {
    if (!objectKey) {
        return "";
    }

    if (!objectKey.startsWith("artist-images/")) {
        return objectKey;
    }

    const response = await fetch(
        "/api/audio-upload-url?objectKey=" +
        encodeURIComponent(objectKey)
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error ||
            "Failed to load private image"
        );
    }

    return result.imageUrl;
}

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
        await Promise.all(
            result.relics.map(async item => ({

            id: item.id,
            relicId: item.relic_id,

            artist: item.artist,
            release: item.release_title,

            country: item.country,
            genre: item.genre,
            year: item.release_year,

            description: item.description,
            bio: item.bio,

            cover: await getPrivateImageUrl(item.cover),

            artistImage: await getPrivateImageUrl(item.artist_image),

            banner:await getPrivateImageUrl(item.banner),

            pricePi: item.price_eur,
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

        })));

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
                    ☠ Price:
                    €${submission.priceEur || "0"}
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
                ? `Price: €${track.priceEur || 0}`
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

async function approveRelic(id) {

    try {

        const response =
            await fetch("/api/approve-relic", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: id
                })
            });

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Approval failed"
            );
        }

        alert(
            "⚔ RELIC APPROVED ⚔\n\n" +
            result.relic.relic_id +
            "\n" +
            result.relic.artist +
            " — " +
            result.relic.release_title
        );

        loadPendingRelics();

    } catch (error) {

        console.error(
            "OSSVARIUM approve relic error:",
            error
        );

        alert(
            "Approval failed.\n\n" +
            error.message
        );
    }
}

async function rejectRelic(id) {

    try {

        const response =
            await fetch("/api/reject-relic", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: id
                })
            });

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Rejection failed"
            );
        }

        alert(
            "☠ RELIC REJECTED ☠\n\n" +
            result.relic.relic_id +
            "\n" +
            result.relic.artist +
            " — " +
            result.relic.release_title
        );

        loadPendingRelics();

    } catch (error) {

        console.error(
            "OSSVARIUM reject relic error:",
            error
        );

        alert(
            "Rejection failed.\n\n" +
            error.message
        );
    }
}


async function checkAdminSession() {

    try {

        const response =
            await fetch("/api/admin-status");

        const result =
            await response.json();

        if (result.admin === true) {

            document.getElementById(
                "adminGate"
            ).style.display = "none";

            document.getElementById(
                "adminContent"
            ).style.display = "block";

            loadPendingRelics();

        }

    } catch (error) {

        console.error(
            "OSSVARIUM admin session check error:",
            error
        );

    }

}


window.addEventListener(
    "DOMContentLoaded",
    checkAdminSession
);