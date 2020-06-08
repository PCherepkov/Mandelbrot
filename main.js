'use strict';

const vxShaderStr = `#version 300 es
in vec3 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void)
{
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}
`;

const fsShaderStr =
`#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uDelta;
uniform float uZoom;
uniform float uReAdd;
uniform float uImAdd;

out vec4 oColor;

vec2 Sqr(vec2 z)
{
  float nx = z.x * z.x - z.y * z.y;
  float ny = 2.0 * z.x * z.y;
  return vec2(nx, ny);
}

float Mandl(vec2 z0)
{
  float c = 0.0;
  vec2 z = z0;

  while (c < 255.0 && z.x * z.x + z.y * z.y <= 4.0)
  {
    z = Sqr(z);
    z = vec2(z.x + uReAdd, z.y + uImAdd);
    c++;
  }
  return c / 255.0;
}

void main(void)
{
  vec2 Z;
  float color;

  float x = (gl_FragCoord.x - uDelta.x) / 208.0 / (1.0 + uZoom / 10.0) - 2.0;
  float y = (gl_FragCoord.y + uDelta.y) / 208.0 / (1.0 + uZoom / 10.0) - 2.0;
 
  Z = vec2(x, y);
  color = Mandl(Z);
  oColor = vec4(color, color, 0, 1);
}`;

class Vec2 {
  constructor (x, y) {
    this.x = x;
    this.y = y;
  }
}

var gl;
function initGL (canvas) {
  try {
    gl = canvas.getContext('webgl2');
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {
  }
  if (!gl) {
    alert('Could not initialize WebGL');
  }
}

function getShader (gl, type, str) {
  var shader;
  shader = gl.createShader(type);

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

var shaderProgram;

function initShaders () {
  var fragmentShader = getShader(gl, gl.FRAGMENT_SHADER, fsShaderStr);
  var vertexShader = getShader(gl, gl.VERTEX_SHADER, vxShaderStr);

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Could not initialize shaders');
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix');
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
  shaderProgram.uTime = gl.getUniformLocation(shaderProgram, 'uTime');
  shaderProgram.uDelta = gl.getUniformLocation(shaderProgram, 'uDelta');
  shaderProgram.uZoom = gl.getUniformLocation(shaderProgram, 'uZoom');
  shaderProgram.uReAdd = gl.getUniformLocation(shaderProgram, 'uReAdd');
  shaderProgram.uImAdd = gl.getUniformLocation(shaderProgram, 'uImAdd');
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var timeMs = Date.now();
var startTime = Date.now();

var delta = new Vec2(0.0, 0.0);
var oldDelta = new Vec2(0.0, 0.0);
var oldMousePos = new Vec2(0, 0);
var newMousePos = new Vec2(0, 0);
var flag = false;
var zoom = 0;
var rAdd = 0.34;
var iAdd = -0.07;

function setUniforms () {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gl.uniform1f(shaderProgram.uTime, timeMs);

  if (flag) {
    delta = new Vec2(delta.x + newMousePos.x - oldMousePos.x, delta.y + newMousePos.y - oldMousePos.y);
  }
  let data = [delta.x, delta.y];
  gl.uniform2fv(shaderProgram.uDelta, data);
  gl.uniform1f(shaderProgram.uZoom, zoom);
  gl.uniform1f(shaderProgram.uReAdd, rAdd);
  gl.uniform1f(shaderProgram.uImAdd, iAdd);
}

var squareVertexPositionBuffer;

function initBuffers () {
  squareVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  var vertices = [
    1.0, 1.0, 0.0,
    -1.0, 1.0, 0.0,
    1.0, -1.0, 0.0,
    -1.0, -1.0, 0.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  squareVertexPositionBuffer.itemSize = 3;
  squareVertexPositionBuffer.numItems = 4;
}

function drawScene () {
  timeMs = (Date.now() - startTime) / 1000;
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

  mat4.identity(mvMatrix);

  mat4.translate(mvMatrix, [0.0, 0.0, -0.1]);

  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

function tick () {
  window.requestAnimationFrame(tick);
  drawScene();
}

function mouseDown (e) {
  flag = true;
}

function mouseMove (e) {
  oldMousePos = new Vec2(newMousePos.x, newMousePos.y);
  newMousePos = new Vec2(e.x, e.y);
}

function mouseUp (e) {
  flag = false;
}

function mouseWheel (e) {
  zoom -= e.deltaY / 100;
  console.log(zoom / 10.0 + 1.0);
}

var FizzyText = function() {
  this.rPartAdd = 0.34;
  this.iPartAdd = -0.07;
};

function webGLStart () {
  let canvas = document.getElementById('webglCanvas');
  initGL(canvas);
  initShaders();
  initBuffers();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  canvas.addEventListener('mousedown', mouseDown);
  canvas.addEventListener('mouseup', mouseUp);
  canvas.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('mousewheel', mouseWheel);

  let text = new FizzyText();
  let gui = new dat.GUI();
  var rAddControl = gui.add(text, 'rPartAdd', -1, 1);
  var iAddControl = gui.add(text, 'iPartAdd', -1, 1);

  rAddControl.onChange(function (val) {
    rAdd = val;
  });

  iAddControl.onChange(function (val) {
    iAdd = val;
  });

  tick();
}
