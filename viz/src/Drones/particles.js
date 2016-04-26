
const simplex = new(require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')
const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')

function particles(scene) {
    const VIS = 'particles'
    const conf = {
        on: false,
        sphere: 0, flat: 0
    }

    const group = new THREE.Group()
    scene.scene.add(group)
    group.visible = conf.on

    let mesh = null

    const _getImgData = (pic) => {

        return new Promise(function(fulfill, reject) {

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

    const _getPixel = (imgData, x, y) => {
        var r, g, b, a, offset = x * 4 + y * 4 * imgData.width;
        r = imgData.data[offset];
        g = imgData.data[offset + 1];
        b = imgData.data[offset + 2];
        a = imgData.data[offset + 3];

        return new THREE.Color(r/255, g/255, b/255)
    }

    const MAX_PARTICLES = 1000 * 300000 // has 2mio pixels
    const MAX_PARTICLE_DIST = 50
    const IMG_SCALE = 1

    scene.loader.load('/assets/Drones/earth_political_alpha.png', (texture) => {
      scene.loader.load('/assets/nova_particle.png', (particleTexture) => {
        const bgImg = texture.image.src

        _getImgData(bgImg).then(imgData => {

            let geometry = new THREE.BufferGeometry()

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
          console.log(numParticles)
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
                let color = new THREE.Color().setHSL(simplex.noise2D(position.x, position.y)*0.5, 0.8, 0.1 )
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

            let material = new THREE.ShaderMaterial({

                uniforms: {
                    uTime: {
                        type: 'f',
                        value: 0
                    },
                    uTimeInit: {
                        type: 'f',
                        value: randomInt(0, 100)
                    },
                    uAnimationSphere: {
                        type: 'f',
                        value: conf.sphere
                    },
                    uAnimationFlat: {
                        type: 'f',
                        value: conf.flat
                    },
                    bgImg: {
                        type: 't',
                        value: bgImg
                    },
                    uSphereRadius: {
                        type: 'f',
                        value: 1000
                    },
                    uMatrightBottom: {
                        type: 'v2',
                        value: new THREE.Vector2(180.0, -90.0)
                    },
                    uMatleftTop: {
                        type: 'v2',
                        value: new THREE.Vector2(-180.0, 90.0)
                    },
                },
                vertexShader: glslify('./Globe.vert'),
                fragmentShader: glslify('./Globe.frag'),
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: true,
                depthTest: false,
            });

            let particles = new THREE.Points(geometry, material)
            particles.visible = true
            group.add(particles)
            mesh = particles

            scene.events.on('tick', t => {
                material.uniforms.uTime.value = t.time * 0.2

                //material.uniforms.uAnimation.value = conf.animation
            })
        })
      })

    })

    const doFlat = () => {

        tweenr.to(mesh.material.uniforms.uAnimationFlat, {
            value: 1,
            duration: 2
        })
        tweenr.to(mesh.material.uniforms.uAnimationSphere, {
            value: 0,
            duration: 2
        })
    }
    scene.events.on(VIS + '::doFlat', p => {
        doFlat() /*p.duration?*/
    })
    conf.doFlat = doFlat

    const doSphere = () => {

        tweenr.to(mesh.material.uniforms.uAnimationSphere, {
            value: 1,
            duration: 2
        })
        tweenr.to(mesh.material.uniforms.uAnimationFlat, {
            value: 0,
            duration: 2
        })
    }
    scene.events.on(VIS + '::doSphere', p => {
        doSphere() /*p.duration?*/
    })
    conf.doSphere = doSphere

    const doChaos = () => {
        tweenr.to(mesh.material.uniforms.uAnimationSphere, {
            value: 0,
            duration: 2
        })
        tweenr.to(mesh.material.uniforms.uAnimationFlat, {
            value: 0,
            duration: 2
        })
    }
    scene.events.on(VIS + '::doChaos', p => {
        doChaos() /*p.duration?*/
    })
    conf.doChaos = doChaos

    scene.events.on(VIS + '::visOn', _ => group.visible = true)
    scene.events.on(VIS + '::visOff', _ => group.visible = false)

    scene.addVis(VIS, conf)
}

export default particles
