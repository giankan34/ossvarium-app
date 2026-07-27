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

        renderMuseumRecord();

}
function renderHeader(){

    return `

    <div class="release-card">

        ${Number(release.supporters) >= 31 ? `

        <div class="hall-relic">

            👑 HALL RELIC

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

                ${release.artist}

            </a>

        </div>

        <div class="release-meta">

            ${release.genre}

            •

            ${release.year}

        </div>

        <div class="release-desc">

            ${release.description}

        </div>

    </div>

    `;

}

function renderMuseumRecord(){

    return `

    <div class="museum-record">

        <h3>🏛 MUSEUM RECORD</h3>

        <div>

            🆔 Relic ID

            OSV-${String(releaseId+1).padStart(5,"0")}

        </div>

        <div>

            📜 Status

            PRESERVED

        </div>

        <div>

            🏆 Hall Rank

            #${releaseId+1}

        </div>

        <div>

            💀 Rarity

            ${release.genre}

        </div>

        <div>

            ❤️ Supporters

            ${release.supporters}

        </div>

        <div>

            🌍 Country

            ${release.country}

        </div>

    </div>

    `;

}
