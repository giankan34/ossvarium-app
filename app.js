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

        releases.forEach(
        (release)=>{

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

                    ${release.genre}
                    •
                    ${release.year}

                </div>

                <div class="release-desc">

                    ${release.description}

                </div>

                ${
                    release.bandcamp
                    ?
                    `
                    <div class="bandcamp-frame">

                        <iframe
                        style="height:120px;"
                        src="${release.bandcamp}"
                        seamless>

                        </iframe>

                    </div>
                    `
                    :
                    `
                    <audio
                    class="audio-player"
                    controls>

                        <source
                        src="${release.audio}"
                        type="audio/mpeg">

                    </audio>
                    `
                }

            `;

            releaseContainer.appendChild(
                card
            );

        });

    }catch(error){

        console.error(
            "Release loading error:",
            error
        );

    }

}

loadReleases();
