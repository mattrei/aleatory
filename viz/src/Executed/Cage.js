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
    constructor(name, conf, scene) {
        super(name, conf, scene)

        this.ready = false
        this.tick = 0

        this.createAsteroids()
        this.createCage()

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
            const midFreq = this.scene.getMidFreq()
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
        let pMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 3,
            blending: THREE.AdditiveBlending,
            transparent: true,
            sizeAttenuation: false
        });

        pMaterial = new THREE.ShaderMaterial({
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
            transparent: true
        });

        let linesMesh = new THREE.LineSegments(lGeometry, lMaterial);
        group.add(linesMesh);


        let tick = 0
        super.tick(dt => {

            const freq = this.scene.getMidFreq()

            tick += dt
            const MIN_DISTANCE = 1 // TODO make sin
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