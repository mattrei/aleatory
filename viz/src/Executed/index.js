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


        this.cage = new Cage('CAGE', {
            cageSpeed: 1,
            cageOpen: false
        }, this)

        this.scheduled = new Scheduled('SCHEDULED', {}, this)
        this.scheduled.setConf({doNext: this.scheduled.doNext})
    }

    init() {
        super.addGUIFolder(this.cage)
        super.addGUIFolder(this.scheduled)
        super.add(this.scheduled)
        super.addGUIProps(this.scheduled)
    }

    update(delta) {
        if (!super.update(delta)) return

        this.cage.update(delta)
        this.scheduled.update(delta)
    }
}