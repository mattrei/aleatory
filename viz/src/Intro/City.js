
require('three/examples/js/curves/NURBSSurface')
require('three/examples/js/utils/GeometryUtils')

import AObject from '../AObject'
const simplex = new(require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')
const clamp = require('clamp')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')

require('../utils/THREE.MeshLine')


const BUILDING_SIZE = 5,
        BUILDING_HEIGHT = 5,
        NUM_BUILDINGS = 12

const NUM_SEGMENTS = 10


export default class City extends AObject {
  constructor(name, conf, scene) {
    super(name, conf, scene)

    this.scene = scene

    this.ready = false
    this.tick = 0

    this.initBuildings()
    //this.initAurora()

    this.initFloor()
   
//    this.scene.getScene().fog = new THREE.FogExp2( 0x000000, 0.25 );

var center = new THREE.Vector3();

    this.add(new THREE.AmbientLight(new THREE.Color(0xffffff).multiplyScalar(2.9)));
          var d0 = new THREE.DirectionalLight(0x808080);
      d0.position.set(0.5, 1, 1);
      d0.lookAt(center);
      this.add(d0);

      var d1 = new THREE.DirectionalLight(0x808080);
      d1.position.set(0.5, 0.5, 1);
      d1.lookAt(center);
      this.add(d1);

  }

  _surfaceFunction( u, v ) {
    var x,y,z;  // A point on the surface, calculated from u,v.
                // u  and v range from 0 to 1.
    x = 20 * (u - 0.5);  // x and z range from -10 to 10
    z = 20 * (v - 0.5);
    y = 2*(Math.sin(x/2) * Math.cos(z));
    return new THREE.Vector3( x, y, z );
}

  initAurora() {

    this.ascene.getLoader().load(
      '/dist/assets/Intro/paintStreak_02.png', (textureAlpha) => {

      this.ascene.getLoader().load(
        '/dist/assets/Intro/palette.jpg', (textureColor) => {


  	/*const points = [
      new THREE.Vector3(0, 0, 2),
      new THREE.Vector3(1, 10, 1),
      new THREE.Vector3(2, 0, 5),
      new THREE.Vector3(5, -5, 0),
    ]*/

    const points = [];

        for ( var i = 0; i < 3; i ++ ) {

          points.push( new THREE.Vector3( i  , THREE.Math.randFloat( - 5, 5 ), THREE.Math.randFloat( - 5, 5 ) ) );

        }


    const spline = new THREE.CatmullRomCurve3(points)
    const pointsComputed = spline.getPoints( points.length * 6 )
    spline.closed = false

            
    let geom = new THREE.Geometry()
    geom.vertices = pointsComputed
    console.log(geom.vertices)

          const material = new THREE.ShaderMaterial( {
            uniforms:       {
            	uTime: { value: 0.0 },
            	uDelta: { value: 1 },
              uFade: { value: 1 },
              uOffset: { value: Math.random() },
            	textureAlpha: {value: textureAlpha},
              textureColor: {value: textureColor},
            },
            vertexShader:   auroraVertexShader,
            fragmentShader: auroraFragmentShader,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: true,
            depthTest: false,
            //side: THREE.FrontSide
          } );



    geom = new THREE.TorusKnotGeometry( 1, 0.5, 100, 16 )
    geom = new THREE.SphereGeometry(1, 16, 8, 1, 2, 1, 1.2);
    geom = new THREE.TubeGeometry(spline, 20, 2, 8, false)
    geom = new THREE.ParametricGeometry(this._surfaceFunction, 64, 64)
/*

    const pts = [
      new THREE.Vector2(0,0),
      new THREE.Vector2(1,0),
      new THREE.Vector2(0.00001,0),
      //new THREE.Vector2(0,0.1),
      //new THREE.Vector2(1,0.1),
    ]
    var shape = new THREE.Shape( pts );
    geom = new THREE.ExtrudeGeometry( shape, {
          steps     : 200,
          bevelEnabled  : false,
          extrudePath   : spline
    } );

*/

    this.aurora = 
      //new THREE.Line(geom, material)
    new THREE.Mesh(geom, 
      //new THREE.MeshNormalMaterial({wireframe: false, side: THREE.FrontSide}))
      material)
    this.aurora.scale.x = 10

    this.add(this.aurora)

    this.ready = true

})
})

  }

  _createBuilding(geometry, material) {

        var building = new THREE.Group();
        var n = Math.random() * 7 + 3;
        for(var i = 0; i < n; i++){
          var cube = new THREE.Mesh(geometry, material);
          var ratio = (i + 1) / n;
          var s1 = Math.pow(ratio, 0.1);
          var s2 = Math.pow(ratio, 2);
          cube.scale.set(
            0.1 + Math.random() * BUILDING_SIZE * s2,
            0.1 + Math.random() * BUILDING_HEIGHT * s1 + 0.1,
            0.1 + Math.random() * BUILDING_SIZE * s2
          );
          cube.position.y = 0.5 * cube.scale.y;
          building.add(cube);

        }
        return building;
      }

  initBuildings() {



      var geometry = new THREE.BoxGeometry( 1, 1, 1 );
      var material = new THREE.MeshNormalMaterial();
      //new THREE.MeshLambertMaterial( { color: 0x808080 } );

      var nx = NUM_BUILDINGS;
      var n = nx * nx;


      const center = new THREE.Vector3(
        Math.floor(0.5 * nx) * BUILDING_SIZE,
        0,
        Math.floor(0.5 * nx) * BUILDING_SIZE
      )

      var group = new THREE.Group()
      group.position.copy( center.clone().negate())
      this.add(group);

      for(var i = 0; i < n; i++){
        var building = this._createBuilding(geometry, material)
        group.add(building);
        const x = (i % nx),
          z = Math.floor(i / nx)

        building.position.set(
          BUILDING_SIZE * x,
          0,
          BUILDING_SIZE * z
        );


        const windows = THREE.GeometryUtils.randomPointsInGeometry(geometry, random(5, 10))

        const dist = building.position.distanceTo(center) / center.length()

        building.scale.y = 0.5 + Math.pow(1-dist, 2) * BUILDING_HEIGHT
      }

  }


  initFloor() {

      const NUM_SEGMENTS = 20

      let mesh = null
      const create = (segments) => {
        var planeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                resolution: {
                    type: "v2",
                    value: new THREE.Vector2(window.innerWidth, window.innerHeight)
                },
                time: {
                    type: "f",
                    value: 0.1
                },
                speed: {
                    type: "f",
                    value: 1
                },
                height: {
                    type: "f",
                    value: 2
                },
                noise_elevation: {
                    type: "f",
                    value: 1.0
                },
            },
            transparent: true,
            fragmentShader: floorFragmentShader,
            vertexShader: floorVertexShader,
            wireframe: false,
            wireframeLinewidth: 2,
        });

        const s = NUM_BUILDINGS*BUILDING_SIZE

        const geometry = new THREE.PlaneBufferGeometry(s, s, NUM_SEGMENTS, NUM_SEGMENTS)
        
        const mesh = new THREE.Mesh(geometry, planeMaterial);

        mesh.rotation.set(-Math.PI * 0.5, 0, 0)
        mesh.position.y = -50//-window.innerHeight * 0.15

        this.add(mesh)
      }

      create(NUM_SEGMENTS)

      super.on('wireframe', d => mesh.material.wireframe = d)
      super.on('segments', d => {
          group.remove(mesh)
          create(d)
        })
