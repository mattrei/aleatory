global.THREE = require('three')
import Events from 'minivents'

export
default class AObject extends THREE.Object3D {

    constructor(name, conf) {
        super()
        this.events = new Events()
        this.name = name
        this.conf = conf
        this.isStopped = true
    }

    on(prop, func) {
        this.events.on(prop, func)
    }

    setConf(conf) {
        this.conf = conf
        Object.keys(conf).forEach(prop => {
            this.events.emit(prop, conf[prop])
        })
    }

    tick(func) {
        this.events.on('tick', func)
    }

    getConf() {
        return this.conf
    }

    setConf(conf) {
        this.conf = conf
    }

    getName() {
        return this.name
    }

    start() {
        this.isStopped = false
        this.visible = true
        /*
	    this.traverse(n => {
	      if (n.material) {
	        n.material.opacity = 0
	        tweenr.to(n.material, {opacity: 1, duration: duration})
	      }
	    })
	    */
    }

    stop() {
        this.isStopped = true
        /*
    this.traverse(n => {
      if (n.material) {
        tweenr.to(n.material, {opacity: 0, duration: 2})
          .on('complete', () => {*/
        this.visible = false

        /*
          })
      }
    })
    */
    }

    update(delta) {

        if (!this.isStopped) this.events.emit('tick', delta)
        return !this.isStopped
    }

    propChanged(prop, value) {
        this.conf[prop] = value
        this.events.emit(prop, value)
    }

    keyPressed(key) {
        Object.keys(this.conf).forEach((prop, i) => {
            const nr = Number.parseInt(key)
            if (nr == i + 1) {
                console.log("Emitting " + prop)

                let val = this.conf[prop]
                console.log(typeof(val))
                if (typeof(val) === 'boolean') {
                    val = !val
                } else if (typeof(val) === 'number') {
                    val += 0.1
                }

                this.propChanged(prop, val)
            }
        })
    }
}