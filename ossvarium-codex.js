const enterCodex = document.getElementById("enterCodex");
const book = document.querySelector(".book");

const pages = document.querySelectorAll(".page");

const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");
const pageCounter = document.getElementById("pageCounter");

let currentPage = 0;
let archivesOpen = false;


// OPEN ARCHIVES

enterCodex.addEventListener("click", () => {

    archivesOpen = true;

    book.classList.add("open");

    currentPage = 0;

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