const releaseContainer =
document.getElementById(
    "releaseContainer"
);

async function loadReleases(){

    try{

        const response =
        await fetch(
            "./data/releases.json"
        );

        const releases =
        await response.json();

        releaseContainer.innerHTML = "";

        // Featured Release

        if(releases.length > 0){

            releaseContainer.innerHTML += `

            <div class="featured-release">

                <div class="featured-label">

                    FEATURED RELEASE

                </div>

                <img
                class="featured-cover"
                src="${releases[0].cover}"
                alt="${releases[0].release}">

                <div class="featured-title">

                    ${releases[0].release}

                </div>

                <div class="featured-artist">

                    ${releases[0].artist}

                </div>

            </div>

            `;

        }

        // Genres

        const genres = {};

        releases.forEach((release)=>{

            if(!genres[release.genre]){

                genres[release.genre] = [];

            }

            genres[release.genre].push(
                release
            );

        });

        Object.keys(genres)
        .forEach((genre)=>{

            releaseContainer.innerHTML += `

            <div class="genre-title">

                ${genre}

            </div>

            `;

            genres[genre]
            .forEach((release,index)=>{

                const card =
                document.createElement(
                    "div"
                );

                card.className =
                "release-card";

                card.innerHTML = `

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

                <a
                class="submit-btn"
                href="release.html?id=${index}">

                VIEW RELEASE

                </a>

                `;

                releaseContainer
                .appendChild(card);

            });

        });

    }catch(error){

        console.error(
            "Release loading error:",
            error
        );

    }

}

loadReleases();
