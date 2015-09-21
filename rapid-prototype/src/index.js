import Demo from './demo';
import Drones from './drones';
import Heaven from './heaven';
import Shatter from './TEST_shatter';

const demo = new Heaven();
window.onresize = demo.onResize.bind(demo);