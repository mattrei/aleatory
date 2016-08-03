import AScene from '../AScene'

require('../utils/THREE.MeshLine')


// https://www.youtube.com/watch?v=16oLi1kvLHs
// https://github.com/Makio64/treeline_casestudy/blob/49e10162578d63c3be1107e58f032dece01fafdd/src/coffee/tree_p/Branch.coffee

/*
add map as surface
https://github.com/geommills/esrileaflet3JS/blob/master/scripts/client/src/terrain.js
*/


// TODO
// http://makiopolis.com/


import Stations from './Stations'
import Jet from './Jet'
import Tunnel from './Tunnel'
import Metros from './Metros'

export default class WienerLinien extends AScene {
   constructor(renderer, loader, aaa, camera, args) {
        super(
            renderer,
            loader,
            aaa,
            camera,
            args, {
                s: new Stations('STATIONS', {
                    timeScale: 1
                }, renderer, loader, aaa),
                j: new Jet('JET', {
                    speed: 0.5,
                    cars: true
                }, renderer, loader, aaa, camera),
                t: new Tunnel('TUNNEL', {
                    wireframe: true
                }),
                m: new Metros('METROS', {
                    speed: 0.5,
                    mountainHeight: 0.5,
                    terrainHeight: 0.5,
                    yDistortion: 0.5,
                    xDistortion: 0.5
                }, renderer, loader, aaa, camera)
            })


        this.camera.position.z = -1
        this.camera.lookAt(new THREE.Vector3())

        this.setVis(this.vis.s)


}

export default WienerLinien
