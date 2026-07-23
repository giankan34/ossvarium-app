document.addEventListener("DOMContentLoaded", () => {
    loadRelease();
});

async function loadRelease() {

    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));


    if (!id) {
        document.getElementById("release-container").innerHTML =
            "<h2>Release not found.</h2>";
        return;
    }

    const response = await fetch("/data/releases.json");
    const releases = await response.json();

    const release = releases[id];

    if (!release) {
        document.getElementById("release-container").innerHTML =
            "<h2>Release not found.</h2>";
        return;
    }

    renderRelease(release);
}

function renderRelease(release) {

    document.getElementById("release-container").innerHTML = `
        <div class="release-card">

            <img src="${release.cover}" class="release-cover">

            <h1>${release.release}</h1>

            <h2>${release.artist}</h2>

            <div class="release-meta">
                ${release.genre} • ${release.year}
            </div>

            <p class="release-description">
                ${release.description}
            </p>

        </div>
    `;
}
