const releasePage =
document.getElementById("release-container");

let releases = [];
let release = null;
let releaseId = 0;

document.addEventListener("DOMContentLoaded", () => {

    loadRelease();

});

async function loadRelease(){

    try{

        const response =
        await fetch("./data/releases.json");

        releases =
        await response.json();

        const params =
        new URLSearchParams(
            window.location.search
        );

        releaseId =
        Number(
            params.get("id") || 0
        );

        release =
        releases[releaseId];

        if(!release){

            releasePage.innerHTML =
            "<h2>RELEASE NOT FOUND</h2>";

            return;

        }

        releasePage.innerHTML = `
        <h2 style="color:red">
        STEP 1 OK
        </h2>
        `;

        renderPage();

    }

    catch(error){

        console.error(error);

        releasePage.innerHTML =
        "<h2>ERROR LOADING RELEASE</h2>";

    }

}

function renderPage(){

    releasePage.innerHTML =

        renderHeader() +

        renderMuseumRecord() +

        renderTimeline() +

        renderArtistBio();

}
function renderHeader(){

    return `

    <div class="release-card">

        ${Number(release.supporters) >= 30 ? `

        <div class="hall-relic">
            👑 HALL OF RELICS
        </div>

        ` : ""}

        <img
            class="release-cover"
            src="${release.cover}"
            alt="${release.release}"
        >

        <div class="release-title">
            ${release.release}
        </div>

        <div class="release-artist">

            <a
                href="artist.html?artist=${encodeURIComponent(release.artist)}"
                class="submit-btn">

                ⚔ ${release.artist}

            </a>

        </div>

        <div class="release-meta">

            ${release.genre}
            •
            ${release.country}
            •
            ${release.year}

        </div>

        <div class="release-desc">

            ${release.description}

        </div>

        <br>

        <a
        class="certificate-btn"
        href="certificate.html?id=${releaseId}">

        📜 VIEW CERTIFICATE

        </a>

        <div class="ossvarium-note">

            ☩ DIGITALLY PRESERVED INSIDE THE OSSVARIUM ARCHIVES

        </div>

    </div>

    `;

}

function renderMuseumRecord(){

    return `

    <div class="museum-card">

        <div class="archive-header">

            <div class="archive-icon">🏛</div>

            <div>

                <div class="archive-title">
                    ARCHIVE ENTRY
                </div>

                <div class="archive-subtitle">
                    OFFICIAL OSSVARIUM RECORD
                </div>

            </div>

            <div class="archive-stamp">
                PRESERVED
            </div>

        </div>

        <div class="museum-row">
            <span class="museum-label">ARCHIVE CODE</span>
            <span class="museum-value">
                OSV-${String(releaseId+1).padStart(5,"0")}
            </span>
        </div>

        <div class="museum-row">
            <span class="museum-label">CLASSIFICATION</span>
            <span class="museum-value">
                ${release.genre}
            </span>
        </div>

        <div class="museum-row">
            <span class="museum-label">ORIGIN</span>
            <span class="museum-value">
                ${release.country}
            </span>
        </div>

        <div class="museum-row">
            <span class="museum-label">ARCHIVE RANK</span>
            <span class="museum-value status-gold">
                #${releaseId+1}
            </span>
        </div>

        <div class="museum-row">
            <span class="museum-label">FOLLOWERS</span>
            <span class="museum-value">
                ${release.supporters}
            </span>
        </div>

    </div>

    `;

}


function renderTimeline(){

    return `

    <div class="museum-card">

        <h3>📜 RELIC TIMELINE</h3>

        <div class="museum-row">
            <span class="label">📦 Released</span>
            <span class="value">${release.year}</span>
        </div>

        <div class="museum-row">
            <span class="label">⏳ Relic Age</span>
            <span class="value">
                ${2026 - Number(release.year)} Years
            </span>
        </div>

        <div class="museum-row">
            <span class="label">🏛 Entered Ossvarium</span>
            <span class="value">2026</span>
        </div>

        <div class="museum-row">
            <span class="label">❤️ First Pioneer</span>
            <span class="value">Unknown</span>
        </div>

        <div class="museum-row">
            <span class="label">👑 Current Status</span>
            <span class="value">PRESERVED</span>
        </div>

        <div style="margin-top:20px;text-align:center;color:#b9a8a8;letter-spacing:2px;">

            🏛 AUTHENTICATED BY<br>

            <strong>OSSVARIUM ARCHIVES</strong>

        </div>

    </div>

    `;

}

function renderArtistBio(){

    return `

    <div class="museum-card">

        <h3>🎤 ARTIST DOSSIER</h3>

        <p>

            ${release.bio}

        </p>

    </div>

    `;

}
