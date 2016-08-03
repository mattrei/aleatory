const random = require('random-float')
const randomInt = require('random-int')
const glslify = require('glslify')
const Color = require('color')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')


const simplex = new(require('simplex-noise'))
const smoothstep = require('smoothstep')

import AObject from '../AObject'

// https://github.com/raurir/codedoodl.es/blob/master/doodles/raurir/racing-lines/index.html
const COLS = 12,
  ROWS = 30


export default class Jet extends AObject {
    constructor(name, conf, renderer, loader, aaa, camera) {
    super(name, conf)

    this.renderer = renderer
    this.loader = loader
    this.aaa = aaa
    this.camera = camera

    this.EMPTY_SLOT = "empty"
    this.BOTTOM = "bottom"
    this.TOP = "top"

    this.CUBE = {
      width: 15,
      height: 3,
      depth: 40,
      gap: 10
    }

    this.PLANE_OFFSET = 2

    this.DEPTH = ROWS * (this.CUBE.depth + this.CUBE.gap)
    this.WIDTH = COLS * (this.CUBE.width + this.CUBE.gap)

    this.meshes = []
    this.cubes = {
      bottom: [], // meshes will be stored
      top: []
    }

    this.init()
  }
  init() {

    for (let j = 0; j < ROWS; j++) {
      this.cubes.bottom[j] = []
      this.cubes.top[j] = []
      for (var i = 0; i < COLS; i++) {
        this.cubes.bottom[j][i] = this.EMPTY_SLOT
        this.cubes.top[j][i] = this.EMPTY_SLOT
      }
    }

    for (let i = 0; i < ROWS * COLS; i++) {
      this.createCube()
    };
  }

  createCube() {
    const xi = randomInt(0, COLS-1)
    const yi = Math.random() > 0.5 ? 1 : -1,
      yai = yi === -1 ? this.BOTTOM : this.TOP;
    const zi = randomInt(0, ROWS-1)


    const x = (xi - COLS / 2) * (this.CUBE.width + this.CUBE.gap);
    const y = yi * this.PLANE_OFFSET
    const z = zi * (this.CUBE.depth + this.CUBE.gap)

    if (this.cubes[yai][zi][xi] === this.EMPTY_SLOT) {
      const mesh = this.createMesh()

      mesh.position.y = y * 20;
      mesh.isWarping = false
      mesh.offset = {
        x: x,
        z: 0
      };
      mesh.posZ = z;

      this.cubes[yai][zi][xi] = mesh

      this.add(mesh)

      this.meshes.push(mesh)
        /*
    			TweenMax.to(box.position, num(0.3, 1), {
    				y: y,
    				delay: zi * num(0.1, 0.7),
    				onComplete: function() {
    					box.isWarping = false;
    				}
    			});
          */
    }
  }

  createMesh() {

    let geometry = new THREE.BoxGeometry(this.CUBE.width, this.CUBE.height, this.CUBE.depth)

    const slowColor = Color("#00ff00").lighten(random(0,1)),
      fastColor = Color("#ff0000").lighten(random(0,1))

    let material = new THREE.ShaderMaterial({
      uniforms: {
        slowColor: {
          type: "c",
          value: new THREE.Color(slowColor.hexString())
        },
        fastColor: {
          type: "c",
          value: new THREE.Color(fastColor.hexString())
        },
        distanceX: {
          type: "f",
          value: 1.0
        },
        distanceZ: {
          type: "f",
          value: 1.0
        },
        pulse: {
          type: "f",
          value: 0.0
        },
        speed: {
          type: "f",
          value: conf.speed
        },
      },
      vertexShader: jetVS,
      fragmentShader: jetFS,
      transparent: true,
      //fog: true
    })
    const mesh = new THREE.Mesh(geometry, material)
    return mesh
  }