/*
        this.scene.events.on(VIS +'::wireframe', d => mesh.material.wireframe = d)

        this.scene.events.on(VIS +'::segments', d => {
          group.remove(mesh)
          create(d)
        })
        */
    
  }

  update(dt) {

    if (!this.ready) return

  	this.tick += dt

  	if (this.aurora.material.uniforms) {
      this.aurora.material.uniforms.uTime.value = this.tick
      //this.aurora.material.uniforms.uFade.value = this.tick
    }


    if (this.floor) {
      this.floor.material.uniforms.time.value = t.time * 0.2
      this.floor.material.uniforms.speed.value = 1
      this.floor.material.uniforms.height.value = 1
    }
  }

}


const floorVertexShader = glslify(`
  #pragma glslify: pnoise3 = require(glsl-noise/periodic/3d)
  #pragma glslify: PI = require('glsl-pi')

  varying vec2 vUv;
  varying float vNoise;
varying float vY;

            // varying vec3  v_line_color;

            uniform float time;
            uniform float speed;
            uniform float height;
            //uniform float valley_elevation;
            uniform float noise_elevation;


            void main()
            {
                vUv = uv;
                // First perlin passes
                float displacement  =  pnoise3(.4 * position + vec3( 0, speed * time, 0 ), vec3( 100.0 ) ) * 1. * height;

                displacement       += pnoise3( 2. * position + vec3( 0, speed * time * 5., 0 ), vec3( 100. ) ) * .3 * height;
                //displacement       += pnoise3( 8. * position + vec3( 0, speed * time * 20., 0 ), vec3( 100. ) ) * .1 * height;

                float freq = 5.0;
                float distance = sqrt(((uv.x-0.5) * (uv.x-0.5)) + ((uv.y-0.5) * (uv.y-0.5)));
                float z = (height * sin(((time * 0.5 * speed) - (distance * freq)) * PI));


              // Sinus
                displacement = displacement + (sin(position.x / 2. - PI / 2.));

                vec3 newPosition = vec3(position.x,position.y, displacement+z);

                vNoise = displacement;
                vY = newPosition.z;
                //vNoise = sin(position.x / 2. - PI / 2.);
                //vec3 newPosition = position + normal * vec3(sin(time * 0.2) * 3.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
            }

`, { inline: true })

