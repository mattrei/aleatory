    visparticles() {
     const VIS = 'visparticles'
     const conf = {on: false}
     const group = new THREE.Group()
     group.visible = conf.on
     this.scene.add(group)

      class StarParticle {
        constructor(args) {
          this._vertex = args.vertex
          this._position = new THREE.Vector3()
          this._initialForce = new THREE.Vector3()
          this._velocity = new THREE.Vector3()
          this._vec = new THREE.Vector3()
          this._zoom = new THREE.Vector3()
          this._max = random(10000, 25000)
          this._amount = 0
          this._fx = new THREE.Vector3()
        }
       init(position, force) {
            this._vertex.copy(position);
            this._position.copy(position);
            this._initialForce.copy(force).multiplyScalar(0.25);
            this._initialForce.x = clamp(this._initialForce.x, -10, 10);
            this._initialForce.y = clamp(this._initialForce.y, -10, 10);

            this._velocity.add(new THREE.Vector3(0, 0, 10));
            if (!random(0, 5)) _zoom.z = 1;

            this._vec.set(random(-10, 10) / 5, random(-10, 10) / 5, random(-10, 10) / 5);
            this._initialForce.add(this._vec);
        }

        rise(deltaY) {
          //this._position.add(this._initialForce);
          //this._position.add(this._zoom);
          //this._position.add(this._velocity);
          this._vertex.copy(this._position);

          this._fx.set(0, 0, 0)
          this._fx.y = deltaY

          //this._position.set(this._fx);
          this._position.y = this._fx.y
        }

        update(mouse, delta) {
            if (this._position.z < -this._max) return;
            this._position.add(this._initialForce);
            this._position.add(this._zoom);
            this._position.add(this._velocity);
            this._vertex.copy(this._position);

            this._zoom.z *= 1.0095;

            if (this._initialForce.z > -10) this._initialForce.z -= 0.009;

            this._velocity.multiplyScalar(0.9);

            this._vec.subVectors(mouse, this._position);
            var dSq = this._vec.lengthSq();

            var f = dSq / 40000;
            f = f < 0 ? 0.1 : f > 1 ? 1 : f;

            var a = Math.atan2(this._vec.y, this._vec.x);

            this._fx.set(0, 0, 0);
            this._fx.x += Math.cos(a) * this._amount;
            this._fx.y += Math.sin(a) * this._amount;
            this._velocity.add(this._fx);

          //console.log(this._vertex)
        }
      }

     const particles = []
     const pool = []
     let poolIdx = 0
     const MAX_PARTICLES =  2000,
      START_PARTICLES = 80

     this.loader.load('/assets/star.png', (starTexture) => {
       this.loader.load('/assets/palette.jpg', (paletteTexture) => {

       const geometry = new THREE.Geometry(),
             material = /*new THREE.PointsMaterial( {
               map: starTexture, size: 1, color: 0xff0000} );
             */

             new THREE.ShaderMaterial({
               uniforms: {
                palette: {
                    type: "t",
                    value: paletteTexture
                },
                map: {
                    type: "t",
                    value: starTexture
                },
                size: {
                    type: "f",
                    value: 10
                },
                opacity: {
                    type: "f",
                    value: 0.75
                },
                area: {
                    type: "f",
                    value: 3000
                }
               },
               vertexShader: glslify('./glsl/Intro/Stars.vert'),
               fragmentShader: glslify('./glsl/Intro/Stars.frag'),
               transparent: true,
               depthTest: false,
               blending: THREE.AdditiveBlending,
             })


         // fill pool
          for (var i = 0; i < MAX_PARTICLES; i++) {
            const vertex = new THREE.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)
            //const vertex = new THREE.Vector3(random(0, 100),random(0,100),0)

            const p = new StarParticle({vertex: vertex})
            geometry.vertices.push(vertex)
            //B.scale.value[D] = Utils.doRandom(3, 10) / 10;
            //B.alpha.value[D] = Utils.doRandom(3, 10) / 10;
            let mouse = new THREE.Vector3(),
                force = new THREE.Vector3(-0.01, 0.02, 0)
            pool.push(p)
            //p.init(mouse, force)
            //particles.push(p)
          }

         const mesh = new THREE.Points(geometry, material)
         group.add(mesh)

         let isIntro = true,
          intro = {
            height: 0,
            mesh: null,
            geometry: new THREE.Geometry(),
            particles: []
          }

         const j = new THREE.Vector3(),
               lastMouse = new THREE.Vector3(),
               mouse = new THREE.Vector3()// todo
         this.events.on('tick', t => {

           if (!isIntro) {

             const freq = super.getFreq(200, 400)
             mouse.z += 0.1
             mouse.y = freq * 500

              var delta = j.subVectors(mouse, lastMouse).length()

              particles.forEach(p => {
                  p.update(mouse, delta);
              })
              lastMouse.copy(mouse)

              geometry.verticesNeedUpdate = true
               // get new particles from pool
            for (var i = 0; i < 8; i++) {
               let o = pool[poolIdx++ % MAX_PARTICLES]
               let force = new THREE.Vector3(random(-10,10), random(-10,10), random(-1,1))
               o.init(mouse, force)
              particles.push(o)
            }
          } else {

            intro.particles.forEach(p => {
                p.rise(intro.height)
            })
            intro.geometry.verticesNeedUpdate = true
          }
         })
         this.events.on(VIS+'::visOn', _ => {
           group.visible = true

           for (let i = 0; i< START_PARTICLES; i++) {
             let force = new THREE.Vector3(0, random(0,10), 0),
              pos = new THREE.Vector3(random(-100,100), random(0,10), random(-100,100))


              const vertex = new THREE.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)
              const p = new StarParticle({vertex: vertex})
              geometry.vertices.push(vertex)
              p.init(pos, force)
              intro.particles.push(p)


              intro.mesh = new THREE.Points(intro.geometry, material)


           }
           tweenr.to(intro, {height:500, duration: 5})
           tweenr.to(this.camera.position, {y:500, duration: 5})
            .on('complete', _ => {
              isIntro = false
              super.fadeOut(intro.mesh, 2)
            })


         })
         this.events.on(VIS+'::visOff', _ => group.visible = false)


       })
     })

     super.addVis(VIS, conf)
  }



