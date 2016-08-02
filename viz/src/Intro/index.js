import AScene from '../AScene'

const tweenr = require('tweenr')()
const Tween = require('tween-chain')


import Street from './Street'
import City from './City'
import Particles from './Particles'
import Terrain from './Terrain'

export default class IntroScene extends AScene {
    constructor(renderer, isDemo, args) {
      super(
        renderer, 
        new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10000000), 
        isDemo, 
        args)


   		this.particles = new Particles('PARTICLES', {
          on: true,
          timeScale: 1
            }, this)
    	this.add(this.particles)
    	
        this.street = new Street('STREET', {
  on: false,
  speed: 0.5,
  cars: true
}, this)
        this.add(this.street)
        

        this.city = new City('CITY', {
  on:true,
  wireframe: true
}, this)
        this.add(this.city)
        

        this.terrain = new Terrain('TERRAIN', {
  on: false,
  speed: 0.5,
  mountainHeight: 0.5,
  terrainHeight: 0.5,
  yDistortion: 0.5,
  xDistortion: 0.5
}, this)
        this.add(this.terrain)
        
    }

    update(delta) {
        super.update(delta)
    	//this.particles.update(delta)
        //this.street.update(delta)
        this.city.update(delta)
        //this.terrain.update(delta)
    }


}
