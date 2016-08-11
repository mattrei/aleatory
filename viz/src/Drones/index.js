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
                    sphere: 0,
                    flat: 1,
                    ring: false
                }, renderer, loader, aaa, camera),
                g: new Globe('GLOBE', {}, renderer, loader, aaa),
                c: new Globe('COUNTRIES', {}, renderer, loader, aaa),
            })

        this.loader = loader

        this.camera.position.z = 2
        this.camera.lookAt(new THREE.Vector3())

        super.setBackground('/dist/assets/Drones/milkyway_bg.jpg')

        this.setVis(this.vis.m)
    }
}