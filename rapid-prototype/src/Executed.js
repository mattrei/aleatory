import THREE from 'three.js'; 
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import MathF from 'utils-perf'
import tweenr from 'tweenr'
import TWEEN from 'tween.js'

import ExecutedData from './test_data/executed.json'

import NoMousePersonControls from './controls/NoMousePersonControls'

const Tweenr = tweenr()

const OrbitControls = require('three-orbit-controls')(THREE);

//global.jQuery = require('jquery');
//require('blast-text')
const Velocity = require('velocity-animate')
require('velocity-animate/velocity.ui')

const SPHERE_SIZE = 1500



const CAMERA_POS = {x: 0, y:0, z:7000}

class Demo {
  constructor(args) 
  {

    this.text = {name: null, date: null, intro: null}
    this.introText = ''

    this.targetView = 'grid'

    this.objects = []
    this.targets = { table: [], sphere: [], helix: [], grid: [], random: [] };
    this.executed = []
    this.meshes = []

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
    this.addObjects();

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

    gui.add(this, 'introText')
    gui.add(this, 'updateIntroText')
    gui.add(this, 'clearTexts')
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
  }

  addObjects()
  {
    var gridHelper = new THREE.GridHelper( 100, 10 );        
    //this.scene.add( gridHelper );

    let executed = this.executed = ExecutedData

    executed.forEach((e,i) => {

          let texture = THREE.ImageUtils.loadTexture(e.img)
          texture.minFilter = THREE.LinearFilter
          let img = new THREE.MeshBasicMaterial({ 
              map: texture,
              color: 0xffffff,
              side: THREE.DoubleSide,
          });

          // plane
          var plane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200),img);
          plane.overdraw = true;


          plane.visible = false
          plane.userData = e
          this.meshes.push(plane)

          this.scene.add(plane);

          this.objects.push(plane)

    })


        var vector = new THREE.Vector3();

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
    clearTexts()
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


      console.log(e.userData)
      let d = e.userData

      this.text.name.innerHTML = d.name + " (" + d.age + ")"
      this.text.date.innerHTML = d.date
      Velocity(this.text.name, "fadeIn", this.transition/2 )
      Velocity(this.text.date, "fadeIn", this.transition/2 )
  }

  lookAtNext() 
  {
    let e = this.objects[this.currentIdx++ % this.objects.length]
    this.lookAt(e)

  }

  lookAtRnd() 
  {
    let e = this.objects[Math.floor(Math.random() * this.objects.length)]

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

    this.meshes.forEach((m) => {
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

  update()
  {
    this.stats.begin();

    //this.controls.update( this.clock.getDelta() );
    TWEEN.update();
    this.renderer.render(this.scene, this.camera);

    this.stats.end()
    requestAnimationFrame(this.update.bind(this));
  }

  onResize()
  {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}

export default Demo;