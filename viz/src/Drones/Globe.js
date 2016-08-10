const glslify = require('glslify')
const random = require('random-float')
const randomInt = require('random-int')
const tweenr = require('tweenr')()
const Tween = require('tween-chain')

require('../utils/THREE.MeshLine')

const GLOBE_RADIUS = 200
const RING_SEGMENTS = 64


import AObject from '../AObject'

// satellite
// https://github.com/ykob/sketch-threejs

export
default class Globe extends AObject {
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

    init() {

        const radius = 1,
            tilt = 0.41,
            cloudsScale = 1.005,
            atmoScale = 1.2,
            moonScale = 0.23

        const textureLoader = this.loader

        const dirLight = new THREE.DirectionalLight(0xffffff);
        dirLight.position.set(-1, 0, 1).normalize();
        this.add(dirLight)

        var materialNormalMap = new THREE.MeshPhongMaterial({

            specular: 0x333333,
            shininess: 15,
            map: textureLoader.load("/dist/assets/Drones/earth4096.jpg"),
            specularMap: textureLoader.load("/dist/assets/Drones/earth_specularmap4096.png"),
            normalMap: textureLoader.load("/dist/assets/Drones/earth_normalmap4096.jpg"),
            normalScale: new THREE.Vector2(0.85, 0.85),
            bumpMap: textureLoader.load("/dist/assets/Drones/earth_bumpmap4096.jpg"),
            bumpScale: new THREE.Vector2(0.05, 0.05)

        });

        // planet
        const geometry = new THREE.SphereGeometry(radius, 100, 50);

        const meshPlanet = new THREE.Mesh(geometry, materialNormalMap);
        meshPlanet.rotation.y = 0;
        meshPlanet.rotation.z = tilt;
        this.add(meshPlanet);

        // clouds
        const materialClouds = new THREE.MeshPhongMaterial({

            alphaMap: textureLoader.load("/dist/assets/Drones/clouds4096.jpg"),
            transparent: true,
        });

        const meshClouds = new THREE.Mesh(geometry, materialClouds);
        meshClouds.scale.set(cloudsScale, cloudsScale, cloudsScale);
        meshClouds.rotation.z = tilt;
        this.add(meshClouds);

        super.tick(dt => meshClouds.rotation.y += 0.015 * dt)

        // atmosphere
        const atmoMaterial = new THREE.ShaderMaterial({

            uniforms: {
                glowIntensity: {
                    value: 1
                },
                redIntensity: {
                    value: 0
                },
                distort: {
                    value: 0
                },
                time: {
                    value: 0
                }
            },
            fragmentShader: glslify('./Atmosphere.frag'),
            vertexShader: glslify('./Atmosphere.vert'),
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true

        });

        const atmoMesh = new THREE.Mesh(geometry, atmoMaterial)
        atmoMesh.scale.set(atmoScale, atmoScale, atmoScale)
        this.add(atmoMesh)


        // moon
        const materialMoon = new THREE.MeshPhongMaterial({

            map: textureLoader.load("/dist/assets/Drones/moon1024.jpg"),

        });

        const meshMoon = new THREE.Mesh(geometry, materialMoon);
        meshMoon.position.set(radius * 5, 0, 0);
        meshMoon.scale.set(moonScale, moonScale, moonScale);
        this.add(meshMoon);

    }
}


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


