import Scene from '../Scene'
global.THREE = require('three')
const simplex = new(require('simplex-noise'))

const random = require('random-float')
const randomInt = require('random-int')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')


const FontUtils = require('../utils/FontUtils')
const GeometryUtils = require('../utils/GeometryUtils')

const ExplodeModifier = require('../modifiers/ExplodeModifier')

const glslify = require('glslify')
//https://avseoul.github.io/particleEqualizer/index.html

//https://docs.google.com/spreadsheets/d/1NAfjFonM-Tn7fziqiv33HlGt09wgLZDSCP-BQaux51w/edit#gid=1000652376

const NUM_RAND_FIRES = 100

const DISTANCE_EARTH = 1000

//https://github.com/luigimannoni/luigimannoni.github.io/blob/master/experiments/hexoplanet-webgl/javascripts/main.js

var Globe = function(opts) {

    var distance = DISTANCE_EARTH
    var dist = {
        earth: DISTANCE_EARTH
    }
    var padding = 40;


    function createBoxes() {

        //for (let i=-90; i < 90; i += MathF.random(3, 8)) {
        //  for (let j=-180; j < 180; j += 4) {


        for (let i = 0; i < 500; i++) {
            let lat = MathF.random(-90, 90),
                lng = MathF.random(-180, 180)



            let p = _getPosFromLatLng(lat, lng)
            addBox(p, MathF.random(1, 5), 0xff00f0)
        }
    }

    function visBoxes() {

        boxes.forEach((b, i) => {
            funkUp(b)
        })
    }

    function visText() {



        var str = vis.text
        const FONT_SIZE = 120,
            FONT_NAME = "px Arial"

        let ctx = canvas.getContext('2d');

        ctx.font = FONT_SIZE + FONT_NAME;
        var metrics = ctx.measureText(str);
        console.log(metrics)
        let width = canvas.width = Math.ceil(metrics.width) || 1,
            height = canvas.height = Math.ceil(1.1 * FONT_SIZE);
        ctx.fillStyle = '#fff';
        ctx.fillText(str, 0, FONT_SIZE);

        let vertices = []

        var index;
        var data = ctx.getImageData(0, 0, width, height).data;
        var count = 0;
        console.log(data.length)
        for (var i = 0, len = data.length; i < len; i += 4) {
            if (data[i] > 0) {
                // is white
                index = i / 4;
                let x = index % width,
                    y = index / width | 0;

                vertices.push(new THREE.Vector2(x, y))
                count++;
            }
        }

        console.log(vertices)

        vertices.forEach(v => {

            var axis = new THREE.Vector3(0, 0, 1);
            var angle = Math.PI / 2;
            var a = new THREE.Euler(0, 0, angle, 'XYZ');
            //pos.applyAxisAngle( axis, angle );
            //pos.translate()
            //v.applyEuler(a)

            let pos = _getPosFromLatLng(v.x * 3, v.y * 3)

            addBox(pos, MathF.random(1, 5), 0xff00f0)
        })

    }

    function funkUp(box) {
        var verts = box.geometry.vertices
        let p = box.position

        let height = simplex.noise4D(p.x, p.y, 0, shaderTime * vis.speed)
        let size = 300 * vis.amplitude * height
        let c = simplex.noise4D(p.x, p.y, 0, shaderTime * 0.1)

        box.material.color.setHSL(c, MathF.random(0.6, 0.9), height)

        box.scale.z = Math.max(size, 0.1); // avoid non-invertible matrix
        box.updateMatrix();
    }

    function removeBoxes() {

        let tween = Tween()

        boxes.forEach(b => {


            tween.chain(b.position, {
                x: MathF.random(b.position.x, 500),
                y: MathF.random(b.position.y, 500),
                z: MathF.random(b.position.z, 500),
                duration: MathF.random(4, 5)
            })

            //scene.remove(b)
        })

        let tween2 = Tween()

        boxes.forEach(b => {

            tween2.chain(b.position, {
                    x: this.camera.position.x,
                    y: this.camera.position.y,
                    z: this.camera.position.z + 500,
                    duration: MathF.random(2, 3)
                })
                //scene.remove(b)
        })

        tween.then(tween2)

        tween2.on('complete', () => {
            boxes.forEach(b => {

                scene.remove(b)
            })
        })

        tweenr.to(tween)


        boxes = []
    }


    function addBox(pos, size, color) {

        let geom = new THREE.CubeGeometry(4, 4, 1);
        geom.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -0.5));

        let mat = new THREE.MeshBasicMaterial({
            color: color
        })


        let box = new THREE.Mesh(geom, mat)


        box.position.copy(pos)
        box.lookAt(mesh.position);

        box.scale.z = Math.max(size, 0.1); // avoid non-invertible matrix
        box.updateMatrix();

        scene.add(box)
        boxes.push(box)
    }


    function showPakistan() {

        const LAT = 33.6,
            LNG = 73.1


        let pos = calculate2dPosition(LAT, LNG)
        let tween = Tween()
        console.log(pos)

        tween.chain(target, {
            x: pos.x,
            y: pos.y - 0.2,
            duration: 2
        })
        tween.chain(dist, {
            earth: 400,
            duration: 2
        })


        tweenr.to(tween)
        tween.on('update', () => {
            _moveEarth()
        })

        tween.on('complete', () => {
            camera.lookAt(new THREE.Vector3(pos.x, pos.y, 0))
        })


    }


    function showEarth() {

        let tween = tweenr.to(dist, {
            earth: DISTANCE_EARTH,
            duration: 2
        })

        tween.on('update', () => {
            _moveEarth()
        })

    }





    function createFire(lat, lng) {

        let p = _getPosFromLatLng(lat, lng)
        particleGroup.triggerPoolEmitter(1, p);
    }

    function _getPosFromLatLng(lat, lng) {

        let phi = (90 - lat) * Math.PI / 180,
            theta = (180 - lng) * Math.PI / 180;

        return new THREE.Vector3(
            200 * Math.sin(phi) * Math.cos(theta),
            200 * Math.cos(phi),
            200 * Math.sin(phi) * Math.sin(theta))
    }


};

