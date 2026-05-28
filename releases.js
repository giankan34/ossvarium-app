const releaseContainer =
document.getElementById(
    "releaseContainer"
);

async function loadReleases(){

    try{

        const response =
        await fetch(
            './data/releases.json'
        );

        const releases =
        await response.json();

        releaseContainer.innerHTML = "";

        const genres = {};

        releases.forEach((release)=>{

            if(!genres[release.genre]){

                genres[release.genre] = [];

            }

            genres[release.genre]
            .push(release);

        });

        Object.keys(genres)
        .forEach((genre)=>{

            const section =
            document.createElement("div");

            section.innerHTML = `

                <div class="genre-title">

                    ${genre}

                </div>

            `;

            releaseContainer
            .appendChild(section);

            genres[genre]
            .forEach((release)=>{

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

                    <div class="release-desc">

                        ${release.year}

                    </div>

                    <div class="release-desc">

                        ${release.description}

                    </div>

                    <div class="bandcamp-frame">

                        <iframe
                        style="height:120px;"
                        src="${release.bandcamp}"
                        seamless>

                        </iframe>

                    </div>

                `;

                releaseContainer
                .appendChild(card);

            });

        });

    }catch(error){

        console.error(error);

    }

}

loadReleases();
