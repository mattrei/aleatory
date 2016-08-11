const simplex = new(require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')
const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')

import AObject from '../AObject'


const MAX_PARTICLES = 1000 * 300000 // has 2mio pixels
const MAX_PARTICLE_DIST = 50
const IMG_SCALE = 1

export
default class Map extends AObject {
    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this.ready = false
        this.tick = 0

        this.init()
    }

    _getPixel(imgData, x, y) {
        var r, g, b, a, offset = x * 4 + y * 4 * imgData.width;
        r = imgData.data[offset];
        g = imgData.data[offset + 1];
        b = imgData.data[offset + 2];
        a = imgData.data[offset + 3];

        return new THREE.Color(r / 255, g / 255, b / 255)
    }

    _getImgData(pic) {

        return new Promise((fulfill, reject) => {

            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            var image = new Image();
            image.src = pic;
            image.onload = () => {
                canvas.width = image.width;
                canvas.height = image.height;
                context.drawImage(image, 0, 0);
                const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
                fulfill(imgData)
            }

        })
    }

        _addAttributes(geometry, imgData) {

            const imgSize = imgData.width * imgData.height
            console.log("Image pixels: " + imgData.width * imgData.height)

            let PARTICLES_AMOUNT = MAX_PARTICLES
            if (MAX_PARTICLES > imgSize) {
                PARTICLES_AMOUNT = imgSize
            }

            // get number of pixels
            let numParticles = 0
            for (let i = 0; i < imgSize; i++) {

                let x = i % imgData.width,
                    y = i / imgData.width | 0,
                    pixel = _getPixel(imgData, x, y)
                if (pixel.r !== 0 && pixel.g !== 0 && pixel.b !== 0) {
                    // pixel is not black
                    numParticles++
                }

            }
            PARTICLES_AMOUNT = numParticles

            var positions = new Float32Array(PARTICLES_AMOUNT * 3);
            var colors = new Float32Array(PARTICLES_AMOUNT * 3);
            // displacement values
            var extras = new Float32Array(PARTICLES_AMOUNT * 3);
            var puv = new Float32Array(PARTICLES_AMOUNT * 2);


            let total = imgData.width * imgData.height,
                step = Math.floor(total / PARTICLES_AMOUNT)

            for (var i = 0, i2 = 0, i3 = 0, ipx = 0; i < PARTICLES_AMOUNT; i++, i2 += 2, i3 += 3, ipx += step) {

                let x = ipx % imgData.width,
                    y = ipx / imgData.width | 0,
                    pixel = _getPixel(imgData, x, y)

                //if (pixel.r === 1 && pixel.g === 1 && pixel.b === 1) {

                if (pixel.r !== 0) {
                    let position = new THREE.Vector3(
                        //(x - imgData.width / 2) * IMG_SCALE,
                        //(imgData.height / 2 - y) * IMG_SCALE,
                        //0)
                        x, y, 0)


                    // UV from 0 to 1
                    puv[i2 + 0] = position.x / imgData.width;
                    puv[i2 + 1] = position.y / imgData.height;

                    // Position
                    positions[i3 + 0] = position.x;
                    positions[i3 + 1] = position.y;
                    positions[i3 + 2] = position.z;

                    // Extras
                    extras[i3 + 0] = random(1, 200)
                    extras[i3 + 1] = random(1, 200)
                    extras[i3 + 2] = random(1, 200)

                    // Color
                    let color = new THREE.Color().setHSL(simplex.noise2D(position.x, position.y) * 0.5, 0.8, 0.1)
                    colors[i3 + 0] = color.r
                    colors[i3 + 1] = color.g
                    colors[i3 + 2] = color.b
                }

            }

            geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.addAttribute('extra', new THREE.BufferAttribute(extras, 3));
            //http://stackoverflow.com/questions/15697898/why-particle-system-with-shader-doesnt-work-three-js
            geometry.addAttribute('puv', new THREE.BufferAttribute(puv, 2));

        }

        init() {

            this.loader.load('/dist/assets/Drones/earth_political_alpha.png', (texture) => {
                this.loader.load('/dist/assets/nova_particle.png', (particleTexture) => {
                    const bgImg = texture.image.src

                    this._getImgData(bgImg).then(imgData => {

                        const geometry = new THREE.BufferGeometry()
                        this._addAttributes(geometry, imgData)

                        const material = new THREE.ShaderMaterial({

                            uniforms: {
                                uTime: {
                                    value: 0
                                },
                                uTimeInit: {
                                    value: randomInt(0, 100)
                                },
                                uAnimationSphere: {
                                    value: conf.sphere
                                },
                                uAnimationFlat: {
                                    value: conf.flat
                                },
                                bgImg: {
                                    value: bgImg
                                },
                                uSphereRadius: {
                                    value: 1000
                                },
                                uMatrightBottom: {
                                    value: new THREE.Vector2(180.0, -90.0)
                                },
                                uMatleftTop: {
                                    value: new THREE.Vector2(-180.0, 90.0)
                                },
                            },
                            vertexShader: mapVS,
                            fragmentShader: mapFS,
                            blending: THREE.AdditiveBlending,
                            transparent: true,
                            depthWrite: true,
                            depthTest: false,
                        });

                        const particles = new THREE.Points(geometry, material)
                        this.add(particles)

                        super.tick(dt => material.uniforms.uTime.value += dt * 0.2)
                        //material.uniforms.uAnimation.value = conf.animation
                    })
                })
            })
        }

        doFlat() {

            tweenr.to(mesh.material.uniforms.uAnimationFlat, {
                value: 1,
                duration: 2
            })
            tweenr.to(mesh.material.uniforms.uAnimationSphere, {
                value: 0,
                duration: 2
            })
        }

        doSphere() {

            tweenr.to(mesh.material.uniforms.uAnimationSphere, {
                value: 1,
                duration: 2
            })
            tweenr.to(mesh.material.uniforms.uAnimationFlat, {
                value: 0,
                duration: 2
            })
        }

        doChaos() {
            tweenr.to(mesh.material.uniforms.uAnimationSphere, {
                value: 0,
                duration: 2
            })
            tweenr.to(mesh.material.uniforms.uAnimationFlat, {
                value: 0,
                duration: 2
            })
        }
    }


    const mapVS = glslify(`
    #pragma glslify: snoise4 = require(glsl-noise/simplex/4d)
#pragma glslify: PI = require(glsl-pi)
#pragma glslify: ease = require(glsl-easings/quadratic-in)

attribute vec3 color;
attribute vec3 extra;
attribute vec2 puv;


uniform float uTime;
uniform float uTimeInit;
uniform float uAnimationSphere;
uniform float uAnimationFlat;

uniform vec2 uMatrightBottom;
uniform vec2 uMatleftTop;
uniform float uSphereRadius;


varying vec2 vUv;
varying vec3 vColor;


        // convert the positions from a lat, lon to a position on a sphere.
    vec3 latLongToVector3(float lat, float lon, float radius) {
        float phi = (lat)*PI/180.0;
        float theta = (lon-180.0)*PI/180.0;

        float x = radius * cos(phi) * cos(theta);
        float y = radius * cos(phi) * sin(theta);
        float z = radius * sin(phi);

        // return vec3(x,y,z);
                // the above math calls Z up - 3D calls Y up
                // i don't know why it has to be negative :P
        return vec3(x,z,-y);
    }

        vec2 uvToLatLong(vec2 uvs, vec2 leftTop, vec2 rightBottom ) {
                // uv coordinates go from bottom-left to top-right
                // 0.0,0.0 is bottom left, 1.0,1.0 is top right, 0.5,0.5 is center
                // latLong coords go depending on which demisphere you're in
                float right = rightBottom.x;
                float bottom = rightBottom.y;
                float left = leftTop.x;
                float top = leftTop.y;
                float xDiff = right - left;
                float yDiff = bottom - top;

                // treat uv as a completion ratio from left to right and bottom to top
                float xPercent = left + ( xDiff * uvs.x );
                float yPercent = bottom - ( yDiff * uvs.y );

                vec2 latlong = vec2( xPercent, yPercent );
                return latlong;
        }

vec3 chaosPosition(vec3 pos) {
  float vel = uTime * 0.05;
  return vec3(pos.x + snoise4(vec4(pos.x, pos.y, pos.z, uTime * 0.1)) * 1000.,
              pos.y + snoise4(vec4(pos.x, pos.y, pos.z, uTime * 0.1 + 1.25)) * 1000.,
              pos.z + snoise4(vec4(pos.x, pos.y, pos.z, uTime * 0.1 + 12.25)) * 1000.);
}


   void main() {
        vUv = uv;
       vColor = color;
     vec3 pos = position;


      vec2 newLatLong = uvToLatLong(puv, uMatleftTop, uMatrightBottom);

            vec3 spherePosition = latLongToVector3(newLatLong.y, newLatLong.x, uSphereRadius);
      vec3 chaosPosition = chaosPosition(pos);
      vec3 flatPosition = position;

       vec3 newPosition = chaosPosition;

     newPosition = mix( newPosition, spherePosition, ease(uAnimationSphere));
     newPosition = mix( newPosition, flatPosition, ease(uAnimationFlat));


      //newPosition.z += sin(newPosition.x * 0.01 + newPosition.y * 0.01 + uTime * 10.) * 200.;

          vec4 mvPosition = modelViewMatrix * vec4( newPosition, 1.0 );

        gl_Position = projectionMatrix * mvPosition;
       gl_PointSize = 25.0;
      }


`, {
        inline: true
    })


    const mapFS = glslify(`

varying vec2 vUv;
varying vec3 vColor;

uniform float uTime;

        void main()
        {
          vec2 center = vec2(0.5, 0.5);
          float t = 0.05 / length(gl_PointCoord - center);
          t = pow(t, 2.5);
          vec3 final = vec3(t);
          final *= vColor;

          gl_FragColor = vec4(final, 1.0);

        }

`, {
        inline: true
    })


    /*

function createRingGeomtry(radius) {

    const positions = new Float32Array(RING_SEGMENTS * 3)

    for (let i = 0; i < positions.length; i += 3) {

        const x = radius * Math.cos(i / (RING_SEGMENTS * 3 - 3) * Math.PI * 2),
            z = radius * Math.sin(i / (RING_SEGMENTS * 3 - 3) * Math.PI * 2)

        positions[i] = x
        positions[i + 1] = 0
        positions[i + 2] = z
    }
    return positions
}

const createRing = (radius, scene) => {

    let color = new THREE.Color()



    color.setHSL((180 + Math.random() * 40) / 360, 1.0, 0.5)


    const ringMaterial = new THREE.MeshLineMaterial({
        useMap: false,
        color: color.clone(),
        lineWidth: randomInt(2, 5),
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        transparent: true,
    })

    let offset = randomInt(0, 50)

    const ring = new THREE.MeshLine()
    ring.setGeometry(createRingGeomtry(radius))

    // Remove center vertex
    //ringGeometry.vertices.shift();
    let ringMesh = new THREE.Mesh(ring.geometry, ringMaterial)
    ringMesh._radius = radius
    ringMesh._offset = offset
    ringMesh._opacity = 1
    ringMesh.position.set(0, 0, 0)
    ringMesh.rotation.set(0, 0, random(-Math.PI / 8, Math.PI / 8))
    group.add(ringMesh)


    let randTheta = random(0, Math.PI / 4),
        finalRadius = Math.cos(randTheta) * GLOBE_RADIUS + 10

    tweenr.to(ringMesh, {
        ease: 'expoOut',
        _radius: finalRadius,
        _offset: 0,
        duration: 2
    })
        .on('update', _ => {

            const s = ringMesh._radius / radius
            ringMesh.scale.set(s, s, s)
        })

    tweenr.to(ringMesh.position, {
        x: 0,
        y: randTheta * GLOBE_RADIUS,
        z: 0,
        duration: 2
    })
    tweenr.to(ringMesh.rotation, {
        x: 0,
        y: 0,
        z: random(-Math.PI / 16, Math.PI / 16),
        duration: 2
    })
    tweenr.to(ringMesh, {
        ease: 'expoIn',
        _opacity: 0,
        duration: 5
    })
        .on('complete', _ => group.remove(ringMesh))


    scene.events.on('tick', t => {
        const freq = scene.getFreq(100, 400)
        let hsl = color.getHSL()
        hsl.l *= freq


        //ringMaterial.color.setHSL(hsl.h, hsl.s, hsl.l)
        //ringMaterial.needsUpdate = true
        ringMaterial.uniforms.color.value.r = color.r
        ringMaterial.uniforms.color.value.g = color.g
        ringMaterial.uniforms.color.value.b = color.b
        ringMaterial.uniforms.opacity.value = ringMesh._opacity
    })

    return ringMesh
}

*/