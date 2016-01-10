const DEMO = true
global.THREE = require('three')
import Scene from './Scene'

const random = require('random-float')
const randomInt = require('random-int')

const simplex = new (require('simplex-noise'))()

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

import TWEEN from 'tween.js'
const glslify = require('glslify')
const newArray = require('new-array')

const randomRadian = () => random(-Math.PI, Math.PI)
const randomRotation = () => newArray(3).map(randomRadian)
const randomSphere = require('gl-vec3/random')

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


class Demo extends Scene {
  constructor(args)
  {
    super(args, new THREE.Vector3(0,0,5000))

    this.text = {name: null, date: null, intro: null}

    this.createBackground()
    this.createCage()
    this.createAsteroids(100).forEach(m => this.scene.add(m))
    this.createExecuted()
    this.createScheduled()

    // demo
    if (DEMO) {
      super.onVisParameters({executed: {data: require('./test_data/executed.json')}})
      super.onVisParameters({scheduled: {data: require('./test_data/scheduled.json')}})
    }


  }

  intro(text) {
      const DUR = 2

      let shapes = THREE.FontUtils.generateShapes( text, {
          font: "oswald",
          weight: "normal",
          size: 15
        } );
      let geo = new THREE.ShapeGeometry( shapes ),
          mat = new THREE.ShaderMaterial({
            uniforms: {
              iGlobalTime: {
                type: 'f',
                value: 1
              }
            },
            fragmentShader: glslify(__dirname + '/glsl/Executed/Text.frag'),
            vertexShader: glslify(__dirname + '/glsl/Executed/Text.vert'),
            transparent: true
          })



      let mesh = new THREE.Mesh( geo, mat );
      geo.center()
      //mesh.scale.set(0,0,0)
      mesh.position.set(0,this.camera.position.y,50)
      this.scene.add(mesh)

      this.events.on('tick', t => {
        mat.uniforms.iGlobalTime.value = t.time
      })

  }

  outro(text) {

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

  createAsteroids (count) {
    const geometries = newArray(6).map(asteroidGeom)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      wireframe: true
    })
    const meshes = newArray(count).map(() => {
      const geometry = geometries[randomInt(geometries.length)]
      const mesh = new THREE.Mesh(geometry, material.clone())
      mesh.material.opacity = random(0.05, 0.1)
      mesh.scale.multiplyScalar(random(1, 2.5))
      mesh.rotation.fromArray(randomRotation())
      mesh.direction = new THREE.Vector3().fromArray(randomSphere([]))
      mesh.position.fromArray(randomSphere([], random(4000, 6000)))
      return mesh
    })


    this.events.on('tick', t => {
      const dt = t.delta / 10
      //console.log(t)
      meshes.forEach(mesh => {
        mesh.rotation.x += dt * 0.1 * mesh.direction.x
        mesh.rotation.y += dt * 0.5 * mesh.direction.y
      })
    })

    return meshes

