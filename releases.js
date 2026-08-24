const releaseContainer =
document.getElementById(
    "releaseContainer"
);

async function loadReleases(){

    try{

        const response =
        await fetch(
            "./data/releases.json"
        );

        const releases =
        await response.json();
        const params =
        new URLSearchParams(
            window.location.search
        );

        const selectedGenre =
        params.get("genre");

        const filteredReleases =
        selectedGenre
            ? releases.filter(
                release =>
                release.genre === selectedGenre
           )
           : releases;
        
        const totalReleases =
        releases.length;

        const totalGenres =
        new Set(
            releases.map(
                release =>
                release.genre
            )
        ).size;

        const totalSupporters =
        releases.reduce(
            (sum,release)=>
            sum +
            Number(
                release.supporters || 0
            ),
            0
         );
        const genreCounts = {};

releases.forEach((release)=>{

    if(!genreCounts[release.genre]){

        genreCounts[release.genre] = 0;

    }

    genreCounts[release.genre]++;

});
        releaseContainer.innerHTML = "";
        releaseContainer.innerHTML += `

<div class="submission-box">

    <h2>

        📊 OSSVARIUM STATS

    </h2>

    <div class="submission-text">

        📀 RELEASES:
        ${totalReleases}

        <br><br>

        🎵 GENRES:
        ${totalGenres}

        <br><br>

        🔥 PIONEERS:
        ${totalSupporters}

    </div>

</div>

`;
  releaseContainer.innerHTML += `

<div class="submission-box">

    <h2>

        🎵 BROWSE GENRES

    </h2>

    <div class="submission-text">

        <a
        class="submit-btn"
        href="index.html">

            ALL

        </a>

        <br><br>

        ${Object.keys(genreCounts)
        .map(genre => `

            <a
            class="submit-btn"
            href="?genre=${encodeURIComponent(genre)}#genreResults">

                ${genre}
                (${genreCounts[genre]})

            </a>

            <br><br>

        `).join("")}

    </div>

</div>

`;
        const latestReleases =
[...releases]
.slice(-3)
.reverse();

releaseContainer.innerHTML += `

<div class="submission-box">

    <h2>

        ⚡ LATEST ADDITIONS

    </h2>

    <div class="submission-text">

        ${latestReleases.map(
            release => `
            <a
            class="submit-btn"
            href="release.html?id=${releases.indexOf(release)}">

                ${release.artist}
                -
                ${release.release}

            </a>

            <br><br>
            `
        ).join("")}

    </div>

</div>

`;
        releaseContainer.innerHTML += `

        <div class="submission-box">

            <h2>RELEASES</h2>

            <div class="submission-text">

                ${releases.length} RELEASES AVAILABLE

            </div>

        </div>

`;const topRelease =
releases.reduce(
    (top,current)=>
    Number(current.supporters) >
    Number(top.supporters)
    ? current
    : top
);

releaseContainer.innerHTML += `

<a
href="release.html?id=${releases.indexOf(topRelease)}"
style="text-decoration:none;">

<div class="featured-release">

    <div class="featured-label">

        🔥 TOP SUPPORTED RELEASE

    </div>

    <img
    class="featured-cover"
    src="${topRelease.cover}"
    alt="${topRelease.release}">

    <div class="featured-title">

        ${topRelease.release}

    </div>

    <div class="featured-artist">

        ${topRelease.artist}

    </div>

    <div class="submission-text">

        🔥 ${topRelease.supporters} PIONEERS

    </div>

</div>

</a>

`;
        // Featured Release

        if(releases.length > 0){

            releaseContainer.innerHTML += `

            <a
            href="release.html?id=0"
            style="text-decoration:none;">

            <div class="featured-release">

                <div class="featured-label">

                    FEATURED RELEASE

               </div>

               <img
               class="featured-cover"
               src="${releases[0].cover}"
               alt="${releases[0].release}">

               <div class="featured-title">${releases[0].release}

               </div>

               <div class="featured-artist">${releases[0].artist}

               </div>

            </div>

            </a>

            `;
const topThree =
[...releases]
.sort(
    (a,b)=>
    Number(b.supporters) -
    Number(a.supporters)
)
.slice(0,3);

releaseContainer.innerHTML += `

<div class="submission-box">

    <h2>

        🏆 HALL OF FAME

    </h2>

    <div class="submission-text">

        <a
        class="hall-card hall-legend"
        href="release.html?id=${releases.indexOf(topThree[0])}">

        <div class="legend-crown">

        👑 LEGEND OF THE CATACOMBS

        </div>

        <img
        class="hall-cover"
        src="${topThree[0]?.cover}"
        alt="${topThree[0]?.release}">

      🥇 ${topThree[0]?.release}

      <br>

      <span class="hall-artist">

      ${topThree[0]?.artist}

      </span>

      <br>

      ❤️ ${topThree[0]?.supporters} PIONEERS 

        </a>

        <br><br>

        <a
        class="hall-card"
        href="release.html?id=${releases.indexOf(topThree[1])}">

        <img
        class="hall-cover"
        src="${topThree[1]?.cover}"
        alt="${topThree[1]?.release}">

      🥈 ${topThree[1]?.release}

      <br>

      <span class="hall-artist">

      ${topThree[1]?.artist}

      </span>

      <br>

      ❤️ ${topThree[1]?.supporters} PIONEERS

        </a>

        <br><br>

        <a
        class="hall-card"
        href="release.html?id=${releases.indexOf(topThree[2])}">

        <img
        class="hall-cover"
        src="${topThree[2]?.cover}"
        alt="${topThree[2]?.release}">

        🥉 ${topThree[2]?.release}

        <br>

        <span class="hall-artist">

        ${topThree[2]?.artist}

        </span>

        <br>

        ❤️ ${topThree[2]?.supporters} PIONEERS 

        </a>

    </div>

</div>

`;

releaseContainer.innerHTML += `

<div class="submission-box">

<h2>

⚔ CATACOMB NEWS

</h2>

<div class="submission-text">

👑 Hall Leader

<br>

<b>

 ${topThree[0].release}
 
 </b>

<br><br>

🔥 Newest Relic

<br>

<b>

 ${releases[releases.length-1].release}
 
 </b>

<br><br>

🎵 Genres

<br>

<b>

 ${totalGenres}
 
</b>

<br><br>

❤️

<b>

${totalSupporters}

</b>

Pioneers support the Underground

</div>

</div>

`;
            
     const featuredArtist =
releases[
    Math.floor(
        Math.random() *
        releases.length
    )
];
     releaseContainer.innerHTML += `

     <div class="featured-release">

         <div class="featured-label">

             🎭 FEATURED ARTIST

         </div>

         <img
         class="featured-cover"
         src="${featuredArtist.cover}"
         alt="${featuredArtist.artist}">

         <div class="featured-title">${featuredArtist.artist}

         </div>

        <div class="featured-artist">${featuredArtist.country}

            •

            ${featuredArtist.genre}

         </div>

         <div class="submission-text">

            ${featuredArtist.bio}

         </div>

          <br>

          <a
          class="submit-btn"
          href="release.html?id=${releases.indexOf(featuredArtist)}">

              VIEW RELEASE

          </a>

           </div>

`;
        }

        if (selectedGenre) {

    releaseContainer.innerHTML += `

    <div id="genreResults"></div>

    <div class="submission-box">

        <h2>
            ⚰ ${selectedGenre.toUpperCase()}
        </h2>

        <div class="submission-text">

            ${filteredReleases.length}
            ${filteredReleases.length === 1 ? "RELIC" : "RELICS"}
            FOUND IN THE ARCHIVE

            <br><br>

            <a
            class="submit-btn"
            href="index.html">

                ← RETURN TO ALL GENRES

            </a>

        </div>

    </div>

    `;

}
        
        const genres = {};

        filteredReleases.forEach((release)=>{

            if(!genres[release.genre]){

                genres[release.genre] = [];

            }

            genres[release.genre].push(
                release
            );

        });

        Object.keys(genres)
        .sort()
        .forEach((genre)=>{

            releaseContainer.innerHTML += `

            <div class="genre-title">

                ${genre}

            </div>

            `;

            genres[genre]
            .forEach((release,index)=>{

                const card =
                document.createElement(
                    "div"
                );

                card.className =
                "release-card";

                card.innerHTML = `

                <a
                href="release.html?id=${releases.indexOf(release)}">

                <img
                class="release-cover"
                src="${release.cover}"
                alt="${release.release}">

                </a>

                <div class="release-title">

                    ${release.release}

                </div>

                <div class="release-artist">

                    ${release.artist}

                </div>

                <div class="release-meta">

                    ${release.genre}
                    •
                    ${release.year}

                </div>

                <div class="release-desc">

                    ${release.description}

                </div>

                <a
                class="submit-btn"
                href="release.html?id=${releases.indexOf(release)}">

                VIEW RELEASE

                 </a>

                `;

                releaseContainer
                .appendChild(card);

            });

        });

        if (selectedGenre) {

    const genreResults =
        document.getElementById("genreResults");

    if (genreResults) {

        genreResults.scrollIntoView({
            behavior:"smooth",
            block:"start"
        });

    }

}

    }catch(error){

        console.error(
            "Release loading error:",
            error
        );

    }

}
document.addEventListener(
    "input",
    (e)=>{

        if(
            e.target.id !==
            "searchInput"
        ) return;

        const search =
        e.target.value
        .toLowerCase();

        document
        .querySelectorAll(
            ".release-card"
        )
        .forEach((card)=>{

            const text =
            card.innerText
            .toLowerCase();

            card.style.display =
            text.includes(search)
            ? "block"
            : "none";

        });

    }
);
loadReleases();
