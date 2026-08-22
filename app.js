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

    const xp =

    collection.length * 10;
    
    const response =
    await fetch(
    "./data/releases.json"
    );

    const releases =
    await response.json();
    
    const achievementBox =
    document.getElementById(
    "achievementBox"
    );
   
    const secretBox =
    document.getElementById(
    "secretAchievements"
    );

    const relicBox =
document.getElementById(
    "relicBox"
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

const currentXP = collection.length * 10;

const maxXP = 50;

const xpPercent =
Math.min(
(currentXP / maxXP) * 100,
100
);
    
achievementBox.innerHTML = `

🏆 ${title}

<br><br>

⭐ XP:
${currentXP}

<br><br>

<div style="
width:100%;
height:10px;
background:#2b2b2b;
border-radius:10px;
overflow:hidden;
">

<div style="
width:${xpPercent}%;
height:100%;
background:linear-gradient(to right,#b8860b,#ffd700);
">
</div>

</div>

<br><br>

<span style="font-size:12px;">

NEXT RANK:
${nextRank}
(${progress})

</span>

`;
    if(secretBox){

    const secrets = [];

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

 if(relicBox){

    const relics = [];

    const denmarkCount =
    collection.filter(id => {

        const release =
        releases[id];

        return release &&
        release.country ===
        "Denmark";

    }).length;

    if(denmarkCount >= 1){

        relics.push(
            "🌍 RELIC OF DENMARK"
        );

    }
     if(denmarkCount >= 3){

    relics.push(
        "💀 DANISH DEATH CULT"
    );

     }

     const swedenCount =
     collection.filter(id => {

    const release =
    releases[id];

    return release &&
    release.country ===
    "Sweden";

}).length;

if(swedenCount >= 1){

    relics.push(
        "🇸🇪 RELIC OF SWEDEN"
    );

}
     const finlandCount =
collection.filter(id => {

    const release =
    releases[id];

    return release &&
    release.country ===
    "Finland";

}).length;

if(finlandCount >= 1){

    relics.push(
        "🇫🇮 RELIC OF FINLAND"
    );

}
     const norwayCount =
collection.filter(id => {

    const release =
    releases[id];

    return release &&
    release.country ===
    "Norway";

}).length;

if(norwayCount >= 1){

    relics.push(
        "🇳🇴 RELIC OF NORWAY"
    );

}
    relicBox.innerHTML =

    relics.length > 0

    ?

    `

    <b>🔥 RELICS OF THE OSSVARIUM 🔥</b>

    <br><br>

    ${relics.join("<br><br>")}

    `

    :

    "";

        }
    
    if(collection.length === 0){

    title.innerHTML =
    "⚔ MY COLLECTION ⚔";

    container.innerHTML =
    "NO RELEASES COLLECTED";

    return;

    }

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

async function loadArtistOfTheDay(){

    const box =
    document.getElementById(
        "artistOfTheDay"
    );

    if(!box) return;

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

    const today =
    new Date().getDate();

    const artist =
    artists[
        today % artists.length
    ];

    box.innerHTML = `

    <b>${artist}</b>

    <br><br>

    <a
    class="submit-btn"
    href="artist.html?artist=${encodeURIComponent(artist)}">

        👤 ENTER CRYPT 👤

    </a>

    `;

}

async function loadCatacombChallenge(){

    const box =
    document.getElementById(
        "catacombChallenge"
    );

    if(!box) return;

    const challenges = [

    {
        text:
        "🌍 Collect a release from a new country",

        reward:50,

        target:1,

        type:"country"
   },

   {
        text:
        "☠ Discover a new genre",

        reward:40,

        target:1,

        type:"genre"
   },

   {
        text:
        "👤 Visit an artist page",

        reward:30,

        target:1,

        type:"artist"
   },

   {
        text:
        "📀 Add a release to your collection",

        reward:50,

        target:1,

        type:"collection"
   },

   {
        text:
        "🏛 Explore the Hall of Fame",

        reward:25,

        target:1,

        type:"hall"
   },

   {
        text:
        "⚔ Reach your next rank",

        reward:100,

        target:1,

        type:"rank"
   },

   {
        text:
        "💀 Enter a random tomb",

        reward:20,

        target:1,

        type:"tomb"
   },

   {
        text:
        "🎸 Discover an underground band",

        reward:40,

        target:1,

        type:"band"
   },

   {
        text:
        "🌎 Explore the Country Vault",

        reward:30,

        target:1,

        type:"vault"
   },

   {
        text:
        "☠ Search for something unknown",

        reward:25,

        target:1,

        type:"search"
   }

   ];

    const today =
    new Date().getDate();

    const challenge =
    challenges[
        today % challenges.length
    ];

    box.innerHTML = `

    <b>TODAY'S MISSION</b>

    <br><br>

    ${challenge.text}

    <br><br>

    ⭐ Reward: +${challenge.reward} XP

`;

}

function loadCatacombStreak(){

    const box =
    document.getElementById(
        "catacombStreak"
    );

    if(!box) return;

    const today =
    new Date()
    .toDateString();

    const lastVisit =
    localStorage.getItem(
        "ossvariumLastVisit"
    );

    let streak =
    parseInt(
        localStorage.getItem(
            "ossvariumStreak"
        ) || "0"
    );

    if(lastVisit !== today){

        streak++;

        localStorage.setItem(
            "ossvariumStreak",
            streak
        );

        localStorage.setItem(
            "ossvariumLastVisit",
            today
        );

    }

    let title =
    "CATACOMB WANDERER";

    if(streak >= 7)
    title =
    "CATACOMB ADDICT";

    if(streak >= 30)
    title =
    "LORD OF THE DEPTHS";

    box.innerHTML = `

    DAYS VISITED:

    <br><br>

    <b>${streak}</b>

    <br><br>

    TITLE:

    <br><br>

    ${title}

    `;

}

function loadCatacombLevel(){

    const box =
    document.getElementById(
        "catacombLevel"
    );

    if(!box) return;

    const collection =
    JSON.parse(
        localStorage.getItem(
            "ossvariumCollection"
        ) || "[]"
    );

    const xp =
    collection.length;

    let level =
    1;

    let title =
    "NECROPHYTE";

    let nextXp =
    10;

    if(xp >= 10){

        level = 2;
        title = "GRAVE DIGGER";
        nextXp = 25;

    }

    if(xp >= 25){

        level = 3;
        title = "TOMB KEEPER";
        nextXp = 50;

    }

    if(xp >= 50){

        level = 4;
        title = "CATACOMB LORD";
        nextXp = 100;

    }

    if(xp >= 100){

        level = 5;
        title = "OSSVARIUM IMMORTAL";
        nextXp = "∞";

    }

    const percent =

nextXp === "∞"

? 100

: Math.floor(
    (xp / nextXp) * 100
);

box.innerHTML = `

LEVEL ${level}

<br><br>

🏛 ${title}

<br><br>

XP:
${xp} / ${nextXp}

<br><br>

<div style="
width:100%;
height:20px;
border:1px solid #8a2b2b;
background:#111;
">

<div style="
width:${percent}%;
height:100%;
background:#8a2b2b;
">

</div>

</div>

<br>

${percent}%

`;

}

loadCountries();
loadCollection();
loadGenres();
loadArtists();
loadCatacombMap();
loadReleaseOfTheDay();
loadArtistOfTheDay();
loadCatacombChallenge();
loadCatacombStreak();
loadCatacombLevel();
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

function showAchievementPopup(text){

    const popup =
    document.getElementById(
        "achievementPopup"
    );

    if(!popup) return;

    popup.innerHTML = `

    🏆 ACHIEVEMENT UNLOCKED

    <br><br>

    ${text}

    `;

    popup.style.display =
    "block";

    setTimeout(() => {

        popup.style.display =
        "none";

    },3000);

}

function getRelicRarity(supporters){

    supporters = Number(supporters);

    if(supporters >= 31){

        return{

            name:"🟡 LEGENDARY RELIC",

            color:"#ffd700"

        };

    }

    if(supporters >= 21){

        return{

            name:"🟣 EPIC RELIC",

            color:"#b84cff"

        };

    }

    if(supporters >= 11){

        return{

            name:"🔵 RARE RELIC",

            color:"#3aa8ff"

        };

    }

    if(supporters >= 6){

        return{

            name:"🟢 UNCOMMON RELIC",

            color:"#39d353"

        };

    }

    return{

        name:"⚪ COMMON RELIC",

        color:"#cccccc"

    };

}

// =========================
// CODEX ENTRANCE TRANSITION
// =========================

const codexLink = document.querySelector(".codex-link");
const codexSpecter = document.getElementById("codexSpecter");

if (codexLink) {

    codexLink.addEventListener("click", function(event) {

        event.preventDefault();

        const destination = this.href;

        document.body.classList.add("codex-entering");

        if (codexSpecter) {
            codexSpecter.classList.add("awaken");
        }

        setTimeout(() => {

            if (codexSpecter) {
                codexSpecter.classList.remove("awaken");
            }

        }, 600);

        setTimeout(() => {
            window.location.href = destination;
        }, 1000);

    });

}