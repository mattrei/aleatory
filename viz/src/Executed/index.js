import AScene from '../AScene'

import Cage from './Cage'
import Scheduled from './Scheduled'

export
default class ExecutedScene extends AScene {
    constructor(renderer, isDemo, args) {
        super(
            renderer,
            new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10000000),
            isDemo,
            args)


      this.camera.position.z = -1
      this.camera.lookAt(new THREE.Vector3())

      const executedData = isDemo ? require('./test_data/executed.json') : null
      const scheduledData = isDemo ? require('./test_data/scheduled.json') : null

        this.cage = new Cage('CAGE', {
            cageSpeed: 1,
            pictures: false,
            data: executedData,
            cageOpen: false,
        }, this)

        this.scheduled = new Scheduled('SCHEDULED', {}, this)
        this.scheduled.setConf({
          doNext: this.scheduled.doNext,
          data: scheduledData
        })
    }

    init() {

      super.fullAdd(this.cage)
      super.halfAdd(this.scheduled)
    }

    update(delta) {
        if (!super.update(delta)) return

        this.cage.update(delta)
        this.scheduled.update(delta)
    }
}