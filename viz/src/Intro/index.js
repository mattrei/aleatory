import Scene from '../Scene'

const tweenr = require('tweenr')()
const Tween = require('tween-chain')


import Street from './Street'
import City from './City'
import Particles from './Particles'
import terrain from './terrain'

class IntroScene extends Scene {
    constructor(args) {
      super(args)

   		this.particles = new Particles(this)
    	//this.scene.add(this.particles)
    	super.getEvents().on('PARTICLES::visOn', _ => super.fadeIn(this.particles, 2))
	    super.getEvents().on('PARTICLES::visOff', _ => super.fadeOut(this.particles, 2))
	    super.addVis('PARTICLES', this.particles.getConf())




        this.street = new Street(this)
        //this.scene.add(this.street)
        super.getEvents().on('STREET::visOn', _ => super.fadeIn(this.street, 2))
        super.getEvents().on('STREET::visOff', _ => super.fadeOut(this.street, 2))
        super.addVis('STREET', this.street.getConf())


        this.city = new City(this)
        this.scene.add(this.city)
        super.getEvents().on('CITY::visOn', _ => super.fadeIn(this.city, 5))
        super.getEvents().on('CITY::visOff', _ => super.fadeOut(this.city, 10))
        super.addVis('CITY', this.city.getConf())

    }

    tick(delta) {
    	//this.particles.update(delta)
        //this.street.update(delta)
        this.city.update(delta)
    }


}

export default IntroScene
