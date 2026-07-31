const container =
document.getElementById("certificate-container");

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

This relic has been officially authenticated
and permanently preserved inside the
<strong>OSSVARIUM ARCHIVES.</strong>

<br><br>

Future generations shall remember its existence.

</div>

</div>

`;

});
