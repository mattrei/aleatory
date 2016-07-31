const simplex = new(require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')
const clamp = require('clamp')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')

import GPUComputationRenderer from '../utils/GPUComputationRenderer'

const VIS = 'particles'
const conf = {
  on: true,
  timeScale: 1
}

const WIDTH = 256
const NUM_PARTICLES = WIDTH * WIDTH


export default class Particles extends THREE.Object3D {
  constructor(scene) {
    super()
    this.scene = scene

    this.ready = false
    this.tick = 0

    this.initParticles()
    this.initShader()
  }

  getConf() {
    return conf
  }

  initParticles() {

    this.scene.getLoader().load(
      '/dist/assets/Intro/lensFlare.png', (texture) => {

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array( NUM_PARTICLES * 3 );
          var p = 0;
          /*
          for ( let i = 0; i < NUM_PARTICLES; i++ ) {
            positions[ p++ ] = 0
            positions[ p++ ] = 0
            positions[ p++ ] = 0
          }
          */
      const uvs = new Float32Array( NUM_PARTICLES * 2 );
          p = 0;
          for ( let j = 0; j < WIDTH; j++ ) {
            for ( let i = 0; i < WIDTH; i++ ) {
              uvs[ p++ ] = i / ( WIDTH - 1 );
              uvs[ p++ ] = j / ( WIDTH - 1 );
            }
          }
          geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
          geometry.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );

      this.particleUniforms = {
            texturePosition: { value: null },
            textureVelocity: { value: null },
            tAudio: { value: null },
            tParticle: {value: texture},
            density: { value: 0.0 },
            time: { value: 0.0 },
            delta: { value: 1 }
          };

      const material = new THREE.ShaderMaterial( {
            uniforms:       this.particleUniforms,
            vertexShader:   particleVertexShader,
            fragmentShader: particleFragmentShader,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: true,
            depthTest: false,
          } );
          material.extensions.drawBuffers = true;
      const particles = new THREE.Points( geometry, material );
          particles.matrixAutoUpdate = false;
          particles.updateMatrix();

      this.add( particles )

      const tgeom = new THREE.PlaneBufferGeometry(5, 20, 32)
      const tmat = new THREE.MeshNormalMaterial({wireframe: true})
      //this.group.add(new THREE.Mesh(tgeom, tmat))

      this.ready = true
    })

  }

  initShader() {
    this.gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, this.scene.getRenderer())
    const dtPosition = this.gpuCompute.createTexture();
    const dtVelocity = this.gpuCompute.createTexture();

    this.fillTextures(dtPosition, dtVelocity)

    this.velocityVariable = this.gpuCompute.addVariable( "textureVelocity", computeShaderVelocity, dtVelocity )
    this.positionVariable = this.gpuCompute.addVariable( "texturePosition", computeShaderPosition, dtPosition )
    this.gpuCompute.setVariableDependencies( this.velocityVariable, [ this.positionVariable, this.velocityVariable ] )
    this.gpuCompute.setVariableDependencies( this.positionVariable, [ this.positionVariable, this.velocityVariable ] )

    this.positionUniforms = this.positionVariable.material.uniforms
    this.velocityUniforms = this.velocityVariable.material.uniforms


    this.positionUniforms.delta = { value: 1 }
    this.velocityUniforms.delta = { value: 1 }
    this.velocityUniforms.time = { value: 0.0 }
    this.velocityUniforms.tAudio = { value: null }

        var error = this.gpuCompute.init();
        if ( error !== null ) {
            console.error( error );
        }

  }

  fillTextures(texturePosition, textureVelocity) {

    const posArray = texturePosition.image.data
    const velArray = textureVelocity.image.data

    for ( let k = 0, kl = posArray.length; k < kl; k += 4 ) {

      let x, y, z
      x = random(-0.1, 0.1)
      y = random(-0.1, 0.1)
      z = random(-0.1, 0.1)
      //x = k / 4 / NUM_PARTICLES
      let vx, vy, vz
      vx = vy = vz = 0 //random(1, 3)

      // Fill in texture values
          posArray[ k + 0 ] = x;
          posArray[ k + 1 ] = y;
          posArray[ k + 2 ] = z;
          posArray[ k + 3 ] = 1;

          velArray[ k + 0 ] = vx;
          velArray[ k + 1 ] = vy;
          velArray[ k + 2 ] = vz;
          velArray[ k + 3 ] = 1;
    }
  }

  update(dt) {

    const delta = dt * conf.timeScale

    this.tick += dt
    if (this.tick < 0) this.tick = 0


    if (!this.ready) return

    this.gpuCompute.compute()


    this.particleUniforms.texturePosition.value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture
    this.particleUniforms.textureVelocity.value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture

    const audioTexture =  this.scene.getAudioTexture()
    this.particleUniforms.tAudio.value = audioTexture
    this.velocityUniforms.tAudio.value = audioTexture
    this.particleUniforms.time.value = this.tick

    this.positionUniforms.delta.value = dt
    this.velocityUniforms.delta.value = dt
    this.velocityUniforms.time.value = this.tick

  }
}

