const params = new URLSearchParams(window.location.search);

const genreName = params.get("genre");

const genreTitle = document.getElementById("genreTitle");

genreTitle.textContent = genreName;

fetch("data/releases.json")
.then(response => response.json())
.then(data => {

    const results = document.getElementById("genreResults");

    const filtered = data.filter(item =>
        item.genre.toLowerCase().includes(
            genreName.toLowerCase()
        )
    );

    results.innerHTML = filtered.map(item => `

        <a href="release.html?artist=${encodeURIComponent(item.artist)}&release=${encodeURIComponent(item.release)}"
           style="text-decoration:none;">

            <div class="release-card">

                <img
                src="${item.cover}"
                class="release-cover">

                <div class="release-title">
                    ${item.release}
                </div>

                <div class="release-artist">
                    ${item.artist}
                </div>

            </div>

        </a>

    `).join("");

});
