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

const Geodata = require('./countries.json')

//http://makc.github.io/three.js/map2globe/

export
default class Countries extends AObject {
    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this.ready = false
        this.tick = 0

        this.init()
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

        console.log(Geodata)


        const gold = new THREE.MeshLambertMaterial({
            color: 0xffaa50,
            shading: THREE.FlatShading
        });
        for (var name in Geodata) {
            const map3dgeometry = new Map3DGeometry(Geodata[name], 0);
            globe.add(Geodata[name].mesh = new THREE.Mesh(map3dgeometry, gold));
        }

        /*
            showDebt = function () {
        for (var name in data) {
            var scale = (1 + 7e-6 * ( data[name].data.gdp || 0 ) * ( data[name].data.debt || 0 ) / 100);
            TweenLite.to(data[name].mesh.scale, 0.5, { x : scale, y : scale, z : scale });
        }
    }*/
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


const mapVS = glslify(`
    #pragma glslify: snoise4 = require(glsl-noise/simplex/4d)
#pragma glslify: PI = require(glsl-pi)
#pragma glslify: ease = require(glsl-easings/quadratic-in)

attribute vec3 color;
attribute vec3 extra;
attribute vec2 puv;


uniform float uTime;
uniform float uTimeInit;
uniform float uAnimationSphere;
uniform float uAnimationFlat;

uniform vec2 uMatrightBottom;
uniform vec2 uMatleftTop;
uniform float uSphereRadius;


varying vec2 vUv;
varying vec3 vColor;


        // convert the positions from a lat, lon to a position on a sphere.
    vec3 latLongToVector3(float lat, float lon, float radius) {
        float phi = (lat)*PI/180.0;
        float theta = (lon-180.0)*PI/180.0;

        float x = radius * cos(phi) * cos(theta);
        float y = radius * cos(phi) * sin(theta);
        float z = radius * sin(phi);

        // return vec3(x,y,z);
                // the above math calls Z up - 3D calls Y up
                // i don't know why it has to be negative :P
        return vec3(x,z,-y);
    }

        vec2 uvToLatLong(vec2 uvs, vec2 leftTop, vec2 rightBottom ) {
                // uv coordinates go from bottom-left to top-right
                // 0.0,0.0 is bottom left, 1.0,1.0 is top right, 0.5,0.5 is center
                // latLong coords go depending on which demisphere you're in
                float right = rightBottom.x;
                float bottom = rightBottom.y;
                float left = leftTop.x;
                float top = leftTop.y;
                float xDiff = right - left;
                float yDiff = bottom - top;

                // treat uv as a completion ratio from left to right and bottom to top
                float xPercent = left + ( xDiff * uvs.x );
                float yPercent = bottom - ( yDiff * uvs.y );

                vec2 latlong = vec2( xPercent, yPercent );
                return latlong;
        }

vec3 chaosPosition(vec3 pos) {
  float vel = uTime * 0.05;
  return vec3(pos.x + snoise4(vec4(pos.x, pos.y, pos.z, uTime * 0.1)) * 1000.,
              pos.y + snoise4(vec4(pos.x, pos.y, pos.z, uTime * 0.1 + 1.25)) * 1000.,
              pos.z + snoise4(vec4(pos.x, pos.y, pos.z, uTime * 0.1 + 12.25)) * 1000.);
}


   void main() {
        vUv = uv;
       vColor = color;
     vec3 pos = position;


      vec2 newLatLong = uvToLatLong(puv, uMatleftTop, uMatrightBottom);

            vec3 spherePosition = latLongToVector3(newLatLong.y, newLatLong.x, uSphereRadius);
      vec3 chaosPosition = chaosPosition(pos);
      vec3 flatPosition = position;

       vec3 newPosition = chaosPosition;

     newPosition = mix( newPosition, spherePosition, ease(uAnimationSphere));
     newPosition = mix( newPosition, flatPosition, ease(uAnimationFlat));


      //newPosition.z += sin(newPosition.x * 0.01 + newPosition.y * 0.01 + uTime * 10.) * 200.;

          vec4 mvPosition = modelViewMatrix * vec4( newPosition, 1.0 );

        gl_Position = projectionMatrix * mvPosition;
       
       float size = 20.0;
        //gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );
        gl_PointSize = size;
      }


`, {
    inline: true
})


const mapFS = glslify(`

varying vec2 vUv;
varying vec3 vColor;

uniform float uTime;

        void main()
        {
          vec2 center = vec2(0.5, 0.5);
          float t = 0.05 / length(gl_PointCoord - center);
          t = pow(t, 2.5);
          vec3 final = vec3(t);
          final *= vColor;

          gl_FragColor = vec4(final, 1.0);

        }

`, {
    inline: true
})