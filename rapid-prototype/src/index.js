
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

const demo = new Drones();
window.onresize = demo.onResize.bind(demo);