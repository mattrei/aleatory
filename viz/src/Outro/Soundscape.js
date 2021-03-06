const simplex = new(require('simplex-noise'))()
const random = require('random-float')
const randomInt = require('random-int')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

import Color from 'color'

require('../utils/THREE.MeshLine')
const glslify = require('glslify')

require('three/examples/js/utils/GeometryUtils')

const smoothstep = require('smoothstep')



import AObject from '../AObject'


const SIZE = {
    WIDTH: 128,
    DEPTH: 128
}

//https://github.com/theGlenn/WebGLAudioAPIExperiement/blob/58a2a278db9860a9dc3863117960c6fffd0bcf13/src/js/webgl.js

export
default class Soundscape extends AObject {
    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this.GRID_SIZE = SIZE.WIDTH * SIZE.DEPTH

        this.LINES_HEIGHT = 10
        this.MAX_HEIGHT = 20

        this.seed = randomInt(0, 100)
    }

    init() {
        this.initPlane()
        this.initParticles()
        this.initLines()
    }


    initPlane() {

        this.geometry = new THREE.PlaneBufferGeometry(500, 500, SIZE.WIDTH - 1, SIZE.DEPTH - 1);
        // trick! make the underground visible and not the top
        this.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2))

        this.material = new THREE.MeshBasicMaterial({
            color: 0xf67944,
            shading: THREE.FlatShading,
            wireframe: false,
            wireframeLinewidth: 2,
            transparent: true
        });

        this.line = null

        this.mesh = new THREE.Mesh(this.geometry, this.material)


        const positions = this.geometry.attributes.position.array
            // save base position of plane
        const basePos = new Float32Array(positions.length);

        let data = this.generateHeight(SIZE.WIDTH, SIZE.DEPTH)
        for (var i = 0, j = 0; i < positions.length; i++, j += 3) {
            // only modifiy y of plane position
            positions[j + 1] = data[i] * this.MAX_HEIGHT;
            basePos[i] = positions[j + 1];
        }
        this.geometry.addAttribute('basePos', new THREE.BufferAttribute(basePos, 1));

        this.add(this.mesh)

    }
    generateHeight(width, height) {
        let size = width * height,
            data = new Float32Array(size)

        for (let i = 0; i < size; i++) {

            const x = i % width,
                y = Math.floor(i / width)
            data[i] = simplex.noise2D(this.seed + x * 0.02, y * 0.03)
        }
        return data
    }
    initLines() {

        this.linesInfo = []

        this.lineGeometry = new THREE.Geometry()
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 4,
            transparent: true,
            vertexColors: THREE.VertexColors // color per vertex pair
        })

        const positions = this.geometry.attributes.position.array

        for (let v = 0; v < positions.length; v++) {

            if (Math.random() > 0.995) {
                const vertex1 = new THREE.Vector3();
                vertex1.x = positions[v * 3 + 0];
                vertex1.y = positions[v * 3 + 1];
                vertex1.z = positions[v * 3 + 2];


                const vertex2 = vertex1.clone()
                vertex2.y += this.LINES_HEIGHT
                vertex2.baseY = positions[v * 3 + 1] + this.LINES_HEIGHT;

                this.lineGeometry.vertices.push(vertex1)
                this.lineGeometry.vertices.push(vertex2)

                const isBass = Math.random() > 0.5 ? true : false
                const color = isBass ? new THREE.Color(0x007500) : new THREE.Color(0xe6c700)

                this.linesInfo.push(isBass)

                this.lineGeometry.colors.push(color)
                this.lineGeometry.colors.push(color)
            }

        }

        this.lines = new THREE.LineSegments(this.lineGeometry, lineMaterial)

        this.add(this.lines)

    }
    initParticles() {

        this.loader.load('/dist/assets/Outro/particle.png', texture => {

            this.pointsMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    amplitude: {
                        value: 1.0
                    },
                    bcolor: {
                        value: new THREE.Color(0xffffff)
                    },
                    tcolor: {
                        value: new THREE.Color(0xff0000)
                    },
                    texture: {
                        value: texture
                    },
                    time: {
                        value: 0
                    }
                },
                vertexShader: planeVS,
                fragmentShader: planeFS,
                transparent: true,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                opacity: 0.7,
                // vertexColors: THREE.VertexColors,
            })

            const positions = this.geometry.attributes.position.array
            const colors = new Float32Array(positions.length * 3)
            const sizes = new Float32Array(positions.length)


            const color = new THREE.Color(0xffaa00) // red
            for (let v = 0; v < positions.length; v++) {

                colors[v * 3 + 0] = color.r
                colors[v * 3 + 1] = color.g
                colors[v * 3 + 2] = color.b

                if (positions[v] < 0) // does what?
                    color.setHSL(0.5 + 0.1 * (v / positions.length), 0.7, 0.5);
                else
                    color.setHSL(0.0 + 0.1 * (v / positions.length), 0.9, 0.5);

                sizes[v] = Math.floor(random(1, 5))
            }


            //  this.geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3))
            this.geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1))

            const points = new THREE.Points(this.geometry, this.pointsMaterial)
            this.add(points)

            this.ready = true
        })
    }

    update(dt) {

        const lowFreq = this.aaa.getLowFreq(),
            highFreq = this.aaa.getHighFreq()

        let positions = this.geometry.attributes.position.array
        let basePositions = this.geometry.attributes.basePos.array

        for (var i = 0, j = 0, l = positions.length; i < l; i++, j += 3) {
            const destVal = basePositions[i] + lowFreq * basePositions[i] * 0.5
            positions[j + 1] += (destVal - positions[j + 1])
        }


        this.pointsMaterial.uniforms.time.value += dt

        this.geometry.attributes.size.needsUpdate = true
        this.geometry.attributes.position.needsUpdate = true
        //this.geometry.attributes.color.needsUpdate = true


        let vertices = this.lineGeometry.vertices,
            colors = this.lineGeometry.colors

        for (let i = 0, j = 0; i < vertices.length; i += 2, j++) {

            const isBass = this.linesInfo[i]

            const freq = isBass ? lowFreq : highFreq

            const destVal = vertices[i + 1].baseY + (this.LINES_HEIGHT + freq * 20);
            vertices[i + 1].y += (destVal - vertices[i + 1].y)

            //colors[ i ] = colors[i]//this.linesColors[j] //colors[i]//new THREE.Color( Math.random(), Math.random(), Math.random() );

            const color = Color(colors[i].getStyle())
            color.whiten(freq)

            colors[i] = new THREE.Color(color.hexString()) //this.linesColors[j] //colors[i]//new THREE.Color( Math.random(), Math.random(), Math.random() );
            colors[i + 1] = colors[i]
        }

        this.lineGeometry.verticesNeedUpdate = true
        this.lineGeometry.colorsNeedUpdate = true
    }
}



const planeVS = glslify(`
  uniform float amplitude;

    attribute float size;
    attribute vec3 color;

    varying vec3 vColor;
    varying vec3 vPos;
    void main() {
        vColor = color;
        vPos = position.xyz;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                //gl_PointSize = size;
                gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );
                gl_Position = projectionMatrix * mvPosition;
            }

`, {
    inline: true
})


const planeFS = glslify(`
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)
#pragma glslify: hsl2rgb = require(glsl-hsl2rgb)

uniform vec3 bcolor;
uniform vec3 tcolor;
uniform sampler2D texture;
uniform float time;

varying vec3 vColor;
varying vec3 vPos;
            void main() {

              float factor  = abs(snoise3(vec3(vPos.x / 50.0, vPos.y / 50.0, time * 0.2))) * 2.0;

              float cFactor = abs(snoise2(vec2(vPos.x, time * 0.03))) * 360.;
              vec3 rgb = hsl2rgb(cFactor/360.0, 0.5, 0.5);

                vec3 color = mix(bcolor, rgb, factor);
                //gl_FragColor = vec4( bcolor * vColor, 1.0 );

                gl_FragColor = vec4( color, 1.0 );
                gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
            }

`, {
    inline: true
})