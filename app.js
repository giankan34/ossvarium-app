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

    const achievementBox =
    document.getElementById(
    "achievementBox"
    );
   
    const secretBox =
    document.getElementById(
    "secretAchievements"
    );

if(achievementBox){

    let title =

    "UNINITIATED";

    if(collection.length >= 1)
    title =
    "INITIATE OF THE CATACOMBS";

    if(collection.length >= 5)
    title =
    "UNDERGROUND SEEKER";

    if(collection.length >= 10)
    title =
    "KEEPER OF THE OSSVARIUM";

    if(collection.length >= 20)
    title =
    "CATACOMB CURATOR";

    if(collection.length >= 50)
    title =
    "LORD OF THE OSSVARIUM";

    let nextRank = "";
let progress = "";

if(collection.length < 5){

    nextRank =
    "UNDERGROUND SEEKER";

    progress =
    `${collection.length}/5`;

}
else if(collection.length < 10){

    nextRank =
    "KEEPER OF THE OSSVARIUM";

    progress =
    `${collection.length}/10`;

}
else if(collection.length < 20){

    nextRank =
    "CATACOMB CURATOR";

    progress =
    `${collection.length}/20`;

}
else if(collection.length < 50){

    nextRank =
    "LORD OF THE OSSVARIUM";

    progress =
    `${collection.length}/50`;

}
else{

    nextRank =
    "MAX RANK ACHIEVED";

    progress =
    "∞";

}

achievementBox.innerHTML = `

🏆 ${title}

<br><br>

<span style="font-size:12px;">

NEXT RANK:
${nextRank}
(${progress})

</span>

`;
    if(secretBox){

    const secrets = [];

    const response =
    await fetch(
    "./data/releases.json"
    );

    const releases =
    await response.json();

    const countriesCollected =
    new Set();

    collection.forEach(id => {

        const release =
        releases[id];

        if(release){

            countriesCollected.add(
                release.country
           );

        }

});
        
    if(collection.length >= 3){

        secrets.push(
            "📀 COLLECTOR"
        );

    }

    if(collection.length >= 10){

        secrets.push(
            "⚔ OSSVARIUM DEVOTEE"
        );

    }

    if(collection.length >= 20){

        secrets.push(
            "🏛 KEEPER OF THE TOMBS"
        );

    }

   if(countriesCollected.size >= 3){

    secrets.push(
        "🌍 WORLD EXPLORER"
    );

}

if(countriesCollected.size >= 10){

    secrets.push(
        "🌎 GLOBAL NECROMANCER"
    );

}
    secretBox.innerHTML =

    secrets.length > 0

    ?

    `

    <b>☠ SECRET ACHIEVEMENTS ☠</b>

    <br><br>

    ${secrets.join("<br><br>")}

    `

    :

    "";

    }
}
    
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
async function loadCatacombMap(){

    const map =
    document.getElementById(
        "catacombMap"
    );

    if(!map) return;

    const response =
    await fetch(
        "./data/releases.json"
    );

    const releases =
    await response.json();

    const artists =
    new Set(
        releases.map(
            item => item.artist
        )
    ).size;

    const genres =
    new Set(
        releases.map(
            item => item.genre
        )
    ).size;

    const countries =
    new Set(
        releases.map(
            item => item.country
        )
    ).size;

    const collection =
    JSON.parse(
        localStorage.getItem(
            "ossvariumCollection"
        ) || "[]"
    );

    map.innerHTML = `

    📀 RELEASES:
    ${releases.length}

    <br><br>

    👤 ARTISTS:
    ${artists}

    <br><br>

    ☠ GENRES:
    ${genres}

    <br><br>

    🌍 COUNTRIES:
    ${countries}

    <br><br>

    ⚔ COLLECTED:
    ${collection.length}

    `;

}

async function loadReleaseOfTheDay(){

    const box =
    document.getElementById(
        "releaseOfTheDay"
    );

    if(!box) return;

    const response =
    await fetch(
        "./data/releases.json"
    );

    const releases =
    await response.json();

    const today =
    new Date().getDate();

    const release =
    releases[
        today % releases.length
    ];

    box.innerHTML = `

    <img
    src="${release.cover}"
    style="
    width:150px;
    border-radius:10px;
    margin-bottom:10px;
    ">

    <br>

    <b>${release.artist}</b>

    <br>

    ${release.release}

    <br><br>

    <a
    class="submit-btn"
    href="release.html?id=${
        releases.indexOf(release)
    }">

        ⚔ ENTER TOMB ⚔

    </a>

    `;

}

loadCountries();
loadCollection();
loadGenres();
loadArtists();
loadCatacombMap();
loadReleaseOfTheDay();
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
