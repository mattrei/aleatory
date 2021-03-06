global.THREE = require('three')
import Scene from './Scene'

const simplex = new (require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')
const clamp = require('clamp')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')
const GeometryUtils = require('../utils/GeometryUtils')
const TextGeometry = require('../geometries/TextGeometry')(THREE)
const FontUtils = require('../utils/FontUtils')
require('../utils/THREE.MeshLine')

const smoothstep = require('smoothstep')

const PARTICLES_AMOUNT = 300000

const FLY_CURVE = 20
const MAX_POINTS = 500
const TRIANGLE_GAP = 500
const NUM_RIBBONS = 25
const RIBBON_LENGTH = 50
const RIBBON_GAP = 100
const RIBBON_START = NUM_RIBBONS * RIBBON_GAP * -1
const STREET_LENGTH = (RIBBON_LENGTH + RIBBON_GAP) * NUM_RIBBONS
const STREET_WIDTH = 50
const PLANE_SIZE = {X: window.innerWidth * 2, Z: STREET_LENGTH}



class IntroScene extends Scene {
    constructor(args) {
      super(args, new THREE.Vector3(0,0,50))

        //this.scene.fog = new THREE.FogExp2( 0x000000, 0.0009 );

        this.createText()
        //this.background()
        this.street()
        this.buildings()
        this.cars()
        this.createParticles()
        this.floor()
        this.visparticles()
        this.city()

//        this.xtion()

        //this.createTriangles()
        //this.createFlyingLine()
    }

    visparticles() {
     const VIS = 'visparticles'
     const conf = {on: false}
     const group = new THREE.Group()
     group.visible = conf.on
     this.scene.add(group)

      class StarParticle {
        constructor(args) {
          this._vertex = args.vertex
          this._position = new THREE.Vector3()
          this._initialForce = new THREE.Vector3()
          this._velocity = new THREE.Vector3()
          this._vec = new THREE.Vector3()
          this._zoom = new THREE.Vector3()
          this._max = random(10000, 25000)
          this._amount = 0
          this._fx = new THREE.Vector3()
        }
       init(position, force) {
            this._vertex.copy(position);
            this._position.copy(position);
            this._initialForce.copy(force).multiplyScalar(0.25);
            this._initialForce.x = clamp(this._initialForce.x, -10, 10);
            this._initialForce.y = clamp(this._initialForce.y, -10, 10);

            this._velocity.add(new THREE.Vector3(0, 0, 10));
            if (!random(0, 5)) _zoom.z = 1;

            this._vec.set(random(-10, 10) / 5, random(-10, 10) / 5, random(-10, 10) / 5);
            this._initialForce.add(this._vec);
        }

        rise(deltaY) {
          //this._position.add(this._initialForce);
          //this._position.add(this._zoom);
          //this._position.add(this._velocity);
          this._vertex.copy(this._position);

          this._fx.set(0, 0, 0)
          this._fx.y = deltaY

          //this._position.set(this._fx);
          this._position.y = this._fx.y
        }

        update(mouse, delta) {
            if (this._position.z < -this._max) return;
            this._position.add(this._initialForce);
            this._position.add(this._zoom);
            this._position.add(this._velocity);
            this._vertex.copy(this._position);

            this._zoom.z *= 1.0095;

            if (this._initialForce.z > -10) this._initialForce.z -= 0.009;

            this._velocity.multiplyScalar(0.9);

            this._vec.subVectors(mouse, this._position);
            var dSq = this._vec.lengthSq();

            var f = dSq / 40000;
            f = f < 0 ? 0.1 : f > 1 ? 1 : f;

            var a = Math.atan2(this._vec.y, this._vec.x);

            this._fx.set(0, 0, 0);
            this._fx.x += Math.cos(a) * this._amount;
            this._fx.y += Math.sin(a) * this._amount;
            this._velocity.add(this._fx);

          //console.log(this._vertex)
        }
      }

     const particles = []
     const pool = []
     let poolIdx = 0
     const MAX_PARTICLES =  2000,
      START_PARTICLES = 80

     this.loader.load('/assets/star.png', (starTexture) => {
       this.loader.load('/assets/palette.jpg', (paletteTexture) => {

       const geometry = new THREE.Geometry(),
             material = /*new THREE.PointsMaterial( {
               map: starTexture, size: 1, color: 0xff0000} );
             */

             new THREE.ShaderMaterial({
               uniforms: {
                palette: {
                    type: "t",
                    value: paletteTexture
                },
                map: {
                    type: "t",
                    value: starTexture
                },
                size: {
                    type: "f",
                    value: 10
                },
                opacity: {
                    type: "f",
                    value: 0.75
                },
                area: {
                    type: "f",
                    value: 3000
                }
               },
               vertexShader: glslify('./glsl/Intro/Stars.vert'),
               fragmentShader: glslify('./glsl/Intro/Stars.frag'),
               transparent: true,
               depthTest: false,
               blending: THREE.AdditiveBlending,
             })


         // fill pool
          for (var i = 0; i < MAX_PARTICLES; i++) {
            const vertex = new THREE.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)
            //const vertex = new THREE.Vector3(random(0, 100),random(0,100),0)

            const p = new StarParticle({vertex: vertex})
            geometry.vertices.push(vertex)
            //B.scale.value[D] = Utils.doRandom(3, 10) / 10;
            //B.alpha.value[D] = Utils.doRandom(3, 10) / 10;
            let mouse = new THREE.Vector3(),
                force = new THREE.Vector3(-0.01, 0.02, 0)
            pool.push(p)
            //p.init(mouse, force)
            //particles.push(p)
          }

         const mesh = new THREE.Points(geometry, material)
         group.add(mesh)

         let isIntro = true,
          intro = {
            height: 0,
            mesh: null,
            geometry: new THREE.Geometry(),
            particles: []
          }

         const j = new THREE.Vector3(),
               lastMouse = new THREE.Vector3(),
               mouse = new THREE.Vector3()// todo
         this.events.on('tick', t => {

           if (!isIntro) {

             const freq = super.getFreq(200, 400)
             mouse.z += 0.1
             mouse.y = freq * 500

              var delta = j.subVectors(mouse, lastMouse).length()

              particles.forEach(p => {
                  p.update(mouse, delta);
              })
              lastMouse.copy(mouse)

              geometry.verticesNeedUpdate = true
               // get new particles from pool
            for (var i = 0; i < 8; i++) {
               let o = pool[poolIdx++ % MAX_PARTICLES]
               let force = new THREE.Vector3(random(-10,10), random(-10,10), random(-1,1))
               o.init(mouse, force)
              particles.push(o)
            }
          } else {

            intro.particles.forEach(p => {
                p.rise(intro.height)
            })
            intro.geometry.verticesNeedUpdate = true
          }
         })
         this.events.on(VIS+'::visOn', _ => {
           group.visible = true

           for (let i = 0; i< START_PARTICLES; i++) {
             let force = new THREE.Vector3(0, random(0,10), 0),
              pos = new THREE.Vector3(random(-100,100), random(0,10), random(-100,100))


              const vertex = new THREE.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)
              const p = new StarParticle({vertex: vertex})
              geometry.vertices.push(vertex)
              p.init(pos, force)
              intro.particles.push(p)


              intro.mesh = new THREE.Points(intro.geometry, material)


           }
           tweenr.to(intro, {height:500, duration: 5})
           tweenr.to(this.camera.position, {y:500, duration: 5})
            .on('complete', _ => {
              isIntro = false
              super.fadeOut(intro.mesh, 2)
            })


         })
         this.events.on(VIS+'::visOff', _ => group.visible = false)


       })
     })

     super.addVis(VIS, conf)
  }

  xtion() {
     const VIS = 'xtion'
     const conf = {on: false}
     const group = new THREE.Group()
     group.visible = conf.on
     this.scene.add(group)

     const width = 640, height = 480;
		 const nearClipping = 850, farClipping = 4000;

     let geometry = new THREE.BufferGeometry();
		 let vertices = new Float32Array( width * height * 3 );

					for ( let i = 0, j = 0, l = vertices.length; i < l; i += 3, j ++ ) {

						vertices[ i ] = j % width;
						vertices[ i + 1 ] = Math.floor( j / width );

					}

		geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );


			let material = new THREE.ShaderMaterial( {

						uniforms: {

							"map": { type: "t", value: null },
							"width": { type: "f", value: width },
							"height": { type: "f", value: height },
							"nearClipping": { type: "f", value: nearClipping },
							"farClipping": { type: "f", value: farClipping },

							"pointSize": { type: "f", value: 2 },
							"zOffset": { type: "f", value: 1000 }

						},
						vertexShader: glslify('./glsl/Xtion.vert'),
						fragmentShader: glslify('./glsl/Xtion.frag'),
						blending: THREE.AdditiveBlending,
						depthTest: false,
            depthWrite: false,
						transparent: true

					} );

		let mesh = new THREE.Points( geometry, material )
    group.add( mesh )


    let lastTexture = null
    this.events.on(VIS+'::data', data => {
       //console.log("got")
       //console.log(data)

      this.loader.load(data.img, (texture) => {

        mesh.material.uniforms.map.value = texture
        mesh.material.needsUpdate = true

        if (lastTexture) lastTexture.dispose()
        lastTexture = texture
      })
     })


     super.addVis(VIS, conf)

  }

    background() {

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
		      '/assets/Intro/eso_dark.jpg', (texture) => {
            var geometry = new THREE.SphereGeometry(3000, 60, 40);
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
            this.scene.add(skyBox);
          })


    }

    buildings() {

      const VIS = 'buildings'
      let conf = {on:false, speed: 1}
      const group = new THREE.Group()
      group.visible = conf.on
      this.scene.add(group)


      const canvas  = document.createElement( 'canvas' ),
          context = canvas.getContext( '2d' );
      const smCanvas  = document.createElement( 'canvas' ),
            smContext = smCanvas.getContext( '2d' )
      smCanvas.width  = 32

      canvas.width  = 512
      canvas.height = 1024
      let texture   = new THREE.Texture( canvas )
      texture.anisotropy  = this.renderer.getMaxAnisotropy()

      this.events.on('tick', t => {
          const freq = super.getFreq(40, 60)
          const height = 64 + freq * 64
          smCanvas.height = height

          smContext.fillStyle = '#ffffff';
          smContext.fillRect( 0, 0, 32, height );
           // draw the window rows - with a small noise to simulate light variations in each room
          for( var y = 2; y < height; y += 2 ){
              for( var x = 0; x < 32; x += 2 ){
                  var value   = Math.floor( x % 6 );
                  smContext.fillStyle = 'rgb(' + [value, value, value].join( ',' )  + ')';
                  smContext.fillRect( x, y, 2, 1 );
              }
          }

        context.imageSmoothingEnabled = false
        context.drawImage( smCanvas, 0, 0, canvas.width, canvas.height );

        texture.needsUpdate = true
      })

      const meshes = []

      const SIZE = {x:80, y: 400, z:80}


        for( var i = 0; i < NUM_RIBBONS; i ++ ){

            let building = new THREE.Object3D()

            let geometry = new THREE.CubeGeometry( 1, 1, 1 ),
               windowPoints = THREE.GeometryUtils.randomPointsInGeometry(geometry, random(5, 10))
            geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0.5, 0 ) );


            var material = new THREE.MeshLambertMaterial({
              map: texture,
              vertexColors : THREE.VertexColors,
              color: 0x3d5c5c, fog:false, wireframe: false,
               transparent: true})
          //var material  = new THREE.MeshNormalMaterial()

            var mesh = new THREE.Mesh( geometry, material );

            // put a random scale
                const sx = random(SIZE.x, SIZE.x*2),
                      sy = random(SIZE.y, SIZE.y*2),
                      sz = sx

               building.scale.set(sx,sy, sz)


              // put a random position
              //const leftRight = randomInt(0,1) ? -1 : 1
              //building.position.x = STREET_WIDTH * 3 * leftRight
              building.position.z   = -1 * random(0, STREET_LENGTH)
              //building.rotation.z = Math.PI * 0.05 * leftRight
              //mesh.position.z   = 200

              // put a random rotation
              //building.rotation.y   = random(0, Math.PI*2)

            let windowGeometry = new THREE.Geometry();

            windowPoints.forEach(p => {
              windowGeometry.vertices.push( p );
            })
            windowGeometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0.5, 0 ) );

            building.add(mesh)

            meshes.push(building)
            group.add(building)

        }

      this.events.on('tick', t => {

        meshes.forEach((b, i) => {


          const r = this._streetFunc(b.position.z, t.time)

            b.position.x = (r * 15) + b._xoffset
            b.position.y = r * 8 + b._yoffset

            b.position.z += conf.speed * 8

            if (b.position.z > 0) {
                b.position.z = STREET_LENGTH * -1
                let coin = randomInt(0,1) ? -1 : 1
                b._xoffset = random(STREET_WIDTH * 3, STREET_WIDTH * 4) * coin
                b.rotation.z = -Math.PI * 0.02 * coin

                b._yoffset = 30 * Math.sin((70 - Math.abs(b._xoffset)) * 1/(130 - 70))
            }
          })
      })

      this.events.on(VIS+'::visOn', _ => super.fadeIn(group, 5))
      this.events.on(VIS+'::visOff', _ => group.visible = false)

      super.addVis(VIS, conf)
    }

    city() {
      const VIS = 'city'
      let conf = {on:true}
      const group = new THREE.Group()
      group.visible = conf.on
      this.scene.add(group)

      const NUM_BUILDINGS = 100,
        MAX_HEIGHT = 50,
        MAX_WIDTH = 10,
        MAX_RADIUS = NUM_BUILDINGS / 2
      const meshes = []

      for( var i = 0; i < NUM_BUILDINGS; i ++ ){
        //console.log(1-Math.sin(i/NUM_BUILDINGS))
        const factor = i/NUM_BUILDINGS //1-Math.pow(i/NUM_BUILDINGS, 2)

          let geometry = new THREE.CubeGeometry( 1, 1, 1 ),
             windowPoints = THREE.GeometryUtils.randomPointsInGeometry(geometry, random(5, 10))
          geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0.5, 0 ) );

          var material = new THREE.MeshLambertMaterial({
            //map: texture,
            vertexColors : THREE.VertexColors,
            color: 0x3d5c5c, fog:false, wireframe: true,
             transparent: true})
        //var material  = new THREE.MeshNormalMaterial()

          const size = (1-Math.pow(factor,2)),
            scale = MAX_WIDTH * size,
            height = MAX_HEIGHT * (1-Math.pow(factor,0.2)),
            //maxRadius = Math.pow(1-factor, 2) * MAX_RADIUS,
            //radius = smoothstep(0, MAX_RADIUS, factor * MAX_RADIUS), //Math.sqrt(Math.random(0,1)) * maxRadius,
            radius = (Math.pow(factor,0.6) * MAX_RADIUS),
            angle = random(0, Math.PI * 2)

          console.log(factor + ' ' + size  + ' ' + radius + '  ' + angle)
          var mesh = new THREE.Mesh( geometry, material )

          mesh.scale.set(scale, height, scale)
          const x = radius * Math.cos(angle) + scale * 0.5,
            z = radius * Math.sin(angle) + scale + 0.5

          mesh.position.set(x, 0, z)

          meshes.push(mesh)
          group.add(mesh)
        }

        super.addVis(VIS, conf)

        this.events.on(VIS+'::visOn', _ => this.fadeIn(group, 5))
        this.events.on(VIS+'::visOff', _ => this.fadeOut(group, 10))
    }


    createParticles() {

      const VIS = 'particles'
      let conf = {on: false, speed: 1, height: 1}

      const NUM = 500

      let geometry = new THREE.Geometry();

      for (let i = 0; i < NUM; i ++ ) {

					var vertex = new THREE.Vector3();

          //vertex.x = random(0, PLANE_SIZE.X) - PLANE_SIZE.X*0.5
          //vertex.z = random(0, -PLANE_SIZE.Z)

          vertex._height = random(1, 5)
          vertex._speed = random(1, 10)

					geometry.vertices.push( vertex );
			}



      this.loader.load(
          '/assets/Intro/particle.png', (sprite) => {


					let material = new THREE.PointsMaterial( {
            size: 40,
            map: sprite,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent : true,
            fog: true
          } );


          let particles = new THREE.Points( geometry, material );
          this.scene.add(particles)


          this.events.on(VIS + '::visOn', t => {
              conf.on = true
              geometry.vertices.forEach(v => {
                v.x = THREE.Math.randFloatSpread(PLANE_SIZE.X)
                v.z = random(-PLANE_SIZE.Z, -PLANE_SIZE.Z*2)
              })
          })

          this.events.on(VIS + '::visOff', _ => conf.on = false)


          this.events.on('tick', t => {

            particles.visible = conf.on

            const freq = super.getFreq(20, 60)

            material.size = 20 + freq * 20
            material.needsUpdate = true

            for (let i = 0; i < geometry.vertices.length; i ++ ) {

              let v = geometry.vertices[i]

              v.y = Math.abs( Math.sin((i + t.time * 0.4 * conf.speed)) * 40 * v._height * conf.height )
              v.z += conf.speed * v._speed
              if (v.z > 0) {
                  v.z = -STREET_LENGTH
                  v._speed = random(1, 10)
                  v._height = random(1, 5)
              }

            }
            geometry.verticesNeedUpdate = true
          })



          super.addVis(VIS, conf)
        })



    }

    _streetFunc(z, time) {
      return simplex.noise2D(z * 0.0002, time * 1)

    }

    cars() {

      const VIS = 'cars'
      let conf = {on:false, speed: 1}
      let group = new THREE.Group()
      this.scene.add(group)
      group.visible = conf.on

      const NUM = 8

      this.loader.load(
		      '/assets/Intro/cloud.png', (texture) => {

            let matFront = new THREE.SpriteMaterial({
                  map: texture,
                  color: 0xded95f,
                  fog: true
                }),
                matBack = new THREE.SpriteMaterial({
                      map: texture,
                      color: 0xff0000,
                      fog: true
                    })



              function add(mat, scene) {
                const pairs = []
                for (var i = 0; i < NUM; i++) {
                  let pair = []
                  for (let j = 0; j < 2; j++) {

                          let sprite = new THREE.Sprite(mat)
                          sprite.scale.set(90, 40, 1.0);
                          //sprite.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.75);
                          //sprite.position.setLength(200 * Math.random());
                          sprite.material.blending = THREE.AdditiveBlending;
                          sprite.rotation.x = Math.PI * Math.random()

                          sprite.position.set(j*10, 0, 0)

                          sprite.visible = false

                          group.add(sprite)
                          pair.push(sprite)

                  }
                  let z = -1 * random(50, STREET_LENGTH)
                  pair[0].position.z = pair[1].position.z = z

                  pair._speed = random(1, 1.5)

                  pairs.push(pair)

                }
                return pairs
              }

              let backs = add(matBack, group)
              let fronts = add(matFront, group)

              this.events.on(VIS + '::visOn', _ => this.fadeIn(group, 2))
              this.events.on(VIS + '::visOff', _ => this.fadeOut(group, 4))

              this.events.on('tick', t => {
                if (conf.on) {
                let zoffset = random(60, 100)

                fronts.forEach((l, i) => {

                  let back = backs[i]

                  l.forEach((s,j) => {
                    s.visible = conf.on

                    let pos = s.position

                    let z = pos.z + conf.speed * 8 * l._speed
                    //let r = Math.sin((t.time + z * 0.2) * 0.02)
                    const r = this._streetFunc(z, t.time)
                    let x = r * 15 + (j*15) - STREET_WIDTH / 2,
                      y = r * 8


                    if (z > 0) {
                        z = STREET_LENGTH * -1
                        z -= zoffset
                    }
                    s.position.set(x,y,z)
                  })
                })

                backs.forEach((l, i) => {


                  l.forEach((s,j) => {

                    s.visible = conf.on


                    let pos = s.position

                    let z = pos.z - conf.speed * 8
                    //let r = Math.sin((t.time + z * 0.2) * 0.02)
                    const r = this._streetFunc(z, t.time)


                    let x = r * 15 + (j*15) + STREET_WIDTH / 2,
                      y = r * 8


                    if (z < -STREET_LENGTH) {
                        z = 0
                        z += zoffset
                    }
                    s.position.set(x,y,z)
                  })
                })
                }
              })

              super.addVis('cars', conf)
          })

    }

    street() {
      const VIS = 'street'
      let conf = {on: false, speed: 1}

      let group = new THREE.Group()
      this.scene.add(group)
      group.visible = conf.on

        let geom = new THREE.PlaneBufferGeometry(3, (RIBBON_LENGTH + RIBBON_GAP) * NUM_RIBBONS, 2, 2)
        let mat = new THREE.LineBasicMaterial( {color: 0xffffff, linewidth: 5, transparent: true} )
        let mesh = new THREE.Mesh(geom, mat)
        mesh.rotation.x = Math.PI * 0.5

        let left = new THREE.Line(new THREE.Geometry(), mat);
        group.add(left)

        let right = new THREE.Line(new THREE.Geometry(), mat);
        group.add(right)

        let middle = []
        for (let i=1; i < NUM_RIBBONS+1; i++) {
            let geom = new THREE.PlaneGeometry(5, RIBBON_LENGTH, 2, 2)
            let mat = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide, transparent: true} )

            let mesh = new THREE.Mesh(geom, mat)
            mesh.rotation.x = Math.PI * 0.5

            mesh.position.z = (RIBBON_GAP + RIBBON_LENGTH) * i * -1

            group.add(mesh)
            middle.push(mesh)
        }

        this.scene.add(new THREE.AmbientLight(0xffffff))

        this.events.on(VIS+'::visOn', _ => this.fadeIn(group, 2))
        this.events.on(VIS+'::visOff', _ => this.fadeOut(group, 2))

        this.events.on('tick', t => {

          let pos_left = [],
            pos_right = [],
              pos_middle = []

          middle.forEach((m, i) => {

              m.position.z += conf.speed * 8


              //let r = Math.sin((t.time + m.position.z * 0.2) * 0.02)
              //const r = simplex.noise2D(m.position.z * 0.0002, t.time * 0.5)
              const r = this._streetFunc(m.position.z, t.time)



              m.position.x = r * 15
              m.position.y = r * 8
              m.rotation.z = r * 0.05


              if (m.position.z > 0) {//this.camera.position.z) {
                  m.position.z = (NUM_RIBBONS * (RIBBON_GAP + RIBBON_LENGTH) * -1)
              }


            pos_middle.push(new THREE.Vector3(r*15, r*8, m.position.z))
            pos_left.push(new THREE.Vector3((r*15) - STREET_WIDTH, r*8, m.position.z))
              pos_right.push(new THREE.Vector3((r*15) + STREET_WIDTH, r*8, m.position.z))
          })

          pos_middle.sort((a,b) => a.z - b.z)
          pos_left.sort((a,b) => a.z - b.z)
          pos_right.sort((a,b) => a.z - b.z)

          left.geometry.vertices = pos_left
          left.geometry.verticesNeedUpdate = true

          right.geometry.vertices = pos_right
          right.geometry.verticesNeedUpdate = true

        })

        super.addVis(VIS, conf)
    }

    intro(text) {
      const DUR = 2
      let shapes = THREE.FontUtils.generateShapes( text, {
          font: "oswald",
          weight: "normal",
          size: 15
        } );
      let geo = new THREE.ShapeGeometry( shapes ),
          mat = new THREE.MeshBasicMaterial({color: 0xffffff}),
          mesh = new THREE.Mesh( geo, mat );
      geo.center()
      mesh.scale.set(0,0,0)
      mesh.position.set(0,this.camera.position.y,50)
      this.scene.add(mesh)

      let chain = Tween()

      chain.chain(mesh.scale,
                {x: 5, y:5, z:1, duration: DUR/2})

      chain.chain(mesh.position,
                {x: 0, y:window.innerHeight / 4, z:-STREET_LENGTH/4, duration: DUR/2})

      chain.then(mesh.position, {duration: DUR})

      let out = Tween()

      out.chain(mesh.scale, {x:0,y:0, z:0, duration: DUR/2})
      out.chain(mesh.position, {x: 0, y:0, z: -STREET_LENGTH, duration: DUR/2})

      chain.then(out)
      tweenr.to(chain)

    }

    outro(text) {
       const DUR = 2
        let shapes = THREE.FontUtils.generateShapes( text, {
          font: "oswald",
          weight: "normal",
          size: 15
        } );
      let geo = new THREE.ShapeGeometry( shapes ),
          mat = new THREE.MeshBasicMaterial({color: 0xffffff}),
          mesh = new THREE.Mesh( geo, mat );
      geo.center()
      mesh.scale.set(0,0,0)
      mesh.position.set(0,0,-STREET_LENGTH)
      this.scene.add(mesh)

      let chain = Tween()

      chain.chain(mesh.scale,
                {x: 5, y:5, z:1, duration: DUR/2})

      chain.chain(mesh.position,
                {x: 0, y:window.innerHeight / 4, z:-STREET_LENGTH/4, duration: DUR/2})

      chain.then(mesh.position, {duration: DUR})

      let out = Tween()

      out.chain(mesh.scale, {x:0,y:0, z:0, duration: DUR/2})
      out.chain(mesh.position, {x: this.camera.position.x, y:this.camera.position.y, z:50, duration: DUR/2})

      chain.then(out)
      tweenr.to(chain)
    }



    createText() {

      let conf = {on: false, text: ''}

        let geometry = new THREE.BufferGeometry();
        geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(PARTICLES_AMOUNT * 3), 3 ));
        geometry.addAttribute( 'extras', new THREE.BufferAttribute( new Float32Array(PARTICLES_AMOUNT * 2), 2 ) );

        let material = new THREE.ShaderMaterial( {
            uniforms: {
                uTime: { type: 'f', value: 0 },
                uAnimation: { type: 'f', value: 0 },
                uOffset: { type: 'v2', value: new THREE.Vector2() }
            },
            vertexShader: glslify(__dirname + '/glsl/Intro/Text.vert'),
            fragmentShader: glslify(__dirname + '/glsl/Intro/Text.frag'),
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: true,
            depthTest: false
        } );

        let mesh = new THREE.Points( geometry, material )
        mesh.visible = conf.on
        this.scene.add( mesh )


        super.addVis('text', conf)

    }

    updateText () {
        var str = this.introText
        const FONT_SIZE = 120,
            FONT_NAME = "px Arial"

        let ctx = this.canvas.getContext('2d');

        ctx.font = FONT_SIZE + FONT_NAME;
        var metrics = ctx.measureText(str);
        let width = this.canvas.width = Math.ceil(metrics.width) || 1,
            height = this.canvas.height = Math.ceil(1.1 * FONT_SIZE);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(str, 0, 1.1* FONT_SIZE * 0.9);

        let geometry = this.textMesh.geometry

        let vertices = geometry.attributes.position.array,
            extras = geometry.attributes.extras.array;

        var index;
        var data = this.ctx.getImageData(0, 0, width, height).data;
        var count = 0;
        for(var i = 0, len = data.length; i < len; i+=4) {
            if(data[i + 3] > 0) {
                index = i / 4;
                vertices[count * 3] = index % width;
                vertices[count * 3 + 1] = index / width | 0;
                extras[count * 2] = data[i + 3] / 255;
                extras[count * 2 + 1] = Math.random();
                count++;
            }
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.extras.needsUpdate = true;
        geometry.addGroup(0, count, 0)
    }

    floor() {

      const VIS = 'floor'
      let group = new THREE.Group()
      this.scene.add(group)
      let conf = {on: false, height: 1, speed: 1, segments: 20, wireframe: true}
      group.visible = conf.on

      let mesh = null
      const create = (segments) => {
        var planeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                resolution: {
                    type: "v2",
                    value: new THREE.Vector2(window.innerWidth, window.innerHeight)
                },
                time: {
                    type: "f",
                    value: 0.1
                },
                speed: {
                    type: "f",
                    value: conf.speed
                },
                height: {
                    type: "f",
                    value: conf.height
                },
                noise_elevation: {
                    type: "f",
                    value: 1.0
                },
            },
            transparent: true,
            fragmentShader: glslify(__dirname + '/glsl/Intro/Floor.frag'),
            vertexShader: glslify(__dirname + '/glsl/Intro/Floor.vert'),
            wireframe: conf.wireframe,
            wireframeLinewidth: 2,
        });

        let geometry = new THREE.PlaneBufferGeometry(PLANE_SIZE.X, PLANE_SIZE.Z, segments, segments)
        mesh = new THREE.Mesh(geometry, planeMaterial);

        mesh.rotation.set(-Math.PI * 0.5, 0, 0)
        mesh.position.y = -50//-window.innerHeight * 0.15

        group.add(mesh)



        this.events.on('tick', t => {
          mesh.material.uniforms.time.value = t.time * 0.2
          mesh.material.uniforms.speed.value = conf.speed
          mesh.material.uniforms.height.value = conf.height
        })

      }

      create(conf.segments)

      this.events.on(VIS + '::visOn', _ => group.visible = true)
      this.events.on(VIS + '::visOff', _ => group.visible = false)
        this.events.on(VIS+'::wireframe', d => mesh.material.wireframe = d)

        this.events.on(VIS+'::segments', d => {
          group.remove(mesh)
          create(d)
        })

        super.addVis(VIS, conf)

    }

    tick(time, delta) {
    }
}

export
default IntroScene
