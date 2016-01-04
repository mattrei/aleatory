global.THREE = require('three')
import Scene from './Scene'

const random = require('random-float')
const randomInt = require('random-int')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

import TWEEN from 'tween.js'
const glslify = require('glslify')

const ExplodeModifier = require('./modifiers/ExplodeModifier')(THREE)
var randomSpherical = require('random-spherical/object')( null, THREE.Vector3 )
//const randomSpherical = require('random-spherical/array')()

const TextGeometry = require('./geometries/TextGeometry')(THREE)
const FontUtils = require('./utils/FontUtils')
const GeometryUtils = require('./utils/GeometryUtils')

const ParticleShader = require('./shaders/ParticleShader')(THREE)



const Velocity = require('velocity-animate')
require('velocity-animate/velocity.ui')

const POLY_SIZE = 8000
const SPHERE_SIZE = 1500

const E_SPHERE_RADIUS = 3500
const E_SM_SPHERE_RADIUS = 3000

class Demo extends Scene {
  constructor(args)
  {
    super(args, {
      executed: true,
      cage: true,
      scheduled: false
    }, new THREE.Vector3(0,0,5000))

    this.current = {show: 0.0, number: 1}

    this.text = {name: null, date: null, intro: null}
    this.introText = ''

    this.targetView = 'grid'

    //executed
    this.minDistance = 100
    this.particlesData = []


    this.targets = { table: [], sphere: [], helix: [], grid: [], random: [] };


    this.currentIdx = 0
    this.transition = 2000

    this.executed = {
      meshes: [],
      idx: 0
    }
    this.scheduled = {
      meshes: [],
      idx: 0
    }

    // demo
    super.onData({executed: require('./test_data/executed.json')})
    super.onData({scheduled: require('./test_data/scheduled.json')})


    this.createBackground()
    this.createCage()



    this.createExecuted()
    this.createScheduled()
  }

  startGUI(gui)
  {
    gui.add(this, 'resetCamera')
    gui.add(this, 'doSphere')
    gui.add(this, 'doRandom')
    gui.add(this, 'lookAtRnd')
    gui.add(this, 'lookAtNext')
    gui.add(this, 'smash')
    gui.add(this, 'transition', 500, 5000)

    gui.add(this.current, 'show', 0, 5)
    gui.add(this.current, 'number', 1, 8)

    gui.add(this, 'minDistance', 100, 1000)

    gui.add(this, 'nextScheduled')
    gui.add(this, 'clearScene')
  }

  createBackground() {

    const skyVertex = `
    varying vec2 vUV;

    void main() {
      vUV = uv;
      vec4 pos = vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * pos;
    }
    `

    const skyFragment = `
    uniform sampler2D texture;
    varying vec2 vUV;

    void main() {
      vec4 sample = texture2D(texture, vUV);
      gl_FragColor = vec4(sample.xyz, sample.w);
    }
    `

    this.loader.load(
        '/assets/Executed/galaxy_starfield.png', (texture) => {
          var geometry = new THREE.SphereGeometry(7000, 60, 40);
          var material = new THREE.ShaderMaterial( {
            uniforms:       {
              texture: { type: 't', value: texture }
            },
            vertexShader:   skyVertex,
            fragmentShader: skyFragment
          });

          let skyBox = new THREE.Mesh(geometry, material);
          skyBox.scale.set(-1, 1, 1);
          skyBox.rotation.order = 'XZY';
          skyBox.renderOrder = 1000.0;
          skyBox.rotation.y = Math.PI*-0.5
          this.scene.add(skyBox)
        })

  }

