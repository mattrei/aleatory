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


      this.camera.position.z = -1
      this.camera.lookAt(new THREE.Vector3())

   		this.particles = new Particles('PARTICLES', {
          timeScale: 1
            }, this)
    	
    	
        this.street = new Street('STREET', {
  speed: 0.5,
  cars: true
}, this)
        
        

        this.city = new City('CITY', {
  wireframe: true
}, this)
        
        

        this.terrain = new Terrain('TERRAIN', {
  speed: 0.5,
  mountainHeight: 0.5,
  terrainHeight: 0.5,
  yDistortion: 0.5,
  xDistortion: 0.5
}, this)
        
        
    }

    init() {

      super.addGUIFolder(this.particles)
      super.addGUIFolder(this.street)
      super.addGUIFolder(this.terrain)

      super.addGUIFolder(this.city)
      super.add(this.city)
      super.addGUIProps(this.city)

    }

    update(delta) {
      if (!super.update(delta)) return



    	this.particles.update(delta)
        this.street.update(delta)
        this.city.update(delta)
        this.terrain.update(delta)
    }


    background() {

    }

}
