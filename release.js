const releasePage =
document.getElementById(
    "releasePage"
);

async function loadRelease(){

    try{

        const response =
        await fetch(
            "./data/releases.json"
        );

        const releases =
        await response.json();

        const params =
        new URLSearchParams(
            window.location.search
        );

        const id = 0;

        const release =
        releases[id];

        if(!release){

            releasePage.innerHTML =
            "RELEASE NOT FOUND";

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

                ${release.genre}
                •
                ${release.year}

            </div>

            <div class="release-desc">

                ${release.description}

            </div>

        </div>

        <div class="submission-box">

            <h2>PRICE</h2>

            <div class="submission-text">

                1 TEST PI

            </div>

            <button class="btn">

                BUY WITH PI

            </button>

        </div>

        <div class="submission-box">

            <h2>ARTIST LINKS</h2>

            <a
            class="submit-btn"
            href="${release.bandcamp}"
            target="_blank">

                BANDCAMP

            </a>

        </div>

        `;

    }catch(error){

        console.error(error);

        releasePage.innerHTML =
        "ERROR LOADING RELEASE";

    }

}

loadRelease();
