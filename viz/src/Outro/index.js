global.THREE = require('three')
import AScene from '../AScene'

import Soundscape from './Soundscape'
import Soundwave from './Soundwave'
import Applaus from './Applaus'


//https://github.com/crma16/sound-experiments/blob/master/src/layouts/webgl-background/objects/Wave.js
export
default class OutroScene extends AScene {
    constructor(renderer, loader, aaa, camera, args) {
        super(
            renderer,
            loader,
            aaa,
            camera,
            args, {
                s: new Soundscape('SOUNDSCAPE', {
                    
                }, renderer, loader, aaa, camera),
                /*
                w: new Soundwave('WAVE', {
                    speed: 0.5,
                    cars: true
                }, renderer, loader, aaa, camera),
                */
                a: new Applaus('APPLAUS', {
                    
                }, renderer, loader, aaa, camera)
            })


        this.camera.position.z = -1
        this.camera.lookAt(new THREE.Vector3())

        this.setVis(this.vis.a)

        //this.fog = new THREE.FogExp2(0x000000, 0.15);

    }

}