    function asteroidGeom () {
      const geometry = new THREE.TetrahedronGeometry(10, randomInt(1, 3))
      geometry.vertices.forEach(v => {
        let steps = 3
        let s = Math.pow(2, steps)
        let a = 0.75
        for (let i = 0; i < steps; i++) {
          v.x += a * simplex.noise3D(v.x * s * 0, v.y * s, v.z * s)
          v.y += a * simplex.noise3D(v.x * s, v.y * s * 0, v.z * s)
          v.z += a * simplex.noise3D(v.x * s, v.y * s, v.z * s * 0)
          s *= 0.25
          a *= 1 / steps * i
        }
      })
      geometry.computeFaceNormals()
      geometry.verticesNeedsUpdate = true
      return geometry
    }
  }


  createCage()
  {

    const VIS = 'cage'

    const E_SPHERE_RADIUS = 3500
    const E_SM_SPHERE_RADIUS = 3000

    const conf = {on: false, minDistance: 1, speed: 1, open: false}

    let group = new THREE.Group()
    group.visible = conf.on
    this.scene.add( group )

    const MAX = 800,
          MAX_LINES = 600

    // create the points
    let pMaterial = new THREE.PointsMaterial( {
          color: 0xFFFFFF,
          size: 3,
          blending: THREE.AdditiveBlending,
          transparent: true,
          sizeAttenuation: false
        } );

    let r = E_SPHERE_RADIUS

    let particlesData = []

    let pGeometry = new THREE.BufferGeometry();
    let particlePositions = new Float32Array( MAX * 3 )


        for ( let i = 0; i < MAX; i++ ) {

          var pointOnSurface = randomSpherical( E_SPHERE_RADIUS, new THREE.Vector3(0,0,0) )

          particlePositions[ i * 3     ] = pointOnSurface.x
          particlePositions[ i * 3 + 1 ] = pointOnSurface.y
          particlePositions[ i * 3 + 2 ] = pointOnSurface.z

          // add it to the geometry
          particlesData.push( {
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

    this.events.on(VIS + '::visOn', d => {
        group.visible = true
        pMaterial.opacity = 0
        tweenr.to(pMaterial, {opacity: 1, duration: 2})
    })

    this.events.on(VIS + '::visOff', _ => group.visible = false)

    this.events.on('tick', t => {

      if (!conf.on) return

      const freq = super.getFreq(200, 600)

      //pMaterial.opacity = 1 - Math.sin(t.time * 0.2) * 0.5

      let vertexpos = 0,
         colorpos = 0,
         numConnected = 0


      let mixColor = new THREE.Color(1, 1, 1)

        for ( var i = 0; i < MAX_LINES; i++ )
          particlesData[ i ].numConnections = 0;

        for ( var i = 0; i < MAX_LINES; i++ ) {

          // get the particle
          let particleData = particlesData[i];

          particlePositions[ i * 3     ] += particleData.velocity.x * conf.speed
          particlePositions[ i * 3 + 1 ] += particleData.velocity.y * conf.speed
          particlePositions[ i * 3 + 2 ] += particleData.velocity.z * conf.speed

          let x = particlePositions[ i * 3 ],
            y = particlePositions[ i * 3 + 1 ],
            z = particlePositions[ i * 3 + 2 ]

          let maxRadius = E_SPHERE_RADIUS
          if (conf.open) {
            maxRadius = E_SPHERE_RADIUS * 10
          }
            if (Math.sqrt(x*x + y*y + z*z) > maxRadius ||
                Math.sqrt(x*x + y*y + z*z) < E_SM_SPHERE_RADIUS) {
              particleData.velocity.x = -particleData.velocity.x;
              particleData.velocity.y = -particleData.velocity.y;
              particleData.velocity.z = -particleData.velocity.z;
            }




          // Check collision
          for ( var j = i + 1; j < MAX_LINES; j++ ) {

            let particleDataB = particlesData[ j ];

            var dx = particlePositions[ i * 3     ] - particlePositions[ j * 3     ];
            var dy = particlePositions[ i * 3 + 1 ] - particlePositions[ j * 3 + 1 ];
            var dz = particlePositions[ i * 3 + 2 ] - particlePositions[ j * 3 + 2 ];
            var dist = Math.sqrt( dx * dx + dy * dy + dz * dz );

            if ( dist < conf.minDistance * 200 ) {

              particleData.numConnections++;
              particleDataB.numConnections++;

              var alpha = 1.0 - dist / conf.minDistance * 200

              linePositions[ vertexpos++ ] = particlePositions[ i * 3     ];
              linePositions[ vertexpos++ ] = particlePositions[ i * 3 + 1 ];
              linePositions[ vertexpos++ ] = particlePositions[ i * 3 + 2 ];

              linePositions[ vertexpos++ ] = particlePositions[ j * 3     ];
              linePositions[ vertexpos++ ] = particlePositions[ j * 3 + 1 ];
              linePositions[ vertexpos++ ] = particlePositions[ j * 3 + 2 ];



              let color = new THREE.Color(0, 0, 0)
              color.lerp(mixColor, freq)


              lineColors[ colorpos++ ] = color.r
              lineColors[ colorpos++ ] = color.g
              lineColors[ colorpos++ ] = color.b

              lineColors[ colorpos++ ] = color.r
              lineColors[ colorpos++ ] = color.g
              lineColors[ colorpos++ ] = color.b

              numConnected++;


            }
          }
        }


        linesMesh.geometry.setDrawRange( 0, numConnected * 2 );
        linesMesh.geometry.attributes.position.needsUpdate = true;
        linesMesh.geometry.attributes.color.needsUpdate = true;

        particlesMesh.geometry.attributes.position.needsUpdate = true;

    })

    super.addVis(VIS, conf)

  }

  createExecuted()
  {

    const VIS = 'executed'


    let group = new THREE.Group()
    this.scene.add( group )

    let idx = 0
    let meshes = [],
        spherePositions = [],
        view = 'sphere'

    let doSphere = (dur) => {
         for ( let i = 0; i < meshes.length; i ++ ) {

          var m = meshes[ i ];
          var target = spherePositions[ i ];
           dur = 2

          m.matrixAutoUpdate = true

          tweenr.to(m.position,
                    { x: target.position.x, y: target.position.y, z: target.position.z,
                     duration: random(dur, dur * 2) })

          tweenr.to(m.rotation,
                    { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z,
                     duration: random(dur, dur * 2) })
          //.on('update', () => object.updateMatrix())


        }
    }

    const LOOKAT_DUR = 2
    let doLookAt = (m) => {
      if (!this.camera.target) {
        this.camera.target = m
      }

      let vector = new THREE.Vector3()
      if (view === 'sphere') {
        vector.copy( m.position ).multiplyScalar( 1.2 );
      } else if (view === 'grid') {
        vector.copy( m.position )
        vector.z -= 400
      }


    // move to vector
      tweenr.to(this.camera.position,
                { x: vector.x, y: vector.y, z: vector.z, duration: LOOKAT_DUR })
        .on('update', () => { this.camera.lookAt(this.camera.target) })
        .on('complete', () => { this.camera.lookAt(this.camera.target) })
      tweenr.to(this.camera.target,
                { x: m.position.x, y: m.position.y, z: m.position.z, duration: LOOKAT_DUR})

      /*
      let d = m.userData

      this.text.name.innerHTML = d.name + " (" + d.age + ")"
      this.text.date.innerHTML = d.date
      Velocity(this.text.name, "fadeIn", this.transition/2 )
      Velocity(this.text.date, "fadeIn", this.transition/2 )
      */
    }

    let doSmash = () => {
      let mesh = meshes[idx % meshes.length],
         geometry = mesh.geometry

      mesh.dynamic = true

      var explodeModifier = new THREE.ExplodeModifier();
      explodeModifier.modify( geometry );

      console.log(geometry.vertices)


      for(var i = 0; i < (geometry.vertices.length); i++)
      {

          var pos = new THREE.Vector3();
          var v = geometry.vertices[i]


          pos.x = v.x + random(50, 1000)
          pos.y = v.y + random(50, 1000)
          pos.z = v.z + random(50, 1000)


          tweenr.to(v,
            { x: pos.x, y: pos.y, z: pos.z, duration: LOOKAT_DUR })
            .on('update', () => geometry.verticesNeedUpdate = true)
            .on('complete', () => mesh.visible = false)
      }
    }

    let doNext = () => {
      idx++
      let m = meshes[idx % meshes.length]
      doLookAt(m)
    }

    let doRnd = () => {
      let m = meshes[randomInt(0, meshes.length - 1)]
      doLookAt(m)
    }

    this.events.on(VIS + '::doSphere', p => doSphere(2 /*p.duration*/))
    this.events.on(VIS + '::doRnd', p => doRnd())
    this.events.on(VIS + '::doNext', p => doNext())
    this.events.on(VIS + '::doSmash', p => doSmash())


        let conf = {on: false,
               doSphere: doSphere,
               doNext: doNext,
               doRnd: doRnd,
               doSmash: doSmash,
               currentOn:false,
               currents: 1
               }
        group.visible = conf.on

    this.events.on(VIS + '::data', data => {

        data.forEach((e,i) => {

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
                      timeInit: { type: "f", value: Math.random() * 1000 },
                      showCurrent: { type: "f", value: conf.currentOn},
                      numberCurrents: { type: "f", value: conf.currents},
                      bgImg: { type: "t", value: texture }
                    },
                    side: THREE.DoubleSide,
                    transparent: true,
                    fragmentShader: glslify(__dirname + '/glsl/Executed/Picture.frag'),
                    vertexShader: glslify(__dirname + '/glsl/Executed/Picture.vert')
                } );

                // plane
                let mesh = new THREE.Mesh(geom, mat)
                mesh.overdraw = true

                mesh.userData = e

                group.add(mesh)

                meshes.push(mesh)
            })

          })



          var vector = new THREE.Vector3();

          // sphere
          for ( var i = 0, l = data.length; i < l; i ++ ) {

            var phi = Math.acos( -1 + ( 2 * i ) / l );
            var theta = Math.sqrt( l * Math.PI ) * phi;

            var object = new THREE.Object3D();

            object.position.x = SPHERE_SIZE * Math.cos( theta ) * Math.sin( phi );
            object.position.y = SPHERE_SIZE * Math.sin( theta ) * Math.sin( phi );
            object.position.z = SPHERE_SIZE * Math.cos( phi );

            vector.copy( object.position ).multiplyScalar( 2 );

            object.lookAt( vector );

            spherePositions.push( object );

          }
    })

    this.events.on(VIS + '::visOn', _ => group.visible = true)
    this.events.on(VIS + '::visOff', _ => group.visible = false)

    this.events.on('tick', t => {

      meshes.forEach(m => m.material.uniforms.time.value = t.time)

      let m = meshes[idx % meshes.length]
      if (m) {
        m.material.uniforms.showCurrent.value = conf.currentOn
        m.material.uniforms.numberCurrents.value = conf.currents
      }

    })




    super.addVis(VIS, conf)

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


