require('babel-polyfill')
global.THREE = require('three')

const domready = require('domready')

const WAGNER = require('@superguigui/wagner')

const average = require('analyser-frequency-average')
const audioAnalyser = require('web-audio-analyser')
const glAudioAnalyser = require('gl-audio-analyser')

//import OSC from 'osc/dist/osc-browser'
const OSC = null
import Events from 'minivents'
import Stats from 'stats-js'
import dat from 'dat-gui'

// 6 scenes
import IntroScene from './Intro'
//import ExecutedScene from './Executed'
//import RefugeesScene from './RefugeesScene'
//import DronesScene from './Drones'
//import WienerLinienScene from './WienerLinien'
//import OceanScene from './OceanScene'
//import OutroScene from './Outro'
// 7scene ThisbeautifulWorld

// TODO: use rhizome?
const OSC_URL = "ws://localhost:8081"

const DEMO_MODE = true
const DEF_SCENE = "executed"

export default class Main extends THREE.WebGLRenderer {

  constructor() {
    super({
      alpha: true,
      antialias: true,
      clearColor: 0,
      clearAlpha: 1,
      sortObject: false,
      autoClear: true
    })

    this.setClearColor(this.color, 1)
    this.autoClearColor = true
    this.shadowMap.enabled = true
    this.gammaInput = true
    this.gammaOutput = true
    document.body.appendChild(this.domElement)


  this.stats = new Stats()
    this.stats.domElement.style.position = 'absolute'
    document.body.appendChild(this.stats.domElement)
    this.gui = new dat.GUI()
    this.events = new Events()

    this.currentScene = null

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

      this.addFX()

    
    // adds fx to the scene
    this.events.on('fx', (data) => this.onFX(data))
    this.events.on('scene', (s) => this.setScene(s))

            // shows elements in the scene
    this.events.on('on', _ => this.currentScene.onVisOn(_))
    this.events.on('off', _ => this.currentScene.onVisOff(_))
    this.events.on('vis', _ => this.currentScene.onVisParameters(_))

    this.events.on('intro', (data) => this.currentScene.onIntro(data))
    this.events.on('outro', (data) => this.currentScene.onOutro(data))
    this.events.on('func', _ => this.currentScene.onFunc(_))
    

    this.analyser = null
    this.video = null

    

    this.clock = new THREE.Clock()
    this.clock.start()
    const manager = new THREE.LoadingManager()
    this.loader = new THREE.TextureLoader(manager)

    if (OSC) this.oscPort = new OSC.WebSocketPort({url: OSC_URL})
    

    this.composer = new WAGNER.Composer(this)
    this.canvas = document.createElement('canvas');
    this.canvas.id = "drawingCanvas"
    this.ctx = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas)

    
  }

  addFX() {

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

    let f = this.gui.addFolder('**=FX=**')
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

    onFX(v) {
      this.fx[v].active = !this.fx[v].active
    }



  onResize() {
    this.composer.setSize(window.innerWidth, window.innerHeight)
    this.setSize(window.innerWidth, window.innerHeight)
    const camera = this.currentScene.getCamera()
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
    }
  }

  setScene(scene) {
    for (var i in this.gui.__controllers) {
      this.gui.__controllers[i].remove()
    }

    this.currentScene = this.scenes[scene]

    if (this.currentScene) this.currentScene.play()
  }

  _initOSC() {
    this.oscPort.on("message", (oscMsg) => {
      if (oscMsg.address === '/scene') {
        let n = oscMsg.args[0]
        console.log("Scene change. " + n)
        this.events.emit("scene", n)
      }
      if (oscMsg.address === '/on') {
        let n = oscMsg.args[0]
        console.log("Show " + n)
        this.events.emit("on", n)
      }
      if (oscMsg.address === '/off') {
        let n = oscMsg.args[0]
        console.log("Hide " + n)
        this.events.emit("off", n)
      }

      if (oscMsg.address === '/vis') {
        let name = oscMsg.args[0],
          prop = oscMsg.args[1],
          val = JSON.parse(oscMsg.args[2])

        this.events.emit("vis", {
          [name]: {
            [prop]: val
          }
        })
      }

      if (oscMsg.address === '/fx') {
        let n = oscMsg.args[0]
        console.log("FX " + n)
        this.events.emit("fx", n)
      }


      if (oscMsg.address === '/intro') {
        let text = oscMsg.args[0]
        console.log("Intro " + text)
      }
      if (oscMsg.address === '/outro') {
        let text = oscMsg.args[0]
        console.log("Outro " + text)
      }
    })
    this.oscPort.open()
  }

  init() {

    if (this.oscPort) this._initOSC()


    navigator.webkitGetUserMedia({
      audio: true,
      video: true
    }, stream => {
      
      this.analyser = audioAnalyser(stream, {
          stereo: false,
          audible: false
        })

      const args = {

        demo: true,

        renderer: this,
        composer: this.composer,
        gui: this.gui,
        clock: this.clock,
        loader: this.loader,
        analyser: this.analyser,
        // webcam video
        video: this.video,

        // for drawing purposes
        canvas: this.canvas,
        ctx: this.ctx
      }


      this.scenes = {}
      this.scenes.intro = new IntroScene(this, DEMO_MODE, args)
      this.scenes.executed = new ExecutedScene(this, DEMO_MODE, args)
      //this.scenes.s1 = new WienerLinienScene(args)

      
      //this.scenes.s1 = new RefugeesScene(args)

      //this.scenes.s1 = new DronesScene(args)

      //this.scenes.s1 = new OceanScene(args)
      //this.scenes.s1 = new OutroScene(args)

      this.setScene(DEF_SCENE)

      window.addEventListener('resize', () => this.onResize(), false)
      this.onResize()
      this.update()



    }, err => console.log(err))



  }

  update() {
    this.stats.begin()

    const delta = this.clock.getDelta()

    const scene = this.currentScene
    if (!scene) return


    const camera = scene.getCamera()

    scene.update(delta)

    if (this.fx.active) {
      this.composer.reset()
      this.composer.render(scene, camera)
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
      this.render(scene, camera)
    }


    this.stats.end()
    requestAnimationFrame(this.update.bind(this))
  }
}



//import Test from './Test_Particles'
domready(() => {

  const main = new Main()
  main.init()

  //let demo = new Test()
})
