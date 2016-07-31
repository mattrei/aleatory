
require('../utils/GeometryUtils')
require('../utils/CurveExtras')

const simplex = new(require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')
const clamp = require('clamp')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')


      const NUM_BUILDINGS = 100,
        MAX_HEIGHT = 50,
        MAX_WIDTH = 10,
        MAX_RADIUS = NUM_BUILDINGS / 2

const conf = {on:true}

export default class City extends THREE.Object3D {
  constructor(scene) {
    super()

    this.scene = scene

    this.ready = false
    this.tick = 0

    //this.init()
    this.initAurora()
   
//    this.scene.getScene().fog = new THREE.FogExp2( 0x000000, 0.25 );

  }

  initAurora() {
  	this.scene.getScene().fog = null


    this.scene.getLoader().load(
      '/dist/assets/Intro/paintStreak_02.png', (texture) => {


  	const points = [
      new THREE.Vector3(0, 0, 2),
      new THREE.Vector3(1, 10, 1),
      new THREE.Vector3(2, 0, 5),
      new THREE.Vector3(5, -5, 0),
      new THREE.Vector3(0, 0, 1),
    ]


    const spline = new THREE.CatmullRomCurve3(points)
    const pointsComputed = spline.getPoints( points.length * 6 )
            
    const geom = new THREE.Geometry()
    geom.vertices = pointsComputed
    console.log(geom.vertices)

          const material = new THREE.ShaderMaterial( {
            uniforms:       {
            	time: { value: 0.0 },
            	delta: { value: 1 },
            	textureAlpha: {value: texture}
            },
            vertexShader:   auroraVertexShader,
            fragmentShader: auroraFragmentShader,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: true,
            depthTest: false,
          } );

    this.aurora = new THREE.Mesh(new THREE.TorusKnotGeometry( 1, 0.5, 100, 16 ), /*new THREE.MeshNormalMaterial({wireframe: false})*/ material)
    this.add(this.aurora)

})

  }

  init() {
  	      const meshes = []

      for( let i = 0; i < NUM_BUILDINGS; i ++ ){
        //console.log(1-Math.sin(i/NUM_BUILDINGS))
        const factor = i/NUM_BUILDINGS //1-Math.pow(i/NUM_BUILDINGS, 2)

          const geometry = new THREE.CubeGeometry( 1, 1, 1 ),
             windowPoints = THREE.GeometryUtils.randomPointsInGeometry(geometry, random(5, 10))
          geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0.5, 0 ) );

          var material = new THREE.MeshLambertMaterial({
            //map: texture,
            vertexColors : THREE.VertexColors,
            color: 0x3d5c5c, fog:false, wireframe: true,
             transparent: true})
        //var material  = new THREE.MeshNormalMaterial()

          const size = (1-Math.pow(factor,2)),
            scale = MAX_WIDTH * size,
            height = MAX_HEIGHT * (1-Math.pow(factor,0.2)),
            //maxRadius = Math.pow(1-factor, 2) * MAX_RADIUS,
            //radius = smoothstep(0, MAX_RADIUS, factor * MAX_RADIUS), //Math.sqrt(Math.random(0,1)) * maxRadius,
            radius = (Math.pow(factor,0.6) * MAX_RADIUS),
            angle = random(0, Math.PI * 2)

          console.log(factor + ' ' + size  + ' ' + radius + '  ' + angle)

          const mesh = new THREE.Mesh( geometry, material )

          mesh.scale.set(scale, height, scale)
          const x = radius * Math.cos(angle) + scale * 0.5,
            z = radius * Math.sin(angle) + scale + 0.5

          mesh.position.set(x, 0, z)

          meshes.push(mesh)

          this.add(mesh)
        }

        this.add(new THREE.AmbientLight(0xffffff))
  }


  getConf() {
    return conf
  }

  update(dt) {

  	this.tick += dt

  	if (this.aurora) this.aurora.material.uniforms.time.value = this.tick
  }

}



const auroraVertexShader = glslify(`
      #include <common>

      varying vec2 vUv;

      uniform float time;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        vUv = uv;

        vUv.x = cos( time + vUv.x );
        vUv.x = smoothstep( 0., 1., vUv.x );

        gl_Position = projectionMatrix * mvPosition;
      }
`, { inline: true })


const auroraFragmentShader = glslify(`

    uniform sampler2D textureAlpha;
	uniform float time;

    //uniform sampler2D textureColor;
    varying vec2 vUv;

    void main() {

        vec4 texA = texture2D( textureAlpha, vUv );

        vec3 color = vec3(1.0, 0.0, 0.0);

        gl_FragColor = vec4(color, texA.a);
      }

`, { inline: true })
