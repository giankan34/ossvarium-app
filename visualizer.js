const canvas =
document.getElementById(
    "visualizer"
);

const ctx =
canvas.getContext("2d");

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

let bars = [];

for(let i = 0; i < 48; i++){

    bars.push({

        height:
        Math.random() * 80

    });

}

function animate(){

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const barWidth =
    canvas.width / bars.length;

    bars.forEach((bar,index)=>{

        bar.height +=
        (Math.random() - 0.5) * 20;

        if(bar.height < 10){

            bar.height = 10;

        }

        if(bar.height > canvas.height){

            bar.height =
            canvas.height;

        }

        const gradient =
        ctx.createLinearGradient(
            0,
            canvas.height -
            bar.height,
            0,
            canvas.height
        );

        gradient.addColorStop(
            0,
            "#ff4b4b"
        );

        gradient.addColorStop(
            1,
            "#220404"
        );

        ctx.fillStyle =
        gradient;

        ctx.fillRect(

            index * barWidth,

            canvas.height -
            bar.height,

            barWidth - 3,

            bar.height

        );

    });

    requestAnimationFrame(
        animate
    );

}

animate();
