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
        ].join("");
        document.body.appendChild(lightbox);
    window.openRitualVaultLightbox = openLightbox;

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

function initRitualVaultCarousel(photos, artistName) {
  if (!photos || photos.length === 0) return;

  const slides = document.querySelectorAll(".vault-carousel-slide");
  const dots = document.querySelectorAll(".vault-dot");
  const stage = document.getElementById("vaultCarouselStage");
  const prevBtn = document.getElementById("vaultCarouselPrev");
  const nextBtn = document.getElementById("vaultCarouselNext");
  const box = document.getElementById("ritualVaultCarousel");

  if (!stage || slides.length === 0) return;

  let currentSlide = 0;
  let timer = null;

  function goToSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    currentSlide = index;

    slides.forEach(function(slide, idx) {
      slide.classList.toggle("active", idx === currentSlide);
    });

    dots.forEach(function(dot, idx) {
      dot.classList.toggle("active", idx === currentSlide);
    });
  }

  function nextSlide() { goToSlide(currentSlide + 1); }
  function prevSlide() { goToSlide(currentSlide - 1); }

  function startAuto() {
    if (photos.length <= 1) return;
    stopAuto();
    timer = setInterval(nextSlide, 3800);
  }

  function stopAuto() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  if (prevBtn) {
    prevBtn.onclick = function(e) {
      e.stopPropagation();
      prevSlide();
      startAuto();
    };
  }

  if (nextBtn) {
    nextBtn.onclick = function(e) {
      e.stopPropagation();
      nextSlide();
      startAuto();
    };
  }

  dots.forEach(function(dot) {
    dot.onclick = function(e) {
      e.stopPropagation();
      const idx = parseInt(dot.getAttribute("data-dot-index"), 10);
      if (!isNaN(idx)) {
        goToSlide(idx);
        startAuto();
      }
    };
  });

  if (box) {
    box.addEventListener("mouseenter", stopAuto);
    box.addEventListener("mouseleave", startAuto);
  }

  stage.onclick = function() {
    if (typeof window.openRitualVaultLightbox === "function") {
      window.openRitualVaultLightbox(currentSlide);
    }
  };

  stage.onkeydown = function(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (typeof window.openRitualVaultLightbox === "function") {
        window.openRitualVaultLightbox(currentSlide);
      }
    }
  };

  startAuto();
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
    <div class="ritual-vault-carousel" id="ritualVaultCarousel">
        <button type="button" class="vault-carousel-btn prev" id="vaultCarouselPrev" aria-label="Previous Photo">❮</button>
        <div class="vault-carousel-stage" id="vaultCarouselStage" tabindex="0" role="button" aria-label="Open full screen lightbox">
            ${artistPhotos.map((photo, idx) => `
                <div class="vault-carousel-slide ${idx === 0 ? 'active' : ''}" data-vault-index="${idx}">
                    <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.caption || artist.artist + ' Ritual Photo')}" loading="lazy">
                    <div class="vault-carousel-overlay">
                        <span class="vault-carousel-icon">👁</span>
                        ${photo.caption ? `<div class="vault-carousel-caption">${escapeHtml(photo.caption)}</div>` : ''}
                    </div>
                </div>
            `).join("")}
        </div>
        <button type="button" class="vault-carousel-btn next" id="vaultCarouselNext" aria-label="Next Photo">❯</button>
    </div>
    ${artistPhotos.length > 1 ? `
    <div class="vault-carousel-dots" id="vaultCarouselDots">
        ${artistPhotos.map((_, idx) => `
            <button type="button" class="vault-dot ${idx === 0 ? 'active' : ''}" data-dot-index="${idx}" aria-label="Go to photo ${idx + 1}"></button>
        `).join("")}
    </div>
    ` : ''}
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

