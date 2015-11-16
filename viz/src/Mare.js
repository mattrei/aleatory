import THREE from 'three.js'; 
import OC    from 'three-orbit-controls';
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import TWEEN from 'tween.js'

import Water from './Water'

import FirstPersonControls from './controls/FirstPersonControls'

const MORPH_SPEED = 200
const Y_POS = 200
const SKYBOX = "sky"//"miramar"

var prevTime = Date.now();
class Mare {
  constructor(args) 
  {
    this.startStats();
    
    this.gui      = null
    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.counter  = 0;
    this.clock    = new THREE.Clock();

    this.animation = null

    this.morphs = []
    this.mainMorph = null


    this.createRender();
    this.createScene();

    this.addObjects();
    this.startGUI();


    this.addBoat()
    this._loadSkyBox()

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
    this.renderer.context.getExtension( 'OES_texture_float' );
    this.renderer.context.getExtension( 'OES_texture_float_linear' );
    this.renderer.setClearColor( 0x000000 );
    document.body.appendChild(this.renderer.domElement)
  }

  createScene()
  {
    const OrbitControls = OC(THREE);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000000 );
    this.camera.position.set(0, 50, -300);
    this.camera.lookAt( new THREE.Vector3() );
    this.camera.up = new THREE.Vector3(0,0,1);
    //this.controls = new THREE.FirstPersonControls(this.camera) 
    //this.controls.movementSpeed = 300;
    //this.controls.lookSpeed = 0.3;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxDistance = 500;

    this.scene = new THREE.Scene();

    // Add light
    var directionalLight = new THREE.DirectionalLight(0xffff55, 1);
    directionalLight.position.set(-600, 300, 600);

    var waterNormals = new THREE.ImageUtils.loadTexture('/assets/img/waternormals.jpg');
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping; 
    
    // Create the water effect
    this.water = new THREE.Water(this.renderer, this.camera, this.scene, {
      textureWidth: 256,
      textureHeight: 256,
      waterNormals: waterNormals,
      alpha:  1.0,
      sunDirection: directionalLight.position.normalize(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      betaVersion: 0,
      side: THREE.DoubleSide
    });

    var aMeshMirror = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(20000, 20000, 10, 10), 
      this.water.material
    );
    aMeshMirror.add(this.water);
    aMeshMirror.rotation.x = - Math.PI * 0.5;
    aMeshMirror.position.y -= 100
    
