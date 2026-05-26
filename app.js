Pi.init({

    version:"2.0",

    sandbox:true,

    appId:"ossvarium-ed737fc4fd8ffa85"

});

function openUnlock(index){

    const box =
    document.getElementById(
        `unlock-${index}`
    );

    if(box.style.display === "block"){

        box.style.display = "none";

    }else{

        box.style.display = "block";

    }

}

async function triggerPiPayment(index){

    try{

        const status =
        document.getElementById(
            `payment-${index}`
        );

        status.innerText =
        "AUTHENTICATING...";

        const scopes = ['payments'];

        await Pi.authenticate(

            scopes,

            function(payment){

                console.log(
                    "Incomplete payment:",
                    payment
                );

            }

        );

        status.innerText =
        "OPENING PAYMENT...";

        await Pi.createPayment({

            amount:0.1,

            memo:"Unlock OSSVARIUM Release",

            metadata:{

                release:index,

                platform:"OSSVARIUM"

            }

        },{

            onReadyForServerApproval:
            async function(paymentId){

                status.innerText =
                "APPROVING PAYMENT...";

                await fetch(
                    '/api/approve-payment',
                    {

                        method:'POST',

                        headers:{
                            'Content-Type':
                            'application/json'
                        },

                        body:JSON.stringify({
                            paymentId
                        })

                    }
                );

            },

            onReadyForServerCompletion:
            async function(paymentId,txid){

                status.innerText =
                "COMPLETING PAYMENT...";

                await fetch(
                    '/api/complete-payment',
                    {

                        method:'POST',

                        headers:{
                            'Content-Type':
                            'application/json'
                        },

                        body:JSON.stringify({
                            paymentId,
                            txid
                        })

                    }
                );

                localStorage.setItem(
                    `ossvarium_release_${index}`,
                    "true"
                );

                const player =
                document.getElementById(
                    `player-${index}`
                );

                player.style.display =
                "block";

                const badge =
                document.getElementById(
                    `badge-${index}`
                );

                badge.innerText =
                "UNLOCKED";

                badge.className =
                "badge badge-unlocked";

                const unlockBox =
                document.getElementById(
                    `unlock-${index}`
                );

                unlockBox.style.display =
                "none";

                status.innerText =
                "UNLOCK SUCCESS";

            },

            onCancel:function(paymentId){

                status.innerText =
                "PAYMENT CANCELLED";

            },

            onError:function(error,paymentId){

                console.error(error);

                status.innerText =
                "PAYMENT ERROR";

            }

        });

    }catch(error){

        console.error(error);

    }

}