/*
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
  */

  createScheduled() {

    const VIS = 'scheduled'


    const NUM_PARTICLES = 400000
    const MAX_PARTICLE_DIST = 6000

    let group = new THREE.Group()
    this.scene.add(group)

    const meshes = []
    let mIdx = 0

    let doNext = () => {

      meshes[mIdx % meshes.length].visible = false
      mIdx += 1
      meshes[mIdx % meshes.length].visible = true


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


    this.events.on(VIS + '::visOn', _ => group.visible = true)
    this.events.on(VIS + '::visOff', _ => group.visible = false)


    this.events.on(VIS + '::doNext', p => doNext())

    const conf = {on:false, doNext: doNext}

    this.events.on(VIS + '::data', data => {

       this.loader.load('assets/Executed/particle.png', (particleImg) => {

        data.forEach(s => {
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
              points.visible = conf.on
              //this.scene.add(points)
              group.add(points)

              meshes.push(points)

              this.events.on('tick', t => {
                points.rotation.x = -t.delta * 0.002;
                points.rotation.y = -t.delta * 0.002;
                points.rotation.z = Math.PI - t.delta * 0.004;
              })

            }))
          })

        })

        })

    })



    super.addVis(VIS, conf)

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

/*
    TWEEN.update()



    */

    }


}

export default Demo
