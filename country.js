const countryContainer =
document.getElementById(
    "countryContainer"
);

const countryTitle =
document.getElementById(
    "countryTitle"
);

async function loadCountry(){

    const params =
    new URLSearchParams(
        window.location.search
    );

    const country =
    params.get("country");

    countryTitle.innerHTML =
    `🌍 ${country} VAULT 🌍`;

    const response =
    await fetch(
        "./data/releases.json"
    );

    const releases =
    await response.json();

    const matches =
    releases.filter(
        release =>
        release.country === country
    );

    countryContainer.innerHTML =

    matches.map((release,index)=>`

    <a
    href="release.html?id=${releases.indexOf(release)}"
    style="text-decoration:none;">

        <div class="release-card">

            <img
            src="${release.cover}"
            class="release-cover">

            <div class="release-title">

                ${release.release}

            </div>

            <div class="release-artist">

                ${release.artist}

            </div>

        </div>

    </a>

    `).join("");

}

loadCountry();
