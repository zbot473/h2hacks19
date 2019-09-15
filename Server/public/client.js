var disp,
    req = new XMLHttpRequest(),
    cvs,
    grid

window.onload = function () {
    var e = document.querySelectorAll(".sidenav")
    var instances = M.Sidenav.init(e, {});
    init()

}

function get(){
    var options = {
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": null,
        "method": "GET",
        "mode": "cors"
    }
    fetch("/grid", options).then(function(e){
        e.json().then(function(e){
            grid = JSON.parse(e.data)
        })
    });
}

var context 
function init() {
    cvs = document.getElementById("moisture-canvas")
    cvs.addEventListener('mousedown', function (event) {
        if (event.region) {
            console.log(event.region)
        }
    });
    context = cvs.getContext("2d")
    var options = {
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": null,
        "method": "GET",
        "mode": "cors"
    }
    fetch("/grid", options).then(function(e){
        e.json().then(function(e){
            grid = JSON.parse(e.data)
            loop()

        })
    });
    setInterval(get,1000)

}


function loop() {
    context = cvs.getContext("2d")
    var dpr = window.devicePixelRatio || 1;

    var rect = cvs.getBoundingClientRect();

    cvs.width = 500;
    cvs.height = 500;
    for (let x = 0; x < cvs.width; x += cvs.width / 10) {
        for (let y = 0; y < cvs.height; y += cvs.height / 10) {
            
            context.fillStyle = `hsl(189,${100*(grid[2*x/100][2*y/100]/1024)}%,85%)`
            context.beginPath()
            context.rect(x + 2, y + 2, (cvs.width / 10) - 2, (cvs.width / 10) - 2)
            context.addHitRegion({
                id: `{x:${x/10}, y:${y/10}}`
            })
            context.fill()
            context.closePath()
        }
    }
    window.requestAnimationFrame(loop)
}
