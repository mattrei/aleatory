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
                m: new Refugees('REFUGEES', {
                }, renderer, loader, aaa, camera),
                g: new Globe('MAP', {
                }, renderer, loader, aaa),
            })


        this.camera.position.z = -1
        this.camera.lookAt(new THREE.Vector3())

        this.setVis(this.vis.m)
    }

    background() {

    }

}