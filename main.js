'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iVertexBufferNormalisation = gl.createBuffer();
    this.count = 0;
    this.CountNormalisation = 0;

    this.BufferData = function (vertices, normals) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.count = vertices.length / 3;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBufferNormalisation);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);
        this.CountNormalisation = normals.length / 3;
    }
    this.Draw = function() {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBufferNormalisation);
        gl.vertexAttribPointer(shProgram.iAttribNormalVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormalVertex);
   
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribNormalVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iLightDir = -1;
    this.iModelMatrixNormal = -1;   

    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() { 
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    let projection = m4.orthographic(-2, 2, -2, 2, 8, 12);
    
    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    let translateToPointZero = m4.translation(0,0,-10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView );
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0 );
        
    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1 );

    let inversion = m4.inverse(modelViewProjection)
    let model_transposed = m4.transpose(inversion)
    

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection );
    gl.uniformMatrix4fv(shProgram.iModelMatrixNormal, false, model_transposed);
    gl.uniform3fv(shProgram.iLightDir, [-0.5+1*Math.cos(Date.now() * 0.005), 0, 0])
    surface.Draw();
    
}

function getDerivative1(a, ω1, u1, v, delta) {
    let [x, y, z]  = creating(a, ω1, u1 + delta, v);
    let x0 = x / deg2rad(delta);
    let y0 = y / deg2rad(delta);
    let z0 = z / deg2rad(delta);
    return [x0,y0,z0];
}

function getDerivative2(a, ω1, u1, v, delta) {
    let [x, y, z] = creating(a, ω1, u1, v + delta);
    let x0 = x / deg2rad(delta);
    let y0 = y / deg2rad(delta);
    let z0 = z / deg2rad(delta);
    return [x0,y0,z0];
}

function CreateSurfaceData() {
    //Побудова власне фігури
    let a = 2;
    let p = 1;

    let normalsList =[];
    let vertexList = [];

    let numSteps = 20; // Кількість кроків

    // Значення параметра u
    const uMin = -Math.PI;
    const uMax = Math.PI;
    // Значення параметра v
    const vMin = -2;
    const vMax = 0;
    let delta = 0.0001;

    for (let i = 0; i < numSteps; i++) {
        const u1 = uMin + (uMax - uMin) * (i / numSteps);
        const u2 = uMin + (uMax - uMin) * ((i + 1) / numSteps);

        for (let j = 0; j < numSteps; j++) {
            const v1 = vMin + (vMax - vMin) * (j / numSteps);
            const v2 = vMin + (vMax - vMin) * ((j + 1) / numSteps);

            const ω1 = p * u1;
            let [x1, y1, z1] = creating(a, ω1, u1, v1);
            let derivative1 = getDerivative1(a, ω1, u1, v1, delta);
            let derivative2 = getDerivative2(a, ω1, u1, v1, delta);
            let normal1 = m4.cross(derivative1,derivative2);

            const ω2 = p * u2;
            let [x2, y2, z2] = creating(a, ω2, u2, v1);
            derivative1 = getDerivative1(a, ω2, u2, v1, delta);
            derivative2 = getDerivative2(a, ω2, u2, v1, delta);
            let normal2 = m4.cross(derivative1,derivative2);

            const ω3 = p * u1;
            let [x3, y3, z3] = creating(a, ω3, u1, v2);
            derivative1 = getDerivative1(a, ω3, u1, v2, delta);
            derivative2 = getDerivative2(a, ω3, u1, v2, delta);
            let normal3 = m4.cross(derivative1,derivative2);

            const ω4 = p * u2;
            let [x4, y4, z4] = creating(a, ω4, u2, v2);
            derivative1 = getDerivative1(a, ω4, u2, v2, delta);
            derivative2 = getDerivative2(a, ω4, u2, v2, delta);
            let normal4 = m4.cross(derivative1,derivative2);

            vertexList.push(x1, y1, z1, x2, y2, z2, x3, y3, z3, x3, y3, z3, x2, y2, z2, x4, y4, z4);
            normalsList.push(normal1[0],normal1[1],normal1[2], normal2[0],normal2[1],normal2[2],normal3[0],
                normal3[1],normal3[2],normal3[0],normal3[1],normal3[2], normal2[0],normal2[1],normal2[2], normal4[0],normal4[1],normal4[2]);
        }
    }
    return [vertexList, normalsList];
}

function creating(a, ω1, u1, v1){
    const x1 = (a + v1) * Math.cos(ω1) * Math.cos(u1);
    const y1 = (a + v1) * Math.cos(ω1) * Math.sin(u1);
    const z1 = (a + v1) * Math.sin(ω1);
    return [x1, y1, z1]
}

function animating() {
    window.requestAnimationFrame(animating)
    draw()
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex              = gl.getAttribLocation(prog, "vertex");

    shProgram.iAttribNormalVertex = gl.getAttribLocation(prog, "vertexNormal");


    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    
    shProgram.iModelMatrixNormal = gl.getUniformLocation(prog, "ModelNormalMatrix");

    shProgram.iLightDir = gl.getUniformLocation(prog, "lightDirection");

    surface = new Model('Surface');
    let surfaceData = CreateSurfaceData();
    surface.BufferData(surfaceData[0], surfaceData[1]);

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vShader);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
     }
    let fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
       throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    animating();
}