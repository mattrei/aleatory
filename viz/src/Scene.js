global.THREE = require('three')
const Leap = require('leapjs')

const OrbitControls = require('three-orbit-controls')(THREE)
import Events from 'minivents'
const average = require('analyser-frequency-average')
const random = require('random-float')
const tweenr = require('tweenr')()
require('./utils/leap/THREE.LeapFlyControls')

class Scene {

  constructor(args) {
      this.fx = {
        active: false,
        bloom: {
           active: false,
           pass: null
        },
        fxaa: {
          active: false,
          pass: null
        },
        boxBlur: {
          active: false,
          pass: null
        },
        rgbsplit: {
          active: false,
          pass: null
        },
        vignette: {
          active: false,
          pass: null
        },
        pixelate: {
          active: false,
          pass: null
        },
        copy : {
          active: false,
          pass: null
        },
        blend : {
          active: false,
          pass: null
        },
        godray : {
          active: false,
          pass: null
        },
      }

      this._texts = {intro: 'intro!', outro: 'outro!'}
      this.vis = []

        this.demo = args.demo
        this.run = false
        this.events = new Events()

        this.analyser = args.analyser

        this._createAudioTexture()

        this.gui = args.gui
        this.renderer = args.renderer
        this.composer = args.composer
        this.loader = args.loader
        this.clock = args.clock

        this.video = args.video
        this.canvas = args.canvas
        this.textCanvas = args.textCanvas
        this.ctx = args.ctx

        this.addFX(this.gui)

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10000000)

        this.camera.position.z = -1

        this.camera.lookAt(new THREE.Vector3())
        

        
        //this.camera.position.set(0, 1, -3)
        
        this.orbitControls = new OrbitControls(this.camera)
        //this.camera.position.set(cam.x, cam.y, cam.z)

        const leap = new Leap.Controller()
        leap.connect()
        this.flyControls = new THREE.LeapFlyControls(this.camera, leap)
        this.flyControls.rollSpeed        = .0005;
        this.flyControls.lookSpeed        = .0018;
        this.flyControls.movementSpeed    = .00010;


        this.scene = new THREE.Scene()

        

        // shows elements in the scene
        args.events.on('on', _ => this.onVisOn(_))
        args.events.on('off', _ => this.onVisOff(_))
        args.events.on('vis', _ => this.onVisParameters(_))

        // adds fx to the scene
        args.events.on('fx', (data) => this.onFX(data))
        // update intro text
        args.events.on('intro', (data) => this.onIntro(data))
        // update outro text
        args.events.on('outro', (data) => this.onOutro(data))


        args.events.on('func', _ => this.onFunc(_))

        // requestAnimationFrame
        args.events.on('update', _ => this.update(_))

        this._addHelpers()
  }

  _addHelpers() {
    const cameraHelper = new THREE.CameraHelper( this.camera )
        this.scene.add( cameraHelper )
        const axisHelper = new THREE.AxisHelper( 1 );
        this.scene.add( axisHelper )
  }

  getTextCanvas() {
    return this.textCanvas.getContext('2d')
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

  addFX(gui) {

    const MultiPassBloomPass = require('@superguigui/wagner/src/passes/bloom/MultiPassBloomPass')
    const BoxBlurPass = require('@superguigui/wagner/src/passes/box-blur/BoxBlurPass')
    const FXAAPass = require('@superguigui/wagner/src/passes/fxaa/FXAAPass')
    const ZoomBlurPass = require('@superguigui/wagner/src/passes/zoom-blur/ZoomBlurPass')
    const RGBSplit = require('@superguigui/wagner/src/passes/rgbsplit/rgbsplit')
    const VignettePass = require('@superguigui/wagner/src/passes/vignette/VignettePass')
    const Pixelate = require('@superguigui/wagner/src/passes/pixelate/pixelate')
    const CopyPass = require('@superguigui/wagner/src/passes/copy/CopyPass')
    const BlendPass = require('@superguigui/wagner/src/passes/blend/BlendPass')
    const godRayMultipass = require('@superguigui/wagner/src/passes/godray/godraypass');

    let f = gui.addFolder('**=FX=**')
    f.add(this.fx, 'active')

    f.add(this.fx.bloom, 'active').name('Bloom')
    this.fx.bloom.pass = new MultiPassBloomPass({
      blurAmount: 2,
      applyZoomBlur: true
    })

    f.add(this.fx.fxaa, 'active').name('FXAA')
    this.fx.fxaa.pass = new FXAAPass()

    f.add(this.fx.boxBlur, 'active').name('BoxBlur')
    this.fx.boxBlur.pass = new BoxBlurPass(3, 3)

    f.add(this.fx.rgbsplit, 'active').name('RGBSplit')
    this.fx.rgbsplit.pass = new RGBSplit({})

    f.add(this.fx.vignette, 'active').name('Vignette')
    this.fx.vignette.pass = new VignettePass(2, 1)

    f.add(this.fx.pixelate, 'active').name('Pixelate')
    this.fx.pixelate.pass = new Pixelate()

    f.add(this.fx.copy, 'active').name('Copy')
    this.fx.copy.pass = new CopyPass()

    f.add(this.fx.blend, 'active').name('Blend')
    this.fx.blend.pass = new BlendPass()
  }

  getEvents() {
    return this.events
  }

  getScene() {
    return this.scene
  }

  getRenderer() {
    return this.renderer
  }

  update(delta)
  {

    if (!this.run) { return }

    // Iterate over all controllers and update if changed via OSC messages
    if (this.gui) {
        for (let i in this.gui.__controllers) {
            this.gui.__controllers[i].updateDisplay()
        }
    }

    // call tick for listeners
    this.events.emit('tick', delta)

    // tick this scene
    this.tick(delta)

    if (this.flyControls) {this.flyControls.update(delta)}

    if (this.fx.active) {
      this.composer.reset()
      this.composer.render(this.scene, this.camera)
      if (this.fx.bloom.active) this.composer.pass(this.fx.bloom.pass)
      if (this.fx.boxBlur.active) this.composer.pass(this.fx.boxBlur.pass)
      if (this.fx.fxaa.active) this.composer.pass(this.fx.fxaa.pass)
      if (this.fx.rgbsplit.active) this.composer.pass(this.fx.rgbsplit.pass)
      if (this.fx.vignette.active) this.composer.pass(this.fx.vignette.pass)
      if (this.fx.pixelate.active) this.composer.pass(this.fx.pixelate.pass)
      if (this.fx.copy.active) this.composer.pass(this.fx.copy.pass)
      if (this.fx.blend.active) this.composer.pass(this.fx.blend.pass)
      this.composer.toScreen()
    } else {
      this.renderer.render(this.scene, this.camera)
    }
  }

      onResize() {

        this.textCanvas.width = window.innerWidth
        this.textCanvas.height = window.innerHeight

        this.composer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        if (this.camera) {
          this.camera.aspect = window.innerWidth / window.innerHeight
          this.camera.updateProjectionMatrix()
        }
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

  onFX(v) {
      this.fx[v].active = !this.fx[v].active
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

  clearScene() {
    for( let i = this.scene.children.length - 1; i >= 0; i--) {
      this.scene.remove(this.scene.children[i])
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
//    this.startGUI(f)
//    f.open()
      this.renderer.autoClear = true
      this.run = true
    }

    stop() {
      this.renderer.autoClear = false
      this.run = false

      for (var i in this.gui.__controllers) {
        this.gui.__controllers[i].remove()
      }
    }

}

export default Scene
