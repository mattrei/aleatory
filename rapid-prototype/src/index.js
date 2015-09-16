import Demo from './demo';
import Drones from './drones';

const demo = new Drones();
window.onresize = demo.onResize;