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

import Map3DGeometry from './Map3DGeometry'

const Colors = require('nice-color-palettes');


const Geodata = require('./countries.json')

//http://makc.github.io/three.js/map2globe/


const MAX_VIS_HEIGHT = 10


export
default class Weapons extends AObject {
    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this.ready = false
        this.tick = 0
    }


    init() {

        //https://github.com/makc/makc.github.io/blob/master/three.js/map2globe/demo.html
        const radius = 0.98
        var light = new THREE.DirectionalLight(0xffffff);
        light.position.set(0, 0, 1);
        this.add(light); // materials are solid black without the light

        const globe = new THREE.Object3D();
        //globe.scale.set(250, 250, 250);
        this.add(globe)
        var geometry = new THREE.SphereGeometry(radius, 30, 15);
        const blue = new THREE.MeshLambertMaterial({
            color: 0x50aaff,
            shading: THREE.FlatShading
        });

        globe.add(new THREE.Mesh(geometry, blue));

        const color = Colors[randomInt(0, Colors.length - 1)]

        for (const name in Geodata) {
            const map3dgeometry = new Map3DGeometry(Geodata[name], 0);

            const material = new THREE.MeshLambertMaterial({
                color: color[randomInt(0, color.length - 1)],
                shading: THREE.FlatShading
            })

            const mesh = new THREE.Mesh(map3dgeometry, material)
            globe.add(mesh)


            Geodata[name].mesh = mesh
            Geodata[name].freq = randomInt(0, 2)


            Geodata[name].data = {
                sold: 0,
                bought: 0
            }
        }

        this.ready = true

        super.on('audio', v => {
            if (!v) {
                const _scale = 1
                for (const name in Geodata) {
                    tweenr.to(Geodata[name].mesh.scale, {
                        x: _scale,
                        y: _scale,
                        z: _scale,
                        duration: 1
                    })
                }
            }
        })
        super.on('color', _ => {
            const _randColor = Colors[randomInt(0, Colors.length - 1)]
            const _scale = 1
            for (const name in Geodata) {
                Geodata[name].mesh.material.color.set(_randColor[randomInt(0, _randColor.length - 1)])
            }
        })

        this._parseData()

        super.on('showBought', p => this.showBought())
        super.on('showSold', p => this.showSold())

        /*
            showDebt = function () {
        for (var name in data) {
            var scale = (1 + 7e-6 * ( data[name].data.gdp || 0 ) * ( data[name].data.debt || 0 ) / 100);
            TweenLite.to(data[name].mesh.scale, 0.5, { x : scale, y : scale, z : scale });
        }
    }*/
    }

    _parseData() {

        const DATA_SELLER_2015 = require('./test_data/sipri-arms-by-seller-2015.json')
        const DATA_BUYER_2015 = require('./test_data/sipri-arms-by-buyer-2015.json')


        DATA_SELLER_2015.forEach(d => {
            const seller = this._cleanName(d.seller)
            if (Geodata[seller]) {
                Geodata[seller].data.sold += 1
            }

            const buyer = this._cleanName(d.buyer)
            if (Geodata[buyer]) {
                Geodata[buyer].data.bought += 1
            }
        })

        console.log(Geodata['Austria'].data)

    }

    showSold() {

        let max = 0
        for (const name in Geodata) {
            if (Geodata[name].data.sold > max) {
                max = Geodata[name].data.sold
            }
        }
        console.log(max)

        for (const name in Geodata) {
            let _scale = Geodata[name].data.sold / max * MAX_VIS_HEIGHT
            //_scale = Math.min(_scale, 1)
            tweenr.to(Geodata[name].mesh.scale, {
                x: _scale,
                y: _scale,
                z: _scale,
                duration: 2
            })
        }
    }

    showBought() {
        let max = 0
        for (const name in Geodata) {
            if (Geodata[name].data.bought > max) {
                max = Geodata[name].data.bought
            }
        }
        for (const name in Geodata) {
            const _scale = Geodata[name].data.bought / max * MAX_VIS_HEIGHT
            tweenr.to(Geodata[name].mesh.scale, {
                x: _scale,
                y: _scale,
                z: _scale,
                duration: 2
            })
        }
    }

    _cleanName(name) {
        if (name.startsWith('Germany')) {
            return 'Germany'
        } else if (name.startsWith('Taiwan')) {
            return 'Taiwan'
        } else if (name.startsWith('UAE')) {
            return 'Saudi Arabia'
        } else {
            return name
        }
    }

    update(dt) {
        super.update(dt)
        if (!this.ready) return

        if (this.conf.audio) {
            const low = this.aaa.getLowFreq(),
                mid = this.aaa.getMidFreq(),
                high = this.aaa.getHighFreq()

            for (const name in Geodata) {
                let _scale = 1
                if (Geodata[name].freq === 0) {
                    _scale += low * 0.5
                } else if (Geodata[name].freq === 1) {
                    _scale += mid * 0.5
                } else if (Geodata[name].freq === 2) {
                    _scale += high * 0.5
                }
                Geodata[name].mesh.scale.set(_scale, _scale, _scale)
            }
        }
    }

    createRingGeomtry(radius) {

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

    _createRing(radius, scene) {

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
}