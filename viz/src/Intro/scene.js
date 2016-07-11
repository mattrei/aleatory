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
import particles from './particles'

class IntroScene extends Scene {
    constructor(args) {
      super(args, new THREE.Vector3(0,0,10))

        //street(this, true)
        //terrain(this, false)
        particles(this, true)
    }

    tick(time, delta) {
    }
}

export
default IntroScene