  update(time) {

    const speed = conf.speed * 15

    this.meshes.forEach(mesh => {
      mesh.posZ += speed
        // normalized z distance from camera
      const distanceZ = 1 - ((this.DEPTH - mesh.posZ) / (this.DEPTH) - 1)
      mesh.material.uniforms.distanceZ.value = distanceZ

      // normalized x distance from camera (centre)
      const distanceX = 1 - (Math.abs(mesh.position.x)) / (this.WIDTH / 3);
      mesh.material.uniforms.distanceX.value = distanceX;

      mesh.material.uniforms.speed.value = conf.speed
        // pulses more with more speed... of course!
      if (Math.random() > (0.99995 - speed * 0.005)) {
        mesh.material.uniforms.pulse.value = 1;
      }
      //mesh.material.uniforms.pulse.value -= mesh.material.uniforms.pulse.value * 0.1 / (speed + 1);
    })



    for (var j = 0; j < ROWS; j++) { // iterate through rows: z
      for (var i = 0; i < COLS; i++) { // iterate throw cols: x
        this.move(i, this.BOTTOM, j);
        this.move(i, this.TOP, j);
      };
    };
  }

  move(x, y, z) {
    const mesh = this.cubes[y][z][x]
    if (mesh !== this.EMPTY_SLOT) {
      mesh.position.x = mesh.offset.x;
      mesh.position.z = mesh.offset.z + mesh.posZ

      // remove to start
      if (mesh.position.z > 0) {
        mesh.posZ -= this.DEPTH
      }

      if (!mesh.isWarping && Math.random() > 0.999) {
        var dir = randomInt(0,5),
          xn = x,
          zn = z,
          yn = y,
          yi = 0,
          xo = 0,
          zo = 0;

        switch (dir) {
          case 0:
            xn++;
            xo = 1;
            break;
          case 1:
            xn--;
            xo = -1;
            break;
          case 2:
            zn++;
            zo = 1;
            break;
          case 3:
            zn--;
            zo = -1;
            break;
          case 4: // this bit isn't really nice, but it works.
            yn = (y === this.TOP) ? this.BOTTOM : this.TOP
            yi = (y === this.TOP) ? -1 : 1;
            break;
        }
        if (this.cubes[yn][zn] && this.cubes[yn][zn][xn] === this.EMPTY_SLOT) {

          this.cubes[y][z][x] = this.EMPTY_SLOT

          mesh.isWarping = true;

          this.cubes[yn][zn][xn] = mesh
          if (dir === 4) { // slide vertically

            /*
            TweenMax.to(box.position, 0.5, {
              y: yi * planeOffset
            });
            */
            tweenr.to(mesh.offset, {
              x: yi * this.PLANE_OFFSET,
              duration: 1
            }).on('complete', _ => mesh.isWarping = false)

          } else { // slide horizontally

          /*
            TweenMax.to(box.offset, 0.5, {
              x: box.offset.x + xo * (size.width + gap),
              z: box.offset.z + zo * (size.depth + gap),
            });
            */
            tweenr.to(mesh.offset, {
              x: mesh.offset.x + xo * (this.CUBE.WIDTH + this.CUBE.GAP),
              z: mesh.offset.z + zo * (this.CUBE.DEPTH + this.CUBE.GAP),
              duration: 1
            }).on('complete', _ => mesh.isWarping = false)

          }

          /*
          TweenMax.to(box.offset, 0.6, {
            onComplete: function() {
              box.isWarping = false;
            }
          });
          */

        }
      }

    }
  }
}






function moveCubes(cubes, plane) {
  var angle = this.speed / SPEED.fast * 90

  for (var i = 0; i < cubes.length; i++) {
    let mesh = cubes[i]
    let idx = i % COLS
    var phi = (idx / COLS) * Math.PI

    let y = (Math.sin(phi + 0.1) * angle) //- ((phi+0.1) * angle/2),


    if (plane === 'bottom') {
      y *= -1
      y -= CUBES_OFF
    } else {
      y += CUBES_OFF
    }

    //console.log(phi)
    //mesh.rotation.z = (1 - Math.sin(phi+0.1)) * Math.PI/2 * angle
    //mesh.position.applyEuler(new THREE.Euler(0,0,Math.sin(phi+0.1) * 45))

    mesh.position.x = (mesh._col * (SIZE.width + GAP)) - ((SIZE.width + GAP) * COLS / 2)
    mesh.position.y = y
    mesh.position.z += this.speed

    var vector = new THREE.Vector3()
    vector.x = mesh.position.x
    vector.y = mesh.position.y
    vector.z = mesh.position.z
    mesh.lookAt(vector)

    // normalized z distance from camera
    var distanceZ = 1 - ((ALL_DEPTH - mesh.position.z) / (ALL_DEPTH) - 1);
    mesh.material.uniforms.distanceZ.value = distanceZ;
    // normalized x distance from camera (centre)
    var distanceX = 1 - (Math.abs(mesh.position.x)) / (ALL_WIDTH / 2);
    //mesh.material.uniforms.distanceX.value = distanceX;

    mesh.material.uniforms.speed.value = this.speed / SPEED.fast

    if (Math.random() > (0.99995 - this.speed * 0.0003)) {
      mesh.material.uniforms.pulse.value = 1
    }
    mesh.material.uniforms.pulse.value -=
      mesh.material.uniforms.pulse.value * 0.1 / (this.speed + 1)

    if (mesh.position.z > 0) {
      mesh.position.z = ALL_DEPTH * -1
    }

  }
}


