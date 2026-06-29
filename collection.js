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
