global.THREE = require('three')
const OrbitControls = require('three-orbit-controls')(THREE)
import Events from 'minivents'
const average = require('analyser-frequency-average')
const random = require('random-float')

class Scene {

  constructor(args, cam) {
      this.fx = {
        active: true,
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
        }

      }

      this._texts = {intro: 'intro!', outro: 'outro!'}
      this.vis = []

        this.run = false
        this.events = new Events()
        this.analyser = args.analyser
        this.gui = args.gui
        this.renderer = args.renderer
        this.composer = args.composer
        this.loader = args.loader
        this.clock = args.clock
        this.canvas = args.canvas
        this.ctx = args.ctx

        this.addFX(this.gui)

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100000)

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.maxDistance = 300000;
        this.camera.position.set(cam.x, cam.y, cam.z)


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
    this.fx.rgbsplit.pass = new RGBSplit()

    f.add(this.fx.vignette, 'active').name('Vignette')
    this.fx.vignette.pass = new VignettePass(2, 1)

    f.add(this.fx.pixelate, 'active').name('Pixelate')
    this.fx.pixelate.pass = new Pixelate()

    f.add(this.fx.copy, 'active').name('Copy')
    this.fx.copy.pass = new CopyPass()
  }

  update(t)
  {

    if (!this.run) { return }

    // Iterate over all controllers and update if changed via OSC messages
    if (this.gui) {
        for (let i in this.gui.__controllers) {
            this.gui.__controllers[i].updateDisplay()
        }
    }

    // call tick for listeners
    this.events.emit('tick', t)

    // tick this scene
    this.tick(t.time, t.delta)

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
      this.composer.toScreen()
    } else {
      this.renderer.render(this.scene, this.camera)
    }
  }

      onResize() {
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

  getFreq(min, max) {
    if (!this.analyser) return random(min,max)

    return average(this.analyser.analyser, this.analyser.frequencies(), min, max)
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
