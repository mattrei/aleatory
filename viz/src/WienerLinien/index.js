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
//import Jet from './Jet'
import Tunnel from './Tunnel'
import Topo from './Topo'
import Metro from './Metro'

export
default class WienerLinien extends AScene {
    constructor(renderer, loader, aaa, camera, args) {
        super(
            renderer,
            loader,
            aaa,
            camera,
            args, {
                s: new Stations('STATIONS', {
                    names: true
                }, renderer, loader, aaa, camera),
                /*j: new Jet('JET', {
                    speed: 0.5
                }, renderer, loader, aaa, camera),*/
                t: new Tunnel('TUNNEL', {
                    speed: 0.5
                }, renderer, loader, aaa, camera),
                n: new Topo('NETWORK', {
                }, renderer, loader, aaa, camera),
                m: new Topo('METRO', {
                }, renderer, loader, aaa, camera)
            })

        this.vis.m.addPar({})


        this.camera.position.z = -1
        this.camera.lookAt(new THREE.Vector3())

        this.setVis(this.vis.n)
    }

}