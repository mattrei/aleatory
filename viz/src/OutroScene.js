global.THREE = require('three')
import Scene from './Scene'

const simplex = new (require('simplex-noise'))()
const noise = new (require('noisejs')).Noise(Math.random())

const random = require('random-float')
const randomInt = require('random-int')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')
const GeometryUtils = require('./utils/GeometryUtils')
const TextGeometry = require('./geometries/TextGeometry')(THREE)
const FontUtils = require('./utils/FontUtils')

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


//https://github.com/crma16/sound-experiments/blob/master/src/layouts/webgl-background/objects/Wave.js
class DemoScene extends Scene {
    constructor(args) {
      super(args, new THREE.Vector3(0,30,0))

        this.soundwave()
        this.soundscape()
    }

  soundscape() {
    const VIS = 'soundscape'
     const conf = {on: true}
     const group = new THREE.Group()
     group.visible = conf.on
     this.scene.add(group)


     const SIZE = {WIDTH: 100, DEPTH: 100}

     class Soundscape extends THREE.Object3D {
        constructor(args) {
          super()
          this.particle = args.particle
          this.group = args.group

          this.geometry = new THREE.PlaneBufferGeometry(500, 500, SIZE.WIDTH - 1, SIZE.DEPTH - 1);
          // trick! make the underground visible and not the top
           this.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2))

          this.vertices = this.geometry.attributes.position.array



        this.material = new THREE.MeshBasicMaterial({
            color: 0x448844,
            shading: THREE.FlatShading,
            wireframe: false,
            wireframeLinewidth: 2,
            transparent: true
        });


          this.mesh = new THREE.Mesh(this.geometry, this.material)

          this.group.add(this.mesh)
        }
         init() {

           let data = this.generateHeight(256, 256)
             for (var i = 0, j = 0; i < this.vertices.length; i++, j += 3) {

              // only modifiy y of position
              this.vertices[j + 1] = data[i] * 10;

              //basePos[j + 0] = this.vertices[j + 0];
              //basePos[j + 1] = vertices[j + 1];
              //basePos[j + 2] = vertices[j + 2];
          }
           this.initParticles()

         }
        generateHeight(width, height) {
          let size = width * height,
            data = new Uint8Array(size)

            for (let i = 0; i < size; i++) {

                let x = i % width,
                    y = Math.floor(i / width)

                data[i] = Math.abs(simplex.noise2D(x, y)) * 1.1
                //data[i] = Math.abs(noise.perlin2(x / 100, y / 100)) * 1.75
            }
          return data
        }
       initParticles() {
         const material = new THREE.ShaderMaterial({
                uniforms: {
                  amplitude: {
                      type: "f",
                      value: 1.0
                  },
                  bcolor: {
                      type: "c",
                      value: new THREE.Color(0xffffff)
                  },
                  texture: {
                      type: "t",
                      value: this.particle
                  }
                },
                vertexShader: glslify('./glsl/Outro/Soundscape.vert'),
                fragmentShader: glslify('./glsl/Outro/Soundscape.frag'),
                transparent: true,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                opacity: 0.7,
                // vertexColors: THREE.VertexColors,
            })

          const colors = new Float32Array(this.vertices.length * 3)
          const sizes = new Float32Array(this.vertices.length)

          const color = new THREE.Color(0xffaa00) // red
          for (let v = 0; v < this.vertices.length; v++) {
             colors[v*3 + 0] = color.r
             colors[v*3 + 1] = color.g
             colors[v*3 + 2] = color.b

            if (this.vertices[v] < 0)// does what?
                color.setHSL(0.5 + 0.1 * (v / this.vertices.length), 0.7, 0.5);
            else
                color.setHSL(0.0 + 0.1 * (v / this.vertices.length), 0.9, 0.5);

            sizes[v] = Math.floor(random(1, 5))
          }



         this.geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3))
         this.geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1))



        const points = new THREE.Points(this.geometry, material)

        this.group.add(points)
       }
       update(time) {


          this.geometry.attributes.size.needsUpdate = true
          this.geometry.attributes.position.needsUpdate = true
          this.geometry.attributes.color.needsUpdate = true
       }
     }


    this.loader.load('/assets/Outro/particle.png', texture => {

      const ss = new Soundscape({group:group, particle: texture})
      ss.init()

      this.events.on('tick', t => {
         ss.update(t.time)
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


    soundwave() {

      const VIS = 'soundwave'
      let conf = {on:false, speed: 1}
      const group = new THREE.Group()
      group.visible = conf.on
      this.scene.add(group)


    const SIZE = 2.0

    this.loader.load('/assets/Outro/particle.png', texture => {
      const plane = new THREE.PlaneGeometry(150, 100, 150, 150),
            geometry = new THREE.BufferGeometry()


      const nbParticles = plane.vertices.length;
      const positions = new Float32Array(nbParticles * 3),
            sizes = new Float32Array(nbParticles);

    for (let i = 0, i3 = 0; i < nbParticles; i ++, i3 += 3) {
      positions[ i3 + 0 ] = plane.vertices[ i ].x;
      positions[ i3 + 1 ] = plane.vertices[ i ].y;
      positions[ i3 + 2 ] = plane.vertices[ i ].z;

      sizes[ i ] = this.particleSize
    }

    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1))


      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { type: 'f', value: 0.0 },
          sprite: { type: 't', value: texture },
          speed: { type: 'f', value: 1.0 },
        },
        vertexShader: glslify('./glsl/Outro/Soundwave.vert'),
        fragmentShader: glslify('./glsl/Outro/Soundwave.frag'),
        depthTest: false,
        transparent: true,
      })



       const mesh = new THREE.Points(geometry, material)
      mesh.rotation.x = -0.45 * Math.PI

      group.add(mesh)

      this.events.on('tick', t => {
         material.uniforms.time.value = t.time
      })

    })

    super.addVis(VIS, conf)

  }

    tick(time, delta) {
    }
}

export
default DemoScene