function globe(scene, events) {

    let mesh = null,
        particleGroup = null



    scene.loader.load('/assets/Drones/world.jpg', texture => {
        scene.loader.load('/assets/Drones/smokeparticle.png', smoke => {

            let geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 40, 30)
            const explodeModifier = new THREE.ExplodeModifier()
            explodeModifier.modify(geometry)

            const material = new THREE.ShaderMaterial({

                //uniforms: uniforms,
                uniforms: {
                    texture: {
                        value: texture
                    },
                    glowIntensity: {
                        value: 3
                    },
                    redIntensity: {
                        value: 0
                    },
                    distort: {
                        value: 0
                    },
                    time: {
                        value: 0
                    }
                },
                transparent: true,
                fragmentShader: glslify('./Earth.frag'),
                vertexShader: glslify('./Earth.vert')

            });
            material.side = THREE.DoubleSide;


            mesh = new THREE.Mesh(geometry, material)
            mesh.rotation.y = Math.PI;
            group.add(mesh)


            // add atmosphere
            let atmoMaterial = new THREE.ShaderMaterial({

                uniforms: {
                    glowIntensity: {
                        value: 1
                    },
                    redIntensity: {
                        value: 0
                    },
                    distort: {
                        value: 0
                    },
                    time: {
                        value: 0
                    }
                },
                fragmentShader: glslify('./Atmosphere.frag'),
                vertexShader: glslify('./Atmosphere.vert'),
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                transparent: true

            });

            const atmoMesh = new THREE.Mesh(geometry, atmoMaterial)
            atmoMesh.scale.set(1.1, 1.1, 1.1)
            group.add(atmoMesh)
            mesh.atmosphere = atmoMesh




            let lastTime = 0
            events.on('tick', t => {

                if (conf.rings) {

                    const freq = scene.getFreq(0, 100)
                        //console.log(freq)

                    if (freq > 0.5) {
                        //
                        if (t.time - lastTime > random(0.5, 2)) {
                            let ring = createRing(GLOBE_RADIUS * 20, scene)
                            lastTime = t.time
                        }
                    }
                }

                let distort = 0,
                    glowing = 1.0

                material.uniforms.redIntensity.value = 0
                atmoMaterial.uniforms.redIntensity.value = 0
                if (conf.distort) {
                    distort = 0.5
                    glowing = 1.0
                    material.uniforms.redIntensity.value = Math.sin(t.time)
                    atmoMaterial.uniforms.redIntensity.value = Math.sin(t.time)
                }

                material.uniforms.distort.value = distort
                material.uniforms.glowIntensity.value = glowing

                material.uniforms.time.value = t.time


                atmoMaterial.uniforms.glowIntensity.value = glowing
                atmoMaterial.uniforms.distort.value = distort
                atmoMaterial.uniforms.time.value = t.time


            })

            events.on(VIS + '::visOn', (_) => {

                group.visible = true
                mesh.scale.set(0, 0, 0)
                mesh.atmosphere.scale.set(0, 0, 0)
                tweenr.to(mesh.scale, {
                    x: 1,
                    y: 1,
                    z: 1,
                    duration: 2
                })
                tweenr.to(mesh.atmosphere.scale, {
                    x: 1.1,
                    y: 1.1,
                    z: 1.1,
                    duration: 2
                })

            })
            events.on(VIS + '::visOff', (_) => group.visible = false)
        })
    })


    const doExplode = () => {
        const geometry = mesh.geometry


        for (var i = 0; i < (geometry.vertices.length); i++) {

            var pos = new THREE.Vector3();
            var v = geometry.vertices[i]


            pos.x += v.x * random(0, 50)
            pos.y += v.y * random(0, 50)
            pos.z += v.z * random(0, 50)


            tweenr.to(geometry.vertices[i], {
                x: pos.x,
                y: pos.y,
                z: pos.z,
                duration: 5
            })
                .on('update', _ => geometry.verticesNeedUpdate = true)
                .on('complete', _ => group.visible = false)


        }
    }


    events.on(VIS + '::doExplode', (p) => {
        doExplode()
    })
    conf.doExplode = doExplode

    // camera's position
    const cameraRotation = {
        x: 0,
        y: 0
    };
    const cameraTarget = {
        x: 0,
        y: 0
    };

    const ALTITUDE = 1000

    const posOnSphere = (obj, coords) => {
        var x = coords.x;
        var y = coords.y;
        var altitude = coords.altitude;

        obj.position.set(
            altitude * Math.sin(x) * Math.cos(y),
            altitude * Math.sin(y),
            altitude * Math.cos(x) * Math.cos(y)
        );
    }


    const moveEarth = () => {
        cameraRotation.x += (cameraTarget.x - cameraRotation.x) * 0.1;
        cameraRotation.y += (cameraTarget.y - cameraRotation.y) * 0.1;

        // determine camera position
        posOnSphere(scene.camera, {
            x: cameraRotation.x,
            y: cameraRotation.y,
            altitude: ALTITUDE
        })
        scene.camera.lookAt(mesh.position)
    }


    const latLngOnSphere = (lat, lng) => {
        const phi = (90 + lng) * Math.PI / 180,
            theta = (180 - lat) * Math.PI / 180

        return {
            x: phi - Math.PI,
            y: Math.PI - theta
        }
    }

    const doLatLng = (lat = 32, lng = 69) => {

        let p = latLngOnSphere(lat, lng)

        tweenr.to(cameraTarget, {
            x: p.x,
            y: p.y,
            duration: 0.5
        }).on('update', _ => moveEarth())
    }
    events.on(VIS + '::doLatLng', (p) => doLatLng(37 /*p.lat*/ , 58 /*p.lng*/ ))
    conf.doLatLng = doLatLng


    const doRnd = () => {

        let moveX = random(-Math.PI * 2, Math.PI * 2),
            moveY = random(-Math.PI, Math.PI)

        moveX *= Math.random() * 0.8;
        moveY *= Math.random() * 0.8;

        tweenr.to(cameraTarget, {
            x: moveX,
            y: moveY,
            duration: 0.5
        })
            .on('update', _ => moveEarth())

    }
    events.on(VIS + '::doRnd', (p) => doRnd())
    conf.doRnd = doRnd

    const doRndFire = () => {

        let lat = random(-90, 90),
            lng = random(-180, 180)

        let p = _getPosFromLatLng(lat, lng)

        particleGroup.triggerPoolEmitter(1, p);

    }
    events.on(VIS + '::doRndFire', (p) => doRndFire())
    conf.doRndFire = doRndFire

}


