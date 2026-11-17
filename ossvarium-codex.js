const enterCodex = document.getElementById("enterCodex");
const book = document.querySelector(".book");

const pages = document.querySelectorAll(".page");

const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");
const pageCounter = document.getElementById("pageCounter");
const contentsBtn = document.getElementById("contentsBtn");
const codexContents = document.getElementById("codexContents");

let currentPage = Number(localStorage.getItem("ossvariumCodexPage")) || 0;
let archivesOpen = false;

// ---------------------------------
// PAGE TURN SOUND (Web Audio API)
// ---------------------------------
function playPageTurnSound() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!window._codexAudioCtx) {
            window._codexAudioCtx = new AudioCtx();
        }
        const ctx = window._codexAudioCtx;
        if (ctx.state === "suspended") {
            ctx.resume();
        }

        const now = ctx.currentTime;

        // 1. Τριβή χαρτιού / περγαμηνής
        const duration = 0.28 + Math.random() * 0.05;
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + 0.05 * white) / 1.05;
            data[i] = lastOut * 3.0 + white * 0.12;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.Q.value = 1.6;
        const baseFreq = 950 + Math.random() * 200;
        filter.frequency.setValueAtTime(baseFreq, now);
        filter.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + duration * 0.4);
        filter.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + duration);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);

        // 2. Απαλό "χτύπημα" προσγείωσης της σελίδας
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(140 + Math.random() * 20, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(40, now + duration);

        oscGain.gain.setValueAtTime(0.001, now + 0.08);
        oscGain.gain.linearRampToValueAtTime(0.08, now + 0.11);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now + 0.08);
        osc.stop(now + duration);
    } catch (e) {
        console.warn("Codex sound error:", e);
    }
}


// OPEN ARCHIVES

enterCodex.addEventListener("click", () => {

    playPageTurnSound();

    archivesOpen = true;

    book.classList.add("open");

    document.body.classList.add("archives-open");

    updateBook();

});


// UPDATE PAGES

function updateBook() {

    if (!archivesOpen) {
        return;
    }

    pages.forEach((page, index) => {

        page.classList.toggle(
            "active",
            index === currentPage
        );

    });

    pageCounter.textContent =
        `Page ${currentPage + 1} / ${pages.length}`;

    prevBtn.disabled = currentPage === 0;

    nextBtn.disabled =
        currentPage === pages.length - 1;

    localStorage.setItem("ossvariumCodexPage", currentPage);

}

// NEXT

nextBtn.addEventListener("click", () => {

    if (!archivesOpen) return;

    if (currentPage < pages.length - 1) {

        playPageTurnSound();

        document.querySelector(".book").classList.remove("turn-prev");
        document.querySelector(".book").classList.add("turn-next");

        currentPage++;
        updateBook();
    }

});


// PREVIOUS

prevBtn.addEventListener("click", () => {

    if (!archivesOpen) return;

    if (currentPage > 0) {

        playPageTurnSound();

        document.querySelector(".book").classList.remove("turn-next");
        document.querySelector(".book").classList.add("turn-prev");

        currentPage--;
        updateBook();
    }

});

// =========================
// CODEX CONTENTS
// =========================

if (contentsBtn && codexContents) {

    contentsBtn.addEventListener("click", () => {

        codexContents.classList.toggle("open");

    });

}

const chapterLinks = document.querySelectorAll(".chapter-link");

chapterLinks.forEach((chapter) => {

    chapter.addEventListener("click", () => {

        const targetPage = Number(chapter.dataset.page);

        if (targetPage !== currentPage) {
            playPageTurnSound();
        }

        currentPage = targetPage;

        updateBook();

        codexContents.classList.remove("open");

    });

});


function updateCatacombLevel() {

    const catacombLevel =
        document.getElementById("catacombLevel");

    if (!catacombLevel) return;

    const collected =
        JSON.parse(
            localStorage.getItem("ossvariumCollection") || "[]"
        );

    const xp = collected.length * 100;

    let level = "INITIATE";
    let icon = "🕯️";

    if (xp >= 100) {
        level = "CRYPT WALKER";
        icon = "💀";
    }

    if (xp >= 300) {
        level = "RELIC HUNTER";
        icon = "⚔️";
    }

    if (xp >= 500) {
        level = "CATACOMB KEEPER";
        icon = "🏛️";
    }

    if (xp >= 1000) {
        level = "ARCHIVE LEGEND";
        icon = "👑";
    }

    catacombLevel.innerHTML = `
        ${icon} ${level}
        <br><br>
        ⭐ ${xp} XP
        <br><br>
        🗝️ ${collected.length} RELICS COLLECTED
    `;
}

updateCatacombLevel();