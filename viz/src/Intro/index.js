import AScene from '../AScene'

const tweenr = require('tweenr')()
const Tween = require('tween-chain')


import Street from './Street'
import City from './City'
import Particles from './Particles'
import Terrain from './Terrain'

export
default class IntroScene extends AScene {
    constructor(renderer, loader, aaa, camera, isDemo, args) {
        super(
            renderer,
            loader,
            aaa,
            camera,
            isDemo,
            args, {
                p: new Particles('PARTICLES', {
                    timeScale: 1
                }, renderer, loader, aaa),
                s: new Street('STREET', {
                    speed: 0.5,
                    cars: true
                }, renderer, loader, aaa, camera),
                c: new City('CITY', {
                    wireframe: true
                }),
                t: new Terrain('TERRAIN', {
                    speed: 0.5,
                    mountainHeight: 0.5,
                    terrainHeight: 0.5,
                    yDistortion: 0.5,
                    xDistortion: 0.5
                }, renderer, loader, aaa, camera)
            },
            't')


        this.camera.position.z = -1
        this.camera.lookAt(new THREE.Vector3())

        //this.fog = new THREE.FogExp2(0x000000, 0.15);

    }

    background() {

    }

}