const computeShaderPosition = glslify(`

  #pragma glslify: snoise3 = require('glsl-noise/simplex/3d')

  uniform float delta;

  void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec4 tmpPos = texture2D( texturePosition, uv );
        vec3 pos = tmpPos.xyz;
        vec4 tmpVel = texture2D( textureVelocity, uv );
        vec3 vel = tmpVel.xyz;

        pos += vel * delta * 0.1;
        gl_FragColor = vec4( pos, 1.0 );
      }
`, { inline: true })

const computeShaderVelocity = glslify(`

  #pragma glslify: snoise3 = require('glsl-noise/simplex/3d')
  #pragma glslify: snoise4 = require('glsl-noise/simplex/4d')
  #pragma glslify: curlNoise = require('glsl-curl-noise')

  uniform sampler2D tAudio;
  uniform float time;
  uniform float delta;

  void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        float idParticle = uv.y * resolution.x + uv.x;
        vec4 tmpPos = texture2D( texturePosition, uv );
        vec3 pos = tmpPos.xyz;
        vec4 tmpVel = texture2D( textureVelocity, uv );
        vec3 vel = tmpVel.xyz;

        //float noise = snoise4(vec4(pos, time * 0.001));
        //float noise = snoise3(pos);
        vec3 acceleration = curlNoise(pos);

        vec3 audio = texture2D(tAudio, uv ).rbg;

        vel += delta * acceleration * 0.1 * (audio.r * 2.);
        gl_FragColor = vec4( vel, 1.0 );
      }
`, { inline: true })


const particleVertexShader = glslify(`
      #include <common>

      varying vec2 vUv;
      uniform sampler2D texturePosition;
      uniform sampler2D textureVelocity;
      uniform sampler2D tAudio;

      void main() {
        vec4 posTemp = texture2D( texturePosition, uv );
        vec3 pos = posTemp.xyz;
        //vec4 velTemp = texture2D( textureVelocity, uv );
        //vec3 vel = velTemp.xyz;

        vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );

        vUv = uv;

        float size = .1;
        gl_PointSize = size * ( 300.0 / -mvPosition.z );
        gl_Position = projectionMatrix * mvPosition;
      }
`, { inline: true })


const particleFragmentShader = glslify(`

    uniform sampler2D tAudio;
    uniform sampler2D tParticle;
    varying vec2 vUv;

    void main() {

        vec4 texColor = texture2D( tParticle, gl_PointCoord );

        vec3 audio = texture2D(tAudio,vUv ).rbg;

        float t = 0.1 / length(gl_PointCoord - vec2(.5, .5));
        t = pow(t, 2.0);

        vec3 color = mix(/*vec3(.1,0.2,0.4)*/audio, texColor.rgb, t);

        gl_FragColor = vec4(color, texColor.w);
      }

`, { inline: true })



