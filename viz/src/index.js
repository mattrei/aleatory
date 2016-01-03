global.THREE = require('three')

const domready = require('domready')
const createLoop = require('canvas-loop')

const WAGNER = require('@superguigui/wagner')

const average = require('analyser-frequency-average')
const audioAnalyser = require('web-audio-analyser')

import TWEEN from 'tween.js'
import OSC from 'osc/dist/osc-browser.js'
import Events from 'minivents'
import Stats from 'stats-js'
import dat from 'dat-gui'

var demo

// 5 scenes
//import IntroScene from './Intro';
//import ExecutedScene from './Executed';
//import RefugeesScene from './Headlines';
import DronesScene from './DronesScene'
import WienerLinienScene from './WienerLinienScene'
//TODO: OutroScene

class Main {

  constructor(args) {
    this.stats = null
    this.gui = new dat.GUI()
    this.startStats()

    this.analyser = null

    this.events = new Events()

    this.scenes = {s1: null, current:null}

    this.time = 0
    this.clock = new THREE.Clock()
    this.clock.start()
    this.manager = new THREE.LoadingManager()
    this.loader = new THREE.TextureLoader(this.manager)

    this.oscPort = new OSC.WebSocketPort({
        url: "ws://localhost:8081"
    });
    //this.canvas = document.createElement('canvas')
    this.renderer = new THREE.WebGLRenderer({
        //canvas: this.canvas,
            alpha: true,
            antialias: true,
            clearColor: 0,
            clearAlpha: 1,
            sortObject: false,
            autoClear: true
        });
    this.renderer.gammaInput = true
		this.renderer.gammaOutput = true
    document.body.appendChild(this.renderer.domElement)

    //this.app = createLoop(this.canvas, {})
    //this.app.on('resize', () => this.onResize())

    this.composer = new WAGNER.Composer(this.renderer)

    this.events.on("scene", (s) => this.setScene(s))

    window.addEventListener('resize', () => this.onResize(), false)
    this.onResize()
  }

  createLiveAudio() {



  }

  onResize() {
		this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  setScene(scene) {
    if (this.scenes.current)
      this.scenes.current.stop()

    this.scenes.current = this.scenes[scene]

    this.scenes.current.play()
  }

  startStats() {
      this.stats = new Stats();
      this.stats.domElement.style.position = 'absolute';
      document.body.appendChild(this.stats.domElement);
  }

  init() {

        this.oscPort.on("message", (oscMsg) => {
      console.log(oscMsg)
      if (oscMsg.address === '/scene') {
            let n = oscMsg.args[0]
            console.log("Scene change. "+ n)
            this.events.emit("scene", n)
      }

      if (oscMsg.address === '/v') {
            let n = oscMsg.args[0]
            let v = oscMsg.args[1]
            viz.onVariable(n, v)
      }
      if (oscMsg.address === '/f') {
            let n = oscMsg.args[0]
            viz.onFunc(n)
      }
    })
    this.oscPort.open()

    navigator.webkitGetUserMedia({audio: true}, stream => {

      this.analyser = audioAnalyser(stream, {stereo: false, audible: false})


      const args = {
      app: this.app,
      renderer: this.renderer,
                  composer: this.composer,
                  events: this.events,
                  gui: this.gui,
                  clock: this.clock,
                  loader: this.loader,
                  analyser: this.analyser.analyser}

    this.scenes.s1 = new WienerLinienScene(args)
    //this.scenes.s1 = new DronesScene(args)

    this.update()
      }, err => console.log(err))


  }

  update() {
    this.stats.begin()
    TWEEN.update()

    this.time++

    let analyserNode = null
    if (this.analyser) {
     analyserNode = analyser.analyser

     const freqs = analyser.frequencies()
     console.log(a)
    }

    this.events.emit("update", this.time, this.clock.getDelta())


    this.stats.end()
    requestAnimationFrame(this.update.bind(this))
 }
}



domready(() => {
  const main = new Main()
  main.init()

  main.setScene("s1")

})
