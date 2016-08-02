global.THREE = require('three')
import Scene from '../AScene'

import soundscape from './soundscape'
import soundwave from './soundwave'

//https://github.com/crma16/sound-experiments/blob/master/src/layouts/webgl-background/objects/Wave.js
class OutroScene extends AScene {
  constructor(args) {
    super(args, new THREE.Vector3(0, 30, 0))

    soundscape(this, true)
    soundwave(this, false)
  }

  tick(time, delta) {}
}

export default OutroScene
