import Scene from './Scene'
global.THREE = require('three')
import TWEEN from 'tween.js'
import SPE from './ShaderParticleEngine/SPE'
const simplex = new (require('simplex-noise'))

const random = require('random-float')
const randomInt = require('random-int')

var tweenr = require('tweenr')()
var Tween = require('tween-chain')


const FontUtils = require('./utils/FontUtils')
const GeometryUtils = require('./utils/GeometryUtils')

const ExplodeModifier = require('./modifiers/ExplodeModifier')(THREE)

const glslify = require('glslify')

//https://docs.google.com/spreadsheets/d/1NAfjFonM-Tn7fziqiv33HlGt09wgLZDSCP-BQaux51w/edit#gid=1000652376

const NUM_RAND_FIRES = 100

const DISTANCE_EARTH = 1000

var Globe = function(opts) {

  var distance = DISTANCE_EARTH
  var dist = {earth: DISTANCE_EARTH}
  var padding = 40;


  function createBoxes() {

    //for (let i=-90; i < 90; i += MathF.random(3, 8)) {
    //  for (let j=-180; j < 180; j += 4) {


    for (let i=0; i<500; i++) {
      let lat = MathF.random(-90,90),
        lng = MathF.random(-180, 180)



      let p = _getPosFromLatLng(lat, lng)
      addBox(p, MathF.random(1, 5), 0xff00f0)
    }
  }

  function visBoxes() {

    boxes.forEach((b,i) => {
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
        for(var i = 0, len = data.length; i < len; i+=4) {
            if(data[i] > 0) {
                // is white
                index = i / 4;
                let x = index % width,
                  y = index / width | 0;

                vertices.push(new THREE.Vector2(x,y))
                count++;
            }
        }

        console.log(vertices)

        vertices.forEach(v => {

          var axis = new THREE.Vector3( 0, 0, 1 );
          var angle = Math.PI / 2;
          var a = new THREE.Euler( 0, 0, angle, 'XYZ' );
          //pos.applyAxisAngle( axis, angle );
          //pos.translate()
          //v.applyEuler(a)

          let pos = _getPosFromLatLng(v.x * 3, v.y * 3)

          addBox(pos, MathF.random(1, 5), 0xff00f0)
        })

  }

  function funkUp (box) {
    var verts = box.geometry.vertices
    let p = box.position

    let height = simplex.noise4D(p.x, p.y,0, shaderTime * vis.speed)
    let size = 300 * vis.amplitude * height
    let c = simplex.noise4D(p.x, p.y, 0, shaderTime * 0.1)

    box.material.color.setHSL(c, MathF.random(0.6, 0.9), height)

    box.scale.z = Math.max( size, 0.1 ); // avoid non-invertible matrix
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

    let geom  = new THREE.CubeGeometry(4, 4, 1);
    geom.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,-0.5));

    let mat = new THREE.MeshBasicMaterial({color: color})


    let box = new THREE.Mesh(geom, mat)


    box.position.copy(pos)
    box.lookAt(mesh.position);

    box.scale.z = Math.max( size, 0.1 ); // avoid non-invertible matrix
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
      y: pos.y-0.2,
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
    particleGroup.triggerPoolEmitter( 1, p );
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

class Drones extends Scene {
  constructor(args)
  {
    super(args, new THREE.Vector3(0,0,DISTANCE_EARTH))

    this.background()
    //stars()
    this.globe()
  }

  globe() {

    const VIS='globe'
    let conf = {on: false}
    const group = new THREE.Group()
    group.visible = conf.on
    this.scene.add(group)

    let mesh = null,
        particleGroup = null


    this.loader.load('/assets/Drones/world.jpg', texture => {
      this.loader.load('./assets/Drones/smokeparticle.png', smoke => {

      let geometry = new THREE.SphereGeometry(200, 40, 30)
      const explodeModifier = new THREE.ExplodeModifier()
      explodeModifier.modify( geometry )

      const material = new THREE.ShaderMaterial({

          //uniforms: uniforms,
          uniforms: {
            texture: { type: 't', value: texture },
            glowIntensity: {type: 'f', value: 3},
            redIntensity: {type: 'f', value: 0},
            wobble: {type: 'f', value: 0},
            time: {type: 'f', value: 0}
          },
          transparent: true,
          fragmentShader: glslify(__dirname + '/glsl/Drones/Earth.frag'),
          vertexShader: glslify(__dirname + '/glsl/Drones/Earth.vert')

        });
      material.side = THREE.DoubleSide;


      mesh = new THREE.Mesh(geometry, material)
      mesh.rotation.y = Math.PI;
      group.add(mesh)


      // add atmosphere
      let atmoMaterial = new THREE.ShaderMaterial({

          uniforms: {
            glowIntensity: {type: 'f', value: 1},
            redIntensity: {type: 'f', value: 0}
          },
          fragmentShader: glslify(__dirname + '/glsl/Drones/Atmosphere.frag'),
          vertexShader: glslify(__dirname + '/glsl/Drones/Atmosphere.vert'),
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          transparent: true

        });

      const atmoMesh = new THREE.Mesh(geometry, atmoMaterial)
      atmoMesh.scale.set( 1.1, 1.1, 1.1 )
      group.add(atmoMesh)
      mesh.atmosphere = atmoMesh


          // Particles
      let emitterSettings = {
                  type: SPE.distributions.SPHERE,
                  position: {
                      spread: new THREE.Vector3(10),
                      radius: 1,
                  },
                  velocity: {
                      value: new THREE.Vector3( 100 )
                  },
                  size: {
                      value: [ 30, 0 ]
                  },
                  opacity: {
                      value: [1, 0]
                  },
                  color: {
                      value: [new THREE.Color('yellow'),new THREE.Color('red')]
                  },
                  particleCount: 100,
                  alive: true,
                  duration: 0.05,
                  maxAge: {
                      value: 0.5
                  }
              };

      particleGroup = new SPE.Group({
              texture: {
                value: smoke
              },
              blending: THREE.AdditiveBlending
      });
      particleGroup.addPool(NUM_RAND_FIRES, emitterSettings, false)
      group.add( particleGroup.mesh )


      this.events.on('tick', t => {
        particleGroup.tick( t.delta )
      })
    })
    })


    const doWobble = () => {
      const wobble = 1,
            glowing = 1

      mesh.material.uniforms.wobble.value = wobble;
      mesh.material.uniforms.glowIntensity.value = glowing;
      mesh.material.uniforms.redIntensity.value = 1 -glowing / 3;


      mesh.atmosphere.material.uniforms.glowIntensity.value = glowing * 4;
      mesh.atmosphere.material.uniforms.redIntensity.value = 1- glowing / 3;
    }
    this.events.on(VIS+'::doWobble', (p) => {
      doWobble()
    })
    conf.doWobble = doWobble


    const doExplode = () => {
                const geometry = mesh.geometry


                for(var i = 0; i < (geometry.vertices.length); i++)
                {

                    var pos = new THREE.Vector3();
                    var v = geometry.vertices[i]


                    pos.x += v.x * random(0,50)
                    pos.y += v.y * random(0,50)
                    pos.z += v.z * random(0,50)


                tweenr.to(geometry.vertices[i],
                     { x: pos.x, y: pos.y, z: pos.z, duration: 5 })
                  .on('update', _ => geometry.verticesNeedUpdate = true)
                  .on('complete', _ => group.visible = false)


                }
    }


    this.events.on(VIS+'::doExplode', (p) => {
      doExplode()
    })
    conf.doExplode = doExplode

    // camera's position
    const cameraRotation = { x: 0, y: 0 };
    const cameraTarget = { x: 0, y: 0 };

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

  const doLatLng = (lat=32, lng=69) => {

    let p = latLngOnSphere(lat, lng)

    tweenr.to(cameraTarget, {
      x: p.x,
      y: p.y,
      duration: 0.5
    }).on('update', _ => moveEarth())
  }
    this.events.on(VIS+'::doLatLng', (p) => doLatLng(37/*p.lat*/, 58/*p.lng*/))
    conf.doLatLng = doLatLng


    const doRnd = () => {

      let moveX = random(-Math.PI*2,Math.PI*2),
        moveY = random(-Math.PI,Math.PI)

      moveX *= Math.random() * 0.8;
      moveY *= Math.random() * 0.8;

      tweenr.to(cameraTarget, {
        x: moveX,
        y: moveY,
        duration: 0.5
      })
        .on('update', _ => moveEarth())

    }
    this.events.on(VIS+'::doRnd', (p) => doRnd())
    conf.doRnd = doRnd

    const doRndFire = () => {

      let lat = random(-90, 90),
          lng = random(-180, 180)

      let p = _getPosFromLatLng(lat, lng)

      particleGroup.triggerPoolEmitter( 1, p );

    }
    this.events.on(VIS+'::doRndFire', (p) => doRndFire())
    conf.doRndFire = doRndFire


    this.events.on(VIS+'::visOn', (_) => {

      group.visible = true
      mesh.scale.set(0,0,0)
      mesh.atmosphere.scale.set(0,0,0)
      tweenr.to(mesh.scale, {x:1,y:1,z:1, duration: 2})
      tweenr.to(mesh.atmosphere.scale, {x:1.1,y:1.1,z:1.1, duration: 2})

    })
    this.events.on(VIS+'::visOff', (_) => group.visible = false)

    super.addVis(VIS, conf)

  }


  tick(time, delta)
  {

  }

  stars()
  {
    const VIS='stars'
    const conf = {on: false, speed: 1}
    const group = new THREE.Group()

    let geometry = new THREE.Geometry();
    let material = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: Math.random() * 4 } );

        let r = 450

    let vertex1 = new THREE.Vector3();
          vertex1.x = Math.random() * 2 - 1;
          vertex1.y = Math.random() * 2 - 1;
          vertex1.z = Math.random() * 2 - 1;
          vertex1.normalize();
          vertex1.multiplyScalar( r );

          let vertex2 = vertex1.clone();
          vertex2.multiplyScalar( Math.random() * 0.09 + 1 );

          geometry.vertices.push( vertex1 );
          geometry.vertices.push( vertex2 );

    let star = this.makeStar(geometry)
    star.visible = false
    this.scene.add( star )


          let s = Math.random() * 10
          let line = new THREE.LineSegments( geometry, material );
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
             material = new THREE.ShaderMaterial( {
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
          this.scene.add(skyBox)
        })

  }

/*
  startGUI()
  {
    this.gui.add(this.globe, 'explode')
    this.gui.add(this.globe, 'createRndFire')
    this.gui.add(this.globe, 'moveGlobeRnd')
    this.gui.add(this.globe, 'moveGlobe')
    this.gui.add(this.globe, 'glitch')
    this.gui.add(this.globe, 'createBoxes')
    this.gui.add(this.globe, 'removeBoxes')
    this.gui.add(this.globe, 'visText')
    this.gui.add(this.globe.vis, 'amplitude', 0.0, 1.0)
    this.gui.add(this.globe.vis, 'speed', 0.0, 1.0)
    this.gui.add(this.globe.vis, 'text', 'asdf')

    this.gui.add(this, 'flySpeed', -20, 20)
    this.gui.add(this, 'showStars')

    this.gui.add(this.globe, 'showPakistan')
    this.gui.add(this.globe, 'showEarth')

    this.gui.add(this.globe.earth, 'glowing', 0.3, 3.0)
    this.gui.add(this.globe.earth, 'wobble', 0.0, 1.0)

    this.gui.add(this.globe.target, 'x', -Math.PI, Math.PI)
    this.gui.add(this.globe.target, 'y', -PI_HALF, PI_HALF)
  }
  */

}

export default Drones
