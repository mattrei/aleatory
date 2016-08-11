const glslify = require('glslify')
const simplex = new(require('simplex-noise'))
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

const RADIUS = 1

const ALTITUDE = RADIUS * 2


export
default class Globe extends AObject {
    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this.cameraRotation = {
            x: 0,
            y: 0
        };
        this.cameraTarget = {
            x: 0,
            y: 0
        };

        this.ready = false
        this.tick = 0

        
        this.init()
        this.initSun()
        this.initDrones()
    }

    _posOnSphere(obj, coords) {
        var x = coords.x;
        var y = coords.y;
        var altitude = coords.altitude;

        obj.position.set(
            altitude * Math.sin(x) * Math.cos(y),
            altitude * Math.sin(y),
            altitude * Math.cos(x) * Math.cos(y)
        )
    }


    moveEarth() {
        cameraRotation.x += (cameraTarget.x - cameraRotation.x) * 0.1;
        cameraRotation.y += (cameraTarget.y - cameraRotation.y) * 0.1;

        // determine camera position
        posOnSphere(this.camera, {
            x: cameraRotation.x,
            y: cameraRotation.y,
            altitude: ALTITUDE
        })
        this.camera.lookAt(mesh.position)
    }


    latLngOnSphere(lat, lng) {
        const phi = (90 + lng) * Math.PI / 180,
            theta = (180 - lat) * Math.PI / 180

        return {
            x: phi - Math.PI,
            y: Math.PI - theta
        }
    }

    doLatLng(lat = 32, lng = 69) {

        let p = latLngOnSphere(lat, lng)

        tweenr.to(cameraTarget, {
            x: p.x,
            y: p.y,
            duration: 0.5
        }).on('update', _ => moveEarth())
    }

    doRnd() {

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

    doRndFire() {

        let lat = random(-90, 90),
            lng = random(-180, 180)

        let p = _getPosFromLatLng(lat, lng)

        particleGroup.triggerPoolEmitter(1, p);

    }

    initDrones() {

        //const drone = new Drone(this.loader, RADIUS * 1.3)
        const drone = new FireDrone(this.loader, RADIUS * 1.3)

        this.add(drone)

        super.tick(dt => drone.update(dt))
    }

    init() {


        const tilt = 0.41,
            cloudsScale = 1.005,
            atmoScale = 1.2,
            moonScale = 0.23

        const textureLoader = this.loader

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
        const geometry = new THREE.SphereGeometry(RADIUS, 100, 50);

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
                },
                uColor: {
                    value: new THREE.Color().setHSL(204, 67, 55)
                }
            },
            fragmentShader: this._FS(),
            vertexShader: this._VS(),
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

        const pivotMoon = new THREE.Object3D()
        this.add(pivotMoon)

        const meshMoon = new THREE.Mesh(geometry, materialMoon);
        meshMoon.position.set(RADIUS * 5, 0, 0);
        meshMoon.scale.set(moonScale, moonScale, moonScale);
        pivotMoon.add(meshMoon)

        super.tick(dt => pivotMoon.rotation.y += 0.05 * dt)

    }

    _FS() {
        return glslify(`
uniform float glowIntensity;
        uniform float redIntensity;
        uniform vec3 uColor;
        varying vec3 vNormal;


        void main() {
          float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), glowIntensity * 5. );
          vec3 color = uColor;
          gl_FragColor = vec4( color, 1.0 ) * intensity ;
        }

            `, {inline: true})
    }

    _VS() {
        return glslify(`
#pragma glslify: snoise3 = require('glsl-noise/simplex/3d')


uniform float distort;
uniform float time;

        varying vec3 vNormal;
        void main() {

        float radius = 1.0;

float updateTime = time / 10.0;
        float noise = snoise3(vec3(position / 400.1 + updateTime * 5.0));
        vec3 newPosition = position * (noise * pow(distort, 2.0) + radius);



          vNormal = normalize( normalMatrix * normal );
          gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
        }

            `, {inline: true})
    }

    initSun() {

        const dirLight = new THREE.DirectionalLight(0xffffff);
        dirLight.position.set(-1, 0, 1).normalize();
        dirLight.color.setHSL(0.1, 0.7, 0.5)
        //this.add(dirLight)


        const textureFlare0 = this.loader.load("/dist/assets/lensflare/lensflare0.png"),
            textureFlare2 = this.loader.load("/dist/assets/lensflare/lensflare2.png"),
            textureFlare3 = this.loader.load("/dist/assets/lensflare/lensflare3.png")


        const _addLight = (h, s, l, x, y, z) => {

            var light = new THREE.PointLight(0xffffff, 1.5, 2000);
            light.color.setHSL(h, s, l);
            light.position.set(x, y, z);
            this.add(light);

            var flareColor = new THREE.Color(0xffffff);
            flareColor.setHSL(h, s, l + 0.5);

            var lensFlare = new THREE.LensFlare(textureFlare0, 700, 0.0, THREE.AdditiveBlending, flareColor);

            lensFlare.add(textureFlare2, 512, 0.0, THREE.AdditiveBlending);
            lensFlare.add(textureFlare2, 512, 0.0, THREE.AdditiveBlending);
            lensFlare.add(textureFlare2, 512, 0.0, THREE.AdditiveBlending);

            lensFlare.add(textureFlare3, 60, 0.6, THREE.AdditiveBlending);
            lensFlare.add(textureFlare3, 70, 0.7, THREE.AdditiveBlending);
            lensFlare.add(textureFlare3, 120, 0.9, THREE.AdditiveBlending);
            lensFlare.add(textureFlare3, 70, 1.0, THREE.AdditiveBlending);

            lensFlare.customUpdateCallback = _ => this._lensFlareUpdateCallback
            lensFlare.position.copy(light.position);

            this.add(lensFlare);

        }

        _addLight(0.995, 0.5, 0.9, RADIUS * 100, 0, 0);
    }



    _lensFlareUpdateCallback(object) {

        var f, fl = object.lensFlares.length;
        var flare;
        var vecX = -object.positionScreen.x * 2;
        var vecY = -object.positionScreen.y * 2;


        for (f = 0; f < fl; f++) {

            flare = object.lensFlares[f];

            flare.x = object.positionScreen.x + vecX * flare.distance;
            flare.y = object.positionScreen.y + vecY * flare.distance;

            flare.rotation = 0;

        }

        object.lensFlares[2].y += 0.025;
        object.lensFlares[3].rotation = object.positionScreen.x * 0.5 + THREE.Math.degToRad(45);

    }
}

