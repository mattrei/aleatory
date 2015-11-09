import THREE from 'three.js'; 
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import MathF from 'utils-perf'
import TWEEN from 'tween.js'

import DATA from './test_data/headlines.json'

const OrbitControls = require('three-orbit-controls')(THREE);

const typeface = require('three.regular.helvetiker');
//THREE.typeface_js.loadFace(typeface);


import Boid from 'boid'

const DURATION = 2000

class Demo {
  constructor(args) 
  {
    this.headlines = DATA
    this.currIdx = 0
    this.curr = "hello world"
    this.lights = {l1:null, l2:null, l3:null, l4:null}


    this.flockingSpeed = 3

    this.startStats();
    this.startGUI();

    this.system = null
    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.counter  = 0;
    this.clock    = new THREE.Clock();

    this.createRender();
    this.createScene();
    this.addObjects();
    this.addLights()

    //this.initParticulate()

    this.onResize();
    this.update();

    this.init()
  }


  addLights() 
  {
      let intensity = 200

      var sphere = new THREE.SphereGeometry( 0.5, 16, 8 );

      let light1 = new THREE.PointLight( 0xffffff, intensity, 50 );
        light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) ) );
        this.scene.add( light1 );
        this.lights.l1 = light1

      let light2 = new THREE.PointLight( 0xffffff, intensity, 50 );
        light2.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) ) );
        this.scene.add( light2 );
        this.lights.l2 = light2

      let light3 = new THREE.PointLight( 0xffffff, intensity, 50 );
        light3.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) ) );
        this.scene.add( light3 );
        this.lights.l3 = light3

      let light4 = new THREE.PointLight( 0xffffff, intensity, 50 );
        light4.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) ) );
        this.scene.add( light4 );
        this.lights.l4 = light4

        this.scene.add( new THREE.AmbientLight( 0x444444 ) );
        var dlight = new THREE.DirectionalLight( 0xffffff, 2.0 );
        dlight.position.set( 0, 0, 0 ).normalize();
        this.scene.add( dlight );
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
    this.controls.maxDistance = 2500;

    this.scene = new THREE.Scene();
  }

  addObjects()
  {
    var gridHelper = new THREE.GridHelper( 100, 10 );        
    //this.scene.add( gridHelper );
    var text = this.curr

/*
    var material = new THREE.MeshNormalMaterial();
    var pos = 0
    console.log(text.length)
    for (var i=0; i < text.length; i++) {
      var textGeom = new THREE.TextGeometry( text[i], {
              font: 'helvetiker',
              size: 10
          });
      textGeom.computeBoundingBox();
      let w = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;

      var textMesh = new THREE.Mesh( textGeom, material );
      textMesh.position.x = pos

      if (isNaN(w)) {
        w = 2
      }
      pos += w + 2
      console.log(textGeom.textWidth)
      this.scene.add( textMesh );
    }
    */
    //textGeom.computeBoundingBox();
    //textGeom.textWidth = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;


  }

  startGUI()
  {
    var gui = new dat.GUI()
    gui.add(this, 'init')
    gui.add(this, 'shuffle')
    gui.add(this, 'shuffleWild')
    gui.add(this, 'resetLast')
    gui.add(this, 'showNext')
    gui.add(this, 'flockingSpeed', 0, 20)
  }

  createText(text) 
  {
    let material = new THREE.MeshNormalMaterial();

    material =  new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0xffffff, metal: true})

    let pos = 0
    let meshes = []
    for (var i=0; i < text.length; i++) {
      let c = text[i]

      let shapes = THREE.FontUtils.generateShapes( c, {
        font: "helvetiker",
        weight: "normal",
        size: 10
      } );
      let textGeom = new THREE.ShapeGeometry( shapes );

      /*
      var textGeom = new THREE.TextGeometry( c, {
              font: 'helvetiker',
              size: 10
          });*/
      textGeom.computeBoundingBox();
      let w = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;

      var textMesh = new THREE.Mesh( textGeom, material );
      textMesh.relposition = new THREE.Vector3()
      textMesh.relposition.x = pos

      var p = new THREE.Object3D();
      p.position.x = Math.random() * 400 - 200;
      p.position.y = Math.random() * 400 - 200;
      p.position.z = Math.random() * -400;

      textMesh.randposition = p.position
      textMesh.position.copy(p.position)

      textMesh.rotation.x = Math.random() * Math.PI * 2;
      textMesh.rotation.y = Math.random() * Math.PI * 2;
      textMesh.rotation.z = Math.random() * Math.PI * 2;

      if (c === ' ') {
        w = 2
      }
      pos += w + 2

      material.side = THREE.DoubleSide;
      this.scene.add( textMesh );
      meshes.push(textMesh)
    }

    return meshes
  }

  init() 
  {
    this.headlines.forEach(h => {
      let meshes = this.createText(h.title)
      h.meshes = meshes
      h.meshes.forEach(m => {

        var wanderer = new Boid()
        wanderer.setBounds(window.innerWidth, window.innerHeight)
        wanderer.position.x = m.position.x
        wanderer.position.y = m.position.y
        wanderer.maxSpeed = this.flockingSpeed
        wanderer.velocity.x = 10 * Math.random() - 5;
        wanderer.velocity.y = 10 * Math.random() - 5;

        m.boid = wanderer

      })
    })
  }
  _randPos() 
  {
        var p = new THREE.Object3D();
        p.position.x = Math.random() * 400 - 200;
        p.position.y = Math.random() * 400 - 200;
        p.position.z = Math.random() * -400;
        return p
  }

  _randRot() 
  {
        var p = new THREE.Vector3()
        p.x = Math.random() * 400 - 200;
        p.y = Math.random() * 400 - 200;
        p.z = Math.random() * -400;
        return p
  }

  shuffle()  
  {
    this.headlines.forEach(h => {
      h.meshes.forEach(m => {

        let p = this._randPos().position
        let r = this._randRot()
        m.isShuffled = true

        new TWEEN.Tween( m.position )
            .to( { x: p.x, y: p.y, z: p.z }, Math.random() * DURATION + DURATION )
            .easing( TWEEN.Easing.Exponential.InOut )
            .onComplete(() => {
              m.isShuffled = false
            })
            .start();
            
      })
    
    })

  }

  shuffleWild() 
  {
       this.headlines.forEach(h => {
      h.meshes.forEach(m => {

        let p = this._randPos().position
        let r = this._randRot()

        new TWEEN.Tween( m.position )
            .to( { x: p.x, y: p.y, z: p.z }, Math.random() * DURATION + DURATION )
            .easing( TWEEN.Easing.Exponential.InOut )
            .onComplete(() => {
              m.isShuffled = false
            })
            .start();

          new TWEEN.Tween( m.rotation )
            .to( { x: r.x, y: r.y, z: r.z }, Math.random() * DURATION + DURATION )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
            
      })
    
    }) 
  }

  resetLast() {
    let oh = this.headlines[this.currIdx - 1 % this.headlines.length]
    oh.meshes.forEach(m => {

      new TWEEN.Tween( m.position )
            .to( { x: m.randposition.x, y: m.randposition.y, z: m.randposition.z }, Math.random() * DURATION + DURATION )
            .easing( TWEEN.Easing.Exponential.InOut )
            .onComplete(() => {
              m.isShown = false
            })
            .start();

          new TWEEN.Tween( m.rotation )
            .to( { x: Math.random() * Math.PI * 2, y: Math.random() * Math.PI * 2, z: Math.random() * Math.PI * 2 }, Math.random() * DURATION + DURATION )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
    })
  }

  showNext() 
  {


    let h = this.headlines[this.currIdx % this.headlines.length]
    let duration = 2000
    console.log(h.meshes)
    h.meshes.forEach(m => {
      m.isShown = true
      new TWEEN.Tween( m.position )
            .to( { x: m.relposition.x, y: m.relposition.y, z: m.relposition.z }, Math.random() * DURATION + DURATION )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();

          new TWEEN.Tween( m.rotation )
            .to( { x: 0, y: 0, z: 0 }, Math.random() * DURATION + DURATION )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
    })

    this.currIdx++
  }

  animate() 
  {
      let time = Date.now() * 0.00025;
      let d = 150

        this.lights.l1.position.x = Math.sin( time * 0.7 ) * d;
        this.lights.l1.position.z = Math.cos( time * 0.3 ) * d;

        this.lights.l2.position.x = Math.cos( time * 0.3 ) * d;
        this.lights.l2.position.z = Math.sin( time * 0.7 ) * d;

        this.lights.l3.position.x = Math.sin( time * 0.7 ) * d;
        this.lights.l3.position.z = Math.sin( time * 0.5 ) * d;

        this.lights.l4.position.x = Math.sin( time * 0.3 ) * d;
        this.lights.l4.position.z = Math.sin( time * 0.5 ) * d;




    this.headlines.forEach(h => {
      if (h.meshes) {
        h.meshes.forEach(m => {

          if (!m.isShown) {
            m.boid.wander().update()
            m.boid.maxSpeed = this.flockingSpeed
            m.position.x = m.boid.position.x - window.innerWidth / 2
            m.position.y = m.boid.position.y - window.innerHeight / 2
          }
        })
      }
    })
  }

  update()
  {
    this.stats.begin();
    TWEEN.update();

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