//import THREE from 'three';
global.THREE = require('three')
import dat from 'dat-gui';
import Stats from 'stats-js';
import MathF from 'utils-perf'
import SimplexNoise from 'simplex-noise'
import TWEEN from 'tween.js'
var Line = require('three-line-2d')(THREE)

var tweenr = require('tweenr')()
var Tween = require('tween-chain')

const glslify = require('glslify')
const createAnalyser = require('web-audio-analyser')
const AudioContext = window.AudioContext || window.webkitAudioContext

const Simplex = new SimplexNoise()

const OrbitControls = require('three-orbit-controls')(THREE);

const Velocity = require('velocity-animate')
require('velocity-animate/velocity.ui')
const EffectComposer = require('three-effectcomposer')(THREE)

var WAGNER = require('@superguigui/wagner');
var BloomPass = require('@superguigui/wagner/src/passes/bloom/MultiPassBloomPass');

const PARTICLES_AMOUNT = 300000

const FLY_CURVE = 20
const MAX_POINTS = 500
const TRIANGLE_GAP = 500
const NUM_TRIANGLES = 8
const CAMERA_Z_START = 250
class Demo {
    constructor(args) {

        this.shaderTime = 0

        this.canvas = null
        this.ctx = null

        this.textMesh = null;

        this.counter = 0
        this.gui = null
        this.introText = ''
        this.plane = null
        this.shakeX = 0
        this.shakeY = 0

        this.analyser = null
        //this.createAudio()


        this.flyingSpeed = 0
        this.triangles = []
        this.flyingLines = []

        this.text = {
            intro: null,
            title: null
        }

        this.rotX = 0

        this.uniforms = {}
        this.speed = 0;
        this.height = 1.0;

        this.startStats();
        

        this.multiPassBloomPass = null
        this.composer = null
        this.renderer = null;
        this.camera = null;
        this.scene = null;
        this.clock = new THREE.Clock();

        
        //this.createTextDiv()
        this.createRender();
        this.createScene();
        this.createPp()
        this.createPost()
        this.addObjects();

        this.createText()

        this.createTriangles()
        this.createFlyingLine()

        this.startGUI();
        this.onResize();
        this.update();
    }

