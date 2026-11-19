// =========================================================
// OSSVARIUM: CATACOMB FREQUENCY (66.6 MHz) & THE CRYPT ORACLE
// Public underground music discovery & streaming module
// Features: Real-time Audio Visualizer, Occult Static Radio Tuning,
// and Listen & Earn / Discover Quest with Catacomb XP rewards
// =========================================================

let freqAudio = null;
let freqCurrentRelease = null;
let freqCurrentTrack = null;
let freqAudioUrl = null;
let freqIsTuning = false;
let freqIsPlaying = false;
let freqAnalyser = null;
let freqAudioContext = null;
let freqMediaSource = null;

// Quest state (20s listening quest)
let freqListeningSeconds = 0;
const QUEST_TARGET_SECONDS = 20;
let freqQuestCompleted = false;
let freqListeningInterval = null;

// ---------------------------------
// 1. DEDICATED AUDIO ELEMENT WITH CORS
// ---------------------------------
function getOrCreateFrequencyAudio() {
    if (!freqAudio) {
        freqAudio = document.getElementById("catacombFrequencyAudio");
        if (!freqAudio) {
            freqAudio = document.createElement("audio");
            freqAudio.id = "catacombFrequencyAudio";
            freqAudio.crossOrigin = "anonymous";
            freqAudio.preload = "metadata";
            document.body.appendChild(freqAudio);
        }

        freqAudio.addEventListener("timeupdate", () => {
            const current = freqAudio.currentTime || 0;
            const duration = freqAudio.duration || 0;
            const fill = document.getElementById("oracleProgressFill");
            const time = document.getElementById("oracleTime");

            if (fill && duration > 0) fill.style.width = `${(current / duration) * 100}%`;
            if (time) time.textContent = `${formatFrequencyTime(current)} / ${formatFrequencyTime(duration)}`;
        });

        freqAudio.addEventListener("play", () => {
            freqIsPlaying = true;
            startQuestTimer();
            const btn = document.getElementById("oraclePlayBtn");
            const status = document.getElementById("frequencyStatus");
            if (btn) btn.innerHTML = "❚❚ PAUSE TRANSMISSION";
            if (status) status.textContent = "🔊 TRANSMITTING // 66.6 MHz";
        });

        freqAudio.addEventListener("pause", () => {
            freqIsPlaying = false;
            stopQuestTimer();
            const btn = document.getElementById("oraclePlayBtn");
            const status = document.getElementById("frequencyStatus");
            if (btn) btn.innerHTML = "▶ LISTEN TO SAMPLE";
            if (status) status.textContent = "SIGNAL PAUSED // 66.6 MHz";
        });

        freqAudio.addEventListener("ended", () => {
            freqIsPlaying = false;
            stopQuestTimer();
            const button = document.getElementById("oraclePlayBtn");
            const fill = document.getElementById("oracleProgressFill");
            const stat = document.getElementById("frequencyStatus");
            if (button) button.innerHTML = "▶ LISTEN AGAIN";
            if (fill) fill.style.width = "0%";
            if (stat) stat.textContent = "BROADCAST COMPLETE • TUNE AGAIN";
        });
    }
    return freqAudio;
}

// ---------------------------------
// 2. OCCULT RADIO STATIC TUNING SOUND (WEB AUDIO API)
// ---------------------------------
function playOccultTuningSound() {
    try {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtxClass) return;

        if (!freqAudioContext) {
            freqAudioContext = new AudioCtxClass();
        }
        if (freqAudioContext.state === "suspended") {
            freqAudioContext.resume();
        }

        const ctx = freqAudioContext;
        const now = ctx.currentTime;
        const duration = 0.95;

        // 1. White Noise Generator (Radio static)
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.7;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass Filter sweeping frequency like analog radio dial
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(250, now);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 0.45);
        filter.frequency.exponentialRampToValueAtTime(450, now + duration);
        filter.Q.value = 4.0;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.28, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + duration);

        // 2. Low-frequency occult hum (catacomb resonance)
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(55, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.4);
        osc.frequency.exponentialRampToValueAtTime(45, now + duration);

        const oscFilter = ctx.createBiquadFilter();
        oscFilter.type = "lowpass";
        oscFilter.frequency.value = 200;

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.2, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(oscFilter);
        oscFilter.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    } catch (e) {
        console.warn("Occult tuning sound fallback:", e);
    }
}

// ---------------------------------
// 3. LISTEN & EARN QUEST LOGIC
// ---------------------------------
function startQuestTimer() {
    if (freqListeningInterval) clearInterval(freqListeningInterval);

    freqListeningInterval = setInterval(() => {
        if (!freqIsPlaying || freqQuestCompleted) return;

        freqListeningSeconds++;
        updateQuestUI();

        if (freqListeningSeconds >= QUEST_TARGET_SECONDS) {
            completeListenQuest();
        }
    }, 1000);
}

