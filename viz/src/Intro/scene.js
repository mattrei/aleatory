global.THREE = require('three')
import Scene from '../Scene'

const simplex = new (require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')
const clamp = require('clamp')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')
const GeometryUtils = require('../utils/GeometryUtils')
const TextGeometry = require('../geometries/TextGeometry')(THREE)
const FontUtils = require('../utils/FontUtils')
require('../utils/THREE.MeshLine')

const smoothstep = require('smoothstep')

const PARTICLES_AMOUNT = 300000

const FLY_CURVE = 20
const MAX_POINTS = 500
const TRIANGLE_GAP = 500
const NUM_RIBBONS = 25
const RIBBON_LENGTH = 50
const RIBBON_GAP = 100
const RIBBON_START = NUM_RIBBONS * RIBBON_GAP * -1
const STREET_LENGTH = (RIBBON_LENGTH + RIBBON_GAP) * NUM_RIBBONS
const STREET_WIDTH = 50
const PLANE_SIZE = {X: window.innerWidth * 2, Z: STREET_LENGTH}

import terrain from './terrain'

class IntroScene extends Scene {
    constructor(args) {
      super(args, new THREE.Vector3(0,0,50))

        //this.scene.fog = new THREE.FogExp2( 0x000000, 0.0009 );


        terrain(this, true)
/*
        this.createText()
        //this.background()
        this.street()
        this.buildings()
        this.cars()
        this.createParticles()
        this.floor()
        this.visparticles()
        this.city()
        */

//        this.xtion()

        //this.createTriangles()
        //this.createFlyingLine()
    }

    tick(time, delta) {
    }
}

export
default IntroScene
