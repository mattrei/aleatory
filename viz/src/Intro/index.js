global.THREE = require('three')
import Scene from '../Scene'

const simplex = new (require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')
const clamp = require('clamp')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')

const smoothstep = require('smoothstep')


import street from './street'
import terrain from './terrain'
import Particles from './Particles'
import wombs from './wombs'

class IntroScene extends Scene {
    constructor(args) {
      super(args, new THREE.Vector3(0,0,10))

        //street(this, true)
        //terrain(this, false)
        //particles(this, true)
        //wombs(this, true)


   		this.particles = new Particles(this)
    	this.scene.add(this.particles)

    	super.getEvents().on('PARTICLES::visOn', _ => super.fadeIn(this.particles, 2))
	    super.getEvents().on('PARTICLES::visOff', _ => super.fadeOut(this.particles, 2))
	    super.addVis('PARTICLES', this.particles.getConf())


    }

    tick(delta) {
    	this.particles.update(delta)
    }


}

export
default IntroScene
