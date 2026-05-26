const releaseContainer =
document.getElementById("releaseContainer");

async function loadReleases(){

    try{

        const response =
        await fetch('./data/releases.json');

        const releases =
        await response.json();

        releases.forEach((release,index)=>{

            const card =
            document.createElement("div");

            card.className =
            "release-card";

            const badgeClass =
            release.locked
            ? "badge-premium"
            : "badge-free";

            const badgeText =
            release.locked
            ? `🔒 ${release.price} TEST PI`
            : "FREE DEMO";

            card.innerHTML = `

                <div class="release-title">
                    ${release.release}
                </div>

                <div class="release-artist">
                    ${release.artist}
                </div>

                <div class="release-desc">
                    ${release.description}
                </div>

                <div
                id="badge-${index}"
                class="badge ${badgeClass}">
                    ${badgeText}
                </div>

                ${
                    release.locked
                    ?
                    `
                    <button
                    class="btn btn-main"
                    onclick="openUnlock(${index})">
                    UNLOCK RELEASE
                    </button>
                    `
                    :
                    ''
                }

                <div
                id="unlock-${index}"
                class="unlock-box">

                    <button
                    class="btn btn-main"
                    onclick="triggerPiPayment(${index})">

                    PAY WITH TEST PI

                    </button>

                    <div
                    id="payment-${index}"
                    class="payment-status">

                    </div>

                </div>

                <div
                id="player-${index}"
                class="bandcamp-frame"
                style="
                display:
                ${
                    release.locked
                    ? "none"
                    : "block"
                };
                ">

                    <iframe
                    style="height:120px;"
                    src="${release.bandcamp}"
                    seamless>
                    </iframe>

                </div>

            `;

            releaseContainer.appendChild(card);

        });

    }catch(error){

        console.error(error);

    }

}

loadReleases();
