const osc               = require('osc/dist/osc-browser.js');
const oscPort = new osc.WebSocketPort({
    url: "ws://localhost:8081" // URL to your Web Socket server. 
});
oscPort.open();



var demo


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
console.log(router)



//const demo = new Scheduled();




oscPort.on("message", function (oscMsg) {
  if (oscMsg.address === '/page') {
        var pageName = oscMsg.args[0]
        console.log("Page change. "+ pageName)
        router.redirect('#/' + pageName)
  }
});

//window.onresize = demo.onResize.bind(demo);