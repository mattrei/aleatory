
require('three/examples/js/curves/NURBSSurface')
require('three/examples/js/utils/GeometryUtils')

import AObject from '../AObject'
const simplex = new(require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')

const newArray = require('new-array')

const randomRadian = () => random(-Math.PI, Math.PI)
const randomRotation = () => newArray(3).map(randomRadian)
const randomSphere = require('gl-vec3/random')


export default class Cage extends AObject {
  constructor(name, conf, scene) {
    super(name, conf, scene)

    this.scene = scene

    this.ready = false
    this.tick = 0


    this.asteroids = []
    this.createAsteroids()
    this.createCage()

  }

  createAsteroids() {

    const NUM_ASTEROIDS = 50

    const group = new THREE.Group()
    this.add(group)


    const geometries = newArray(6).map(asteroidGeom)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      wireframe: true
    })


    this.asteroids = newArray(NUM_ASTEROIDS).map(() => {
      const geometry = geometries[randomInt(geometries.length)]
      const mesh = new THREE.Mesh(geometry, material.clone())


      const pColor = new THREE.Color()
      pColor.setHSL((180+Math.random()*40)/360, 1.0, 0.5 + Math.random() * 0.2)
      mesh.material.color = pColor

      mesh.material.opacity = random(0.05, 0.1)
      mesh.scale.multiplyScalar(random(8, 16))
      mesh.rotation.fromArray(randomRotation())
      mesh.direction = new THREE.Vector3().fromArray(randomSphere([]))
      mesh.position.fromArray(randomSphere([], random(5000, 6000)))

      group.add(mesh)
      return mesh
    })


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

  createCage() {

  }


  update(dt) {

    if (!super.update(dt)) return

    if (!this.ready) return

  	this.tick += dt



    const midFreq = this.scene.getMidFreq()

    this.asteroids.forEach(mesh => {
        mesh.rotation.x += dt * 0.1 * mesh.direction.x * midFreq
        mesh.rotation.y += dt * 0.5 * mesh.direction.y * midFreq
      })
  }

}


const floorVertexShader = glslify(`
  #pragma glslify: pnoise3 = require(glsl-noise/periodic/3d)
  #pragma glslify: PI = require('glsl-pi')

  varying vec2 vUv;
  varying float vNoise;
  varying float vY;

            // varying vec3  v_line_color;

            uniform float time;
            uniform float speed;
            uniform float height;
            //uniform float valley_elevation;
            uniform float noise_elevation;

            uniform sampler2D textureAudio;

            void main()
            {
                vUv = uv;
                // First perlin passes
                float displacement  =  pnoise3(.4 * position + vec3( 0, speed * time, 0 ), vec3( 100.0 ) ) * 1. * height;

                displacement       += pnoise3( 2. * position + vec3( 0, speed * time * 5., 0 ), vec3( 100. ) ) * .3 * height;
                //displacement       += pnoise3( 8. * position + vec3( 0, speed * time * 20., 0 ), vec3( 100. ) ) * .1 * height;

                float freq = 5.0;
                float distance = sqrt(((uv.x-0.5) * (uv.x-0.5)) + ((uv.y-0.5) * (uv.y-0.5)));
                float z = (height * sin(((time * 0.5 * speed) - (distance * freq)) * PI));


                vec3 audio = texture2D(textureAudio, uv ).rbg;

              // Sinus
                displacement = displacement + (sin(position.x / 2. - PI / 2.));
                displacement += audio.r;

                vec3 newPosition = vec3(position.x,position.y, displacement+z);

                vNoise = displacement;
                vY = newPosition.z;
                //vNoise = sin(position.x / 2. - PI / 2.);
                //vec3 newPosition = position + normal * vec3(sin(time * 0.2) * 3.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
            }

`, { inline: true })

const floorFragmentShader = glslify(`
#pragma glslify: PI = require('glsl-pi')

varying vec2 vUv;
varying float vNoise;
varying float vY;
//varying float vNoise;
uniform float time;
uniform float speed;

        void main()
        {
            vec2 p = -1.0 + 2.0 *vUv;
            float alpha = sin(p.y * PI) / 2.;

            float time2 = time / (1. / speed) * 0.3;

            float r = .5 + sin(time2);
            float g = .5 + cos(time2);
            float b = 1. - sin(time2);

            vec3 color = vec3(r,g,b);
            //color *= vNoise;
            gl_FragColor = vec4(cos(vY * 2.0), vY * 3.0, 1.0, 1.0);

            //gl_FragColor = vec4(color, alpha);
        }

`, { inline: true })



const auroraVertexShader = glslify(`
      #include <common>

      varying vec2 vUv;

      uniform float uTime;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        vUv = uv;

        //vUv.x = 0.5 - cos( uTime + vUv.x ) * 0.5;
        //vUv.x = smoothstep( 0., 1., vUv.x );

        gl_Position = projectionMatrix * mvPosition;
      }
`, { inline: true })


const auroraFragmentShader = glslify(`

  #pragma glslify: cnoise2 = require('glsl-noise/classic/2d')

  uniform sampler2D textureAlpha;
  uniform sampler2D textureColor;
	uniform float uTime;
  uniform float uOffset;
  uniform float uFade;


    //uniform sampler2D textureColor;
    varying vec2 vUv;

    void main() {

        vec2 noise = vec2(cnoise2(vec2(vUv.x+uTime*0.2, vUv.y)), cnoise2(vec2(vUv.x, vUv.y+uTime*0.3)));

        vec4 texB = texture2D(textureColor, vUv);
        vec4 texC = texture2D(textureColor, (texB.rg*.021)+vec2(vUv.x*.4+uOffset,vUv.y));


        vec4 texA = texture2D( textureAlpha, vUv + noise + (.05-texC.rg*.1));

        vec3 color = texC.rgb;

        gl_FragColor = vec4(color, texA.a);
      }

`, { inline: true })

