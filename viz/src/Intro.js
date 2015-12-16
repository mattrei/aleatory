//import THREE from 'three';
global.THREE = require('three')
import dat from 'dat-gui';
import Stats from 'stats-js';
import MathF from 'utils-perf'
const simplex = new (require('simplex-noise'))
import TWEEN from 'tween.js'
var Line = require('three-line-2d')(THREE)
import randf from 'random-float'

const tweenr = require('tweenr')()
var Tween = require('tween-chain')

const glslify = require('glslify')
const createAnalyser = require('web-audio-analyser')
const AudioContext = window.AudioContext || window.webkitAudioContext
const smoothstep = require('smoothstep')
const lerp = require('lerp')

require('./modifiers/ExplodeModifier')
require('./modifiers/TessellateModifier')

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
const NUM_RIBBONS = 15
const RIBBON_LENGTH = 25
const RIBBON_GAP = 50
const RIBBON_START = NUM_RIBBONS * RIBBON_GAP * -1
const STREET_LENGTH = (RIBBON_LENGTH + RIBBON_GAP) * NUM_RIBBONS
const STREET_WIDTH = 50
const PLANE_SIZE = {X: 1000, Z: STREET_LENGTH}


const NUM_TRIANGLES = 8
const CAMERA_Z_START = 250


class Demo {
    constructor(args) {

        this.shaderTime = 0

        this.canvas = null
        this.ctx = null

        this.textMesh = null;

        this.gui = null
        this.introText = ''
        this.floor = {
          height: 0,
          plane: null,
          particles: null
        }

        this.street = {
            speed: 0.5,
            middle: [], left: null, right: null,
            lights: {back: [], front: []},
            buildings: []
          }


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

        this.loader = new THREE.TextureLoader()

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

        this.createBackground()
        this.createStreet()
        this.createBuildings()
        this.createCarLights()
        this.createParticles()
        //this.createTriangles()
        this.createFlyingLine()

        this.startGUI();
        this.onResize();
        this.update();
    }

    createBackground() {

      const skyVertex = `
      varying vec2 vUV;

      void main() {
        vUV = uv;
        vec4 pos = vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * pos;
      }
      `

      const skyFragment = `
      uniform sampler2D texture;
      varying vec2 vUV;

      void main() {
        vec4 sample = texture2D(texture, vUV);
        gl_FragColor = vec4(sample.xyz, sample.w);
      }
      `

      this.loader.load(
		      '/assets/Intro/eso_dark.jpg', (texture) => {
            var geometry = new THREE.SphereGeometry(3000, 60, 40);
            var material = new THREE.ShaderMaterial( {
              uniforms:       {
                texture: { type: 't', value: texture }
              },
              vertexShader:   skyVertex,
              fragmentShader: skyFragment
            });

            let skyBox = new THREE.Mesh(geometry, material);
            skyBox.scale.set(-1, 1, 1);
            skyBox.rotation.order = 'XZY';
            skyBox.renderOrder = 1000.0;
            skyBox.rotation.y = Math.PI*-0.5
            this.scene.add(skyBox);
          })


    }

    createBuildings() {


        for( var i = 0; i < NUM_RIBBONS * 6; i ++ ){

            var geometry = new THREE.CubeGeometry( 1, 1, 1 );
            geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0.5, 0 ) );
            var material = new THREE.MeshNormalMaterial({wireframe: false})
            var buildingMesh = new THREE.Mesh( geometry, material );


              // put a random position
              let coin = MathF.coin() ? -1 : 1
              buildingMesh.position.x   = MathF.random(70 * coin, 130 * coin)
              buildingMesh.position.z   = -1 * MathF.random(0, STREET_LENGTH)
              //buildingMesh.position.z   = 200

              // put a random rotation
              buildingMesh.rotation.y   = Math.random()*Math.PI*2;
              // put a random scale
              buildingMesh.scale.x  = Math.random() * Math.random() * Math.random() * Math.random() * 60 + 10;
              buildingMesh.scale.y  = (Math.random() * Math.random() * Math.random() * buildingMesh.scale.x) * 10 + 20;
              buildingMesh.scale.z  = buildingMesh.scale.x

            this.scene.add(buildingMesh)
            buildingMesh.visible = false

            let cube = new THREE.EdgesHelper( buildingMesh );
            this.scene.add( cube );

