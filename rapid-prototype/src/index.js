import OSC from 'osc/dist/osc-browser.js'
const oscPort = new OSC.WebSocketPort({
    url: "ws://localhost:8081"
});
oscPort.open();



var demo

import Intro from './Intro';
import Executed from './Executed';
import Scheduled from './Scheduled';
import Tube from './Tube';
import Falling from './Falling';
import Dices from './Dices';
import Flipper from './Flipper';
import Drones from './Drones';
import Mare from './Mare';
import Heaven from './Heaven';
import TextParticles from './TextParticles'
import WienerLinien from './WienerLinien'
import Staircase from './Staircase'

var Router = require('routerjs')
var router = new Router();
router.addRoute('#/Executed', function(req, next){
    demo = new Executed()
    window.onresize = demo.onResize.bind(demo);
});
router.addRoute('#/Scheduled', function(req, next){
    demo = new Scheduled()
    console.log("sched")
    window.onresize = demo.onResize.bind(demo);
});


const viz = new WienerLinien();

oscPort.on("message", function (oscMsg) {
  if (oscMsg.address === '/p') {
        let n = oscMsg.args[0]
        console.log("Page change. "+ n)
        router.redirect('#/' + n)
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
});


window.onresize = viz.onResize.bind(viz);

