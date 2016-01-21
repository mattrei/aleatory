global.THREE = require('three')
import Scene from './Scene'

const simplex = new (require('simplex-noise'))
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
      super(args, new THREE.Vector3(0,30,30))

        this.wave()
        this.xtion()

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

    wave() {

      const VIS = 'wave'
      let conf = {on:false, speed: 1}
      const group = new THREE.Group()
      group.visible = conf.on
      this.scene.add(group)


    const SIZE = 2.0
    const mesh = null

    this.loader.load('/assets/Outro/particle.png', texture => {
      const plane = new THREE.PlaneGeometry(150, 100, 150, 150),
            geometry = new THREE.BufferGeometry()


      const nbParticles = plane.vertices.length;
      const positions = new Float32Array(nbParticles * 3),
            sizes = new Float32Array(nbParticles);

    for (let i = 0, i3 = 0; i < nbParticles; i ++, i3 += 3) {
      this.positions[ i3 + 0 ] = plane.vertices[ i ].x;
      this.positions[ i3 + 1 ] = plane.vertices[ i ].y;
      this.positions[ i3 + 2 ] = plane.vertices[ i ].z;

      this.sizes[ i ] = this.particleSize;
    }

    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));


      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { type: 'f', value: 0.0 },
          sprite: { type: 't', value: texture },
          speed: { type: 'f', value: 1.0 },
        },
        vertexShader: require('./glsl/Outro/wave.vert'),
        fragmentShader: glslify('./glsl/Outro/wave.frag'),
        depthTest: false,
        transparent: true,
      })






     mesh = new THREE.Points(this.geometry, this.material);
      mesh.rotation.x = -0.45 * Math.PI;

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
