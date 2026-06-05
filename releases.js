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

        releaseContainer.innerHTML = "";
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
        class="submit-btn"
        href="release.html?id=${releases.indexOf(topThree[0])}">

            🥇 ${topThree[0]?.release}

        </a>

        <br><br>

        <a
        class="submit-btn"
        href="release.html?id=${releases.indexOf(topThree[1])}">

            🥈 ${topThree[1]?.release}

        </a>

        <br><br>

        <a
        class="submit-btn"
        href="release.html?id=${releases.indexOf(topThree[2])}">

            🥉 ${topThree[2]?.release}

        </a>

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

        // Genres

        const genres = {};

        releases.forEach((release)=>{

            if(!genres[release.genre]){

                genres[release.genre] = [];

            }

            genres[release.genre].push(
                release
            );

        });

        Object.keys(genres)
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
