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

function extractYouTubeVideoId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(String(url).trim());
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] || null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] || null;
      }
    }
  } catch (err) {}
  return null;
}

function extractArtistPhotos(artist) {
  if (!artist) return [];
  const rawList = [];

  const candidates = [
    artist.photos,
    artist.gallery,
    artist.vault,
    artist.links && artist.links.photos,
    artist.links && artist.links.gallery,
    artist.links && artist.links.vault
  ];

  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    if (!cand) continue;
    if (Array.isArray(cand)) {
      for (let j = 0; j < cand.length; j++) rawList.push(cand[j]);
    } else if (typeof cand === "string") {
      const parts = cand.split(/[\r\n,]+/).map(function(s) { return s.trim(); }).filter(Boolean);
      for (let j = 0; j < parts.length; j++) rawList.push(parts[j]);
    }
  }

  const photos = [];
  const seenUrls = new Set();

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    let url = "";
    let caption = "";

    if (typeof item === "string") {
      url = item.trim();
    } else if (item && typeof item === "object") {
      url = String(item.url || item.src || item.image || "").trim();
      caption = String(item.caption || item.title || item.desc || "").trim();
    }

    if (!url) continue;

    try {
      const parsed = new URL(url, window.location.origin);
      if (["http:", "https:"].includes(parsed.protocol) || url.startsWith("./") || url.startsWith("/")) {
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          photos.push({
            url: url,
            caption: caption
          });
        }
      }
    } catch (e) {}
  }

    if (photos.length === 0 && artist) {
    if (artist.artistImage) {
      photos.push({
        url: artist.artistImage,
        caption: (artist.artist || "Artist") + " — Band Portrait"
      });
    }
    if (artist.banner && artist.banner !== artist.artistImage) {
      photos.push({
        url: artist.banner,
        caption: (artist.artist || "Artist") + " — Ritual Banner"
      });
    }
    if (artist.cover && artist.cover !== artist.artistImage && artist.cover !== artist.banner) {
      photos.push({
        url: artist.cover,
        caption: (artist.release || "Relic") + " — Cover Artwork"
      });
    }
  }


  return photos;
}

function initRitualVaultLightbox(photos, artistName) {
  if (!photos || photos.length === 0) return;

  let currentIndex = 0;
  let lightbox = document.getElementById("ritualLightbox");

  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "ritualLightbox";
    lightbox.className = "ritual-lightbox";
    lightbox.style.display = "none";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.innerHTML = [
      '<div class="ritual-lightbox-backdrop" id="ritualLightboxBackdrop"></div>',
      '<div class="ritual-lightbox-content">',
      '  <button type="button" class="ritual-lightbox-close" id="ritualLightboxClose" aria-label="Close">✕</button>',
      '  <button type="button" class="ritual-lightbox-nav prev" id="ritualLightboxPrev" aria-label="Previous">❮</button>',
      '  <div class="ritual-lightbox-stage">',
      '    <img id="ritualLightboxImg" src="" alt="Ritual Vault Photo">',
      '    <div class="ritual-lightbox-meta">',
      '      <span id="ritualLightboxCounter" class="ritual-lightbox-counter"></span>',
      '      <span id="ritualLightboxCaption" class="ritual-lightbox-caption"></span>',
      '    </div>',
      '  </div>',
      '  <button type="button" class="ritual-lightbox-nav next" id="ritualLightboxNext" aria-label="Next">❯</button>',
      '</div>'
    ].join("\\n");
    document.body.appendChild(lightbox);
  }

  const imgEl = document.getElementById("ritualLightboxImg");
  const counterEl = document.getElementById("ritualLightboxCounter");
  const captionEl = document.getElementById("ritualLightboxCaption");
  const closeBtn = document.getElementById("ritualLightboxClose");
  const prevBtn = document.getElementById("ritualLightboxPrev");
  const nextBtn = document.getElementById("ritualLightboxNext");
  const backdrop = document.getElementById("ritualLightboxBackdrop");

  function showPhoto(index) {
    if (index < 0) index = photos.length - 1;
    if (index >= photos.length) index = 0;
    currentIndex = index;

    const p = photos[currentIndex];
    imgEl.src = p.url;
    imgEl.alt = p.caption || (artistName + " Ritual Photo");
    counterEl.textContent = "⚔ " + (currentIndex + 1) + " / " + photos.length + " ⚔";
    if (p.caption) {
      captionEl.textContent = p.caption;
      captionEl.style.display = "block";
    } else {
      captionEl.textContent = "";
      captionEl.style.display = "none";
    }
  }

  function openLightbox(index) {
    showPhoto(index);
    lightbox.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.style.display = "none";
    document.body.style.overflow = "";
    imgEl.src = "";
  }

  closeBtn.onclick = closeLightbox;
  backdrop.onclick = closeLightbox;

  prevBtn.onclick = function(e) {
    e.stopPropagation();
    showPhoto(currentIndex - 1);
  };

  nextBtn.onclick = function(e) {
    e.stopPropagation();
    showPhoto(currentIndex + 1);
  };

  document.addEventListener("keydown", function(e) {
    if (lightbox.style.display !== "flex") return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showPhoto(currentIndex - 1);
    if (e.key === "ArrowRight") showPhoto(currentIndex + 1);
  });

  const items = document.querySelectorAll(".ritual-vault-item");
  items.forEach(function(item) {
    const handler = function() {
      const idx = parseInt(item.getAttribute("data-vault-index"), 10);
      if (!isNaN(idx)) openLightbox(idx);
    };
    item.onclick = handler;
    item.onkeydown = function(e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handler();
      }
    };
  });
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

        const artistPhotos = extractArtistPhotos(artist);


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

${(() => {
    const videoId = extractYouTubeVideoId(artist.links?.youtube || artist.links?.video);
    if (!videoId) return "";
    return `
<div class="submission-box ritual-video-box">
    <h2>☠ RITUAL TRANSMISSION ☠</h2>
    <div class="ritual-video-wrapper">
        <iframe
            src="https://www.youtube-nocookie.com/embed/${escapeHtml(videoId)}?rel=0"
            title="Ritual Transmission"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
        </iframe>
    </div>
</div>
`;
})()}

${(() => {
    if (!artistPhotos || artistPhotos.length === 0) return "";
    return `
<div class="submission-box ritual-vault-box">
    <h2>☠ RITUAL VAULT ☠</h2>
    <div class="ritual-vault-grid" id="ritualVaultGrid">
        ${artistPhotos.map((photo, idx) => `
            <div class="ritual-vault-item" data-vault-index="${idx}" tabindex="0" role="button" aria-label="Open photo ${idx + 1}">
                <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.caption || artist.artist + ' Ritual Photo')}" loading="lazy">
                <div class="ritual-vault-overlay">
                    <span class="ritual-vault-icon">👁</span>
                    ${photo.caption ? `<div class="ritual-vault-caption">${escapeHtml(photo.caption)}</div>` : ''}
                </div>
            </div>
        `).join("")}
    </div>
</div>
`;
})()}





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

        initRitualVaultLightbox(artistPhotos, artist.artist);

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
