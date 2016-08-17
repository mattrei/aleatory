const glslify = require('glslify')

const random = require('random-float')
const randomInt = require('random-int')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

import AObject from '../AObject'

import Water from './utils/Water'

const MORPH_SPEED = 200
const Y_POS = 200
const SKYBOX = "sky" //"miramar"

const NUM_BOATS = 20

export
default class Mare extends AObject {
    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this.modelLoader = new THREE.JSONLoader()

        this.init()
    }

    addBoats() {

        for (let i = 0; i < NUM_BOATS; i++) {
            let v = new THREE.Vector3(
                MathF.random(-1000, 1000),
                0,
                i * 400)
            this.addBoat(v, {
                drown: MathF.rrandom(0, 3)
            })
        }
    }


    init(scene) {

        this._loadSkyBox()

        // Add light
        var directionalLight = new THREE.DirectionalLight(0xffff55, 1);
        directionalLight.position.set(-600, 300, 600);

        const waterNormals = this.loader.load('/dist/assets/Refugees/waternormals.jpg')
        waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

        // Create the water effect
        this.water = new THREE.Water(this.renderer, this.camera, scene, {
            textureWidth: 256,
            textureHeight: 256,
            waterNormals: waterNormals,
            alpha: 1.0,
            sunDirection: directionalLight.position.normalize(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            betaVersion: 0,
            side: THREE.DoubleSide
        });

        var aMeshMirror = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(20000, 20000, 10, 10),
            this.water.material
        );
        aMeshMirror.add(this.water);
        aMeshMirror.rotation.x = -Math.PI * 0.5;
        aMeshMirror.position.y = -1

        this.add(aMeshMirror)


        this.ready = true
    }



    _loadSkyBox() {

        const p = '/dist/assets/skybox/' + SKYBOX

        var materials = [

            new THREE.MeshBasicMaterial({
                map: this.loader.load(p + '_west.jpg')
            }), // right
            new THREE.MeshBasicMaterial({
                map: this.loader.load(p + '_east.jpg')
            }), // left
            new THREE.MeshBasicMaterial({
                map: this.loader.load(p + '_up.jpg')
            }), // top
            new THREE.MeshBasicMaterial({
                map: this.loader.load(p + '_down.jpg')
            }), // bottom
            new THREE.MeshBasicMaterial({
                map: this.loader.load(p + '_south.jpg')
            }), // back
            new THREE.MeshBasicMaterial({
                map: this.loader.load(p + '_north.jpg')
            }) // front

        ];

        const mesh = new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10000, 7, 7, 7),
            new THREE.MultiMaterial(materials));

        mesh.scale.x = -1
        this.add(mesh)

        this.addBoat(new THREE.Vector3(0, 0, 0), 1)
    }

    addBoat(position, drown) {

        this.modelLoader.load("/dist/assets/Refugees/models/OldBoat.js", geometry => {



            const material = new THREE.MeshLambertMaterial({
                map: this.loader.load('/dist/assets/Refugees/models/boattex.jpg'),
                normalMap: this.loader.load('/dist/assets/Refugees/models/boattexnm.jpg'),
            })

            const mesh = new THREE.Mesh(geometry, material)
            mesh.scale.set(0.1, 0.1, 0.1)

            mesh.position.copy(position)

            mesh.wave = {
                x: Math.random(),
                z: Math.random()
            }


            if (drown === 1) {
                mesh.rotation.z = Math.PI
            }

            if (drown === 2) {
                mesh.rotation.x = -Math.PI * random(0.3, 0.8)
            }

            this.add(mesh)
        })
    }

    update(dt) {

        super.update(dt)

        if (!this.ready) return

        this.water.material.uniforms.time.value += dt
        this.water.material.uniforms.distortionScale.value = 150
        this.water.material.uniforms.noiseScale.value = 2


        /*
        if (this.animation) {
            var time = Date.now();
            this.animation.update(time - prevTime)

            //console.log(time-prevTime + " " + this.clock.getDelta())

            this.ocean.deltaTime = time - prevTime //
            //this.ocean.render()
            //this.ocean.update()

            prevTime = time
        }
        */
        //this.ocean.deltaTime = dt
        this.water.render()

    }
}