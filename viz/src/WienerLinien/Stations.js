const MAX = 100
const VISIBLE_HS = 5

const random = require('random-float')
const randomInt = require('random-int')
const glslify = require('glslify')
const Color = require('color')

const simplex = new(require('simplex-noise'))
const smoothstep = require('smoothstep')

require('../utils/THREE.MeshLine')

const HALTESTELLEN = require('./test_data/WienerLinienHaltestellen.json'),
    HALTESTELLEN_KEYS = Object.keys(HALTESTELLEN),
    HALTESTELLEN_LENGTH = HALTESTELLEN_KEYS.length

const VIS = 'stations'
const conf = {
    on: true,
    ribbonSpeed: 0.5
}

import AObject from '../AObject'



export
default class Tunnel extends AObject {

    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        background()
        ribbons()
        names()

    }


    names() {

        const meshes = []

        for (let i = 0; i < MAX; i++) {
            let shapes = THREE.FontUtils.generateShapes(_randHaltestelle(), {
                font: "oswald",
                weight: "normal",
                size: 25
            });
            let geom = new THREE.ShapeGeometry(shapes);
            let mat = new THREE.MeshNormalMaterial();
            let mesh = new THREE.Mesh(geom, mat);
            geom.center()

            mesh._velocity = random(0.8, 1.9)
            mesh.position.set(random(-100, 100), random(-100, 100), -500)

            mesh.visible = false
            group.add(mesh)
            meshes.push(mesh)
        }

        meshes.slice(0, 1).forEach(m => m.visible = true)

        let currentMesh = 1

        const [hh, wh] = [window.innerHeight / 4, window.innerWidth / 4]

        scene.getEvents().on('tick', t => {

            meshes.forEach((m, i) => {
                if (m.visible) {

                    m.scale.x = m.scale.y = smoothstep(0, 1, 1 - m.position.z / -500)
                    m.position.z += t.delta + m._velocity

                    if (m.position.z > 0) {
                        m.visible = false

                        let nm = meshes[currentMesh++ % meshes.length]
                        nm._velocity = random(0.7, 1.9)
                        nm.position.set(random(-wh, wh), random(-hh, hh), -500)
                        nm.scale.x = nm.scale.y = 0.1
                        nm.visible = true
                    }
                }
            })
        })


    }


    ribbons() {

        const ribbons = []

        //https://color.adobe.com/Wiener-Linien-color-theme-7623513/edit/?copy=true&base=2&rule=Custom&selected=4&name=Copy%20of%20Wiener%20Linien&mode=rgb&rgbvalues=0.847059,0.137255,0.164706,0.509804,0.721569,0.839216,0.580392,0.368627,0.596078,0,0.6,0.286275,0.94902,0.470588,0.188235&swatchOrder=0,1,2,3,4
        ribbons.push(new Ribbon({
            color: Color("#D8232A"),
            group: group
        }))
        ribbons.push(new Ribbon({
            color: Color("#009949"),
            group: group
        }))
        ribbons.push(new Ribbon({
            color: Color("#F27830"),
            group: group
        }))
        ribbons.push(new Ribbon({
            color: Color("#945E98"),
            group: group
        }))
        ribbons.push(new Ribbon({
            color: Color("#774F38"),
            group: group
        }))

        scene.getEvents().on('tick', t => {


            ribbons.forEach(r => {
                r.update(t.time)
            })
        })
    }

    spirals() {

        const VIS = 'spirals'
        const conf = {
            on: false
        }

        const group = new THREE.Group()
        this.scene.add(group)
        group.visible = conf.on

        let geo = new Float32Array(100 * 3);

        var sz = 2,
            cxy = 100,
            cz = cxy * sz;
        var hxy = Math.PI / cxy,
            hz = Math.PI / cz;
        var r = 130;


        for (var i = 0; i < geo.length; i += 3) {
            //geo[ j ] = geo[ j + 1 ] = geo[ j + 2 ] = Math.random() * 100;

            var lxy = i * hxy;
            var lz = i * hz;
            var rxy = r * 2 / Math.cosh(lz);
            var x = rxy * Math.cos(lxy);
            var y = rxy * Math.sin(lxy);
            var z = -r * 5 * Math.tanh(lz);
            //geo[i] =

            geo[i] = x
            geo[i + 1] = y
            geo[i + 2] = z
        }

        const _create = (i, color) => {

            var line = new THREE.MeshLine()
            line.setGeometry(geo);

            let material = new THREE.MeshLineMaterial({
                color: new THREE.Color(color),
                lineWidth: 4,
                transparent: true
            });

            var mesh = new THREE.Mesh(line.geometry, material); // this syntax could definitely be improved!
            mesh.origGeo = geo
            mesh.geo = new Float32Array(geo)
            mesh.line = line

            mesh.position.z = i * 80

            return mesh
        }

        const meshes = []

        meshes.push(_create(0, 'red'))
        meshes.push(_create(1, 'purple'))
        meshes.push(_create(2, 'orange'))
        meshes.push(_create(3, 'green'))
        meshes.push(_create(4, 'brown'))

        meshes.forEach(m => group.add(m))

        this.events.on('tick', t => {

            const low = scene.getFreq(40, 100)
            const high = scene.getFreq(4400, 4500)
            meshes.forEach((m, idx) => {
                m.rotation.z -= 0.05

                for (let i = 0; i < m.geo.length; i += 3) {
                    //geo[ i ] += Math.sin((avg + i) * 0.02) * 1
                    //geo[i] =  geo[i] * simplex.noise2D(geo[i], Math.sin(t.t)) * (20 * avg)
                    //geo[i] += Math.sin(t.t + idx + i * 0.5) * (avg * 20)
                    m.geo[i] = m.origGeo[i] + Math.sin(t.time + idx + i * 0.5) * (low * 20) * (high * 10)
                }

                m.line.setGeometry(m.geo)

            })
        })

        this.events.on(VIS + '::visOn', _ => {
            group.visible = true
            /*
        meshes.forEach(m => {

          m.material.opacity = 0
          tweenr.to(m.material, {opacity: 1, duration: 2})
        })
        */
        })
        this.events.on(VIS + '::visOff', _ => group.visible = false)


        scene.addVis(VIS, conf)
    }



    background() {

        const top = 0xB4F3FD,
            middle = 0xFBFEA4,
            bottom = 0x5492DB,
            lightMix = 0xe7b300


        let skyGeo = new THREE.SphereGeometry(750, 32, 15);
        let skyMat = new THREE.ShaderMaterial({
            vertexShader: glslify('./Sky.vert'),
            fragmentShader: glslify('./Sky.frag'),
            side: THREE.BackSide,
            uniforms: {
                topColor: {
                    type: "c",
                    value: new THREE.Color(top)
                },
                middleColor: {
                    type: "c",
                    value: new THREE.Color(middle)
                },
                bottomColor: {
                    type: "c",
                    value: new THREE.Color(bottom)
                },

                endTopColor: {
                    type: "c",
                    value: new THREE.Color(top)
                },
                endMiddleColor: {
                    type: "c",
                    value: new THREE.Color(middle)
                },
                endBottomColor: {
                    type: "c",
                    value: new THREE.Color(bottom)
                },

                lightMixColor: {
                    type: "c",
                    value: new THREE.Color(lightMix)
                },

                mixFactor: {
                    type: "f",
                    value: 0
                },
                offset: {
                    type: "f",
                    value: 0
                },
                exponent: {
                    type: "f",
                    value: 0.8
                }
            },

        });

        const sky = new THREE.Mesh(skyGeo, skyMat);
        group.add(sky);
    }

    update(dt) {

    }
}


