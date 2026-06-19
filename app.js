function loginWithPi(){

    const screen =
    document.getElementById(
        "screenText"
    );

    screen.innerText =
    "PI LOGIN COMING SOON";

}
const searchInput =
document.getElementById(
    "searchInput"
);

if(searchInput){

searchInput.addEventListener(
"input",
async function(){

const query =
this.value.toLowerCase();

const resultsBox =
document.getElementById(
"searchResults"
);

if(query.length < 2){

resultsBox.innerHTML = "";

return;

}

const response =
await fetch(
"./data/releases.json"
);

const releases =
await response.json();

const matches =
releases.filter(item =>

item.artist
.toLowerCase()
.includes(query)

||

item.release
.toLowerCase()
.includes(query)

||

item.genre
.toLowerCase()
.includes(query)

||

item.country
.toLowerCase()
.includes(query)

);
if(matches.length === 0){

resultsBox.innerHTML = `

<div class="no-results">

    NO RELEASES FOUND IN THE CATACOMBS

</div>

`;

return;

}

resultsBox.innerHTML =

matches.map((item,index)=>`

<a
href="release.html?id=${index}"
class="search-card">

    <img
    src="${item.cover}"
    class="search-cover">

    <div>

        <div class="search-title">

            ${item.artist}

        </div>

        <div class="search-meta">

           ${item.release}
           •
           ${item.genre}
           •
           ${item.country} 

        </div>

    </div>

</a>

`).join("");

});

}
async function discoverRelease(){

    const overlay =
    document.getElementById(
        "catacombOverlay"
    );

    const text =
    document.getElementById(
        "catacombText"
    );

    overlay.style.display =
    "flex";

    text.innerText =
    "THE UNDERGROUND CHOOSES...";

    const response =
    await fetch(
        "./data/releases.json"
    );

    const releases =
    await response.json();

    const randomId =
    Math.floor(
        Math.random() *
        releases.length
    );

    setTimeout(()=>{

        window.location.href =
        `release.html?id=${randomId}`;

    }, 3000);

}
 async function discoverArtist(){

    const overlay =
    document.getElementById(
        "catacombOverlay"
    );

    const text =
    document.getElementById(
        "catacombText"
    );

    overlay.style.display =
    "flex";

    text.innerText =
    "THE CATACOMBS SEEK AN ARTIST...";

    const response =
    await fetch(
        "./data/releases.json"
    );

    const releases =
    await response.json();

    const artists =
    [...new Set(
        releases.map(
            item => item.artist
        )
    )];

    const randomArtist =

    artists[
        Math.floor(
            Math.random() *
            artists.length
        )
    ];

    setTimeout(()=>{

        window.location.href =

        `artist.html?artist=${encodeURIComponent(randomArtist)}`;

    }, 3000);

 }

async function loadCollection(){

    const container =
    document.getElementById(
        "collectionContainer"
    );

    const title =
    document.getElementById(
        "collectionTitle"
    );
    
    if(!container) return;

    const collection =
    JSON.parse(
        localStorage.getItem(
            "ossvariumCollection"
        ) || "[]"
    );

    if(collection.length === 0){

    title.innerHTML =
    "⚔ MY COLLECTION ⚔";

    container.innerHTML =
    "NO RELEASES COLLECTED";

    return;

    }

    const response =
    await fetch(
        "./data/releases.json"
    );

    const releases =
    await response.json();

    title.innerHTML =

    `⚔ MY COLLECTION ⚔
    (${collection.length})`;
    
    container.innerHTML =
    collection.map(id => {

        const release =
        releases[id];

        if(!release) return "";

        return `

<a
href="release.html?id=${id}"
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

`;

    }).join("");

}

loadCollection();

async function loadCountries(){

    const vault =
    document.getElementById(
        "countryVault"
    );

    if(!vault) return;

    const response =
    await fetch(
        "./data/releases.json"
    );

    const releases =
    await response.json();

    const countries =
    [...new Set(
        releases.map(
            item => item.country
        )
    )];

    vault.innerHTML =

    countries.map(country => {

        const count =
        releases.filter(
            item =>
            item.country === country
        ).length;

        return `

        <a
        class="submit-btn"
        href="country.html?country=${encodeURIComponent(country)}">

            🌍 ${country} (${count})

        </a>

        <br><br>

        `;

    }).join("");

}

async function loadGenres(){

    const vault =
    document.getElementById(
        "genreVault"
    );

    if(!vault) return;

    const response =
    await fetch(
        "./data/releases.json"
    );

    const releases =
    await response.json();

    const genres =
    [...new Set(
        releases.map(
            item => item.genre
        )
    )];

    vault.innerHTML =

    genres.map(genre => {

        const count =
        releases.filter(
            item =>
            item.genre === genre
        ).length;

        return `

        <a
        class="submit-btn"
        href="genre.html?genre=${encodeURIComponent(genre)}">

            ☠ ${genre} (${count})

        </a>

        <br><br>

        `;

    }).join("");

}

async function loadArtists(){

    const vault =
    document.getElementById(
        "artistVault"
    );

    if(!vault) return;

    const response =
    await fetch(
        "./data/releases.json"
    );

    const releases =
    await response.json();

    const artists =
    [...new Set(
        releases.map(
            item => item.artist
        )
    )];

    vault.innerHTML =

    artists.map(artist => {

        const count =
        releases.filter(
            item =>
            item.artist === artist
        ).length;

        return `

        <a
        class="submit-btn"
        href="artist.html?artist=${encodeURIComponent(artist)}">

            👤 ${artist} (${count})

        </a>

        <br><br>

        `;

    }).join("");

}

loadCountries();
loadCollection();
loadGenres();
loadArtists();
loadQuote();

function loadQuote(){

    const quoteBox =
    document.getElementById(
        "catacombQuote"
    );

    if(!quoteBox) return;

    const quotes = [

        "THE UNDERGROUND REMEMBERS.",

        "ONLY THE DEVOTED SHALL DESCEND.",

        "THE CATACOMBS NEVER SLEEP.",

        "BURIED SOUNDS NEVER DIE.",

        "SUPPORT THE UNDERGROUND OR BECOME THE MAINSTREAM.",

        "IN DARKNESS WE DISCOVER.",

        "THE UNDERGROUND CHOOSES.",

        "EVERY RELEASE HAS A TOMB.",

        "FROM THE DEPTHS OF THE CATACOMBS.",

        "NO TRENDS. NO HYPE. ONLY MUSIC."

    ];

    const randomQuote =

    quotes[
        Math.floor(
            Math.random() *
            quotes.length
        )
    ];

    quoteBox.innerText =
    randomQuote;

}

loadQuote();
