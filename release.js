const releasePage =
document.getElementById(
    "releasePage"
);

async function loadRelease(){
console.log("release.js started");
    try{

        const response =
        await fetch(
            "./data/releases.json"
        );

        const releases =
        await response.json();
        console.log(releases);
        
        const params =
        new URLSearchParams(
            window.location.search
        );

        const id =
        Number(params.get("id") || 0);
        console.log("ID =", id);
        const release =
        releases[id];

        if(!release){

        releasePage.innerHTML =
        "RELEASE NOT FOUND - ID = " + id;

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
<div class="submission-box">

    <h2>ABOUT THE ARTIST</h2>

    <div class="submission-text">

        ${release.bio}

    </div>

</div>

<div class="submission-box">

    <h2>ORIGIN</h2>

    <div class="submission-text">

        ${release.country}

    </div>

</div>

<div class="submission-box">

    <h2>TRACKLIST</h2>

    <div class="submission-text">

        ${release.tracks.join("<br>")}

    </div>

</div>

<div class="submission-box">

    <h2>SUPPORTERS</h2>

    <div class="submission-text">

        ${release.supporters}
        Pioneers supported this release

    </div>

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
