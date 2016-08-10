import AScene from '../AScene'

import Map from './Map'
import Globe from './Globe'

export
default class DronesScene extends AScene {
    constructor(renderer, loader, aaa, camera, args) {
        super(
            renderer,
            loader,
            aaa,
            camera,
            args, {
                m: new Map('MAP', {
                }, renderer, loader, aaa, camera),
                g: new Globe('GLOBE', {
                }, renderer, loader, aaa),
            })


        this.camera.position.z = -1
        this.camera.lookAt(new THREE.Vector3())

        this.setVis(this.vis.g)
    }

    background() {

    }

}