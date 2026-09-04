Pi.init({
    version: "2.0",
    sandbox: true
});

let piAuth = null;

async function authenticatePiUser(){

    try{

        piAuth = await Pi.authenticate(
            ["username", "payments"],
            onIncompletePaymentFound
        );

        console.log(
            "Pi user authenticated:",
            piAuth.user.username
        );

        return piAuth;

    }catch(error){

        console.error(
            "Pi authentication failed:",
            error
        );

        return null;
    }
}

function onIncompletePaymentFound(payment){

    console.log(
        "Incomplete Pi payment found:",
        payment
    );

}

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

        let visitedReleases =
    JSON.parse(
        localStorage.getItem("ossvariumVisitedReleases") || "[]"
    );

if (!visitedReleases.includes(releaseId)) {
    visitedReleases.push(releaseId);

    localStorage.setItem(
        "ossvariumVisitedReleases",
        JSON.stringify(visitedReleases)
    );
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

        renderArtistBio() +
 
        renderTracklist() +

        renderSimilarArtists();

        initializePlayer();

        initializePurchasePanel();
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

        ${JSON.parse(
        localStorage.getItem("ossvariumCollection") || "[]"
        ).includes(releaseId)

        ? `

        <button
        class="certificate-btn collected-btn"
        disabled>

        ✓ RELIC COLLECTED

        </button>

        `

        : `

        <button
        class="certificate-btn"
        onclick="addToCollection(${releaseId})">

        ⚔ ADD TO COLLECTION

        </button>

        `}

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

function renderSimilarArtists(){

    return `
        <div class="submission-box">

            <h2>YOU MAY ALSO LIKE</h2>

            <div class="submission-text">

                ${
                    release.similar && release.similar.length
                    ?
                    release.similar.map(artist => `
                        <a
                            href="artist.html?artist=${encodeURIComponent(artist)}"
                            class="similar-link">
                            ${artist}
                        </a>
                    `).join("<br>")
                    :
                    "No similar artists"
                }

            </div>

        </div>
    `;
}

function renderTracklist(){

    if(
        !release.tracks ||
        !release.tracks.length
    ){
        return "";
    }

    return `
        <div class="submission-box">

            <h2>🎵 TRACKLIST</h2>

            <div class="submission-text">

                ${release.tracks.map(
    (track, index) => {

        const hasAudio =
            typeof track === "object" &&
            track.audio;

        const isForSale =
            typeof track === "object" &&
            track.forSale;

        const pricePi =
            typeof track === "object" &&
            track.pricePi;

        const trackTitle =
            typeof track === "object"
            ? track.title
            : track;

        return `
            <div class="track-entry">

                <button
                    class="track-play ${hasAudio ? "active" : "disabled"}"
                    type="button"
                    ${hasAudio ? `data-audio="${track.audio}"` : "disabled"}>
                    ▶
                </button>

                <span class="track-number">
                    ${String(index + 1).padStart(2, "0")}
                </span>

                <span class="track-title">
                    ${trackTitle}
                </span>  

                <span class="track-time">
                    ${hasAudio ? "0:00 / 0:00" : "--:--"}
                </span>

                ${isForSale ? `
                    <button
                        class="track-buy-btn"
                        type="button"
                        data-track-title="${trackTitle}"
                        data-price-pi="${pricePi}">
                        BUY TRACK · ${pricePi} π
                    </button>
                ` : ''}

                <div class="track-progress">
                    <div class="track-progress-fill"></div>
                </div>

                ${hasAudio ? `

                <div class="track-volume-wrap">

                    <span class="track-volume-icon">
                        🔊
                    </span>

                    <input
                        class="track-volume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value="1"
                    >
 
                </div>
            ` : ''}

            ${hasAudio ? `
    <canvas
        class="track-visualizer"
        width="360"
        height="50">
    </canvas>
` : ''}

         </div>
        `;          
    }
).join("")}

            </div>

        </div>
    `;
}

let currentAudio = null;
let currentButton = null;
let audioContext = null;
let analyser = null;
let audioSourceNode = null;
let visualizerAnimation = null;

function initializePlayer(){

    const playButtons =
        document.querySelectorAll(
            ".track-play.active"
        );

    playButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const audioSource =
                    button.dataset.audio;

                // Αν παίζει ήδη το ίδιο track
                if(
                    currentAudio &&
                    currentButton === button
                ){

                    if(currentAudio.paused){

                        currentAudio.play();
                        button.textContent = "❚❚";

                    }else{

                        currentAudio.pause();
                        button.textContent = "▶";

                    }

                    return;
                }

                // Αν παίζει άλλο track
                if(currentAudio){

                    currentAudio.pause();

                    if(currentButton){
                        currentButton.textContent = "▶";
                    }

                }

                currentAudio =
                    new Audio(audioSource);

                currentButton =
                    button;

                const trackEntry =
                    button.closest(".track-entry");

                const visualizer =
                    trackEntry.querySelector(".track-visualizer");

                if(visualizer){

    audioContext =
        new (
            window.AudioContext ||
            window.webkitAudioContext
        )();

    analyser =
        audioContext.createAnalyser();

    analyser.fftSize = 128;

    audioSourceNode =
        audioContext.createMediaElementSource(
            currentAudio
        );

    audioSourceNode.connect(analyser);
    analyser.connect(audioContext.destination);

    const visualizerCtx =
        visualizer.getContext("2d");

    const dataArray =
        new Uint8Array(
            analyser.frequencyBinCount
        );

    function drawTrackVisualizer(){

        visualizerAnimation =
            requestAnimationFrame(
                drawTrackVisualizer
            );

        analyser.getByteFrequencyData(
            dataArray
        );

        visualizerCtx.clearRect(
            0,
            0,
            visualizer.width,
            visualizer.height
        );

        const barWidth =
            visualizer.width /
            dataArray.length;

        dataArray.forEach(
            (value, index) => {

                const barHeight =
                    (value / 255) *
                    visualizer.height;

              const gradient =
    visualizerCtx.createLinearGradient(
        0,
        visualizer.height,
        0,
        visualizer.height - barHeight
    );

gradient.addColorStop(
    0,
    "#2a0505"
);

gradient.addColorStop(
    0.45,
    "#7d1717"
);

gradient.addColorStop(
    0.8,
    "#b52a2a"
);

gradient.addColorStop(
    1,
    "#e04444"
);

visualizerCtx.fillStyle =
    gradient;

visualizerCtx.shadowColor =
    "rgba(180,25,25,.65)";

visualizerCtx.shadowBlur =
    8;

visualizerCtx.fillRect(
    index * barWidth,
    visualizer.height - barHeight,
    Math.max(barWidth - 2, 1),
    barHeight
);
            }
        );
    }

    drawTrackVisualizer();
}

                currentAudio.play();

                button.textContent = "❚❚";

const timeDisplay =
    trackEntry.querySelector(".track-time");

const progressFill =
    trackEntry.querySelector(".track-progress-fill");

    const progressBar =
    trackEntry.querySelector(".track-progress");

    const volumeControl =
    trackEntry.querySelector(".track-volume");

    volumeControl.addEventListener(
    "input",
    () => {

        if(currentAudio){
            currentAudio.volume =
                Number(volumeControl.value);
        }

    }
);

function formatTime(seconds){

    if(!Number.isFinite(seconds)){
        return "0:00";
    }

    const minutes =
        Math.floor(seconds / 60);

    const secs =
        Math.floor(seconds % 60);

    return `${minutes}:${String(secs).padStart(2, "0")}`;
}

currentAudio.addEventListener(
    "loadedmetadata",
    () => {

        timeDisplay.textContent =
            `0:00 / ${formatTime(currentAudio.duration)}`;

    }
);

currentAudio.addEventListener(
    "timeupdate",
    () => {

        progressBar.addEventListener(
    "click",
    event => {

        const rect =
            progressBar.getBoundingClientRect();

        const clickX =
            event.clientX - rect.left;

        const percentage =
            clickX / rect.width;

        if(
            currentAudio &&
            Number.isFinite(currentAudio.duration)
        ){
            currentAudio.currentTime =
                percentage * currentAudio.duration;
        }

    }
);

        const current =
            currentAudio.currentTime;

        const duration =
            currentAudio.duration;

        timeDisplay.textContent =
            `${formatTime(current)} / ${formatTime(duration)}`;

        if(duration){

            const percentage =
                (current / duration) * 100;

            progressFill.style.width =
                `${percentage}%`;

        }

    }
);

                currentAudio.addEventListener(
                    "ended",
                    () => {

                        button.textContent = "▶";

                        currentAudio = null;
                        currentButton = null;

                    }
                );

            }
        );

    });

}

