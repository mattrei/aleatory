const glslify = require('glslify')
const createComplex = require('../utils/createComplex')

const geoPieceRing = require('geo-piecering')
const geoArc = require('geo-arc')

const noise = new(require('noisejs').Noise)(Math.random())

const simplex = new(require('simplex-noise'))()
const smoothstep = require('smoothstep')

const random = require('random-float')
const randomInt = require('random-int')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

import AObject from '../AObject'

import Color from 'color'

const NUM_POINTS = 100,
    LENGTH = 60 * NUM_POINTS,
    WIDTH = 30

const MOUNTAIN_HEIGHT = 3,
    SNOW_HEIGHT = MOUNTAIN_HEIGHT - 1,
    WATER_HEIGHT = 0

export
default class Terrain extends AObject {

    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this.ORB_COLOR = new THREE.Color(0xff00ff)

        this.orb = null
        this.orbLight = null
        this.orbCamera = camera

        this.ready = false

    }



    _genPoints() {

        const _y = (z) => {
            return simplex.noise2D(z * 0.1, 0.1) * 1.5
        }

        const _x = (z) => {
            return simplex.noise2D(z * 0.1, 0.1) * 2
        }

        const points = []
            // TODO maybe generate points with distortition that gets high when reaching end
        for (let i = 0; i < NUM_POINTS + 1; i++) {
            points.push(new THREE.Vector2(_x(i), _y(i)))
        }
        return points
    }

    init() {

        const speed = this.conf.speed * 0.5

        const points = this._genPoints()
        this.spline = new THREE.CatmullRomCurve3(points)

        const geometry = new THREE.PlaneBufferGeometry(
            20, NUM_POINTS,
            WIDTH, LENGTH)
        geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2))

        const positions = geometry.attributes.position.array


        for (let i = 0; i < LENGTH + 1; i++) {
            const position = this.spline.getPoint(i / (LENGTH + 1))

            const heightFactor = MOUNTAIN_HEIGHT + (i / (LENGTH + 1) * MOUNTAIN_HEIGHT)


            for (let j = 0, j3 = 0; j < WIDTH + 1; j++, j3 += 3) {
                const _idx = (i * (WIDTH + 1) * 3) + j3

                positions[_idx + 0] += position.x
                positions[_idx + 1] += position.y


                const height = simplex.noise2D(i * 0.01, j * 0.1)
                let valleyFactor = Math.pow(Math.abs(j / (WIDTH + 1) - 0.5), 0.4)
                if (valleyFactor < 0.2) {
                    valleyFactor = 0
                }

                positions[_idx + 1] += height * heightFactor * valleyFactor
            }
        }


        const colors = new Float32Array(positions.length)
        geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3))


        for (let i = 0, i3 = 0; i < colors.length; i++, i3 += 3) {
            const color = positions[i3 + 1] > SNOW_HEIGHT ? new THREE.Color(0xffff00) :
                (positions[i3 + 1] < WATER_HEIGHT ? new THREE.Color(0x00f00f) : new THREE.Color(0xff000f))
            color.toArray(colors, i3)
        }

        geometry.computeVertexNormals()
        geometry.attributes.position.needsUpdate = true
        geometry.attributes.color.needsUpdate = true

        /*
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0xffebff),
            shading: THREE.FlatShading,
            side: THREE.DoubleSide,
            wireframe: true,
            vertexColors: THREE.VertexColors,
            transparent: true
        })
*/
        const material = new THREE.MeshNormalMaterial({
            wireframe: true
        })

        const plane = new THREE.Mesh(geometry, material)
        this.add(plane)
        this.plane = plane

    }

    initOrb() {


        const material = new THREE.SpriteMaterial({
            map: this.loader.load('/dist/assets/Intro/fireflie.png'),
            color: this.ORB_COLOR,
            fog: true,
            transparent: true
        })

        const sprite = new THREE.Sprite(material)
        this.add(sprite)
        this.orb = sprite
        sprite.position.set(0, 3, 0)

        const light = new THREE.PointLight(this.ORB_COLOR, 1, 100);
        light.position.copy(sprite.position)
        this.add(light)
        this.orbLight = light

        this.orbCamera.position.set(sprite.position.x,
            sprite.position.y,
            sprite.position.z + 10)
    }

    initLights() {

        const hlight = new THREE.HemisphereLight(
            new THREE.Color(0xffffff),
            new THREE.Color(0xffffff), 0.8)
        this.add(hlight)



        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.color.setHSL(0.1, 1, 0.95);
        dirLight.position.set(-1, 1.75, 1);
        dirLight.position.multiplyScalar(50);
        dirLight.castShadow = true;
        //this.group.add(dirLight)
    }


    updateOrb(delta) {

        const speed = this.conf.speed * delta * 7
        const pos = this.orb.position

        const z = pos.z - speed,
            x = 0, //this._xDistortion(z),
            y = this._yDistortion(z),
            v = new THREE.Vector3(x * 2, y * 2 + 2, z),
            vc = new THREE.Vector3(0, 3, z + this.CAMERA_ORB_DIST)

        pos.copy(v)
        this.orbCamera.position.copy(vc)
        this.orbCamera.lookAt(v)
    }

    updateTerrain(plane, time) {
        const speed = this.conf.speed * 0.6

        const height = this.MOUNTAIN_HEIGHT * this.conf.mountHeight,
            terrainHeight = this.conf.terrainHeight * this.TERRAIN_HEIGHT

        const positions = plane.geometry.attributes.position.array,
            colors = plane.geometry.attributes.color.array

        for (var i = 0, j = 0; i < positions.length; i++, j += 3) {
            const depthIdx = Math.floor(i / this.PLANE_WIDTH)
            positions[j + 1] += simplex.noise3D(i, plane.position.z - depthIdx, time) * 0.01
        }
        plane.geometry.attributes.position.needsUpdate = true
    }

    addRndMesh() {

        const radius = random(0, 2);
        const numPieces = Math.floor(random(5, 40));
        const pieceSize = random(0.25, 0.75);

        const types = [
            geoArc({
                y: 0,
                startRadian: random(-Math.PI, Math.PI),
                endRadian: random(-Math.PI, Math.PI),
                innerRadius: radius,
                outerRadius: radius + random(0.005, 0.15),
                numBands: 2,
                numSlices: 90,
            }),
            geoPieceRing({
                y: 0,
                height: random(0.01, 1.0),
                radius: random(0.1, 1.5),
                numPieces: numPieces,
                quadsPerPiece: 1,
                pieceSize: (Math.PI * 2) * 1 / numPieces * pieceSize
            })
        ]

        const geometry = createComplex(types[1])
        geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2))
        const material = new THREE.MeshBasicMaterial({
            opacity: 1,
            side: THREE.DoubleSide
        });

        let mesh = new THREE.Mesh(geometry, material)
        mesh.position.z = this._secondPlane().position.z
        mesh.active = true
        mesh.rotationFactor = random(-0.5, 0.5);
        this.add(mesh)
        this.meshes.push(mesh)
    }

    updateMeshes(dt) {
        this.meshes.forEach((m) => {

            if (m.active) {
                m.rotation.z += dt * m.rotationFactor
                m.position.z += dt * conf.speed * 10
                m.position.y = this._yDistortion(m.position.z)
                m.position.x = this._xDistortion(m.position.z)

                if (m.position.z > (this.orb.position.z + this.CAMERA_ORB_DIST)) {
                    m.active = false;
                    m.visible = false;
                }
            }
        })
    }
    _firstPlane() {
        return this.plane1.position.z > this.plane2.position.z ? this.plane1 : this.plane2
    }
    _secondPlane() {
        return this.plane1.position.z < this.plane2.position.z ? this.plane1 : this.plane2
    }

    update(dt) {

        super.update(dt)

        if (!this.ready) return

        if (this.orb) {
            this.updateOrb(dt)

            const firstPlane = this._firstPlane(),
                secondPlane = this._secondPlane()

            if (this.orb.position.z + this.CAMERA_ORB_DIST < firstPlane.position.z - this.PLANE_DEPTH * 0.5) {
                firstPlane.position.setZ(secondPlane.position.z - this.PLANE_DEPTH)

                this.initTerrain(firstPlane, time)
                this.initMountainTerrain(firstPlane, time)
            }

            if (Math.random() > 0.99) {
                this.addRndMesh()
            }

            this.updateMeshes(dt)
            //this.updateTerrain(firstPlane, time)
            //this.updateTerrain(secondPlane, time)
        }
    }

}