  createCage()
  {

    let group = new THREE.Group()
    this.scene.add( group )

    const MAX = 2000,
          MAX_LINES = 2000



    // create the points
    let pMaterial = new THREE.PointsMaterial( {
          color: 0xFFFFFF,
          size: 3,
          blending: THREE.AdditiveBlending,
          transparent: true,
          sizeAttenuation: false
        } );

    let r = E_SPHERE_RADIUS

    let pGeometry = new THREE.BufferGeometry();
    let particlePositions = new Float32Array( MAX * 3 );

        for ( let i = 0; i < MAX; i++ ) {

          var pointOnSurface = randomSpherical( E_SPHERE_RADIUS, new THREE.Vector3(0,0,0) )

          particlePositions[ i * 3     ] = pointOnSurface.x
          particlePositions[ i * 3 + 1 ] = pointOnSurface.y
          particlePositions[ i * 3 + 2 ] = pointOnSurface.z

          // add it to the geometry
          this.particlesData.push( {
            velocity: new THREE.Vector3( random(-3, 3), random(-3, 3), random(-3, 3) ),
            numConnections: 0
          } );

        }

        pGeometry.setDrawRange( 0, MAX_LINES );
        pGeometry.addAttribute( 'position', new THREE.BufferAttribute( particlePositions, 3 ).setDynamic( true ) );

        // create the particle system

      let particlesMesh = new THREE.Points( pGeometry, pMaterial );
      group.add( particlesMesh );


    // now create the lines
    let segments = MAX * MAX
      let linePositions = new Float32Array( segments * 3 ),
        lineColors = new Float32Array( segments * 3 )
      let lGeometry = new THREE.BufferGeometry();

        lGeometry.addAttribute( 'position', new THREE.BufferAttribute( linePositions, 3 ).setDynamic( true ) );
        lGeometry.addAttribute( 'color', new THREE.BufferAttribute( lineColors, 3 ).setDynamic( true ) );

        lGeometry.computeBoundingSphere();
        lGeometry.setDrawRange( 0, 0 );

        let lMaterial = new THREE.LineBasicMaterial( {
          vertexColors: THREE.VertexColors,
          blending: THREE.AdditiveBlending,
          transparent: true
        } );

        let linesMesh = new THREE.LineSegments( lGeometry, lMaterial );
        group.add( linesMesh );

    this.events.on('tick', t => {

      group.visible = this.show.cage

      let vertexpos = 0,
         colorpos = 0,
         numConnected = 0

        for ( var i = 0; i < MAX_LINES; i++ )
          this.particlesData[ i ].numConnections = 0;

        for ( var i = 0; i < MAX_LINES; i++ ) {

          // get the particle
          let particleData = this.particlesData[i];

          particlePositions[ i * 3     ] += particleData.velocity.x;
          particlePositions[ i * 3 + 1 ] += particleData.velocity.y;
          particlePositions[ i * 3 + 2 ] += particleData.velocity.z;

          let x = particlePositions[ i * 3 ],
            y = particlePositions[ i * 3 + 1 ],
            z = particlePositions[ i * 3 + 2 ]

          if (Math.sqrt(x*x + y*y + z*z) > E_SPHERE_RADIUS ||
            Math.sqrt(x*x + y*y + z*z) < E_SM_SPHERE_RADIUS) {
            particleData.velocity.x = -particleData.velocity.x;
            particleData.velocity.y = -particleData.velocity.y;
            particleData.velocity.z = -particleData.velocity.z;
          }


          // Check collision
          for ( var j = i + 1; j < MAX_LINES; j++ ) {

            let particleDataB = this.particlesData[ j ];

            var dx = particlePositions[ i * 3     ] - particlePositions[ j * 3     ];
            var dy = particlePositions[ i * 3 + 1 ] - particlePositions[ j * 3 + 1 ];
            var dz = particlePositions[ i * 3 + 2 ] - particlePositions[ j * 3 + 2 ];
            var dist = Math.sqrt( dx * dx + dy * dy + dz * dz );

            if ( dist < this.minDistance ) {

              particleData.numConnections++;
              particleDataB.numConnections++;

              var alpha = 1.0 - dist / this.minDistance;

              linePositions[ vertexpos++ ] = particlePositions[ i * 3     ];
              linePositions[ vertexpos++ ] = particlePositions[ i * 3 + 1 ];
              linePositions[ vertexpos++ ] = particlePositions[ i * 3 + 2 ];

              linePositions[ vertexpos++ ] = particlePositions[ j * 3     ];
              linePositions[ vertexpos++ ] = particlePositions[ j * 3 + 1 ];
              linePositions[ vertexpos++ ] = particlePositions[ j * 3 + 2 ];

              lineColors[ colorpos++ ] = alpha;
              lineColors[ colorpos++ ] = alpha;
              lineColors[ colorpos++ ] = alpha;

              lineColors[ colorpos++ ] = alpha;
              lineColors[ colorpos++ ] = alpha;
              lineColors[ colorpos++ ] = alpha;

              numConnected++;
            }
          }
        }


        linesMesh.geometry.setDrawRange( 0, numConnected * 2 );
        linesMesh.geometry.attributes.position.needsUpdate = true;
        linesMesh.geometry.attributes.color.needsUpdate = true;

        particlesMesh.geometry.attributes.position.needsUpdate = true;

    })

  }