function _randHaltestelle() {
    return HALTESTELLEN[HALTESTELLEN_KEYS[
        randomInt(0, HALTESTELLEN_LENGTH - 1)]]['NAME']
}


class Ribbon {
    constructor(props) {

        this.LINE_LENGTH = 50

        this.smoothX = 0
        this.smoothY = 0
        this.smoothZ = 0

        this.rotateCoef = randomInt(0, 1) == 0 ? -1 : 1
        this.seed = randomInt(1, 100)

        this.geometry = new Float32Array(this.LINE_LENGTH * 3)
        this.geometryClone = new Float32Array(this.LINE_LENGTH * 3)

        for (var j = 0; j < this.geometry.length; j += 3) {
            this.geometry[j] = this.geometry[j + 1] = this.geometry[j + 2] = j;
            this.geometryClone[j] = this.geometryClone[j + 1] = this.geometryClone[j + 2] = 0;
        }

        // line
        this.line = new THREE.MeshLine();
        this.line.setGeometry(this.geometry);

        this.lineClone = new THREE.MeshLine();
        this.lineClone.setGeometry(this.geometryClone);


        this.material = new THREE.MeshLineMaterial({
            useMap: false,
            opacity: 1,
            color: new THREE.Color(props.color.hexString()),
            lineWidth: 10,
            transparent: true
        })
        this.materialClone = new THREE.MeshLineMaterial({
            useMap: false,
            color: new THREE.Color(props.color.lighten(0.4).hexString()),
            lineWidth: 6,
            opacity: 0.8,
            transparent: true
        })

        this.mesh = new THREE.Mesh(this.line.geometry, this.material);
        this.meshClone = new THREE.Mesh(this.lineClone.geometry, this.materialClone);


        props.group.add(this.mesh)
        props.group.add(this.meshClone)
    }