const floorFragmentShader = glslify(`
#pragma glslify: PI = require('glsl-pi')

varying vec2 vUv;
varying float vNoise;
varying float vY;
//varying float vNoise;
uniform float time;
uniform float speed;

        void main()
        {
            vec2 p = -1.0 + 2.0 *vUv;
            float alpha = sin(p.y * PI) / 2.;

            float time2 = time / (1. / speed) * 0.3;

            float r = .5 + sin(time2);
            float g = .5 + cos(time2);
            float b = 1. - sin(time2);

            vec3 color = vec3(r,g,b);
            //color *= vNoise;
            gl_FragColor = vec4(cos(vY * 2.0), vY * 3.0, 1.0, 1.0);

            //gl_FragColor = vec4(color, alpha);
        }

`, { inline: true })



const auroraVertexShader = glslify(`
      #include <common>

      varying vec2 vUv;

      uniform float uTime;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        vUv = uv;

        //vUv.x = 0.5 - cos( uTime + vUv.x ) * 0.5;
        //vUv.x = smoothstep( 0., 1., vUv.x );

        gl_Position = projectionMatrix * mvPosition;
      }
`, { inline: true })


const auroraFragmentShader = glslify(`

  #pragma glslify: cnoise2 = require('glsl-noise/classic/2d')

  uniform sampler2D textureAlpha;
  uniform sampler2D textureColor;
	uniform float uTime;
  uniform float uOffset;
  uniform float uFade;


    //uniform sampler2D textureColor;
    varying vec2 vUv;

    void main() {

        vec2 noise = vec2(cnoise2(vec2(vUv.x+uTime*0.2, vUv.y)), cnoise2(vec2(vUv.x, vUv.y+uTime*0.3)));

        vec4 texB = texture2D(textureColor, vUv);
        vec4 texC = texture2D(textureColor, (texB.rg*.021)+vec2(vUv.x*.4+uOffset,vUv.y));


        vec4 texA = texture2D( textureAlpha, vUv + noise + (.05-texC.rg*.1));

        vec3 color = texC.rgb;

        gl_FragColor = vec4(color, texA.a);
      }

`, { inline: true })
