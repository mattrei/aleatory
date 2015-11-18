//import THREE from 'three';
global.THREE = require('three')
import dat from 'dat-gui';
import Stats from 'stats-js';
import MathF from 'utils-perf'
import SimplexNoise from 'simplex-noise'
var Line = require('three-line-2d')(THREE)

const glslify = require('glslify')

const Simplex = new SimplexNoise()

const OrbitControls = require('three-orbit-controls')(THREE);

const Velocity = require('velocity-animate')
require('velocity-animate/velocity.ui')
const EffectComposer = require('three-effectcomposer')(THREE)

var WAGNER = require('@superguigui/wagner');
var BloomPass = require('@superguigui/wagner/src/passes/bloom/MultiPassBloomPass');

const FLY_CURVE = 20
const MAX_POINTS = 500
const TRIANGLE_GAP = 500
const NUM_TRIANGLES = 8

class Demo {
    constructor(args) {

        this.counter = 0
        this.gui = null
        this.introText = ''
        this.plane = null
        this.shakeX = 0
        this.shakeY = 0


        this.flyingSpeed = 0
        this.triangles = []
        this.flyingLines = []

        this.text = {
            intro: null,
            title: null
        }

        this.rotX = 0

        this.uniforms = {}
        this.speed = 1.0;
        this.height = 1.0;

        this.startStats();
        this.startGUI();

        this.multiPassBloomPass = null
        this.composer = null
        this.renderer = null;
        this.camera = null;
        this.scene = null;
        this.clock = new THREE.Clock();

        this.createTextDiv()
        this.createRender();
        this.createScene();
        this.createPp()
        this.createPost()
        this.addObjects();

        this.createTriangles()
        this.createFlyingLine()

        this.onResize();
        this.update();
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
        let geometry = new THREE.Geometry()
/*
        var geometry = new THREE.TubeGeometry(
    path,  //path
    20,    //segments
    2,     //radius
    8,     //radiusSegments
    false  //closed
);
*/
        let material = new THREE.LineBasicMaterial({
            color: 0xff0000,
            linewidth: 5
        });

        for (var i = 0; i < 3; i++) {
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

            if (t.position.z > this.camera.position.z) {
                t.position.z = (this.camera.position.z - TRIANGLE_GAP * NUM_TRIANGLES)
            }
        })

        this.camera.position.y = Math.sin(this.camera.position.z * 0.0025) * FLY_CURVE
        this.camera.position.x = Math.sin(this.camera.position.z * 0.0025) * FLY_CURVE


        this.plane.position.y = this.camera.position.y - 150


        //this.updatePositions()



        this.flyingLines.forEach((l, i) => {

            this.update_points(l, i)
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

    update_points(line, idx) {

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
        line.geometry.vertices = new_positions;
        line.geometry.verticesNeedUpdate = true;
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
        this.camera.position.set(0, 45, 240);

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
            fragmentShader: glslify(__dirname + '/glsl/Intro.frag'),
            vertexShader: glslify(__dirname + '/glsl/Intro.vert')
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
        this.gui.add(this, 'speed', 0.1, 10)
        this.gui.add(this, 'height', 1, 20)

        this.gui.add(this, 'introText')
        this.gui.add(this, 'updateIntroText')

        this.gui.add(this, 'rotX', -Math.PI * 2, Math.PI * 2)
        this.gui.add(this, 'flyingSpeed', 0, 20)
        this.gui.add(this, 'shakeX', -20, 20)
        this.gui.add(this, 'shakeY', -20, 20)
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

        this.camera.position.x *= Math.sin(this.counter * 0.25) * this.shakeX
        this.camera.position.y *= Math.sin(this.counter * 0.25) * this.shakeY

        this.plane.material.uniforms.time.value += this.clock.getDelta();
        this.plane.material.uniforms.speed.value = this.speed;
        this.plane.material.uniforms.height.value = this.height;

        this.triangles.forEach((t, i) => {
            t.material.uniforms.time.value = this.plane.material.uniforms.time.value
            t.material.uniforms.speed.value = this.plane.material.uniforms.speed.value
            t.material.uniforms.dist.value = 1 - (t.position.z / (this.camera.position.z - TRIANGLE_GAP * NUM_TRIANGLES))
        })

        this.fly()

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