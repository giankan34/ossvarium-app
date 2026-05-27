const canvas =
document.getElementById(
    "visualizer"
);

const ctx =
canvas.getContext("2d");

let audioContext;
let analyser;
let source;
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

function connectAudio(){

    const audio =
    document.querySelector("audio");

    if(!audio) return;

    if(audioContext) return;

    audioContext =
    new AudioContext();

    analyser =
    audioContext.createAnalyser();

    analyser.fftSize = 256;

    const bufferLength =
    analyser.frequencyBinCount;

    dataArray =
    new Uint8Array(
        bufferLength
    );

    source =
    audioContext.createMediaElementSource(
        audio
    );

    source.connect(analyser);

    analyser.connect(
        audioContext.destination
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
    ) * 2.2;

    let x = 0;

    for(
        let i = 0;
        i < dataArray.length;
        i++
    ){

        const barHeight =
        dataArray[i] * 0.9;

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
            "#ff4040"
        );

        gradient.addColorStop(
            1,
            "#2b0606"
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

        x +=
        barWidth + 2;

    }

}

window.addEventListener(
    "click",
    ()=>{

        connectAudio();

    },
    {
        once:true
    }
);
