
import THREE from 'three'; 
import OC    from 'three-orbit-controls';
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import ExplodeModifier from './ExplodeModifier'
import TWEEN from 'tween.js'
import Tweenr from 'tweenr'
var tweenr = Tweenr()
import TweenMax from 'gsap'

class Shatter {
  constructor(args) 
  {
    this.startStats();
    this.startGUI();

    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.counter  = 0;

    this.createRender();
    this.createScene();
    this.addObjects();

    this.onResize();
    this.update();

    this.shatter()
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
    const OrbitControls = OC(THREE);

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


    var geometry = new THREE.SphereGeometry(35, 32, 32); // create plane
    var material = new THREE.MeshBasicMaterial( { color: 0xB20000, wireframe: false});
    geometry.dynamic = true
    material.side = THREE.DoubleSide;

    this.globe = new THREE.Mesh( geometry, material );
    this.scene.add( this.globe );

    var explodeModifier = new THREE.ExplodeModifier();
    explodeModifier.modify( geometry );

  }

  shatter() {
    /*
    var geometry = new THREE.BoxGeometry(50, 50, 50); // create plane
    var material = new THREE.MeshBasicMaterial( { color: 0xB20000, wireframe: true});
    geometry.dynamic = true

    var mesh = new THREE.Mesh( geometry, material );
    this.scene.add( mesh );
*/
    //            TWEEN.removeAll(); 

                var geometry = this.globe.geometry

   
                for(var i = 0; i < (geometry.vertices.length); i++)
                {
                    //TWEEN.removeAll();

                    var pos = new THREE.Vector3();
                    var v = geometry.vertices[i]

                    var final = (Math.random() * 100) + 500;

                    pos.x = final * v.x;
                    pos.y = final * v.y;
                    pos.z = final * v.z;


                    new TWEEN.Tween(geometry.vertices[i])
                    .to( { x: pos.x, y: pos.y, z: pos.z }, 12000 )
                    .easing( TWEEN.Easing.Exponential.InOut )
                    .onUpdate( function() { geometry.verticesNeedUpdate = true })
                    .start();
                    

/*
                    console.log(geometry.vertices[i])
                    TweenMax.to(geometry.vertices[i], 
                      1, 
                      { x: pos.x, y: pos.y, z: pos.z },
                      onUpdate: updateVertice)
*/
/*
                    tweenr.to(geometry.vertices[i], { 
                      x: pos.x, 
                      y: pos.y, 
                      z: pos.z, 
                      ease: 'exponential-in-out', 
                      duration: 6 //in seconds  
                    })
*/

                    
                }

            };

  startGUI()
  {
    // var gui = new dat.GUI()
    // gui.add(camera.position, 'x', 0, 400)
    // gui.add(camera.position, 'y', 0, 400)
    // gui.add(camera.position, 'z', 0, 400)
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

export default Shatter;
