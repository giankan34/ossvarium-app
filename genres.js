fetch("data/releases.json")
.then(response => response.json())
.then(data => {

    const genres =
    [...new Set(
        data.map(item => item.genre)
    )];

    const container =
    document.getElementById(
        "genresContainer"
    );

    container.innerHTML =
    genres.map(genre => `

        <a
        href="genre.html?genre=${encodeURIComponent(genre)}"
        class="genre-hub-link">

            <div class="genre-hub-card">

                ${genre}

            </div>

        </a>

    `).join("");

});
