import AScene from '../AScene'

const tweenr = require('tweenr')()
const Tween = require('tween-chain')


import Headlines from './Headlines'
import Refugees from './Refugees'
import Mare from './Mare'


import headlines_data from './test_data/headlines.json'
import refugees_data from './test_data/refugees.json'


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
                    data: headlines_data,
                    doNext: false,
                    doReset: false
                }, renderer, loader, aaa, camera),
                r: new Refugees('REFUGEES', {
                    data: refugees_data,
                    doNext: false,
                    doReset: false
                }, renderer, loader, aaa, camera),
                m: new Mare('MARE', {
                    wireframe: true
                }, renderer, loader, aaa, camera)
                
            })


        this.camera.position.z = -1
        this.camera.lookAt(new THREE.Vector3())

        this.setVis(this.vis.m)
    }

    background() {

    }

}