/*
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

*/

import Force3 from '../utils/Force3'
import Points from '../utils/Points'
import Mover from '../utils/Mover'
import ForcePointLight from '../utils/ForcePointLight'

const NUM_PARTICLES = 400

class FireDrone extends THREE.Object3D {

    constructor(loader, radius) {
        super()

        this.loader = loader

        this.radius = radius
        this.xRadius = radius * 1.4
        this.yRadius = radius * 2
        this.zRadius = radius * 1.9

        this.last_time_activate = Date.now()
        this.gravity = new THREE.Vector3(0, 0.01, 0)

        this.tick = 0

        this.init()
    }

    init() {

        const points = new Points()
        const light = new ForcePointLight(0xff6600, 1)

        const movers = []

        this.positions = new Float32Array(NUM_PARTICLES * 3)
        this.colors = new Float32Array(NUM_PARTICLES * 3)
        this.opacities = new Float32Array(NUM_PARTICLES)
        this.sizes = new Float32Array(NUM_PARTICLES)
            

        for (var i = 0; i < NUM_PARTICLES; i++) {
            var mover = new Mover();
            var h = randomInt(0, 45);
            var s = randomInt(60, 90);
            var color = new THREE.Color('hsl(' + h + ', ' + s + '%, 50%)');

            mover.init(new THREE.Vector3(random(-this.radius, this.radius), 0, 0));
            movers.push(mover);

            this.positions[i * 3 + 0] = mover.position.x;
            this.positions[i * 3 + 1] = mover.position.y;
            this.positions[i * 3 + 2] = mover.position.z;
            color.toArray(this.colors, i * 3);
            this.opacities[i] = mover.a;
            this.sizes[i] = mover.size;
        }


        points.init({
            parent: this,
            vs: glslify('../utils/Points.vert'),
            fs: glslify('../utils/Points.frag'),
            positions: this.positions,
            colors: this.colors,
            opacities: this.opacities,
            sizes: this.sizes,
            texture: this.loader.load('/dist/assets/Drones/satelliteparticle.png'), //createTexture(),
            blending: THREE.AdditiveBlending
        })

        this.add(light)

        this.points = points
        this.light = light
        this.movers = movers
    }

