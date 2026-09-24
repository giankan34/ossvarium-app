const params =
    new URLSearchParams(
        window.location.search
    );

const genreName =
    params.get("genre");

const genreTitle =
    document.getElementById(
        "genreTitle"
    );

genreTitle.textContent =
    genreName || "GENRE";


async function loadGenreRelics() {

    const results =
        document.getElementById(
            "genreResults"
        );

    try {

        const data =
            await loadOssvariumCatalog();

        const filtered =
            data.filter(item =>

                (item.genre || "")
                .toLowerCase()
                .includes(
                    (genreName || "")
                    .toLowerCase()
                )

            );


        if (!filtered.length) {

            results.innerHTML = `

                <div class="submission-box">

                    <div class="submission-text">

                        ☠ NO RELICS FOUND ☠

                    </div>

                </div>

            `;

            return;

        }


        results.innerHTML =
            filtered.map(item => {

                return `

                    <a
                    href="release.html?id=${encodeURIComponent(item.relicId)}"
                    style="text-decoration:none;">

                        <div class="release-card">

                            ${item.cover
                            ? `
                                <img
                                src="${item.cover}"
                                class="release-cover"
                                alt="${item.release}">
                            `
                            : `
                                <div class="release-cover no-cover">
                                    ☠ NO COVER ART ☠
                                </div>
                            `}

                            <div class="release-title">

                                ${item.release}

                            </div>

                            <div class="release-artist">

                                ${item.artist}

                            </div>

                        </div>

                    </a>

                `;

            }).join("");

    } catch (error) {

        console.error(
            "OSSVARIUM genre error:",
            error
        );

        results.innerHTML = `

            <div class="submission-box">

                <div class="submission-text">

                    ☠ GENRE VAULT COULD NOT BE LOADED ☠

                </div>

            </div>

        `;

    }

}


loadGenreRelics();