            this.street.buildings.push(buildingMesh)

        }
    }

    createParticles() {

      const NUM = 500

      let geometry = new THREE.Geometry();

      for (let i = 0; i < NUM; i ++ ) {

					var vertex = new THREE.Vector3();

          vertex.x = randf(0, PLANE_SIZE.X) - PLANE_SIZE.X*0.5
          vertex.z = randf(0, -PLANE_SIZE.Z)

          vertex._height = randf(1, 5)
          vertex._speed = randf(1, 10)

					geometry.vertices.push( vertex );
			}



      this.loader.load(
          '/assets/Intro/particle.png', (sprite) => {


					let material = new THREE.PointsMaterial( {
            size: 40,
            map: sprite,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent : true
          } );


          let particles = new THREE.Points( geometry, material );
          this.scene.add(particles)
          console.log(particles)
          this.floor.particles = particles
        })

    }

    animateFloor() {

      if (this.floor.particles) {

        let geo = this.floor.particles.geometry

          for (let i = 0; i < geo.vertices.length; i ++ ) {

            let v = geo.vertices[i]

            v.y = Math.abs( Math.sin((i + this.shaderTime * 0.4 * this.street.speed)) * 40 * v._height )
            v.z += this.street.speed * v._speed
            if (v.z > 0) {
              v.z = -STREET_LENGTH
              v._speed = randf(1, 10)
              v._height = randf(1, 5)
            }

          }
          geo.verticesNeedUpdate = true

    }

        this.floor.plane.material.uniforms.time.value += this.shaderTime * 0.001
        this.floor.plane.material.uniforms.speed.value = this.street.speed;
        this.floor.plane.material.uniforms.height.value = this.floor.height;
    }

    createCarLights() {

      this.loader.load(
		      '/assets/Intro/cloud.png', (texture) => {

            let matFront = new THREE.SpriteMaterial({
                  map: texture,
                  color: 0xded95f
                }),
                matBack = new THREE.SpriteMaterial({
                      map: texture,
                      color: 0xff0000
                    })



              function add(mat, dict, scene) {
                for (var i = 0; i < 5; i++) {
                  let pair = []

                  for (let j = 0; j < 2; j++) {

                          let sprite = new THREE.Sprite(mat)
                          sprite.scale.set(90, 40, 1.0);
                          //sprite.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.75);
                          //sprite.position.setLength(200 * Math.random());
                          sprite.material.blending = THREE.AdditiveBlending;
                          sprite.rotation.x = Math.PI * Math.random()

                          sprite.position.set(j*10, 0, 0)

                          scene.add(sprite)
                          pair.push(sprite)

                  }
                  let z = -1 * randf(50, STREET_LENGTH)
                  pair[0].position.z = pair[1].position.z = z

                  dict.push(pair);

                }
              }

              add(matBack, this.street.lights.back, this.scene)
              add(matFront, this.street.lights.front, this.scene)
          })

    }

    createStreet() {

        let geom = new THREE.PlaneBufferGeometry(3, (RIBBON_LENGTH + RIBBON_GAP) * NUM_RIBBONS, 2, 2)
        let mat = new THREE.LineBasicMaterial( {color: 0xffffff, linewidth: 3} )
        let mesh = new THREE.Mesh(geom, mat)
        mesh.rotation.x = Math.PI * 0.5

        let left = new THREE.Line(new THREE.Geometry(), mat);
        this.scene.add(left)
        this.street.left = left

        let right = new THREE.Line(new THREE.Geometry(), mat);
        this.scene.add(right)
        this.street.right = right


        for (let i=1; i < NUM_RIBBONS+1; i++) {
            let geom = new THREE.PlaneGeometry(5, RIBBON_LENGTH, 2, 2)
            let mat = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} )

            let mesh = new THREE.Mesh(geom, mat)
            mesh.rotation.x = Math.PI * 0.5

            mesh.position.z = (RIBBON_GAP + RIBBON_LENGTH) * i * -1

            this.scene.add(mesh)
            this.street.middle.push(mesh)
        }

        this.scene.add(new THREE.AmbientLight(0xffffff))
    }

    animateLights() {

      let zoffset = randf(60, 100)

      this.street.lights.front.forEach((l, i) => {

        let back = this.street.lights.back[i]

        l.forEach((s,j) => {

          let pos = s.position

          let z = pos.z + this.street.speed * 8
          let r = Math.sin((this.shaderTime + z * 0.2) * 0.02)
          let x = r * 15 + (j*15) - STREET_WIDTH / 2,
            y = r * 8


          if (z > 0) {
              z = STREET_LENGTH * -1
              z -= zoffset
          }
          s.position.set(x,y,z)
        })
      })

      this.street.lights.back.forEach((l, i) => {

        l.forEach((s,j) => {

          let pos = s.position

          let z = pos.z - this.street.speed * 8
          let r = Math.sin((this.shaderTime + z * 0.2) * 0.02)
          let x = r * 15 + (j*15) + STREET_WIDTH / 2,
            y = r * 8


          if (z < -STREET_LENGTH) {
              z = 0
              z += zoffset
          }
          s.position.set(x,y,z)
        })
      })
    }

    animateStreet() {

        let pos_left = [],
            pos_right = []

        this.street.middle.forEach((m, i) => {

            m.position.z += this.street.speed * 8
            let r = Math.sin((this.shaderTime + m.position.z * 0.2) * 0.02)
            m.position.x = r * 15
            m.position.y = r * 8
            m.rotation.z = r * 0.05


            if (m.position.z > 0) {//this.camera.position.z) {
                m.position.z = (NUM_RIBBONS * (RIBBON_GAP + RIBBON_LENGTH) * -1)
            }
            pos_left.push(new THREE.Vector3((r*15) - STREET_WIDTH, r*8, m.position.z))
            pos_right.push(new THREE.Vector3((r*15) + STREET_WIDTH, r*8, m.position.z))
        })

        pos_left.sort((a,b) => {
            return a.z - b.z
        })
        pos_right.sort((a,b) => {
            return a.z - b.z
        })

        let g = this.street.left.geometry
        g.vertices = pos_left
        g.verticesNeedUpdate = true

        g = this.street.right.geometry
        g.vertices = pos_right
        g.verticesNeedUpdate = true

        this.street.buildings.forEach((b, i) => {

            let r = Math.sin((this.shaderTime + b.position.z * 0.2) * 0.02)

            b.position.x = (r * 15) + b._xoffset
            b.position.y = r * 8 + b._yoffset

            b.position.z += this.street.speed * 8

            let delta = Math.abs(100 * simplex.noise2D(i, this.shaderTime * 0.09 * this.street.speed))
            b.scale.y = Math.max(30, delta)
            b.translateY( delta / 4 );

            if (b.position.z > 0) {
                b.position.z = STREET_LENGTH * -1
                let coin = MathF.coin() ? -1 : 1
                b._xoffset = MathF.random(70 * coin, 130 * coin)

                b._yoffset = 30 * Math.sin((70 - Math.abs(b._xoffset)) * 1/(130 - 70))
            }
        })

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
        geometry.addGroup(0, count, 0)
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
        this.floor.plane.position.z -= this.flyingSpeed

        this.triangles.forEach(t => {
            //t.position.z += this.flyingSpeed * 10

            if (t.position.z > this.camera.position.z + CAMERA_Z_START) {
                t.position.z = (this.camera.position.z - TRIANGLE_GAP * NUM_TRIANGLES)
            }
        })

        this.camera.position.y = Math.sin(this.camera.position.z * 0.0025) * FLY_CURVE
        this.camera.position.x = Math.sin(this.camera.position.z * 0.0025) * FLY_CURVE


        this.floor.plane.position.y = this.camera.position.y - 150


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

    createScene() {
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 4000);
        this.camera.position.set(0, 45, CAMERA_Z_START);


        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.maxDistance = 300000;
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

        var geometry = new THREE.PlaneGeometry(PLANE_SIZE.X, PLANE_SIZE.Z, 20, 20);
        this.floor.plane = new THREE.Mesh(geometry, planeMaterial);

        this.floor.plane.rotation.set(-Math.PI * 0.5, 0, 0)
        this.floor.plane.position.y = 0//-window.innerHeight * 0.15
        this.scene.add(this.floor.plane);

    }

    startGUI() {
        this.gui = new dat.GUI()
        this.gui.add(this.street, 'speed', 0, 1)
        this.gui.add(this.floor, 'height', 0, 1)

        this.gui.add(this, 'introText').onChange(this.updateText.bind(this));
        this.gui.add(this.textMesh.material.uniforms.uAnimation, 'value', 0, 1).name('animation').listen()
        this.gui.add(this, 'updateText')

        this.gui.add(this, 'updateIntroText')

        this.gui.add(this, 'rotX', -Math.PI * 2, Math.PI * 2)
//        this.gui.add(this, 'flyingSpeed', 0, 20)

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
        lchain.then(this.floor.plane.position, {
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
        this.composer.toScreen();
    }

    update() {
        this.stats.begin();

        // Iterate over all controllers
        for (var i in this.gui.__controllers) {
            this.gui.__controllers[i].updateDisplay();
        }

        this.shaderTime += 0.1

        this.animateStreet()
        this.animateLights()
        this.animateFloor()


        //this.textMesh.position.z -= 300

        this.textMesh.material.uniforms.uTime.value += 0.003;
        this.textMesh.material.uniforms.uOffset.value.set(-window.innerWidth / 2, -window.innerHeight / 2);


        let fixedScale = 2 * Math.tan(this.camera.fov / 360 * Math.PI) / window.innerHeight;

        this.textMesh.position.copy(this.camera.position);
        this.textMesh.rotation.copy(this.camera.rotation);
        this.textMesh.position.z -= 780
        this.textMesh.position.x += window.innerWidth / 2
        this.textMesh.position.y -= window.innerHeight / 4


/*
        this.triangles.forEach((t, i) => {
            t.material.uniforms.time.value = this.floor.plane.material.uniforms.time.value
            t.material.uniforms.speed.value = this.floor.plane.material.uniforms.speed.value
            t.material.uniforms.dist.value = 1 - (t.position.z / (this.camera.position.z - TRIANGLE_GAP * NUM_TRIANGLES))
        })

        this.flyingLines.forEach((t, i) => {
            t.material.uniforms.time.value += (this.shaderTime + i * 5) * 0.001
            t.material.uniforms.speed.value = this.floor.plane.material.uniforms.speed.value
        })
        */

        //this.fly()

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
