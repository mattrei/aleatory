import AObject from '../AObject'
const simplex = new(require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')

const newArray = require('new-array')

const randomRadian = () => random(-Math.PI, Math.PI)
const randomRotation = () => newArray(3).map(randomRadian)
const randomSphere = require('gl-vec3/random')
const randomSpherical = require('random-spherical/object')(null, THREE.Vector3)


const E_SPHERE_RADIUS = 3500,
    E_SM_SPHERE_RADIUS = 3000

export
default class Cage extends AObject {
    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this.ready = false
        this.tick = 0

        //this.createAsteroids()
        this.createCage()
        this.createImages()
    }

    createAsteroids() {

        const NUM_ASTEROIDS = 50

        const group = new THREE.Group()
        this.add(group)


        const geometries = newArray(6).map(asteroidGeom)
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            wireframe: true
        })


        const asteroids = newArray(NUM_ASTEROIDS).map(() => {
            const geometry = geometries[randomInt(geometries.length)]
            const mesh = new THREE.Mesh(geometry, material.clone())


            const pColor = new THREE.Color()
            pColor.setHSL((180 + Math.random() * 40) / 360, 1.0, 0.5 + Math.random() * 0.2)
            mesh.material.color = pColor

            mesh.material.opacity = random(0.05, 0.1)
            mesh.scale.multiplyScalar(random(8, 16))
            mesh.rotation.fromArray(randomRotation())
            mesh.direction = new THREE.Vector3().fromArray(randomSphere([]))
            mesh.position.fromArray(randomSphere([], random(5000, 6000)))

            group.add(mesh)
            return mesh
        })

        super.tick(dt => {
            const midFreq = this.aaa.getMidFreq()
            asteroids.forEach(mesh => {
                mesh.rotation.x += dt * 0.1 * mesh.direction.x * midFreq
                mesh.rotation.y += dt * 0.5 * mesh.direction.y * midFreq
            })
        })


        function asteroidGeom() {
            const geometry = new THREE.TetrahedronGeometry(10, randomInt(1, 3))
            geometry.vertices.forEach(v => {
                let steps = 3
                let s = Math.pow(2, steps)
                let a = 0.75
                for (let i = 0; i < steps; i++) {
                    v.x += a * simplex.noise3D(v.x * s * 0, v.y * s, v.z * s)
                    v.y += a * simplex.noise3D(v.x * s, v.y * s * 0, v.z * s)
                    v.z += a * simplex.noise3D(v.x * s, v.y * s, v.z * s * 0)
                    s *= 0.25
                    a *= 1 / steps * i
                }
            })
            geometry.computeFaceNormals()
            geometry.verticesNeedsUpdate = true
            return geometry
        }
    }

    createCage() {

        let group = new THREE.Group()
        this.add(group)

        const MAX = 600,
            MAX_LINES = 400

        // create the points
        const pMaterial = new THREE.ShaderMaterial({
            fragmentShader: cageFS,
            vertexShader: cageVS,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: false
        });

        let r = E_SPHERE_RADIUS

        let particlesData = []

        let pGeometry = new THREE.BufferGeometry();
        let particlePositions = new Float32Array(MAX * 3)


        for (let i = 0; i < MAX; i++) {

            var pointOnSurface = randomSpherical(E_SPHERE_RADIUS, new THREE.Vector3(0, 0, 0))

            particlePositions[i * 3] = pointOnSurface.x
            particlePositions[i * 3 + 1] = pointOnSurface.y
            particlePositions[i * 3 + 2] = pointOnSurface.z

            // add it to the geometry
            particlesData.push({
                velocity: new THREE.Vector3(random(-3, 3), random(-3, 3), random(-3, 3)),
                numConnections: 0
            });

        }

        pGeometry.setDrawRange(0, MAX_LINES);
        pGeometry.addAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setDynamic(true));

        // create the particle system

        let particlesMesh = new THREE.Points(pGeometry, pMaterial);
        group.add(particlesMesh);


        // now create the lines
        let segments = MAX * MAX
        let linePositions = new Float32Array(segments * 3),
            lineColors = new THREE.Float32Attribute(segments * 3, 3)
        let lGeometry = new THREE.BufferGeometry();

        lGeometry.addAttribute('position', new THREE.BufferAttribute(linePositions, 3).setDynamic(true));

        for (var i = 0; i < segments * 3; i++) {
            var pColor = new THREE.Color();
            pColor.setHSL((180 + Math.random() * 40) / 360, 1.0, 0.5 + Math.random() * 0.2);
            lineColors.setXYZ(i, pColor.r, pColor.g, pColor.b);
        }

        lGeometry.addAttribute('color', lineColors);

        lGeometry.computeBoundingSphere();
        lGeometry.setDrawRange(0, 0);

        let lMaterial = new THREE.LineBasicMaterial({
            vertexColors: THREE.VertexColors,
            blending: THREE.AdditiveBlending,
            transparent: true,
            linewidth: 2
        });

        let linesMesh = new THREE.LineSegments(lGeometry, lMaterial);
        group.add(linesMesh);


        let tick = 0
        super.tick(dt => {

            const freq = this.aaa.getMidFreq()

            tick += dt
            const MIN_DISTANCE = 4 + Math.abs(Math.sin(tick * 0.5)) * 2
            const SPEED = 1

            //pMaterial.opacity = 1 - Math.sin(t.time * 0.2) * 0.5

            let vertexpos = 0,
                colorpos = 0,
                numConnected = 0


            let mixColor = new THREE.Color(0, 0, 0)

            for (var i = 0; i < MAX_LINES; i++)
                particlesData[i].numConnections = 0;

            for (var i = 0; i < MAX_LINES; i++) {

                // get the particle
                let particleData = particlesData[i];

                particlePositions[i * 3] += particleData.velocity.x * SPEED
                particlePositions[i * 3 + 1] += particleData.velocity.y * SPEED
                particlePositions[i * 3 + 2] += particleData.velocity.z * SPEED

                let x = particlePositions[i * 3],
                    y = particlePositions[i * 3 + 1],
                    z = particlePositions[i * 3 + 2]

                let maxRadius = E_SPHERE_RADIUS
                if (this.conf.open) {
                    maxRadius = E_SPHERE_RADIUS * 10
                }
                if (Math.sqrt(x * x + y * y + z * z) > maxRadius ||
                    Math.sqrt(x * x + y * y + z * z) < E_SM_SPHERE_RADIUS) {
                    particleData.velocity.x = -particleData.velocity.x;
                    particleData.velocity.y = -particleData.velocity.y;
                    particleData.velocity.z = -particleData.velocity.z;
                }




                // Check collision
                for (var j = i + 1; j < MAX_LINES; j++) {

                    let particleDataB = particlesData[j];

                    var dx = particlePositions[i * 3] - particlePositions[j * 3];
                    var dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
                    var dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
                    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < MIN_DISTANCE * 200) {

                        particleData.numConnections++;
                        particleDataB.numConnections++;

                        var alpha = 1.0 - dist / MIN_DISTANCE * 200

                        linePositions[vertexpos++] = particlePositions[i * 3];
                        linePositions[vertexpos++] = particlePositions[i * 3 + 1];
                        linePositions[vertexpos++] = particlePositions[i * 3 + 2];

                        linePositions[vertexpos++] = particlePositions[j * 3];
                        linePositions[vertexpos++] = particlePositions[j * 3 + 1];
                        linePositions[vertexpos++] = particlePositions[j * 3 + 2];




                        let color = new THREE.Color()
                            //              color.setHSL((180+Math.random()*40)/360, 1.0, 0.5 + Math.random() * 0.2);


                        color.lerp(mixColor, freq)


                        lineColors[colorpos++] = color.r
                        lineColors[colorpos++] = color.g
                        lineColors[colorpos++] = color.b

                        lineColors[colorpos++] = color.r
                        lineColors[colorpos++] = color.g
                        lineColors[colorpos++] = color.b

                        numConnected++;


                    }
                }
            }


            linesMesh.geometry.setDrawRange(0, numConnected * 2);
            linesMesh.geometry.attributes.position.needsUpdate = true;
            linesMesh.geometry.attributes.color.needsUpdate = true;

            particlesMesh.geometry.attributes.position.needsUpdate = true;

        })

    }

    createImages() {

        const VIS = 'executed'


        let group = new THREE.Group()
        this.add(group)

        let idx = 0
        let meshes = [],
            spherePositions = [],
            view = 'sphere'

        let doSphere = (dur) => {
            for (let i = 0; i < meshes.length; i++) {

                var m = meshes[i];
                var target = spherePositions[i];
                dur = 2

                m.matrixAutoUpdate = true

                tweenr.to(m.position, {
                    x: target.position.x,
                    y: target.position.y,
                    z: target.position.z,
                    duration: random(dur, dur * 2)
                })

                tweenr.to(m.rotation, {
                    x: target.rotation.x,
                    y: target.rotation.y,
                    z: target.rotation.z,
                    duration: random(dur, dur * 2)
                })
                //.on('update', () => object.updateMatrix())


            }
        }

        const LOOKAT_DUR = 2
        let doLookAt = (m) => {
            if (!this.camera.target) {
                this.camera.target = m
            }

            let vector = new THREE.Vector3()
            if (view === 'sphere') {
                vector.copy(m.position).multiplyScalar(1.2);
            } else if (view === 'grid') {
                vector.copy(m.position)
                vector.z -= 400
            }


            // move to vector
            tweenr.to(this.camera.position, {
                x: vector.x,
                y: vector.y,
                z: vector.z,
                duration: LOOKAT_DUR
            })
                .on('update', () => {
                    this.camera.lookAt(this.camera.target)
                })
                .on('complete', () => {
                    this.camera.lookAt(this.camera.target)
                })
            tweenr.to(this.camera.target, {
                x: m.position.x,
                y: m.position.y,
                z: m.position.z,
                duration: LOOKAT_DUR
            })

            /*
      let d = m.userData

      this.text.name.innerHTML = d.name + " (" + d.age + ")"
      this.text.date.innerHTML = d.date
      Velocity(this.text.name, "fadeIn", this.transition/2 )
      Velocity(this.text.date, "fadeIn", this.transition/2 )
      */
        }

        let doSmash = () => {
            let mesh = meshes[idx % meshes.length]

            tweenr.to(mesh.material, {
                opacity: 0,
                duration: 2
            })
                .on('complete', () => mesh.visible = false)
            /*
          tweenr.to(v,
            { x: pos.x, y: pos.y, z: pos.z, duration: LOOKAT_DUR })
            .on('update', () => geometry.verticesNeedUpdate = true)
            .on('complete', () => mesh.visible = false)
            */
        }

        let doNext = () => {
            idx++
            let m = meshes[idx % meshes.length]
            doLookAt(m)
        }

        let doRnd = () => {
            let m = meshes[randomInt(0, meshes.length - 1)]
            doLookAt(m)
        }

        this.events.on(VIS + '::doSphere', p => doSphere(2 /*p.duration*/ ))
        this.events.on(VIS + '::doRnd', p => doRnd())
        this.events.on(VIS + '::doNext', p => doNext())
        this.events.on(VIS + '::doSmash', p => doSmash())


        let conf = {
            on: false,
            doSphere: doSphere,
            doNext: doNext,
            doRnd: doRnd,
            doSmash: doSmash,
            currentOn: false,
            currents: 1
        }
        group.visible = conf.on

        this.events.on(VIS + '::data', data => {

            data.forEach((e, i) => {

                this.loader.load(e.img, (texture) => {

                    texture.minFilter = THREE.LinearFilter
                    let planeGeometry = new THREE.PlaneGeometry(200, 200),
                        mat = new THREE.ShaderMaterial({
                            uniforms: {
                                resolution: {
                                    type: "v2",
                                    value: new THREE.Vector2(window.innerWidth, window.innerHeight)
                                },
                                time: {
                                    type: "f",
                                    value: 0.1
                                },
                                timeInit: {
                                    type: "f",
                                    value: Math.random() * 1000
                                },
                                showCurrent: {
                                    type: "f",
                                    value: conf.currentOn
                                },
                                numberCurrents: {
                                    type: "f",
                                    value: conf.currents
                                },
                                bgImg: {
                                    type: "t",
                                    value: texture
                                },
                                smashAmplitude: {
                                    type: "f",
                                    value: 0.0
                                }
                            },
                            side: THREE.DoubleSide,
                            transparent: true,
                            fragmentShader: pictureFS,
                            vertexShader: pictureVS
                        })


                    const tessellateModifier = new THREE.TessellateModifier(8)
                    for (var i = 0; i < 6; i++) {
                        tessellateModifier.modify(planeGeometry)
                    }
                    const explodeModifier = new THREE.ExplodeModifier()
                    explodeModifier.modify(planeGeometry)

                    const numFaces = planeGeometry.faces.length;

                    const geometry = new THREE.BufferGeometry().fromGeometry(planeGeometry);
                    const displacement = new Float32Array(numFaces * 3 * 3);

                    for (var f = 0; f < numFaces; f++) {
                        const index = 9 * f;
                        const d = 10 * (0.5 - Math.random());
                        for (var i = 0; i < 3; i++) {
                            displacement[index + (3 * i)] = 10 * (0.5 - Math.random());
                            displacement[index + (3 * i) + 1] = 10 * (0.5 - Math.random());
                            displacement[index + (3 * i) + 2] = 10 * (0.5 - Math.random());
                        }
                    }
                    geometry.addAttribute('displacement', new THREE.BufferAttribute(displacement, 3));

                    let mesh = new THREE.Mesh(geometry, mat)
                    mesh.userData = e

                    group.add(mesh)
                    meshes.push(mesh)
                })

            })



            var vector = new THREE.Vector3();

            // sphere
            for (var i = 0, l = data.length; i < l; i++) {

                var phi = Math.acos(-1 + (2 * i) / l);
                var theta = Math.sqrt(l * Math.PI) * phi;

                var object = new THREE.Object3D();

                object.position.x = SPHERE_SIZE * Math.cos(theta) * Math.sin(phi);
                object.position.y = SPHERE_SIZE * Math.sin(theta) * Math.sin(phi);
                object.position.z = SPHERE_SIZE * Math.cos(phi);

                vector.copy(object.position).multiplyScalar(2);

                object.lookAt(vector);

                spherePositions.push(object);

            }
        })

        super.on('pictures', _ => group.visible = true)

        super.tick(dt => {

            meshes.forEach(m => m.material.uniforms.time.value = this.tick)

            let m = meshes[idx % meshes.length]
            if (m) {
                m.material.uniforms.smashAmplitude.value = 100.0 * Math.sin(this.tick * 0.5);
                m.material.uniforms.showCurrent.value = conf.currentOn
                m.material.uniforms.numberCurrents.value = conf.currents
            }

        })


    }


    update(dt) {

        if (!super.update(dt)) return

        if (!this.ready) return

        this.tick += dt

    }

}


