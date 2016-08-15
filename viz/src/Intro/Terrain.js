const glslify = require('glslify')
const createComplex = require('../utils/createComplex')

const geoPieceRing = require('geo-piecering')
const geoArc = require('geo-arc')

const simplex = new(require('simplex-noise'))()
const smoothstep = require('smoothstep')
const clamp = require('clamp')

const random = require('random-float')
const randomInt = require('random-int')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

import shaderParse from '../utils/shader-parse'

import AObject from '../AObject'

import Color from 'color'
const Colors = require('nice-color-palettes')

const NUM_POINTS = 100,
    LENGTH = 10 * NUM_POINTS,
    WIDTH = 30,
    WIDTH_POINTS = 30

const ORB_HEIGHT = 2

const MOUNTAIN_HEIGHT = 6,
    SNOW_HEIGHT = MOUNTAIN_HEIGHT - 2,
    WATER_HEIGHT = 2

export
default class Terrain extends AObject {

    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this.tick = 0

        this.meshes = []
    }



    _genPoints() {

        const _y = (z) => {
            return simplex.noise2D(z * 0.1, 0.1) * 3
        }

        const _x = (z) => {
            return simplex.noise2D(z * 0.06, 0.2) * 5
        }

        const points = []
            // TODO maybe generate points with distortition that gets high when reaching end
        for (let i = 0; i < NUM_POINTS + 1; i++) {
            points.push(new THREE.Vector3(_x(i), _y(i), i))
            //points.push(new THREE.Vector3(random(-2, 2), random(0, 2), i))
        }
        return points
    }

    init() {

        //this.initLights()

        const speed = this.conf.speed * 0.5

        const points = this._genPoints()
        this.spline = new THREE.CatmullRomCurve3(points)

        const geometry = new THREE.PlaneBufferGeometry(
            WIDTH, NUM_POINTS,
            WIDTH_POINTS, LENGTH)
        geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2))

        const positions = geometry.attributes.position.array


        for (let i = 0; i < LENGTH + 1; i++) {
            const position = this.spline.getPoint(i / (LENGTH + 1))

            const heightFactor = MOUNTAIN_HEIGHT + (i / (LENGTH + 1) * MOUNTAIN_HEIGHT)


            for (let j = 0, j3 = 0; j < WIDTH_POINTS + 1; j++, j3 += 3) {
                const _idx = (i * (WIDTH_POINTS + 1) * 3) + j3

                positions[_idx + 0] += position.x
                positions[_idx + 1] += position.y
                positions[_idx + 2] = position.z


                const height = Math.abs(simplex.noise2D(i * 0.007, j * 0.08))
                let valleyFactor = Math.pow(Math.abs(j / (WIDTH_POINTS + 1) - 0.5), 0.7)
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



        const defines = {}
        const baseShader = THREE.ShaderLib.phong;
        const baseUniforms = THREE.UniformsUtils.clone(baseShader.uniforms)

        const myUniforms = {}

        const uniforms = THREE.UniformsUtils.merge([
            baseUniforms,
            myUniforms
        ])

        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0xffebff),
            shading: THREE.FlatShading,
            side: THREE.DoubleSide,
            wireframe: false,
            fog: true,
            vertexColors: THREE.VertexColors,
            transparent: true
        })


        /*
        const material = new THREE.ShaderMaterial({
            fragmentShader: shaderParse( FS ),
            vertexShader: shaderParse( VS ),
            defines: defines,
            uniforms: uniforms,
            transparent: true
        })
        material.needsUpdate = true
        */

        const material2 = new THREE.MeshNormalMaterial({
            wireframe: true
        })

        const plane = new THREE.Mesh(geometry, material)
        this.add(plane)
        this.plane = plane

        super.on('speed', v => {
            console.log(v)
            console.log(this.conf.speed)
            tweenr.to(this.conf, {
                speed: v,
                duration: 2
            })
        })

        this.initOrb()
    }

    initOrb() {

        const orb = new THREE.Object3D()
        this.add(orb)

        this.orb = orb

        const material = new THREE.SpriteMaterial({
            map: this.loader.load('/dist/assets/Intro/fireflie.png'),
            color: this.ORB_COLOR,
            fog: true,
            transparent: true
        })

        const sprite = new THREE.Sprite(material)
        orb.add(sprite)

        const light = new THREE.PointLight(this.ORB_COLOR, 1, 100);
        orb.add(light)
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

    addRndMesh() {

        const radius = random(0.1, 1.5)
        const numPieces = Math.floor(random(8, 40))
        const pieceSize = random(0.25, 0.75)

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
                radius: radius,
                numPieces: numPieces,
                quadsPerPiece: 1,
                pieceSize: (Math.PI * 2) * 1 / numPieces * pieceSize
            })
        ]

        const geometry = createComplex(types[randomInt(0,1)])
        geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2))
        
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0xffffff),
            opacity: 1,
            fog: true,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material)
        mesh.scale.set(0.5, 0.5, 0.5)
        mesh.time = random(1, 5)
        mesh.active = true
        mesh.rotationFactor = randomInt(-50, 50)
        this.add(mesh)
        this.meshes.push(mesh)


        const time = this.tick
        const pos = this._getPosOnSpline(mesh.time)

        pos.y += ORB_HEIGHT
        mesh.position.copy(pos)
    }

    updateMeshes(dt) {

        const time = this.tick

        this.meshes.forEach((m) => {

            if (m.active) {

                m.rotation.z += 5//dt * m.rotationFactor
                m.lookAt(this.camera.position)

                if (m.position.z < this.camera.position.z) {
                    m.active = false
                    m.visible = false
                    super.remove(m)
                }
            }
        })
    }

    _getPosOnSpline(time) {

        const t = ((this.tick + time) * this.conf.speed * 5 % this.spline.getLength()) / this.spline.getLength()
        return this.spline.getPointAt(t)
    }

    updateCamera(dt) {

        const time = this.tick

        const pos = this._getPosOnSpline(0),
            posOrb = this._getPosOnSpline(0.5)

        pos.y += ORB_HEIGHT
        posOrb.y += ORB_HEIGHT

        this.camera.position.copy(pos)
        this.camera.lookAt(posOrb)

        this.orb.position.copy(posOrb)
    }

    update(dt) {

        super.update(dt)

        this.tick += dt

        this.updateCamera(dt)
        this.updateMeshes(dt)
        // TODO add when beat
        if (Math.random() > 0.97) {
            this.addRndMesh()
        }
    }

}

