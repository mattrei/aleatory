const MAX_PARTICLES = 10000

export class Satellite extends THREE.Object3D {
    constructor(loader, radius) {
        super()

        this.pos = new THREE.Object3D(radius, 0, 0)

        this.nbParticles = 0;

        this.tick = 0

        // Particle settings
        this.life = 2.0;
        this.size = 1.0;
        this.spawnRate = 400;
        this.horizontalSpeed = 0.8;
        this.verticalSpeed = 0.8;
        this.maxVelocityX = 0.3;
        this.maxVelocityY = 0.6;

        this.xRadius = radius * 1
        this.yRadius = radius * 1
        this.zRadius = radius * 1
        this.startTime = 0.0;

        this.velocity = new THREE.Vector3(0, 0, 0);

        this.particleSpriteTex = loader.load('/dist/assets/Drones/satelliteparticle.png')

        this.geom = new THREE.BufferGeometry();
        this.mat = new THREE.ShaderMaterial({
            uniforms: {
                time: {
                    type: 'f',
                    value: 0.0
                },
                tSprite: {
                    type: 't',
                    value: this.particleSprite
                },
            },
            vertexShader: this._VS(),
            fragmentShader: this._FS(),
            depthTest: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
        });

        this.init()

    }

    _FS() {
        return glslify(`
        varying float lifeLeft;

uniform sampler2D sprite;

void main() {
  vec3 color = vec3(0., 0.650, 0.4);
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

uniform float time;

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

  float elapsedTime = time - startTime;
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
    }

    spawnParticle() {
        let i = this.nbParticles;

        this.positions[i * 3 + 0] = this.pos.x + (Math.random() - 0.5) * 0.07;
        this.positions[i * 3 + 1] = this.pos.y + (Math.random() - 0.5) * 0.07;
        this.positions[i * 3 + 2] = this.pos.z + (Math.random() - 0.5) * 0.07;

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

    update(dt) {

        if (!this.mesh || !this.mesh.visible) {
            return
        }

        this.tick += dt * 0.1

        const t = this.tick,
            s = 1

        this.pos.x = Math.cos(t) * this.xRadius;
        this.pos.y = Math.sin(t * this.verticalSpeed) * (this.yRadius + s);
        this.pos.z = Math.sin(t) * this.zRadius;

        this.velocity.x = Math.sin((t + s) * this.maxVelocityX);
        this.velocity.y = Math.cos((t + s) * this.maxVelocityY);
        this.velocity.z = (Math.sin((t + s) * this.maxVelocityX) + Math.cos((t + s) * this.maxVelocityY));

        for (let x = 0; x < this.spawnRate * s; x++) {
            this.spawnParticle();
        }

        this.startTime = t;
        this.mat.uniforms.time.value += dt * 0.1

        this.geom.attributes.position.needsUpdate = true;
        this.geom.attributes.velocity.needsUpdate = true;
        this.geom.attributes.startTime.needsUpdate = true;
        this.geom.attributes.size.needsUpdate = true;
        this.geom.attributes.life.needsUpdate = true;
    }
}
