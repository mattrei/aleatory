global.THREE = require('three')
import Events from 'minivents'

export default class AObject extends THREE.Object3D {

	constructor(name, conf, scene) {
		super()
		this.events = new Events()
		this.name = name
		this.conf = conf
		this.scene = scene
		this.isStopped = true

		this.on('visOn', _ => {
			this.isStopped = false
			this.scene.fadeIn(this, 2)
		})
	    this.on('visOff', _ => {
	    	this.isStopped = true
	    	this.scene.fadeOut(this, 2)
	    })
	}
	
	on(confname, func) {
		this.scene.getEvents().on(this.name + '::' + confname, func)
	}

	tick(func) {
		this.events.on('tick', func)
	}

	getConf() {
		return this.conf
	}

	getName() {
		return this.name
	}

	update(delta) {

		if (!this.isStopped) this.events.emit('tick', delta)
		return !this.isStopped
	}
}