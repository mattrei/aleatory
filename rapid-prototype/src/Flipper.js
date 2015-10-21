import THREE from 'three.js'; 
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import MathF from  'utils-perf'

const OrbitControls = require('three-orbit-controls')(THREE);

class Demo {
  constructor(args) 
  {
    this.startStats();
    this.startGUI();

    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.counter  = 0;
    this.clock    = new THREE.Clock();

    this.counter = 0
    this.line = null

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
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 4000 );
    this.camera.position.set(0, 45, 240);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxDistance = 500;

    this.scene = new THREE.Scene();
  }

  addObjects()
  {
    var gridHelper = new THREE.GridHelper( 100, 10 );        
    this.scene.add( gridHelper );

    var geometry = new THREE.Geometry(),
    material =  new THREE.LineBasicMaterial({color: 0x9f9f9f})
    //geometry.vertices.push(new THREE.Vector3(0, 0, 0));
    //geometry.vertices.push(new THREE.Vector3(50, 50, 0));
            this.line = new THREE.Line(geometry,material);
            this.scene.add( this.line );  

/*
            // using TweenLite to animate
            var tl = new TimelineLite();          
            var target = { x: 0, y: 0, z:0 };
            line.geometry.verticesNeedUpdate = true;
            tl.add(TweenLite.to(line.geometry.vertices[1] , 1, target));
            tl.play(); 
            */
  }

  startGUI()
  {
    // var gui = new dat.GUI()
    // gui.add(camera.position, 'x', 0, 400)
    // gui.add(camera.position, 'y', 0, 400)
    // gui.add(camera.position, 'z', 0, 400)
  }
  animate() 
  {

    this.counter += 1

    var obj_resolution =100;
    let center = new THREE.Vector2(0, 0)
    for(let i=0; i<obj_resolution; i++) {
      //let dist = new THREE.Vector2(geo.x, geo.y).sub(center)

      let x = i / 80,
        y = Math.sin(i + this.counter / 100) * 20,
        z = 0

      
      this.line.geometry.vertices.push(new THREE.Vector3(x, y, z));
    }
    this.line.geometry.verticesNeedUpdate = true
  }

  update()
  {
    this.stats.begin();

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