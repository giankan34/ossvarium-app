const container =
document.getElementById("certificate-container");

const loading =
document.getElementById("loading-screen");

const loadingText =
document.getElementById("loading-text");

const loadingFill =
document.getElementById("loading-fill");

const params =
new URLSearchParams(window.location.search);

const id =
Number(params.get("id") || 0);

fetch("./data/releases.json")

.then(r=>r.json())

.then(releases=>{

const release =
releases[id];

container.innerHTML = `

<div class="certificate">

<div class="cert-title">

OSSVARIUM

</div>

<div class="cert-subtitle">

CERTIFICATE OF PRESERVATION

</div>

<div class="cert-line">
<span class="cert-label">RELIC ID</span>
<span class="cert-value">
OSV-${String(id+1).padStart(5,"0")}
</span>
</div>

<div class="cert-line">
<span class="cert-label">ARTIST</span>
<span class="cert-value">
${release.artist}
</span>
</div>

<div class="cert-line">
<span class="cert-label">TITLE</span>
<span class="cert-value">
${release.release}
</span>
</div>

<div class="cert-line">
<span class="cert-label">CLASSIFICATION</span>
<span class="cert-value">
${release.genre}
</span>
</div>

<div class="cert-line">
<span class="cert-label">COUNTRY</span>
<span class="cert-value">
${release.country}
</span>
</div>

<div class="cert-line">
<span class="cert-label">RELEASE YEAR</span>
<span class="cert-value">
${release.year}
</span>
</div>

<div class="cert-line">
<span class="cert-label">ARCHIVED</span>
<span class="cert-value">
2026
</span>
</div>

<div class="cert-footer">

This relic has been officially examined,
authenticated and permanently preserved
inside the

<br><br>

<strong>OSSVARIUM ARCHIVES</strong>

<br><br>

by order of the Curator.

<br><br><br>

────────────────────────

<br>

CURATOR SIGNATURE

<br><br>

OSSVARIUM ARCHIVES

<br>

CERTIFICATE No.

OSV-CERT-2026-${String(id+1).padStart(5,"0")}

</div>

</div>

`;

loadingFill.style.width = "25%";
loadingText.innerText = "Authenticating...";

setTimeout(()=>{

    loadingFill.style.width = "60%";
    loadingText.innerText = "Locating Certificate...";

},800);

setTimeout(()=>{

    loadingFill.style.width = "100%";
    loadingText.innerText = "Opening Archive...";

},1700);

setTimeout(()=>{

    loading.style.display="none";

    container.style.display="block";

},2800);
  
});
