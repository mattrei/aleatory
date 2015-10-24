import THREE from 'three.js'; 
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import MathF from 'utils-perf'
import tweenr from 'tweenr'
import TWEEN from 'tween.js'

import ExecutedData from './test_data/executed.json'

const Tweenr = tweenr()

const OrbitControls = require('three-orbit-controls')(THREE);

const SPHERE_SIZE = 1500

class Demo {
  constructor(args) 
  {

    this.targetView = 'random'

    this.objects = []
    this.targets = { table: [], sphere: [], helix: [], grid: [], random: [] };
    this.executed = []

    this.startStats();
    this.startGUI();

    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.counter  = 0;
    this.clock    = new THREE.Clock();

    this.createRender();
    this.createScene();
    this.addObjects();

    this.onResize();
    this.update();
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
    this.camera.position.set(0, 45, 12240);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    //this.controls.maxDistance = 500;

    this.scene = new THREE.Scene();
  }

  addObjects()
  {
    var gridHelper = new THREE.GridHelper( 100, 10 );        
    this.scene.add( gridHelper );

    let executed = this.executed = ExecutedData

    executed.forEach((e,i) => {

          let img = new THREE.MeshBasicMaterial({ 
              map:THREE.ImageUtils.loadTexture(e.img),
              color: 0xffffff,
              side: THREE.DoubleSide,
          });
          img.minFilter = THREE.LinearFilter
          //img.map.needsUpdate = true; //ADDED

          // plane
          var plane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200),img);
          plane.overdraw = true;

/*          
          plane.position.x = ( ( i % 5 ) * 400 ) - 800;
          plane.position.y = ( - ( Math.floor( i / 5 ) % 5 ) * 400 ) + 800;
          plane.position.z = ( Math.floor( i / 25 ) ) * 1000 - 2000;
*/
          plane.position.x = Math.random() * 4000 - 2000;
          plane.position.y = Math.random() * 4000 - 2000;
          plane.position.z = Math.random() * 4000 - 2000;


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
  }

  startGUI()
  {
    var gui = new dat.GUI()
    gui.add(this, 'doGrid')
    gui.add(this, 'doSphere')
    gui.add(this, 'doRandom')
    gui.add(this, 'lookAtRnd')
    // gui.add(camera.position, 'y', 0, 400)
    // gui.add(camera.position, 'z', 0, 400)
  }

  lookAtRnd() 
  {
    let e = this.objects[Math.floor(Math.random() * this.objects.length)]

    
    //this.camera.rotation.copy(e.rotation)
    let vector = new THREE.Vector3()
    if (this.targetView === 'sphere') {
      vector.copy( e.position ).multiplyScalar( 1.2 );
    } else if (this.targetView === 'grid') {
      vector.copy( e.position )
      vector.z -= 400
    }

    console.log(e.position)
    console.log(vector)
    this.camera.target = e.position.clone()
    //this.camera.position.copy(vector)
    //this.camera.lookAt(e.position)


         new TWEEN.Tween( this.camera.position )
            .to( { x: vector.x, y: vector.y, z: vector.z }, 2000 )
            .easing( TWEEN.Easing.Exponential.InOut )
            .onUpdate(() => {
    this.camera.lookAt(this.camera.target);
}).onComplete(() => {
    this.camera.lookAt(e.position);
})
            .start();


 new TWEEN.Tween(this.camera.target).to({
    x: e.position.x,
    y: e.position.y,
    z: 0
}).easing(TWEEN.Easing.Linear.None).onUpdate(() => {
}).onComplete(() => {
    this.camera.lookAt(e.position);
}).start();

/*
    console.log(e.scale)
    console.log(e.rotation)
    console.log(e.position)
    console.log(e.matrix)

    var matrix = new THREE.Matrix4();
    matrix.extractRotation( e.matrix );

    var direction = new THREE.Vector3( 0, 0, 1 );
    direction = matrix.multiplyVector3( direction );
    console.log(direction)

    var normalMatrix = new THREE.Matrix3().getNormalMatrix( e.matrixWorld );

    var worldNormal = direction.clone().applyMatrix3( normalMatrix ).normalize();
    console.log(worldNormal)
    */
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

  transform( targets, duration ) {


        for ( var i = 0; i < this.objects.length; i ++ ) {

          var object = this.objects[ i ];
          var target = targets[ i ];
        
        /*
          Tweenr.to(object.position, {
            x: target.position.x,
            y: target.position.y,
            z: target.position.z,
            duration: Math.random() * duration + duration
          })


          Tweenr.to(object.rotation, {
            x: target.rotation.x,
            y: target.rotation.y,
            z: target.rotation.z,
            duration: Math.random() * duration + duration
          })
          */



          new TWEEN.Tween( object.position )
            .to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();

          new TWEEN.Tween( object.rotation )
            .to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
            

        }

/*
        new TWEEN.Tween( this )
          .to( {}, duration * 2 )
    //      .onUpdate( this.update )
          .start();
  */        

      }

  update()
  {
    this.stats.begin();

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