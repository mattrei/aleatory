import React from "react"
import THREE from "three"
import ReactTHREE from "react-three"
import ReactMotion, {Spring, presets} from "react-motion"

const ROWS = 30
const COLS = 20

const CUBE_W = 100,
  CUBE_H = 30,
  CUBE_D = 150
const GAP = 10

class Cube extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      zpos: this.props.position.z
    }
    this._animate = this._animate.bind(this)
  }
  componentDidMount() {
    this._animate()
  }
  _animate () {

    let zpos = this.state.zpos
    zpos = zpos + this.props.speed

    if (zpos > 0) {
      zpos = -1 * (CUBE_D + GAP) * ROWS
    }

    this.setState({zpos: zpos })

    requestAnimationFrame(this._animate)
  }
  render () {

    let p = this.props.position

    let geometry = new THREE.BoxGeometry(100, 30, 150),
      material = new THREE.MeshLambertMaterial({color: 0x00ff00})

    return <ReactTHREE.Mesh position={new THREE.Vector3(p.x,p.y,this.state.zpos)}
         geometry={geometry} material={material} />
  }
}

class Cubes extends React.Component {
  render () {
    let cubes = []
    let r = 0
    for (let i=0; i < ROWS*COLS; i++) {
      if (i % COLS == 0) {
        r++
      }
      var yi = Math.random() > 0.5 ? -300 : 300

      let x = ((i%COLS) * (CUBE_W + GAP)) - ((CUBE_W + GAP) * COLS / 2),
        y = yi,
        z = -1 * r * (CUBE_D + GAP)


      if (Math.random() > 0.25) {
        cubes.push(<Cube speed={15} position={new THREE.Vector3(x, y, z)} />)
      }
    }
    return <ReactTHREE.Object3D>
      {cubes}
      </ReactTHREE.Object3D>
  }
}

class Hommage extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
    }
  }
  componentDidMount() {


    const osc = this.props.osc;
    osc.on("message", (oscMsg) => {
      if (oscMsg.address === '/uniform') {
        var n = oscMsg.args[0]
        var v = oscMsg.args[1]
        if (n === 'scheduled') {
          let d = JSON.parse(v) // scheduled
          this.setState(d);  
        }
        if (n === 'rotate_scheduled') {
          let d = JSON.parse(v) // scheduled
          this.setState(d);  
        }
      }
    }); 
  }

  render () {
    const { width, height } = this.props;
    const { factor, img, text, scheduled } = this.state;

    let aspectratio = this.props.width / this.props.height;
    let cameraprops = {fov:75, aspect:aspectratio, near:1, far:10000,
    position:new THREE.Vector3(0,0,0), lookat:new THREE.Vector3(0,0,-500)};


    return <ReactTHREE.Scene width={width} height={height} camera="mainCamera" orbitControls={THREE.OrbitControls}>
      <ReactTHREE.PerspectiveCamera name="mainCamera" {...cameraprops} /> 
        <ReactTHREE.AmbientLight color={new THREE.Color(0x00ffff)} intensity={0.2} 
          position={new THREE.Vector3(0, 0, -100)} />
      

        <Cubes />
        
        
    </ReactTHREE.Scene>;
  }
}

export default Hommage

/*
  <ReactTHREE.PointLight color={new THREE.Color(0xffffff)} intensity={1} 
        position={new THREE.Vector3(0, 0, -200)} />*/