import THREE from 'three.js'; 
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import MathF from 'utils-perf'

const OrbitControls = require('three-orbit-controls')(THREE);

const NR_MESHES = 3000
const TOP = 300


class Demo {
  constructor(args) 
  {

    this.fallingSpeed = 10
    this.meshes = []

    this.counter = 0

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
    this.addLights()

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
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 15000 );
    this.camera.position.set(0, 45, 240);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxDistance = 500;

    this.scene = new THREE.Scene();
  }

  addObjects()
  {
    var gridHelper = new THREE.GridHelper( 100, 10 );        
    this.scene.add( gridHelper );


      var s = 250;

        var cube = new THREE.BoxGeometry( s, s, s );
        var material = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0xffffff, shininess: 50 } );


        for ( var i = 0; i < NR_MESHES; i ++ ) {

          var mesh = new THREE.Mesh( cube, material );

          mesh.position.x = 8000 * ( 2.0 * Math.random() - 1.0 );
          mesh.position.y = 8000 * ( 2.0 * Math.random() - 1.0 );
          mesh.position.z = 8000 * ( 2.0 * Math.random() - 1.0 );

          mesh.rotation.x = Math.random() * Math.PI;
          mesh.rotation.y = Math.random() * Math.PI;
          mesh.rotation.z = Math.random() * Math.PI;

          mesh._rotSpeed = Math.random() * 80 + 20
          mesh._fallingSpeed = Math.random()

          this.scene.add( mesh );
          this.meshes.push( mesh)

        }

  }
  addLights() {
// lights

        var dirLight = new THREE.DirectionalLight( 0xffffff, 0.05 );
        dirLight.position.set( 0, -1, 0 ).normalize();
        this.scene.add( dirLight );

        dirLight.color.setHSL( 0.1, 0.7, 0.5 );


        this.addLight( 0.55, 0.9, 0.5, 5000, 0, -1000 );
        this.addLight( 0.08, 0.8, 0.5,    0, 0, -1000 );
        this.addLight( 0.995, 0.5, 0.9, 5000, 5000, -1000 );
  }

  addLight(h, s, l, x, y, z) {
    var light = new THREE.PointLight( 0xffffff, 1.5, 2000 );
          light.color.setHSL( h, s, l );
          light.position.set( x, y, z );
          this.scene.add( light );
  }

  startGUI()
  {
    var gui = new dat.GUI()
    gui.add(this, 'fallingSpeed', 10, 1000)
    // gui.add(camera.position, 'y', 0, 400)
    // gui.add(camera.position, 'z', 0, 400)
  }

  animate() {
    this.counter++

    this.meshes.forEach((m) => {
      /*
      m.rotation.x = (this.counter / m._rotSpeed) % (Math.PI*4)
      m.rotation.y = (this.counter / m._rotSpeed) % (Math.PI*4)
      m.rotation.z = (this.counter / m._rotSpeed) % (Math.PI*4)
*/
      m.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), this.counter / m._rotSpeed );

      m.position.y -= m._fallingSpeed * this.fallingSpeed;
      if (m.position.y < -TOP) {
        m.position.y = TOP
      }
    })

  }

  update()
  {
    this.stats.begin();

    var delta = this.clock.getDelta();

    this.animate()

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