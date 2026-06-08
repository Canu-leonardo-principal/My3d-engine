import { initBuffers } from "./init-buffer.js";
import { drawScene } from "./draw-scene.js";

const sliderX = document.getElementById("sliderX");
const sliderY = document.getElementById("sliderY");
const sliderZ = document.getElementById("sliderZ");
const sliderZoom = document.getElementById("sliderZoom");


inizialize()
//==============================================================================================================
function inizialize(){
  // --- inizialize variables --------------------------------------------------------------------------------------
  let Rotation = 0 * 0.01745329; // in radiant, first factor is degrees
  let deltaTime = 0;
  let HasToAutoRotate = false;
  let AutoRotationSpeed = 0.001;
  let subdivisions = 64;  // qualità della sfera

  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let rotationY = 0;
  let rotationX = 0;
  let rotationZ = 0;
  let zoom = -3.0; // stesso valore z del translate iniziale
  let lastPinchDistance = null;
 // --- inizialize program ------------------------------------------------------------------------------------------
  const canvas = document.getElementById("myCanvas");
  const gl = canvas.getContext("webgl");
  // loading world texture
  // ! the path is from the index
  const Texture = loadTexture(gl, "./Tools/Textures/Mappamondo.png");
  // --- Inizialize Sliders -----------------------------------------------------------------------------------------
  sliderX.oninput = function(){  rotationX = this.value;  }
  sliderY.oninput = function(){  rotationY = this.value;  }
  sliderZ.oninput = function(){  rotationZ = this.value;  }
  sliderZoom.oninput = function(){  zoom = 0 - this.value;}; // limit min/max  }
  // --- Mouse rotation ---------------------------------------------------------------------------------------------
  canvas.addEventListener("mousedown", (e) => {   
    isDragging = true;
    console.log(rotationX, rotationY, rotationZ, zoom)
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }); // check if mouse is dragging

  canvas.addEventListener("mousemove", (e) => { // change rotation
      if (!isDragging) return;
      rotationY += (e.clientX - lastMouseX) * 0.005; // mouse sensivity
      rotationX += (e.clientY - lastMouseY) * 0.005; // mouse sensivity
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
  });

  canvas.addEventListener("mouseup",   () => { isDragging = false; }); // check if mouse is still dragging
  canvas.addEventListener("mouseleave",() => { isDragging = false; }); // check if mouse is still dragging
  
  canvas.addEventListener("wheel", (e) => {
      zoom += e.deltaY * -0.01;
      zoom = Math.max(-20.0, Math.min(-2.0, zoom)); // limit min/max
      e.preventDefault();
  }, { passive: false });

  // --- Touch rotation ---------------------------------------------------------------------------------------------
  canvas.addEventListener("touchstart", (e) => { // check if finger is touching
      isDragging = true;
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
  });
  canvas.addEventListener("touchmove", (e) => {// change rotation
      if (!isDragging) return;

      if (e.touches.length === 2){ // check if is doing a pinch
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (lastPinchDistance !== null) {
            const delta = lastPinchDistance - distance;
            zoom += delta * -0.01;
            zoom = Math.max(-20.0, Math.min(-2.0, zoom));
        }
        lastPinchDistance = distance;
        e.preventDefault();

      }
      rotationY += (e.touches[0].clientX - lastMouseX) * 0.005; // finger sensivity
      rotationX += (e.touches[0].clientY - lastMouseY) * 0.005; // finger sensivity
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
      e.preventDefault();
  }, { passive: false });
  canvas.addEventListener("touchend", () => { isDragging = false; });// check if finger is still touching

// --- Vertex Shader program ---------------------------------------------------------------------------------------------    
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    varying highp vec3 vNormal;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
      vNormal = aVertexNormal;

      // Apply lighting effect

      highp vec3 ambientLight = vec3(0.20, 0.42, 0.60);
      highp vec3 directionalLightColor = vec3(1.0, 1.0, 0.50);
      highp vec3 directionalVector = normalize(vec3(0.50, 1.0, 1.0));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

  // --- Fragment Shader program ---------------------------------------------------------------------------------------------    
  const fsSource = `
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    varying highp vec3 vNormal;

    uniform sampler2D uTexture;

    void main(void) {
      highp vec4 finalColor = texture2D(uTexture, vTextureCoord);
      gl_FragColor = vec4(finalColor.rgb * vLighting, finalColor.a);
    }
  `;

  // --- Establishing Shaders --------------------------------------------------------------------------------------------- 
  // Initialize a shader program; this is where all the lighting for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    
  // Collect all the info needed to use the shader program. Look up which attribute our shader program is using for aVertexPosition and look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
      textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix"),
      uTexture:  gl.getUniformLocation(shaderProgram, "uTexture"),
    },
  };

    // Where we call the routine that builds all the objects.--------------------------------------------------------------- 
    const buffers = initBuffers(gl, subdivisions);

    // Draw the scene repeatedly (necessary for wiating the texture to load and for update rotation)
    function render(now) {
      drawScene(gl, programInfo, buffers, rotationX, rotationY, rotationZ, zoom, Texture);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

}
//==============================================================================================================
// Initialize the shader program, so WebGL knows how to draw our data
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
function loadTexture(gl, url) {
   const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
  };
  image.src = url;
  return texture;
}