import THREE from 'three'; 
import OC    from 'three-orbit-controls';
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
//Detector = require('./globe/third-party/Detector.js')
import TWEEN from './globe/third-party/Tween'
import DAT from './globe/globe'


const data = {lat:32.6137855, lng:69.508248}

class Drones {
  constructor(args) 
  {
    this.createGlobe()
  }

  createGlobe() 
  {
    let opts = {}
    opts.imgDir = 'assets/'
    var globe = new DAT.Globe(document.getElementById('container'), opts)


    //globe.addData(data[i][1], {format: 'magnitude', name: data[i][0], animated: true});
    globe.addBox(data.lat, data.lng, 9)
    

    globe.animate() 
  }
}

export default Drones;