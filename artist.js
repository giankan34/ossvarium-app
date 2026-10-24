const artistPage =
document.getElementById(
    "artistPage"
);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeArtistUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return ["https:", "http:"].includes(url.protocol) ? escapeHtml(url.href) : "";
  } catch { return ""; }
}

async function loadArtist(){

    try{

        const releases =
    await loadOssvariumCatalog();

        const params =
        new URLSearchParams(
            window.location.search
        );

        const artistName =
        params.get("artist");

        const artistMerchLink = document.getElementById("artistMerchLink");

if (artistMerchLink && artistName) {
  artistMerchLink.href =
    `merch.html?artist=${encodeURIComponent(artistName)}`;
}

        const artistReleases =
        releases.filter(
            release =>
            release.artist === artistName
        );

        if(
            artistReleases.length === 0
        ){

            artistPage.innerHTML =
            "ARTIST NOT FOUND";

            return;

        }

        const artist =
        artistReleases[0];

        const totalArtistSupporters =
    artistReleases.reduce(
        (sum, release) =>
            sum + Number(release.supporters || 0),
        0
    );

        artistPage.innerHTML = `

        <div class="release-card">

            ${artist.artistImage
? `
    <img
    class="artist-image"
    src="${escapeHtml(artist.artistImage)}"
    alt="${escapeHtml(artist.artist)}">
`
: `
    <div class="artist-image artist-image-fallback">
        ☠ NO ARTIST IMAGE ☠
    </div>
`
}

        <div class="artist-banner">

    ${artist.banner
    ? `
        <img
        src="${escapeHtml(artist.banner)}"
        alt="${escapeHtml(artist.artist)}">
    `
    : `
        <div class="no-cover">
            ☠ NO ARTIST BANNER ☠
        </div>
    `
    }

</div>
        
            <div class="release-title">

                ${escapeHtml(artist.artist)}

            </div>

            <div class="release-meta">

                ${escapeHtml(artist.country)}
                •

                <a
                href="genre.html?genre=${escapeHtml(encodeURIComponent(artist.genre))}"
                class="genre-link">

                    ${escapeHtml(artist.genre)}

                </a>

             </div>

            <div class="release-desc">

                ${escapeHtml(artist.bio)}

            </div>

            ${artist.publicEmail ? `
  <div class="release-desc">
    <strong>CONTACT EMAIL:</strong>
    <a href="mailto:${encodeURIComponent(artist.publicEmail)}">
      ${escapeHtml(artist.publicEmail)}
    </a>
  </div>
` : ""}

<div class="artist-stats">

    <div class="stat-row">

        <span>RELEASES</span>

        <span>${artistReleases.length}</span>

    </div>

    <div class="stat-row">

        <span>COUNTRY</span>

        <span>${escapeHtml(artist.country)}</span>

    </div>

    <div class="stat-row">

        <span>GENRE</span>

        <span>${escapeHtml(artist.genre)}</span>

    </div>

    <div class="stat-row">

        <span>SUPPORTERS</span>

        <span>${totalArtistSupporters}</span>

    </div>

</div>
        </div>

       <div class="submission-box">

    <h2>

        📀 RELEASES

    </h2>

    <div class="submission-text">

        ${artistReleases.map(
    release => `

    <div class="artist-release-entry">

        <a
        class="submit-btn"
        href="release.html?id=${releases.indexOf(release)}">

            ${escapeHtml(release.release)}

        </a>

        <div class="artist-release-meta">
            ${escapeHtml(release.year || "UNKNOWN YEAR")}
            •
            ${escapeHtml(release.genre || artist.genre)}
        </div>

    </div>

    `
).join("")}

    </div>

</div>

${artist.similar && artist.similar.length ? `

<div class="submission-box">

    <h2>☠ SIMILAR ARTISTS</h2>

    <div class="submission-text similar-artists-grid">

        ${artist.similar.map(name => {

            const existsInArchive =
                releases.some(
                    release => release.artist === name
                );

            if (existsInArchive) {

                return `
                    <a
                    class="submit-btn"
                    href="artist.html?artist=${escapeHtml(encodeURIComponent(name))}">

                        ${escapeHtml(name)}

                    </a>

                `;

            }

            return `
                <span class="similar-unavailable">
                    ${escapeHtml(name)}
                </span>

                <br><br>
            `;

        }).join('')}

    </div>

</div>

` : ''}


<div class="submission-box" id="artistMerchSection" style="display:none;">

    <h2>☠ OFFICIAL ARTIST MERCH ☠</h2>

    <div class="submission-text" id="artistMerchProducts"></div>

</div>


<div class="submission-box">

    <h2>🔗 OFFICIAL LINKS</h2>

    <div class="submission-text">

        ${artist.links?.bandcamp ? `
            <a class="submit-btn"
               href="${safeArtistUrl(artist.links.bandcamp)}"
               target="_blank" rel="noopener noreferrer">
                BANDCAMP
            </a>
            <br><br>
        ` : ''}

        ${artist.links?.spotify ? `
            <a class="submit-btn"
               href="${safeArtistUrl(artist.links.spotify)}"
               target="_blank" rel="noopener noreferrer">
                SPOTIFY
            </a>
            <br><br>
        ` : ''}

        ${artist.links?.youtube ? `
            <a class="submit-btn"
               href="${safeArtistUrl(artist.links.youtube)}"
               target="_blank" rel="noopener noreferrer">
                YOUTUBE
            </a>
            <br><br>
        ` : ''}

        ${artist.links?.website ? `
            <a class="submit-btn"
               href="${safeArtistUrl(artist.links.website)}"
               target="_blank" rel="noopener noreferrer">
                WEBSITE
            </a>
            <br><br>
        ` : ''}

        ${artist.links?.merch ? `
            <a class="submit-btn"
               href="${safeArtistUrl(artist.links.merch)}"
               target="_blank" rel="noopener noreferrer">
                MERCH
            </a>
            <br><br>
        ` : ''}

        ${artist.links?.instagram ? `
            <a class="submit-btn"
               href="${safeArtistUrl(artist.links.instagram)}"
               target="_blank" rel="noopener noreferrer">
                INSTAGRAM
            </a>
            <br><br>
        ` : ''}

        ${artist.links?.facebook ? `
            <a class="submit-btn"
               href="${safeArtistUrl(artist.links.facebook)}"
               target="_blank" rel="noopener noreferrer">
                FACEBOOK
            </a>
        ` : ''}

        
${artist.links?.liveShows ? `
  <a class="submit-btn"
     href="${safeArtistUrl(artist.links.liveShows)}"
     target="_blank"
     rel="noopener noreferrer">
    LIVE SHOWS / TOUR DATES
  </a>
  <br><br>
` : ''}


    </div>

</div>

        `;

        try {

const merchResponse = await fetch("/api/submit-merch?action=catalog");

if (merchResponse.ok) {
    const merchData = await merchResponse.json();

    const artistMerch = (Array.isArray(merchData.products)
        ? merchData.products
        : []
    ).filter(product =>
    String(product.artist_name || "").trim().toLowerCase() ===
    String(artistName || "").trim().toLowerCase()
);

    const merchSection = document.getElementById("artistMerchSection");
    const merchContainer = document.getElementById("artistMerchProducts");

    if (artistMerch.length > 0 && merchSection && merchContainer) {
        for (const product of artistMerch) {
            const entry = document.createElement("div");
            entry.className = "artist-release-entry";

            const link = document.createElement("a");
            link.className = "submit-btn";
            link.href = `merch.html?product=${encodeURIComponent(product.id)}`;
            link.textContent = product.product_name;

            entry.appendChild(link);
            merchContainer.appendChild(entry);
        }

        merchSection.style.display = "block";
    }
}

} catch (merchError) {
    console.warn("Artist merch unavailable:", merchError);
}

    }catch(error){

        console.error(error);

        artistPage.innerHTML =
        "ERROR LOADING ARTIST";

    }

}

loadArtist();
