import AScene from '../AScene'

import Cage from './Cage'
import Scheduled from './Scheduled'

const executedData = require('./test_data/executed.json')
const scheduledData = require('./test_data/scheduled.json') 

console.log(Scheduled.doNext)

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
                    cageSpeed: 1,
                    pictures: false,
                    data: executedData,
                    cageOpen: false,
                }, renderer, loader, aaa, camera),
                s: new Scheduled('SCHEDULED', {
                    data: scheduledData
                }, renderer, loader, aaa, camera)
            })

        this.vis.s.addPar({doNext: this.vis.s.doNext})

        this.camera.position.z = -1
        this.camera.lookAt(new THREE.Vector3())



        this.setVis(this.vis.s)
    }

}