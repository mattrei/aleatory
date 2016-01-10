global.THREE = require('three')
import OC    from 'three-orbit-controls';
import TWEEN from 'tween.js'
import SPE from './ShaderParticleEngine/SPE'
import MathF from 'utils-perf'
const simplex = new (require('simplex-noise'))
const OrbitControls = require('three-orbit-controls')(THREE);
//import SPE from 'shader-particle-engine/build/SPE'

var tweenr = require('tweenr')()
var Tween = require('tween-chain')



const FontUtils = require('./utils/FontUtils')
const GeometryUtils = require('./utils/GeometryUtils')
var typeface = require('three.regular.helvetiker')
THREE.typeface_js.loadFace(typeface);


const ExplodeModifier = require('./modifiers/ExplodeModifier')(THREE)

const CopyShader = require('./shaders/CopyShader')(THREE)
const EffectComposer = require('./postprocessing/EffectComposer')(THREE)
const MaskPass = require('./postprocessing/MaskPass')(THREE)
const RenderPass = require('./postprocessing/RenderPass')(THREE)
const BloomPass = require('./postprocessing/BloomPass')(THREE)
const ShaderPass = require('./postprocessing/ShaderPass')(THREE)

const FilmShader = require('./shaders/FilmShader')(THREE)
const FilmPass = require('./postprocessing/FilmPass')(THREE)
const DigitalGlitch = require('./shaders/DigitalGlitch')(THREE)
const GlitchPass = require('./postprocessing/GlitchPass')(THREE)

import Velocity from 'velocity-animate'
import VelocityUI from 'velocity-animate/velocity.ui'

const glslify = require('glslify')

//https://docs.google.com/spreadsheets/d/1NAfjFonM-Tn7fziqiv33HlGt09wgLZDSCP-BQaux51w/edit#gid=1000652376

const TEXT_DIV = "counter"


const NUM_RAND_FIRES = 100


const PI_HALF = Math.PI / 2
const PI_TWO = Math.PI * 2
const PI = Math.PI

const DISTANCE_EARTH = 1000

