global.THREE = require('three')
import Scene from './Scene'

const average = require('analyser-frequency-average')
const simplex = new (require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')
const GeometryUtils = require('./utils/GeometryUtils')
const TextGeometry = require('./geometries/TextGeometry')(THREE)
const FontUtils = require('./utils/FontUtils')


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
      super(args, {
        particles: false,
        cars: false,
        buildings: false,
        floor: false
      }, new THREE.Vector3(0,30,30))


      this.textMesh = null;

        this.floor = {
          height: 0
        }

        this.street = {
          speed: 0.5
        }

        this.scene.fog = new THREE.FogExp2( 0x000000, 0.0009 );

        this.createText()

        this.createBackground()
        this.createStreet()
        this.createBuildings()
        this.createCars()
        this.createParticles()
        this.createFloor()


        //this.createTriangles()
        //this.createFlyingLine()
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

    createBuildings() {

      let generateTexture = () => {
        var canvas  = document.createElement( 'canvas' )
        canvas.width  = 32
        canvas.height = 64
        var context = canvas.getContext( '2d' )
        context.fillStyle = '#ffffff';
        context.fillRect( 0, 0, 32, 64 );
         // draw the window rows - with a small noise to simulate light variations in each room
        for( var y = 2; y < 64; y += 2 ){
            for( var x = 0; x < 32; x += 2 ){
                var value   = Math.floor( Math.random() * 64 );
                context.fillStyle = 'rgb(' + [value, value, value].join( ',' )  + ')';
                context.fillRect( x, y, 2, 1 );
            }
        }
        var canvas2 = document.createElement( 'canvas' );
        canvas2.width    = 512;
        canvas2.height   = 1024;
        var context = canvas2.getContext( '2d' );
        // disable smoothing
        context.imageSmoothingEnabled        = false;
        // then draw the image
        context.drawImage( canvas, 0, 0, canvas2.width, canvas2.height );
        // return the just built canvas2
        return canvas2;
      }

      let texture   = new THREE.Texture( generateTexture() )
      //texture.anisotropy  = this.renderer.getMaxAnisotropy()
      //texture.needsUpdate = true


      this.loader.load(
          '/assets/Intro/window.jpg', (sprite) => {


					let windowMaterial = new THREE.PointsMaterial( {
            size: 20,
            map: sprite,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent : true,
            fog: true
          } );

      const SIZE = {x:100, y: 300, z:100}


      const buildings = []
        for( var i = 0; i < NUM_RIBBONS * 3; i ++ ){

            let building = new THREE.Object3D()

            let geometry = new THREE.CubeGeometry( 1, 1, 1 ),
               windowPoints = THREE.GeometryUtils.randomPointsInGeometry(geometry, random(5, 10))
            geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0.5, 0 ) );


            //var material = new THREE.MeshLambertMaterial({color: 0x3d5c5c, fog:true, wireframe: false})
          var material  = new THREE.MeshLambertMaterial({
            map     : texture
            //vertexColors    : THREE.VertexColors
          });

            var mesh = new THREE.Mesh( geometry, material );

            // put a random scale
                const sx = random(SIZE.x, SIZE.x*2),
                      sy = random(SIZE.y, SIZE.y*2),
                      sz = sx

               building.scale.set(sx,sy, sz)


              // put a random position
              let coin = randomInt(0,1) ? -1 : 1
              building.position.x = STREET_WIDTH + sx * 0.5 * coin
              building.position.z   = -1 * random(0, STREET_LENGTH)
              building.rotation.z = Math.PI * 0.1 * coin
              //mesh.position.z   = 200

              // put a random rotation
              building.rotation.y   = random(0, Math.PI*2)



            //this.scene.add(mesh)


            let windowGeometry = new THREE.Geometry();

            windowPoints.forEach(p => {
              windowGeometry.vertices.push( p );
            })
            windowGeometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0.5, 0 ) );
            let windowParticles = new THREE.Points( windowGeometry, windowMaterial );

            building.add(mesh)
            building.add(windowParticles)
            this.scene.add(building)
            buildings.push(building)

        }

      this.events.on('tick', t => {

        buildings.forEach((b, i) => {

          b.visible = this.show.buildings

          let r = Math.sin((t.time + b.position.z * 0.2) * 0.02)

            b.position.x = (r * 15) + b._xoffset
            b.position.y = r * 8 + b._yoffset

            b.position.z += this.street.speed * 8

            //let delta = Math.abs(100 * simplex.noise2D(i, this.shaderTime * 0.09 * this.street.speed))
            //b.scale.y = Math.max(30, delta)
            //b.translateY( delta / 4 );

            if (b.position.z > 0) {
                b.position.z = STREET_LENGTH * -1
                let coin = randomInt(0,1) ? -1 : 1
                b._xoffset = random(STREET_WIDTH * 2, STREET_WIDTH * 3) * coin
                //b.rotation.z = Math.PI * 0.1 * coin

                b._yoffset = 30 * Math.sin((70 - Math.abs(b._xoffset)) * 1/(130 - 70))
            }

          })

      })

          })
    }



    createParticles() {

      const NUM = 500

      let geometry = new THREE.Geometry();

      for (let i = 0; i < NUM; i ++ ) {

					var vertex = new THREE.Vector3();

          vertex.x = random(0, PLANE_SIZE.X) - PLANE_SIZE.X*0.5
          vertex.z = random(0, -PLANE_SIZE.Z)

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


          this.events.on('tick', t => {

            particles.visible = this.show.particles

            const analyserNode = this.analyser.analyser
            const freqs = this.analyser.frequencies()
            let avg = average(analyserNode, freqs, 20, 60)
            material.size = 20 + avg * 20
            material.needsUpdate = true

            for (let i = 0; i < geometry.vertices.length; i ++ ) {

              let v = geometry.vertices[i]

              v.y = Math.abs( Math.sin((i + t.time * 0.004 * this.street.speed)) * 40 * v._height )
              v.z += this.street.speed * v._speed
              if (v.z > 0) {
                v.z = -STREET_LENGTH
                v._speed = random(1, 10)
                v._height = random(1, 5)
              }

            }
            geometry.verticesNeedUpdate = true
          })

        })

    }

    createCars() {

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
                for (var i = 0; i < 5; i++) {
                  let pair = []
                  for (let j = 0; j < 2; j++) {

                          let sprite = new THREE.Sprite(mat)
                          sprite.scale.set(90, 40, 1.0);
                          //sprite.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.75);
                          //sprite.position.setLength(200 * Math.random());
                          sprite.material.blending = THREE.AdditiveBlending;
                          sprite.rotation.x = Math.PI * Math.random()

                          sprite.position.set(j*10, 0, 0)



                          scene.add(sprite)
                          pair.push(sprite)

                  }
                  let z = -1 * random(50, STREET_LENGTH)
                  pair[0].position.z = pair[1].position.z = z

                  pair._speed = random(1, 1.5)

                  pairs.push(pair)

                }
                return pairs
              }

              let backs = add(matBack, this.scene)
              let fronts = add(matFront, this.scene)

              this.events.on('tick', t => {
                if (this.show.cars) {
                let zoffset = random(60, 100)

                fronts.forEach((l, i) => {



                  let back = backs[i]

                  l.forEach((s,j) => {
                    s.visible = this.show.cars

                    let pos = s.position

                    let z = pos.z + this.street.speed * 8 * l._speed
                    let r = Math.sin((t.time + z * 0.2) * 0.02)
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

                    s.visible = this.show.cars


                    let pos = s.position

                    let z = pos.z - this.street.speed * 8
                    let r = Math.sin((t.time + z * 0.2) * 0.02)
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
          })

    }

    createStreet() {

        let geom = new THREE.PlaneBufferGeometry(3, (RIBBON_LENGTH + RIBBON_GAP) * NUM_RIBBONS, 2, 2)
        let mat = new THREE.LineBasicMaterial( {color: 0xffffff, linewidth: 5} )
        let mesh = new THREE.Mesh(geom, mat)
        mesh.rotation.x = Math.PI * 0.5

        let left = new THREE.Line(new THREE.Geometry(), mat);
        this.scene.add(left)

        let right = new THREE.Line(new THREE.Geometry(), mat);
        this.scene.add(right)

        let middle = []
        for (let i=1; i < NUM_RIBBONS+1; i++) {
            let geom = new THREE.PlaneGeometry(5, RIBBON_LENGTH, 2, 2)
            let mat = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} )

            let mesh = new THREE.Mesh(geom, mat)
            mesh.rotation.x = Math.PI * 0.5

            mesh.position.z = (RIBBON_GAP + RIBBON_LENGTH) * i * -1

            this.scene.add(mesh)
            middle.push(mesh)
        }

        this.scene.add(new THREE.AmbientLight(0xffffff))

        this.events.on('tick', t => {

          let pos_left = [],
            pos_right = [],
              pos_middle = []

          middle.forEach((m, i) => {

              m.position.z += this.street.speed * 8
              let r = Math.sin((t.time + m.position.z * 0.2) * 0.02)
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

        let geometry = new THREE.BufferGeometry();
        geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(PARTICLES_AMOUNT * 3), 3 ));
        geometry.addAttribute( 'extras', new THREE.BufferAttribute( new Float32Array(PARTICLES_AMOUNT * 2), 2 ) );

        let material = new THREE.ShaderMaterial( {

            uniforms: {
                uTime: { type: 'f', value: 0 },
                uAnimation: { type: 'f', value: 0 },
                uOffset: { type: 'v2', value: new THREE.Vector2() }
            },
            //attributes: geometry.attributes,
            vertexShader: glslify(__dirname + '/glsl/Intro_Text.vert'),
            fragmentShader: glslify(__dirname + '/glsl/Intro_Text.frag'),
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: true,
            depthTest: false
        } );

        this.textMesh = new THREE.Points( geometry, material );
        this.scene.add( this.textMesh );


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

    createFloor() {
        var gridHelper = new THREE.GridHelper(100, 10);
        this.scene.add( gridHelper );


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
                    value: this.speed
                },
                height: {
                    type: "f",
                    value: this.height
                },
                noise_elevation: {
                    type: "f",
                    value: 1.0
                },
            },
            transparent: true,
            fragmentShader: glslify(__dirname + '/glsl/Intro_Terrain.frag'),
            vertexShader: glslify(__dirname + '/glsl/Intro_Terrain.vert')
            //wireframe: true
        });

        let geometry = new THREE.PlaneGeometry(PLANE_SIZE.X, PLANE_SIZE.Z, 20, 20);
        let mesh = new THREE.Mesh(geometry, planeMaterial);

        mesh.rotation.set(-Math.PI * 0.5, 0, 0)
        mesh.position.y = -50//-window.innerHeight * 0.15
        this.scene.add(mesh)

        this.events.on('tick', t => {
          mesh.visible = this.show.floor
          mesh.material.uniforms.time.value += t.delta / 10
          mesh.material.uniforms.speed.value = this.street.speed;
          mesh.material.uniforms.height.value = this.floor.height;
        })

    }

    startGUI(gui) {
        gui.add(this.street, 'speed', 0, 1)
        gui.add(this.floor, 'height', 0, 1)

        //gui.add(this, 'introText').onChange(this.updateText.bind(this));
        //gui.add(this.textMesh.material.uniforms.uAnimation, 'value', 0, 1).name('animation').listen()
        //gui.add(this, 'updateText')

        //gui.add(this, 'updateIntroText')

//        this.gui.add(this, 'flyingSpeed', 0, 20)

        //gui.add(this, 'leave')
    }

    leave() {

        let tchain = Tween()


        this.triangles.forEach(t => {


            tchain.chain(

            t.position, {
              x: random(-50, 50),
              y: random(-50, 50),
              z: random(CAMERA_Z_START + 10 , CAMERA_Z_START + 100),
              duration: 2
            }
            )
            tchain.chain(
            t.rotation, {
              x: random(-Math.PI * 2, Math.PI * 2),
              y: random(-Math.PI, Math.PI),
              z: random(-Math.PI, Math.PI),
              duration: 2
            }
            )
        })

        let lchain = Tween()
        this.flyingLines.forEach(f => {
            lchain.chain(
            f.position, {
              x: MathF.random(-200, 200),
              y: MathF.random(-200, 200),
              z: MathF.random(CAMERA_Z_START + 10 , CAMERA_Z_START + 100),
              duration: 4
            }
            )
        })
        lchain.then(this.floor.plane.position, {
              z: MathF.random(200, 500),
              duration: 2
            })

        tchain.then(lchain)

        tweenr.to(tchain)
    }

    tick(time, delta) {
    }

    tick2(time, delta) {

        this.textMesh.material.uniforms.uTime.value += 0.003;
        this.textMesh.material.uniforms.uOffset.value.set(-window.innerWidth / 2, -window.innerHeight / 2);


        let fixedScale = 2 * Math.tan(this.camera.fov / 360 * Math.PI) / window.innerHeight;

        this.textMesh.position.copy(this.camera.position);
        this.textMesh.rotation.copy(this.camera.rotation);
        this.textMesh.position.z -= 780
        this.textMesh.position.x += window.innerWidth / 2
        this.textMesh.position.y -= window.innerHeight / 4


/*
        this.triangles.forEach((t, i) => {
            t.material.uniforms.time.value = this.floor.plane.material.uniforms.time.value
            t.material.uniforms.speed.value = this.floor.plane.material.uniforms.speed.value
            t.material.uniforms.dist.value = 1 - (t.position.z / (this.camera.position.z - TRIANGLE_GAP * NUM_TRIANGLES))
        })

        this.flyingLines.forEach((t, i) => {
            t.material.uniforms.time.value += (this.shaderTime + i * 5) * 0.001
            t.material.uniforms.speed.value = this.floor.plane.material.uniforms.speed.value
        })
        */

    }
}

export
default IntroScene
