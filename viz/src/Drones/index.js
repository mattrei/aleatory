import AScene from '../AScene'

import Map from './Map'
import Globe from './Globe'
import Weapons from './Weapons'

export
default class DronesScene extends AScene {
    constructor(renderer, loader, aaa, camera, args) {
        super(
            renderer,
            loader,
            aaa,
            camera,
            args, {
                /*
                m: new Map('MAP', {
                    sphere: 0,
                    flat: 1,
                    ring: false
                }, renderer, loader, aaa, camera),
*/
                g: new Globe('GLOBE', {
                    showRndLoc: false,
                    explodeRndLoc: false,
                    explodeNextLoc: false
                }, renderer, loader, aaa, camera),
                w: new Weapons('WEAPONS', {
                    audio: false,
                    color: true,
                    showSold: false,
                    showBought: false
                }, renderer, loader, aaa, camera),
            })

        this.loader = loader

        this.camera.position.z = 2
        this.camera.lookAt(new THREE.Vector3())
        
        this.setVis(this.vis.g)

        super.setBackground('/dist/assets/Drones/milkyway_bg.jpg')

    }
}