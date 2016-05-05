global.THREE = require('three')
import Scene from './Scene'

const glslify = require('glslify')

const random = require('random-float')
const randomInt = require('random-int')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const sineInOut = require('eases/sine-in-out')

const Boid = require('boid')


class Demo extends Scene {
  constructor(args)
  {
    super(args, new THREE.Vector3(0,0,45))

    this.background()
  }

  background()
  {

    	var l_fogColor = 0x220052; //bottom fog, sky and light color
    var m_fogColor = 0x996060; //middle fog and sky color
    var h_fogColor = 0x331E28; //top fog and sky color
    var mlt_Color = 0x221833; //light mix color

    /*
	l_fogColor = "hsl("+random(0, 360)+", 100%,32%)";
	m_fogColor = "hsl("+random(0, 360)+", 37%, 60%)";
	h_fogColor = "hsl("+random(0, 360)+", 41%, 20%)";
	mlt_Color  = "hsl("+random(0, 360)+", 50%,20%)";
    */

      let skyGeo = new THREE.SphereGeometry( 750, 32, 15 );
      let skyMat = new THREE.ShaderMaterial( { vertexShader: glslify('./glsl/Ocean/Sky.vert'),
                                              fragmentShader: glslify('./glsl/Ocean/Sky.frag'),
                                              side: THREE.BackSide,
                                              uniforms: {
        topColor: 	 { type: "c", value: new THREE.Color(h_fogColor) },
        middleColor: { type: "c", value: new THREE.Color(m_fogColor) },
        bottomColor: { type: "c", value: new THREE.Color(l_fogColor) },
        offset:		 { type: "f", value: 0 },
        exponent:	 { type: "f", value: 0.8 }
      },

                                             } );

      const sky = new THREE.Mesh( skyGeo, skyMat );
      this.scene.add( sky );


  }

  tick(time, delta) {
  }
}

export default Demo
