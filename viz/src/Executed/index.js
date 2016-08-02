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
          cageSpeed: 1, 
          cageOpen: false
            }, this)
    	
    	
    }

    init() {
      super.addGUIFolder(this.cage)
    }

    update(delta) {
      if (!super.update(delta)) return

    	this.cage.update(delta)
    }
}