<div class="submission-box ritual-reviews-box" id="artistGuestbookSection">
    <h2>☠ RITUAL GUESTBOOK ☠</h2>
    <div class="ritual-subtitle">DEVOTIONS & TESTIMONIES FOR ${escapeHtml(artist.artist.toUpperCase())}</div>

    <div class="ritual-inscribe-card">
        <div id="guestbook-auth-status" class="inscribe-auth-status">
            <span class="status-msg">Checking Pi connection...</span>
        </div>

        <div class="rating-picker-row">
            <span class="rating-label">DEVOTION:</span>
            <div class="skulls-picker" id="guestbook-skulls-picker">
                <button type="button" class="skull-btn active" data-rating="1" title="1 Skull">☠</button>
                <button type="button" class="skull-btn active" data-rating="2" title="2 Skulls">☠</button>
                <button type="button" class="skull-btn active" data-rating="3" title="3 Skulls">☠</button>
                <button type="button" class="skull-btn active" data-rating="4" title="4 Skulls">☠</button>
                <button type="button" class="skull-btn active" data-rating="5" title="5 Skulls">☠</button>
            </div>
            <span id="guestbook-skulls-count-text" class="skulls-count-text">(5 / 5 Skulls)</span>
        </div>

        <textarea 
            id="guestbook-review-text" 
            class="ritual-review-textarea" 
            rows="3" 
            maxlength="500" 
            placeholder="Inscribe your words of devotion for this artist into the crypt archives..."></textarea>

        <div class="inscribe-actions-row">
            <button type="button" id="submit-guestbook-btn" class="submit-btn ritual-inscribe-btn">
                INSCRIBE DEVOTION
            </button>
        </div>

        <div id="guestbook-status-msg" class="ritual-review-status"></div>
    </div>

    <div class="chronicles-heading">ARCHIVED DEVOTIONS</div>
    <div id="guestbook-reviews-container" class="ritual-reviews-list">
        <div class="reviews-loading-text">Summoning chronicles from the crypt...</div>
    </div>
