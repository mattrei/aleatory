import AScene from '../AScene'

const tweenr = require('tweenr')()
const Tween = require('tween-chain')


import Headlines from './Headlines'
import Refugees from './Refugees'
import Mare from './Mare'


import headlines_data from './test_data/headlines.json'


export
default class RefugeesScene extends AScene {
    constructor(renderer, loader, aaa, camera, args) {
        super(
            renderer,
            loader,
            aaa,
            camera,
            args, {
                h: new Headlines('HEADLINES', {
                    data: headlines_data
                }, renderer, loader, aaa),
                r: new Refugees('REFUGEES', {
                    speed: 0.5,
                    cars: true
                }, renderer, loader, aaa, camera),
                m: new City('MARE', {
                    wireframe: true
                })
            })


        this.camera.position.z = -1
        this.camera.lookAt(new THREE.Vector3())

        this.setVis(this.vis.t)

        //this.fog = new THREE.FogExp2(0x000000, 0.15);

    }

    background() {

    }

}