import particles from './particles'
import drones from './drones'
import globe from './globe'

class Drones extends Scene {
    constructor(args) {
        //super(args, new THREE.Vector3(0, 0, DISTANCE_EARTH))
        super(args, new THREE.Vector3(0,0,1000))

        //this.background()
        //stars()
        //this.satellites()
        //this.globe()

        this.scene.add(drones(this, this.events))
        this.scene.add(globe(this, this.events))
        //particles(this)
    }

  satellites() {

    const VIS = 'satellites'
    const conf = {on: true}
    const group = new THREE.Group()
    group.visible = conf.on
    this.scene.add(group)

    const MAX_PARTICLES = 80000

    class Satellite extends THREE.Object3D {
      constructor(args) {
        super()

        this.group = args.group
        this.texture = args.texture
        this.pos = args.pos
        this.freqRange = args.freqRange

        this.nbParticles = 0;

        // Particle settings
        this.life = 2.0;
        this.size = 1.0;
        this.spawnRate = 400;
        this.horizontalSpeed = 0.8;
        this.verticalSpeed = 0.8;
        this.maxVelocityX = 0.3;
        this.maxVelocityY = 0.6;
        this.xRadius = 80;
        this.yRadius = 40;
        this.zRadius = 120;
        this.startTime = 0.0;
        this.velocity = new THREE.Vector3(0, 0, 0);

        this.particleSpriteTex = THREE.ImageUtils.loadTexture('/assets/Drones/satelliteparticle.png');

        this.geom = new THREE.BufferGeometry();
        this.mat = new THREE.ShaderMaterial({
          uniforms: {
            time: { type: 'f', value: 0.0 },
            tSprite: { type: 't', value: this.particleSprite },
          },
          vertexShader: glslify('./Satellite.vert'),
          fragmentShader: glslify('./Satellite.frag'),
          depthTest: false,
          transparent: true,
          blending: THREE.AdditiveBlending,
        });

        this.init();

        this.system = new THREE.Points(this.geom, this.mat)
        this.system.position.set(0, 0, 0)
        this.system.visible = true
        this.group.add(this.system)
      }

      freqRange() {
        return this.freqRange
      }

      init() {
        this.positions = new Float32Array(this.maxParticles * 3);
        this.velocities = new Float32Array(this.maxParticles * 3);
        this.startTimes = new Float32Array(this.maxParticles);
        this.lifes = new Float32Array(this.maxParticles);
        this.sizes = new Float32Array(this.maxParticles);

        this.geom.addAttribute('position', new THREE.BufferAttribute(this.positions, 3).setDynamic(true));
        this.geom.addAttribute('velocity', new THREE.BufferAttribute(this.velocities, 3).setDynamic(true));
        this.geom.addAttribute('startTime', new THREE.BufferAttribute(this.startTimes, 1).setDynamic(true));
        this.geom.addAttribute('size', new THREE.BufferAttribute(this.sizes, 1).setDynamic(true));
        this.geom.addAttribute('life', new THREE.BufferAttribute(this.lifes, 1).setDynamic(true));
      }

      spawnParticle() {
        let i = this.nbParticles;

        this.positions[i * 3 + 0] = this.pos.x + (Math.random() - 0.5) * 0.07;
        this.positions[i * 3 + 1] = this.pos.y + (Math.random() - 0.5) * 0.07;
        this.positions[i * 3 + 2] = this.pos.z + (Math.random() - 0.5) * 0.07;

        this.velocities[i * 3 + 0] = this.velocity.x + (Math.random() - 0.5) * 0.55;
        this.velocities[i * 3 + 1] = this.velocity.y + (Math.random() - 0.5) * 0.55;
        this.velocities[i * 3 + 2] = this.velocity.z + (Math.random() - 0.5) * 0.55;

        this.startTimes[i] = this.startTime;
        this.sizes[ i ] = this.size;
        this.lifes[ i ] = this.life;

        this.nbParticles++;

        if (this.nbParticles >= MAX_PARTICLES) {
          this.nbParticles = 0;
        }
      }

      update(time, freq) {

        if (!this.system.visible) { return; }

        const t = 0.1 * time;
        const s = 0.07 * freq;

        this.pos.x = Math.cos(t) * this.xRadius;
        this.pos.y = Math.sin(t * this.verticalSpeed) * (this.yRadius + s);
        this.pos.z = Math.sin(t) * this.zRadius;

        this.velocity.x = Math.sin((t + s) * this.maxVelocityX);
        this.velocity.y = Math.cos((t + s) * this.maxVelocityY);
        this.velocity.z = (Math.sin((t + s) * this.maxVelocityX) + Math.cos((t + s) * this.maxVelocityY));

        for (let x = 0; x < this.spawnRate * s; x++) {
          this.spawnParticle();
        }

        this.startTime = t;
        this.mat.uniforms.time.value = t;

        this.geom.attributes.position.needsUpdate = true;
        this.geom.attributes.velocity.needsUpdate = true;
        this.geom.attributes.startTime.needsUpdate = true;
        this.geom.attributes.size.needsUpdate = true;
        this.geom.attributes.life.needsUpdate = true;
      }
    }

    let sats = []

    this.loader.load('/assets/Drones/satelliteparticle.png', texture => {

      sats.push(new Satellite({texture: texture,
                                     group: group,
                                     pos: new THREE.Vector3(random(0,100),random(0,100),0),
                                     /*velocity: */
                                     freqRange: {min: 20, max: 40},
                                    }))

    })

    const doAdd = () => {
      const min = random (1, 3) * 1000,
            max = random (4, 9) * 1000
      sats.push(new Satellite({texture: texture,
                                     group: group,
                                     pos: new THREE.Vector3(random(0,100),random(0,100),0),
                                     freqRange: {min: min, max: max},
                                    }))
    }
    conf.doAdd = doAdd
    this.events.on(VIS + '::doAdd', _ => doAdd())

    this.events.on('tick', t => {



      sats.forEach(s => {
        const f = s.freqRange()

        const freq = super.getFreq(f.min, f.max)

        s.update(t.time )
      })
    })


    super.addVis(VIS, conf)
  }

