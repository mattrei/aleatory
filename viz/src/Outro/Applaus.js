const simplex = new(require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')
const clamp = require('clamp')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')

const randomColor = require('randomcolor')

import GPUComputationRenderer from '../utils/GPUComputationRenderer'

import AObject from '../AObject'

const WIDTH = 128


export
default class Applaus extends AObject {
    constructor(name, conf, renderer, loader, aaa) {
        super(name, conf)

        this.ready = false
        this.tick = 0

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
    }

    _getPixel(imgData, x, y) {
        let r, g, b, a, offset = x * 4 + y * 4 * imgData.width;
        r = imgData.data[offset];
        g = imgData.data[offset + 1];
        b = imgData.data[offset + 2];
        a = imgData.data[offset + 3];

        return Math.floor((r + g + b) / 256)
    }

    _getImgData(pic) {
        return new Promise(function(resolve, reject) {
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            var image = new Image();
            image.src = pic;
            image.onload = function() {

                canvas.width = image.width;
                canvas.height = image.height;
                context.drawImage(image, 0, 0);
                var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
                resolve(imgData)
            }
        })
    }

    init() {

        const logo = this.loader.load('/dist/assets/Outro/logo.png')

        this._getImgData('/dist/assets/Outro/logo.png').then((imgData => {

            const imageVertices = []

            for (var y = 0; y < imgData.height; y++) {
                if (y % 2 > 0) continue
                for (var x = 0; x < imgData.width; x++) {
                    if (x % 2 > 0) continue
                    if (imgData.data[(x + y * imgData.width) * 4] > 0) {
                        const xp = (x - imgData.width / 2) / imgData.width //* -1
                        const yp = (y - imgData.height / 2) / imgData.height //* -1

                        imageVertices.push(xp, yp, 0)
                    }
                }
            }
            

            const positions = new Float32Array(imageVertices),
                colors = new Float32Array(imageVertices.length),
                opacities = new Float32Array(imageVertices.length / 3),
                sizes = new Float32Array(imageVertices.length / 3)


            var uvs = new Float32Array(imageVertices.length / 3 * 2)
            let p = 0
            for (var j = 0; j < imgData.width; j++) {
                for (var i = 0; i < imgData.height; i++) {

                    uvs[p++] = i / (imgData.width - 1);
                    uvs[p++] = j / (imgData.height - 1);

                }
            }

            for (let i = 0; i < imageVertices.length; i++) {

                const color = new THREE.Color(randomColor())
                color.toArray(colors, i * 3)

                opacities[i] = 1
                sizes[i] = 12
            }

            const geometry = new THREE.BufferGeometry()

            geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            //geometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
            //geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));
            //geometry.addAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

            this.particleUniforms = {
                tOriginalPosition: {
                    value: null
                },
                tPosition: {
                    value: null
                },
                tAudio: {
                    value: null
                },
                tParticle: {
                    value: this.loader.load('/dist/assets/Intro/lensFlare.png')
                },
                density: {
                    value: 0.0
                },
                time: {
                    value: 0.0
                },
                delta: {
                    value: 1
                }
            };

            const material = new THREE.ShaderMaterial({
                uniforms: this.particleUniforms,
                vertexShader: VS,
                fragmentShader: FS,
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: true,
                depthTest: false,
            });
            material.extensions.drawBuffers = true;
            const particles = new THREE.Points(geometry, material);
            particles.matrixAutoUpdate = false;
            particles.updateMatrix();

            particles.frustumCulled = false

            this.add(particles)

            this.initShader(imgData, positions)


            this.ready = true
        }))

    }

    initShader(imgData, positions) {
        this.gpuCompute = new GPUComputationRenderer(imgData.width, imgData.height, this.renderer)
        const dtOriginalPosition = this.gpuCompute.createTexture();
        const dtPosition = this.gpuCompute.createTexture();

        this.fillTextures(dtOriginalPosition, dtPosition, positions)

        this.positionVariable = this.gpuCompute.addVariable("tPosition", computeShaderPosition, dtPosition)

        this.gpuCompute.setVariableDependencies(this.positionVariable, [this.positionVariable])

        this.positionUniforms = this.positionVariable.material.uniforms



        this.positionUniforms.delta = {
            value: 1
        }
        this.positionUniforms.time = {
            value: 0
        }
        this.positionUniforms.tOriginalPosition = {
            value: dtOriginalPosition
        }
        this.positionUniforms.tAudio = {
            value: null
        }

        var error = this.gpuCompute.init();
        if (error !== null) {
            console.error(error);
        }

    }

    fillTextures(tOriginalPosition, tPosition, positions) {

        const originalPosArray = tOriginalPosition.image.data
        const posArray = tPosition.image.data

        for (let k = 0, i = 0, kl = posArray.length; k < kl; k += 4, i++) {

            let x, y, z
            x = positions[i * 3 + 0]
            y = positions[i * 3 + 1]
            z = positions[i * 3 + 2]

            originalPosArray[k + 0] = posArray[k + 0] = x;
            originalPosArray[k + 1] = posArray[k + 1] = y;
            originalPosArray[k + 2] = posArray[k + 2] = z;
            originalPosArray[k + 3] = posArray[k + 3] = 0;
        }
    }

    update(dt) {
        super.update(dt)

        const delta = dt * this.conf.timeScale

        this.tick += dt
        if (this.tick < 0) this.tick = 0


        if (!this.ready) return

        this.gpuCompute.compute()


        this.particleUniforms.tPosition.value = this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture

        const audioTexture = this.aaa.getAudioTexture()
        this.particleUniforms.tAudio.value = audioTexture
        this.particleUniforms.delta.value = dt
        this.particleUniforms.time.value = this.tick

        this.positionUniforms.delta.value = dt
        this.positionUniforms.time.value = this.tick
        this.positionUniforms.tAudio.value = audioTexture
    }
}

const computeShaderPosition = glslify(`

  #pragma glslify: curlNoise = require('glsl-curl-noise')

  uniform sampler2D tOriginalPosition;
  uniform sampler2D tAudio;
  uniform float delta;
  uniform float time;

  void main() {
        float amplitude = 120.;

        vec2 uv = gl_FragCoord.xy / resolution.xy;

        vec4 origPos = texture2D( tOriginalPosition, uv );
        vec4 pos = texture2D( tPosition, uv );
        vec3 audio = texture2D(tAudio, uv ).rbg;

            if (audio.r > .5) {
                pos.xyz += curlNoise(pos.xyz) * audio.r * delta * 0.8;
            } else {
                float dist = distance(normalize(origPos.xyz), normalize(pos.xyz));
                float factor = smoothstep(0.,1., abs(sin(time*0.01)));
                pos.xyz = mix(pos.xyz, origPos.xyz, factor);
            }
            
        gl_FragColor = pos;
      }
`, {
    inline: true
})


const VS = glslify(`
      #include <common>

      varying vec2 vUv;
      uniform sampler2D tPosition;
      uniform sampler2D tAudio;

      uniform float time;
      uniform float delta;

      void main() {
        vec4 posTemp = texture2D( tPosition, uv );
        vec3 pos = posTemp.xyz;

        pos.z += 0.3 * sin(pos.x*2.4 + time*0.1);

        vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );

        vUv = uv;

        float size = .1;
        gl_PointSize = size * ( 300.0 / -mvPosition.z );
        gl_Position = projectionMatrix * mvPosition;
      }
`, {
    inline: true
})


const FS = glslify(`

    #pragma glslify: hsl2rgb = require(glsl-hsl2rgb)

    uniform sampler2D tAudio;
    uniform sampler2D tParticle;
    uniform float time;
    uniform float delta;

    varying vec2 vUv;


    void main() {

        vec4 texColor = texture2D( tParticle, gl_PointCoord );

        vec3 audio = texture2D(tAudio,vUv ).rgb;

        //vec3 rgb = hsl2rgb(length(vPos)/150.0, 1.0, 0.65);

        gl_FragColor = texColor;
      }

`, {
    inline: true
})