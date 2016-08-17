const glslify = require('glslify')

const random = require('random-float')
const randomInt = require('random-int')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

import AObject from '../AObject'

const MAX_PARTICLES = 100000
const MAX_PARTICLE_DIST = 50
const IMG_SCALE = 0.2

const DUR_ANIM = 2

export
default class Refugees extends AObject {
    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this.currIdx = 0
        this.meshes = []
    }

    _getImgData(pic) {

        return new Promise(function(fulfill, reject) {

            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            var image = new Image();
            image.src = pic;
            image.onload = function() {
                canvas.width = image.width;
                canvas.height = image.height;
                //context.globalAlpha = 0;
                context.drawImage(image, 0, 0);
                var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
                fulfill(imgData)
            }

        })
    }

    _getPixel(imgData, x, y) {
        var r, g, b, a, offset = x * 4 + y * 4 * imgData.width;
        r = imgData.data[offset];
        g = imgData.data[offset + 1];
        b = imgData.data[offset + 2];
        a = imgData.data[offset + 3];

        return new THREE.Color(r, g, b)
    }

    load(data) {

        this.meshes = []

        const group = new THREE.Group()
        this.add(group)

        data.forEach(d => {

            //this.loader.load('/assets/for_particles.jpg', (testImg) => {
            //const bgImg = testImg.image.src
            const bgImg = d.img

            this._getImgData(bgImg).then(imgData => {

                const geometry = new THREE.BufferGeometry()

                const imgSize = imgData.width * imgData.height
                console.log("Image pixels: " + imgData.width * imgData.height)

                let PARTICLES_AMOUNT = MAX_PARTICLES
                if (MAX_PARTICLES > imgSize) {
                    PARTICLES_AMOUNT = imgSize
                }

                var positions = new Float32Array(PARTICLES_AMOUNT * 3);
                var colors = new Float32Array(PARTICLES_AMOUNT * 3);
                // displacement values
                var extras = new Float32Array(PARTICLES_AMOUNT * 3);


                let total = imgData.width * imgData.height,
                    step = Math.floor(total / PARTICLES_AMOUNT)

                for (var i = 0, i3 = 0, ipx = 0; i < PARTICLES_AMOUNT; i++, i3 += 3, ipx += step) {

                    let x = ipx % imgData.width,
                        y = ipx / imgData.width | 0,
                        pixel = this._getPixel(imgData, x, y)

                    const position = new THREE.Vector2(
                        x / imgData.width * (imgData.width / imgData.height),
                        y / imgData.height)

                    // Position
                    positions[i3 + 0] = position.x
                    positions[i3 + 1] = position.y
                    positions[i3 + 2] = 0

                    // Extras
                    extras[i3 + 0] = Math.random()
                    extras[i3 + 1] = Math.random()
                    extras[i3 + 2] = Math.random()

                    // Color
                    let color = pixel
                    colors[i3 + 0] = color.r / 255;
                    colors[i3 + 1] = color.g / 255;
                    colors[i3 + 2] = color.b / 255;

                }

                geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
                geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
                geometry.addAttribute('extra', new THREE.BufferAttribute(extras, 3));

                const material = new THREE.ShaderMaterial({

                    uniforms: {
                        uTime: {
                            value: 0
                        },
                        uTimeInit: {
                            value: randomInt(0, 100)
                        },
                        uAnimation: {
                            value: 0
                        },
                        bgImg: {
                            value: bgImg
                        }
                    },
                    vertexShader: pictureVS,
                    fragmentShader: pictureFS,
                    blending: THREE.AdditiveBlending,
                    transparent: false,
                    depthWrite: true,
                    depthTest: false
                });

                const particles = new THREE.Points(geometry, material)
                particles.visible = true
                group.add(particles)

                this.meshes.push(particles)

                this.ready = true
            })
        })

    }

    doNext() {


        const mesh = this.meshes[this.currIdx++ % this.meshes.length]

        tweenr.to(mesh.material.uniforms.uAnimation, {
            value: 0,
            duration: DUR_ANIM
        })

        tweenr.to(mesh.position, {
            z: 1,
            duration: DUR_ANIM
        })

    }

    doReset() {
        this.meshes.forEach(mesh => {

            if (mesh.visible) {
                tweenr.to(mesh.material.uniforms.uAnimation, {
                    value: 1,
                    duration: DUR_ANIM
                })
                //.on('complete', () => m.visible = false)
            }
            tweenr.to(mesh.position, {
                z: 0,
                duration: DUR_ANIM
            })
        })
    }

    init() {

        const group = new THREE.Group()
        this.add(group)

        const meshes = []
        let mIdx = 0

        if (this.conf.data) this.load(this.conf.data)
        super.on('data', data => this.load(data))

        super.on('doNext', _ => this.doNext())
        super.on('doReset', _ => this.doReset())
    }


    update(dt) {
        super.update(dt)

        if (!this.ready) return


        this.meshes.forEach(mesh => {
            mesh.material.uniforms.uTime.value += dt
        })

    }
}



const pictureVS = glslify(`
#pragma glslify: pnoise3 = require(glsl-noise/periodic/3d)
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)
#pragma glslify: PI = require(glsl-pi)
#pragma glslify: curl = require(glsl-curl-noise)

attribute vec3 color;
attribute vec3 extras;


uniform float uTime;
uniform float uTimeInit;
uniform float uAnimation;

varying vec2 vUv;
varying vec3 vColor;
   void main() {
        vUv = uv;
       vColor = color;

      float time = uTime + uTimeInit;

       float displacement  =  pnoise3(.4 * position + vec3( 0, time, 0 ), vec3( 100.0 ) ) * 1. * .7;

       float animation = sin(uTime*0.001); //uAnimation;
       vec3 pos = position;

       pos.x += snoise3(position.xyz * 0.02 + 50.0 + time) * (200.0 + extras.y * 800.0) * animation;
       pos.y += snoise3(position.xyz * 0.01 + 2.0 + time) * (200.0 + fract(extras.y * 32.0) * 800.0) * animation;
       pos.z += snoise3(position.xyz * 0.03 + 100.0 + time) * (200.0 + fract(extras.z * 32.0) * 800.0) *  animation;

       //convert to polar coordinates
       // https://en.wikipedia.org/wiki/Spherical_coordinate_system
       float d = length(pos);//rho
       float phi = atan(pos.y, pos.x) + pow(d / 300.0, 0.3) * pow(animation, .5);
       float theta = acos(pos.z / d) + pow(d / 300.0, 0.3) * pow(animation, .5);

       // and back
       //pos.x = cos(angle) * d;
       //pos.y = sin(angle) * d;
       pos.x = sin(theta) * cos(phi) * d;
       pos.y = sin(theta) * sin(phi) * d;
       pos.z = cos(theta) * d;

       //vec3 curlPosition = curl(position + time); //+ (time * 0.05));
       //curlPosition *= - 50.;

       vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );

        gl_Position = projectionMatrix * mvPosition;
          //gl_PointSize = size * 300.0 / length(mvPosition.xyz);
       gl_PointSize = 1.0;
       //gl_PointSize = abs(sin(position.x + time));
      }

`, {
    inline: true
})


const pictureFS = glslify(`
varying vec2 vUv;
varying vec3 vColor;

uniform float uTime;

        void main()
        {
          gl_FragColor = vec4(vColor, 1.0);

        }

`, {
    inline: true
})