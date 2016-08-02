global.THREE = require('three')
import Events from 'minivents'

const Leap = require('leapjs')

const OrbitControls = require('three-orbit-controls')(THREE)

const average = require('analyser-frequency-average')
const random = require('random-float')
const tweenr = require('tweenr')()
require('./utils/leap/THREE.LeapFlyControls')

import AObject from './AObject'


export default class AScene extends THREE.Scene {

  constructor(renderer, camera, isDemo, args) {
    super()

      this.renderer = renderer
      this.camera = camera


      this._texts = {intro: 'intro!', outro: 'outro!'}
      this.vis = []

        this.demo = isDemo
        this.events = new Events()

        this.analyser = args.analyser

        this._createAudioTexture()

        this.gui = args.gui

        this.loader = args.loader
        this.clock = args.clock

        this.video = args.video
        this.canvas = args.canvas
        this.ctx = args.ctx

        this.camera.position.z = -1
        this.camera.lookAt(new THREE.Vector3())
        this.orbitControls = new OrbitControls(this.camera)

        const leap = new Leap.Controller()
        leap.connect()
        this.flyControls = new THREE.LeapFlyControls(this.camera, leap)
        this.flyControls.rollSpeed        = .0005;
        this.flyControls.lookSpeed        = .0018;
        this.flyControls.movementSpeed    = .00010;

        this._addHelpers()
  }

  _addHelpers() {
    const cameraHelper = new THREE.CameraHelper( this.camera )
        this.add( cameraHelper )
        const axisHelper = new THREE.AxisHelper( 1 );
        this.add( axisHelper )
  }

  getRenderer() {
    return this.renderer
  }

  getCamera() {
    return this.camera
  }

  getLoader() {
    return this.loader
  }

  demo() {
    return this.demo
  }

  addVisOn(VIS, f) {
    this.events.on(VIS+'::visOn', f)
  }

  addVisOff(VIS, f) {
    this.events.on(VIS+'::visOff', f)
  }

  add(aobject) {
    super.add(aobject)

    if (aobject instanceof AObject) this.addVis(aobject.getName(), aobject.getConf())
  }

  addVis(name, parameters) {

    this.vis.push({name: parameters})

    let vf = this.gui.addFolder(name)
      Object.keys(parameters).forEach(p => {

        //if (p !== 'data') {
          // ignore the data parameter
          // because its no use for dat-gui

          if (p === 'on' && parameters[p]) {
              this.onVisOn(name)
          }

          let vfp = vf.add(parameters, p)


            vfp.onChange(val => {
              if (vfp.property === 'on') {
                  if (val) {
                    this.onVisOn(name)
                  } else {
                    this.onVisOff(name)
                  }
              } else {
                let prop = vfp.property
                this.onVisParameters({[name]:{[prop]:val}})
              }
            })

        //}
      })

    vf.open()
  }


  getEvents() {
    return this.events
  }

  update(delta)
  {

    // Iterate over all controllers and update if changed via OSC messages
    if (this.gui) {
        for (let i in this.gui.__controllers) {
            this.gui.__controllers[i].updateDisplay()
        }
    }

    if (this.flyControls) {this.flyControls.update(delta)}
  }

  onVisParameters(dict) {
    // emits 'VIS::parameters' events
    Object.keys(dict).forEach(d => {

      Object.keys(dict[d]).forEach(d2 => {

        // we emit the name of the vis and its properties
        this.events.emit(d + '::' + d2, dict[d][d2])
      })
    })
  }

  onVisOn(v) {
      this.events.emit(v+'::visOn')
    }

  onVisOff(v) {
      this.events.emit(v+'::visOff')
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
    for( let i = this.children.length - 1; i >= 0; i--) {
      this.remove(this.children[i])
    }
  }

  _createAudioTexture() {
    let size = 12;
    this.audioData = new Float32Array(size * size *3);
    this.volume = 1;

    for (let i = 0,  l = this.audioData.length; i < l; i += 3) {
        this.audioData[i] =0.0;
        this.audioData[i+1] =0.0;
        this.audioData[i+2] =0.0;
    }
    this.textureAudio = new THREE.DataTexture(this.audioData, size, size, THREE.RGBFormat, THREE.FloatType);
    this.textureAudio.minFilter = this.textureAudio.maxFilter = THREE.NearestFilter;
  }

  getFreq(min, max) {
    if (!this.analyser) return random(min,max)

    return average(this.analyser.analyser, this.analyser.frequencies(), min, max)
  }

  getAnalyser() {
    return this.analyser
  }

  getAudioTexture() {

    const freq = this.analyser.frequencies();
    let _acuteAverage = 0;
    let _volume = 0;
    for (let i = 0; i < freq.length; i++) {
        this.audioData[i] = freq[i]/256.;
        _volume += freq[i]/256.
        if(i> 174 - 5) {
           _acuteAverage += freq[i]/256.;
        }
    }
    this.volume = _volume/freq.length;

    this.textureAudio.needsUpdate = true
    return this.textureAudio
  }

  getVolume() {
    return this.volume
  }

  fadeIn(group, duration) {
    group.visible = true
    group.traverse(n => {
      if (n.material) {
        n.material.opacity = 0
        tweenr.to(n.material, {opacity: 1, duration: duration})
      }
    })
  }

  fadeOut(group, duration) {
    group.traverse(n => {
      if (n.material) {
        tweenr.to(n.material, {opacity: 0, duration: 2})
          .on('complete', () => group.visible = false)
      }
    })
  }

  play() {

    let ft = this.gui.addFolder('**=text=**')
    ft.add(this._texts, 'intro')
    ft.add(this, '_doIntro')
    ft.add(this._texts, 'outro')
    ft.add(this, '_doOutro')
    ft.open()
  }

}