var Globe = function(opts) {
  opts = opts || {};

  var Shaders = {
    'atmosphere' : {
      uniforms: {
        'glowIntensity': {type: 'f', value: 12.0},
        'redIntensity': {type: 'f', value: 1.0}
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'vNormal = normalize( normalMatrix * normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      /*lower intensity pow*/
      fragmentShader: [
        'uniform float glowIntensity;',
        'uniform float redIntensity;',
        'varying vec3 vNormal;',
        'void main() {',
          'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), glowIntensity );',
          'vec3 color = mix(vec3(1.,1.,1.), vec3(.5,0.,0.), redIntensity);',
          'gl_FragColor = vec4( color, 1.0 ) * intensity;',
        '}'
      ].join('\n')
    }
  };

  var renderer =  opts.renderer
  var camera, scene, w, h;
  var mesh, atmosphere, point;
  var clock = opts.clock
  // initParticles()
  var particleGroup;

  var shaderTime = 0
  var vis = {amplitude: 0, speed: 1, text: 'asdf'}

  var curZoomSpeed = 0;
  var zoomSpeed = 50;

  var boxes = []

  var earth = {glowing : 3.0, wobble: 0.0 }

  var earthMesh = null

  // camera's position
  var rotation = { x: 0, y: 0 };
  var target = { x: 0, y: 0 };

  var distance = DISTANCE_EARTH
  var dist = {earth: DISTANCE_EARTH}
  var padding = 40;

  var postprocessing = {};

  function initPass(){
        let composer = new THREE.EffectComposer( renderer );
        composer.addPass( new THREE.RenderPass( scene, camera ) );
        postprocessing.composer = composer;

        var width = window.innerWidth;
        var height = window.innerHeight;

        var passes = [
            // ['vignette', new THREE.ShaderPass( THREE.VignetteShader ), true],
            ["film", new THREE.FilmPass( 0.85, 0.5, 2048, false ), false],
            //['staticPass', new THREE.ShaderPass( THREE.StaticShader ), false],
            ["glitch", new THREE.GlitchPass(64, 50), true]
        ]

        // postprocessing['vignette'].uniforms[ "offset" ].value = 1.5;
        // postprocessing['vignette'].uniforms[ "darkness" ].value = 1.6;

        for (var i = 0; i < passes.length; i++) {
            postprocessing[passes[i][0]] = passes[i][1];
            if(passes[i][2]) passes[i][1].renderToScreen = passes[i][2];
            composer.addPass(passes[i][1]);
        };

        let staticParams = {
            show: true,
            amount:20.10,
            size2:20.0
        }

        //postprocessing['staticPass'].uniforms[ "amount" ].value = staticParams.amount;
        //postprocessing['staticPass'].uniforms[ "size" ].value = staticParams.size2;
    }

    function renderPass() {
        postprocessing.composer.render(.5);
    }

  function init() {

    var shader, uniforms, material;
    w = window.innerWidth;
    h = window.innerHeight;

    camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
    camera.position.z = distance;

    scene = new THREE.Scene();

    var geometry = new THREE.SphereGeometry(200, 40, 30);

    var explodeModifier = new THREE.ExplodeModifier();
    explodeModifier.modify( geometry );

    let worldTexture = THREE.ImageUtils.loadTexture('/assets/Drones/world.jpg')

    material = new THREE.ShaderMaterial({

          //uniforms: uniforms,
          uniforms: {
            texture: { type: 't', value: worldTexture },
            glowIntensity: {type: 'f', value: 3.0},
            redIntensity: {type: 'f', value: 0.0},
            wobble: {type: 'f', value: earth.wobble},
            time: {type: 'f', value: 0}
          },
          transparent: true,
          fragmentShader: glslify(__dirname + '/glsl/Drones/Earth.frag'),
          vertexShader: glslify(__dirname + '/glsl/Drones/Earth.vert')

        });
    material.side = THREE.DoubleSide;

    earthMesh = new THREE.Mesh(geometry, material);
    earthMesh.rotation.y = Math.PI;

    scene.add(earthMesh);

    // Stars
    var starGeo = new THREE.SphereGeometry (3000, 10, 100),
        starMat = new THREE.MeshBasicMaterial();
    // TODO
    let texture = THREE.ImageUtils.loadTexture('/assets/Drones/star-field.png');
    texture.minFilter = THREE.NearestFilter
    starMat.map = texture
    starMat.side = THREE.BackSide;

    var starMesh = new THREE.Mesh(starGeo, starMat);
    scene.add(starMesh);

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
              value: THREE.ImageUtils.loadTexture('./assets/spe/smokeparticle.png')
            },
            blending: THREE.AdditiveBlending
    });
    particleGroup.addPool(NUM_RAND_FIRES, emitterSettings, false)
    scene.add( particleGroup.mesh );



    // Atmosphere
    shader = Shaders['atmosphere'];
    //uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    uniforms = shader.uniforms

    material = new THREE.ShaderMaterial({

          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          transparent: true

        });

    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set( 1.1, 1.1, 1.1 );
    scene.add(mesh);



    geometry = new THREE.BoxGeometry(0.75, 0.75, 1);
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,-0.5));
    point = new THREE.Mesh(geometry);


    let controls = new OrbitControls(camera, renderer.domElement);
    controls.maxDistance = 300000;
    renderer.domElement.addEventListener('mousewheel', onMouseWheel, false);

    initPass()

  }

  function onMouseWheel(event) {
    event.preventDefault();
    dist.earth -= event.wheelDeltaY * 0.3
    return false;
  }

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

  function update(time) {
    earthMesh.material.uniforms.time.value = time * 0.05;
    earthMesh.material.uniforms.wobble.value = earth.wobble;
    earthMesh.material.uniforms.glowIntensity.value = earth.glowing;
    earthMesh.material.uniforms.redIntensity.value = 1 -earth.glowing / 3;

    let atmosphereUniforms = Shaders['atmosphere'].uniforms;
    atmosphereUniforms.glowIntensity.value = earth.glowing * 4;
    atmosphereUniforms.redIntensity.value = 1- earth.glowing / 3;

    visBoxes()
    renderPass()
  }