    globe() {

        const VIS = 'globe'
        let conf = {
            on: false, rings: true, wobble: false
        }
        const group = new THREE.Group()
        group.visible = conf.on
        this.scene.add(group)

        let mesh = null,
            particleGroup = null


        const SIZE = 200
        this.loader.load('/assets/Drones/world.jpg', texture => {
            this.loader.load('./assets/Drones/smokeparticle.png', smoke => {

                let geometry = new THREE.SphereGeometry(SIZE, 40, 30)
                const explodeModifier = new THREE.ExplodeModifier()
                explodeModifier.modify(geometry)

                const material = new THREE.ShaderMaterial({

                    //uniforms: uniforms,
                    uniforms: {
                        texture: {
                            type: 't',
                            value: texture
                        },
                        glowIntensity: {
                            type: 'f',
                            value: 3
                        },
                        redIntensity: {
                            type: 'f',
                            value: 0
                        },
                        wobble: {
                            type: 'f',
                            value: 0
                        },
                        time: {
                            type: 'f',
                            value: 0
                        }
                    },
                    transparent: true,
                    fragmentShader: glslify(__dirname + '/Earth.frag'),
                    vertexShader: glslify(__dirname + '/Earth.vert')

                });
                material.side = THREE.DoubleSide;


                mesh = new THREE.Mesh(geometry, material)
                mesh.rotation.y = Math.PI;
                group.add(mesh)


                // add atmosphere
                let atmoMaterial = new THREE.ShaderMaterial({

                    uniforms: {
                        glowIntensity: {
                            type: 'f',
                            value: 1
                        },
                        redIntensity: {
                            type: 'f',
                            value: 0
                        }
                    },
                    fragmentShader: glslify(__dirname + '/Atmosphere.frag'),
                    vertexShader: glslify(__dirname + '/Atmosphere.vert'),
                    side: THREE.BackSide,
                    blending: THREE.AdditiveBlending,
                    transparent: true

                });

                const atmoMesh = new THREE.Mesh(geometry, atmoMaterial)
                atmoMesh.scale.set(1.1, 1.1, 1.1)
                group.add(atmoMesh)
                mesh.atmosphere = atmoMesh


                const createRing = (radius) => {

                    let color = new THREE.Color()
                    color.setHSL((180+Math.random()*40)/360, 1.0, 0.5)

                          let  segments = 64,
                            ringMaterial = new THREE.LineBasicMaterial( {
                              color: color.clone(),
                              linewidth: 4,
                              transparent: true,
                            } ),
                            /*ringMaterial = new THREE.RawShaderMaterial({
                                vertexShader: glslify('./Ring.vert'),
                                fragmentShader: glslify('./Ring.frag'),
                                blending: THREE.AdditiveBlending,
                                transparent: true,
                                depthTest: false
                            }),*/
                            ringGeometry = new THREE.Geometry()//new THREE.CircleGeometry( radius, segments );


                          let offset = random(0, 50)

                      for (let i=0; i<=Math.PI*2+0.1;i+=0.1) {
                        ringGeometry.vertices.push(
                          new THREE.Vector3(Math.cos(i)*(radius+offset), 0, Math.sin(i)*radius)
                        )
                      }

                        // Remove center vertex
                        //ringGeometry.vertices.shift();
                        let ringMesh = new THREE.Line(ringGeometry, ringMaterial)
                        ringMesh._radius = radius
                        ringMesh._offset = offset
                        ringMesh.position.set(0,0,0)
                        ringMesh.rotation.set(0,0,random(-Math.PI/8, Math.PI/8))
                        group.add(ringMesh)

                         let randTheta = random(-Math.PI/4, Math.PI/4),
                            finalRadius = Math.cos( randTheta ) * SIZE + 50

                          tweenr.to(ringMesh, {ease: 'expoOut', _radius: finalRadius, _offset: 0, duration: 2}).on('update', _ => {
                            ringMesh.geometry.vertices = []
                            for (let i=0; i<=Math.PI*2+0.1;i+=0.1) {

                                  ringMesh.geometry.vertices.push(
                                    new THREE.Vector3(Math.cos(i)*(ringMesh._radius+ringMesh._offset), 0, Math.sin(i)*ringMesh._radius)
                                  )
                                }

                            ringMesh.geometry.verticesNeedUpdate = true

                          })
                          tweenr.to(ringMesh.position, {x: 0, y: randTheta * SIZE, z: 0, duration: 2})
                          tweenr.to(ringMesh.rotation, {x: 0, y: 0, z: 0, duration: 2})
                          tweenr.to(ringMesh.material, {ease: 'expoIn', opacity: 0, duration: 5})
                            .on('update', _ => ringMesh.material.needsUpdate = true)
                            .on('complete', _ => group.remove(ringMesh))

                              this.events.on('tick', t => {
                                  const freq = super.getFreq(200, 400)
                                  let hsl = color.getHSL()
                                  hsl.l *= freq

                                  ringMaterial.color.setHSL(hsl.h, hsl.s, hsl.l)
                                  ringMaterial.needsUpdate = true
                              })

                        return ringMesh
                }

                let lastTime = 0
                this.events.on('tick', t => {

                    if (conf.rings) {

                      const freq = super.getFreq(0, 20)
                      //console.log(freq)

                      if (freq > 0.5) {
                        //
                        if (t.time - lastTime > random(0.5, 2)) {
                          let ring = createRing(SIZE*20)
                          lastTime = t.time
                        }
                      }
                    }

                  let wobble = 0,
                      glowing = 1.0

                  material.uniforms.redIntensity.value = 0
                  atmoMaterial.uniforms.redIntensity.value = 0
                  if (conf.wobble) {
                    wobble = 0.5
                    glowing = 1.0
                    material.uniforms.redIntensity.value = Math.sin(t.time)
                    atmoMaterial.uniforms.redIntensity.value = Math.sin(t.time)
                  }

                    material.uniforms.wobble.value = wobble
                    material.uniforms.glowIntensity.value = glowing

                    material.uniforms.time.value = t.time


                    atmoMaterial.uniforms.glowIntensity.value = glowing


                })

                this.events.on(VIS + '::visOn', (_) => {

                    group.visible = true
                    mesh.scale.set(0, 0, 0)
                    mesh.atmosphere.scale.set(0, 0, 0)
                    tweenr.to(mesh.scale, {
                        x: 1,
                        y: 1,
                        z: 1,
                        duration: 2
                    })
                    tweenr.to(mesh.atmosphere.scale, {
                        x: 1.1,
                        y: 1.1,
                        z: 1.1,
                        duration: 2
                    })

                })
                this.events.on(VIS + '::visOff', (_) => group.visible = false)
            })
        })


        const doExplode = () => {
            const geometry = mesh.geometry


            for (var i = 0; i < (geometry.vertices.length); i++) {

                var pos = new THREE.Vector3();
                var v = geometry.vertices[i]


                pos.x += v.x * random(0, 50)
                pos.y += v.y * random(0, 50)
                pos.z += v.z * random(0, 50)


                tweenr.to(geometry.vertices[i], {
                        x: pos.x,
                        y: pos.y,
                        z: pos.z,
                        duration: 5
                    })
                    .on('update', _ => geometry.verticesNeedUpdate = true)
                    .on('complete', _ => group.visible = false)


            }
        }


        this.events.on(VIS + '::doExplode', (p) => {
            doExplode()
        })
        conf.doExplode = doExplode

        // camera's position
        const cameraRotation = {
            x: 0,
            y: 0
        };
        const cameraTarget = {
            x: 0,
            y: 0
        };

        const ALTITUDE = 1000

        const posOnSphere = (obj, coords) => {
            var x = coords.x;
            var y = coords.y;
            var altitude = coords.altitude;

            obj.position.set(
                altitude * Math.sin(x) * Math.cos(y),
                altitude * Math.sin(y),
                altitude * Math.cos(x) * Math.cos(y)
            );
        }


        const moveEarth = () => {
            cameraRotation.x += (cameraTarget.x - cameraRotation.x) * 0.1;
            cameraRotation.y += (cameraTarget.y - cameraRotation.y) * 0.1;

            // determine camera position
            posOnSphere(this.camera, {
                x: cameraRotation.x,
                y: cameraRotation.y,
                altitude: ALTITUDE
            })
            this.camera.lookAt(mesh.position)
        }


        const latLngOnSphere = (lat, lng) => {
            const phi = (90 + lng) * Math.PI / 180,
                theta = (180 - lat) * Math.PI / 180

            return {
                x: phi - Math.PI,
                y: Math.PI - theta
            }
        }

        const doLatLng = (lat = 32, lng = 69) => {

            let p = latLngOnSphere(lat, lng)

            tweenr.to(cameraTarget, {
                x: p.x,
                y: p.y,
                duration: 0.5
            }).on('update', _ => moveEarth())
        }
        this.events.on(VIS + '::doLatLng', (p) => doLatLng(37 /*p.lat*/ , 58 /*p.lng*/ ))
        conf.doLatLng = doLatLng


        const doRnd = () => {

            let moveX = random(-Math.PI * 2, Math.PI * 2),
                moveY = random(-Math.PI, Math.PI)

            moveX *= Math.random() * 0.8;
            moveY *= Math.random() * 0.8;

            tweenr.to(cameraTarget, {
                    x: moveX,
                    y: moveY,
                    duration: 0.5
                })
                .on('update', _ => moveEarth())

        }
        this.events.on(VIS + '::doRnd', (p) => doRnd())
        conf.doRnd = doRnd

        const doRndFire = () => {

            let lat = random(-90, 90),
                lng = random(-180, 180)

            let p = _getPosFromLatLng(lat, lng)

            particleGroup.triggerPoolEmitter(1, p);

        }
        this.events.on(VIS + '::doRndFire', (p) => doRndFire())
        conf.doRndFire = doRndFire




        super.addVis(VIS, conf)

    }


