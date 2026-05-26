const canvas =
document.getElementById("visualizer");
const ctx =
canvas.getContext("2d");

let animationId = null;

let visualizerEnabled = true;

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

function randomBar(min,max){

    return Math.random() *
    (max - min) + min;

}

function drawVisualizer(){

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const bars = 48;

    const barWidth =
    canvas.width / bars;

    for(let i=0;i<bars;i++){

        const height =
        randomBar(
            10,
            canvas.height
        );

        const x =
        i * barWidth;

        const y =
        canvas.height - height;

        const gradient =
        ctx.createLinearGradient(
            0,
            y,
            0,
            canvas.height
        );

        gradient.addColorStop(
            0,
            "#ff4040"
        );

        gradient.addColorStop(
            1,
            "#3a0909"
        );

        ctx.fillStyle =
        gradient;

        ctx.fillRect(
            x,
            y,
            barWidth - 3,
            height
        );

    }

    animationId =
    requestAnimationFrame(
        drawVisualizer
    );

}

function toggleVisualizer(){

    visualizerEnabled =
    !visualizerEnabled;

    if(visualizerEnabled){

        drawVisualizer();

        document.getElementById(
            "screenText"
        ).innerText =
        "VISUALIZER ACTIVE";

    }else{

        cancelAnimationFrame(
            animationId
        );

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        document.getElementById(
            "screenText"
        ).innerText =
        "VISUALIZER DISABLED";

    }

}

drawVisualizer();
