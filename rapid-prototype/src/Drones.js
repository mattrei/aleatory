import THREE from 'three.js'
import OC    from 'three-orbit-controls';
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import TWEEN from 'tween.js'
import SPE from './ShaderParticleEngine/SPE'
//import SPE from 'shader-particle-engine/build/SPE'
console.log(SPE)
import ExplodeModifier from './modifiers/ExplodeModifier'

global.jQuery = require('jquery');
require('blast-text')
require('velocity-animate')
require('velocity-animate/velocity.ui')

//https://docs.google.com/spreadsheets/d/1NAfjFonM-Tn7fziqiv33HlGt09wgLZDSCP-BQaux51w/edit#gid=1000652376

const TEXT_DIV = "counter"


const NUM_RAND_FIRES = 100

//const FONT =  'DejaVu-sdf.fnt'
//const FONT_IMG = 'DejaVu-sdf.png'


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
        'texture': { type: 't', value: null }
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
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec3 diffuse = texture2D( texture, vUv ).xyz;',
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    },
    'atmosphere' : {
      uniforms: {},
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'vNormal = normalize( normalMatrix * normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      /*lower intensity pow*/
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
          'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
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

  var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
//  var rotation = { x: 0, y: 0 },
//      target = { x: Math.PI*3/2, y: Math.PI / 6.0 },
  var    targetOnDown = { x: 0, y: 0 };

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

/*
  function initFonts(renderer) {
    let opt = { 
      font: 'assets/fonts/' + FONT,
      image: 'assets/fonts/' + FONT_IMG
    }

    LoadBmFont(opt.font, function(err, font) {
      if (err)
        throw err
      THREE.ImageUtils.loadTexture(opt.image, undefined, function(tex) {
        startFont(font, tex, renderer)
      })  
    })

  }

  function startFont(font, texture, renderer) {


        //setup our texture with some nice mipmapping etc
        var maxAni = renderer.getMaxAnisotropy()
  texture.needsUpdate = true
  texture.minFilter = THREE.LinearMipMapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = maxAni
    var geometry = CreateText({
      text: 'Lorem ipsumDolor sit amet.',
      width: 1000,
      font: font
    })

     var material = new THREE.ShaderMaterial(Shader({
      map: texture,
      smooth: 1/32, //the smooth value for SDF
      side: THREE.DoubleSide,
        depthWrite: false,
        depthRead: false,
        depthTest: false,
      transparent: true,
      color: 'rgb(230, 230, 230)'
    }))


            //now do something with our text mesh ! 
      var text = new THREE.Mesh(geometry, material)



       var textAnchor = new THREE.Object3D()
      textAnchor.add(text)
      //textAnchor.scale.multiplyScalar(1/(window.devicePixelRatio||1))
      scene.add(textAnchor)
  }
*/
  function initPass(){
        composer = new THREE.EffectComposer( renderer );
        composer.addPass( new THREE.RenderPass( scene, camera ) );
        postprocessing.composer = composer;

        var width = window.innerWidth;
        var height = window.innerHeight;

        var passes = [
            // ['vignette', new THREE.ShaderPass( THREE.VignetteShader ), true],
            ["film", new THREE.FilmPass( 0.85, 0.5, 2048, false ), false],
            ['staticPass', new THREE.ShaderPass( THREE.StaticShader ), false],
            ["glitch", new THREE.GlitchPass(64, 50), true]
        ]

        // postprocessing['vignette'].uniforms[ "offset" ].value = 1.5;
        // postprocessing['vignette'].uniforms[ "darkness" ].value = 1.6;

        for (var i = 0; i < passes.length; i++) {
            postprocessing[passes[i][0]] = passes[i][1];
            if(passes[i][2]) passes[i][1].renderToScreen = passes[i][2];
            composer.addPass(passes[i][1]);
        };

        staticParams = {
            show: true,
            amount:20.10,
            size2:20.0
        }

        postprocessing['staticPass'].uniforms[ "amount" ].value = staticParams.amount;
        postprocessing['staticPass'].uniforms[ "size" ].value = staticParams.size2;
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
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

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
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

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

    //initFonts(renderer)

    renderer.domElement.style.position = 'absolute';

    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onMouseDown, false);

    container.addEventListener('mousewheel', onMouseWheel, false);

    document.addEventListener('keydown', onDocumentKeyDown, false);

    window.addEventListener('resize', onWindowResize, false);

    container.addEventListener('mouseover', function() {
      overRenderer = true;
    }, false);

    container.addEventListener('mouseout', function() {
      overRenderer = false;
    }, false);

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

  function onDocumentKeyDown(event) {
    switch (event.keyCode) {
      case 38:
        zoom(100);
        event.preventDefault();
        break;
      case 40:
        zoom(-100);
        event.preventDefault();
        break;
    }
  }

  function onWindowResize( event ) {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( container.offsetWidth, container.offsetHeight );
  }


  function zoom(delta) {
    distanceTarget -= delta;
    distanceTarget = distanceTarget > 3000 ? 3000 : distanceTarget;
    distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
  }

  function animate() {
    TWEEN.update();
    requestAnimationFrame(animate);
    render(clock.getDelta() );
  }

  function render(dt) {

    stats.begin();
    if (particleGroup) {
      particleGroup.tick( dt );
    }

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


    renderer.render(scene, camera);
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

  //  jQuery('#counter').textillate('out')
    
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

    //jQuery('#counter').textillate('in')
    jQuery('#counter')
      .html("<p>Mat Trei</p><p>" + Math.random() + '</p>')
      .blast({delimiter: 'word'})
      //.velocity("fadeOut", { duration: 300 })
      //.velocity("fadeIn", { delay: 300, duration: 700 }) 
      //.velocity("slideDown", { duration: 500 })
      .velocity("scroll", { duration: 1500, easing: "spring" })
    .velocity({ opacity: 1 });
      //.velocity("slideUp", { delay: 500, duration: 1500 });


      //.css({ opacity: 0, display: "inline-block" })
      //.velocity("slideUp", { duration: 1500 });
      //.velocity({translateX: "200px",
    //rotateZ: "45deg"})

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

  this.distanceTarget = distanceTarget;


  this.onWindowResize = onWindowResize;

  this.renderer = renderer;
  this.scene = scene;
  this.camera = camera;
  this.target = target;

  return this;

};

class Drones {
  constructor(args) 
  {
    let opts = {}
    opts.imgDir = 'assets/'
    this.globe = new Globe(document.getElementById('container'), opts)

    this.createTextDiv()

    this.globe.animate() 

    this.startGUI()

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

    jQuery('#' + TEXT_DIV)
      .html("Matthias Treitler")
      //.blast({delimiter: 'word'})
      //.css({ opacity: "0" })
      .velocity("fadeIn", { duration: 5000 })
      .velocity("callout.shake")
  }

  startGUI()
  {
    var gui = new dat.GUI()
    gui.add(this.globe, 'explode')
    gui.add(this.globe, 'createRndFire')
    gui.add(this.globe, 'moveGlobeRnd')
    gui.add(this.globe, 'moveGlobe')
    //gui.add(this.globe, 'distanceTarget', 300, 2000)
    gui.add(this.globe.target, 'x', -Math.PI, Math.PI)
    gui.add(this.globe.target, 'y', -PI_HALF, PI_HALF)
  }
  onResize(e)
  {  
    this.globe.onWindowResize(e)
  }
}

export default Drones;