const starVertexShader = glslify(`
 uniform float size;

attribute float alpha;
attribute float scale;

varying float vAlpha;
varying vec3 vPos;

void main() {
    vPos = position;
    vAlpha = alpha;
  float scale = 1.0;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (size * scale) * (1000.0 / length(mvPosition.xyz));
    gl_Position = projectionMatrix * mvPosition;
}


`, { inline: true })

const starFragmentShader = glslify(`
uniform sampler2D map;
uniform sampler2D palette;
uniform float area;
uniform float opacity;

varying vec3 vPos;
varying float vAlpha;

float range(float oldValue, float oldMin, float oldMax, float newMin, float newMax) {
    float oldRange = oldMax - oldMin;
    float newRange = newMax - newMin;
    return (((oldValue - oldMin) * newRange) / oldRange) + newMin;
}

vec3 desaturate(vec3 color, float amount) {
    vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), color));
    return vec3(mix(color, gray, amount));
}

vec2 getUV() {
    vec2 uv = vec2(0.0);
    uv.x = clamp(range(vPos.x, -area, area, 0.0, 1.0), 0.0, 1.0);
    uv.y = clamp(range(vPos.y, area, -area, 1.0, 0.0), 0.0, 1.0);
    return uv;
}

void main() {

    vec3 color = texture2D(palette, getUV()).rgb;

    float desat = clamp((abs(vPos.z) / 20000.0), 0.0, 0.7);

    vec4 texel = texture2D(map, vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y));
    texel.rgb *= color;

    texel.a *= opacity;
    //texel.a *= vAlpha;

    texel.a *= 1.0 + desat;
    texel.a = clamp(texel.a, 0.0, 0.9);

    if (length(color) < 0.4) texel.rgb *= 3.0;

    gl_FragColor = /*vec4(1.0,0.0,0.0,1.0);//*/texel;
}

`, { inline: true })