    tick(time, delta) {

    }

    stars() {
        const VIS = 'stars'
        const conf = {
            on: false,
            speed: 1
        }
        const group = new THREE.Group()

        let geometry = new THREE.Geometry();
        let material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            opacity: 1,
            linewidth: Math.random() * 4
        });

        let r = 450

        let vertex1 = new THREE.Vector3();
        vertex1.x = Math.random() * 2 - 1;
        vertex1.y = Math.random() * 2 - 1;
        vertex1.z = Math.random() * 2 - 1;
        vertex1.normalize();
        vertex1.multiplyScalar(r);

        let vertex2 = vertex1.clone();
        vertex2.multiplyScalar(Math.random() * 0.09 + 1);

        geometry.vertices.push(vertex1);
        geometry.vertices.push(vertex2);

        let star = this.makeStar(geometry)
        star.visible = false
        this.scene.add(star)


        let s = Math.random() * 10
        let line = new THREE.LineSegments(geometry, material);
        line.scale.x = line.scale.y = line.scale.z = s;
        line.originalScale = s
        line.speed = Math.random()
        line.rotation.y = Math.random() * Math.PI;
        line.updateMatrix();
        line.position.z = Math.random() * -5000

        super.addVis(VIS, conf)
    }

    background() {
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
            '/assets/Drones/galaxy_starfield.png', (texture) => {
                const geometry = new THREE.SphereGeometry(7000, 60, 40),
                    material = new THREE.ShaderMaterial({
                        uniforms: {
                            texture: {
                                type: 't',
                                value: texture
                            }
                        },
                        vertexShader: skyVertex,
                        fragmentShader: skyFragment
                    });

                let skyBox = new THREE.Mesh(geometry, material);
                skyBox.scale.set(-1, 1, 1);
                skyBox.rotation.order = 'XZY';
                skyBox.renderOrder = 1000.0;
                skyBox.rotation.y = Math.PI * -0.5
                this.scene.add(skyBox)
            })

    }

}

export default Drones