/*
define(function(require, exports, module) {

  var SC = require("Shaders/shaderChunks");

  var physicsShaders = {

    position:[

      "uniform vec2 resolution;",
      "uniform float time;",
      "uniform float speed;",
      "uniform float delta;",
      "uniform sampler2D textureVelocity;",
      "uniform sampler2D texturePosition;",

      "void main(){",

        "vec2 uv = gl_FragCoord.xy / resolution.xy;",
        "vec3 position = texture2D( texturePosition, uv ).xyz;",
        "vec3 velocity = texture2D( textureVelocity, uv ).xyz;",
        "float mass = texture2D( texturePosition, uv ).w;",
        "gl_FragColor=vec4(position + velocity * speed * delta, mass );",

      "}"

    ].join("\n"),

    positionAudio_1:[

      "uniform vec2 resolution;",
      "uniform float time;",
      "uniform float speed;",
      "uniform float delta;",
      "uniform sampler2D textureVelocity;",
      "uniform sampler2D texturePosition;",
      "uniform sampler2D audioTexture;",

      "void main(){",

        "vec2 uv = gl_FragCoord.xy / resolution.xy;",
        "vec3 position = texture2D( texturePosition, uv ).xyz;",
        "vec3 velocity = texture2D( textureVelocity, uv ).xyz;",
        "float audio = texture2D( audioTexture , vec2( uv.x , 0.0 ) ).w;",
        "gl_FragColor=vec4(position + velocity *  audio  * speed * delta , 1.0 );",

      "}"

    ].join("\n"),
    positionAudio_2:[

      "uniform vec2 resolution;",
      "uniform float time;",
      "uniform float speed;",
      "uniform float delta;",
      "uniform sampler2D textureVelocity;",
      "uniform sampler2D texturePosition;",
      "uniform sampler2D audioTexture;",

      "void main(){",

        "vec2 uv = gl_FragCoord.xy / resolution.xy;",
        "vec3 position = texture2D( texturePosition, uv ).xyz;",
        "vec3 velocity = texture2D( textureVelocity, uv ).xyz;",
        "float audio = texture2D( audioTexture , vec2( uv.x , 0.0 ) ).w;",
        "gl_FragColor=vec4(position + velocity *  audio  * audio  * speed * delta, 1.0 );",

      "}"

    ].join("\n"),

    positionAudio_3:[

      "uniform vec2 resolution;",
      "uniform float time;",
      "uniform float speed;",
      "uniform float delta;",
      "uniform sampler2D textureVelocity;",
      "uniform sampler2D texturePosition;",
      "uniform sampler2D audioTexture;",

      "void main(){",

        "vec2 uv = gl_FragCoord.xy / resolution.xy;",
        "vec3 position = texture2D( texturePosition, uv ).xyz;",
        "vec3 velocity = texture2D( textureVelocity, uv ).xyz;",
        "float audio = texture2D( audioTexture , vec2( uv.x , 0.0 ) ).w;",
        "gl_FragColor=vec4(position + velocity *  audio * audio * audio * speed* delta, 1.0 );",

      "}"

    ].join("\n"),






    positionAudio_4:[

      "uniform vec2 resolution;",
      "uniform float time;",
      "uniform float speed;",
      "uniform float delta;",
      "uniform sampler2D textureVelocity;",
      "uniform sampler2D texturePosition;",
      "uniform sampler2D audioTexture;",

      "void main(){",

        "vec2 uv = gl_FragCoord.xy / resolution.xy;",
        "vec3 position = texture2D( texturePosition, uv ).xyz;",
        "vec3 velocity = texture2D( textureVelocity, uv ).xyz;",
        "float audio = texture2D( audioTexture , vec2( uv.x , 0.0 ) ).w;",
        "gl_FragColor=vec4(position + velocity *  audio * audio * audio * audio  * speed * delta, 1.0 );",

      "}"

    ].join("\n"),

    positionAudio_TEST:[

      "uniform vec2 resolution;",
      "uniform float time;",
      "uniform float speed;",
      "uniform float delta;",
      "uniform sampler2D textureVelocity;",
      "uniform sampler2D texturePosition;",
      "uniform sampler2D audioTexture;",

      "void main(){",

        "vec2 uv = gl_FragCoord.xy / resolution.xy;",
        "vec3 position = texture2D( texturePosition, uv ).xyz;",
        "vec3 velocity = texture2D( textureVelocity, uv ).xyz;",
        "float audio = texture2D( audioTexture , vec2( uv.x , 0.0 ) ).w;",
        "gl_FragColor=vec4( audio * 50.0 , 0.0  , 0.0, 1.0 );",

      "}"

    ].join("\n"),

     positionSimplex:[

      "uniform vec2 resolution;",
      "uniform float time;",
      "uniform float speed;",
      "uniform float delta;",
      "uniform sampler2D textureVelocity;",
      "uniform sampler2D texturePosition;",
      "uniform sampler2D audioTexture;",

      SC.noise4D,
      "void main(){",

        "vec2 uv = gl_FragCoord.xy / resolution.xy;",
        "vec3 position = texture2D( texturePosition, uv ).xyz;",
        "vec3 velocity = texture2D( textureVelocity, uv ).xyz;",
        "position += velocity * normalize(position) *  snoise( vec4( normalize( position) , time / 1.0 ) );",
        "gl_FragColor=vec4(position  , 1.0 );",

      "}"

    ].join("\n"),







    velocity:{


      rezaCurl:[




      ].join("\n"),


      curl:[

      SC.physicsUniforms,
      SC.physicsUniforms_bounds,
      "uniform float noiseSize;",
      "uniform float potentialPower;",
      SC.bindUsingVelocity,

      SC.curlNoise,

      "void main(){",


        SC.assignUV,

          "vec3 selfPosition  = texture2D( texturePosition , uv ).xyz;",
          "vec3 selfVelocity  = texture2D( textureVelocity , uv ).xyz;",

          "vec3 potential = curlNoise( selfPosition * noiseSize );",

          //"vec

          "gl_FragColor=vec4( selfVelocity + potential * potentialPower , 1.0  );",



      "}"



      ].join("\n"),

      simplex: [

        SC.physicsUniforms,

        //SC.noise3D,
        SC.noise3D,

        "void main(){",

          SC.assignUV,
          "vec3 selfPosition  = texture2D( texturePosition , uv ).xyz;",
          "vec3 selfVelocity  = texture2D( textureVelocity , uv ).xyz;",
          "float mass         = texture2D( textureVelocity , uv ).w;",

          "float noise = snoise( normalize( selfPosition )  );",
          "selfVelocity +=  selfVelocity * noise;",

          "gl_FragColor=vec4( selfVelocity * mass, mass );",


        "}"
      ].join("\n"),

      gravity: [


        SC.physicsUniforms,

        "uniform float gravityStrength;",
        "uniform float dampening;",

        SC.physicsUniforms_bounds,


        "void main(){",

          SC.assignUV,

          "vec3 selfPosition  = texture2D( texturePosition , uv ).xyz;",
          "vec3 selfVelocity  = texture2D( textureVelocity , uv ).xyz;",
          "float mass         = texture2D( textureVelocity , uv ).w;",
          "vec3 selfNorm      = normalize( selfVelocity );",

          "vec3 velocity      = selfVelocity;",


          SC.createPhysicsTextureLoop(
            "vec3 diff = pPos - selfPosition;",
            "float l = length( diff );",
            "velocity += pMass * diff / ( gravityStrength * l * l * l );"
          ),




          "velocity *= dampening;",
          "gl_FragColor=vec4( velocity * mass, mass );",
          //"if(",

        "}"


      ].join("\n"),

      flocking:[

        SC.physicsUniforms,
        SC.physicsUniforms_bounds,

        "uniform float testing;",
        "uniform float seperationDistance;", // 10
        "uniform float alignmentDistance;", // 40
        "uniform float cohesionDistance;", // 200
        "uniform float freedomFactor;",

        "uniform float size;",

        SC.PI,
        SC.PI_2,
        "const float VISION = PI * 0.55;",

        SC.rand2D,
        SC.bindUsingVelocity,

        "void main(){",

          SC.assignUV,

          // int x, y;
          "vec3 birdPosition, birdVelocity;",

          "vec3 selfPosition = texture2D( texturePosition, uv ).xyz;",
          "vec3 selfVelocity = texture2D( textureVelocity, uv ).xyz;",

          "float mass =  texture2D( texturePosition, uv ).w;",

          "float dist;",
          "vec3 diff;",

          "vec3 velocity = selfVelocity;",
          "vec3 cohesion = vec3(0.0);",
          "vec3 alignment = vec3(0.0);",



          "float cohensionCount = 0.0;",
          "float alignmentCount = 0.0;",
          "if ( rand( uv + time * 0.00005 ) > freedomFactor ) {",

            SC.createPhysicsTextureLoop(
              "diff = pPos - selfPosition;",
              "dist = length(diff);",

              "if (dist > 0.0 && dist < seperationDistance) {",
                "velocity -= diff / dist;",
                "velocity /= 2.0;",
              "}",

              "if (dist < alignmentDistance) {",
                "alignment += pVel;",
                "alignmentCount ++;",
              "}",

              "if (dist < cohesionDistance) {",
                "cohesion += pPos;",
                "cohensionCount ++;",
              "}"
            ),

            "if (alignmentCount > 0.0) {",
              "alignment /= alignmentCount;",
              "dist = length(alignment);",
              "velocity += alignment/dist;",
              "velocity /= 2.0;",
            "}",

            "if (cohensionCount > 0.0) {",
              "cohesion /= cohensionCount;",
              "diff = cohesion - selfPosition;",
              "dist = length(diff);",
              "if (dist > 0.0)",
              "velocity = diff / dist / 10.0 * 0.5 + velocity * 0.5;",
            "}",

              // velocity.y -= 0.01;

          "}",


          "velocity = bindUsingVelocity( vec2( lowerBounds , upperBounds ) , selfPosition.xyz , velocity );",

          //"gl_FragColor = vec4( mass , mass , mass , 1.0 );",

          "gl_FragColor = vec4( velocity  , mass);",


        "}"

      ].join("\n")


    }

  }

  module.exports = physicsShaders;

});
*/
