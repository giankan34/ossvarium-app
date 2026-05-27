const canvas =
document.getElementById(
    "visualizer"
);

const ctx =
canvas.getContext("2d");

let audioContext;
let analyser;
let dataArray;
let animationId;

function resizeCanvas(){

    canvas.width =
    canvas.offsetWidth;

    canvas.height =
    canvas.offsetHeight;

}

resizeCanvas();

window.addEventListener(
    "resize",
    resizeCanvas
);

function initVisualizer(){

    const audio =
    document.querySelector(
        "audio"
    );

    if(!audio){

        console.log(
            "No audio element found yet"
        );

        return;

    }

    if(audioContext){

        return;

    }

    audioContext =
    new AudioContext();

    analyser =
    audioContext.createAnalyser();

    analyser.fftSize = 256;

    const source =
    audioContext
    .createMediaElementSource(
        audio
    );

    source.connect(analyser);

    analyser.connect(
        audioContext.destination
    );

    const bufferLength =
    analyser.frequencyBinCount;

    dataArray =
    new Uint8Array(
        bufferLength
    );

    drawVisualizer();

}

function drawVisualizer(){

    animationId =
    requestAnimationFrame(
        drawVisualizer
    );

    analyser.getByteFrequencyData(
        dataArray
    );

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const barWidth =
    (
        canvas.width /
        dataArray.length
    ) * 2.5;

    let x = 0;

    for(
        let i = 0;
        i < dataArray.length;
        i++
    ){

        const barHeight =
        dataArray[i];

        const gradient =
        ctx.createLinearGradient(
            0,
            canvas.height -
            barHeight,
            0,
            canvas.height
        );

        gradient.addColorStop(
            0,
            "#ff3c3c"
        );

        gradient.addColorStop(
            1,
            "#200404"
        );

        ctx.fillStyle =
        gradient;

        ctx.fillRect(
            x,
            canvas.height -
            barHeight,
            barWidth,
            barHeight
        );

        x += barWidth + 2;

    }

}
