const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
var sliderX = document.getElementById("sliderX");
var sliderY = document.getElementById("sliderY");
var sliderZ = document.getElementById("sliderZ");

const center = {x: 300,y: 300};
const lati = 8; //mi serve un cubo
const rotation = 0;

var dimension = canvas.height/100 * 75; 
var raggio = dimension / 2;
var h = 0.5;
var distance = {x: canvas.height/2, y: canvas.height/2, z: canvas.height/2};
var subdivision = 2;
//=====================================================================================
const vertices = [
    {x: -h, y:  h, z: h},
    {x: -h, y: -h, z: h},
    {x:  h, y: -h, z: h},
    {x:  h, y:  h, z: h},
    {x: -h, y: -h, z: -h},
    {x: -h, y:  h, z: -h},
    {x:  h, y: -h, z: -h},
    {x:  h, y:  h, z: -h},
];
const SpherePoints = [];
const spigoli = [
  [0,1],[1,2],[2,3],[3,0], // front
  [4,5],[5,7],[7,6],[6,4], // back
  [0,5],[1,4],[2,6],[3,7]  // connections
];
const SphereSpigoli = [];
//=====================================================================================
function scala(m, x){
    m.forEach(point => {
        point.x = point.x * x;
        point.y = point.y * x;
        point.z = point.z * x;
    });
    return m;
}
function move(m, x, y, z){
    m.forEach(point => {
        point.x = point.x + x;
        point.y = point.y + y;
        point.z = point.z + z;
    });
    return m;
}
//=====================================================================================
function rotateX(m, x){
    var phi = x * 0.01745329;
    m.forEach(point => {
        const y = point.y;
        const z = point.z;

        point.y = (Math.cos(phi) * y) + (-Math.sin(phi) *z );
        point.z = (Math.sin(phi) * y) + (Math.cos(phi) * z );
    }); 
}
function rotateY(m, y){
    var phi = y * 0.01745329;
    m.forEach(point => {
        const x = point.x;
        const z = point.z;
        point.x = (Math.cos(phi) * x) + (Math.sin(phi) * z );
        point.z = (-Math.sin(phi) *x) + (Math.cos(phi) *z );
    }); 
}
function rotateZ(m, z){
    var phi = z * 0.01745329;
    m.forEach(point => {
        const x = point.x;
        const y = point.y;
        point.x = (Math.cos(phi) * x) + (-Math.sin(phi) * y);
        point.y = (Math.sin(phi) * x) + (Math.cos(phi) * y);
    }); 
}
//=====================================================================================
disegna(0, 0, 0);
//=====================================================================================
function disegna(x, y, z){
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    var mesh = vertices.map(v => ({...v}));
    rotateY(mesh, y);
    rotateX(mesh, x);
    rotateZ(mesh, z);  
    
    scaled = scala(mesh, dimension);

    SpherePoints.length = 0;
    SphereSpigoli.length = 0;
    rounded = CreaSfera(scaled);
    move(rounded, 300, 300, 300);

    ctx.moveTo(SpherePoints[0].x, SpherePoints[0].y); //setup inizio della forma
    SphereSpigoli.forEach(([a,b]) => {
        ctx.moveTo(SpherePoints[a].x, SpherePoints[a].y);
        ctx.lineTo(SpherePoints[b].x, SpherePoints[b].y);
    });
    ctx.closePath(); // chiude forma
    ctx.stroke(); // DISEGNA :D
}
//=====================================================================================
sliderX.addEventListener("input", (e) =>{
    disegna(e.target.value, sliderY.value, sliderZ.value);
})
sliderY.addEventListener("input", (e) =>{
    disegna(sliderX.value, e.target.value, sliderZ.value);
})
sliderZ.addEventListener("input", (e) =>{
    disegna(sliderX.value, sliderY.value, e.target.value);
})
//=====================================================================================
//CREO SFERAAA
function PuntoMediano(a, b, t){
    return {
        x: (a.x + (b.x - a.x) *t),
        y: (a.y + (b.y - a.y) *t),
        z: (a.z + (b.z - a.z) *t),
    };
}
function NormalizzaASfera(punto, raggio, centro){
        const distanza = Math.sqrt(punto.x*punto.x + punto.y*punto.y + punto.z*punto.z); //Calcolo la distanza del punto dal centro
    return {
        x: ((punto.x / distanza) * raggio + distance.x), 
        y: ((punto.y / distanza) * raggio + distance.y),
        z: ((punto.z / distanza) * raggio + distance.z)
    }
}

function CreaSfera (mesh){
    const centro = {
        x: mesh.reduce((s, v) => s + v.x, 0) / mesh.length, //scorre tutte le x di mesh partendo da 0
        y: mesh.reduce((s, v) => s + v.y, 0) / mesh.length,
        z: mesh.reduce((s, v) => s + v.z, 0) / mesh.length
    };

    for (const [a, b] of spigoli){
        const primo = mesh[a];
        const secondo = mesh[b];
        var IndiceIniziale = SpherePoints.length;
        
        for (let i = 0; i <= subdivision; i++){
            const t = i / subdivision //da 0 ad 1
            const newpoint = PuntoMediano(primo, secondo, t);
            const newpoint_position = NormalizzaASfera (newpoint, raggio, centro);
            SpherePoints.push(newpoint_position);
        }

        for (let i = 0; i<subdivision; i++){
            const p1 = IndiceIniziale + i;
            const p2 = IndiceIniziale + i + 1;

            SphereSpigoli.push([p1, p2]);
        }
        IndiceIniziale += subdivision + 1;
    }
    return mesh;
}