    createText() {

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        let geometry = new THREE.BufferGeometry();
        geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(PARTICLES_AMOUNT * 3), 3 ));
        geometry.addAttribute( 'extras', new THREE.BufferAttribute( new Float32Array(PARTICLES_AMOUNT * 2), 2 ) );

        let material = new THREE.ShaderMaterial( {

            uniforms: {
                uTime: { type: 'f', value: 0 },
                uAnimation: { type: 'f', value: 0 },
                uOffset: { type: 'v2', value: new THREE.Vector2() }
            },
            //attributes: geometry.attributes,
            vertexShader: glslify(__dirname + '/glsl/Intro_Text.vert'),
            fragmentShader: glslify(__dirname + '/glsl/Intro_Text.frag'),
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: true,
            depthTest: false
        } );

        this.textMesh = new THREE.Points( geometry, material );
        this.scene.add( this.textMesh );


    }

    updateText () {
        var str = this.introText
        const FONT_SIZE = 120,
            FONT_NAME = "px Arial"

        let ctx = this.canvas.getContext('2d');

        ctx.font = FONT_SIZE + FONT_NAME;
        var metrics = ctx.measureText(str);
        let width = this.canvas.width = Math.ceil(metrics.width) || 1,
            height = this.canvas.height = Math.ceil(1.1 * FONT_SIZE);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(str, 0, 1.1* FONT_SIZE * 0.9);

        let geometry = this.textMesh.geometry

        let vertices = geometry.attributes.position.array,
            extras = geometry.attributes.extras.array;

        var index;
        var data = this.ctx.getImageData(0, 0, width, height).data;
        var count = 0;
        for(var i = 0, len = data.length; i < len; i+=4) {
            if(data[i + 3] > 0) {
                index = i / 4;
                vertices[count * 3] = index % width;
                vertices[count * 3 + 1] = index / width | 0;
                extras[count * 2] = data[i + 3] / 255;
                extras[count * 2 + 1] = Math.random();
                count++;
            }
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.extras.needsUpdate = true;
        //geometry.drawcalls = /*geometry.offsets =*/ [{start: 0, count: count, index: 0}];
    }

    createAudio() {
        let audio = new Audio("//127.0.0.1:8000/sonicpi")
        audio.crossOrigin = 'Anonymous'
        audio.play()
        audio.volume = 1
        this.analyser = createAnalyser(audio, {stereo: false})
    }

    createPost() {

    }

    createTextDiv() {
        let div = document.createElement('div')
        div.id = "textIntro"
        div.style.cssText = `
      font-family:Helvetica,Arial,sans-serif;font-size:40px;font-weight:normal;line-height:15px;color:white;
      `
        div.style.position = "absolute"
        div.style.width = "100%"
        div.style['text-align'] = "center"
        div.style.top = "50%"
        document.body.appendChild(div)

        this.text.intro = div

        div = document.createElement('div')
        div.id = "textTitle"
        div.style.cssText = `
      font-family:Helvetica,Arial,sans-serif;font-size:60px;font-weight:bold;line-height:15px;color:white;
      `
        div.style.position = "absolute"
        div.style.width = "100%"
        div.style['text-align'] = "center"
        div.style.top = "30%"
        document.body.appendChild(div)

        div.innerHTML = "aleatory"

        this.text.title = div
    }

    updateIntroText() {
        Velocity.animate(this.text.intro, "fadeOut", this.transition / 4)
            .then((e) => {
                this.text.intro.innerHTML = this.introText
                Velocity(this.text.intro, "fadeIn", this.transition)
            })
    }

    startStats() {
        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        document.body.appendChild(this.stats.domElement);
    }

    createRender() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            clearColor: 0,
            clearAlpha: 1
        });
        document.body.appendChild(this.renderer.domElement)
    }

    createTriangles() {


        let geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-1, 0, 0));
        geometry.vertices.push(new THREE.Vector3(0, 1, 0));
        geometry.vertices.push(new THREE.Vector3(1, 0, 0));
        geometry.vertices.push(new THREE.Vector3(-1, 0, 0));




        for (let i = 0; i < NUM_TRIANGLES; i++) {

            let material = new THREE.ShaderMaterial({
                uniforms: {
                    time: {
                        type: "f",
                        value: 0.1
                    },
                    speed: {
                        type: "f",
                        value: this.speed
                    },
                    dist: {
                        type: "f",
                        value: 1.0
                    }
                },
                transparent: true,
                fragmentShader: glslify(__dirname + '/glsl/Intro_Triangle.frag'),
                vertexShader: glslify(__dirname + '/glsl/Intro_Triangle.vert')
            });


            let line = new THREE.Line(geometry, material);
            this.scene.add(line)

            line.position.z = -i * TRIANGLE_GAP
            line.position.y = Math.sin(line.position.z * 0.0025) * FLY_CURVE
            line.position.x = Math.cos(line.position.z * 0.0025) * FLY_CURVE

            line.scale.x = line.scale.y = 40
            line.updateMatrix()

            this.triangles.push(line)
        }
    }

    createFlyingLine() {

        for (var i = 0; i < 3; i++) {

            let material = new THREE.ShaderMaterial({
                uniforms: {
                        time: {
                            type: "f",
                            value: 0.1
                        },
                        speed: {
                            type: "f",
                            value: this.speed
                        }
                },
                transparent: true,
                fragmentShader: glslify(__dirname + '/glsl/Intro_Line.frag'),
                vertexShader: glslify(__dirname + '/glsl/Intro_Line.vert')

            })

            let line = new THREE.Line(new THREE.Geometry(), material);
            this.scene.add(line)
            this.flyingLines.push(line)
        }
    }

    fly() {
        this.camera.position.z -= this.flyingSpeed
        this.plane.position.z -= this.flyingSpeed

        this.triangles.forEach(t => {
            //t.position.z += this.flyingSpeed * 10

            if (t.position.z > this.camera.position.z + CAMERA_Z_START) {
                t.position.z = (this.camera.position.z - TRIANGLE_GAP * NUM_TRIANGLES)
            }
        })

        this.camera.position.y = Math.sin(this.camera.position.z * 0.0025) * FLY_CURVE
        this.camera.position.x = Math.sin(this.camera.position.z * 0.0025) * FLY_CURVE


        this.plane.position.y = this.camera.position.y - 150


        //this.updatePositions()



        this.flyingLines.forEach((l, i) => {

            this.update_points(l.geometry, i)
            l.position.z -= this.flyingSpeed
            //this.flyingLine.position.y = this.camera.position.y
            l.position.x = this.camera.position.x - Math.sin(i) * 50
            //this.camera.position.y = Math.sin(i * 0.25) * 40
        })
        this.flyingLines[0].position.x = this.camera.position.x - 40
        this.flyingLines[1].position.y = this.camera.position.y + 40
        this.flyingLines[1].position.x = this.camera.position.x
        this.flyingLines[2].position.x = this.camera.position.x + 40

        let time = this.counter / 1000
        let x = this.flyingLines[0].position.x,
            y = this.flyingLines[0].position.y

        //this.flyingLines[0].position.x += 10 * Simplex.noise3D(x , y, time)
    }

    update_points(geometry, idx) {

        let time = this.counter / 10000

        let obj_resolution = 50
        let new_positions = [];
        for (var i = 0; i <= obj_resolution; i++) {

            var z = i * 5
            var y = Math.sin((this.camera.position.z + i * 5) * 0.0025) * FLY_CURVE;
            var x = Math.sin((this.camera.position.z + i * 5) * 0.0025) * FLY_CURVE;

            /*
      if (i % 5 == 0) {
        x += 10 * Simplex.noise2D(x * idx, y * idx, time)
        y += 10 * Simplex.noise2D(x * idx, y * idx, time)
       // z +=  20 *  Simplex.noise2D(x * idx, y * idx, time)
      }
      */
            new_positions.push(new THREE.Vector3(x, y, z));
        }
        geometry.vertices = new_positions;
        geometry.verticesNeedUpdate = true;
    }


    // update positions
    updatePositions() {

        var positions = this.flyingLine.geometry.attributes.position.array;

        let x = 0,
            y = 0,
            z = 0,
            index = 0

        for (var i = 0, l = MAX_POINTS; i < l; i++) {

            positions[index++] = x;
            positions[index++] = y;
            positions[index++] = z;

            x += (Math.random() - 0.5) * 30;
            y += (Math.random() - 0.5) * 30;
            z += (Math.random() - 0.5) * 30;

        }

    }

    createScene() {
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 4000);
        this.camera.position.set(0, 45, CAMERA_Z_START);

        this.scene = new THREE.Scene();
    }

    createPp() {
      this.renderer.autoClearColor = true;
        this.composer = new WAGNER.Composer(this.renderer, {
            useRGBA: false
        });
        this.composer.setSize(window.innerWidth, window.innerHeight);

        this.bloomPass = new BloomPass({
            blurAmount: 2,
            applyZoomBlur: true
        });
    }

    addObjects() {
        var gridHelper = new THREE.GridHelper(100, 10);
        //this.scene.add( gridHelper );


        var planeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                resolution: {
                    type: "v2",
                    value: new THREE.Vector2(window.innerWidth, window.innerHeight)
                },
                time: {
                    type: "f",
                    value: 0.1
                },
                speed: {
                    type: "f",
                    value: this.speed
                },
                height: {
                    type: "f",
                    value: this.height
                },
                noise_elevation: {
                    type: "f",
                    value: 1.0
                },
            },
            transparent: true,
            fragmentShader: glslify(__dirname + '/glsl/Intro_Terrain.frag'),
            vertexShader: glslify(__dirname + '/glsl/Intro_Terrain.vert')
            //wireframe: true
        });

        var geometry = new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight, 10, 10);

        this.plane = new THREE.Mesh(geometry, planeMaterial);

        this.plane.rotation.set(-Math.PI * 0.5, 0, 0)
        this.plane.position.y = -window.innerHeight * 0.15
        this.scene.add(this.plane);

    }

    startGUI() {
        this.gui = new dat.GUI()
        this.gui.add(this, 'speed', 0, 1)
        this.gui.add(this, 'height', 1, 20)

        this.gui.add(this, 'introText').onChange(this.updateText.bind(this));
        this.gui.add(this.textMesh.material.uniforms.uAnimation, 'value', 0, 1).name('animation').listen()
        this.gui.add(this, 'updateText')

        this.gui.add(this, 'updateIntroText')

        this.gui.add(this, 'rotX', -Math.PI * 2, Math.PI * 2)
        this.gui.add(this, 'flyingSpeed', 0, 20)
        this.gui.add(this, 'shakeX', -20, 20)
        this.gui.add(this, 'shakeY', -20, 20)

        this.gui.add(this, 'leave')
    }

    leave() {

        let tchain = Tween()
        

        this.triangles.forEach(t => {


            tchain.chain(

            t.position, {
              x: MathF.random(-50, 50),
              y: MathF.random(-50, 50),
              z: MathF.random(CAMERA_Z_START + 10 , CAMERA_Z_START + 100),
              duration: 2
            }
            )
            tchain.chain(
            t.rotation, {
              x: MathF.random(-Math.PI * 2, Math.PI * 2),
              y: MathF.random(-Math.PI, Math.PI),
              z: MathF.random(-Math.PI, Math.PI),
              duration: 2
            }
            )
        })

        let lchain = Tween()
        this.flyingLines.forEach(f => {
            lchain.chain(
            f.position, {
              x: MathF.random(-200, 200),
              y: MathF.random(-200, 200),
              z: MathF.random(CAMERA_Z_START + 10 , CAMERA_Z_START + 100),
              duration: 4
            }
            )
        })
        lchain.then(this.plane.position, {
              z: MathF.random(200, 500),
              duration: 2
            })

        tchain.then(lchain)

        tweenr.to(tchain)
    }

    renderPass() {
        
        this.composer.reset();
        this.composer.render(this.scene, this.camera);
        this.composer.pass(this.bloomPass);
        othis.composer.toScreen();
    }

    update() {
        this.stats.begin();

        // Iterate over all controllers
        for (var i in this.gui.__controllers) {
            this.gui.__controllers[i].updateDisplay();
        }

        this.counter++
        this.shaderTime += 0.1

        
        //this.textMesh.position.z -= 300

        this.textMesh.material.uniforms.uTime.value += 0.003;
        this.textMesh.material.uniforms.uOffset.value.set(-window.innerWidth / 2, -window.innerHeight / 2);

        this.camera.position.x *= Math.sin(this.counter * 0.25) * this.shakeX
        this.camera.position.y *= Math.sin(this.counter * 0.25) * this.shakeY

        let fixedScale = 2 * Math.tan(this.camera.fov / 360 * Math.PI) / window.innerHeight;

        this.textMesh.position.copy(this.camera.position);
        this.textMesh.rotation.copy(this.camera.rotation);
        this.textMesh.position.z -= 780
        this.textMesh.position.x += window.innerWidth / 2
        this.textMesh.position.y -= window.innerHeight / 4

        this.plane.material.uniforms.time.value += this.shaderTime * 0.001
        this.plane.material.uniforms.speed.value = this.speed;
        this.plane.material.uniforms.height.value = this.height;

        this.triangles.forEach((t, i) => {
            t.material.uniforms.time.value = this.plane.material.uniforms.time.value
            t.material.uniforms.speed.value = this.plane.material.uniforms.speed.value
            t.material.uniforms.dist.value = 1 - (t.position.z / (this.camera.position.z - TRIANGLE_GAP * NUM_TRIANGLES))
        })

        this.flyingLines.forEach((t, i) => {
            t.material.uniforms.time.value += (this.shaderTime + i * 5) * 0.001
            t.material.uniforms.speed.value = this.plane.material.uniforms.speed.value
        })

        this.fly()

//        console.log(this.analyser.frequencies())

        //this.renderPass()
        this.renderer.render(this.scene, this.camera);

        this.stats.end()
        requestAnimationFrame(this.update.bind(this));
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    onVariable(name, val) {
        this[name] = val;
    }
    onFunc(name) {
        let f = this[name]
        f = f.bind(this)
        f()
    }
}

export
default Demo;