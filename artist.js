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

            <img
            class="artist-image"
            src="${artist.artistImage}"
            alt="${artist.artist}">

        <div class="artist-banner">

            <img
            src="${artist.banner}"
            alt="${artist.artist}">

        </div>
        
            <div class="release-title">

                ${artist.artist}

            </div>

            <div class="release-meta">

                ${artist.country}
                •

                <a
                href="genre.html?genre=${encodeURIComponent(artist.genre)}"
                class="genre-link">

                    ${artist.genre}

                </a>

             </div>

            <div class="release-desc">

                ${artist.bio}

            </div>
<div class="artist-stats">

    <div class="stat-row">

        <span>RELEASES</span>

        <span>1</span>

    </div>

    <div class="stat-row">

        <span>COUNTRY</span>

        <span>${artist.country}</span>

    </div>

    <div class="stat-row">

        <span>GENRE</span>

        <span>${artist.genre}</span>

    </div>

    <div class="stat-row">

        <span>SUPPORTERS</span>

        <span>${artist.supporters}</span>

    </div>

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

        ${artist.similar ? `

<div class="submission-box">

    <h2>☠ SIMILAR ARTISTS</h2>

    <div class="submission-text">

        ${artist.similar.map(name => `

            <a
            class="submit-btn"
            href="artist.html?artist=${encodeURIComponent(name)}">

                ${name}

            </a>

            <br><br>

        `).join('')}

    </div>

</div>

` : ''}

<div class="submission-box">

    <h2>🔗 BANDCAMP</h2>

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