const jetVS = glslify(`
varying vec2 vUv;

void main()
{
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * mvPosition;
}


`, { inline: true })

const jetFS = glslify(`

uniform vec3 slowColor;
uniform vec3 fastColor;

uniform float distanceZ;
uniform float distanceX;
uniform float pulse;
uniform float speed;

varying vec2 vUv;

void main( void ) {
  vec2 position = abs(-1.0 + 2.0 * vUv);

  float edging = abs((pow(position.y, 5.0) + pow(position.x, 5.0)) / 2.0);
  float perc = (0.2 * pow(speed + 1.0, 2.0) + edging * 0.8) * distanceZ * distanceX;

  vec3 color = mix(slowColor, fastColor, speed);

/*
  float red = r * perc + pulse;
  float green = g * perc + pulse;
  float blue = b * perc + pulse;
  */

  gl_FragColor = vec4(color, 1.0);
}


`, { inline: true })


/*
  addLight() {

    let h = 0.55,
      s = 0.9,
      l = 0.5

    let textureFlare0 = THREE.ImageUtils.loadTexture( "/assets/textures/lensflare/lensflare0.png" ),
         textureFlare2 = THREE.ImageUtils.loadTexture( "/assets/textures/lensflare/lensflare2.png" ),
         textureFlare3 = THREE.ImageUtils.loadTexture( "/assets/textures/lensflare/lensflare3.png" );

    let light = new THREE.PointLight( 0xffffff, 1.5, 300);
    light.color.setHSL( h, s, l );
    light.position.set( 0, -10, -500 );
    this.scene.add( light );

    let flareColor = new THREE.Color( 0xffffff );
          flareColor.setHSL( h, s, l + 0.5 );


    let lensFlare = new THREE.LensFlare( textureFlare0, 700, 0.0, THREE.AdditiveBlending, flareColor );

          lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
          lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
          lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );

          lensFlare.add( textureFlare3, 60, 0.6, THREE.AdditiveBlending );
          lensFlare.add( textureFlare3, 70, 0.7, THREE.AdditiveBlending );
          lensFlare.add( textureFlare3, 120, 0.9, THREE.AdditiveBlending );
          lensFlare.add( textureFlare3, 70, 1.0, THREE.AdditiveBlending );

          this.lensFlareUpdateCallback = this.lensFlareUpdateCallback.bind(this)
          lensFlare.customUpdateCallback = this.lensFlareUpdateCallback;
          lensFlare.position.copy( light.position );


          this.scene.add( lensFlare );
  }

  lensFlareUpdateCallback( object ) {

    this.counter++

        var f, fl = object.lensFlares.length;
        var flare;
        var vecX = -object.positionScreen.x * 2;
        var vecY = -object.positionScreen.y * 2;


        for( f = 0; f < fl; f++ ) {

             flare = object.lensFlares[ f ];


             //flare.x *= Math.sin(this.counter)
             //flare.distance = this.flareSize

             flare.x = object.positionScreen.x + vecX * flare.distance;
             flare.y = object.positionScreen.y + vecY * flare.distance;

             flare.rotation = this.counter / (50/this.flareRotation) % (Math.PI*2);
             flare.scale = Math.pow(this.flareSize, 3) * 10


        }

        object.lensFlares[ 2 ].y += 0.025;
        object.lensFlares[ 3 ].rotation = object.positionScreen.x * 0.5 + THREE.Math.degToRad( 45 );

      }
      */
