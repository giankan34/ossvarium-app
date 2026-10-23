function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function safeExternalUrl(value) {
    try {
        const url = new URL(String(value || "").trim());

        if (!["https:", "http:"].includes(url.protocol)) {
            return "";
        }

        return escapeHtml(url.href);
    } catch {
        return "";
    }
}

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
        loadPendingMerch();

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

                <h2>${escapeHtml(submission.artist)}</h2>

                <h3>${escapeHtml(submission.release)}</h3>

                <p>🌍 ${escapeHtml(submission.country)}</p>

                <p>☠ ${escapeHtml(submission.genre)}</p>

                <p>
                    ${escapeHtml(submission.year || "Unknown year")}
                </p>

                <p>
                    ☠ Price:
                    €${submission.priceEur || "0"}
                </p>

                ${
                    submission.cover
                    ? `
                        <img
                        src="${escapeHtml(submission.cover)}"
                        class="review-cover"
                        alt="${escapeHtml(submission.release)}"
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
                    ${escapeHtml(submission.contactEmail)}
                </p>

                ${submission.description
? `
<p>
    <b>DESCRIPTION</b>
    <br>
    ${escapeHtml(submission.description)}
</p>
`
: ""}

${submission.bio
? `
<p>
    <b>ARTIST BIO</b>
    <br>
    ${escapeHtml(submission.bio)}
</p>
`
: ""}

${submission.artistImage
? `
<p>
    <b>ARTIST IMAGE</b>
</p>

<img
    src="${escapeHtml(submission.artistImage)}"
    class="review-cover"
    alt="${escapeHtml(submission.artist)}"
`
: ""}

${submission.banner
? `
<p>
    <b>ARTIST BANNER</b>
</p>

<img
    src="${escapeHtml(submission.banner)}"
    class="review-cover"
    alt="${escapeHtml(submission.artist)} banner"
`
: ""}

<div class="review-links">

    ${submission.bandcamp
    ? `<a class="submit-btn" href="${safeExternalUrl(submission.bandcamp)}" target="_blank">BANDCAMP</a>`
    : ""}

    ${submission.spotify
    ? `<a class="submit-btn" href="${safeExternalUrl(submission.spotify)}"
 target="_blank">SPOTIFY</a>`
    : ""}

    ${submission.youtube
    ? `<a class="submit-btn" href="${safeExternalUrl(submission.youtube)}"
 target="_blank">YOUTUBE</a>`
    : ""}

    ${submission.instagram
    ? `<a class="submit-btn" href="${safeExternalUrl(submission.instagram)}"
 target="_blank">INSTAGRAM</a>`
    : ""}

    ${submission.facebook
    ? `<a class="submit-btn" href="${safeExternalUrl(submission.facebook)}"
 target="_blank">FACEBOOK</a>`
    : ""}

    ${submission.website
    ? `<a class="submit-btn" href="${safeExternalUrl(submission.website)}"
 target="_blank">WEBSITE</a>`
    : ""}

    ${submission.merch
    ? `<a class="submit-btn" href="${safeExternalUrl(submission.merch)}" target="_blank">MERCH</a>`
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
            ${escapeHtml(track.title)}

            <br>

            ${
    track.forSale
    ? `Price: €${escapeHtml(track.priceEur || 0)}`
    : "Not for individual sale"
}

            ${
    track.audio
    ? `
        <br>
        <button
            type="button"
            class="submit-btn"
            onclick="playAdminTrack(this, ${escapeHtml(JSON.stringify(track.audio))})"
        >
            ▶ PLAY TRACK
        </button>
        <audio controls preload="none" style="display:none; width:100%; margin-top:10px;"></audio>
    `
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
            await fetch("/api/review-relic", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
               body: JSON.stringify({
    id: id,
    action: "approve"
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

        
const response = await fetch("/api/review-relic", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        id: id,
        action: "reject"
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
            "PENDING SUBMISSION" +
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
            loadPendingMerch();

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

async function playAdminTrack(button, objectKey) {
    const player = button.parentElement.querySelector("audio");

    if (!player) return;

    try {
        button.disabled = true;
        button.textContent = "LOADING...";

        const response = await fetch(
            "/api/admin-status?action=audio-preview&objectKey=" +
            encodeURIComponent(objectKey)
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Audio preview failed");
        }

        player.src = result.audioUrl;
        player.style.display = "block";

        await player.play();

        button.textContent = "▶ PLAY TRACK";
    } catch (error) {
        console.error("Admin audio preview:", error);
        alert(error.message);
        button.textContent = "▶ PLAY TRACK";
    } finally {
        button.disabled = false;
    }
}


async function loadPendingMerch() {
    const container = document.getElementById("pendingMerch");
    if (!container) return;

    container.innerHTML = `
        <p class="submission-text">
            ☠ LOADING PENDING MERCH ☠
        </p>
    `;

    try {
        const response = await fetch(
            "/api/admin-status?action=pending-merch",
            { credentials: "same-origin" }
        );

        if (!response.ok) {
            throw new Error("Failed to load pending merch");
        }

        const data = await response.json();
        const products = data.products || [];

        if (products.length === 0) {
            container.innerHTML = `
                <p class="submission-text">
                    ☠ NO MERCH AWAITING JUDGEMENT ☠
                </p>
            `;
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="submission-card">
                <h2>${escapeHtml(product.product_name)}</h2>
                <p><strong>Artist:</strong> ${escapeHtml(product.artist_name)}</p>
                <p><strong>Type:</strong> ${escapeHtml(product.product_type)}</p>
                <p><strong>Price:</strong> ${escapeHtml(product.price_pi)} Pi</p>
                <p><strong>Quantity:</strong> ${escapeHtml(product.quantity)}</p>
                <p><strong>Status:</strong> PENDING</p>
                <div
    class="admin-merch-photos"
    data-merch-id="${Number(product.id)}"
    style="display:flex; flex-wrap:wrap; gap:12px; margin-top:15px;">
</div>
                <div style="display:flex; gap:12px; margin-top:20px;">
    <button
        type="button"
        onclick="reviewMerch(${Number(product.id)}, 'approve')">
        ☠ APPROVE MERCH
    </button>

    <button
        type="button"
        onclick="reviewMerch(${Number(product.id)}, 'reject')">
        ✕ REJECT MERCH
    </button>
</div>
            </div>
        `).join("");

        for (const product of products) {
    const photoContainer = Array.from(
        container.querySelectorAll(".admin-merch-photos")
    ).find(element =>
        element.dataset.merchId === String(product.id)
    );

    if (!photoContainer) continue;

    const photos = Array.isArray(product.photos)
        ? product.photos
        : [];

    for (const photoKey of photos) {
        try {
            const response = await fetch(
                "/api/admin-status?action=merch-preview&objectKey=" +
                encodeURIComponent(photoKey),
                { credentials: "same-origin" }
            );

            if (!response.ok) {
                throw new Error("Merch photo preview failed");
            }

            const result = await response.json();

            const img = document.createElement("img");
            img.src = result.imageUrl;
            img.alt = "Merch product photo";
            img.loading = "lazy";
            img.style.width = "120px";
            img.style.height = "120px";
            img.style.objectFit = "contain";

            photoContainer.appendChild(img);

        } catch (error) {
            console.error("Admin merch photo error:", error);
        }
    }
}

    } catch (error) {
        console.error("Pending merch error:", error);

        container.innerHTML = `
            <p class="submission-text">
                ERROR LOADING PENDING MERCH
            </p>
        `;
    }
}


async function reviewMerch(id, action) {
    if (action !== "approve" && action !== "reject") return;

    const confirmed = confirm(
        action === "approve"
            ? "Approve this merch product?"
            : "Reject this merch product?"
    );

    if (!confirmed) return;

    try {
        const response = await fetch("/api/admin-status", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id, action })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || "Merch review failed");
        }

        alert(
            action === "approve"
                ? "☠ MERCH APPROVED ☠"
                : "☠ MERCH REJECTED ☠"
        );

        await loadPendingMerch();

    } catch (error) {
        console.error("Merch review error:", error);
        alert("Failed to review merch: " + error.message);
    }
}
