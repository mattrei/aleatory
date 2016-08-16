const glslify = require('glslify')
const random = require('random-float')
const randomInt = require('random-int')

const MAX_PARTICLES = 10000

export default class Satellite extends THREE.Object3D {
    constructor(loader, aaa, color, xradius, yradius, zradius) {
        super()

        this.loader = loader
        this.aaa = aaa
        this.color = color

        this.pos = new THREE.Object3D(xradius, yradius, zradius)

        this.nbParticles = 0;

        this.tick = 0

        // Particle settings
        this.life = 2.0;
        this.size = 1.0;
        this.spawnRate = 400;
        this.horizontalSpeed = random(1, 2)
        this.verticalSpeed = random(3, 4)
        this.maxVelocityX = random(0.2, 1)
        this.maxVelocityY = random(0.7, 1.5)

        this.freqType = randomInt(0, 2)

        this.xRadius = xradius * 1
        this.yRadius = yradius * 1
        this.zRadius = zradius * 1
        this.startTime = 0.0;

        this.velocity = new THREE.Vector3(0, 0, 0);

        this.init()
    }

    setYRadius(r) {
        this.yRadius = r
    }

    _FS() {
        return glslify(`
        varying float lifeLeft;

uniform sampler2D sprite;
uniform vec3 uColor;

void main() {
  vec3 color = uColor;
  vec4 tex = texture2D( sprite, gl_PointCoord );
  float alpha = lifeLeft * .25;

  gl_FragColor = vec4( color.rgb * tex.a, alpha * tex.a );

}
`, {
            inline: true
        })
    }

    _VS() {
        return glslify(`
        #pragma glslify: pnoise = require(glsl-noise/periodic/3d.glsl)

uniform float uTime;

attribute vec3 velocity;
attribute float startTime;
attribute float size;
attribute float life;

varying float lifeLeft;

// Thanks to Spite for this function
float turbulence( vec3 p ) {
  float t = -.5;
  for (float f = 1.0 ; f <= 10.0 ; f++ ){
      float power = pow( 2.0, f );
      t += abs( pnoise( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );
  }
  return t;
}

void main() {
  vec3 newPosition;
  vec3 vel;

  float elapsedTime = uTime - startTime;
  float timeOnLife = elapsedTime / life;

  lifeLeft = 1.0 - timeOnLife;

  float scale = 3.0;
  gl_PointSize = ( scale * size ) * lifeLeft;

  float turb = turbulence( vec3( velocity.x * elapsedTime, velocity.y * elapsedTime, velocity.z * elapsedTime ) );
  float noise = pnoise( velocity * timeOnLife, vec3( 1000.0 ) );
  float displacement = 10. * noise + (30. * timeOnLife * turb);

  newPosition = position + velocity * displacement;

  if( gl_PointSize < .05 ) {
    lifeLeft = 0.;
  }

  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
}
`, {
            inline: true
        })
    }

    init() {

        this.geom = new THREE.BufferGeometry();
        this.mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0.0
                },
                uColor: {
                    value: new THREE.Color(this.color)
                },
                tSprite: {
                    value: this.loader.load('/dist/assets/Drones/satelliteparticle.png')
                },
            },
            vertexShader: this._VS(),
            fragmentShader: this._FS(),
            depthTest: true,
            transparent: false,
            blending: THREE.AdditiveBlending,
        });



        this.positions = new Float32Array(MAX_PARTICLES * 3);
        this.velocities = new Float32Array(MAX_PARTICLES * 3);
        this.startTimes = new Float32Array(MAX_PARTICLES)
        this.lifes = new Float32Array(MAX_PARTICLES);
        this.sizes = new Float32Array(MAX_PARTICLES);

        this.geom.addAttribute('position', new THREE.BufferAttribute(this.positions, 3).setDynamic(true));
        this.geom.addAttribute('velocity', new THREE.BufferAttribute(this.velocities, 3).setDynamic(true));
        this.geom.addAttribute('startTime', new THREE.BufferAttribute(this.startTimes, 1).setDynamic(true));
        this.geom.addAttribute('size', new THREE.BufferAttribute(this.sizes, 1).setDynamic(true));
        this.geom.addAttribute('life', new THREE.BufferAttribute(this.lifes, 1).setDynamic(true));


        const mesh = new THREE.Points(this.geom, this.mat)
        mesh.position.set(0, 0, 0)
        mesh.visible = true
        this.add(mesh)

        this.mesh = mesh

        const light = new THREE.PointLight(this.color, 1, random(20, 30))
        this.add(light)
    }

    spawnParticle() {
        let i = this.nbParticles;

        this.positions[i * 3 + 0] = this.position.x + (Math.random() - 0.5) * 0.07;
        this.positions[i * 3 + 1] = this.position.y + (Math.random() - 0.5) * 0.07;
        this.positions[i * 3 + 2] = this.position.z + (Math.random() - 0.5) * 0.07;

        this.velocities[i * 3 + 0] = this.velocity.x + (Math.random() - 0.5) * 0.55;
        this.velocities[i * 3 + 1] = this.velocity.y + (Math.random() - 0.5) * 0.55;
        this.velocities[i * 3 + 2] = this.velocity.z + (Math.random() - 0.5) * 0.55;

        this.startTimes[i] = this.startTime;
        this.sizes[i] = this.size;
        this.lifes[i] = this.life;

        this.nbParticles++;

        if (this.nbParticles >= MAX_PARTICLES) {
            this.nbParticles = 0;
        }
    }

    _getLowFreq() {
        if (this.freqType == 0)
            return this.aaa.getLowFreq()
        else if (this.freqType == 1)
            return this.aaa.getMidFreq()
        else
            return this.aaa.getHighFreq()
    }

    _getMidFreq() {
        if (this.freqType == 0)
            return this.aaa.getMidFreq()
        else if (this.freqType == 1)
            return this.aaa.getLowFreq()
        else
            return this.aaa.getMidFreq()
    }

    _getHighFreq() {
        if (this.freqType == 0)
            return this.aaa.getHighFreq()
        else if (this.freqType == 1)
            return this.aaa.getHighFreq()
        else
            return this.aaa.getLowFreq()
    }

    update(dt) {

        if (!this.mesh || !this.mesh.visible) {
            return
        }

        this.tick += dt * 0.1

        const t = this.tick

        const low = this._getLowFreq(),
            mid = this._getMidFreq(),
            high = this._getHighFreq()

        this.position.x = Math.cos(t) * this.xRadius
        this.position.y = Math.sin(t * this.verticalSpeed) * (this.yRadius);
        this.position.z = Math.sin(t) * this.zRadius

        this.velocity.x = Math.sin((t + mid) * this.maxVelocityX);
        this.velocity.y = Math.cos((t + low) * this.maxVelocityY);
        this.velocity.z = (Math.sin((t + high) * this.maxVelocityX) + Math.cos((t + low) * this.maxVelocityY));

        for (let x = 0; x < this.spawnRate * 1; x++) {
            this.spawnParticle();
        }

        this.startTime = t;
        this.mat.uniforms.uTime.value += dt * 0.1

        this.geom.attributes.position.needsUpdate = true;
        this.geom.attributes.velocity.needsUpdate = true;
        this.geom.attributes.startTime.needsUpdate = true;
        this.geom.attributes.size.needsUpdate = true;
        this.geom.attributes.life.needsUpdate = true;
    }
}
