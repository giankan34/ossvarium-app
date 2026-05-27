const releaseContainer =
document.getElementById(
    "releaseContainer"
);

async function loadReleases(){

    try{

        const response =
        await fetch(
            './data/releases.json'
        );

        const releases =
        await response.json();

        releaseContainer.innerHTML = "";

        releases.forEach(
        (release,index)=>{

            const unlocked =
            isUnlocked(index);

            const card =
            document.createElement(
                "div"
            );

            card.className =
            "release-card";

            const badgeClass =
            release.locked
            ? (
                unlocked
                ? "badge-unlocked"
                : "badge-premium"
            )
            : "badge-free";

            const badgeText =
            release.locked
            ? (
                unlocked
                ? "UNLOCKED"
                : `🔒 ${release.price} TEST PI`
            )
            : "FREE DEMO";

            card.innerHTML = `

                <div class="release-title">

                    ${release.release}

                </div>

                <div class="release-artist">

                    ${release.artist}

                </div>

                <div class="release-desc">

                    ${release.genre}
                    •
                    ${release.year}

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
                    release.locked &&
                    !unlocked
                    ?
                    `
                    <button
                    class="btn"
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
                    class="btn"
                    onclick="triggerPiPayment(${index})">

                    PAY WITH TEST PI

                    </button>

                    <div
                    id="payment-${index}"
                    class="payment-status">

                    </div>

                </div>

                <audio
                class="audio-player"
                controls
                ${
                    release.locked &&
                    !unlocked
                    ? "style='display:none;'"
                    : ""
                }>

                    <source
                    src="${release.audio}"
                    type="audio/mpeg">

                </audio>

            `;

            releaseContainer.appendChild(
                card
            );

        });

    }catch(error){

        console.error(
            "Release loading error:",
            error
        );

    }

}

loadReleases();
