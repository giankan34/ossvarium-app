// =========================================================
// OSSVARIUM: CATACOMB FREQUENCY (66.6 MHz) & THE CRYPT ORACLE
// Public underground music discovery & streaming module
// =========================================================

let freqAudio = null;
let freqCurrentRelease = null;
let freqCurrentTrack = null;
let freqAudioUrl = null;
let freqIsTuning = false;
let freqIsPlaying = false;
let freqAnalyser = null;
let freqAudioContext = null;

// ---------------------------------
// 1. CANVAS VISUALIZER SETUP
// ---------------------------------
const canvas = document.getElementById("visualizer");
let ctx = null;

if (canvas) {
    ctx = canvas.getContext("2d");

    function resizeCanvas() {
        canvas.width = canvas.offsetWidth || 300;
        canvas.height = canvas.offsetHeight || 110;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const bars = [];
    const barCount = 42;
    for (let i = 0; i < barCount; i++) {
        bars.push({ height: 15 });
    }

    let isVisible = true;
    let animFrameId = null;

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                isVisible = entry.isIntersecting;
                if (isVisible && !animFrameId) {
                    animFrameId = requestAnimationFrame(animate);
                }
            });
        }, { threshold: 0.05 });
        observer.observe(canvas);
    }

    function animate() {
        animFrameId = null;
        if (!isVisible || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = canvas.width / bars.length;
        const now = Date.now() * 0.002;

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (freqIsTuning) {
            gradient.addColorStop(0, "#ffffff");
            gradient.addColorStop(0.4, "#ff7777");
            gradient.addColorStop(1, "#330808");
        } else if (freqIsPlaying) {
            gradient.addColorStop(0, "#ff3b3b");
            gradient.addColorStop(0.6, "#aa1a1a");
            gradient.addColorStop(1, "#1e0404");
        } else {
            gradient.addColorStop(0, "#882828");
            gradient.addColorStop(0.7, "#3b1212");
            gradient.addColorStop(1, "#120606");
        }
        ctx.fillStyle = gradient;

        let freqData = null;
        if (freqAnalyser && freqIsPlaying) {
            try {
                freqData = new Uint8Array(freqAnalyser.frequencyBinCount);
                freqAnalyser.getByteFrequencyData(freqData);
            } catch (e) {
                freqData = null;
            }
        }
        const hasRealFreq = freqData && freqData.some(v => v > 0);

        for (let i = 0; i < bars.length; i++) {
            let h = 12;

            if (freqIsTuning) {
                h = 10 + Math.random() * (canvas.height * 0.85);
            } else if (freqIsPlaying) {
                if (hasRealFreq) {
                    const binIndex = Math.floor((i / bars.length) * (freqData.length * 0.65));
                    const ratio = freqData[binIndex] / 255;
                    h = Math.max(12, ratio * canvas.height * 0.95);
                } else {
                    const pulse = Math.sin(now * 3 + i * 0.5);
                    const subPulse = Math.cos(now * 1.5 + i * 0.25);
                    h = 24 + pulse * 28 + subPulse * 18 + Math.random() * 8;
                }
            } else {
                const pulse = Math.sin(now + i * 0.35);
                h = 14 + pulse * 10;
            }

            if (h < 6) h = 6;
            if (h > canvas.height) h = canvas.height;
            bars[i].height = h;

            const x = i * barWidth;
            const w = Math.max(2, barWidth - 3);
            const y = canvas.height - h;
            ctx.fillRect(x, y, w, h);
        }

        animFrameId = requestAnimationFrame(animate);
    }

    animFrameId = requestAnimationFrame(animate);
}

