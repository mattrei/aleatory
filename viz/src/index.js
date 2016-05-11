require('babel-polyfill')
global.THREE = require('three')

const domready = require('domready')
const createLoop = require('canvas-loop')

const WAGNER = require('@superguigui/wagner')

const average = require('analyser-frequency-average')
const audioAnalyser = require('web-audio-analyser')

import OSC from 'osc/dist/osc-browser.js'
import Events from 'minivents'
import Stats from 'stats-js'
import dat from 'dat-gui'

// 6 scenes
import IntroScene from './Intro/scene'
import ExecutedScene from './Executed/scene'
//import RefugeesScene from './RefugeesScene'
import DronesScene from './Drones/scene'
import WienerLinienScene from './WienerLinien/scene'
//import OceanScene from './OceanScene'
import OutroScene from './Outro/scene'
// 7scene ThisbeautifulWorld

// load fonts
require('./fonts/oswald_regular.typeface.js')

// TODO: use rhizome?
const OSC_URL = "ws://localhost:8081"

class Main {

  constructor(args) {
    this.stats = new Stats()
    this.stats.domElement.style.position = 'absolute'
    document.body.appendChild(this.stats.domElement)
    //document.getElementById('stats').appendChild(this.stats.domElement)
    this.gui = new dat.GUI()
    this.events = new Events()

    this.analyser = null
    this.video = null

    this.scenes = {
      s1: null,
      current: null
    }

    this.clock = new THREE.Clock()
    this.clock.start()
    this.time = 0
    this.manager = new THREE.LoadingManager()
    this.loader = new THREE.TextureLoader(this.manager)

    this.oscPort = new OSC.WebSocketPort({
      url: OSC_URL
    });
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      clearColor: 0,
      clearAlpha: 1,
      sortObject: false,
      autoClear: true
    });
    this.renderer.setClearColor(this.color, 1);
    this.renderer.autoClearColor = true;
    this.renderer.shadowMap.enabled = true;

    this.renderer.gammaInput = true
    this.renderer.gammaOutput = true

    //const container = document.getElementById('container');
    document.body.appendChild(this.renderer.domElement)

    this.composer = new WAGNER.Composer(this.renderer)
    this.canvas = document.createElement('canvas');
    this.canvas.id = "drawingCanvas"
    this.ctx = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas)

    this.textCanvas = document.createElement('canvas')
    this.textCanvas.id = "textCanvas"
    this.textCanvas.width = window.innerWidth
    this.textCanvas.height = window.innerHeight
      //document.body.appendChild(this.textCanvas)

    this.textCtx = this.textCanvas.getContext('2d')

    this.textCtx.fillRect(20, 20, 150, 150);



    this.events.on("scene", (s) => this.setScene(s))

  }

  onResize() {
    this.scenes.current.onResize()
    this.textCanvas.width = window.innerWidth
    this.textCanvas.height = window.innerHeight
  }

  setScene(scene) {
    if (this.scenes.current)
      this.scenes.current.stop()

    this.scenes.current = this.scenes[scene]

    this.scenes.current.play()
  }

  init() {

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

    navigator.webkitGetUserMedia({
      audio: true,
      video: true
    }, stream => {
      this.analyser = audioAnalyser(stream, {
          stereo: false,
          audible: false
        })
        /*
     this.video	= document.createElement('video')
     this.video.width	= 512
     this.video.height	= 512
     this.video.autoplay	= true;
     this.video.src	= URL.createObjectURL(stream)
*/

      const args = {

        demo: true,

        renderer: this.renderer,
        composer: this.composer,
        events: this.events,
        gui: this.gui,
        clock: this.clock,
        loader: this.loader,
        analyser: this.analyser,
        // webcam video
        video: this.video,

        // for drawing purposes
        canvas: this.canvas,
        textCanvas: this.textCanvas,
        ctx: this.ctx
      }


      this.scenes.s1 = new IntroScene(args)
      //this.scenes.s1 = new WienerLinienScene(args)

      //this.scenes.s1 = new ExecutedScene(args)
      //this.scenes.s1 = new RefugeesScene(args)

      //this.scenes.s1 = new DronesScene(args)

      //this.scenes.s1 = new OceanScene(args)
      //this.scenes.s1 = new OutroScene(args)

      this.setScene("s1")

      window.addEventListener('resize', () => this.onResize(), false)
      this.onResize()
      this.update()



    }, err => console.log(err))



  }

  update() {
    this.stats.begin()

    const dt = this.clock.getDelta()
    this.time += dt

    this.events.emit("update", {
      time: this.time,
      delta: dt
    })


    this.stats.end()
    requestAnimationFrame(this.update.bind(this))
  }
}



import Test from './Test_Particles'
domready(() => {

  const main = new Main()
  main.init()

  //let demo = new Test()
})