    this.scene.add(aMeshMirror)
  }



  _loadSkyBox () {
    
    var aCubeMap = THREE.ImageUtils.loadTextureCube([
      '/assets/skybox/' + SKYBOX + '_west.jpg',
      '/assets/skybox/' + SKYBOX + '_east.jpg',
      '/assets/skybox/' + SKYBOX + '_up.jpg',
      '/assets/skybox/' + SKYBOX + '_down.jpg',
      '/assets/skybox/' + SKYBOX + '_south.jpg',
      '/assets/skybox/' + SKYBOX + '_north.jpg'

    ]);
    aCubeMap.format = THREE.RGBFormat;
    var aShader = THREE.ShaderLib['cube'];
    
    aShader.uniforms['tCube'].value = aCubeMap;

    var aSkyBoxMaterial = new THREE.ShaderMaterial({
      fragmentShader: aShader.fragmentShader,
      vertexShader: aShader.vertexShader,
      uniforms: aShader.uniforms,
      depthWrite: false,
      side: THREE.BackSide
    });

    var aSkybox = new THREE.Mesh(
      new THREE.BoxGeometry(1000000, 1000000, 1000000),
      aSkyBoxMaterial
    );
    
    this.scene.add(aSkybox);
  }

  addBoat() {

    let textureLoader = new THREE.TextureLoader()

    let loader = new THREE.JSONLoader();

    loader.load("/assets/models/OldBoat.js", (geometry) => {


      textureLoader.load('/assets/models/boattex.jpg', t => {
            
        let material = new THREE.MeshLambertMaterial( { 
          map: t,
        } );
         let mesh = new THREE.Mesh( geometry, material );
         mesh.scale.set( 5, 5, 5 );
         mesh.position.y = 0;
         mesh.position.x = 0;


         mesh.wave = {x: Math.random(), z: Math.random() }

         this.scene.add(mesh)

         let dur = (Math.random() * 2000) + 2000
         let rad = Math.PI / ((Math.random() * 3) + 6) * 0.5

        let t1 = new TWEEN.Tween( mesh.rotation )
            .to( { x: rad }, dur )
            .easing( TWEEN.Easing.Bounce.InOut )


        let t2 =  new TWEEN.Tween( mesh.rotation )
            .to( { x: -rad }, dur * 2 )
            .easing( TWEEN.Easing.Bounce.InOut )
            
        t1.chain(t2)
        t2.chain(t1)

        t1.start()

          })


    }) 
  }

  addObjects()
  {

    var planeGeo = new THREE.PlaneBufferGeometry(6000, 6000, 256, 256)
    var planeMat = new THREE.MeshLambertMaterial({color: 0xffff00, wireframe: true})
    this.plane = new THREE.Mesh(planeGeo, planeMat)
    this.plane.rotation.x=-90 * (Math.PI/180)
    //this.scene.add(this.plane)
    var gridHelper = new THREE.GridHelper( 100, 10 );        
    this.scene.add( gridHelper );
    var axisHelper = new THREE.AxisHelper( 100 );
    this.scene.add( axisHelper );



    // Add light
    this.directionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
    this.directionalLight.position.set( -0.2, 0.5, 1 );
    this.scene.add( this.directionalLight );

/*
      // Initialize Ocean
    var gsize = 512;
    var res = 512;
    var gres = 256;
    var origx = -gsize / 2;
    var origz = -gsize / 2;
    this.ocean = new THREE.Ocean( this.renderer, this.camera, this.scene,
    {
      INITIAL_SIZE : 200.0,
      INITIAL_WIND : [ 10.0, 10.0 ],
      INITIAL_CHOPPINESS : 3.6,
      CLEAR_COLOR : [ 1.0, 1.0, 1.0, 0.0 ],
      SUN_DIRECTION : this.directionalLight.position.clone(),
      OCEAN_COLOR: new THREE.Vector3( 0.35, 0.4, 0.45 ),
      SKY_COLOR: new THREE.Vector3( 10.0, 13.0, 15.0 ),
      EXPOSURE : 0.15,
      GEOMETRY_RESOLUTION: gres,
      GEOMETRY_SIZE : gsize,
      RESOLUTION : res
    } );

    this.ocean.materialOcean.uniforms.u_sunDirection.value.copy( this.directionalLight.position )
    */
  }

  startGUI()
  {
    this.gui = new dat.GUI()
    
    // gui.add(camera.position, 'y', 0, 400)
    // gui.add(camera.position, 'z', 0, 400)
/*
    gui.add( this.ocean, "size", 10, 2000 ).onChange( function( v ) {
      this.object.size = v;
      this.object.changed = true;
    } );
    gui.add( this.ocean.materialSpectrum.uniforms.u_choppiness, "value", 0.1, 8 ).name( "choppiness" );
    gui.add( this.ocean, "windX", -50, 50 ).onChange( function ( v ) {
      this.object.windX = v;
      this.object.changed = true;
    } );
    gui.add( this.ocean, "windY", -50, 50 ).onChange( function ( v ) {
      this.object.windY = v;
      this.object.changed = true;
    } );
    gui.add( this.ocean, "exposure", 0.0, 0.5 ).onChange( function ( v ) {
      this.object.exposure = v;
      this.object.changed = true;
    } );
*/
    //gui.add( DEMO.ms_Ocean.materialOcean, "wireframe" );
  }

  render(delta) 
  {

    this.water.render()
    this.renderer.render(this.scene, this.camera);
  }

  update()
  {
    this.stats.begin();
    let delta = this.clock.getDelta()

    TWEEN.update()

    //this.controls.update( delta);

    for ( var i = 0; i < this.morphs.length; i ++ ) {

            let morph = this.morphs[ i ];
            morph.updateAnimation( 1000 * delta );
            morph.position.z += morph.speed * delta;

            if ( morph.position.z  > 4000 )  {
              morph.position.z = Math.random() * 500;
            }
    }
    
    if (this.mainMorph) {
      
      let rot = (Math.PI/4) * (Math.sin(this.mainMorph.position.z / 100) )
      this.mainMorph.rotation.z = rot
      let pos = -Math.pow(rot, 3)
      this.mainMorph.position.x += pos

      this.mainMorph.position.y = Math.abs(pos * 20)

      this.camera.position.z = this.mainMorph.position.z - 300
      this.camera.position.y = this.mainMorph.position.y + 50
      this.camera.position.x = this.mainMorph.position.x

      //this.camera.lookAt(this.mainMorph.position)
      //this.camera.rotation.z = this.mainMorph.rotation.z
    }

    this.water.material.uniforms.time.value += 1.0 / 60.0;

    if (this.animation) {
      var time = Date.now();
      this.animation.update(time-prevTime)

      //console.log(time-prevTime + " " + this.clock.getDelta())

      this.ocean.deltaTime = time-prevTime //
      //this.ocean.render()
      //this.ocean.update()

      prevTime = time
    }
    this.render()
    

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

export default Mare;