function initializePurchasePanel(){

    const buyButtons =
        document.querySelectorAll(".track-buy-btn");

    buyButtons.forEach(button => {

        button.addEventListener("click", () => {

            const trackTitle =
                button.dataset.trackTitle;

            const pricePi =
                button.dataset.pricePi;

            const overlay =
                document.createElement("div");

            overlay.className =
                "purchase-overlay";

            overlay.innerHTML = `
                <div class="purchase-panel">

                    <div class="purchase-symbol">
                        ✦
                    </div>

                    <h2>
                        ACQUIRE RELIC
                    </h2>

                    <div class="purchase-track">
                        ${trackTitle}
                    </div>

                    <div class="purchase-price">
                        ${pricePi} π
                    </div>

                    <button
                        class="purchase-pay-btn"
                        type="button">
                        PAY WITH PI
                    </button>

                    <button
                        class="purchase-close-btn"
                        type="button">
                        CANCEL
                    </button>

                </div>
            `;

            document.body.appendChild(
                overlay
            );

            overlay
                .querySelector(".purchase-close-btn")
                .addEventListener(
                    "click",
                    () => {
                        overlay.remove();
                    }
                );

        });

    });

}

function addToCollection(id) {

    let collection =
        JSON.parse(
            localStorage.getItem(
                "ossvariumCollection"
            ) || "[]"
        );

    if (!collection.includes(id)) {

        collection.push(id);

        localStorage.setItem(
            "ossvariumCollection",
            JSON.stringify(collection)
        );

        renderPage();

        alert(
            "ADDED TO YOUR COLLECTION"
        );

    } else {

        alert(
            "ALREADY IN COLLECTION"
        );

    }
}