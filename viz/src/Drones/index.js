import AScene from '../AScene'

import Headlines from './Headlines'
import Refugees from './Refugees'
import Mare from './Mare'


export
default class DronesScene extends AScene {
    constructor(renderer, loader, aaa, camera, args) {
        super(
            renderer,
            loader,
            aaa,
            camera,
            args, {
                g: new Globe('HEADLINES', {
                    data: headlines_data
                }, renderer, loader, aaa),
                r: new Refugees('REFUGEES', {
                    data: refugees_data
                }, renderer, loader, aaa, camera),
                m: new City('MARE', {
                    wireframe: true
                })
            })


        this.camera.position.z = -1
        this.camera.lookAt(new THREE.Vector3())

        this.setVis(this.vis.t)
    }

    background() {

    }

}