const cageFS = glslify(`
void main() {
    vec2 center = vec2(0.5, 0.5);
    float t = 0.1 / length(gl_PointCoord - center);
    t = pow(t, 3.0);
    gl_FragColor = vec4(t * 0.1, t * 0.2, t * 0.4, 1.0);
}


`, {
    inline: true
})

const cageVS = glslify(`
void main() {
    gl_PointSize = 80.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

`, {
    inline: true
})

const pictureFS = glslify(`
#pragma glslify: pnoise2 = require(glsl-noise/periodic/2d)

varying vec2 vUv;

uniform float numberCurrents;
uniform float time;
uniform float timeInit;
uniform float showCurrent;
uniform vec2 resolution;

uniform sampler2D bgImg;


float Hash( vec2 p)
{
     vec3 p2 = vec3(p.xy,1.0);
    return fract(sin(dot(p2,vec3(37.1,61.7, 12.4)))*3758.5453123);
}

float noise(in vec2 p)
{
    vec2 i = floor(p);
     vec2 f = fract(p);
     f *= f * (3.0-2.0*f);

    return mix(mix(Hash(i + vec2(0.,0.)), Hash(i + vec2(1.,0.)),f.x),
               mix(Hash(i + vec2(0.,1.)), Hash(i + vec2(1.,1.)),f.x),
               f.y);
}

float fbm(vec2 p)
{
     float v = 0.0;
     v += noise(p*1.0)*.5;
     v += noise(p*2.)*.25;
     v += noise(p*4.)*.125;
     return v;
}

vec3 clouds( vec2 uv, vec2 dir )
{
  dir *= time + timeInit;
  vec3 finalColor = fbm( (uv * 1.5) + dir ) * vec3( 1.0 );

  return finalColor;
}

vec3 lightning( vec2 uv )
{
  float timeVal = time;
  vec3 finalColor = vec3( 0.0 );
  for( int i=0; i < 3; ++i )
  {
    float indexAsFloat = float(i);
    float amp = 40.0 + (indexAsFloat*1.0);
    float period = 2.0 + (indexAsFloat+2.0);

    float thickness = mix( 0.1, 0.7, uv.y * 0.5 + 0.5 );

    float intensity = mix( 0.5, 1.5, noise(uv*10.0) );
    float t = abs( thickness / (sin(uv.x + fbm( uv + timeVal * period )) * amp) * intensity );
    float show = fract(abs(sin(timeVal))) >= 0.95 ? 1.0 : 0.0;
    show = showCurrent;
    show = (i < int(numberCurrents)) ? show : 0.0;
    show *= step( abs(fbm( vec2( sin(time * 50.0), 0.0 ) )), 0.4);


    finalColor +=  t * vec3( 0.3, 0.5, 2.0 ) * show;
  }

  return finalColor;
}

void main( void )
{

  vec2 uv = -1.0 + 2.0 *vUv;

  vec3 finalColor = vec3( 0.0 );

  finalColor += sin( clouds( uv, vec2( 1.0, 0.1 ) ));
  finalColor.rgb *= texture2D(bgImg, vUv ).rgb;

  float xOffset = mix( 0.5, -1.5, fbm(vec2( fract(time + timeInit), 0.00 ) ) );
  vec2 uvOffset = vec2( xOffset, 0.0 );

  vec2 lightningUV = uv + uvOffset;

  float theta = 3.14159 * 2.1;
  lightningUV.x = uv.x * cos(theta) - uv.y*sin(theta);
  lightningUV.y = uv.x * sin(theta) + uv.y*cos(theta);

  finalColor += lightning( lightningUV + uvOffset );

  finalColor -= sin( clouds( uv, vec2( 2.0 ) )) * 0.30;

  gl_FragColor = vec4( finalColor, 1.0 );
}


`, {
    inline: true
})

const pictureVS = glslify(`
uniform float smashAmplitude;
attribute vec3 displacement;

  varying vec2 vUv;
   void main() {
        vUv = uv;

        vec3 newPosition = position + normal * smashAmplitude * displacement;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }


`, {
    inline: true
})