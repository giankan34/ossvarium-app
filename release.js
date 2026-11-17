Pi.init({
    version: "2.0"
});

let piAuth = null;

async function authenticatePiUser(){

    try{

        piAuth = await Pi.authenticate(
            ["username", "payments"],
            onIncompletePaymentFound
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

        releases =
    await loadOssvariumCatalog();

    
        const params =
        new URLSearchParams(
            window.location.search
        );

        const releaseParam =
    params.get("id") || "0";

if (
    releaseParam
        .toUpperCase()
        .startsWith("OSV-")
) {
    release =
        releases.find(item =>
            String(
                item.relicId || ""
            ).toUpperCase() ===
            releaseParam.toUpperCase()
        );

        if (release) {
    releaseId = releases.indexOf(release);
}

} else {
    releaseId =
        Number(releaseParam);

    release =
        releases[releaseId];
}

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

    async function renderPage(){

    releasePage.innerHTML =

        renderHeader() +

        renderMuseumRecord() +

        renderTimeline() +

        renderArtistBio() +
 
        renderTracklist() +

        renderSimilarArtists();

        initializePlayer();

       initializePurchasePanel();

       initializeArtistSupportButton();

       try {
    if (!piAuth?.accessToken) {
        piAuth = await authenticatePiUser();
    }

    if (piAuth?.accessToken) {
        await updateOwnedTracks();
    }
} catch (error) {
    console.error(
        "OSSVARIUM ownership initialization failed:",
        error
    );
}
}

function renderHeader(){

    return `

    <div class="release-card">

        ${Number(release.supporters) >= 30 ? `

        <div class="hall-relic">
            👑 HALL OF RELICS
        </div>

        ` : ""}

        ${release.cover ? `

    <img 
        class="release-cover" 
        src="${release.cover}" 
        alt="${release.release}"
        onerror="this.outerHTML='<div class=&quot;release-cover no-cover&quot;>☠ NO COVER ART ☠</div>'"
    >

` : `

    <div class="release-cover no-cover">
        ☠ NO COVER ART ☠
    </div>

`}

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
        ).includes(release.relicId)

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
        onclick="addToCollection('${release.relicId}')">

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
                ${release.relicId}
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

    const bio =
        release.bio &&
        release.bio.trim()
        ? release.bio
        : "No artist dossier has been submitted for this relic yet.";

    return `

    <div class="museum-card">

        <h3>🎤 ARTIST DOSSIER</h3>

        <p>

            ${bio}

        </p>

<button
    class="artist-support-btn"
    type="button">
    π SUPPORT ARTIST
</button>

</div>

    </div>

    `;

}

function renderSimilarArtists(){

    const currentGenre =
        String(release.genre || "")
            .trim()
            .toLowerCase();

    const similarReleases =
        releases
            .filter(item => {

                const itemGenre =
                    String(item.genre || "")
                        .trim()
                        .toLowerCase();

                const isCurrentRelease =
                    String(item.relicId || "") ===
                    String(release.relicId || "");

                return (
                    !isCurrentRelease &&
                    currentGenre &&
                    itemGenre === currentGenre
                );

            })
            .slice(0, 4);

    return `
        <div class="submission-box">

            <h2>YOU MAY ALSO LIKE</h2>

            <div class="submission-text">

                ${
                    similarReleases.length
                    ?
                    similarReleases.map(item => `
                        <a
                            href="release.html?id=${encodeURIComponent(item.relicId)}"
                            class="similar-link">
                            ${item.artist} — ${item.release}
                        </a>
                    `).join("<br>")
                    :
                    "No similar relics yet"
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

        const supportPi =
    typeof track === "object"
        ? Number(track.supportPi || 0)
        : 0;

const allowDownload =
    typeof track === "object" &&
    track.allowDownload === true;

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

${supportPi > 0 ? `
    <button
        class="track-buy-btn"
        type="button"
        data-track-title="${trackTitle}"
        data-price-pi="${supportPi}">
        π SUPPORT TRACK · ${supportPi} Pi
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

function initializePlayer() {

    const playButtons =
        document.querySelectorAll(
            ".track-play.active"
        );

    playButtons.forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                const trackEntry =
                    button.closest(".track-entry");

                const buyButton =
                    trackEntry.querySelector(
                        ".track-buy-btn"
                    );

                const trackTitle =
                    trackEntry
                        .querySelector(".track-title")
                        ?.textContent
                        ?.trim();

                        

                let audioSource =
                    button.dataset.audio;

                // ---------------------------------
                // PROTECTED / PRIVATE AUDIO
                // ---------------------------------

                if (
    audioSource?.startsWith("uploads/")
) {
    const protectedUrl =
        await getOwnedAudioUrl(
            release.relicId,
            trackTitle
        );

    if (!protectedUrl) {
        alert("Protected audio unavailable.");
        return;
    }

    audioSource = protectedUrl;
}
                // ---------------------------------
                // SAME TRACK — PLAY / PAUSE
                // ---------------------------------

                if (
                    currentAudio &&
                    currentButton === button
                ) {

                    if (currentAudio.paused) {

                        try {
                            await currentAudio.play();
                            button.textContent = "❚❚";
                        } catch (error) {

                            console.error(
                                "☠ AUDIO PLAY FAILED:",
                                error
                            );
                        }

                    } else {

                        currentAudio.pause();
                        button.textContent = "▶";
                    }

                    return;
                }

                // ---------------------------------
                // STOP PREVIOUS TRACK
                // ---------------------------------

                if (currentAudio) {

                    currentAudio.pause();

                    if (currentButton) {
                        currentButton.textContent = "▶";
                    }
                }

                // ---------------------------------
                // CREATE NORMAL HTML AUDIO
                // ---------------------------------

                const audio = new Audio();
                audio.crossOrigin = "anonymous";
                audio.src = audioSource;

                currentAudio = audio;
                currentButton = button;

                audio.muted = false;
                audio.volume = 1;
                audio.preload = "metadata";

                const timeDisplay =
                    trackEntry.querySelector(
                        ".track-time"
                    );

                const progressBar =
                    trackEntry.querySelector(
                        ".track-progress"
                    );

                const progressFill =
                    trackEntry.querySelector(
                        ".track-progress-fill"
                    );

                const volumeControl =
                    trackEntry.querySelector(
                        ".track-volume"
                    );

                const visualizer =
                    trackEntry.querySelector(
                        ".track-visualizer"
                    );

                // ---------------------------------
                // TIME FORMAT
                // ---------------------------------

                function formatTime(seconds) {

                    if (!Number.isFinite(seconds)) {
                        return "0:00";
                    }

                    const minutes =
                        Math.floor(seconds / 60);

                    const secs =
                        Math.floor(seconds % 60);

                    return (
                        `${minutes}:` +
                        String(secs).padStart(2, "0")
                    );
                }

                // ---------------------------------
                // METADATA / DURATION
                // ---------------------------------

                audio.addEventListener(
                    "loadedmetadata",
                    () => {

                        timeDisplay.textContent =
                            `0:00 / ${formatTime(audio.duration)}`;
                    }
                );

                // ---------------------------------
                // TIME + PROGRESS
                // ---------------------------------

                audio.addEventListener(
                    "timeupdate",
                    () => {

                        const current =
                            audio.currentTime;

                        const duration =
                            audio.duration;

                        timeDisplay.textContent =
                            `${formatTime(current)} / ${formatTime(duration)}`;

                        if (
                            Number.isFinite(duration) &&
                            duration > 0
                        ) {

                            const percentage =
                                (current / duration) * 100;

                            progressFill.style.width =
                                `${percentage}%`;
                        }
                    }
                );

                // ---------------------------------
                // SEEK
                // ---------------------------------

                progressBar.addEventListener(
                    "click",
                    event => {

                        if (
                            !Number.isFinite(audio.duration) ||
                            audio.duration <= 0
                        ) {
                            return;
                        }

                        const rect =
                            progressBar
                                .getBoundingClientRect();

                        const percentage =
                            Math.min(
                                1,
                                Math.max(
                                    0,
                                    (event.clientX - rect.left) /
                                    rect.width
                                )
                            );

                        audio.currentTime =
                            percentage * audio.duration;
                    }
                );

                // ---------------------------------
                // VOLUME
                // ---------------------------------

                if (volumeControl) {

                    volumeControl.value = "1";

                    volumeControl.addEventListener(
                        "input",
                        () => {

                            audio.volume =
                                Number(
                                    volumeControl.value
                                );
                        }
                    );
                }

                                // ---------------------------------
                // REAL-TIME AUDIO VISUALIZER
                // ---------------------------------

                let analyser = null;
                try {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (AudioContextClass) {
                        if (!window._ossvariumAudioCtx) {
                            window._ossvariumAudioCtx = new AudioContextClass();
                        }
                        if (window._ossvariumAudioCtx.state === "suspended") {
                            window._ossvariumAudioCtx.resume();
                        }
                        const source = window._ossvariumAudioCtx.createMediaElementSource(audio);
                        analyser = window._ossvariumAudioCtx.createAnalyser();
                        analyser.fftSize = 64;
                        analyser.smoothingTimeConstant = 0.8;
                        source.connect(analyser);
                        analyser.connect(window._ossvariumAudioCtx.destination);
                    }
                } catch (e) {
                    console.warn("Real-time visualizer fallback:", e);
                }

                if (visualizer) {
                    const ctx = visualizer.getContext("2d");
                    const audioForVisualizer = audio;

                    function drawVisualizer() {
                        if (currentAudio !== audioForVisualizer) {
                            ctx.clearRect(0, 0, visualizer.width, visualizer.height);
                            return;
                        }

                        ctx.clearRect(0, 0, visualizer.width, visualizer.height);

                        if (!audioForVisualizer.paused) {
                            const bars = 24;
                            const gap = 2;
                            const barWidth = (visualizer.width - gap * (bars - 1)) / bars;

                            let freqData = null;
                            if (analyser) {
                                freqData = new Uint8Array(analyser.frequencyBinCount);
                                analyser.getByteFrequencyData(freqData);
                            }

                            const hasRealData = freqData && freqData.some(v => v > 0);

                            for (let i = 0; i < bars; i++) {
                                let ratio = 0;
                                if (hasRealData) {
                                    // Χαμηλές συχνότητες (μπάσο/kick) αριστερά, πρίμα δεξιά
                                    const binIndex = Math.min(i, freqData.length - 1);
                                    ratio = freqData[binIndex] / 255;
                                } else {
                                    ratio = (Math.sin(Date.now() / 160 + i * 0.75) + 1) / 2;
                                }

                                                               const barHeight = Math.max(4, ratio * visualizer.height * 0.95);
                                const x = i * (barWidth + gap);
                                const y = visualizer.height - barHeight;
                                const r = Math.min(barWidth / 2, barHeight / 2);

                                // Διαβάθμιση πηγμένου/υγρού αίματος
                                const gradient = ctx.createLinearGradient(0, visualizer.height, 0, y);
                                gradient.addColorStop(0, "#160002");    // Πηγμένο βαθύ κόκκινο στη βάση
                                gradient.addColorStop(0.4, "#66000c");  // Σκούρο κόκκινο αίματος
                                gradient.addColorStop(0.85, "#b80b1e"); // Ζωηρό αρτηριακό αίμα
                                gradient.addColorStop(1, "#f02235");    // Έντονο φρέσκο αίμα στην κορυφή

                                ctx.fillStyle = gradient;
                                ctx.beginPath();
                                if (ctx.roundRect) {
                                    ctx.roundRect(x, y, barWidth, barHeight, [r, r, 0, 0]);
                                } else {
                                    ctx.moveTo(x, visualizer.height);
                                    ctx.lineTo(x, y + r);
                                    ctx.quadraticCurveTo(x, y, x + r, y);
                                    ctx.lineTo(x + barWidth - r, y);
                                    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
                                    ctx.lineTo(x + barWidth, visualizer.height);
                                    ctx.closePath();
                                }
                                ctx.fill();

                                // Υγρή λάμψη (wet specular gloss) στην κορυφή της σταγόνας
                                if (barHeight > 10) {
                                    ctx.fillStyle = "rgba(255, 190, 190, 0.4)";
                                    ctx.beginPath();
                                    ctx.arc(x + barWidth / 2, y + r * 0.8, Math.max(1, r * 0.35), 0, Math.PI * 2);
                                    ctx.fill();
                                }

                            }
                        }

                        requestAnimationFrame(drawVisualizer);
                    }

                    drawVisualizer();
                }


                // ---------------------------------
                // ENDED
                // ---------------------------------

                audio.addEventListener(
                    "ended",
                    () => {

                        button.textContent = "▶";

                        progressFill.style.width =
                            "0%";

                        timeDisplay.textContent =
                            `0:00 / ${formatTime(audio.duration)}`;

                        if (currentAudio === audio) {
                            currentAudio = null;
                            currentButton = null;
                        }
                    }
                );

                // ---------------------------------
                // PLAY
                // ---------------------------------

                try {

                    await audio.play();

                    button.textContent = "❚❚";

                } catch (error) {

                    console.error(
                        "☠ OSSVARIUM AUDIO FAILED:",
                        error
                    );

                    button.textContent = "▶";

                    if (currentAudio === audio) {
                        currentAudio = null;
                        currentButton = null;
                    }

                    alert(
                        "Audio playback failed.\n\n" +
                        error.message
                    );
                }
            }
        );
    });

    

    const downloadButtons =
        document.querySelectorAll(
            ".track-download-btn"
        );

    downloadButtons.forEach(
        downloadButton => {

            downloadButton.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    const trackEntry =
                        downloadButton.closest(
                            ".track-entry"
                        );

                    const trackTitle =
                        trackEntry
                            ?.querySelector(
                                ".track-title"
                            )
                            ?.textContent
                            ?.trim();

                    if (!trackTitle) {
                        return;
                    }

                    await downloadOwnedTrack(
                        trackTitle
                    );
                }
            );
        }
    );
}

async function loadMyPurchases() {

    if (!piAuth?.accessToken) {
        return [];
    }

    try {

        const response = await fetch(
            "/api/my-purchases?mode=purchases",
            {
                headers: {
                    Authorization:
                        `Bearer ${piAuth.accessToken}`
                }
            }
        );

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                "Failed to load purchases"
            );
        }

        return result.purchases || [];

    } catch (error) {

        console.error(
            "OSSVARIUM ownership check error:",
            error
        );

        return [];
    }
}

async function getOwnedAudioUrl(
    relicId,
    trackTitle
) {

    try {

        const params =
            new URLSearchParams({
                relicId: relicId,
                trackTitle: trackTitle
            });

        const response = await fetch(
            `/api/my-purchases?${params.toString()}`,
            {
                headers: piAuth?.accessToken
    ? {
        Authorization:
            `Bearer ${piAuth.accessToken}`
    }
    : {}
            }
        );

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                "Protected audio unavailable"
            );
        }

        return result.audioUrl || null;

    } catch (error) {

        console.error(
            "OSSVARIUM protected audio error:",
            error
        );

        return null;
    }
}

async function updateOwnedTracks() {

    if (!piAuth?.accessToken) {
        return;
    }

    const purchases =
        await loadMyPurchases();

    const buyButtons =
    document.querySelectorAll(
        ".track-buy-btn"
    );

    buyButtons.forEach(button => {

        const trackTitle =
            button.dataset.trackTitle;

        const purchase =
            purchases.find(
                item =>
                    item.relic_id === release.relicId &&
                    item.track_title === trackTitle
            );

        // ---------------------------------
        // NOT PURCHASED
        // Keep SUPPORT TRACK button
        // ---------------------------------

        if (!purchase) {
            return;
        }

        const trackEntry =
            button.closest(
                ".track-entry"
            );

        if (!trackEntry) {
            return;
        }

        // ---------------------------------
        // PURCHASED
        // SUPPORT button must disappear
        // ---------------------------------

                button.remove();

        // Show RELIC OWNED label
        if (
            !trackEntry.querySelector(
                ".track-owned-label"
            )
        ) {
            const ownedLabel =
                document.createElement("span");

            ownedLabel.className =
                "track-owned-label";

            ownedLabel.textContent =
                "☠ RELIC OWNED ☠";

            trackEntry.appendChild(
                ownedLabel
            );
        }

        // ---------------------------------
        // PURCHASED + DOWNLOAD AVAILABLE
        // Allow downloading anytime for verified owner
        // ---------------------------------

        const track =
            release.tracks.find(
                item =>
                    typeof item === "object" &&
                    item.title === trackTitle
            );

        if (!track || track.allowDownload !== true) {
            return;
        }

        if (
            trackEntry.querySelector(
                ".track-download-btn"
            )
        ) {
            return;
        }

        const downloadButton =
            document.createElement(
                "button"
            );

        downloadButton.type =
            "button";

        downloadButton.className =
            "track-download-btn";

        downloadButton.dataset.trackTitle =
            trackTitle;

        downloadButton.textContent =
            "☠ DOWNLOAD RELIC ☠";

        trackEntry.appendChild(
            downloadButton
        );

        downloadButton.addEventListener(
            "click",
            async () => {

                downloadButton.disabled =
                    true;

                downloadButton.textContent =
                    "☠ PREPARING RELIC... ☠";

                await downloadOwnedTrack(
                    trackTitle
                );

                setTimeout(() => {
                    downloadButton.disabled =
                        false;

                    downloadButton.textContent =
                        "☠ DOWNLOAD RELIC ☠";
                }, 3000);
            }
        );

            });
}



async function downloadOwnedTrack(trackTitle) {

    try {

        if (!piAuth?.accessToken) {
    piAuth = await authenticatePiUser();
}

if (!piAuth?.accessToken) {
    throw new Error("Pi authentication required");
}
        
        const params =
            new URLSearchParams({
                relicId:
                    release.relicId,
                trackTitle:
                    trackTitle,
                mode:
                    "download"
            });

        // ---------------------------------
        // REQUEST SECURE DOWNLOAD TICKET
        // ---------------------------------

        const response =
            await fetch(
                `/api/my-purchases?${params.toString()}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${piAuth.accessToken}`
                    },
                    cache: "no-store"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Download authorization failed"
            );
        }

        if (!data.downloadUrl) {
            throw new Error(
                "Download URL not received"
            );
        }

        // ---------------------------------
        // REAL BROWSER DOWNLOAD
        // ---------------------------------

        window.location.href =
            data.downloadUrl;

            return true;

    } catch (error) {

        console.error(
            "☠ OSSVARIUM DOWNLOAD ERROR:",
            error
        );

        alert(
            "Download failed.\n\n" +
            error.message
        );

        return false;
    }
}

function createArtistSupportPayment(
    supportPi,
    trackTitle,
    relicId
) {
    const amount = Number(supportPi);

    if (!amount || amount <= 0) {
        alert("Invalid support amount.");
        return;
    }

    Pi.createPayment(
        {
            amount: amount,
            memo: trackTitle
    ? `OSSVARIUM Track Support: ${trackTitle}`
    : "OSSVARIUM Artist Support",

metadata: {
    purpose: "artist_support",
    relicId: relicId,
    trackTitle: trackTitle || ""
}
        },
        {
            onReadyForServerApproval: async function (paymentId) {
                const response = await fetch(
                    "/api/approve-payment",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            paymentId: paymentId
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Support payment approval failed"
                    );
                }
            },

            onReadyForServerCompletion: async function (
                paymentId,
                txid
            ) {
                const response = await fetch(
                    "/api/complete-payment",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            paymentId: paymentId,
                            txid: txid
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Support payment completion failed"
                    );
                }

                alert(
                    `☠ ARTIST SUPPORTED ☠\n\n${trackTitle}\n${amount} π`
                );
            },

            onCancel: function (paymentId) {
                
            },

            onError: function (error, payment) {
                console.error(
                    "Artist support payment error:",
                    error,
                    payment
                );

                alert(
                    "Artist support payment failed.\n\n" +
                    (error.message || error)
                );
            }
        }
    );
}

function initializeSupportButtons() {
    const supportButtons =
        document.querySelectorAll(".track-support-btn");

    supportButtons.forEach(button => {
        button.addEventListener("click", async () => {

            const trackTitle =
                button.dataset.trackTitle || "";

            const supportPi =
                Number(button.dataset.supportPi || 0);

            if (!trackTitle) {
                alert("Track title is missing.");
                return;
            }

            if (!supportPi || supportPi <= 0) {
                alert("Invalid track price.");
                return;
            }

            try {
                // Authenticate only when needed
                if (!piAuth?.accessToken) {
                    piAuth = await authenticatePiUser();
                }

                if (!piAuth?.accessToken) {
                    throw new Error("Pi authentication required");
                }

                button.disabled = true;
                const originalText = button.textContent;
                button.textContent = "π PREPARING RELIC...";

                Pi.createPayment(
                    {
                        amount: supportPi,
                        memo: `OSSVARIUM Track Purchase: ${trackTitle}`,
                        metadata: {
                            purpose: "track_purchase",
                            relicId: release.relicId,
                            trackTitle: trackTitle
                        }
                    },
                    {
                        onReadyForServerApproval: async function (paymentId) {
                            const response = await fetch(
                                "/api/approve-payment",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        paymentId: paymentId
                                    })
                                }
                            );

                            if (!response.ok) {
                                throw new Error(
                                    "Track payment approval failed"
                                );
                            }
                        },

                        onReadyForServerCompletion: async function (
                            paymentId,
                            txid
                        ) {
                            const response = await fetch(
                                "/api/complete-payment",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        paymentId: paymentId,
                                        txid: txid
                                    })
                                }
                            );

                            const result = await response.json();

                            if (!response.ok) {
                                throw new Error(
                                    result.error ||
                                    "Track payment completion failed"
                                );
                            }

                            alert(
                                `☠ RELIC ACQUIRED ☠\n\n${trackTitle}\n${supportPi} π`
                            );

                            // Reload purchases from DB.
                            // updateOwnedTracks() will remove SUPPORT TRACK
                            // and show DOWNLOAD RELIC.
                            await updateOwnedTracks();
                        },

                        onCancel: function (paymentId) {
                            console.log(
                                "Track purchase cancelled:",
                                paymentId
                            );

                            button.disabled = false;
                            button.textContent =
                                `π SUPPORT TRACK · ${supportPi} Pi`;
                        },

                        onError: function (error, payment) {
                            console.error(
                                "Track purchase payment error:",
                                error,
                                payment
                            );

                            button.disabled = false;
                            button.textContent =
                                `π SUPPORT TRACK · ${supportPi} Pi`;

                            alert(
                                "Track purchase failed.\n\n" +
                                (error.message || error)
                            );
                        }
                    }
                );

            } catch (error) {
                console.error(
                    "OSSVARIUM TRACK PURCHASE ERROR:",
                    error
                );

                button.disabled = false;
                button.textContent =
                    `π SUPPORT TRACK · ${supportPi} Pi`;

                alert(
                    "Track purchase failed.\n\n" +
                    error.message
                );
            }
        });
    });
}

function initializeArtistSupportButton() {
    const button =
        document.querySelector(".artist-support-btn");

    if (!button) {
        return;
    }

    button.addEventListener("click", () => {
        const creatorPiUid =
            release?.creator_pi_uid ||
            release?.creatorPiUid ||
            "";

        if (!creatorPiUid) {
            alert(
                "Artist support is not available yet. " +
                "The artist needs to connect a Pi account first."
            );
            return;
        }

        const amountText =
            prompt(
                "Enter the amount of Pi you want to support the artist with:"
            );

        if (amountText === null) {
            return;
        }

        const amount =
            Number(amountText);

        if (!amount || amount <= 0) {
            alert("Invalid support amount.");
            return;
        }

        createArtistSupportPayment(
            amount,
            "",
            release.relicId
        );
    });
}

function initializePurchasePanel(){

    const buyButtons =
        document.querySelectorAll(".track-buy-btn");

    buyButtons.forEach(button => {

        button.addEventListener("click", async () => {

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

                overlay
    .querySelector(".purchase-pay-btn")
    .addEventListener("click", async () => {

        if (!piAuth) {
            piAuth = await authenticatePiUser();
        }

        if (!piAuth) {
            alert("Pi authentication is required.");
            return;
        }

        const finalPricePi = Number(pricePi);

        if (!finalPricePi || finalPricePi <= 0) {
            alert("Invalid track price.");
            return;
        }

        Pi.createPayment(
            {
                amount: finalPricePi,
                memo: `OSSVARIUM Track Purchase: ${trackTitle}`,
                metadata: {
                    purpose: "track_purchase",
                    relicId: release.relicId,
                    trackTitle: trackTitle
                }
            },
            {
                onReadyForServerApproval: async function (paymentId) {
                    const response = await fetch(
                        "/api/approve-payment",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                paymentId: paymentId
                            })
                        }
                    );

                    if (!response.ok) {
                        throw new Error(
                            "Track payment approval failed"
                        );
                    }
                },

                onReadyForServerCompletion: async function (
                    paymentId,
                    txid
                ) {
                    const response = await fetch(
                        "/api/complete-payment",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                paymentId: paymentId,
                                txid: txid
                            })
                        }
                    );

                    if (!response.ok) {
                        throw new Error(
                            "Track payment completion failed"
                        );
                    }

                    alert(
                        `☠ RELIC ACQUIRED ☠\n\n${trackTitle}\n${finalPricePi} π`
                    );

                    overlay.remove();

                    await updateOwnedTracks();
                },

                onCancel: function () {},

                onError: function (error, payment) {
                    console.error(
                        "Track purchase payment error:",
                        error,
                        payment
                    );

                    alert(
                        "Track purchase failed.\n\n" +
                        (error.message || error)
                    );
                }
            }
        );
    });

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