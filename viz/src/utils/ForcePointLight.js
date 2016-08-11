
import Force3 from './Force3'

export default class ForcePointLight extends THREE.PointLight {
  constructor(hex, intensity, distance, decay) {
    super(hex, intensity, distance, decay)
    this.force = new Force3()
  }
  updatePosition() {
    this.position.copy(this.force.velocity);
  }

}