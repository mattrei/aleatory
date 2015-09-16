import React from "react"
import THREE from "three"
import ReactTHREE from "react-three"
import _ from "lodash"
import reactMotion, {Spring, presets} from "react-motion"
//const {Spring} = require("react-motion");

var MeshFactory = React.createFactory(ReactTHREE.Mesh);

//
// Cupcake component is two cube meshes textured with cupcake textures
//

var boxgeometry = new THREE.BoxGeometry( 200,200,200);

var cupcaketexture = THREE.ImageUtils.loadTexture( 'cupCake.png' );
var cupcakematerial = new THREE.MeshBasicMaterial( { map: cupcaketexture } );

var creamtexture = THREE.ImageUtils.loadTexture( 'creamPink.png' );
var creammaterial = new THREE.MeshBasicMaterial( { map: creamtexture } );
var Cupcake = React.createClass({
  displayName: 'Cupcake',
  propTypes: {
    position: React.PropTypes.instanceOf(THREE.Vector3),
    quaternion: React.PropTypes.instanceOf(THREE.Quaternion).isRequired
  },
  render: function() {
    return React.createElement(
      ReactTHREE.Object3D,
      {quaternion:this.props.quaternion, position:this.props.position || new THREE.Vector3(0,0,0)},
      MeshFactory({position:new THREE.Vector3(0,-100,0), geometry:boxgeometry, material:cupcakematerial}),
      MeshFactory({position:new THREE.Vector3(0, 100,0), geometry:boxgeometry, material:creammaterial})
    );
  }
});

var texturemap = THREE.ImageUtils.loadTexture( 'creamPink.png' );
var boxmaterial = new THREE.MeshBasicMaterial( { map: texturemap } );

class SmallCube extends React.Component {
  
  render () {

    let {color} = this.props

    var cubeprops = _.clone(this.props);
    cubeprops.materialname = 'lollipopGreen.png';
    cubeprops.geometry =  new THREE.BoxGeometry( 2,2,2);
//    cubeprops.material = boxmaterial;
    cubeprops.material = new THREE.MeshLambertMaterial({color: color})

    //return <ReactTHREE.Object3D position={position}>
     return   <ReactTHREE.Mesh {...cubeprops} />;
      //</ReactTHREE.Object3D>
  }
}

class SmallCubes extends React.Component {

  render () {
    // props for the Object3D containing the cubes. You could change these
    // props to translate/rotate/scale the whole group of cubes at once
    let {width, height} = this.props
    var containerprops = {};
    var children = [];
    for (var i=0; i < this.props.cubes; i++) {
      children.push(

      <Spring defaultValue={{val: 0}} endValue={{val: 20}}>
        {interpolated => 
          <ReactTHREE.Object3D position={new THREE.Vector3(
            (Math.random() - 0.5) * width/5 + i,(Math.random() - 0.5) * height/5,
            (Math.random() - 0.5) * 20/5)}>
            <SmallCube key={i} 
            color={new THREE.Color(Math.random(), Math.random(), Math.random())} />
          </ReactTHREE.Object3D>
        }
      </Spring>
        );
    }

    return <ReactTHREE.Object3D position={new THREE.Vector3(0,0,0)}>
        {children}
      </ReactTHREE.Object3D>
      
  }
}

class ScheduledCube extends React.Component {
     constructor(props) {

        super(props);

        this.state = {
            modelRotation: 0
        };
        this._animate = this._animate.bind(this);
    }
  componentDidMount() {
    let texture = new THREE.Texture();
    let image = new Image();
    image.onload = function () {
      texture.image = image;
      texture.needsUpdate = true;
    };
    image.src = this.props.image;
    this.material = new THREE.MeshLambertMaterial( {map: texture})
    this._animate()
  }
  _animate() {
      let sa = this.props.spinSpeed * 0.1;
      this.setState({modelRotation: this.state.modelRotation + sa});

      requestAnimationFrame(this._animate);
  }
  render () {

    let {img, color} = this.props

    let cubeprops = _.clone(this.props);
    cubeprops.geometry =  new THREE.BoxGeometry( 2,2,2);
//    cubeprops.material = boxmaterial;
    cubeprops.material = new THREE.MeshLambertMaterial({color: color})

    let e = new THREE.Euler(this.state.modelRotation/2, this.state.modelRotation),
        q = new THREE.Quaternion().setFromEuler(e);


    return <ReactTHREE.Object3D quaternion={q} position={new THREE.Vector3(0,0,0)}>
            <ReactTHREE.Mesh {...cubeprops} />
          </ReactTHREE.Object3D>

  }
}

class ScheduledCubes extends React.Component {

