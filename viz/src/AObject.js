global.THREE = require('three')
import Events from 'minivents'

export default class AObject extends THREE.Object3D {

	constructor(name, conf, scene) {
		super()
		this.name = name
		this.conf = conf
		this.scene = scene


		this.on('visOn', _ => this.scene.fadeIn(this, 2))
	    this.on('visOff', _ => this.scene.fadeOut(this, 2))
	}
	
	on(confname, func) {
		this.scene.getEvents().on(this.name + '::' + confname, func)
	}

	getConf() {
		return this.conf
	}

	getName() {
		return this.name
	}

	update(delta) {
		return this.conf.on
	}
}