</div>


        `;

        initRitualVaultLightbox(artistPhotos, artist.artist);
        initRitualVaultCarousel(artistPhotos, artist.artist);
        initializeArtistGuestbook(artist.artist);


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

/* =========================================
   OSSVARIUM - ARTIST GUESTBOOK LOGIC
   ========================================= */

let guestbookSkullRating = 5;
let guestbookPiAuth = null;

async function authenticateGuestbookPiUser() {
    if (typeof Pi === "undefined") {
        console.warn("Pi SDK not loaded");
        return null;
    }
    try {
        guestbookPiAuth = await Pi.authenticate(
            ["username", "payments"],
            function onIncompletePaymentFound(payment) {}
        );
        return guestbookPiAuth;
    } catch (error) {
        console.error("Pi authentication failed:", error);
        return null;
    }
}

function updateGuestbookSkullPickerUI(rating) {
    guestbookSkullRating = rating;
    const picker = document.getElementById("guestbook-skulls-picker");
    const countText = document.getElementById("guestbook-skulls-count-text");
    if (!picker) return;

    const buttons = picker.querySelectorAll(".skull-btn");
    buttons.forEach(function(btn) {
        const btnRating = parseInt(btn.getAttribute("data-rating"), 10);
        if (btnRating <= rating) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    if (countText) {
        countText.textContent = "(" + rating + " / 5 Skulls)";
    }
}

function updateGuestbookAuthStatus() {
    const authStatusEl = document.getElementById("guestbook-auth-status");
    if (!authStatusEl) return;

    if (guestbookPiAuth && guestbookPiAuth.user && guestbookPiAuth.user.username) {
        authStatusEl.innerHTML = `
            <span class="auth-logged-in">
                Inscribing as <span class="auth-highlight">@${escapeHtml(guestbookPiAuth.user.username)}</span>
            </span>
        `;
    } else {
        authStatusEl.innerHTML = `
            <span>Connect your Pi account to inscribe a devotion: </span>
            <button type="button" id="connect-pi-guestbook-btn" class="connect-pi-mini-btn">CONNECT PI</button>
        `;

        const connectBtn = document.getElementById("connect-pi-guestbook-btn");
        if (connectBtn) {
            connectBtn.addEventListener("click", async function() {
                connectBtn.disabled = true;
                connectBtn.textContent = "CONNECTING...";
                try {
                    await authenticateGuestbookPiUser();
                    updateGuestbookAuthStatus();
                } catch (e) {
                    console.error("Guestbook Pi auth error:", e);
                } finally {
                    if (connectBtn) {
                        connectBtn.disabled = false;
                        connectBtn.textContent = "CONNECT PI";
                    }
                }
            });
        }
    }
}

async function loadArtistGuestbook(artistName) {
    const container = document.getElementById("guestbook-reviews-container");
    if (!container || !artistName) return;

    try {
        const response = await fetch("/api/approved-relics?action=reviews&artist=" + encodeURIComponent(artistName) + "&type=artist");
        if (!response.ok) {
            throw new Error("Failed to summon devotions");
        }

        const data = await response.json();
        const reviews = data.reviews || [];

        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="empty-reviews-box">
                    <div>No devotions have been inscribed for this artist yet.</div>
                    <div class="empty-sub">Be the first of the underground faithful to leave your mark.</div>
                </div>
            `;
            return;
        }

        container.innerHTML = reviews.map(function(r) {
            const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric"
            }) : "";

            const ratingCount = Math.max(1, Math.min(5, parseInt(r.rating, 10) || 5));
            const skullsHtml = "☠".repeat(ratingCount);

            return `
                <div class="review-entry-card ${r.is_verified_keeper ? "is-keeper" : ""}">
                    <div class="review-entry-header">
                        <div class="review-user-info">
                            <span class="review-username">@${escapeHtml(r.pi_username || "Anonymous")}</span>
                            ${r.is_verified_keeper ? `<span class="verified-keeper-badge">☠ VERIFIED RELIC KEEPER</span>` : ""}
                        </div>
                        <div class="review-meta">
                            <span class="review-skulls-rating" title="${ratingCount} / 5 Skulls">${skullsHtml}</span>
                            <span class="review-date">${dateStr}</span>
                        </div>
                    </div>
                    <div class="review-comment-body">${escapeHtml(r.comment)}</div>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Error loading artist guestbook:", err);
        container.innerHTML = `<div class="reviews-error-text">The crypt archives are currently veiled. Could not load devotions.</div>`;
    }
}

function initializeArtistGuestbook(artistName) {
    guestbookSkullRating = 5;

    const picker = document.getElementById("guestbook-skulls-picker");
    if (picker) {
        const buttons = picker.querySelectorAll(".skull-btn");
        buttons.forEach(function(btn) {
            btn.addEventListener("click", function() {
                const rating = parseInt(btn.getAttribute("data-rating"), 10);
                updateGuestbookSkullPickerUI(rating);
            });
        });
    }

    if (typeof Pi !== "undefined") {
        try {
            Pi.init({ version: "2.0" });
        } catch (e) {}
    }
    updateGuestbookAuthStatus();

    loadArtistGuestbook(artistName);

    const submitBtn = document.getElementById("submit-guestbook-btn");
    const commentInput = document.getElementById("guestbook-review-text");
    const statusMsg = document.getElementById("guestbook-status-msg");

    if (submitBtn && commentInput) {
        submitBtn.addEventListener("click", async function() {
            if (statusMsg) {
                statusMsg.className = "ritual-review-status";
                statusMsg.textContent = "";
            }

            if (!guestbookPiAuth || !guestbookPiAuth.accessToken) {
                if (statusMsg) {
                    statusMsg.className = "ritual-review-status status-msg";
                    statusMsg.textContent = "Authenticating with Pi...";
                }
                try {
                    await authenticateGuestbookPiUser();
                    updateGuestbookAuthStatus();
                } catch (e) {
                    console.error("Pi Auth failed:", e);
                }
            }

            if (!guestbookPiAuth || !guestbookPiAuth.accessToken) {
                if (statusMsg) {
                    statusMsg.className = "ritual-review-status status-err";
                    statusMsg.textContent = "You must connect your Pi account in Pi Browser to inscribe a devotion.";
                }
                return;
            }

            const comment = (commentInput.value || "").trim();
            if (comment.length < 3) {
                if (statusMsg) {
                    statusMsg.className = "ritual-review-status status-err";
                    statusMsg.textContent = "Your devotion must be at least 3 characters long.";
                }
                commentInput.focus();
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = "INSCRIBING...";
            if (statusMsg) {
                statusMsg.className = "ritual-review-status status-msg";
                statusMsg.textContent = "Inscribing devotion into the crypt archives...";
            }

            try {
                const response = await fetch("/api/approved-relics", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + guestbookPiAuth.accessToken
                    },
                    body: JSON.stringify({
                        action: "inscribe_review",
                        target_type: "artist",
                        artist_name: artistName,
                        rating: guestbookSkullRating,
                        comment: comment
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to inscribe devotion");
                }

                commentInput.value = "";
                updateGuestbookSkullPickerUI(5);

                if (statusMsg) {
                    statusMsg.className = "ritual-review-status status-ok";
                    statusMsg.textContent = "☠ Your devotion has been permanently inscribed in the crypt!";
                }

                await loadArtistGuestbook(artistName);

                setTimeout(function() {
                    if (statusMsg) statusMsg.textContent = "";
                }, 6000);

            } catch (err) {
                console.error("Submission error:", err);
                if (statusMsg) {
                    statusMsg.className = "ritual-review-status status-err";
                    statusMsg.textContent = err.message || "The ritual failed. Please try again.";
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "INSCRIBE DEVOTION";
            }
        });
    }
}
