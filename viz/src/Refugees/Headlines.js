//https://github.com/fluuuid/labs/tree/master/box-physics

const CANNON = require('cannon')

const random = require('random-float')
const randomInt = require('random-int')
const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const createTextGeometry = require('three-bmfont-text')
const loadFont = require('load-bmfont')
const createSDF = require('three-bmfont-text/shaders/sdf')


import AObject from '../AObject'


const FONT_NAME = 'optimer'
const RADIUS = 1
const DURATION = 2

export
default class Headlines extends AObject {
    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this.fontLoader = new THREE.FontLoader();

        this.currIdx = 0
        this.curr = "hello world"

        this.meshes = []
        this.descriptions = []


    }

    _textMeshes(text) {

        const material = new THREE.MeshNormalMaterial();

        /*
        material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            specular: 0xffffff,
            metal: true
        })
*/

        let pos = 0

        const meshes = []


        for (let i = 0; i < text.length; i++) {
            const c = text[i]

            const geometry = new THREE.TextGeometry(c, {
                font: this.fontMesh,
                size: 1
            });
            geometry.computeBoundingBox();
            let w = geometry.boundingBox.max.x - geometry.boundingBox.min.x;

            const mesh = new THREE.Mesh(geometry, material)

            const relPos = new THREE.Vector3(pos, -0.2, 1)

            mesh.relPosition = relPos

            mesh.position.x = THREE.Math.randFloatSpread(RADIUS)
            mesh.position.y = THREE.Math.randFloatSpread(RADIUS)
            mesh.position.z = THREE.Math.randFloatSpread(RADIUS)

            mesh.rotation.x = random(0, Math.PI * 2)
            mesh.rotation.y = random(0, Math.PI * 2)
            mesh.rotation.z = random(0, Math.PI * 2)

            mesh.scale.set(0.1, 0.1, 0.0005)


            const bbox = new THREE.Box3().setFromObject(mesh)

            const body = new CANNON.Body({
                mass: randomInt(1, 4), // kg
                position: new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z),
                //shape: new CANNON.Box(new CANNON.Vec3(bbox.max.x, bbox.max.y, bbox.max.z))
                shape: new CANNON.Box(new CANNON.Vec3(0.1, 0.1, 0.1))
            });
            //this.world.addBody(body)

            mesh.body = body

            if (c === ' ') {
                w = 0.1
            }
            pos += w
            meshes.push(mesh)
        }

        return meshes
    }

    _staticText(text) {

        const geometry = createTextGeometry({
            //width: 300,
            align: 'center',
            font: this.font,
            text: "Hi all"
        })


        const material = new THREE.RawShaderMaterial(createSDF({
            map: this.fontTexture,
            side: THREE.DoubleSide,
            transparent: true,
            color: 'rgb(230, 230, 230)'
        }))

        var layout = geometry.layout
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.x = -layout.width / 2
        mesh.position.y = layout.height * 1.035

        var textAnchor = new THREE.Object3D()
        textAnchor.scale.multiplyScalar(-0.004)
        textAnchor.visible = false
        textAnchor.add(mesh)

        textAnchor.mesh = mesh

        return textAnchor
    }

    load(data) {

        data.forEach(headline => {

            //const text = headline.date + ' ' + headline.title + ' ' + headline.source
            const text = headline.title

            const textMeshes = this._textMeshes(text)
            this.meshes.push(textMeshes)

            const description = this._staticText(headline.descr)
            this.descriptions.push(description)
        })


        this.meshes.forEach(ms => {

            const group = new THREE.Group()
            this.add(group)
            ms.forEach(m => {
                group.add(m)
            })
        })

        this.ready = true
    }

    doShuffle() {
        const DURATION = 2
        const SPREAD = 400

        let randPos = () => {
                return new THREE.Vector3(
                    THREE.Math.randFloatSpread(SPREAD),
                    THREE.Math.randFloatSpread(SPREAD),
                    THREE.Math.randFloatSpread(SPREAD))
            },
            randRot = () => {
                return new THREE.Vector3(
                    THREE.Math.randFloatSpread(Math.PI * 2),
                    THREE.Math.randFloatSpread(Math.PI * 2),
                    THREE.Math.randFloatSpread(Math.PI * 2))
            }


        meshes.forEach(textMeshes => {
            textMeshes.forEach(m => {

                let p = randPos()
                let r = randRot()
                m.isShuffled = true

                tweenr.to(m.position, {
                    x: p.x,
                    y: p.y,
                    z: p.z,
                    duration: random(DURATION, DURATION * 2),
                    ease: sineInOut
                }).on('complete', () => m.isShuffled = false)

                tweenr.to(m.rotation, {
                    x: r.x,
                    y: r.y,
                    z: r.z,
                    duration: random(DURATION, DURATION * 2),
                    ease: sineInOut
                })

            })

        })
    }


    doNext() {

        const DUR = 1
        this.currIdx++

        const descr = this.descriptions[this.currIdx % this.descriptions.length]
        descr.visible = true
        descr.position.set(0, -0.5, 1)
        descr.mesh.material.opacity = 0

        tweenr.to(descr.mesh.material, {
            opacity: 1,
            duration: 1
        })

        const textMeshes = this.meshes[this.currIdx % this.meshes.length]
        textMeshes.forEach(m => {

            tweenr.to(m.position, {
                x: m.relPosition.x,
                y: m.relPosition.y,
                z: m.relPosition.z,
                duration: random(DUR, DUR * 2)
            })

            tweenr.to(m.rotation, {
                x: 0,
                y: 0,
                z: 0,
                duration: random(DUR, DUR * 2)
            })
        })
    }
    doReset() {

        const DUR = 1

        const descr = this.descriptions[this.currIdx % this.descriptions.length]

        tweenr.to(descr.mesh.material, {
            opacity: 0,
            duration: random(DUR * 2, DUR * 4)
        })
            .on('complete', () => descr.visible = false)

        const textMeshes = this.meshes[this.currIdx % this.meshes.length]
        textMeshes.forEach(m => {

            tweenr.to(m.position, {
                x: THREE.Math.randFloatSpread(RADIUS),
                y: THREE.Math.randFloatSpread(RADIUS),
                z: THREE.Math.randFloatSpread(RADIUS),
                duration: random(DUR, DUR * 2)
            })
                .on('complete', () => m.isShown = false)

            tweenr.to(m.rotation, {
                x: random(0, Math.PI * 2),
                y: random(0, Math.PI * 2),
                z: random(0, Math.PI * 2),
                duration: random(DUR, DUR * 2)
            })
        })
    }

    _loadFonts() {

        loadFont('/dist/fnt/Lato-Regular-64.fnt', (err, font) => {
            this.font = font
            this.fontTexture = this.loader.load('/dist/fnt/lato.png')

            this.fontLoader.load('dist/fonts/' + FONT_NAME + '_regular.typeface.json', resp => {
                this.fontMesh = resp


                if (this.conf.data) this.load(this.conf.data)
                super.on('data', data => {
                    this.load(data)
                })
            })


        })


    }

    init() {

        this.world = new CANNON.World()
        this.world.gravity.set(0, 0, -0.1)

        this._loadFonts()

        super.on('doNext', _ => this.doNext())
        super.on('doReset', _ => this.doReset())
        super.on('doShuffle', _ => this.doShuffle())
    }

    update(dt) {
        super.update(dt)

        if (!this.ready) return


        //this.updatePhysics()
        this.world.step(dt)
    }

    updatePhysics(force = -0.0025) {


        this.meshes.forEach(ms => {
            ms.forEach(mesh => {


                const body = mesh.body
                mesh.position.copy(body.position)
                mesh.quaternion.copy(body.quaternion)

/*
                const newPosAttraction = new THREE.Vector3();
                newPosAttraction.copy(mesh.position)


                if (Math.abs(body.linearVelocity.x) < 20 ||
                    Math.abs(body.linearVelocity.y) < 20 ||
                    Math.abs(body.linearVelocity.z) < 20) {
                    newPosAttraction.copy(mesh.position).multiplyScalar(force * Math.random());
                } else {
                    newPosAttraction.copy(mesh.position).multiplyScalar(0);
                }
                */

                const worldPoint = new CANNON.Vec3(0,0,0)

                body.applyForce(force, worldPoint)
            })
        })

    }

}