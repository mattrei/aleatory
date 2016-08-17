const simplex = new(require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')
const clamp = require('clamp')

const smoothstep = require('smoothstep')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

import AObject from '../AObject'

const glslify = require('glslify')


const STREET_WIDTH = 1
const NUM_CARLIGHTS = 40

export
default class Street extends AObject {
    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this.ready = false
        this.tick = 0
    }

    _genPoints() {
        const points = []
        for (let i = 0; i < NUM_CARLIGHTS / 2; i++) {
            points.push(new THREE.Vector3(random(-3, 3), random(0, 2), i * 5))
        }
        return points
    }

    init() {

        const LINE_WIDTH = 10

        const points = this._genPoints()
        this.spline = new THREE.CatmullRomCurve3(points)

        const SUBD = NUM_CARLIGHTS * 2


        const leftgeom = new THREE.Geometry(),
            middlegeom = new THREE.Geometry(),
            rightgeom = new THREE.Geometry()

        for (var i = 0; i < points.length * SUBD; i++) {
            var index = i / (points.length * SUBD);
            var position = this.spline.getPoint(index);

            middlegeom.vertices[i] = new THREE.Vector3(position.x, position.y, position.z);

            leftgeom.vertices[i] = new THREE.Vector3(position.x - STREET_WIDTH * 0.5, position.y, position.z);
            rightgeom.vertices[i] = new THREE.Vector3(position.x + STREET_WIDTH * 0.5, position.y, position.z);
        }
        middlegeom.computeLineDistances()
        leftgeom.computeLineDistances()
        rightgeom.computeLineDistances()

        const middle = new THREE.Line(middlegeom, new THREE.LineDashedMaterial({
            color: 0xffffff,
            linewidth: LINE_WIDTH,
            dashSize: 0.5,
            gapSize: 0.5,
            fog: true
        }));

        this.add(middle)

        const left = new THREE.Line(leftgeom, new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: LINE_WIDTH,
            fog: true
        }));

        const right = new THREE.Line(rightgeom, new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: LINE_WIDTH,
            fog: true
        }));

        this.add(left)
        this.add(right)

        this.initCarLights()
    }

    _addCarLights(material) {

        const pairs = []
        for (let i = 0; i < NUM_CARLIGHTS; i++) {
            const pair = []


            const offset = randomInt(0, this.spline.getLength())

            for (let j = 1; j <= 2; j++) {

                let sprite = new THREE.Sprite(material)
                sprite.scale.set(1, 0.5, 1);
                sprite.rotation.x = random(0, Math.PI)

                //sprite.position.copy(pos)
                //sprite.position.x -= STREET_WIDTH/8 * j

                sprite.visible = this.conf.cars

                this.add(sprite)
                pair.push(sprite)
            }

            pair._offset = offset
            pair._speed = random(2, 3.5)
            pairs.push(pair)
        }
        return pairs
    }

    initCarLights() {

        const texture = this.loader.load('/dist/assets/Intro/cloud.png')

        let matFront = new THREE.SpriteMaterial({
                map: texture,
                color: 0xded95f,
                blending: THREE.AdditiveBlending,
                fog: true
            }),
            matBack = new THREE.SpriteMaterial({
                map: texture,
                color: 0xff0000,
                blending: THREE.AdditiveBlending,
                fog: true
            })

        this.backLights = this._addCarLights(matBack)
        this.frontLights = this._addCarLights(matFront)

        this.ready = true
    }



    updateCars(dt) {

        const SPEED = 0.4

        this.frontLights.forEach(pair => {
            const t = (pair._offset % this.spline.getLength()) / this.spline.getLength(),
                pos = this.spline.getPointAt(t)

            pair[0].position.set(pos.x + STREET_WIDTH / 8, pos.y, pos.z)
            pair[1].position.set(pos.x + STREET_WIDTH / 8 * 2, pos.y, pos.z)

            pair._offset -= pair._speed * dt
            if (pair._offset < 0) pair._offset = this.spline.getLength()
        })


        this.backLights.forEach(pair => {
            const t = (pair._offset % this.spline.getLength()) / this.spline.getLength(),
                pos = this.spline.getPointAt(t)

            pair[0].position.set(pos.x - STREET_WIDTH / 8, pos.y, pos.z)
            pair[1].position.set(pos.x - STREET_WIDTH / 8 * 2, pos.y, pos.z)

            pair._offset += pair._speed * dt
            if (pair._offset > this.spline.getLength()) pair._offset = 0
        })


    }

    _getPosOnSpline(time=0) {

        const t = ((this.tick + time) * this.conf.speed % this.spline.getLength()) / this.spline.getLength(),
            pos = this.spline.getPointAt(t)
        
        pos.y += this.conf.cameraHeight
        return pos
    }

    updateCamera(dt) {

        this.tick += dt
        const time = this.tick

        
        const position = this._getPosOnSpline()

        this.camera.position.copy(position)

        this.camera.lookAt(this._getPosOnSpline(0.01))
    }

    update(dt) {

        super.update(dt)

        if (!this.ready) return

        this.updateCamera(dt)
        this.updateCars(dt)
    }

}