    activateMover() {
        var count = 0;
        var now = Date.now();
        if (now - this.last_time_activate > 4) {
            for (var i = 0; i < this.movers.length; i++) {
                var mover = this.movers[i];
                if (mover.is_active) continue;
                var rad1 = THREE.Math.degToRad(Math.log(randomInt(0, 256)) / Math.log(256) * 260);
                var rad2 = THREE.Math.degToRad(randomInt(0, 360));

                var range = (1 - Math.log(randomInt(32, 256)) / Math.log(256)) * 12;
                range = random(0.01, 0.1)

                var vector = new THREE.Vector3()

                var force = this._getSpherical(rad1, rad2, range);

                vector.add(this.points.position);
                mover.activate();
                mover.init(vector);
                mover.applyForce(force);
                mover.a = random(0.6, 1)
                //mover.size = Math.pow(12 - range, 2) * randomInt(1, 2) / 10;
                mover.size = random(0.1, 0.4)

                count++;
                if (count >= 6) break;
            }
            this.last_time_activate = Date.now();
        }
    };

    _getSpherical(rad1, rad2, r) {
        var x = Math.cos(rad1) * Math.cos(rad2) * r;
        var z = Math.cos(rad1) * Math.sin(rad2) * r;
        var y = Math.sin(rad1) * r;
        return new THREE.Vector3(x, y, z);
    }

    updateMover() {
        const gravity = new THREE.Vector3()
            .subVectors(this.points.position, new THREE.Vector3())
            .normalize()

        for (var i = 0; i < this.movers.length; i++) {
            var mover = this.movers[i];
            if (mover.is_active) {
                mover.time++;
                mover.applyForce(this.gravity);
                mover.applyDrag(0.01);
                mover.updateVelocity();
                mover.updatePosition();
                mover.position.sub(this.points.position);
                if (mover.time > 50) {
                    mover.size -= 0.07;
                    mover.a -= 0.2;
                }
                if (mover.a <= 0) {
                    mover.init(new THREE.Vector3(0, 0, 0));
                    mover.time = 0;
                    mover.a = 0.0;
                    mover.inactivate();
                }
            }
            this.positions[i * 3 + 0] = mover.position.x - this.points.position.x;
            this.positions[i * 3 + 1] = mover.position.y - this.points.position.y;
            this.positions[i * 3 + 2] = mover.position.z - this.points.position.z;
            this.opacities[i] = mover.a;
            this.sizes[i] = mover.size;
        }
        this.points.updatePoints();
    };



    movePoints(dt) {

        const t = 1 * this.tick
        const s = 0.07 * 1//freq;

        const x = Math.cos(t) * this.xRadius,
            y = Math.sin(t * 0.8) * (this.yRadius + s),
            z = Math.sin(t) * this.zRadius;

        this.points.anchor.x = x;
        this.points.anchor.y = y;
        this.points.anchor.z = z;

        this.light.force.anchor.x = x
        this.light.force.anchor.y = y
        this.light.force.anchor.z = z

        this.points.position.set(x,y,z)
        this.light.position.set(x,y,z)
    }

    update(dt) {
        this.tick += dt

        this.points.applyDrag(0.6);

        this.points.updateVelocity();
        this.points.updatePosition();

        this.light.force.applyDrag(0.2);
        this.light.force.updateVelocity();
        this.light.updatePosition();


        this.activateMover();
        this.updateMover();
        this.movePoints(dt, 2)    

        
    }

}


const MAX_PARTICLES = 10000

