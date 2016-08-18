const random = require('random-float')
const randomInt = require('random-int')
const glslify = require('glslify')
const Color = require('color')

const simplex = new(require('simplex-noise'))
const smoothstep = require('smoothstep')

const createTextGeometry = require('three-bmfont-text')
const loadFont = require('load-bmfont')
const createSDF = require('three-bmfont-text/shaders/sdf')

//require('../utils/THREE.MeshLine')

const HALTESTELLEN = require('./test_data/WienerLinienHaltestellen.json'),
    HALTESTELLEN_KEYS = Object.keys(HALTESTELLEN),
    HALTESTELLEN_LENGTH = HALTESTELLEN_KEYS.length


import AObject from '../AObject'

const MAX = 100
const VISIBLE_HS = 5

const COLORS = {
    u1: Color("#D8232A"),
    u2: Color("#009949"),
    u3: Color("#F27830"),
    u4: Color("#945E98"),
    u6: Color("#774F38")
}

export
default class Tunnel extends AObject {

    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera


    }

    _getRandHaltestelle() {
        return HALTESTELLEN[HALTESTELLEN_KEYS[
            randomInt(0, HALTESTELLEN_LENGTH - 1)]]['NAME']
    }

    init(scene) {
        this.background()
        this.ribbons()
        this.names()
    }

    names() {

        const group = new THREE.Group()
        this.add(group)
        const meshes = []


        loadFont('/dist/fnt/Lato-Regular-64.fnt', (err, font) => {
            this.loader.load('/dist/fnt/lato.png', texture => {

                for (let i = 0; i < MAX; i++) {

                    const geometry = createTextGeometry({
                        //width: 300,
                        align: 'center',
                        font: font,
                        text: this._getRandHaltestelle()
                    })

                    const material = new THREE.RawShaderMaterial(createSDF({
                        map: texture,
                        side: THREE.DoubleSide,
                        transparent: true,
                        color: 'rgb(230, 230, 230)'
                    }))

                    const text = new THREE.Mesh(geometry, material)
                    text.position.x = -geometry.layout.width / 2
                    text.position.y = geometry.layout.height * 1.035

                    var mesh = new THREE.Object3D()
                    mesh.scale.multiplyScalar(-0.005)
                    mesh.add(text)

                    this.add(mesh)


                    mesh._velocity = random(0.8, 1.9)
                    mesh.position.set(random(-100, 100), random(-100, 100), -500)

                    mesh.visible = false
                    group.add(mesh)
                    meshes.push(mesh)

                }
            })
        })

        meshes.slice(0, 1).forEach(m => m.visible = true)

        let currentMesh = 1

        const [hh, wh] = [window.innerHeight / 4, window.innerWidth / 4]

        super.tick(dt => {

            meshes.forEach((m, i) => {
                if (m.visible) {

                    m.scale.x = m.scale.y = smoothstep(0, 1, 1 - m.position.z / -500)
                    m.position.z += dt + m._velocity

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

        const group = new THREE.Group()
        this.add(group)

        const ribbons = []

        //https://color.adobe.com/Wiener-Linien-color-theme-7623513/edit/?copy=true&base=2&rule=Custom&selected=4&name=Copy%20of%20Wiener%20Linien&mode=rgb&rgbvalues=0.847059,0.137255,0.164706,0.509804,0.721569,0.839216,0.580392,0.368627,0.596078,0,0.6,0.286275,0.94902,0.470588,0.188235&swatchOrder=0,1,2,3,4
        ribbons.push(new Ribbon(COLORS.u1))
        ribbons.push(new Ribbon(COLORS.u2))
        ribbons.push(new Ribbon(COLORS.u3))
        ribbons.push(new Ribbon(COLORS.u4))
        ribbons.push(new Ribbon(COLORS.u6))

        ribbons.forEach(r => {
            group.add(r)
        })


        super.tick(dt => {
            ribbons.forEach(r => {
                r.update(dt)
            })
        })
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
                    value: new THREE.Color(top)
                },
                middleColor: {
                    value: new THREE.Color(middle)
                },
                bottomColor: {
                    value: new THREE.Color(bottom)
                },
                endTopColor: {
                    value: new THREE.Color(top)
                },
                endMiddleColor: {
                    value: new THREE.Color(middle)
                },
                endBottomColor: {
                    value: new THREE.Color(bottom)
                },
                lightMixColor: {
                    value: new THREE.Color(lightMix)
                },
                mixFactor: {
                    value: 0
                },
                offset: {
                    value: 0
                },
                exponent: {
                    value: 0.8
                }
            },

        });

        const sky = new THREE.Mesh(skyGeo, skyMat);
        this.add(sky);
    }
}

const RIBBON_SPEED = 1

class Ribbon extends THREE.Object3D {
    constructor(color) {
        super()

        this.LINE_LENGTH = 50

        this.time = 1

        this.smoothX = 0
        this.smoothY = 0
        this.smoothZ = 0

        this.rotateCoef = randomInt(0, 1) == 0 ? -1 : 1
        this.seed = randomInt(1, 100)
    }

    init() {

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
            color: new THREE.Color(color.hexString()),
            lineWidth: 10,
            transparent: true
        })
        this.materialClone = new THREE.MeshLineMaterial({
            useMap: false,
            color: new THREE.Color(color.lighten(0.4).hexString()),
            lineWidth: 6,
            opacity: 0.8,
            transparent: true
        })

        this.mesh = new THREE.Mesh(this.line.geometry, this.material);
        this.meshClone = new THREE.Mesh(this.lineClone.geometry, this.materialClone);


        this.add(this.mesh)
        this.add(this.meshClone)

    }

    update(dt) {

        const speed = RIBBON_SPEED + 0.8
        const rotateSpeed = 1.1 * this.rotateCoef
        const smoothCoef = 0.05


        this.time += dt

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
        const nx = simplex.noise2D(this.seed, this.time * 0.1),
            ny = simplex.noise2D(this.seed + 10, this.time * 0.1),
            nz = simplex.noise2D(this.seed + 100, this.time * 0.1)

        const globalX = nx * window.innerWidth * 0.25,
            globalY = ny * window.innerHeight * 0.25,
            globalZ = Math.abs(nz) * this.LINE_LENGTH


        this.smoothX += (globalX - this.smoothX) * smoothCoef;
        this.smoothY += (globalY - this.smoothY) * smoothCoef;
        this.smoothZ += (globalZ - this.smoothZ) * smoothCoef;

        this.geometry[this.geometry.length - 3] = this.smoothX
        this.geometry[this.geometry.length - 2] = this.smoothY
        this.geometry[this.geometry.length - 1] = this.smoothZ

        this.geometryClone[this.geometryClone.length - 3] = this.smoothX + Math.sin(this.time * rotateSpeed * 3) * 10;
        this.geometryClone[this.geometryClone.length - 2] = this.smoothY + Math.cos(this.time * rotateSpeed * 3) * 10;
        this.geometryClone[this.geometryClone.length - 1] = this.smoothZ + Math.sin(this.time * rotateSpeed * 3) * 10;


        this.line.setGeometry(this.geometry, (p) => {
            return Math.sin(p * Math.PI);
        });

        this.lineClone.setGeometry(this.geometryClone, (p) => {
            return Math.sin(p * Math.PI);
        });


    }
}