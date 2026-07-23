const releasePage = document.getElementById("releasePage");

async function loadRelease() {

    try {

        const response = await fetch("./data/releases.json");
        const releases = await response.json();

        const params = new URLSearchParams(window.location.search);
        const id = Number(params.get("id") || 0);

        const release = releases[id];

        if (!release) {

            releasePage.innerHTML = "RELEASE NOT FOUND";

            return;

        }

        releasePage.innerHTML = `
        
        <div class="release-card">

            <img
            class="release-cover"
            src="${release.cover}"
            alt="${release.release}">

            <div class="release-title">

                ${release.release}

            </div>

            <div class="release-artist">

                ${release.artist}

            </div>

            <div class="release-meta">

                ${release.genre} • ${release.year}

            </div>

            <div class="release-desc">

                ${release.description}

            </div>

        </div>

        `;

    }

    catch(error){

        console.error(error);

        releasePage.innerHTML = "ERROR LOADING RELEASE";

    }

}

loadRelease();