const MAX_PARTICLES = 80000

class Satellite extends THREE.Object3D {
    constructor(args) {
        super()

        this.group = args.group
        this.texture = args.texture
        this.pos = args.pos
        this.freqRange = args.freqRange

        this.nbParticles = 0;

        // Particle settings
        this.life = 2.0;
        this.size = 1.0;
        this.spawnRate = 400;
        this.horizontalSpeed = 0.8;
        this.verticalSpeed = 0.8;
        this.maxVelocityX = 0.3;
        this.maxVelocityY = 0.6;
        this.xRadius = 80;
        this.yRadius = 40;
        this.zRadius = 120;
        this.startTime = 0.0;
        this.velocity = new THREE.Vector3(0, 0, 0);

        this.particleSpriteTex = THREE.ImageUtils.loadTexture('/assets/Drones/satelliteparticle.png');

        this.geom = new THREE.BufferGeometry();
        this.mat = new THREE.ShaderMaterial({
            uniforms: {
                time: {
                    type: 'f',
                    value: 0.0
                },
                tSprite: {
                    type: 't',
                    value: this.particleSprite
                },
            },
            vertexShader: glslify('./Satellite.vert'),
            fragmentShader: glslify('./Satellite.frag'),
            depthTest: false,
            transparent: true,
            blending: THREE.AdditiveBlending,
        });

        this.init();

        this.system = new THREE.Points(this.geom, this.mat)
        this.system.position.set(0, 0, 0)
        this.system.visible = true
        this.group.add(this.system)
    }

    freqRange() {
        return this.freqRange
    }

    init() {
        this.positions = new Float32Array(this.maxParticles * 3);
        this.velocities = new Float32Array(this.maxParticles * 3);
        this.startTimes = new Float32Array(this.maxParticles);
        this.lifes = new Float32Array(this.maxParticles);
        this.sizes = new Float32Array(this.maxParticles);

        this.geom.addAttribute('position', new THREE.BufferAttribute(this.positions, 3).setDynamic(true));
        this.geom.addAttribute('velocity', new THREE.BufferAttribute(this.velocities, 3).setDynamic(true));
        this.geom.addAttribute('startTime', new THREE.BufferAttribute(this.startTimes, 1).setDynamic(true));
        this.geom.addAttribute('size', new THREE.BufferAttribute(this.sizes, 1).setDynamic(true));
        this.geom.addAttribute('life', new THREE.BufferAttribute(this.lifes, 1).setDynamic(true));
    }

    spawnParticle() {
        let i = this.nbParticles;

        this.positions[i * 3 + 0] = this.pos.x + (Math.random() - 0.5) * 0.07;
        this.positions[i * 3 + 1] = this.pos.y + (Math.random() - 0.5) * 0.07;
        this.positions[i * 3 + 2] = this.pos.z + (Math.random() - 0.5) * 0.07;

        this.velocities[i * 3 + 0] = this.velocity.x + (Math.random() - 0.5) * 0.55;
        this.velocities[i * 3 + 1] = this.velocity.y + (Math.random() - 0.5) * 0.55;
        this.velocities[i * 3 + 2] = this.velocity.z + (Math.random() - 0.5) * 0.55;

        this.startTimes[i] = this.startTime;
        this.sizes[i] = this.size;
        this.lifes[i] = this.life;

        this.nbParticles++;

        if (this.nbParticles >= MAX_PARTICLES) {
            this.nbParticles = 0;
        }
    }

    update(time, freq) {

        if (!this.system.visible) {
            return;
        }

        const t = 0.1 * time;
        const s = 0.07 * freq;

        this.pos.x = Math.cos(t) * this.xRadius;
        this.pos.y = Math.sin(t * this.verticalSpeed) * (this.yRadius + s);
        this.pos.z = Math.sin(t) * this.zRadius;

        this.velocity.x = Math.sin((t + s) * this.maxVelocityX);
        this.velocity.y = Math.cos((t + s) * this.maxVelocityY);
        this.velocity.z = (Math.sin((t + s) * this.maxVelocityX) + Math.cos((t + s) * this.maxVelocityY));

        for (let x = 0; x < this.spawnRate * s; x++) {
            this.spawnParticle();
        }

        this.startTime = t;
        this.mat.uniforms.time.value = t;

        this.geom.attributes.position.needsUpdate = true;
        this.geom.attributes.velocity.needsUpdate = true;
        this.geom.attributes.startTime.needsUpdate = true;
        this.geom.attributes.size.needsUpdate = true;
        this.geom.attributes.life.needsUpdate = true;
    }
}