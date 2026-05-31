card.innerHTML = `

    <img
    class="release-cover"
    src="${release.cover}"
    alt="${release.release}">

    <div class="release-title">

        ${release.release}

    </div>

    <div class="release-artist">

        ${release.artist}

    </div>

    <div class="release-meta">

        ${release.genre} • ${release.year}

    </div>

    <div class="release-desc">

        ${release.description}

    </div>

    <button
    class="btn view-release-btn">

        VIEW RELEASE

    </button>

`;
