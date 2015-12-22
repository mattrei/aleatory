global.THREE = require('three')
const WAGNER = require('@superguigui/wagner')

import TWEEN from 'tween.js'
import OSC from 'osc/dist/osc-browser.js'
import Events from 'minivents'
import Stats from 'stats-js'
import dat from 'dat-gui'

var demo

// 5 scenes
import IntroScene from './Intro';
import ExecutedScene from './Executed';
import RefugeesScene from './Headlines';
import DronesScene from './DronesScene'
import WienerLinienScene from './WienerLinienScene'
//TODO: OutroScene

class Main {

  constructor(args) {
    this.stats = null
    this.gui = new dat.GUI()
    this.startStats()

    this.events = new Events()

    this.scenes = {s1: null, current:null}

    this.time = 0
    this.clock = new THREE.Clock()
    this.manager = new THREE.LoadingManager()
    this.loader = new THREE.TextureLoader(this.manager)

    this.oscPort = new OSC.WebSocketPort({
        url: "ws://localhost:8081"
    });
    this.renderer = new THREE.WebGLRenderer({
            //alpha: true,
            antialias: true,
            clearColor: 0,
            clearAlpha: 1,
            sortObject: false,
            autoClear: true
        });
        document.body.appendChild(this.renderer.domElement)

    this.composer = new WAGNER.Composer(this.renderer)

    this.events.on("scene", (s) => this.setScene(s))

    //this.onResize = this.onResize.bind(this.onResize)
    window.onresize = this.onResize.bind(this.onResize)
    //window.addEventListener('resize', this.onResize, false)
    this.onResize()
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

  listenOSC() {

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
  }

  startStats() {
      this.stats = new Stats();
      this.stats.domElement.style.position = 'absolute';
      document.body.appendChild(this.stats.domElement);
  }

  init() {
    const args = {renderer: this.renderer,
                  events: this.events,
                  gui: this.gui,
                  clock: this.clock,
                  loader: this.loader}

    this.scenes.s1 = new WienerLinienScene(args)
    //this.scenes.s2 = new DronesScene(args)

    this.update()
  }

  update() {
    this.stats.begin()
    TWEEN.update()

    this.time++

    this.events.emit("update", this.time)


    this.stats.end()
    requestAnimationFrame(this.update.bind(this))
 }
}


class Director {

}

document.addEventListener("DOMContentLoaded", function(event) {
  const main = new Main()
  main.listenOSC()
  main.init()

  main.setScene("s1")

});
