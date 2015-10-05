import Pipe from './Pipe';
import Drones from './Drones';
import Mare from './Mare';
import Heaven from './Heaven';
import Shatter from './TEST_shatter';
import TextParticles from './TextParticles'
import WienerLinien from './WienerLinien'
import Staircase from './Staircase'

const demo = new WienerLinien();
window.onresize = demo.onResize.bind(demo);