  createExecuted()
  {

    let group = new THREE.Group()
    this.scene.add( group )

    this.data.executed.forEach((e,i) => {

      this.loader.load(e.img, (texture) => {

          texture.minFilter = THREE.LinearFilter
          /*let img = new THREE.MeshBasicMaterial({
              map: texture,
              color: 0xffffff,
              side: THREE.DoubleSide,
          });*/
          let geom = new THREE.PlaneGeometry(200, 200),
             mat = new THREE.ShaderMaterial( {
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

          // plane
          let mesh = new THREE.Mesh(geom, mat)
          mesh.overdraw = true

          mesh.userData = e

          group.add(mesh)

          this.executed.meshes.push(mesh)
      })

    })

        var vector = new THREE.Vector3();

        // sphere
        for ( var i = 0, l = this.data.executed.length; i < l; i ++ ) {

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

        //this.camera.target = this.data.executed[0]
    this.events.on('tick', t => {
      group.visible = this.show.executed
    })
  }




  resetCamera() {
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
    let e = this.executed.meshes[this.currentIdx % this.executed.meshes.length]
    this.lookAt(e)
  }

  smash() {

    let mesh = this.executed.meshes[this.currentIdx % this.executed.meshes.length]
    let geometry = mesh.geometry

    var explodeModifier = new THREE.ExplodeModifier();
    explodeModifier.modify( geometry );

    console.log(geometry.vertices)


    for(var i = 0; i < (geometry.vertices.length); i++)
    {

        var pos = new THREE.Vector3();
        var v = geometry.vertices[i]


        pos.x = v.x * (Math.random() * 100 + 50);
        pos.y = v.y * (Math.random() * 100 + 50);
        pos.z = v.z * (Math.random() * 100 + 50);


        new TWEEN.Tween(geometry.vertices[i])
        .to( { x: pos.x, y: pos.y, z: pos.z }, 3000 )
        .easing( TWEEN.Easing.Exponential.InOut )
        .onUpdate( () => { geometry.verticesNeedUpdate = true })
        .start();


    }

    mesh.visible = false


  }

  lookAtRnd()
  {
    this.currentIdx = Math.floor(Math.random() * this.executed.meshes.length)
    let e = this.executed.meshes[this.currentIdx]

    this.lookAt(e)
  }

  doSphere() {
    this.targetView = 'sphere'
    this.transform( this.targets.sphere, 2 );
  }

  doRandom() {
    this.targetView = 'random'

    this.targets.random = []

        for ( var i = 0; i < this.data.executed.length; i ++ ) {

          var object = new THREE.Object3D();

          object.position.x = Math.random() * 4000 - 2000;
          object.position.y = Math.random() * 4000 - 2000;
          object.position.z = Math.random() * 4000 - 2000;


          this.targets.random.push( object );

        }

    this.transform( this.targets.random, 2 )
  }

  transform( targets, duration ) {


        for ( var i = 0; i < this.executed.meshes.length; i ++ ) {

          var object = this.executed.meshes[ i ];
          var target = targets[ i ];

          tweenr.to(object.position,
                    { x: target.position.x, y: target.position.y, z: target.position.z, duration: random(duration, duration * 2) })
            /*
          tweenr.to(object.rotation,
                    { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z, duration: random(duration, duration * 2) })
*/
          /*
          new TWEEN.Tween( object.position )
            .to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
            */

          new TWEEN.Tween( object.rotation )
            .to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, duration*1000 )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();



        }

      }

  createScheduled() {

    const NUM_PARTICLES = 400000
    const MAX_PARTICLE_DIST = 6000

    this.loader.load('assets/Executed/particle.png', (particleImg) => {

    this.data.scheduled.forEach(s => {
      this.loader.load(s.img, (texture) => {
        texture.minFilter = THREE.LinearFilter

            let getPixel = (imgData, x, y) => {
              var r, g, b, a, offset = x * 4 + y * 4 * imgData.width;
              r = imgData.data[offset];
              g = imgData.data[offset + 1];
              b = imgData.data[offset + 2];
              a = imgData.data[offset + 3];

              let avg = (r + g + b) / 3

              return Math.floor(avg / (256 / 3))

            }



         let getImgData = (pic) => {


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


        getImgData(s.img).then((imgData => {
          console.log("creating particles")

          //this.scheduled.push({img: texture, imgData: imgData})

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

          let imageScale = 25,
            zSpread = 200


          for (var i = 0, i3 = 0; i < NUM_PARTICLES; i++ , i3 += 3) {

            var position = new THREE.Vector3(
              random(-MAX_PARTICLE_DIST, MAX_PARTICLE_DIST),
              random(-MAX_PARTICLE_DIST, MAX_PARTICLE_DIST),
              random(-MAX_PARTICLE_DIST, MAX_PARTICLE_DIST)
            );

            var gotIt = false;

              // Randomly select a pixel
              var x = Math.round(imgData.width * Math.random());
              var y = Math.round(imgData.height * Math.random());
              var bw = getPixel(imgData, x, y);

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

          let points = new THREE.Points(geometry, particleMaterial);
          points.visible = false
          this.scene.add(points)

          this.scheduled.meshes.push(points)
          console.log(points)

          this.events.on('tick', t => {
            points.rotation.x = -t.delta * 0.002;
            points.rotation.y = -t.delta * 0.002;
            points.rotation.z = Math.PI - t.delta * 0.004;
          })

        }))
      })



    })
    })





  }

  nextScheduled() {

    this.scheduled.meshes[this.scheduled.idx++].visible = true


/*
    let rt = new TWEEN.Tween(this.camera.rotation).to({
          x: 0,
          y: this.camera.rotation.y + Math.PI,
          z: 0
      }, 5 * 1000 ).easing(TWEEN.Easing.Linear.None).
    onComplete(() => {
      //this.clearScene()
      this.drawScheduled()
    })

    let ft = new TWEEN.Tween(this.camera.position).to({
          x: 0,
          y: 0,
          z: this.camera.position.z * -1
      }, 10 * 1000 ).easing(TWEEN.Easing.Linear.None)

    rt.chain(ft)
    rt.start()
*/
    //this.drawScheduledText()
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




  tick(time, delta) {


    TWEEN.update()


    let e = this.executed.meshes[this.currentIdx % this.executed.meshes.length]
    if (e) {
      e.material.uniforms.time.value = time
      e.material.uniforms.showCurrent.value = this.current.show
      e.material.uniforms.numberCurrents.value = this.current.number
    }

    }

}

export default Demo
