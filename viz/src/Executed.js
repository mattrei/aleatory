//import THREE from 'three.js';
global.THREE = require('three.js')

import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import MathF from 'utils-perf'
import tweenr from 'tweenr'
import TWEEN from 'tween.js'
const glslify = require('glslify')

const TextGeometry = require('./geometries/TextGeometry')(THREE)
const GeometryUtils = require('./utils/GeometryUtils')

import ExecutedData from './test_data/executed.json'
import ScheduledData from './test_data/scheduled.json'

import NoMousePersonControls from './controls/NoMousePersonControls'

const Tweenr = tweenr()

const ParticleShader = require('./shaders/ParticleShader')(THREE)

const OrbitControls = require('three-orbit-controls')(THREE);

const NUM_PARTICLES = 400000
const MAX_PARTICLE_DIST = 6000

const Velocity = require('velocity-animate')
require('velocity-animate/velocity.ui')

const POLY_SIZE = 8000
const SPHERE_SIZE = 1500

const CAMERA_POS = {x: 0, y:0, z:5000}

class Demo {
  constructor(args) 
  {
    this.current = {show: 0.0, number: 1}

    this.text = {name: null, date: null, intro: null}
    this.introText = ''

    this.targetView = 'grid'

    this.objects = []
    this.targets = { table: [], sphere: [], helix: [], grid: [], random: [] };
    this.executed = []

    //scheduled
    this.shaderTime = 0
    this.scheduled = []
    this.particleSystem = null;

    this.currentIdx = 0
    this.transition = 2000

    this.startStats();
    this.startGUI();

    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.controls = null
    this.counter  = 0;
    this.clock    = new THREE.Clock();

    this.createTextDiv()

    this.createRender();
    this.createScene();

    this.onResize();
    this.update();
  }

    startGUI()
  {
    var gui = new dat.GUI()
    gui.add(this, 'resetCamera')
    gui.add(this, 'doVisible')
    gui.add(this, 'doGrid')
    gui.add(this, 'doSphere')
    gui.add(this, 'doRandom')
    gui.add(this, 'lookAtRnd')
    gui.add(this, 'lookAtNext')
    gui.add(this, 'transition', 500, 5000)

    gui.add(this.current, 'show', 0, 5)
    gui.add(this.current, 'number', 1, 8)

    gui.add(this, 'introText')
    gui.add(this, 'updateIntroText')
    gui.add(this, 'clearTexts')


    gui.add(this, 'addExecuted')
    gui.add(this, 'addScheduled')
    gui.add(this, 'nextScheduled')
    gui.add(this, 'clearScene')
  }


  createTextDiv() 
  {
    let div = document.createElement('div')
    div.id = "textName"
    div.style.cssText = `
      font-family:Helvetica,Arial,sans-serif;font-size:30px;font-weight:bold;line-height:15px;color:white;
      `
    div.style.position = "absolute"
    //div.style.left = "50%"
    div.style.width = "100%"
    div.style['text-align'] = "center"
    div.style.top = "20%"
    document.body.appendChild(div)

    this.text.name = div

    let div2 = document.createElement('div')
    div2.id = "textDate"
    div2.style.cssText = `
      font-family:Helvetica,Arial,sans-serif;font-size:30px;font-weight:bold;line-height:15px;color:white;
      `
    div2.style.position = "absolute"
    div2.style.width = "100%"
    div2.style['text-align'] = "center"
    div2.style.top = "80%"
    document.body.appendChild(div2)


    this.text.date = div2

    div2 = document.createElement('div')
    div2.id = "textIntro"
    div2.style.cssText = `
      font-family:Helvetica,Arial,sans-serif;font-size:30px;font-weight:bold;line-height:15px;color:white;
      `
    div2.style.position = "absolute"
    div2.style.width = "100%"
    div2.style['text-align'] = "center"
    div2.style.top = "50%"
    document.body.appendChild(div2)
    


    this.text.intro = div2
  }

