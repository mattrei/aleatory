//https://github.com/ykob/sketch-threejs/blob/develop/src/js/sketches/hyper_space.js

const random = require('random-float')
const randomInt = require('random-int')
const glslify = require('glslify')
const Color = require('color')

const simplex = new(require('simplex-noise'))

import AObject from '../AObject'


const NUM = 20000
const DEPTH = 200

export
default class Tunnel extends AObject {

    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this.time = 1

        this.particles = []

        this.init()
        this.initParticles()
    }

    init() {

        var positions = new Float32Array(NUM * 3);
        var colors = new Float32Array(NUM * 3);
        var opacities = new Float32Array(NUM);
        var sizes = new Float32Array(NUM);

        for (var i = 0; i < NUM; i++) {
            //var mover = new Mover();
            var h = randomInt(60, 210)
            var s = randomInt(30, 90)
            var color = new THREE.Color('hsl(' + h + ', ' + s + '%, 50%)')

            color.toArray(colors, i * 3)

            opacities[i] = 1
            sizes[i] = 2


            const p = new Particle()
            this.particles.push(p)
        }

        const geometry = new THREE.BufferGeometry()
        const material = new THREE.ShaderMaterial({
            uniforms: {
                color: {
                    value: new THREE.Color(0xffffff)
                },
                texture: {
                    value: this.createTexture()
                }
            },
            vertexShader: glslify('../utils/Points.vert'),
            fragmentShader: glslify('../utils/Points.frag'),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
        geometry.addAttribute('vertexOpacity', new THREE.BufferAttribute(opacities, 1));
        geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));

        this.mesh = new THREE.Points(geometry, material)

        this.add(this.mesh)

    }

    _genPoints() {
        const FACTOR = 200
        const points = []
        for (let i = 0; i < 1000; i++) {
            points.push(new THREE.Vector3(random(-1, 1)*FACTOR, random(-1, 1)*FACTOR, i * DEPTH/2))
        }
        return points
    }

    initParticles() {

        const points = this._genPoints()
        this.spline = new THREE.CatmullRomCurve3(points)

        this.particles.forEach(p => {
            const rad = random(0, Math.PI * 2)
            const range = Math.log(randomInt(2, 128)) / Math.log(128) * 10 + 20
            const x = Math.cos(rad) * range,
                y = Math.sin(rad) * range;

            const vector = new THREE.Vector3(x, y, random(0, DEPTH))

            p.setPosition(vector)

            const accel = new THREE.Vector3(0, 0, random(0, -2))
            p.setAcceleration(accel)

            p.setAlpha(0)
            p.setSize(random(2, 4))
        })
    }

    updateParticles() {

        //const vel = new THREE.Vector3(0,0, conf.speed)

        let numParticles = Math.pow(this.conf.speed, 1.8) * NUM
        this.particles.forEach(p => {
            if (numParticles-- > 0) {
                p.setActive(true)
            } else {
                p.setActive(false)
                p.setAlpha(0)
            }
        })

        this.particles.forEach(p => {

            if (p.getActive()) {

                const pos = p.getPosition()


                const vel = new THREE.Vector3(0, 0, -this.conf.speed * 3)

                p.setVelocity(vel)
                p.updateVelocity()
                p.updatePosition()

                if (p.getAlpha() < 0.8) {
                    p.setAlpha(p.getAlpha() + 0.01)
                }

                if (pos.z < 0) {
                    pos.z = DEPTH
                    p.setAlpha(0)
                    p.setActive(false)
                }
            }
        })
    }

    update(dt) {

        super.update(dt)
        this.time += dt

        if (this.spline) this.updateParticles()

        const positions = this.mesh.geometry.attributes.position.array,
            opacities = this.mesh.geometry.attributes.vertexOpacity.array,
            sizes = this.mesh.geometry.attributes.size.array



        this.particles.forEach((p, i) => {

            const pos = p.getPosition()

            const t = ((Math.abs(pos.z) + this.time  * 50 * this.conf.speed) % this.spline.getLength()) / this.spline.getLength()
            const splinePos = this.spline.getPointAt(t)

            positions[i * 3 + 0] = pos.x + (splinePos.x * (pos.z/DEPTH))
            positions[i * 3 + 1] = pos.y + (splinePos.y * (pos.z/DEPTH))
            positions[i * 3 + 2] = pos.z

            opacities[i] = p.getAlpha()
            sizes[i] = p.getSize()
        })

        const t = ((1 + this.time  * 50 * this.conf.speed) % this.spline.getLength()) / this.spline.getLength()
        const splinePos = this.spline.getPointAt(t)
        this.camera.lookAt(splinePos)

        this.mesh.geometry.attributes.position.needsUpdate = true
        this.mesh.geometry.attributes.vertexOpacity.needsUpdate = true
        this.mesh.geometry.attributes.size.needsUpdate = true
        this.mesh.geometry.attributes.customColor.needsUpdate = true
    }

    createTexture() {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var grad = null;
        var texture = null;

        canvas.width = 200;
        canvas.height = 200;
        grad = ctx.createRadialGradient(100, 100, 20, 100, 100, 100);
        grad.addColorStop(0.2, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        grad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.arc(100, 100, 100, 0, Math.PI / 180, true);
        ctx.fill();

        texture = new THREE.Texture(canvas);
        texture.minFilter = THREE.NearestFilter;
        texture.needsUpdate = true;
        return texture;
    }

}



class Particle {
    constructor(args) {
        this.position = new THREE.Vector3()
        this.alpha = 1
        this.size = 1
        this.mass = 1
        this.isActive = true

        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
    }
    updatePosition() {
        this.position.add(this.velocity)
    }
    updateVelocity() {
        this.acceleration.divideScalar(this.mass);
        this.velocity.add(this.acceleration)
    }

    setVelocity(velocity) {
        this.velocity.copy(velocity)
    }

    setAcceleration(accleration) {
        this.acceleration.copy(accleration)
    }

    setPosition(position) {
        this.position.copy(position)
    }
    getPosition() {
        return this.position
    }
    getAlpha() {
        return this.alpha
    }
    setAlpha(a) {
        this.alpha = a
    }
    getSize() {
        return this.size
    }
    setSize(size) {
        this.size = size
    }
    getActive() {
        return this.isActive
    }
    setActive(active) {
        this.isActive = active
    }
}