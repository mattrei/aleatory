import AScene from '../AScene'

import Cage from './Cage'

export default class ExecutedScene extends AScene {
    constructor(renderer, isDemo, args) {
      super(
        renderer, 
        new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10000000), 
        isDemo, 
        args)


   		this.cage = new Cage('CAGE', {
          on: false
            }, this)
    	this.addGUIFolder(this.cage)
    	
    }

    update(delta) {
      super.update(delta)
    	this.cage.update(delta)
    }


}
