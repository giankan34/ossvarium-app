const releasePage =
document.getElementById(
    "releasePage"
);

async function loadRelease(){
console.log("release.js started");
    try{

        const response =
        await fetch(
            "./data/releases.json"
        );

        const releases =
        await response.json();
        console.log(releases);
        
        const params =
        new URLSearchParams(
            window.location.search
        );

        const id =
        Number(params.get("id") || 0);
        console.log("ID =", id);
        const release =
        releases[id];

        const prevRelease =
        id > 0
        ?
        id - 1
        :
        releases.length - 1;

        const nextRelease =
        id < releases.length - 1
        ?
        id + 1
        :
        0;
     
        if(!release){

        releasePage.innerHTML =
        "RELEASE NOT FOUND - ID = " + id;

        return;

        }
        function getSupportLevel(supporters){

    if(supporters >= 100)
        return "💀 OSSVARIUM RELIC";

    if(supporters >= 50)
        return "👑 UNDERGROUND LEGEND";

    if(supporters >= 26)
        return "🔥 CULT RELEASE";

    if(supporters >= 11)
        return "⚔ CRYPT DISCOVERY";

    return "⚰ FRESH BURIAL";

}

const supportLevel =
getSupportLevel(
    Number(release.supporters)
);
        
function getSupportMeter(supporters){

    if(supporters >= 100)
        return "██████████";

    if(supporters >= 50)
        return "████████░░";

    if(supporters >= 26)
        return "██████░░░░";

    if(supporters >= 11)
        return "████░░░░░░";

    return "██░░░░░░░░";

}

const supportMeter =
getSupportMeter(
    Number(release.supporters)
);

const relic =

getRelicRarity(

Number(release.supporters)

);

        const supporters = Number(release.supporters);

        const relicAge = 2026 - Number(release.year);
        
        let discoveryStatus = "";

if (supporters >= 31){

    discoveryStatus = "👑 IMMORTAL RELIC";

}
else if (supporters >= 21){

    discoveryStatus = "⚔ REVERED";

}
else if (supporters >= 11){

    discoveryStatus = "🔥 SPREADING";

}
else if (supporters >= 6){

    discoveryStatus = "⛏ UNEARTHED";

}
else{

    discoveryStatus = "⚰ BURIED";

         }

        const cultScore = Math.min(
        100,
        40 + (supporters * 2)
);

        let cultBadge = "";

if (cultScore >= 95) {

    cultBadge = "👑 LEGENDARY";

}
else if (cultScore >= 80) {

    cultBadge = "🔥 CULT";

}
else if (cultScore >= 60) {

    cultBadge = "⚔ RISING";

}
else {

    cultBadge = "☠ OBSCURE";

}

      const rank = [...releases]
      .sort((a,b)=>
      Number(b.supporters) -
      Number(a.supporters)
)
     .findIndex(r=>

      r.release === release.release

) + 1;  
        
        releasePage.innerHTML = `

        <div class="release-card">

            <a
            href="release.html?id=${releases.indexOf(release)}">

            ${supporters >= 31 ? `

           <div class="hall-relic">

           👑 HALL RELIC

           </div>

           ` : ""}

           <img
           class="release-cover"
           src="${release.cover}"
           alt="${release.release}">

           </a>

            <div class="release-title">

                ${release.release}

            </div>

            <divclass="relic-rarity"

            style="

            color:${relic.color};

            border-color:${relic.color};

            box-shadow:0 0 25px ${relic.color};

            ">

            ${relic.name}

            </div>

           <div class="release-artist">

               <a
               href="artist.html?artist=${encodeURIComponent(release.artist)}"
               class="submit-btn">

                   ${release.artist}

               </a>

           </div> 

            <div class="release-meta">

                ${release.genre}
                •
                ${release.year}

            </div>

           <div class="release-desc">

           ${release.description}

            </div>

            <div class="museum-record">

            <h3>🏛 MUSEUM RECORD</h3>

            <div>🆔 Relic ID:
            OSV-${String(rank).padStart(5,"0")}</div>

            <div>📜 Status:
            Preserved</div>

            <div>🏆 Hall Rank:
            #${rank}</div>

            <div>

            🎖 Discovery Status:

            ${discoveryStatus}

            </div>

            <div>💀 Rarity:
            ${relic.name}</div>

            <div>❤️ Pioneers:
            ${release.supporters}</div>

            <div>🌍 Country:
            ${release.country}</div>

            </div>

            <div class="museum-record">

            <hr class="museum-divider">

            <h3 class="timeline-title">
            📜 RELIC TIMELINE
            </h3>

            <div>⚰ Released:
            ${release.year}</div>

            <div>🏺 Relic Age:
            ${relicAge} Years</div>

            <div>🏛 Entered Ossvarium:
            2026</div>

            <div>❤️ First Pioneer:
            Unknown</div>

            <div>👑 Current Status:
            ${discoveryStatus}</div>

            <div class="museum-seal">

           <div class="archive-stamp">

           🏛 AUTHENTICATED BY

           <br>

           OSSVARIUM ARCHIVES

           </div>

            </div>

          <div class="submission-box">
    
          <h2>⚔ SUPPORT THE UNDERGROUND ⚔</h2>

         <div class="submission-text">

        <h3>

       ❤️ ${release.supporters} SUPPORTERS

       <br><br>

       ⚔ CULT SCORE

       <br><br>

       ${cultBadge}

      <br>

      🌍 GLOBAL RANK #${rank}

      <br>

      ${cultScore}/100
      <br><br>

      <div class="cult-bar">

      <div
      class="cult-fill"
      style="width:${cultScore}%">

      </div>

      </div>

       </h3>

       <br>

       <h3>

       ${supportLevel}

       </h3>

<p>

<b>SUPPORT STRENGTH</b>

</p>

<h3>

${supportMeter}

</h3>

       <p>
  
       Every supporter keeps the underground alive.

       </p>

        <br><br>

${release.links.bandcamp ?

`<a
class="support-link"
href="${release.links.bandcamp}"
target="_blank">

🛒 SUPPORT ON BANDCAMP

</a><br><br>`

: ""}

${release.links.website ?

`<a
class="support-link"
href="${release.links.website}"
target="_blank">

🌐 OFFICIAL WEBSITE

</a><br><br>`

: ""}

${release.links.spotify ?

`<a
class="support-link"
href="${release.links.spotify}"
target="_blank">

🎵 SPOTIFY

</a><br><br>`

: ""}

${release.links.youtube ?

`<a
class="support-link"
href="${release.links.youtube}"
target="_blank">

▶ YOUTUBE

</a><br><br>`

: ""}

${release.links.merch ?

`<a
class="support-link"
href="${release.links.merch}"
target="_blank">

👕 MERCH STORE

</a>`

: ""}

    </div>

</div>

<div class="submission-box">

    <h2>ABOUT THE ARTIST</h2>

    <div class="submission-text">

        ${release.bio}

    </div>

</div> 

<div class="submission-box">

    <h2>ORIGIN</h2>

    <div class="submission-text">

        ${release.country}

    </div>

</div>

<div class="submission-box">

    <h2>TRACKLIST</h2>

    <div class="submission-text">

        ${release.tracks.join("<br>")}

    </div>

</div>

<div class="submission-box">

    <h2>SUPPORTERS</h2>

    <div class="submission-text">

        🔥 ${release.supporters} PIONEERS

    </div>

</div>
        </div>

        <div class="submission-box">

            <h2>PRICE</h2>

            <div class="submission-text">

                1 TEST PI

            </div>

            <button
            class="btn"
            onclick="alert('Pi payments coming soon')">

            BUY WITH PI

            </button>

            <button
            class="btn"
            onclick="addToCollection(${id})">

            ⭐ ADD TO COLLECTION

             </button>
           
            <button
            class="btn"
            onclick="removeFromCollection(${id})">

            ❌ REMOVE FROM COLLECTION

            </button> 
      
        </div>
        
      <div class="submission-box">

    <h2>ARTIST LINKS</h2>

    <a
    class="submit-btn"
    href="${release.links.bandcamp}"
    target="_blank">

        VISIT BANDCAMP

    </a>

</div>

<div class="submission-box">

    <h2>YOU MAY ALSO LIKE</h2>

    <div class="submission-text">

       ${
       release.similar
       ?
       release.similar.map(artist => `

      <a
      href="artist.html?artist=${encodeURIComponent(artist)}"
      class="similar-link">

      ${artist}

      </a>

      `).join("<br>")
      :
      "No similar artists"
      } 

    </div>

</div>
<div class="submission-box">

    <h2>EXPLORE MORE</h2>

    <div class="release-navigation">

        <a
        href="release.html?id=${prevRelease}"
        class="submit-btn">

            ← PREVIOUS

        </a>

        <a
        href="release.html?id=${nextRelease}"
        class="submit-btn">

            NEXT →

        </a>

    </div>

</div>

`;  
   
    }catch(error){
    
        console.error(error);

        releasePage.innerHTML =
        "ERROR LOADING RELEASE";

    }

}

loadRelease();
function addToCollection(id){

    let collection =
    JSON.parse(
        localStorage.getItem(
            "ossvariumCollection"
        ) || "[]"
    );

    if(
        !collection.includes(id)
    ){

        collection.push(id);

        localStorage.setItem(
            "ossvariumCollection",
            JSON.stringify(collection)
        );

        alert(
            "ADDED TO YOUR COLLECTION"
        );

    }else{

        alert(
            "ALREADY IN COLLECTION"
        );

    }
} //
function removeFromCollection(id){

    let collection =
    JSON.parse(
        localStorage.getItem(
            "ossvariumCollection"
        ) || "[]"
    );

    collection =
    collection.filter(
        item =>
        String(item) !== String(id)
    );

    localStorage.setItem(
        "ossvariumCollection",
        JSON.stringify(collection)
    );

    alert(
        "REMOVED FROM COLLECTION"
    );

    location.reload();

}
