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


// OPEN ARCHIVES

enterCodex.addEventListener("click", () => {

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