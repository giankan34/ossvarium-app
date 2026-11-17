const canvas = document.getElementById("visualizer");
if (canvas) {
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
        canvas.width = canvas.offsetWidth || 300;
        canvas.height = canvas.offsetHeight || 100;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const bars = [];
    for (let i = 0; i < 48; i++) {
        bars.push({ height: Math.random() * 80 });
    }

    let isVisible = true;
    let animFrameId = null;

    // Σταματάει το animation όταν το visualizer φεύγει από την οθόνη
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                isVisible = entry.isIntersecting;
                if (isVisible && !animFrameId) {
                    animFrameId = requestAnimationFrame(animate);
                }
            });
        }, { threshold: 0.05 });
        observer.observe(canvas);
    }

    function animate() {
        animFrameId = null;
        if (!isVisible || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = canvas.width / bars.length;
        const now = Date.now() * 0.0015;

        // Ένα gradient ανά frame αντί για 48 συνεχόμενες δεσμεύσεις μνήμης
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#ff4b4b");
        gradient.addColorStop(1, "#220404");
        ctx.fillStyle = gradient;

        for (let index = 0; index < bars.length; index++) {
            const bar = bars[index];
            const pulse = Math.sin(now + index * 0.45);
            let h = 35 + pulse * 22 + Math.random() * 6;
            if (h < 10) h = 10;
            if (h > canvas.height) h = canvas.height;
            bar.height = h;

            ctx.fillRect(
                index * barWidth,
                canvas.height - h,
                Math.max(1, barWidth - 3),
                h
            );
        }

        animFrameId = requestAnimationFrame(animate);
    }

    animFrameId = requestAnimationFrame(animate);
}

async function acquireCatacombSignal() {
    try {
        if (typeof loadOssvariumCatalog !== "function") return;
        const releases = await loadOssvariumCatalog();
        if (!releases || !releases.length) return;

        const randomIndex = Math.floor(Math.random() * releases.length);
        const release = releases[randomIndex];

        const signalStatus = document.querySelector(".signal-status");
        const signalRelease = document.getElementById("signalRelease");

        setTimeout(() => {
            if (signalStatus) signalStatus.textContent = "SIGNAL ACQUIRED";
            if (signalRelease) {
                signalRelease.innerHTML = `
                    <div class="signal-artist">${release.artist || ""}</div>
                    <div class="signal-title">${release.release || ""}</div>
                    <a class="submit-btn signal-trace" href="release.html?id=${randomIndex}">
                        TRACE SIGNAL
                    </a>
                `;
            }
        }, 1800);
    } catch (error) {
        console.error("CATACOMB SIGNAL ERROR:", error);
    }
}

acquireCatacombSignal();
