var disp,
    req = new XMLHttpRequest()

req.onload = function(){
    disp = document.getElementById("disp")
    var json = JSON.parse(this.responseText)
    disp.style.backgroundColor = `hsl(189, 100%, ${json.moisture/1024}%`
}
//TODO: served to the actual URL
req.open("GET","http://mihirpi.local:8010/current")

setTimeout(()=>{req.send();},1000)