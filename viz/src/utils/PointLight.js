
import Force3 from './Force3'

class PointLight extends Force3 {
  constructor(props) {
    super(props)
    this.rad1 = 0
    this.rad2 = 0
    this.range = 200;
    this.hex = 0xffffff;
    this.intensity = 1;
    this.distance = 2000;
    this.decay = 1;
    this.obj;
  };
  init(hex, distance) {
    if (hex) this.hex = hex;
    if (distance) this.distance = distance;
    this.obj = new THREE.PointLight(this.hex, this.intensity, this.distance, this.decay);
    this.position = this.obj.position;
    this.setPositionSpherical();
  };

  setPositionSpherical() {
    var points = this.getSpherical(this.rad1, this.rad2, this.range);
    this.position.copy(points);
  };

  getSpherical(rad1, rad2, r) {
    var x = Math.cos(rad1) * Math.cos(rad2) * r;
    var z = Math.cos(rad1) * Math.sin(rad2) * r;
    var y = Math.sin(rad1) * r;
    return new THREE.Vector3(x, y, z);
  }

};

export default PointLight
