import THREE from 'three.js'
import OC    from 'three-orbit-controls';
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import TWEEN from 'tween.js'
import SPE from './ShaderParticleEngine/SPE'
//import SPE from 'shader-particle-engine/build/SPE'

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

//https://docs.google.com/spreadsheets/d/1NAfjFonM-Tn7fziqiv33HlGt09wgLZDSCP-BQaux51w/edit#gid=1000652376

const TEXT_DIV = "counter"


const NUM_RAND_FIRES = 100


const PI_HALF = Math.PI / 2
const PI_TWO = Math.PI * 2
const PI = Math.PI

var Globe = function(container, opts) {
  opts = opts || {};
  
  var colorFn = opts.colorFn || function(x) {
    var c = new THREE.Color();
    c.setHSL( ( 0.6 - ( x * 0.5 ) ), 1.0, 0.5 );
    return c;
  };
  var imgDir = opts.imgDir || '/globe/';

  var Shaders = {
    'earth' : {
      uniforms: {
        'texture': { type: 't', value: null },
        'glowIntensity': {type: 'f', value: 3.0},
        'redIntensity': {type: 'f', value: 1.0}
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      /* lower intensity */
      fragmentShader: [
        'uniform sampler2D texture;',
        'uniform float glowIntensity;',
        'uniform float redIntensity;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec3 diffuse = texture2D( texture, vUv ).xyz;',
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, glowIntensity );',
          'atmosphere = mix(atmosphere, vec3(.5,0.0,0.0), redIntensity);',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    },
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

  var stats

  var camera, scene, renderer, w, h;
  var mesh, atmosphere, point;
  var clock;
  // initParticles()
  var particleGroup;

  var overRenderer;

  var curZoomSpeed = 0;
  var zoomSpeed = 50;

  var earth = {glowing : 3.0 }

  var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
//  var rotation = { x: 0, y: 0 },
//      target = { x: Math.PI*3/2, y: Math.PI / 6.0 },
  var targetOnDown = { x: 0, y: 0 };

  // camera's position
  var rotation = { x: 0, y: 0 };
  var target = { x: 0, y: 0 };

  var distance = 100000, distanceTarget = 1000;
  var padding = 40;
  
  var postprocessing = {};

  function startStats()
  {
    stats = new Stats(); 
    stats.domElement.style.position = 'absolute';
    document.body.appendChild(stats.domElement);
  }

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

    container.style.color = '#fff';
    container.style.font = '13px/20px Arial, sans-serif';

    var shader, uniforms, material;
    w = container.offsetWidth || window.innerWidth;
    h = container.offsetHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
    camera.position.z = distance;

    scene = new THREE.Scene();

    clock = new THREE.Clock();

    var geometry = new THREE.SphereGeometry(200, 40, 30);

    var explodeModifier = new THREE.ExplodeModifier();
    explodeModifier.modify( geometry );

    shader = Shaders['earth'];
    //uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    uniforms = shader.uniforms

    uniforms['texture'].value = THREE.ImageUtils.loadTexture(imgDir+'world.jpg');

    material = new THREE.ShaderMaterial({

          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader

        });
    material.side = THREE.DoubleSide;

    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = Math.PI;
    scene.add(mesh);

    // Stars
    var starGeo = new THREE.SphereGeometry (3000, 10, 100),
        starMat = new THREE.MeshBasicMaterial();
    let texture = THREE.ImageUtils.loadTexture(imgDir+'star-field.png');
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

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(w, h);

    startStats()
    renderer.domElement.style.position = 'absolute';

    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onMouseDown, false);

    container.addEventListener('mousewheel', onMouseWheel, false);

    window.addEventListener('resize', onWindowResize, false);

    container.addEventListener('mouseover', function() {
      overRenderer = true;
    }, false);

    container.addEventListener('mouseout', function() {
      overRenderer = false;
    }, false);

    initPass()

  }


  function onMouseDown(event) {
    event.preventDefault();

    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = - event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    container.style.cursor = 'move';
  }

  function onMouseMove(event) {
    mouse.x = - event.clientX;
    mouse.y = event.clientY;

    var zoomDamp = distance/1000;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

    target.y = target.y > PI_HALF ? PI_HALF : target.y;
    target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
  }

  function onMouseUp(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
    container.style.cursor = 'auto';
  }

  function onMouseOut(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
  }

  function onMouseWheel(event) {
    event.preventDefault();
    if (overRenderer) {
      zoom(event.wheelDeltaY * 0.3);
    }
    return false;
  }

  function onWindowResize( event ) {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( container.offsetWidth, container.offsetHeight );
  }


  function zoom(delta) {
    distanceTarget -= delta;
    distanceTarget = distanceTarget > 5000 ? 5000 : distanceTarget;
    distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
  }

  function animate() {
    TWEEN.update();

    opts.update()

    requestAnimationFrame(animate);
    render(clock.getDelta() );
  }

  function render(dt) {

    stats.begin();
    if (particleGroup) {
      particleGroup.tick( dt );
    }



    let earthUniforms = Shaders['earth'].uniforms;
    earthUniforms.glowIntensity.value = earth.glowing;
    earthUniforms.redIntensity.value = 1 -earth.glowing / 3;

    let atmosphereUniforms = Shaders['atmosphere'].uniforms;
    atmosphereUniforms.glowIntensity.value = earth.glowing * 4;
    atmosphereUniforms.redIntensity.value = 1- earth.glowing / 3;


    zoom(curZoomSpeed);

    rotation.x += (target.x - rotation.x) * 0.1;
    rotation.y += (target.y - rotation.y) * 0.1;
    distance += (distanceTarget - distance) * 0.3;

     // determine camera position
    set3dPosition(camera, {
      x: rotation.x,
      y: rotation.y,
      altitude: distance
    });

    camera.lookAt(mesh.position);


    //renderer.render(scene, camera);
    renderPass()
    stats.end();
  }

  var set3dPosition = function(mesh, coords) {
    if(!coords)
      coords = mesh.userData;

    var x = coords.x;
    var y = coords.y;
    var altitude = coords.altitude;

    mesh.position.set(
      altitude * Math.sin(x) * Math.cos(y),
      altitude * Math.sin(y),
      altitude * Math.cos(x) * Math.cos(y)
    );
  }

  function createRndFire() {
    //for (let i=0; i < 5; i++) {
    let lat = Math.random() * 180 - 90, //  -90 .. 90
        lng = Math.random() * 360 - 180         // 180 .. -180

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

    target = {x: moveX, y:moveY}
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
  this.animate = animate;


  this.__defineGetter__('time', function() {
    return this._time || 0;
  });

  this.__defineSetter__('time', function(t) {
    var validMorphs = [];
    var morphDict = this.points.morphTargetDictionary;
    for(var k in morphDict) {
      if(k.indexOf('morphPadding') < 0) {
        validMorphs.push(morphDict[k]);
      }
    }
    validMorphs.sort();
    var l = validMorphs.length-1;
    var scaledt = t*l+1;
    var index = Math.floor(scaledt);
    for (i=0;i<validMorphs.length;i++) {
      this.points.morphTargetInfluences[validMorphs[i]] = 0;
    }
    var lastIndex = index - 1;
    var leftover = scaledt - index;
    if (lastIndex >= 0) {
      this.points.morphTargetInfluences[lastIndex] = 1 - leftover;
    }
    this.points.morphTargetInfluences[index] = leftover;
    this._time = t;
  });

  this.explode = explode;
  this.createRndFire = createRndFire;
  this.createFire = createFire;
  this.moveGlobeRnd = moveGlobeRnd;
  this.moveGlobe = moveGlobe;
  this.glitch = glitch

  this.distanceTarget = distanceTarget;


  this.onWindowResize = onWindowResize;

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

    this.stars = []
    this.flySpeed = 0

    let opts = {}
    opts.imgDir = 'assets/'
    this.update = this.update.bind(this)
    opts.update = this.update
    this.globe = new Globe(document.getElementById('container'), opts)
    this.scene = this.globe.scene
    this.camera = this.globe.camera

    this.createTextDiv()

    this.globe.animate() 

    this.startGUI()

    
    this.makeStars()

    

  }

  update() 
  {

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

    this.scene.add( star );

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
    var gui = new dat.GUI()
    gui.add(this.globe, 'explode')
    gui.add(this.globe, 'createRndFire')
    gui.add(this.globe, 'moveGlobeRnd')
    gui.add(this.globe, 'moveGlobe')
    gui.add(this.globe, 'glitch')

    gui.add(this, 'flySpeed', -20, 20)
    gui.add(this, 'showStars')

    gui.add(this.globe.earth, 'glowing', 0.3, 3.0)

//    gui.add(this.globe.target, 'distance', 300, 2000)
    gui.add(this.globe.target, 'x', -Math.PI, Math.PI)
    gui.add(this.globe.target, 'y', -PI_HALF, PI_HALF)
  }
  onResize(e)
  {  
    this.globe.onWindowResize(e)
  }
}

export default Drones;