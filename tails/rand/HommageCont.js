import React from "react"
import THREE from "three"
import ReactTHREE from "react-three"
import ReactMotion, {Spring, presets} from "react-motion"

const ROWS = 5
const COLS = 10

const CUBE_W = 100,
  CUBE_H = 30,
  CUBE_D = 150
const GAP = 10

class Cube extends React.Component {
  render () {

    let p = this.props.position

    let geometry = new THREE.BoxGeometry(100, 30, 150),
      material = new THREE.MeshLambertMaterial({color: 0x00ff00})

    return <ReactTHREE.Mesh position={new THREE.Vector3(p.x,p.y,p.z)}
         geometry={geometry} material={material} />
  }
}

class Cubes extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      zpos: 0
    }
    this._animate = this._animate.bind(this)

    this.cubes = []
  }
  componentDidMount() {

    let r = 0
    for (let i=0; i < ROWS*COLS; i++) {
      if (i % COLS == 0) {
        r++
      }
      var yi = Math.random() > 0.5 ? -300 : 300

      let x = ((i%COLS) * (CUBE_W + GAP)) - ((CUBE_W + GAP) * COLS / 2),
        y = yi,
        z = -1 * r * (CUBE_D + GAP)

        
        console.log(z)
      if (Math.random() > 0.25) {
        this.cubes.push(<Cube speed={5} position={new THREE.Vector3(x, y, z)} />)
      }
    }
    console.log(this.cubes)

    this._animate()
  }
  _animate () {

    let zpos = this.state.zpos
    zpos = zpos + 1 //this.props.speed

    if (zpos > 0) {
      zpos = -1 * (CUBE_D + GAP) * ROWS
    }

    this.setState({zpos: zpos })

    requestAnimationFrame(this._animate)
  }
  render () {

    this.cubes.forEach(c => {
      c.props.position.z += this.state.zpos
    })
    
    return <ReactTHREE.Object3D>
      {this.cubes}
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