    update(time) {

        const speed = conf.ribbonSpeed + 0.8
        const rotateSpeed = 1.1 * this.rotateCoef
        const smoothCoef = 0.05


        //const low = scene.getFreq(40, 100)
        //const high = scene.getFreq(4400, 4500)

        for (var j = 0; j < this.geometry.length; j += 3) {
            this.geometry[j] = this.geometry[j + 3] * speed //* Math.sin(t.time + j * );
            this.geometry[j + 1] = this.geometry[j + 4] * speed //* Math.sin(t.time + j);
            this.geometry[j + 2] = this.geometry[j + 5] * speed //* Math.sin(t.time + j);

            this.geometryClone[j] = this.geometryClone[j + 3] * speed;
            this.geometryClone[j + 1] = this.geometryClone[j + 4] * speed;
            this.geometryClone[j + 2] = this.geometryClone[j + 5] * speed;
        }


        this.seed += 0.001
        const nx = simplex.noise2D(this.seed, time * 0.1),
            ny = simplex.noise2D(this.seed + 10, time * 0.1),
            nz = simplex.noise2D(this.seed + 100, time * 0.1)

        const globalX = nx * window.innerWidth * 0.25,
            globalY = ny * window.innerHeight * 0.25,
            globalZ = Math.abs(nz) * this.LINE_LENGTH


        this.smoothX += (globalX - this.smoothX) * smoothCoef;
        this.smoothY += (globalY - this.smoothY) * smoothCoef;
        this.smoothZ += (globalZ - this.smoothZ) * smoothCoef;

        this.geometry[this.geometry.length - 3] = this.smoothX
        this.geometry[this.geometry.length - 2] = this.smoothY
        this.geometry[this.geometry.length - 1] = this.smoothZ

        this.geometryClone[this.geometryClone.length - 3] = this.smoothX + Math.sin(time * rotateSpeed * 3) * 10;
        this.geometryClone[this.geometryClone.length - 2] = this.smoothY + Math.cos(time * rotateSpeed * 3) * 10;
        this.geometryClone[this.geometryClone.length - 1] = this.smoothZ + Math.sin(time * rotateSpeed * 3) * 10;


        this.line.setGeometry(this.geometry, (p) => {
            return Math.sin(p * Math.PI);
        });

        this.lineClone.setGeometry(this.geometryClone, (p) => {
            return Math.sin(p * Math.PI);
        });


    }
}