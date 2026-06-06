const artistPage =
document.getElementById(
    "artistPage"
);

async function loadArtist(){

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

        const artistName =
        params.get("artist");

        const artistReleases =
        releases.filter(
            release =>
            release.artist === artistName
        );

        if(
            artistReleases.length === 0
        ){

            artistPage.innerHTML =
            "ARTIST NOT FOUND";

            return;

        }

        const artist =
        artistReleases[0];

        artistPage.innerHTML = `

        <div class="release-card">

            <div class="release-title">

                ${artist.artist}

            </div>

            <div class="release-meta">

                ${artist.country}
                •
                ${artist.genre}

            </div>

            <div class="release-desc">

                ${artist.bio}

            </div>

        </div>

        <div class="submission-box">

            <h2>

                📀 RELEASES

            </h2>

            <div class="submission-text">

                ${artistReleases.map(
                    release => `

                    <a
                    class="submit-btn"
                    href="release.html?id=${releases.indexOf(release)}">

                        ${release.release}

                    </a>

                    <br><br>

                    `
                ).join("")}

            </div>

        </div>

        <div class="submission-box">

            <h2>

                🔗 BANDCAMP

            </h2>

            <a
            class="submit-btn"
            href="${artist.bandcamp}"
            target="_blank">

                VISIT BANDCAMP

            </a>

        </div>

        `;

    }catch(error){

        console.error(error);

        artistPage.innerHTML =
        "ERROR LOADING ARTIST";

    }

}

loadArtist();
