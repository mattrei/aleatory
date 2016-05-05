const glslify = require('glslify')


const VIS = 'soundwave'
let conf = {
  on: false,
  speed: 1
}

const PARTICLE_SIZE = 10

function soundwave(scene, on = false) {

  conf.on = on

  const group = new THREE.Group()
  group.visible = conf.on
  scene.getScene().add(group)


  const SIZE = 2.0

  scene.getLoader().load('/assets/Outro/particle.png', texture => {
    const plane = new THREE.PlaneGeometry(150, 100, 150, 150),
      geometry = new THREE.BufferGeometry()


    const nbParticles = plane.vertices.length;
    const positions = new Float32Array(nbParticles * 3),
      sizes = new Float32Array(nbParticles);

    for (let i = 0, i3 = 0; i < nbParticles; i++, i3 += 3) {
      positions[i3 + 0] = plane.vertices[i].x;
      positions[i3 + 1] = plane.vertices[i].y;
      positions[i3 + 2] = plane.vertices[i].z;

      sizes[i] = PARTICLE_SIZE
    }

    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1))


    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: {
          type: 'f',
          value: 0.0
        },
        sprite: {
          type: 't',
          value: texture
        },
        speed: {
          type: 'f',
          value: 1.0
        },
      },
      vertexShader: glslify('./Soundwave.vert'),
      fragmentShader: glslify('./Soundwave.frag'),
      depthTest: false,
      transparent: true,
    })

    const mesh = new THREE.Points(geometry, material)
    mesh.rotation.x = -0.45 * Math.PI

    group.add(mesh)

    scene.getEvents().on('tick', t => {
      material.uniforms.time.value = t.time
    })

  })

  scene.addVis(VIS, conf)

}

function xtion() {
  const VIS = 'xtion'
  const conf = {
    on: false
  }
  const group = new THREE.Group()
  group.visible = conf.on
  this.scene.add(group)

  const width = 640,
    height = 480;
  const nearClipping = 850,
    farClipping = 4000;

  let geometry = new THREE.BufferGeometry();
  let vertices = new Float32Array(width * height * 3);

  for (let i = 0, j = 0, l = vertices.length; i < l; i += 3, j++) {

    vertices[i] = j % width;
    vertices[i + 1] = Math.floor(j / width);

  }

  geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));


  let material = new THREE.ShaderMaterial({

    uniforms: {

      "map": {
        type: "t",
        value: null
      },
      "width": {
        type: "f",
        value: width
      },
      "height": {
        type: "f",
        value: height
      },
      "nearClipping": {
        type: "f",
        value: nearClipping
      },
      "farClipping": {
        type: "f",
        value: farClipping
      },

      "pointSize": {
        type: "f",
        value: 2
      },
      "zOffset": {
        type: "f",
        value: 1000
      }

    },
    vertexShader: glslify('../glsl/Xtion.vert'),
    fragmentShader: glslify('../glsl/Xtion.frag'),
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    transparent: true

  });

  let mesh = new THREE.Points(geometry, material)
  group.add(mesh)


  let lastTexture = null
  this.events.on(VIS + '::data', data => {
    //console.log("got")
    //console.log(data)

    this.loader.load(data.img, (texture) => {

      mesh.material.uniforms.map.value = texture
      mesh.material.needsUpdate = true

      if (lastTexture) lastTexture.dispose()
      lastTexture = texture
    })
  })


  super.addVis(VIS, conf)

}


export default soundwave