function stopQuestTimer() {
    if (freqListeningInterval) {
        clearInterval(freqListeningInterval);
        freqListeningInterval = null;
    }
}

function updateQuestUI() {
    const status = document.getElementById("oracleQuestStatus");
    const fill = document.getElementById("oracleQuestFill");
    if (status && !freqQuestCompleted) {
        status.textContent = `${Math.min(freqListeningSeconds, QUEST_TARGET_SECONDS)} / ${QUEST_TARGET_SECONDS}s`;
    }
    if (fill && !freqQuestCompleted) {
        const pct = Math.min(100, Math.floor((freqListeningSeconds / QUEST_TARGET_SECONDS) * 100));
        fill.style.width = `${pct}%`;
    }
}

function completeListenQuest() {
    freqQuestCompleted = true;
    stopQuestTimer();

    // Reward Catacomb XP & Achievement
    try {
        if (typeof unlockAchievement === "function") {
            unlockAchievement("ORACLE DEVOTEE");
        } else {
            const achievements = JSON.parse(localStorage.getItem("ossvariumAchievements") || "[]");
            if (!achievements.includes("ORACLE DEVOTEE")) {
                achievements.push("ORACLE DEVOTEE");
                localStorage.setItem("ossvariumAchievements", JSON.stringify(achievements));
            }
        }

        // Increment Oracle Streak count
        const currentStreak = parseInt(localStorage.getItem("ossvariumOracleStreak") || "0", 10);
        localStorage.setItem("ossvariumOracleStreak", currentStreak + 1);

        // Add 5 bonus XP to local storage
        let questXP = parseInt(localStorage.getItem("ossvariumOracleBonusXP") || "0", 10);
        questXP += 5;
        localStorage.setItem("ossvariumOracleBonusXP", questXP);

        if (typeof loadCatacombLevel === "function") {
            loadCatacombLevel();
        }
    } catch (err) {
        console.warn("Quest reward save error:", err);
    }

    const box = document.getElementById("oracleQuestBox");
    if (box) {
        box.classList.add("completed");
        box.innerHTML = `
            <div class="oracle-quest-complete-badge">
                <span class="quest-star">⛧</span>
                <b>QUEST COMPLETED: +5 CATACOMB XP</b>
                <span class="quest-star">⛧</span>
            </div>
            <div class="oracle-quest-reward-sub">
                ARCHIVED IN SOUL: TITLE UNLOCKED [ORACLE DEVOTEE]
            </div>
        `;
    }
}

