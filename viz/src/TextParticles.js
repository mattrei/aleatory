
import THREE from 'three.js'
import OC    from 'three-orbit-controls';
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import TWEEN from 'tween.js'
import TWEENR from 'tweenr'
const tweenr = TWEENR()

import typeface from 'three.regular.helvetiker'
THREE.typeface_js.loadFace(typeface);

import SPE from './ShaderParticleEngine/SPE'
const ExplodeModifier = require('./modifiers/ExplodeModifier')(THREE)
const TessellateModifier = require('./modifiers/TessellateModifier')(THREE)
const SubdivisionModifier = require('./modifiers/SubdivisionModifier')(THREE)

class TextParticle {
  constructor(args) 
  {
    this.text = 'aleatory'
    this.startStats();
    this.startGUI();

    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.counter  = 0;
    this.clock    = new THREE.Clock();
    this.particleGroup = null
    this.emitter = null

    this.createRender();
    this.createScene();
    this.initParticles()
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
    const OrbitControls = OC(THREE);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 4000 );
    this.camera.position.set(0, 45, 240);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxDistance = 500;

    this.scene = new THREE.Scene();
  }

      initParticles() {
        
          this.particleGroup = new SPE.Group({
            texture: {
              value: THREE.ImageUtils.loadTexture('./assets/spe/smokeparticle.png')
            },
            blending: THREE.AdditiveBlending,
            maxAge: 3
          });
          this.scene.add( this.particleGroup.mesh );
        }

  addObjects()
  {
    var gridHelper = new THREE.GridHelper( 100, 10 );        
    this.scene.add( gridHelper );


    let geometry = new THREE.TextGeometry( this.text, {

        size: 40,
        height: 5,
        curveSegments: 3,

        font: "helvetiker",
        weight: "normal",
        style: "normal",

        bevelThickness: 2,
        bevelSize: 1,
        bevelEnabled: true

      });

      
      let shapes = THREE.FontUtils.generateShapes( this.text, {
        font: "helvetiker",
        weight: "normal",
        size: 40
      } );
      let geom = new THREE.ShapeGeometry( shapes );
      let mat = new THREE.MeshNormalMaterial();
      let mesh = new THREE.Mesh( geom, mat );
      geom.center()
      this.scene.add(mesh)

      var tessellateModifier = new THREE.TessellateModifier( 8 );
      for ( var i = 0; i < 10; i ++ ) {
        tessellateModifier.modify( geom );
      }

      //var modifier = new THREE.SubdivisionModifier( 1 );
      //modifier.modify(geom)
      
      //let particles = new THREE.PointCloud( geometry, 
      //  new THREE.PointCloudMaterial( { color: 0xff0000, size:2 } ) );
      //this.scene.add( particles );


      const emitterSettings = {
        maxAge: {
                    value: 2
                },
            
            acceleration: {
                    value: new THREE.Vector3(0, -5, 0),
                    spread: new THREE.Vector3( 5, 0, 5 )
                },
            velocity: {
                    value: new THREE.Vector3(0, 10, 0)
                    //spread: new THREE.Vector3(10, 7.5, 10)
                },
                color: {
                    value: [ new THREE.Color('white'), new THREE.Color('red') ]
                },
                size: {
                    value: 10
                },
            particleCount: 20
      }



      let ts = []
      for(var i = 0; i < (geom.vertices.length); i++)
      {


                    var pos = new THREE.Vector3();
                    var v = geom.vertices[i]


                    //this.emitter.position = 
                    //  this.emitter.position.set( v.x, v.y, v.z );

                    if (i % 1 == 0) {
                      /*
                    let e = new SPE.Emitter({position: 
                      new THREE.Vector3(Math.random() * 300, Math.random() * 300, Math.random() * 300),
                      acceleration: new THREE.Vector3(0, -5, 0),
                        accelerationSpread: new THREE.Vector3(5, 0, 5),
                        velocity: new THREE.Vector3(0, 10, 0),
                    colorStart: (new THREE.Color()).setRGB(0.5, 0.5, 0.5),
                        colorStartSpread: new THREE.Vector3(1, 1, 1),
                    colorEnd: new THREE.Color('white'),
                      sizeStart: 10,
                      sizeEnd: 5,
                      particleCount: 20

                    })*/
                    let s = emitterSettings
                    s.position = {value: new THREE.Vector3(Math.random() * 300, Math.random() * 300, Math.random() * 300),
                      spread: new THREE.Vector3(0,0,0)}
                    let e = new SPE.Emitter(s)
                    this.particleGroup.addEmitter( e );

/*
                    tweenr.to(e.position, { 
                      x: v.x, y: v.y, z: v.z, 
                      duration: 3,
                      ease: "expoInOut"
                    })*/
                    
                    let tween = new TWEEN.Tween(e.position)
                    .to( { x: v.x, y: v.y, z: v.z }, 3000 )
                    .easing( TWEEN.Easing.Exponential.InOut )
                    .onUpdate( () => { geom.verticesNeedUpdate = true })
                    .start();
                  

                  }

  
                    
                    
                }

      //let timeline = new TWEEN.Timeline(ts)
      //timeline.start()

  }

  startGUI()
  {
    var gui = new dat.GUI()
    gui.add(this, 'text')
    gui.add(this, 'doText')
    gui.add(this, 'doRandom')
  }

  doText() {
    console.log(this.particleGroup)
    this.particleGroup.emitters.forEach(e => {
      e.position = new THREE.Vector3(Math.random() * 300, Math.random() * 300, Math.random() * 300)
    })
  }
  doRandom() {
    this.particleGroup.emitters.forEach(e => {
      e.position = new THREE.Vector3(Math.random() * 300, Math.random() * 300, Math.random() * 300)
      new TWEEN.Tween(e.position)
                    .to( { x: v.x, y: v.y, z: v.z }, 3000 )
                    .easing( TWEEN.Easing.Exponential.InOut )
                    .onUpdate( () => { geom.verticesNeedUpdate = true })
                    .start();
    })
  }

  update()
  {
    this.stats.begin();


    TWEEN.update()

    this.particleGroup.tick( this.clock.getDelta() );
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

export default TextParticle;