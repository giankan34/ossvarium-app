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

    const stats =
    document.getElementById(
    "countryStats"
    );

    const uniqueArtists =
    new Set(
        matches.map(
            item => item.artist
       )
   ).size;

    const uniqueGenres =
    new Set(
        matches.map(
            item => item.genre
       )
   ).size;

   stats.innerHTML = `

   <div class="submission-box">

       <h2>☠ COUNTRY STATS ☠</h2>

       <div class="submission-text">

           RELEASES:
           ${matches.length}

           <br><br>

           ARTISTS:
           ${uniqueArtists}

           <br><br>

           GENRES:
           ${uniqueGenres}

       </div>

   </div>

`;
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