  clearTexts() {
    this.text.name.innerHTML = ''
    this.text.date.innerHTML = ''
    this.text.intro.innerHTML = ''
  }

  updateIntroText() {
    Velocity.animate(this.text.intro, "fadeOut", this.transition/4)
      .then((e) => {
        this.text.intro.innerHTML = this.introText
        Velocity(this.text.intro, "fadeIn", this.transition )
      })
  }
  startStats()
  {
    this.stats = new Stats(); 
    this.stats.domElement.style.position = 'absolute';
    document.body.appendChild(this.stats.domElement);
  }

  createRender()
  {
    this.renderer = new THREE.WebGLRenderer( {
        antialias : true,
        clearColor: 0
    } );
    document.body.appendChild(this.renderer.domElement)
  }

  createScene()
  {
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100000 );
    this.camera.position.set(CAMERA_POS.x, CAMERA_POS.y, CAMERA_POS.z);
    this.scene = new THREE.Scene();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxDistance = 300000;

  }

  addExecuted()
  {

    let geom = new THREE.IcosahedronGeometry( POLY_SIZE, 0 );
    let mat = new THREE.MeshLambertMaterial( {
      color: 0xb9dff2,
      side: THREE.DoubleSide,
      wireframe: false});
  

    let bgmesh = new THREE.Mesh(geom, mat)
    this.scene.add(bgmesh)


    let plight = new THREE.PointLight( 0xffffff, 1, 10000 );
    plight.position.set( -3000, -3000, 50 );
    this.scene.add( plight );

    let plight2 = new THREE.PointLight( 0xffffff, 1, 10000 );
    plight2.position.set( 2000, 2000, 1000 );
    this.scene.add( plight2 );

    let plight3 = new THREE.PointLight( 0xffffff, 1, 7000 );
    plight3.position.set( 0, -2000, -3000 );
    this.scene.add( plight3 );


    var gridHelper = new THREE.GridHelper( 100, 10 );        
    //this.scene.add( gridHelper );

    let executed = this.executed = ExecutedData

    executed.forEach((e,i) => {

          let texture = THREE.ImageUtils.loadTexture(e.img)
          texture.minFilter = THREE.LinearFilter
          /*let img = new THREE.MeshBasicMaterial({ 
              map: texture,
              color: 0xffffff,
              side: THREE.DoubleSide,
          });*/
          let mat = new THREE.ShaderMaterial( { 
              uniforms: {
                resolution: { type: "v2", value: new THREE.Vector2(window.innerWidth,window.innerHeight) },
                time: { type: "f", value: 0.1 },
                showCurrent: { type: "f", value: this.showCurrent},
                numberCurrents: { type: "f", value: this.numberCurrents},
                bgImg: { type: "t", value: texture }
              },
              side: THREE.DoubleSide,
              transparent: true,
              fragmentShader: glslify(__dirname + '/glsl/Executed.frag'),
              vertexShader: glslify(__dirname + '/glsl/Executed.vert')
          } );


          let geom = new THREE.PlaneBufferGeometry(200, 200)

          // plane
          var plane = new THREE.Mesh(geom, mat);
          plane.overdraw = true;


          plane.visible = false
          plane.userData = e

          this.scene.add(plane);

          this.objects.push(plane)

    })


        var vector = new THREE.Vector3();

        // sphere
        for ( var i = 0, l = executed.length; i < l; i ++ ) {

          var phi = Math.acos( -1 + ( 2 * i ) / l );
          var theta = Math.sqrt( l * Math.PI ) * phi;

          var object = new THREE.Object3D();

          object.position.x = SPHERE_SIZE * Math.cos( theta ) * Math.sin( phi );
          object.position.y = SPHERE_SIZE * Math.sin( theta ) * Math.sin( phi );
          object.position.z = SPHERE_SIZE * Math.cos( phi );

          vector.copy( object.position ).multiplyScalar( 2 );

          object.lookAt( vector );

          this.targets.sphere.push( object );

        }

            // grid

        for ( var i = 0; i < executed.length; i ++ ) {

          var object = new THREE.Object3D();

          object.position.x = ( ( i % 5 ) * 400 ) - 800;
          object.position.y = ( - ( Math.floor( i / 5 ) % 5 ) * 400 ) + 800;
          object.position.z = ( Math.floor( i / 25 ) ) * 1000 - 2000;

          this.targets.grid.push( object );

        }

        this.camera.target = executed[0]
  }


  resetCamera() {
    this.clearTexts()
    new TWEEN.Tween(this.camera.position).to({
          x: CAMERA_POS.x,
          y: CAMERA_POS.y,
          z: CAMERA_POS.z
      }, this.transition).easing(TWEEN.Easing.Linear.None)
    .onUpdate(() => {
      this.camera.lookAt(new THREE.Vector3())
      }).start();

  }


  lookAt(e) 
  {

        //this.camera.rotation.copy(e.rotation)
    let vector = new THREE.Vector3()
    if (this.targetView === 'sphere') {
      vector.copy( e.position ).multiplyScalar( 1.2 );
    } else if (this.targetView === 'grid') {
      vector.copy( e.position )
      vector.z -= 400
    }


    // move to vector
         new TWEEN.Tween( this.camera.position )
            .to( { x: vector.x, y: vector.y, z: vector.z }, this.transition )
            .easing( TWEEN.Easing.Exponential.InOut )
            .onUpdate(() => {
          this.camera.lookAt(this.camera.target);
      }).onComplete(() => {
          this.camera.lookAt(this.camera.target);
      })
                  .start();


       new TWEEN.Tween(this.camera.target).to({
          x: e.position.x,
          y: e.position.y,
          z: e.position.z
      }, this.transition).easing(TWEEN.Easing.Linear.None).onUpdate(() => {
      }).onComplete(() => {
          //this.camera.lookAt(e.position);
      }).start();


      let d = e.userData

      this.text.name.innerHTML = d.name + " (" + d.age + ")"
      this.text.date.innerHTML = d.date
      Velocity(this.text.name, "fadeIn", this.transition/2 )
      Velocity(this.text.date, "fadeIn", this.transition/2 )
  }

  lookAtNext() 
  {
    this.currentIdx++
    let e = this.objects[this.currentIdx % this.objects.length]
    this.lookAt(e)

  }

  lookAtRnd() 
  {
    this.currentIdx = Math.floor(Math.random() * this.objects.length)
    let e = this.objects[this.currentIdx]

    this.lookAt(e)
  }

  doGrid() 
  {
    this.targetView = 'grid'
    this.transform( this.targets.grid, 2000 );
  }

  doSphere() {
    this.targetView = 'sphere'
    this.transform( this.targets.sphere, 2000 );
  }

  doRandom() {
    this.targetView = 'random'

    this.targets.random = []

        for ( var i = 0; i < this.executed.length; i ++ ) {

          var object = new THREE.Object3D();

          object.position.x = Math.random() * 4000 - 2000;
          object.position.y = Math.random() * 4000 - 2000;
          object.position.z = Math.random() * 4000 - 2000;


          this.targets.random.push( object );

        }

    this.transform( this.targets.random, 2000 );
  }

  doVisible() {

    this.objects.forEach((m) => {
      m.visible = !m.visible
    })

  }

  transform( targets, duration ) {


        for ( var i = 0; i < this.objects.length; i ++ ) {

          var object = this.objects[ i ];
          var target = targets[ i ];
        
          new TWEEN.Tween( object.position )
            .to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();

          new TWEEN.Tween( object.rotation )
            .to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
            

        }    

      }

        clearScene() {
    // from behind because of index change
    for( let i = this.scene.children.length - 1; i >= 0; i--) {
      this.scene.remove(this.scene.children[i])
     }
    var gridHelper = new THREE.GridHelper( 100, 10 );        
    this.scene.add( gridHelper );

    //this.update()
  }

  update()
  {
    this.stats.begin();

    //this.controls.update( this.clock.getDelta() );
    TWEEN.update();
    this.renderer.render(this.scene, this.camera);

    //this.executed
    /*
    this.objects.forEach((e, i) => {
      if (i !== this.currentIdx) {
        e.material.uniforms.time.value += this.clock.getDelta();
       // e.material.uniforms.showCurrent.value = 0
       // e.material.uniforms.numberCurrents.value = 0
      }
    })    */
    let e = this.objects[this.currentIdx % this.objects.length]
    if (e) {
      e.material.uniforms.time.value += this.clock.getDelta();
      e.material.uniforms.showCurrent.value = this.current.show 
      e.material.uniforms.numberCurrents.value = this.current.number
    }

    // Rotate particles
    this.shaderTime += 0.1
    if (this.particleSystem) {
      let shaderTime = this.clock.getDelta()
      this.particleSystem.rotation.x = -this.shaderTime * 0.002;
      this.particleSystem.rotation.y = -this.shaderTime * 0.002;
      this.particleSystem.rotation.z = Math.PI - this.shaderTime * 0.004;
    }


    this.stats.end()
    requestAnimationFrame(this.update.bind(this));
  }

  onResize()
  {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  addScheduled() {
    this.currentIdx = 0
    this.scheduled = []

    ScheduledData.forEach(s => {
      console.log(s)
      let texture = THREE.ImageUtils.loadTexture( s.img )
      texture.minFilter = THREE.LinearFilter

      this._getImgData(s.img).then((imgData => {
        this.scheduled.push({img: texture, imgData: imgData})  
      }))
      
    })
  }

  nextScheduled() {
    

  this.currentIdx++


    let rt = new TWEEN.Tween(this.camera.rotation).to({
          x: 0,
          y: this.camera.rotation.y + Math.PI,
          z: 0
      }, 5 * 1000 ).easing(TWEEN.Easing.Linear.None).
    onComplete(() => {
      this.clearScene()
      this.drawScheduled()
    })

    let ft = new TWEEN.Tween(this.camera.position).to({
          x: 0,
          y: 0,
          z: this.camera.position.z * -1
      }, 10 * 1000 ).easing(TWEEN.Easing.Linear.None)

    rt.chain(ft)
    //rt.start()

    this.drawScheduledText()
  }

  drawScheduled() {
    
    
    let particleImg = THREE.ImageUtils.loadTexture( 'assets/Executed/particle.png' )

    var particleShader = THREE.ParticleShader;
    var particleUniforms = THREE.UniformsUtils.clone(particleShader.uniforms);
    particleUniforms.texture.value = particleImg;
    particleUniforms.fog.value = 1;


    var particleMaterial = new THREE.ShaderMaterial({

      uniforms: particleUniforms,
      vertexShader: particleShader.vertexShader,
      fragmentShader: particleShader.fragmentShader,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true
    });

    let geometry = new THREE.BufferGeometry();

    var positions = new Float32Array(NUM_PARTICLES * 3);
    var colors = new Float32Array(NUM_PARTICLES * 3);
    var sizes = new Float32Array(NUM_PARTICLES);

    var color = new THREE.Color();
    // Get particle positions based on non-black image pixels


    let imgData = this.scheduled[this.currentIdx % this.scheduled.length ].imgData

    let imageScale = 25,
      zSpread = 200


    for (var i = 0, i3 = 0; i < NUM_PARTICLES; i++ , i3 += 3) {

      var position = new THREE.Vector3(
        MathF.random(-MAX_PARTICLE_DIST, MAX_PARTICLE_DIST), 
        MathF.random(-MAX_PARTICLE_DIST, MAX_PARTICLE_DIST), 
        MathF.random(-MAX_PARTICLE_DIST, MAX_PARTICLE_DIST)
      );

      var gotIt = false;

        // Randomly select a pixel
        var x = Math.round(imgData.width * Math.random());
        var y = Math.round(imgData.height * Math.random());
        var bw = this._getPixel(imgData, x, y);
        
        // Read color from pixel
        if (bw == 1) {
          // If black, get position
          
          position = new THREE.Vector3(
            (imgData.width / 2 - x) * imageScale, 
            (y - imgData.height / 2) * imageScale, 
            Math.random() * zSpread * 2 - Math.random() * zSpread
          );
        }
      // Position
      positions[i3 + 0] = position.x;
      positions[i3 + 1] = position.y;
      positions[i3 + 2] = position.z;

      // Color
      color.setRGB(1, 1, 1);
      colors[i3 + 0] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      // Size
      sizes[i] = 20;

    }

    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.particleSystem = new THREE.Points(geometry, particleMaterial);

    this.scene.add(this.particleSystem);
  }

  drawScheduledText() {

    let particleImg = THREE.ImageUtils.loadTexture( 'assets/Executed/particle.png' )

    var particleShader = THREE.ParticleShader;
    var particleUniforms = THREE.UniformsUtils.clone(particleShader.uniforms);
    particleUniforms.texture.value = particleImg;
    particleUniforms.fog.value = 1;


    var particleMaterial = new THREE.ShaderMaterial({

      uniforms: particleUniforms,
      vertexShader: particleShader.vertexShader,
      fragmentShader: particleShader.fragmentShader,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true
    });

    var textGeo = new THREE.TextGeometry("asdf");
    const particleCount = 50000

    let points = THREE.GeometryUtils.randomPointsInGeometry( textGeo, particleCount );
    console.log(points)

        let data = new Float32Array( particleCount * 3 );

        var colors = new Float32Array(NUM_PARTICLES * 3);
        
          for ( var i = 0, j = 0, l = data.length; i < l; i += 3, j += 1 ) {
            data[ i ] = points[ j ].x;
            data[ i + 1 ] = points[ j ].y;
            data[ i + 2 ] = points[ j ].z;
            //data[ i + 3 ] = 0.0;

            colors[i + 0] = 0.5;
            colors[i + 1] = 1.0;
            colors[i + 2] = 0.2;
          }

          var velData = new Float32Array( particleCount * 4 );
          for ( var i = 0, l = velData.length; i < l; i += 4 ) {
            velData[ i ] = (Math.random() - 0.5) * 0.004;
            velData[ i + 1 ] = (Math.random() - 0.5) * 0.004;
            velData[ i + 2 ] = (Math.random() - 0.5) * 0.004;
            velData[ i + 3 ] = 0.0;
          }
          var randomSeedData = new Uint32Array( particleCount );
          for ( var i = 0; i < randomSeedData.length; ++i ) {
            randomSeedData[ i ] = Math.random() * 2147483647;
          }

          let sizes = new Float32Array( particleCount );
          for ( var i = 0; i < randomSeedData.length; ++i ) {
            sizes[i] = 20
          }

          let geometry = new THREE.BufferGeometry();
          geometry.addAttribute( 'position', new THREE.BufferAttribute( data, 3 ) );
          //geometry.addAttribute( 'velocity', new THREE.BufferAttribute( velData, 4 ) );
          //geometry.addAttribute( 'randomSeed', new THREE.BufferAttribute( randomSeedData, 1, false, true ) );
          geometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
          geometry.addAttribute( 'size', new THREE.BufferAttribute( colors, 3) );

    var dot = new THREE.Points( geometry, particleMaterial );
    this.scene.add( dot );
  }

  _getPixel(imgData, x, y) {
    var r, g, b, a, offset = x * 4 + y * 4 * imgData.width;
    r = imgData.data[offset];
    g = imgData.data[offset + 1];
    b = imgData.data[offset + 2];
    a = imgData.data[offset + 3];

    let avg = (r + g + b) / 3

    return Math.floor(avg / (256 / 3))

  }

  _getImgData(pic) {
    

    return new Promise(function (fulfill, reject){

      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      var image = new Image();
      image.src = pic;
      image.onload = function() {

        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
        fulfill(imgData)
      }

    })
    
  }
}

export default Demo;