  render () {
    // props for the Object3D containing the cubes. You could change these
    // props to translate/rotate/scale the whole group of cubes at once
    let {active, scheduled} = this.props
    var containerprops = {};
    var children = [];
    
    
    let activeCube = scheduled[active % scheduled.length]

    let c = <Spring defaultValue={{val: -10}} endValue={{val: 20, 
      config: [20, 2]}}>
        {interpolated => 
          <ReactTHREE.Object3D position={new THREE.Vector3(
            0,0, interpolated.val*2)}>
            <ScheduledCube 
            spinSpeed={1}
            color={new THREE.Color(1, 0, 1)} />
          </ReactTHREE.Object3D>
        }
      </Spring>
    

    return <ReactTHREE.Object3D position={new THREE.Vector3(0,0,0)}>
        {c}
      </ReactTHREE.Object3D>
      
  }
}



class SimpleCube extends React.Component {
    mixins: [tweenState.Mixin]
   constructor(props) {

        super(props);

        this.state = {
            modelPosition: new THREE.Vector3(0,0,0),
            modelRotation: 0
        };
        this.materials = []
        this.material = null
        this._animate = this._animate.bind(this);
    }
  componentDidMount() {

    this._animate();

    let s = this.props.scheduled
/*
    this.materials = s.map(e => { 
      let texture = new THREE.Texture();
      let image = new Image();
      image.onload = function () {
        texture.image = image;
        texture.needsUpdate = true;
      };
      image.src = e.img;
      return new THREE.MeshLambertMaterial( {map: texture})      
     })

*/

  }
  start() {
    this.tweenState('left', {
      easing: tweenState.easingTypes.easeInOutQuad,
      duration: 500,
      endValue: this.state.left === 0 ? 20 : 0
    });

  }
  _animate() {

      let spinAmount = this.props.spinSpeed * 0.01;
      this.setState({modelRotation: this.state.modelRotation + spinAmount,
      //  modelPosition: new THREE.Vector3(Math.random()* 100, 0, 0)
      });
      requestAnimationFrame(this._animate);
  }
  render() {

    let x = this.state.modelPosition.x,
            y = this.state.modelPosition.y,
            z = this.state.modelPosition.z;

    let modelEuler = new THREE.Euler(this.state.modelRotation/2, this.state.modelRotation),
            modelQuaternion = new THREE.Quaternion().setFromEuler(modelEuler);

    let data = {geometry: new THREE.BoxGeometry( 5, 5, 5, 1, 1, 1 ),
                material: new THREE.MeshLambertMaterial({color: new THREE.Color(0xf00000)}),
                /*material: (this.materials.length > 0) ? 
                  new THREE.MeshFaceMaterial( this.materials )  : 
                  new THREE.MeshLambertMaterial({color: new THREE.Color(0xf00000)})
                  */
              };

    return <ReactTHREE.Object3D quaternion={modelQuaternion} position={this.state.modelPosition}>
      <ReactTHREE.Mesh {...data} />
    </ReactTHREE.Object3D>
  }
}

class TheScheduled extends React.Component {
  constructor (props) {
    super(props);

    let s = []
    for (let i=1; i<=6; i++) {
      var c = document.getElementById("myCanvas");
      var ctx = c.getContext("2d");
      var img = document.getElementById("i" + i);
      ctx.drawImage(img, 0, 0);
      s.push({img: c.toDataURL(), date: '1.1.2017', name: 'asdf' + i})
    }
    this.state = {
      factor: 1,
      img: '',
      text: '',
      scheduled: s, //img, date, name
      rotate_scheduled: 0,
      cubes: 20,
      showCube: 1
    };
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
    const { factor, img, text, scheduled, showCube } = this.state;

    let aspectratio = this.props.width / this.props.height;
    let cameraprops = {fov:90, aspect:aspectratio, near:1, far:1000,
    position:new THREE.Vector3(0,0,80), lookat:new THREE.Vector3(0,0,0)};

    var planeGeometry = new THREE.PlaneBufferGeometry(60,40,1,1);
    var planeMaterial = new THREE.MeshLambertMaterial({color:
      0xffffff});
    
    var cupcakedata = {position:new THREE.Vector3(0,0,0), quaternion:new THREE.Quaternion()};

    return <ReactTHREE.Scene width={width} height={height} camera="mainCamera" orbitControls={THREE.OrbitControls}>
      <ReactTHREE.PerspectiveCamera name="mainCamera" {...cameraprops} /> 
        
        <ReactTHREE.AmbientLight color={new THREE.Color(0x000000)} intensity={1.0} 
          position={new THREE.Vector3(0, 0, 60)} />
        <ReactTHREE.PointLight color={new THREE.Color(0xffffff)} intensity={1} 
        position={new THREE.Vector3(0, 0, 60)} />
        <ReactTHREE.PointLight color={new THREE.Color(0xffffff)} intensity={1} 
        position={new THREE.Vector3(0, 10, 50)} />

        
        

       
        <ScheduledCubes show={showCube} scheduled={scheduled} />     
        
    </ReactTHREE.Scene>;
  }
}

export default TheScheduled;
// <SimpleCube spinSpeed={1} scheduled={scheduled} />
// <SmallCubes cubes={this.state.cubes} width={width} height={height} />