// ---------------------------------
// 2. HELPERS & FORMATTING
// ---------------------------------
function formatFrequencyTime(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ---------------------------------
// 3. AUDIO PLAYBACK & CONTROLS
// ---------------------------------
async function toggleFrequencyAudio() {
    if (!freqAudio) {
        if (!freqCurrentRelease) {
            await tuneCatacombFrequency();
        }
        return;
    }

    const btn = document.getElementById("oraclePlayBtn");
    const status = document.getElementById("frequencyStatus");

    if (freqAudio.paused) {
        try {
            if (!freqAudioContext) {
                const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
                if (AudioCtxClass) {
                    freqAudioContext = new AudioCtxClass();
                    if (freqAudioContext.state === "suspended") {
                        await freqAudioContext.resume();
                    }
                    try {
                        const source = freqAudioContext.createMediaElementSource(freqAudio);
                        freqAnalyser = freqAudioContext.createAnalyser();
                        freqAnalyser.fftSize = 64;
                        freqAnalyser.smoothingTimeConstant = 0.8;
                        source.connect(freqAnalyser);
                        freqAnalyser.connect(freqAudioContext.destination);
                    } catch (corsErr) {
                        console.warn("CATACOMB FREQUENCY: AudioContext fallback active.");
                    }
                }
            } else if (freqAudioContext.state === "suspended") {
                await freqAudioContext.resume();
            }

            await freqAudio.play();
            freqIsPlaying = true;
            if (btn) btn.innerHTML = "❚❚ PAUSE TRANSMISSION";
            if (status) status.textContent = "🔊 TRANSMITTING // 66.6 MHz";
        } catch (err) {
            console.error("☠ CATACOMB FREQUENCY PLAY ERROR:", err);
            if (status) status.textContent = "PLAYBACK ERROR • RE-TUNE VOID";
        }
    } else {
        freqAudio.pause();
        freqIsPlaying = false;
        if (btn) btn.innerHTML = "▶ LISTEN TO SAMPLE";
        if (status) status.textContent = "SIGNAL PAUSED // 66.6 MHz";
    }
}

function seekFrequencyAudio(event) {
    if (!freqAudio || !freqAudio.duration) return;
    const bar = document.getElementById("oracleProgressBar");
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    freqAudio.currentTime = ratio * freqAudio.duration;
}

// ---------------------------------
// 4. THE CRYPT ORACLE: TUNE VOID
// ---------------------------------
async function tuneCatacombFrequency() {
    const status = document.getElementById("frequencyStatus");
    const releaseBox = document.getElementById("signalRelease");

    if (freqIsTuning) return;
    freqIsTuning = true;

    if (freqAudio) {
        freqAudio.pause();
        freqAudio.currentTime = 0;
        freqIsPlaying = false;
    }

    if (status) status.textContent = "⚡ SCANNING THE VOID... [66.6 MHz]";
    if (releaseBox) {
        releaseBox.innerHTML = `
            <div class="oracle-tuning-placeholder">
                <div class="oracle-static-text">SUMMONING RELIC FROM THE CATACOMBS...</div>
            </div>
        `;
    }

    try {
        if (typeof loadOssvariumCatalog !== "function") {
            throw new Error("Catalog loader not found");
        }

        const releases = await loadOssvariumCatalog();
        if (!releases || !releases.length) {
            throw new Error("No approved relics in catalog");
        }

        await new Promise(resolve => setTimeout(resolve, 650));

        const randomIndex = Math.floor(Math.random() * releases.length);
        const release = releases[randomIndex];
        freqCurrentRelease = release;

        const tracks = Array.isArray(release.tracks) ? release.tracks : [];
        const playableTracks = tracks.filter(track => typeof track === "object" && track.audio);
        const selectedTrack = playableTracks.length > 0
            ? playableTracks[Math.floor(Math.random() * playableTracks.length)]
            : (tracks[0] || { title: release.release, audio: "" });

        freqCurrentTrack = selectedTrack;
        const trackTitle = typeof selectedTrack === "object" ? selectedTrack.title : selectedTrack;

        let streamUrl = "";
        try {
            const params = new URLSearchParams({
                relicId: release.relicId || String(randomIndex),
                trackTitle: trackTitle,
                mode: "stream"
            });

            const response = await fetch(`/api/my-purchases?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                streamUrl = data.audioUrl || "";
            }
        } catch (fetchError) {
            console.warn("CATACOMB FREQUENCY: Stream request failed", fetchError);
        }

        freqAudioUrl = streamUrl;
        freqAudio = streamUrl ? new Audio(streamUrl) : null;
        if (freqAudio) {
            freqAudio.preload = "metadata";

            freqAudio.addEventListener("timeupdate", () => {
                const current = freqAudio.currentTime || 0;
                const duration = freqAudio.duration || 0;
                const fill = document.getElementById("oracleProgressFill");
                const time = document.getElementById("oracleTime");

                if (fill && duration > 0) fill.style.width = `${(current / duration) * 100}%`;
                if (time) time.textContent = `${formatFrequencyTime(current)} / ${formatFrequencyTime(duration)}`;
            });

            freqAudio.addEventListener("ended", () => {
                freqIsPlaying = false;
                const button = document.getElementById("oraclePlayBtn");
                const fill = document.getElementById("oracleProgressFill");
                const stat = document.getElementById("frequencyStatus");
                if (button) button.innerHTML = "▶ LISTEN AGAIN";
                if (fill) fill.style.width = "0%";
                if (stat) stat.textContent = "BROADCAST COMPLETE • TUNE AGAIN";
            });

            freqAudio.addEventListener("pause", () => {
                freqIsPlaying = false;
            });
            freqAudio.addEventListener("play", () => {
                freqIsPlaying = true;
            });
        }

        const cover = release.cover || "./images/abominy-cover.jpg";
        const pricePi = release.pricePi ? `${release.pricePi} π` : "FREE";
        const relicId = release.relicId || String(randomIndex);
        const genre = release.genre || "UNDERGROUND";

        if (releaseBox) {
            releaseBox.innerHTML = `
                <div class="oracle-card">
                    <div class="oracle-badge-row">
                        <span class="oracle-pill">☠ SIGNAL LOCKED</span>
                        <span class="oracle-genre-pill">${escapeHtml(genre.toUpperCase())}</span>
                    </div>
                    <div class="oracle-body">
                        <img src="${escapeHtml(cover)}" class="oracle-thumb" alt="${escapeHtml(release.release || "Relic cover")}" loading="lazy" onerror="this.style.display='none'">
                        <div class="oracle-meta">
                            <div class="oracle-track-name">${escapeHtml(trackTitle)}</div>
                            <div class="oracle-artist-name">${escapeHtml(release.artist || "UNKNOWN")}</div>
                            <div class="oracle-album-name">${escapeHtml(release.release || "")}</div>
                        </div>
                    </div>
                    <div class="oracle-player-controls">
                        <button class="oracle-play-btn ${freqAudio ? "active" : "disabled"}" id="oraclePlayBtn" onclick="toggleFrequencyAudio()" ${freqAudio ? "" : "disabled"}>
                            ${freqAudio ? "▶ LISTEN TO SAMPLE" : "☠ AUDIO UNAVAILABLE"}
                        </button>
                        <span class="oracle-time" id="oracleTime">0:00 / 0:00</span>
                    </div>
                    <div class="oracle-progress-bar" id="oracleProgressBar" onclick="seekFrequencyAudio(event)" role="progressbar" aria-label="Audio progress">
                        <div class="oracle-progress-fill" id="oracleProgressFill" style="width:0%"></div>
                    </div>
                    <div class="oracle-actions-row">
                        <a class="submit-btn oracle-tomb-link" href="release.html?id=${encodeURIComponent(relicId)}">⚔ ENTER TOMB (${escapeHtml(pricePi)})</a>
                        <button class="oracle-retune-btn" onclick="tuneCatacombFrequency()">⚡ RE-TUNE VOID</button>
                    </div>
                </div>
            `;
        }

        if (status) status.textContent = "SIGNAL ACQUIRED // 66.6 MHz";
    } catch (error) {
        console.error("CATACOMB FREQUENCY ERROR:", error);
        if (status) status.textContent = "TRANSMISSION FAILED • RETRY";
        if (releaseBox) {
            releaseBox.innerHTML = `
                <div class="oracle-error">
                    <div>☠ NO SIGNAL FROM THE CATACOMBS ☠</div>
                    <button class="oracle-retune-btn" onclick="tuneCatacombFrequency()">⚡ TRY AGAIN</button>
                </div>
            `;
        }
    } finally {
        freqIsTuning = false;
    }
}

// Initial silent tune: load a track preview without autoplay.
window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => tuneCatacombFrequency(), 400);
});
