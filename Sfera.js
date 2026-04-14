const c = document.getElementById("myCanvas");
const ctx = c.getContext("2d");

const center = {x: 300,y: 300};
const lato = 200;
const lati = 4;
const rotation = 32;
const raggio = lato / Math.SQRT2;

function creaVertices(n) {
    return Array.from({ length: n }, () => ({ x: 0, y: 0}));
}
const vertices = creaVertices(lati);

const rotationFix = rotation * 0.0174533;

for (let i = 0; i < lati; i++) {
    vertices[i].x = raggio * Math.cos((Math.PI / (lati / 2)) * (i + 1) + rotationFix) + center.x;
    vertices[i].y = raggio * Math.sin((Math.PI / (lati / 2)) * (i + 1) + rotationFix) + center.y;
}

console.log(vertices);

ctx.beginPath();
ctx.moveTo(vertices[0].x,vertices[0].y); //setup inizio della forma
vertices.forEach(point => {  ctx.lineTo(point.x, point.y);  }); // calcola linee
ctx.closePath(); // chiude forma
ctx.stroke(); // DISEGNA :D