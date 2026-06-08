import { initBuffers } from "./init-buffer.js";
import { drawScene } from "./draw-scene.js";

let Rotation = 45 * 0.01745329; // in radiant, first factor is degrees
let deltaTime = 0;
let HasToAutoRotate = true;
let AutoRotationSpeed = 0.0001;
let subdivisions = 16; 

inizialize()
//==============================================================================================================
function inizialize(){
    // var sliderX = document.getElementById("sliderX");
    // var sliderY = document.getElementById("sliderY");
    // var sliderZ = document.getElementById("sliderZ");
    const canvas = document.getElementById("myCanvas");
    const gl = canvas.getContext("webgl");

    // Set clear color to black, fully opaque
 
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Vertex shader program
    const vsSource = `
        attribute vec4 aVertexPosition;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        }
    `;
    //  Fragment shader
    const fsSource = ` void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); } `;

    // Initialize a shader program; this is where all the lighting for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    
    // Collect all the info needed to use the shader program. Look up which attribute our shader program is using for aVertexPosition and look up uniform locations.
    const programInfo = {
        program: shaderProgram,
        attribLocations: {   vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),   },
        uniformLocations: {   projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),  modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),  },
    };

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(gl, subdivisions);


    let then = 0;
    // Draw the scene repeatedly
    function render(now) {
        now *= AutoRotationSpeed // rotation speed
        deltaTime = now - then;
        then = now;

        drawScene(gl, programInfo, buffers, Rotation);
        Rotation += deltaTime;

        if (HasToAutoRotate){ requestAnimationFrame(render); }
    }
    requestAnimationFrame(render);
}
//==============================================================================================================
// Initialize a shader program, so WebGL knows how to draw our data
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {   alert(   `Unable to initialize the shader program: ${gl.getProgramInfoLog(   shaderProgram,   )}`,   );   return null;   }

  return shaderProgram;
}

// creates a shader of the given type, uploads the source and compiles it.
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {   alert(   `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,   );   gl.deleteShader(shader);   return null;   }

  return shader;
}
//==============================================================================================================