const VS = glslify(`
//#pragma glslify: cnoise2 = require(glsl-noise/classic/2d);
// #pragma glslify: snoise2 = require(glsl-noise/simplex/2d);
// #pragma glslify: pnoise2 = require(glsl-noise/periodic/2d);

//uniform float u_time;
//uniform float u_speed;
//uniform float u_amp;

varying vec3 vViewPosition;


#ifndef FLAT_SHADED

    varying vec3 vNormal;

#endif

#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

    #include <uv_vertex>
    #include <uv2_vertex>
    #include <color_vertex>

    #include <beginnormal_vertex>
    #include <morphnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <defaultnormal_vertex>

    #include <begin_vertex>
    #include <displacementmap_vertex>
    #include <morphtarget_vertex>
    #include <skinning_vertex>
    #include <project_vertex>
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>

    #include <worldpos_vertex>
    #include <envmap_vertex>
    #include <shadowmap_vertex>

    vNormal = normal;

  //float displacement = u_amp * cnoise2( vec2( position * 0.05 ) + u_time * u_speed );
  //vec3 newPosition = position + normal * displacement;

  //mvPosition = modelViewMatrix * vec4( position, 1.0 );
  //vViewPosition = - mvPosition.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
`, {
    inline: true
})

const FS = glslify(`
#define PHONG

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

#include <common>
#include <packing>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

    #include <clipping_planes_fragment>

    vec4 diffuseColor = vec4( diffuse, opacity );
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    vec3 totalEmissiveRadiance = emissive;

    #include <logdepthbuf_fragment>
    #include <map_fragment>
    #include <color_fragment>
    #include <alphamap_fragment>
    #include <alphatest_fragment>
    #include <specularmap_fragment>
    #include <normal_flip>
    #include <normal_fragment>
    #include <emissivemap_fragment>

    // accumulation
    #include <lights_phong_fragment>
    #include <lights_template>

    // modulation
    #include <aomap_fragment>

    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

    #include <envmap_fragment>


    gl_FragColor = vec4( outgoingLight, diffuseColor.a );

    #include <premultiplied_alpha_fragment>
    #include <tonemapping_fragment>
    #include <encodings_fragment>
    #include <fog_fragment>

}
`, {
    inline: true
})