class Drone extends THREE.Object3D {
    constructor(loader, radius) {
        super()

        this.pos = new THREE.Object3D(radius, 0, 0)

        this.nbParticles = 0;

        this.tick = 0

        // Particle settings
        this.life = 2.0;
        this.size = 1.0;
        this.spawnRate = 400;
        this.horizontalSpeed = 0.8;
        this.verticalSpeed = 0.8;
        this.maxVelocityX = 0.3;
        this.maxVelocityY = 0.6;

        this.xRadius = radius * 1
        this.yRadius = radius * 1
        this.zRadius = radius * 1
        this.startTime = 0.0;

        this.velocity = new THREE.Vector3(0, 0, 0);

        this.particleSpriteTex = loader.load('/dist/assets/Drones/satelliteparticle.png')

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
            vertexShader: this._VS(),
            fragmentShader: this._FS(),
            depthTest: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
        });

        this.init()

    }

    _FS() {
        return glslify(`
        varying float lifeLeft;

uniform sampler2D sprite;

void main() {
  vec3 color = vec3(0., 0.650, 0.4);
  vec4 tex = texture2D( sprite, gl_PointCoord );
  float alpha = lifeLeft * .25;

  gl_FragColor = vec4( color.rgb * tex.a, alpha * tex.a );

}
`, {
            inline: true
        })
    }

    _VS() {
        return glslify(`
        #pragma glslify: pnoise = require(glsl-noise/periodic/3d.glsl)

uniform float time;

attribute vec3 velocity;
attribute float startTime;
attribute float size;
attribute float life;

varying float lifeLeft;

// Thanks to Spite for this function
float turbulence( vec3 p ) {
  float t = -.5;
  for (float f = 1.0 ; f <= 10.0 ; f++ ){
      float power = pow( 2.0, f );
      t += abs( pnoise( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );
  }
  return t;
}

void main() {
  vec3 newPosition;
  vec3 vel;

  float elapsedTime = time - startTime;
  float timeOnLife = elapsedTime / life;

  lifeLeft = 1.0 - timeOnLife;

  float scale = 3.0;
  gl_PointSize = ( scale * size ) * lifeLeft;

  float turb = turbulence( vec3( velocity.x * elapsedTime, velocity.y * elapsedTime, velocity.z * elapsedTime ) );
  float noise = pnoise( velocity * timeOnLife, vec3( 1000.0 ) );
  float displacement = 10. * noise + (30. * timeOnLife * turb);

  newPosition = position + velocity * displacement;

  if( gl_PointSize < .05 ) {
    lifeLeft = 0.;
  }

  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
}
`, {
            inline: true
        })
    }

    init() {
        this.positions = new Float32Array(MAX_PARTICLES * 3);
        this.velocities = new Float32Array(MAX_PARTICLES * 3);
        this.startTimes = new Float32Array(MAX_PARTICLES)
        this.lifes = new Float32Array(MAX_PARTICLES);
        this.sizes = new Float32Array(MAX_PARTICLES);

        this.geom.addAttribute('position', new THREE.BufferAttribute(this.positions, 3).setDynamic(true));
        this.geom.addAttribute('velocity', new THREE.BufferAttribute(this.velocities, 3).setDynamic(true));
        this.geom.addAttribute('startTime', new THREE.BufferAttribute(this.startTimes, 1).setDynamic(true));
        this.geom.addAttribute('size', new THREE.BufferAttribute(this.sizes, 1).setDynamic(true));
        this.geom.addAttribute('life', new THREE.BufferAttribute(this.lifes, 1).setDynamic(true));


        const mesh = new THREE.Points(this.geom, this.mat)
        mesh.position.set(0, 0, 0)
        mesh.visible = true
        this.add(mesh)

        this.mesh = mesh
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

    update(dt) {

        if (!this.mesh || !this.mesh.visible) {
            return
        }

        this.tick += dt * 0.1

        const t = this.tick,
            s = 1

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
        this.mat.uniforms.time.value += dt * 0.1

        this.geom.attributes.position.needsUpdate = true;
        this.geom.attributes.velocity.needsUpdate = true;
        this.geom.attributes.startTime.needsUpdate = true;
        this.geom.attributes.size.needsUpdate = true;
        this.geom.attributes.life.needsUpdate = true;
    }
}