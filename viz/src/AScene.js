global.THREE = require('three')
import Events from 'minivents'

const Leap = require('leapjs')

const OrbitControls = require('three-orbit-controls')(THREE)

const random = require('random-float')
const tweenr = require('tweenr')()
require('./utils/leap/THREE.LeapFlyControls')

import AObject from './AObject'


export
default class AScene extends THREE.Scene {

    constructor(renderer, loader, aaa, camera, args, vis) {
        super()
        this.isStopped = false
        this.vis = vis
        Object.keys(vis).forEach(v => {
          vis[v].getEvents().on('fog', (f) => this.setFog(f))
        })

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this._texts = {
            intro: 'intro!',
            outro: 'outro!'
        }


        this.events = new Events()

        this.gui = args.gui

        this.loader = args.loader
        this.clock = args.clock

        this.video = args.video
        this.canvas = args.canvas
        this.ctx = args.ctx

        this.orbitControls = new OrbitControls(this.camera)

        const leap = new Leap.Controller()
        leap.connect()
        this.flyControls = new THREE.LeapFlyControls(this.camera, leap)
        this.flyControls.rollSpeed = .0005;
        this.flyControls.lookSpeed = .0018;
        this.flyControls.movementSpeed = .00010;

        this._addHelpers()
    }

    setFog(fog) {
      this.fog = fog
    }

    _addHelpers() {
        const cameraHelper = new THREE.CameraHelper(this.camera)
        this.add(cameraHelper)
        const axisHelper = new THREE.AxisHelper(1);
        this.add(axisHelper)
    }

    getCamera() {
        return this.camera
    }

    removeGUI(aobject) {
        this.gui.removeFolder(aobject.getName())
    }

    addGUI(aobject) {

        const name = aobject.getName(),
            conf = aobject.getConf()

        const onPar = {
            on: false
        }

        const vf = this.gui.addFolder(name)
        Object.keys(conf).forEach(c => {

            if (c === 'data') return

            let vfp = vf.add(conf, c)

            vfp.onChange(val => {
                const prop = vfp.property
                this.currentVis.propChanged(prop, val)
            })
        })

        vf.open()
    }


    getEvents() {
        return this.events
    }

    update(delta) {

        if (this.isStopped) return 

        if (this.currentVis) {
            this.currentVis.update(delta)
        }

        // Iterate over all controllers and update if changed via OSC messages
        if (this.gui) {
            for (let i in this.gui.__controllers) {
                this.gui.__controllers[i].updateDisplay()
            }
        }

        if (this.flyControls) this.flyControls.update(delta)

        return true
    }


    onIntro(text) {
        this.intro(text)
    }
    _doIntro() {
        this.intro(this._texts.intro)
    }
    onOutro(text) {
        this.outro(text)
    }
    _doOutro() {
        this.outro(this._texts.outro)
    }

    clear() {
        for (let i = this.children.length - 1; i >= 0; i--) {
            this.remove(this.children[i])
        }
    }

    setVisPar(conf) {
        this.currentVis.setConf(conf)
    }

    setVis(v) {
        if (this.currentVis) {
            this.currentVis.stop()
            this.removeGUI(this.currentVis)
        }
        if (v) {
            this.currentVis = v
        }
    }

    clearVis() {
        this.currentVis.stop()
        this.removeGUI(this.currentVis)
        this.currentVis = null
    }

    start() {

        this.addGUI(this.currentVis)
        this.add(this.currentVis)
        this.currentVis.start()
        this.isStopped = false

        let ft = this.gui.addFolder('**=text=**')
        ft.add(this._texts, 'intro')
        ft.add(this, '_doIntro')
        ft.add(this._texts, 'outro')
        ft.add(this, '_doOutro')
        ft.open()
    }

    stop() {
        this.clearVis()
        this.clear()
        this.isStopped = true
    }

    keyPressed(key, isShift) {

        const v = this.vis[key]
        if (v === this.currentVis) {
            this.clearVis()
        } else if (v) {
            this.setVis(v)
            this.start()
        } else if (this.currentVis) {
          this.currentVis.keyPressed(key, isShift)
        }
    }


    setBackground(imgPath) {

        const skyVertex = `
      varying vec2 vUV;

      void main() {
        vUV = uv;
        vec4 pos = vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * pos;
      }
      `

        const skyFragment = `
      uniform sampler2D texture;
      varying vec2 vUV;

      void main() {
        vec4 sample = texture2D(texture, vUV);
        gl_FragColor = vec4(sample.xyz, sample.w);
      }
      `


        var geometry = new THREE.SphereGeometry(3000, 60, 40);
        var material = new THREE.ShaderMaterial({
            uniforms: {
                texture: {
                    value: this.loader.load(imgPath)
                }
            },
            vertexShader: skyVertex,
            fragmentShader: skyFragment
        });

        const skyBox = new THREE.Mesh(geometry, material);
        skyBox.scale.set(-1, 1, 1);
        skyBox.rotation.order = 'XZY';
        skyBox.renderOrder = 1000.0;
        skyBox.rotation.y = Math.PI * -0.5
        this.add(skyBox)
    }
}