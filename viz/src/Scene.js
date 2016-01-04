global.THREE = require('three')
const OrbitControls = require('three-orbit-controls')(THREE)
import Events from 'minivents'


class Scene {

  constructor(args, show) {
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

      this.show = show


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

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 4000)
        this.camera.position.set(0, 0, 0)


        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.maxDistance = 300000;
        this.scene = new THREE.Scene()

        args.events.on('show', (data) => this.onShow(data))
        args.events.on('fx', (data) => this.onFX(data))
        args.events.on('update', (data) => this.update(data))
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



    let f = gui.addFolder('FX')
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

    onShow(v) {
      this.show[v] = !this.show[v]
    }

  onFX(v) {
      this.fx[v].active = !this.fx[v].active
    }

  play() {
    let f = this.gui.addFolder('Viz')
    let fs = f.addFolder('show')
    Object.keys(this.show).forEach(s => {
      fs.add(this.show, s)
    })
    fs.open()
    this.startGUI(f)
    f.open()
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
