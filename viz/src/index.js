import OSC from 'osc/dist/osc-browser.js'
const oscPort = new OSC.WebSocketPort({
    url: "ws://localhost:8081"
});




var demo


import Intro from './Intro';
import Headlines from './Headlines';
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



const demo, viz = new Intro();

oscPort.on("message", function (oscMsg) {
  console.log(oscMsg)
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
oscPort.open();

 demo = new Intro()
    window.onresize = demo.onResize.bind(demo);

/*
var Router = require('routerjs')
var router = new Router();
router.addRoute('#/Intro', function(req, next){
  console.log("#/Intro")
  document.body.innerHTML = '';
    demo = new Intro()
    window.onresize = demo.onResize.bind(demo);
});
router.addRoute('#/Executed', function(req, next){
    
    document.body.innerHTML = '';
    demo = new Executed()
    window.onresize = demo.onResize.bind(demo);
});
router.addRoute('#/Scheduled', function(req, next){
  document.body.innerHTML = '';
    demo = new Scheduled()
    console.log("sched")
    window.onresize = demo.onResize.bind(demo);
});
*/
//router.redirect('#/Intro')









