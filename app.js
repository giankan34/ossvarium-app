Pi.init({

    version:"2.0",

    sandbox:true,

    appId:"ossvarium-ed737fc4fd8ffa85"

});

const unlockedReleases =
JSON.parse(
    localStorage.getItem(
        "ossvarium_unlocks"
    )
) || [];

function isUnlocked(index){

    return unlockedReleases.includes(index);

}

function saveUnlock(index){

    if(
        !unlockedReleases.includes(index)
    ){

        unlockedReleases.push(index);

        localStorage.setItem(

            "ossvarium_unlocks",

            JSON.stringify(
                unlockedReleases
            )

        );

    }

}

function openUnlock(index){

    const box =
    document.getElementById(
        `unlock-${index}`
    );

    if(
        box.style.display === "block"
    ){

        box.style.display = "none";

    }else{

        box.style.display = "block";

    }

}

async function triggerPiPayment(index){

    const status =
    document.getElementById(
        `payment-${index}`
    );

    try{

        status.innerText =
        "AUTHENTICATING...";

        await Pi.authenticate(

            ['payments'],

            function(payment){

                console.log(payment);

            }

        );

        status.innerText =
        "OPENING PAYMENT...";

        await Pi.createPayment({

            amount:0.1,

            memo:"Unlock OSSVARIUM Release",

            metadata:{

                release:index

            }

        },{

            onReadyForServerApproval:
            async function(paymentId){

                status.innerText =
                "APPROVING...";

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
            async function(
                paymentId,
                txid
            ){

                status.innerText =
                "COMPLETING...";

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

                saveUnlock(index);

                location.reload();

            },

            onCancel:function(){

                status.innerText =
                "PAYMENT CANCELLED";

            },

            onError:function(error){

                console.error(error);

                status.innerText =
                "PAYMENT ERROR";

            }

        });

    }catch(error){

        console.error(error);

    }

}
