import THREE from 'three.js'; 
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import CANNON from 'cannon'


const OrbitControls = require('three-orbit-controls')(THREE);


class Demo {
  constructor(args) 
  {

    this.dices = 200

    this.meshes = []
    this.bodies = []

    this.startStats();
    this.startGUI();



    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.counter  = 0;
    this.clock    = new THREE.Clock();

    this.world = null

    this.createRender();
    this.createScene();
    this.addObjects();
    this.initCannon()

    this.onResize();
    this.update();
  }
  initCannon() {
    // Setup our world
    this.world = new CANNON.World();
            this.world.quatNormalizeSkip = 0;
            this.world.quatNormalizeFast = false;

            this.world.gravity.set(0,-10,0);
            this.world.broadphase = new CANNON.NaiveBroadphase();

            // Create a plane
            let groundShape = new CANNON.Plane(),
              groundBody = new CANNON.Body({ mass: 0 });
            groundBody.addShape(groundShape);
            groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
            this.world.add(groundBody);
            //this.bodies.push(groundBody)
  }

  initCannonDices()
  {
                // Create N cubes
                let shape = new CANNON.Box(new CANNON.Vec3(0.5,0.5,0.5));
                for(let i=0; i < this.dices; i++){
                    let body = new CANNON.Body({ mass: 1 });
                    body.addShape(shape);
                    body.position.set(Math.random()-0.5,2.5*i+0.5,Math.random()-0.5);
                    body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 1, 1), Math.random() * Math.PI * 2)

                    this.world.add(body);
                    this.bodies.push(body)
                }
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
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 4000 );
    this.camera.position.set(0, 45, 50);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxDistance = 500;

    this.scene = new THREE.Scene();
  }

  addObjects()
  {
    var gridHelper = new THREE.GridHelper( 100, 10 );        
    this.scene.add( gridHelper );


    // lights
            var light, materials;
            this.scene.add( new THREE.AmbientLight( 0x666666 ) );

            light = new THREE.DirectionalLight( 0xffffff, 1.75 );
            var d = 20;

            light.position.set( d, d, d );

            light.castShadow = true;
            this.scene.add(light)


              // floor
            let geometry = new THREE.PlaneBufferGeometry( 100, 100, 1, 1 ),
              material = new THREE.MeshLambertMaterial( { color: 0xff7777 } );
            //geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
            let mesh = new THREE.Mesh( geometry, material );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            //this.meshes.push(mesh);
            mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI / 2);
            this.scene.add(mesh)




  }

  addDices() {
                // cubes
            let cubeGeo = new THREE.BoxGeometry( 1, 1, 1, 10, 10 ),
              cubeMaterial = new THREE.MeshPhongMaterial( { color: 0x888888 } );


            cubeMaterial = new THREE.MeshFaceMaterial([
            new THREE.MeshBasicMaterial({
              map: THREE.ImageUtils.loadTexture('/assets/img/dice/2.png')
            }),
            new THREE.MeshBasicMaterial({
              map: THREE.ImageUtils.loadTexture('/assets/img/dice/5.png')
            }),
            new THREE.MeshBasicMaterial({
              map: THREE.ImageUtils.loadTexture('/assets/img/dice/1.png')
            }),
            new THREE.MeshBasicMaterial({
              map: THREE.ImageUtils.loadTexture('/assets/img/dice/6.png')
            }),
            new THREE.MeshBasicMaterial({
              map: THREE.ImageUtils.loadTexture('/assets/img/dice/3.png')
            }),
            new THREE.MeshBasicMaterial({
              map: THREE.ImageUtils.loadTexture('/assets/img/dice/4.png')
            }),
          ])

            for(var i=0; i<this.dices; i++){
                let cubeMesh = new THREE.Mesh( cubeGeo, cubeMaterial );
                cubeMesh.castShadow = true;
                this.meshes.push(cubeMesh);
                this.scene.add( cubeMesh );
            }
  }

  rollDices() {
    for( let i = this.meshes.length - 1; i >= 0; i--) {
      this.scene.remove(this.meshes[i])
     }
     this.meshes = []

     for( let i = this.bodies.length - 1; i >= 0; i--) {
      this.world.remove(this.bodies[i])
     }
     this.bodies = []

     this.initCannonDices()
     this.addDices()
  }

  startGUI()
  {
    var gui = new dat.GUI()
    gui.add(this, 'rollDices')
    gui.add(this, 'dices', 1, 400).step(1)
    // gui.add(camera.position, 'z', 0, 400)
  }

  updatePhysics(dt) {
    //console.log(dt + " " + 1/60)

            this.world.step(1/60);
            for(let i=0; i < this.meshes.length; i++){
                this.meshes[i].position.copy(this.bodies[i].position);
                this.meshes[i].quaternion.copy(this.bodies[i].quaternion);
            }
        }

  update()
  {
    this.stats.begin();

    let dt = this.clock.getDelta()
    this.updatePhysics(dt)

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