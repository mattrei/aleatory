import React from "react"
import THREE from "three"
import ReactTHREE from "react-three"

import GSAP from "gsap-react-plugin"
import _ from "lodash"
import reactMotion, {Spring, TransitionSpring, presets} from "react-motion"

const CUBE_SIZE=100
const GRID=6
const WALL_SIZE = (GRID * CUBE_SIZE)
const TOTAL_CUBES=GRID*GRID
const PI = Math.PI

class Cube extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      rot: 0
    }

  }
  componentDidMount () {
    
  }
  willEnter(key) {
    return {
      val: 0
    };
  }
  willLeave(key, value, endValue, currentValue, currentSpeed) {
    // the key with this value is truly killed when the values reaches destination
    console.log(currentSpeed)
  }
  render() {

    let dir = (Math.random() < 0.5 ? -PI : PI)


    /*
    <Spring defaultValue={{val: 0}} endValue={{val: dir, 
      config: [(20 * Math.random()) + 15, (Math.random() * 7) + 2]}}
      >
      */

    return <Spring defaultValue={{val: 0}} 
      endValue={{val: dir, config: [(30 * Math.random()) + 5, (Math.random() * 7) + 2]}}>
        {ip => 
    <ReactTHREE.Mesh geometry={this.props.geometry} 
      material={this.props.material} 
      position={this.props.position}
      quaternion={new THREE.Quaternion().setFromEuler(new THREE.Euler().setFromVector3(this.props.axis.multiplyScalar(ip.val)))}
      castShadow={true}
      receiveShadow={true} />}
      </Spring>
  }
}

class EndlessCube extends React.Component {
  render() {
    let x = (Math.random < 0.5 ? 1 : 0)

    return <Cube axis={new THREE.Vector3(x, 1-x, 0)}
    geometry={this.props.geometry} material={this.props.material}
    position={this.props.position} />
  }
}

class Cubes extends React.Component {
  constructor (props) {
    super(props);
    this.geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, 0.05)
    this.material = new THREE.MeshLambertMaterial({color: 0xffff00})
    
    this.state = {
            modelPosition: new THREE.Vector3(0,0,0),
          modelRotation: 1
        };

    this._animate = this._animate.bind(this)
  }
  componentDidMount() {
    this._animate()
  }
  _animate() {

      let spinAmount = this.props.spinSpeed * 0.01 ;
      this.setState({modelRotation: 
        (this.state.modelRotation + spinAmount) % PI,
      //  modelPosition: new THREE.Vector3(Math.random()* 100, 0, 0)
      });
      requestAnimationFrame(this._animate);
  }
  render() {
    let cubes=[]

    let row=0,
        col=0
       for (let i = 0; i < TOTAL_CUBES; i++) {

        if ((i % GRID) === 0) {
            col = 1
            row++
        } else col++

        let x = -(((GRID * CUBE_SIZE) / 2) - ((CUBE_SIZE) * col) + (CUBE_SIZE/2)) 
        let y = -(((GRID * CUBE_SIZE) / 2) - ((CUBE_SIZE) * row) + (CUBE_SIZE/2)) 

        cubes.push(<EndlessCube key={i} geometry={this.geometry} material={this.material}
          position={new THREE.Vector3(x,y,0)} />)
    }
    let spinAxis =  this.props.spinAxis.clone()
    let e = new THREE.Euler().setFromVector3(spinAxis.multiplyScalar(this.state.modelRotation)), //new THREE.Euler(this.state.modelRotation, 0, 45*180/Math.PI),
        q = new THREE.Quaternion().setFromEuler(e);

    return <ReactTHREE.Object3D 
      position={new THREE.Vector3(0, 50,0 )}
      quaternion={q}>
      {cubes}
      </ReactTHREE.Object3D>

  }
}

class TheExecuted2 extends React.Component {
  constructor (props) {
    super(props);
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

    let aspectratio = this.props.width / this.props.height;
    let cameraprops = {fov:75, aspect:aspectratio, near:0.1, far:10000,
    position:new THREE.Vector3(0,0,800), lookat:new THREE.Vector3(0,0,0)};

    return <ReactTHREE.Scene width={width} height={height} 
    camera="mainCamera" 
    orbitControls={THREE.OrbitControls}>
      <ReactTHREE.PerspectiveCamera name="mainCamera" {...cameraprops} /> 

      
      <ReactTHREE.DirectionalLight 
      position={new THREE.Vector3(-WALL_SIZE, -WALL_SIZE, CUBE_SIZE*GRID)}
      castShadow={true}
      shadowDarkness={0.5} />

      <ReactTHREE.DirectionalLight 
      position={new THREE.Vector3(WALL_SIZE, WALL_SIZE, CUBE_SIZE*GRID)}
      castShadow={true}
      shadowDarkness={0.5} />

      <Cubes spinSpeed={1} spinAxis={new THREE.Vector3(0, 0, 0)} />
        
    </ReactTHREE.Scene>;
  }
}

export default TheExecuted2
