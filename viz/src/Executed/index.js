import AScene from '../AScene'

import Cage from './Cage'
import Scheduled from './Scheduled'

const executedData = require('./test_data/executed.json')
const scheduledData = require('./test_data/scheduled.json')

export
default class ExecutedScene extends AScene {
    constructor(renderer, loader, aaa, camera, args) {
        super(
            renderer,
            loader,
            aaa,
            camera,
            args, {
                c: new Cage('CAGE', {
                    data: executedData,
                    cage: false,
                    executed: false,
                    currentOn: false,
                    cageOpen: false,
                    doNext: false,
                    doSmash: false,
                }, renderer, loader, aaa, camera),
                s: new Scheduled('SCHEDULED', {
                    data: scheduledData,
                    doNext: false
                }, renderer, loader, aaa, camera)
            })

        this.camera.position.z = -1
        this.camera.lookAt(new THREE.Vector3())



        this.setVis(this.vis.c)
    }

}