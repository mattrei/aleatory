global.THREE = require('three.js')
import dat   from 'dat-gui'
import Stats from 'stats-js'
import MathF from 'utils-perf'
import randf from 'random-float'
const glslify = require('glslify')

const OrbitControls = require('three-orbit-controls')(THREE);

class Demo {
  constructor(args)
  {
    this.startStats();
    this.startGUI();

    this.particles = null

    this.time = 0

    this.loader = new THREE.TextureLoader()
    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.counter  = 0;
    this.clock    = new THREE.Clock();

    this.createRender();
    this.createScene();
    this.addObjects();

    this.onResize();
    this.update();
  }

  startStats()
  {
    this.stats = new Stats();
    this.stats.domElement.style.position = 'absolute';
    document.body.appendChild(this.stats.domElement);
  }

  createRender()
  {
    this.renderer = new THREE.WebGLRenderer( {
        antialias : true,
        clearColor: 0
    } );
    document.body.appendChild(this.renderer.domElement)
  }

  createScene()
  {
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 4000 );
    this.camera.position.set(0, 45, 240);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxDistance = 5000;

    this.scene = new THREE.Scene();
  }

  _getImgData(pic) {

    return new Promise(function (fulfill, reject){

      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      var image = new Image();
      image.src = pic;
      image.onload = function() {
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
        fulfill(imgData)
      }

    })

  }

    _getPixel(imgData, x, y) {
    var r, g, b, a, offset = x * 4 + y * 4 * imgData.width;
    r = imgData.data[offset];
    g = imgData.data[offset + 1];
    b = imgData.data[offset + 2];
    a = imgData.data[offset + 3];

    return new THREE.Color(r,g,b)

  }


  addObjects()
  {
    var gridHelper = new THREE.GridHelper( 100, 10 );
    //this.scene.add( gridHelper );


    const PARTICLES_AMOUNT = 40000
    const MAX_PARTICLE_DIST= 50
    const IMG_SCALE = 0.5

    this.loader.load('/assets/smoke.png', (texture) => {


    this.loader.load('/assets/for_particles.jpg', (bgImg) => {

    this._getImgData(bgImg.image.src).then(imgData => {

      let geometry = new THREE.BufferGeometry()


      /*
      let material = new THREE.PointsMaterial( {
        size: 10,
        map: texture,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
      })
      */

      //let positions = geometry.attributes.position.array
      //let colors = geometry.attributes.color.array
      var positions = new Float32Array(PARTICLES_AMOUNT * 3);
      var colors = new Float32Array(PARTICLES_AMOUNT * 3);
      var sizes = new Float32Array(PARTICLES_AMOUNT);


      for (var i = 0, i3 = 0; i < PARTICLES_AMOUNT; i++ , i3 += 3) {

        var position = new THREE.Vector3(
          randf(0, imgData.width ),
          randf(0, imgData.height),
          0
        );


          // Randomly select a pixel
          let x = Math.round(imgData.width * Math.random()),
             y = Math.round(imgData.height * Math.random()),
             pixel = this._getPixel(imgData, x, y)


            position = new THREE.Vector3(
              (imgData.width / 2 - x) * IMG_SCALE,
              (y - imgData.height / 2) * IMG_SCALE,
              0)



        // Position
        positions[i3 + 0] = position.x;
        positions[i3 + 1] = position.y;
        positions[i3 + 2] = position.z;

        // Color
        let color = pixel
        colors[i3 + 0] = color.r/255;
        colors[i3 + 1] = color.g/255;
        colors[i3 + 2] = color.b/255;

        // Size
        sizes[i] = randf(0.5, 2);

      }

      geometry.addAttribute( 'position', new THREE.BufferAttribute(positions, 3));
      geometry.addAttribute( 'color', new THREE.BufferAttribute(colors, 3));
      geometry.addAttribute( 'size', new THREE.BufferAttribute(sizes, 1));

      let material = new THREE.ShaderMaterial( {

          uniforms: {
              time: { type: 'f', value: 0 },
              bgImg: { type: 't', value: bgImg }
          },
          vertexShader: glslify(__dirname + '/glsl/Test_Particles.vert'),
          fragmentShader: glslify(__dirname + '/glsl/Test_Particles.frag'),
          blending: THREE.AdditiveBlending,
          transparent: false,
          depthWrite: true,
          depthTest: false
      } );

      let particles = new THREE.Points(geometry, material)
      this.scene.add(particles)
      this.particles = particles


    })
    })
    })





  }

  startGUI()
  {
    // var gui = new dat.GUI()
    // gui.add(camera.position, 'x', 0, 400)
    // gui.add(camera.position, 'y', 0, 400)
    // gui.add(camera.position, 'z', 0, 400)
  }

  update()
  {
    this.stats.begin();

    this.time++
    if (this.particles) {
      this.particles.material.uniforms.time.value = this.time * 0.2
    }

    this.renderer.render(this.scene, this.camera);

    this.stats.end()
    requestAnimationFrame(this.update.bind(this));
  }

  onResize()
  {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}

export default Demo;
