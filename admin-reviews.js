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
        loadSalesOverview();

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
            loadSalesOverview();

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
                <p><strong>Price:</strong> ${escapeHtml(String(Number(product.price_pi)))} Pi</p>
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

/* ==========================================================
   OSSVARIUM ADMIN TABS & SALES / PAYOUTS MANAGEMENT
   ========================================================== */

function switchAdminTab(tabName) {
    const tabs = ["judgement", "sales", "users"];
    tabs.forEach(t => {
        const pane = document.getElementById("tab" + t.charAt(0).toUpperCase() + t.slice(1));
        const btn = document.getElementById("tabBtn" + t.charAt(0).toUpperCase() + t.slice(1));
        if (pane) {
            pane.style.display = (t === tabName) ? "block" : "none";
        }
        if (btn) {
            if (t === tabName) {
                btn.style.background = "#792020";
                btn.style.color = "#ffffff";
                btn.style.borderColor = "#c62828";
            } else {
                btn.style.background = "#200b0b";
                btn.style.color = "#e5b9b9";
                btn.style.borderColor = "#592020";
            }
        }
    });

    if (tabName === "sales" || tabName === "users") {
        loadSalesOverview();
    }
}

let cachedSalesData = null;

async function loadSalesOverview() {
    try {
        const response = await fetch("/api/admin-status?action=sales-overview", {
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("Failed to load sales data: HTTP " + response.status);
        }

        const data = await response.json();
        if (!data || !data.success) {
            throw new Error(data.error || "Sales overview query failed");
        }

        cachedSalesData = data;
        renderSalesOverview(data);

    } catch (err) {
        console.error("OSSVARIUM loadSalesOverview error:", err);
        const artistContainer = document.getElementById("artistBreakdownContainer");
        if (artistContainer) {
            artistContainer.innerHTML = `<p style="color:#c62828; text-align:center; padding:20px;">⚠️ Failed to load sales ledger: ${escapeHtml(err.message)}</p>`;
        }
    }
}

function renderSalesOverview(data) {
    const ov = data.overview || {};

    // 1. Stat cards
    const statGross = document.getElementById("statGrossPi");
    const statArtistShare = document.getElementById("statArtistSharePi");
    const statFee = document.getElementById("statFeePi");
    const statOrders = document.getElementById("statOrdersCount");
    const statBreakdown = document.getElementById("statBreakdown");

    if (statGross) statGross.textContent = (ov.grossPi ?? 0).toFixed(4) + " π";
    if (statArtistShare) statArtistShare.textContent = (ov.artistSharePi ?? 0).toFixed(4) + " π";
    if (statFee) statFee.textContent = (ov.ossvariumFeePi ?? 0).toFixed(4) + " π";
    if (statOrders) {
        const totalCount = (ov.countPurchases || 0) + (ov.countSupports || 0) + (ov.countMerchOrders || 0);
        statOrders.textContent = `${totalCount} total transactions`;
    }
    if (statBreakdown) {
        statBreakdown.innerHTML = `
            <div>🎵 <b>Tracks:</b> ${ov.countTracks || 0}</div>
            <div>📀 <b>Full Releases:</b> ${ov.countFullReleases || 0}</div>
            <div>🤝 <b>Direct Tips:</b> ${ov.countSupports || 0}</div>
            ${ov.countMerchOrders ? `<div>👕 <b>Merch Orders:</b> ${ov.countMerchOrders}</div>` : ""}
        `;
    }

    // 2. Artist Royalties Table
    const artistContainer = document.getElementById("artistBreakdownContainer");
    if (artistContainer) {
        const list = data.artistBreakdown || [];
        if (list.length === 0) {
            artistContainer.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">No relics or artists recorded in the database.</p>`;
        } else {
            artistContainer.innerHTML = `
                <table style="width:100%; border-collapse:collapse; background:#0d0606; border:1px solid #592020; border-radius:6px; font-size:13px; color:#e5d5d5;">
                    <thead>
                        <tr style="background:#200b0b; color:#e5b9b9; font-family:'Cinzel',serif;">
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:left;">ARTIST / BAND</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:left;">RELEASE</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:right;">GROSS (π)</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:right; color:#4caf50;">ARTIST OWED (90%)</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:right; color:#c62828;">VAULT (10%)</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:center;">SALES / TIPS</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:left;">CREATOR INFO</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map(item => `
                            <tr style="border-bottom:1px solid #220b0b;">
                                <td style="padding:10px; font-weight:bold; color:#fff;">${escapeHtml(item.artist)}</td>
                                <td style="padding:10px; color:#ccc;">${escapeHtml(item.releaseTitle)} <small style="color:#777;">(${escapeHtml(item.relicId)})</small></td>
                                <td style="padding:10px; text-align:right; font-weight:bold; color:#d4af37;">${Number(item.grossPi || 0).toFixed(4)} π</td>
                                <td style="padding:10px; text-align:right; font-weight:bold; color:#4caf50;">${Number(item.artistSharePi || 0).toFixed(4)} π</td>
                                <td style="padding:10px; text-align:right; color:#e57373;">${Number(item.ossvariumFeePi || 0).toFixed(4)} π</td>
                                <td style="padding:10px; text-align:center;">
                                    ${item.purchasesCount || 0} sales | ${item.supportsCount || 0} tips
                                </td>
                                <td style="padding:10px; font-size:11px;">
                                    ${item.creatorPiUid ? `<span style="color:#81c784;">UID: ${escapeHtml(item.creatorPiUid.slice(0, 12))}...</span><br>` : `<span style="color:#e57373;">No Pi UID</span><br>`}
                                    ${item.contactEmail ? `<span style="color:#aaa;">✉ ${escapeHtml(item.contactEmail)}</span>` : ""}
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;
        }
    }

    // 3. Recent Transactions Ledger
    const txContainer = document.getElementById("recentTransactionsContainer");
    if (txContainer) {
        const txList = data.recentTransactions || [];
        if (txList.length === 0) {
            txContainer.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">No purchases or tips recorded yet.</p>`;
        } else {
            txContainer.innerHTML = `
                <table style="width:100%; border-collapse:collapse; background:#0d0606; border:1px solid #592020; border-radius:6px; font-size:12px; color:#e5d5d5;">
                    <thead>
                        <tr style="background:#200b0b; color:#e5b9b9; font-family:'Cinzel',serif;">
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:left;">DATE</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:left;">TYPE</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:left;">ITEM / TRACK</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:left;">ARTIST</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:left;">BUYER UID</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:right;">AMOUNT (π)</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:right; color:#4caf50;">ARTIST (90%)</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:left;">TXID</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${txList.map(tx => {
                            const dateStr = tx.created_at ? new Date(tx.created_at).toLocaleString() : "--";
                            let typeBadge = "";
                            if (tx.type === "support") {
                                typeBadge = `<span style="background:#311b92; color:#b39ddb; padding:2px 6px; border-radius:4px; font-size:10px;">TIP</span>`;
                            } else if (tx.track_title === "__FULL_RELEASE__") {
                                typeBadge = `<span style="background:#1b5e20; color:#a5d6a7; padding:2px 6px; border-radius:4px; font-size:10px;">FULL RELEASE</span>`;
                            } else {
                                typeBadge = `<span style="background:#263238; color:#cfd8dc; padding:2px 6px; border-radius:4px; font-size:10px;">TRACK</span>`;
                            }

                            return `
                                <tr style="border-bottom:1px solid #1a0808;">
                                    <td style="padding:8px 10px; color:#aaa; white-space:nowrap;">${escapeHtml(dateStr)}</td>
                                    <td style="padding:8px 10px;">${typeBadge}</td>
                                    <td style="padding:8px 10px; font-weight:bold; color:#fff;">${escapeHtml(tx.track_title === "__FULL_RELEASE__" ? (tx.release_title || "Full Release") : (tx.track_title || "--"))}</td>
                                    <td style="padding:8px 10px; color:#ccc;">${escapeHtml(tx.artist || "--")}</td>
                                    <td style="padding:8px 10px; font-family:monospace; font-size:11px; color:#90caf9;">${escapeHtml((tx.buyer_uid || "").slice(0, 16))}...</td>
                                    <td style="padding:8px 10px; text-align:right; font-weight:bold; color:#d4af37;">${Number(tx.amount_pi || 0).toFixed(4)} π</td>
                                    <td style="padding:8px 10px; text-align:right; font-weight:bold; color:#4caf50;">${Number(tx.artist_share_pi || 0).toFixed(4)} π</td>
                                    <td style="padding:8px 10px; font-family:monospace; font-size:11px; color:#aaa;" title="${escapeHtml(tx.txid || '')}">
                                        ${tx.txid ? `<a href="https://minepi.com/blockexplorer/tx/${encodeURIComponent(tx.txid)}" target="_blank" style="color:#ce93d8; text-decoration:none;">${escapeHtml(tx.txid.slice(0, 8))}...</a>` : "--"}
                                    </td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            `;
        }
    }

    // 4. Pioneer Logins Table
    const pioneerContainer = document.getElementById("pioneerLoginsContainer");
    if (pioneerContainer) {
        const pList = data.pioneerLogins || [];
        if (pList.length === 0) {
            pioneerContainer.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">No authenticated pioneers logged yet. Activity will appear as users authenticate and sync their collection.</p>`;
        } else {
            pioneerContainer.innerHTML = `
                <table style="width:100%; border-collapse:collapse; background:#0d0606; border:1px solid #592020; border-radius:6px; font-size:12px; color:#e5d5d5;">
                    <thead>
                        <tr style="background:#200b0b; color:#e5b9b9; font-family:'Cinzel',serif;">
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:left;">PIONEER USERNAME</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:left;">PI UID</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:left;">LAST SEEN</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:center;">LOGIN SESSIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pList.map(p => `
                            <tr style="border-bottom:1px solid #1a0808;">
                                <td style="padding:8px 10px; font-weight:bold; color:#81c784;">@${escapeHtml(p.username || "Pioneer")}</td>
                                <td style="padding:8px 10px; font-family:monospace; font-size:11px; color:#aaa;">${escapeHtml(p.pi_uid)}</td>
                                <td style="padding:8px 10px; color:#ccc;">${p.last_seen_at ? new Date(p.last_seen_at).toLocaleString() : "--"}</td>
                                <td style="padding:8px 10px; text-align:center; font-weight:bold; color:#d4af37;">${p.login_count || 1}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;
        }
    }

    // 5. Verified Buyers Table
    const buyersContainer = document.getElementById("knownBuyersContainer");
    if (buyersContainer) {
        const bList = data.knownBuyers || [];
        if (bList.length === 0) {
            buyersContainer.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">No purchases recorded yet.</p>`;
        } else {
            buyersContainer.innerHTML = `
                <table style="width:100%; border-collapse:collapse; background:#0d0606; border:1px solid #592020; border-radius:6px; font-size:12px; color:#e5d5d5;">
                    <thead>
                        <tr style="background:#200b0b; color:#e5b9b9; font-family:'Cinzel',serif;">
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:left;">BUYER PI UID</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:center;">PURCHASES COUNT</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:right;">TOTAL SPENT (π)</th>
                            <th style="padding:10px; border-bottom:1px solid #592020; text-align:left;">LAST ORDER</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bList.map(b => `
                            <tr style="border-bottom:1px solid #1a0808;">
                                <td style="padding:8px 10px; font-family:monospace; font-size:11px; color:#90caf9;">${escapeHtml(b.user_uid)}</td>
                                <td style="padding:8px 10px; text-align:center; font-weight:bold; color:#fff;">${b.orders_count || 1}</td>
                                <td style="padding:8px 10px; text-align:right; font-weight:bold; color:#d4af37;">${Number(b.total_spent_pi || 0).toFixed(4)} π</td>
                                <td style="padding:8px 10px; color:#ccc;">${b.last_order_at ? new Date(b.last_order_at).toLocaleString() : "--"}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;
        }
    }
}