/*
  function render(dt) {

    stats.begin();
    if (particleGroup) {
      particleGroup.tick( dt );
    }

    shaderTime += 0.1


    earthMesh.material.uniforms.time.value = shaderTime * 0.05;
    earthMesh.material.uniforms.wobble.value = earth.wobble;
    earthMesh.material.uniforms.glowIntensity.value = earth.glowing;
    earthMesh.material.uniforms.redIntensity.value = 1 -earth.glowing / 3;

    let atmosphereUniforms = Shaders['atmosphere'].uniforms;
    atmosphereUniforms.glowIntensity.value = earth.glowing * 4;
    atmosphereUniforms.redIntensity.value = 1- earth.glowing / 3;


    visBoxes()

    //renderer.render(scene, camera);
    renderPass()
    stats.end();
  }
*/

// TODO
/*
    rotation.x += (target.x - rotation.x) * 0.1;
    rotation.y += (target.y - rotation.y) * 0.1;
    distance += (dist.earth - distance) * 0.3;

     // determine camera position
    set3dPosition(camera, {
      x: rotation.x,
      y: rotation.y,
      altitude: distance
    });
    camera.lookAt(mesh.position);
    */


  var set3dPosition = function(obj, coords) {
    console.log(coords)

    var x = coords.x;
    var y = coords.y;
    var altitude = coords.altitude;

    obj.position.set(
      altitude * Math.sin(x) * Math.cos(y),
      altitude * Math.sin(y),
      altitude * Math.cos(x) * Math.cos(y)
    );

    console.log(obj.position)
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

  function _moveEarth() {
    rotation.x += (target.x - rotation.x) * 0.1;
    rotation.y += (target.y - rotation.y) * 0.1;
    distance += (dist.earth - distance) * 0.3;

     // determine camera position
    set3dPosition(camera, {
      x: rotation.x,
      y: rotation.y,
      altitude: distance
    });
    camera.lookAt(mesh.position);
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

  function createRndFire() {
    //for (let i=0; i < 5; i++) {
    let lat = MathF.random(-90, 90), //  -90 .. 90
        lng = MathF.random(-180, 180)         // 180 .. -180

    let p = _getPosFromLatLng(lat, lng)

    particleGroup.triggerPoolEmitter( 1, p );
    //target = calculate2dPosition(lat, lng)
  //}
  }

  var calculate2dPosition = function(lat, lng) {
    var phi = (90 + lng) * PI / 180;
    var theta = (180 - lat) * PI / 180;

    return {
      x: phi - PI,
      y: PI - theta
    }
  }

  function moveGlobe(lat=32, lng=69) {

    let p = calculate2dPosition(lat, lng)
    target = p

    let tween = tweenr.to(target, {
      x: p.x,
      y: p.y,
      duration: 0.5
    })

    tween.on('update',() => {
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

  function moveGlobeRnd() {

    let zoomDamp = distance/1000;

    let moveX = (Math.random() * PI_TWO * 2) - PI_TWO,
      moveY = (Math.random() * PI_HALF * 2) - PI_HALF

    moveX *= Math.random() * 0.8;
    moveY *= Math.random() * 0.8;

    //target = {x: moveX, y:moveY}

    let tween = tweenr.to(target, {
      x: moveX,
      y: moveY,
      duration: 0.5
    })

    tween.on('update',() => {
      _moveEarth()
    })

  }

  function explode() {

    var geometry = mesh.geometry


                for(var i = 0; i < (geometry.vertices.length); i++)
                {

                    var pos = new THREE.Vector3();
                    var v = geometry.vertices[i]


                    pos.x = v.x * (Math.random() * 100 + 50);
                    pos.y = v.y * (Math.random() * 100 + 50);
                    pos.z = v.z * (Math.random() * 100 + 50);


                    new TWEEN.Tween(geometry.vertices[i])
                    .to( { x: pos.x, y: pos.y, z: pos.z }, 30000 )
                    .easing( TWEEN.Easing.Exponential.InOut )
                    .onUpdate( function() { geometry.verticesNeedUpdate = true })
                    .start();


                }

  }
  function glitch() {
    postprocessing['glitch'].generateTrigger();
  }


  init();
  this.update = update

  this.explode = explode;
  this.createRndFire = createRndFire;
  this.createFire = createFire;
  this.moveGlobeRnd = moveGlobeRnd;
  this.moveGlobe = moveGlobe;
  this.glitch = glitch

  this.createBoxes = createBoxes
  this.removeBoxes = removeBoxes
  this.visText = visText
  this.vis = vis

  this.showPakistan = showPakistan
  this.showEarth = showEarth

  this.renderer = renderer;
  this.scene = scene;
  this.camera = camera;

  this.earth = earth
  this.target = target;

  return this;

};

class Drones {
  constructor(args)
  {
    this.run = false
    this.gui = args.gui

    this.stars = []
    this.flySpeed = 0

    let opts = {}
    this.update = this.update.bind(this)
    opts.update = this.update
    opts.renderer = args.renderer
    opts.clock = args.clock

    this.globe = new Globe(opts)
    args.events.on("update", (time) => this.update(time))

    this.scene = this.globe.scene
    this.camera = this.globe.camera

    this.createTextDiv()

    this.makeStars()
  }

  update(time)
  {

    if (!this.run) return

    this.globe.update(time)

    if (this.stars) {

      let stars = this.stars.slice(0)

      stars.forEach(s => {
        s.position.z += this.flySpeed * 10 //* s.speed

        if (s.position.z > 500) {
          s.position.z = -5000
        }
      })

    }

  }

  makeStars() {
    for(let i = 0; i < 2000; i++ ) {
      this.stars.push(this.addStar())
    }

  }

  addStar()
  {
    let geometry = this.createStarGeometry()
    let star = this.makeStar(geometry)
    star.visible = false
    this.scene.add( star )

    return star
  }

  makeStar(geometry)
  {
      let material = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: Math.random() * 4 } );

        let s = Math.random() * 10
          let line = new THREE.LineSegments( geometry, material );
          line.scale.x = line.scale.y = line.scale.z = s;
          line.originalScale = s
          line.speed = Math.random()
          line.rotation.y = Math.random() * Math.PI;
          line.updateMatrix();
          line.position.z = Math.random() * -5000

      return line
  }

  createStarGeometry()
  {
    let r = 450
    let geometry = new THREE.Geometry();
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

    return geometry
  }

  createGeometry() {

    let r = 450
        var geometry = new THREE.Geometry();

      for (let j=1; j < 4; j++) {
        let z = j * 40
        for (let i = 0; i < 500; i ++ ) {

          let vertex1 = new THREE.Vector3();
          vertex1.x = Math.random() * 2 - 1;
          vertex1.y = Math.random() * 2 - 1;
          vertex1.z = Math.random() * 40 - j;
          vertex1.normalize();
          vertex1.multiplyScalar( r );

          let vertex2 = vertex1.clone();
          vertex2.multiplyScalar( Math.random() * 0.09 + 1 );

          geometry.vertices.push( vertex1 );
          geometry.vertices.push( vertex2 );

        }
      }

        return geometry;

      }

  showStars() {
    this.stars.forEach(s => {
      s.visible = !s.visible
    })

  }

  createTextDiv()
  {
    let counter = document.createElement('div')
    counter.id = TEXT_DIV
    counter.style.cssText = `
      font-family:Helvetica,Arial,sans-serif;font-size:30px;font-weight:bold;line-height:15px;color:white;
      `
    counter.style.position = "absolute"
    counter.style.left = "70%"
    counter.style.top = "50%"
    document.body.appendChild(counter);
  }

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
  onResize(e)
  {
    this.globe.renderer.setSize( window.innerWidth, window.innerHeight)
    this.globe.camera.aspect = window.innerWidth / window.innerHeight
    this.globe.camera.updateProjectionMatrix();
  }
  play() {
    this.startGUI()
    this.run = true
  }
  stop() {
    this.run = false
    for (var i in this.gui.__controllers) {
      this.gui.__controllers[i].remove()
    }
  }
}

export default Drones;