// ---------------------------------
// 4. CANVAS VISUALIZER (RESPONDS TO REAL FREQUENCIES)
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
    const barCount = 36;
    for (let i = 0; i < barCount; i++) {
        bars.push({ height: 12 });
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
            gradient.addColorStop(0.3, "#ff5555");
            gradient.addColorStop(1, "#330808");
        } else if (freqIsPlaying) {
            gradient.addColorStop(0, "#ff3b3b");
            gradient.addColorStop(0.5, "#b51c1c");
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
            let h = 10;

            if (freqIsTuning) {
                h = 10 + Math.random() * (canvas.height * 0.85);
            } else if (freqIsPlaying) {
                if (hasRealFreq) {
                    // Map bars across spectrum: bass (left) to treble (right)
                    const binIndex = Math.min(Math.floor((i / bars.length) * freqData.length), freqData.length - 1);
                    const ratio = freqData[binIndex] / 255;
                    const boost = 1 + (i / bars.length) * 0.6;
                    h = Math.max(8, ratio * canvas.height * 0.95 * boost);
                } else {
                    const pulse = Math.sin(now * 3 + i * 0.5);
                    const subPulse = Math.cos(now * 1.5 + i * 0.25);
                    h = 20 + pulse * 24 + subPulse * 16 + Math.random() * 6;
                }
            } else {
                const pulse = Math.sin(now + i * 0.35);
                h = 12 + pulse * 8;
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
// 5. HELPERS
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
// 6. AUDIO PLAYBACK & WEBAUDIO ANALYSER CONNECTION
// ---------------------------------
async function toggleFrequencyAudio() {
    const audio = getOrCreateFrequencyAudio();

    if (!audio.src) {
        if (!freqCurrentRelease) {
            await tuneCatacombFrequency(true);
        }
        return;
    }

    const btn = document.getElementById("oraclePlayBtn");
    const status = document.getElementById("frequencyStatus");

    if (audio.paused) {
        try {
            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
            if (AudioCtxClass) {
                if (!freqAudioContext) {
                    freqAudioContext = new AudioCtxClass();
                }
                if (freqAudioContext.state === "suspended") {
                    await freqAudioContext.resume();
                }

                if (!freqMediaSource) {
                    try {
                        freqMediaSource = freqAudioContext.createMediaElementSource(audio);
                        freqAnalyser = freqAudioContext.createAnalyser();
                        freqAnalyser.fftSize = 64;
                        freqAnalyser.smoothingTimeConstant = 0.75;
                        freqMediaSource.connect(freqAnalyser);
                        freqAnalyser.connect(freqAudioContext.destination);
                    } catch (e) {
                        console.warn("MediaElement connection notice:", e);
                    }
                }
            }

            await audio.play();
        } catch (err) {
            console.error("☠ CATACOMB FREQUENCY PLAY ERROR:", err);
            if (status) status.textContent = "PLAYBACK ERROR • RE-TUNE VOID";
        }
    } else {
        audio.pause();
    }
}

function seekFrequencyAudio(event) {
    const audio = getOrCreateFrequencyAudio();
    if (!audio.duration) return;
    const bar = document.getElementById("oracleProgressBar");
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    audio.currentTime = ratio * audio.duration;
}

// ---------------------------------
// 7. THE CRYPT ORACLE: TUNE VOID
// ---------------------------------
async function tuneCatacombFrequency(playRadioNoise = true) {
    const status = document.getElementById("frequencyStatus");
    const releaseBox = document.getElementById("signalRelease");

    if (freqIsTuning) return;
    freqIsTuning = true;

    // Play Occult Tuning Static Noise
    if (playRadioNoise) {
        playOccultTuningSound();
    }

    const audio = getOrCreateFrequencyAudio();
    if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
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

        // Tuning delay matching the noise duration
        await new Promise(resolve => setTimeout(resolve, 850));

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
        if (streamUrl) {
            audio.src = streamUrl;
            audio.load();
        } else {
            audio.removeAttribute("src");
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

                    <!-- LISTEN & EARN QUEST TRACKER -->
                    <div class="oracle-quest-box ${freqQuestCompleted ? "completed" : ""}" id="oracleQuestBox">
                        ${freqQuestCompleted ? `
                            <div class="oracle-quest-complete-badge">
                                <span class="quest-star">⛧</span>
                                <b>QUEST COMPLETED: +5 CATACOMB XP</b>
                                <span class="quest-star">⛧</span>
                            </div>
                        ` : `
                            <div class="oracle-quest-header">
                                <span class="oracle-quest-title">⚔ LISTEN &amp; EARN QUEST</span>
                                <span class="oracle-quest-status" id="oracleQuestStatus">${freqListeningSeconds} / ${QUEST_TARGET_SECONDS}s</span>
                            </div>
                            <div class="oracle-quest-bar">
                                <div class="oracle-quest-fill" id="oracleQuestFill" style="width: ${(freqListeningSeconds / QUEST_TARGET_SECONDS) * 100}%;"></div>
                            </div>
                            <div class="oracle-quest-reward-text">
                                Absorb 20s of the underground broadcast to claim +5 Catacomb XP &amp; Ritual Achievement
                            </div>
                        `}
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
                        <button class="oracle-play-btn ${streamUrl ? "active" : "disabled"}" id="oraclePlayBtn" onclick="toggleFrequencyAudio()" ${streamUrl ? "" : "disabled"}>
                            ${streamUrl ? "▶ LISTEN TO SAMPLE" : "☠ AUDIO UNAVAILABLE"}
                        </button>
                        <span class="oracle-time" id="oracleTime">0:00 / 0:00</span>
                    </div>
                    <div class="oracle-progress-bar" id="oracleProgressBar" onclick="seekFrequencyAudio(event)" role="progressbar" aria-label="Audio progress">
                        <div class="oracle-progress-fill" id="oracleProgressFill" style="width:0%"></div>
                    </div>
                    <div class="oracle-actions-row">
                        <a class="submit-btn oracle-tomb-link" href="release.html?id=${encodeURIComponent(relicId)}">⚔ ENTER TOMB (${escapeHtml(pricePi)})</a>
                        <button class="oracle-retune-btn" onclick="tuneCatacombFrequency(true)">⚡ RE-TUNE VOID</button>
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
                    <button class="oracle-retune-btn" onclick="tuneCatacombFrequency(true)">⚡ TRY AGAIN</button>
                </div>
            `;
        }
    } finally {
        freqIsTuning = false;
    }
}

// Initial tune on load (silent scan, without loud static)
window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => tuneCatacombFrequency(false), 400);
});
