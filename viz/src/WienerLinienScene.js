const DEMO = true
global.THREE = require('three')
import Scene from './Scene'

import TWEEN from 'tween.js'

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const vignetteBackground = require('three-vignette-background')
const newArray = require('new-array')
const random = require('random-float')
const randomInt = require('random-int')
const randomRadian = () => random(-Math.PI, Math.PI)
const randomRotation = () => newArray(3).map(randomRadian)
const randomSphere = require('gl-vec3/random')
const simplex = new (require('simplex-noise'))()

const runParallel = require('run-parallel')

const lerp = require('lerp')
const clamp = require('clamp')
const smoothstep = require('smoothstep')

const MeshLine = require('./utils/MeshLine').MeshLine
const MeshMaterial = require('./utils/MeshLine').MeshLineMaterial

const TextGeometry = require('./geometries/TextGeometry')(THREE)
const FontUtils = require('./utils/FontUtils')

const HALTESTELLEN = require('./test_data/WienerLinienHaltestellen.json')
const HALTESTELLEN_KEYS = Object.keys(HALTESTELLEN)
const HALTESTELLEN_LENGTH = HALTESTELLEN_KEYS.length


const SCALE_Z=1
const SCALE = 4000

const UP = new THREE.Vector3(0, 1, 0);

const UPDATE_SEC = 15
const SPEED = 1

// CENTER of Vienna
const CENTER_LAT = 48.2
const CENTER_LNG = 16.3667

const TWEEN_DUR = 15 * 1000


const MAIN_COLOR = new THREE.Color('#fff')
const ALT_COLOR = new THREE.Color('#000')


/*
add map as surface
https://github.com/geommills/esrileaflet3JS/blob/master/scripts/client/src/terrain.js
*/

class Line {
  constructor(args)
  {
    this.scene = args.scene
    this.topo = args.topo
    this.events = args.events
    this.lineColor = args.lineColor
    this.linewidth = args.linewidth

    this.particles = null
    this.normalGeometry = []
    this.line = null
    this.trains = []
    this.spline = null

    this.uniforms = {

        c: { type: "f", value: 0.5 },
        p:   { type: "f", value: 1.0 },
        color:     { type: "c", value: this.lineColor }

      };


    this.draw()
  }

  colorize(h) {

    new TWEEN.Tween(this.line.material.color)
    .to({r: Math.random(), g: Math.random(), b: Math.random()}, 500)
    .easing(TWEEN.Easing.Quartic.In)
    .start();

    //this.line.material.color.setHSL(h, Math.random(), Math.random())
    //this.line.material.needsUpdate = true
  }

  chaos() {

    for (let i = 0; i < this.line.geometry.vertices.length/10; i++) {

        var vertex = new THREE.Vector3();
        vertex.x = Math.random() * 1000 - 500;
        vertex.y = Math.random() * 1000 - 500;
        vertex.z = Math.random() * 1000 - 500;

        let origVertex = this.line.geometry.vertices[i]
        origVertex.origPos = new THREE.Vector3()
        origVertex.origPos.copy(origVertex)

        new TWEEN
          .Tween(origVertex)
          .to({x: vertex.x,
              y: vertex.y,
              z: vertex.z}, (TWEEN_DUR*Math.random()*0.5) + TWEEN_DUR*0.5)
          .onUpdate(() => {
            this.line.geometry.verticesNeedUpdate = true;
          })
          .start();
    }

/*
    this.boxes.forEach(b => {

      b.origPos = new THREE.Vector3()
      b.origPos.copy(b.position)

        var vertex = new THREE.Vector3();
        vertex.x = Math.random() * 800 - 400;
        vertex.y = Math.random() * 800 - 400;
        vertex.z = Math.random() * 800 - 400;


      new TWEEN
          .Tween(b.position)
          .to({x: vertex.x,
              y: vertex.y,
              z: vertex.z}, (TWEEN_DUR*Math.random()*0.5) + TWEEN_DUR*0.5)
          .start();
    })
*/

  }

  scale(s) {

        new TWEEN
          .Tween(this.line.scale)
          .to({x: s,
              y: s,
              z: s}, (2*1000*Math.random()) + 2000)
          .onUpdate(() => {
            this.line.geometry.verticesNeedUpdate = true;
          })
          .start();
  }

  ordered() {

    for (let i = 0; i < this.line.geometry.vertices.length/10; i++) {

        let vertex = this.line.geometry.vertices[i]

        new TWEEN
          .Tween(vertex)
          .to({x: vertex.origPos.x,
              y: vertex.origPos.y,
              z: vertex.origPos.z}, (4*1000*Math.random()) + 4000)
          .onUpdate(() => {
            this.line.geometry.verticesNeedUpdate = true;
          })
          .start();
    }

          new TWEEN
          .Tween(this.line.scale)
          .to({x: 1,
              y: 1,
              z: 1}, (4*1000*Math.random()) + 4000)
          .onUpdate(() => {
            this.line.geometry.verticesNeedUpdate = true;
          })
          .start();

/*
    this.boxes.forEach(b => {


        var vertex = new THREE.Vector3();
        vertex.x = Math.random() * 1000 - 500;
        vertex.y = Math.random() * 1000 - 500;
        vertex.z = Math.random() * 1000 - 500;


      new TWEEN
          .Tween(b.position)
          .to({x: b.origPos.x,
              y: b.origPos.y,
              z: b.origPos.z}, (4*1000*Math.random()) + 4000)
          .start();
    })
*/
  }

  draw() {
    let numPoints = this.topo.length * 2;

    let particlePositions = new Float32Array( numPoints * 3 );

    let pMaterial = new THREE.PointsMaterial( {
          color: 0xFFFFFF,
          size: 8,
          blending: THREE.AdditiveBlending,
          transparent: true,
          sizeAttenuation: false
        } );
    let pGeometry = new THREE.BufferGeometry();


    let points = []
    if (this.topo instanceof Array) {
      //sometimes the data may be curropt
      this.topo.forEach((t, i) => {

        let e = t[1]
        let y = (e.coord.lat - CENTER_LAT) * SCALE,
         x = (e.coord.lng - CENTER_LNG) * SCALE,
         z = Math.random() * SCALE_Z
        points.push(new THREE.Vector3(x, y, z))

        particlePositions[ i * 3     ] = x;
        particlePositions[ i * 3 + 1 ] = y;
        particlePositions[ i * 3 + 2 ] = z;
      })

      pGeometry.addAttribute( 'position', new THREE.BufferAttribute( particlePositions, 3 ));
      let particlesMesh = new THREE.Points( pGeometry, pMaterial );
      this.particles = particlesMesh
      this.scene.add(particlesMesh)


      //console.log(points)
      this.spline = new THREE.CatmullRomCurve3(points);


/*
      var material = new THREE.ShaderMaterial({
          uniforms: this.uniforms,
          vertexShader: Shaders.line.vertexShader,
          fragmentShader: Shaders.line.fragmentShader,
          //blending:       THREE.AdditiveBlending,
          depthTest:      false,
          transparent:    true
      });
*/


      let material = new THREE.LineBasicMaterial({
          color: this.lineColor,
          linewidth: this.linewidth
      });

      var geometry = new THREE.Geometry();
      var splinePoints = this.spline.getPoints(numPoints);

      for (var i = 0; i < splinePoints.length; i++) {
          geometry.vertices.push(splinePoints[i]);
      }

      let line = new THREE.Line(geometry, material);
      this.scene.add(line);

      this.line = line
    } // endif

  }
}

class MetroLine extends Line {
  constructor(args) {
    args.linewidth = 5
    super(args)


    this.tangent = new THREE.Vector3();
    this.axis = new THREE.Vector3();
    this.camera = args.camera

    this.textMeshes = []

    this.drawText()

    this.update = this.update.bind(this)
    setInterval(this.update, 1000)  // every second
  }
  drawText() {
    this.topo.forEach(t => {
      let e = t[1]
      let y = (e.coord.lat - CENTER_LAT) * SCALE,
         x = (e.coord.lng - CENTER_LNG) * SCALE,
         z = Math.random() * SCALE_Z
         /*
        let geomText = new THREE.TextGeometry( e.name, {

              size: 8,
              height: 5,
              curveSegments: 3,

              font: "helvetiker",
              weight: "normal",
              style: "normal",

              bevelThickness: 2,
              bevelSize: 1,
              bevelEnabled: true

            });
*/

        let shapes = THREE.FontUtils.generateShapes( e.name, {
          font: "oswald",
          weight: "normal",
          size: 5
        } );
        let geomText = new THREE.ShapeGeometry( shapes );
        let matText = new THREE.MeshBasicMaterial({color: 0xffffff});
        let meshText = new THREE.Mesh( geomText, matText );

        meshText.position.x = x
        meshText.position.y = y
        meshText.position.ẑ = 20
        meshText.lookAt(this.camera.position)
        this.textMeshes.push(meshText)
        this.scene.add(meshText)
    })

  }
  updateTrainData(trainsData) {
    // here we set the trains
    //console.log(trainsData)
    this.trains.forEach(t => {
      this.scene.remove(t)
    })
    this.trains = []

    let trainGeom = new THREE.BoxGeometry(10, 5, 4),
      trainMat = new THREE.MeshBasicMaterial({
        color: 0xffff00
      });


    let dists = this.spline.getLengths(this.topo.length-1)
    trainsData.forEach((t,i) => {

      let p = t.cnt / t.dur
      let train = new THREE.Mesh(trainGeom, trainMat);
      train.progress = p
      train.duration = t.dur
      train.stationidx = i

      let a = dists[i],
        b = dists[i + 1],
        pos = (Math.abs(a-b) * p) + a,
        arc = pos / this.spline.getLength()

      train.arc = arc
      train.b = dists[i+1]

      train.step = (Math.abs(arc - train.b) / this.spline.getLength()) / t.dur

      train.tangent = new THREE.Vector3();
      train.axis = new THREE.Vector3();

      this.scene.add(train)
      this.trains.push(train)
    })

  }
  update() {
    this.trains.forEach(t => {

      let arc = t.arc + t.step
      if (arc <= 1) {
        /*
        t.position.copy( this.spline.getPointAt(arc) );
        this.tangent = this.spline.getTangentAt(arc).normalize();
        this.axis.crossVectors(UP, this.tangent).normalize();
        let radians = Math.acos(UP.dot(this.tangent));
        t.quaternion.setFromAxisAngle(this.axis, radians);
        t.arc = arc
        */
        t.position.copy( this.spline.getPointAt(arc) );
        t.tangent = this.spline.getTangentAt(arc).normalize();
        t.axis.crossVectors(UP, t.tangent).normalize();
        let radians = Math.acos(UP.dot(t.tangent));
        t.quaternion.setFromAxisAngle(t.axis, radians);
        t.arc = arc
      }


    })
    this.textMeshes.forEach(m => {
      m.lookAt(this.camera.position)
    })
  }
  updateFollowTrain(splineCamera) {
    //console.log(this.randomTrain.position)
    //camera.position.copy(this.randomTrain.position)

      var time = Date.now();
      var looptime = 20 * 1000;
      var t = ( time % looptime ) / looptime;

      let arc = t % 1
     splineCamera.position.copy( this.spline.getPointAt(arc) );
     console.log(splineCamera.position)
      this.tangent = this.spline.getTangentAt(arc).normalize();
      this.axis = this.axis.crossVectors(UP, this.tangent).normalize();
      let radians = Math.acos(UP.dot(this.tangent));

      //splineCamera.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), -Math.PI/2);

      splineCamera.lookAt(splineCamera.position)
      splineCamera.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), radians);

  }
}

const bgColor1 = new THREE.Color('#fff')
const bgColor2 = new THREE.Color('#283844')
const altBgColor1 = invert(bgColor1)
const altBgColor2 = invert(bgColor2)
function invert (color) {
  return new THREE.Color(1 - color.r, 1 - color.g, 1 - color.b)
}

class WienerLinien extends Scene {
  constructor(args)
  {
    super(args, new THREE.Vector3(0,45,640))


    this.tmpColors = [ new THREE.Color(), new THREE.Color() ]


    this.line = null
    this.particles = null

    this.lines = []
    this.randomMetro = null

    this.sceneStation = null;


    this.background()
    this.haltestellen()
    this.spirals()
    this.metro()

    //this.onResize();
    //this.update();

    this.idx = 0
  }

  background() {
    const bg = vignetteBackground()
    this.scene.add(bg)
    this.updateBackground(bg, 1)

    this.createStars(120).forEach(m => this.scene.add(m))
    this.createAsteroids(100).forEach(m => this.scene.add(m))
  }

  updateBackground (bg, colorTween) {
    const [ width, height ] = [window.innerWidth, window.innerHeight]
    // very cool
    this.tmpColors[0].copy(bgColor1).lerp(altBgColor1, colorTween)
    this.tmpColors[1].copy(bgColor2).lerp(altBgColor2, colorTween)
    bg.style({
      aspect: width / height,
      aspectCorrection: false,
      scale: 2.5,
      colors: this.tmpColors,
      grainScale: 1.5 / Math.min(width, height)
    })
  }

  createAsteroids (count, app) {
    const geometries = newArray(6).map(asteroidGeom)
    const material = new THREE.MeshBasicMaterial({
      color: MAIN_COLOR,
      transparent: true,
      wireframe: true
    })
    const meshes = newArray(count).map(() => {
      const geometry = geometries[randomInt(geometries.length)]
      const mesh = new THREE.Mesh(geometry, material.clone())
      mesh.material.opacity = random(0.05, 0.1)
      mesh.scale.multiplyScalar(random(0.1, 1.5))
      mesh.rotation.fromArray(randomRotation())
      mesh.direction = new THREE.Vector3().fromArray(randomSphere([]))
      mesh.position.fromArray(randomSphere([], random(200, 400)))
      return mesh
    })


    this.events.on('tick', t => {
      const dt = t.dt / 100
      meshes.forEach(mesh => {
        mesh.rotation.x += dt * 0.1 * mesh.direction.x
        mesh.rotation.y += dt * 0.5 * mesh.direction.y
      })
    })

    return meshes

    function asteroidGeom () {
      const geometry = new THREE.TetrahedronGeometry(10, randomInt(1, 3))
      geometry.vertices.forEach(v => {
        let steps = 3
        let s = Math.pow(2, steps)
        let a = 0.75
        for (let i = 0; i < steps; i++) {
          v.x += a * simplex.noise3D(v.x * s * 0, v.y * s, v.z * s)
          v.y += a * simplex.noise3D(v.x * s, v.y * s * 0, v.z * s)
          v.z += a * simplex.noise3D(v.x * s, v.y * s, v.z * s * 0)
          s *= 0.25
          a *= 1 / steps * i
        }
      })
      geometry.computeFaceNormals()
      geometry.verticesNeedsUpdate = true
      return geometry
    }
  }

  createStars (count) {
    const geometry = new THREE.TetrahedronGeometry(1, 0)
    const material = new THREE.MeshBasicMaterial({
      color: MAIN_COLOR
    })
    const meshes = newArray(count).map(() => {
      const mesh = new THREE.Mesh(geometry, material.clone())
      mesh.material.opacity = random(0.01, 0.5)
      mesh.scale.multiplyScalar(random(1.5, 4.5))
      mesh.rotation.fromArray(randomRotation())
      mesh.position.fromArray(randomSphere([], random(200, 400)))
      return mesh
    })
    let time = 0

    this.events.on('tick', t => {
      //time += 0.1
      //console.log(time)
      meshes.forEach(m => {
        let c = ALT_COLOR.clone().lerp(MAIN_COLOR, 0)
        //m.material.color = c
        //m.material.needsUpdate = true
      })
    })

    return meshes
  }

  updateTrainData() {
    console.log("updating")
    this.idx++
    console.log(this.idx)
    this.u4.updateTrainData(JSON.parse(U4H[this.idx%2]))
  }

  colorize() {
    this.lines.forEach(l => {
      l.colorize(Math.random())
    })
  }

  morphScale() {
    this.lines.forEach(l => {
      l.scale(Math.random() * 2)
    })
  }

  topo() {
    const VIS = 'topo'
    const conf = {on: true}

    const group = new THREE.Group()
    this.scene.add(group)
    group.visible = conf.on


     let csv_topo = require('./test_data/WienerLinienTopo.json')
      //console.log(csv_topo)
      this.csv_lines = []
      for (let k of csv_topo.keys()) {
        let line = new Line({scene: this.scene,
          topo:csv_topo[k][1],
          lineColor: 'white',
          linewidth: 1})
        this.lines.push(line)
        //this.csv_lines.push(line)
      }
  }
  morphChaos() {
    this.lines.forEach(l => {
      l.chaos()
    })
  }
  morphOrdered() {
    this.lines.forEach(l => {
      l.ordered()
    })
  }
  metroMode() {
    //this.clearScene()
/*
    let topo = JSON.parse(U_TOPO)
    this.lines.push(new MetroLine({scene: this.scene, camera: this.camera, sceneStation: this.sceneStation, topo: topo.u1, lineColor: new THREE.Color(0xff0000)}))
    this.lines.push(new MetroLine({scene: this.scene, camera: this.camera, sceneStation: this.sceneStation, topo: topo.u2, lineColor: new THREE.Color(0x00f000)}))
    this.lines.push(new MetroLine({scene: this.scene, camera: this.camera, sceneStation: this.sceneStation, topo: topo.u3, lineColor: new THREE.Color(0x00ffff)}))

    this.u4 = new MetroLine({scene: this.scene, camera: this.camera, sceneStation: this.sceneStation, topo: topo.u4, lineColor: new THREE.Color(0x00ff00)})
    this.lines.push(new MetroLine({scene: this.scene, camera: this.camera, sceneStation: this.sceneStation, topo: topo.u6, lineColor: new THREE.Color(0x00fff0)}))

    this.u4.updateTrainData(JSON.parse(U4H[this.idx]))
    this.updateTrainData = this.updateTrainData.bind(this)
    setInterval(this.updateTrainData, 10000)
    */
  }

  metro() {
    const VIS = 'metro'
    const conf = {on: true, text: true}

    const group = new THREE.Group(),
      textGroup = new THREE.Group()
    this.scene.add(group)
    group.add(textGroup)
    group.visible = conf.on

    let metroTopo = require('./test_data/WienerLinienMetro.json')
//    console.log(metroTopo)

    const _uToColor = (u) => {
      if (u === 'u1') return new THREE.Color(0xff0000)
      if (u === 'u2') return new THREE.Color(0x00f000)
      if (u === 'u3') return new THREE.Color(0x00ffff)
      if (u === 'u4') return new THREE.Color(0x00ff00)
      if (u === 'u6') return new THREE.Color(0x00fff0)
    }

    const meshes = []
    Object.keys(metroTopo).forEach(u => {
      const color = _uToColor(u)

      const topo = metroTopo[u]

      const NUM_POINTS = topo.length * 2

        let particlePositions = new Float32Array( NUM_POINTS * 3 );

        let pGeometry = new THREE.BufferGeometry(),
           pMaterial = new THREE.PointsMaterial( {
              color: 0xFFFFFF,
              size: 10,
              blending: THREE.AdditiveBlending,
              transparent: true,
              sizeAttenuation: false
            } );




        let points = []
        if (topo instanceof Array) {
          //sometimes the data may be curropt
          topo.forEach((t, i) => {

            let e = t[1]
            let y = (e.coord.lat - CENTER_LAT) * SCALE,
             x = (e.coord.lng - CENTER_LNG) * SCALE,
             z = Math.random() * SCALE_Z
            points.push(new THREE.Vector3(x, y, z))

            particlePositions[ i * 3     ] = x;
            particlePositions[ i * 3 + 1 ] = y;
            particlePositions[ i * 3 + 2 ] = z;

            // add station name
              let shapes = THREE.FontUtils.generateShapes( e.name, {
                font: "oswald",
                weight: "normal",
                size: 5
              } );
              let geomText = new THREE.ShapeGeometry( shapes ),
                 matText = new THREE.MeshBasicMaterial({color: 0xffffff});

              let meshText = new THREE.Mesh( geomText, matText );

              meshText.position.x = x
              meshText.position.y = y
              meshText.position.ẑ = 20
              meshText.lookAt(this.camera.position)

              textGroup.add(meshText)

          })
          //group.add(textGroup)

          pGeometry.addAttribute( 'position', new THREE.BufferAttribute( particlePositions, 3 ));
          let pMesh = new THREE.Points( pGeometry, pMaterial );
          group.add(pMesh)


          let spline = new THREE.CatmullRomCurve3(points);

          let geometry = new THREE.Geometry(),
             material = new THREE.LineBasicMaterial({
              color: color,
              linewidth: 5,
            transparent: true
          });

          var splinePoints = spline.getPoints(NUM_POINTS)

          for (let i = 0; i < splinePoints.length; i++) {
              geometry.vertices.push(splinePoints[i]);
          }

          let line = new THREE.Line(geometry, material);
          group.add(line)
          meshes.push(line)
        }
    })

    /*
    this.u4.updateTrainData(JSON.parse(U4H[this.idx]))
    this.updateTrainData = this.updateTrainData.bind(this)
    setInterval(this.updateTrainData, 10000)
    */

    this.events.on(VIS + '::text', p => textGroup.visible = p)

    this.events.on(VIS + '::visOn', _ => group.visible = true)
    this.events.on(VIS + '::visOff', _ => group.visible = false)

    this.events.on(VIS + '::data', d => {
      console.log("got data")
      console.log(d)
    })

    this.events.on('tick', t => {

    })

    super.addVis(VIS, conf)
  }

  startGUI(gui)
  {
    /*gui.add(this.spirals, 'show').onChange(v => {
      this.spirals.show = v
      this.spirals.meshes.forEach(m => m.visible = v)
    })*/
    /*
    gui.add(this.haltestellen, 'show').onChange(v => {
      this.haltestellen.show = v
    })*/
    /*
    gui.add(this, 'colorize')
    gui.add(this, 'morphScale')
    gui.add(this, 'morphChaos')
    gui.add(this, 'morphOrdered')
    gui.add(this, 'allMode')
    gui.add(this, 'metroMode')
    gui.add(this, 'followRandomTrain')
    gui.add(this, 'unfollowRandomTrain')
    */
  }

  followRandomTrain() {

    //this.randomMetro = this.lines[Math.floor(Math.random() * this.lines.length)]
    this.randomMetro = this.u4
    this.randomMetro.followRandomTrain()
  }
  unfollowRandomTrain() {
    this.randomMetro = null
    this.camera.position.set(0, 45, 640)
    this.update()
  }
  tick(time, delta)
  {
    if (this.randomMetro) {
      this.randomMetro.updateFollowTrain(this.camera)
    }
  }



  spirals() {

    const VIS = 'spirals'
    const conf = {on: false}

    const group = new THREE.Group()
    this.scene.add(group)
    group.visible = conf.on

    let geo = new Float32Array( 100 * 3 );

    var sz = 2, cxy = 100, cz = cxy * sz;
    var hxy = Math.PI / cxy, hz = Math.PI / cz;
    var r = 130;


      for( var i = 0; i < geo.length; i += 3 ) {
        //geo[ j ] = geo[ j + 1 ] = geo[ j + 2 ] = Math.random() * 100;

        var lxy = i * hxy;
        var lz = i * hz;
        var rxy = r * 2 /  Math.cosh(lz);
        var x = rxy * Math.cos(lxy);
        var y = rxy * Math.sin(lxy);
        var z = - r * 5 * Math.tanh(lz);
        //geo[i] =

        geo[ i ] = x
        geo[i+1] = y
        geo[i+2] = z
      }

    const _create = (i, color) => {

      var line = new THREE.MeshLine()
      line.setGeometry( geo );

      let material = new THREE.MeshLineMaterial({
          color: new THREE.Color(color),
          lineWidth: 4,
          transparent: true
        });

      var mesh = new THREE.Mesh( line.geometry, material ); // this syntax could definitely be improved!
      mesh.origGeo = geo
      mesh.geo = new Float32Array(geo)
      mesh.line = line

      mesh.position.z = i * 80

      return mesh
    }

    const meshes = []

    meshes.push(_create(0, 'red'))
    meshes.push(_create(1, 'purple'))
    meshes.push(_create(2, 'orange'))
    meshes.push(_create(3, 'green'))
    meshes.push(_create(4, 'brown'))

    meshes.forEach(m => group.add(m))

    this.events.on('tick', t => {

          const low = super.getFreq(40, 100)
          const high = super.getFreq(4400, 4500)
          meshes.forEach((m, idx) => {
            m.rotation.z -= 0.05

            for( let i = 0; i < m.geo.length; i += 3 ) {
              //geo[ i ] += Math.sin((avg + i) * 0.02) * 1
              //geo[i] =  geo[i] * simplex.noise2D(geo[i], Math.sin(t.t)) * (20 * avg)
              //geo[i] += Math.sin(t.t + idx + i * 0.5) * (avg * 20)
              m.geo[i] = m.origGeo[i] + Math.sin(t.time + idx + i * 0.5) * (low * 20) * (high * 10)
            }

            m.line.setGeometry(m.geo)

          })
      })

    this.events.on(VIS + '::visOn', _ => {
        group.visible = true
        /*
        meshes.forEach(m => {

          m.material.opacity = 0
          tweenr.to(m.material, {opacity: 1, duration: 2})
        })
        */
    })
    this.events.on(VIS + '::visOff', _ => group.visible = false)


    super.addVis(VIS, conf)
  }



  haltestellen() {
     const MAX = 100
     const VISIBLE_HS = 5

    const VIS = 'haltestellen'
    const conf = {on: false}

    const group = new THREE.Group()
    this.scene.add(group)
    group.visible = conf.on

     const meshes = []

     const _randHaltestelle = () => {
        return HALTESTELLEN[HALTESTELLEN_KEYS[
          randomInt(0, HALTESTELLEN_LENGTH-1)]]['NAME']
      }

     for (let i=0; i < MAX; i++) {
       let shapes = THREE.FontUtils.generateShapes( _randHaltestelle(), {
            font: "oswald",
            weight: "normal",
            size: 25
          } );
          let geom = new THREE.ShapeGeometry( shapes );
          let mat = new THREE.MeshNormalMaterial();
          let mesh = new THREE.Mesh( geom, mat );
          geom.center()

          mesh._velocity = random(0.8, 1.9)
          mesh.position.set(random(-100, 100), random(-100, 100), - 500)

          mesh.visible = false
          group.add(mesh)
          meshes.push(mesh)
     }

    meshes.slice(0, VISIBLE_HS).forEach(m => m.visible = true)
    this.haltestellen.queue = VISIBLE_HS

    const [hh, wh] = [window.innerHeight/4, window.innerWidth/4]

    this.events.on('tick', t => {

        meshes.forEach((m, i) => {
          if(m.visible) {

            m.scale.x = m.scale.y = smoothstep(0, 1, 1 - m.position.z / -500 )
            m.position.z += t.delta + m._velocity

            if (m.position.z > 0) {
              m.visible = false
              this.haltestellen.queue += 1

              let nm = meshes[this.haltestellen.queue % meshes.length]
              nm._velocity = random(0.7, 1.9)
              nm.position.set(random(-wh, wh), random(-hh, hh), - 500)
              nm.scale.x = nm.scale.y = 0.1
              nm.visible = true
            }
          }
        })
    })

    this.events.on(VIS + '::visOn', _ => group.visible = true)
    this.events.on(VIS + '::visOff', _ => group.visible = false)

    super.addVis(VIS, conf)
  }


  _updateHaltestellen(time) {
    if (this.haltestellen.show) {
      const [hh, wh] = [window.innerHeight/4, window.innerWidth/4]

      this.haltestellen.meshes.forEach((m, i) => {

        if(m.visible) {

          m.scale.x = m.scale.y = smoothstep(0, 1, 1 - m.position.z / -500 )
          m.position.z += time * 0.002 * m._velocity

          if (m.position.z > 0) {
            m.visible = false
            this.haltestellen.queue += 1

            let nm = this.haltestellen.meshes[this.haltestellen.queue % this.haltestellen.meshes.length]
            nm._velocity = random(0.3, 0.9)
            nm.position.set(random(-wh, wh), random(-hh, hh), - 500)
            nm.scale.x = nm.scale.y = 0.1
            nm.visible = true
          }
        }
      })
    }
  }
}

export default WienerLinien;

const U4H = [
'[{"a":[4407,{"name":"Braunschweiggasse","dep":"2015-10-02T22:17:07+02:00","cnt":7,"coord":{"lat":16.2958489362735,"lng":48.1893909421753}}],"b":[4409,{"name":"Hietzing","dep":"2015-10-02T22:10:07+02:00","cnt":0,"coord":{"lat":16.3048074382037,"lng":48.1875411225411}}],"dur":420,"cnt":0,"elapsed":-5},{"a":[4437,{"name":"Längenfeldgasse","dep":"2015-10-02T22:15:07+02:00","cnt":5,"coord":{"lat":16.3350274604032,"lng":48.1848294222246}}],"b":[4415,{"name":"Margaretengürtel","dep":"2015-10-02T22:10:07+02:00","cnt":0,"coord":{"lat":16.3430565952858,"lng":48.1884624935717}}],"dur":300,"cnt":0,"elapsed":-5},{"a":[4419,{"name":"Kettenbrückengasse","dep":"2015-10-02T22:13:07+02:00","cnt":3,"coord":{"lat":16.3580963578673,"lng":48.1966084835194}}],"b":[4421,{"name":"Karlsplatz","dep":"2015-10-02T22:10:07+02:00","cnt":0,"coord":{"lat":16.3696266443499,"lng":48.2003468882865}}],"dur":180,"cnt":0,"elapsed":-5},{"a":[4425,{"name":"Wien Mitte-Landstraße","dep":"2015-10-02T22:13:07+02:00","cnt":3,"coord":{"lat":16.3849013036542,"lng":48.2068884928784}}],"b":[4427,{"name":"Schwedenplatz","dep":"2015-10-02T22:11:07+02:00","cnt":1,"coord":{"lat":16.3781379720207,"lng":48.2118734058631}}],"dur":120,"cnt":60,"elapsed":54},{"a":[4439,{"name":"Spittelau","dep":"2015-10-02T22:17:07+02:00","cnt":7,"coord":{"lat":16.3585973388896,"lng":48.2348654941687}}],"b":[4435,{"name":"Heiligenstadt","dep":"2015-10-02T22:10:12+02:00","cnt":null,"coord":{"lat":16.3657126383479,"lng":48.2481647787235}}],"dur":414,"cnt":0,"elapsed":0}]',
'[{"a":[4407,{"name":"Braunschweiggasse","dep":"2015-10-02T22:17:19+02:00","cnt":7,"coord":{"lat":16.2958489362735,"lng":48.1893909421753}}],"b":[4409,{"name":"Hietzing","dep":"2015-10-02T22:10:19+02:00","cnt":0,"coord":{"lat":16.3048074382037,"lng":48.1875411225411}}],"dur":420,"cnt":0,"elapsed":-3},{"a":[4437,{"name":"Längenfeldgasse","dep":"2015-10-02T22:15:19+02:00","cnt":5,"coord":{"lat":16.3350274604032,"lng":48.1848294222246}}],"b":[4415,{"name":"Margaretengürtel","dep":"2015-10-02T22:10:19+02:00","cnt":0,"coord":{"lat":16.3430565952858,"lng":48.1884624935717}}],"dur":300,"cnt":0,"elapsed":-3},{"a":[4421,{"name":"Karlsplatz","dep":"2015-10-02T22:14:19+02:00","cnt":4,"coord":{"lat":16.3696266443499,"lng":48.2003468882865}}],"b":[4423,{"name":"Stadtpark","dep":"2015-10-02T22:11:19+02:00","cnt":1,"coord":{"lat":16.3797045857124,"lng":48.202834635245}}],"dur":180,"cnt":60,"elapsed":56},{"a":[4425,{"name":"Wien Mitte-Landstraße","dep":"2015-10-02T22:13:19+02:00","cnt":3,"coord":{"lat":16.3849013036542,"lng":48.2068884928784}}],"b":[4427,{"name":"Schwedenplatz","dep":"2015-10-02T22:11:19+02:00","cnt":1,"coord":{"lat":16.3781379720207,"lng":48.2118734058631}}],"dur":120,"cnt":60,"elapsed":56},{"a":[4439,{"name":"Spittelau","dep":"2015-10-02T22:17:19+02:00","cnt":7,"coord":{"lat":16.3585973388896,"lng":48.2348654941687}}],"b":[4435,{"name":"Heiligenstadt","dep":"2015-10-02T22:10:22+02:00","cnt":null,"coord":{"lat":16.3657126383479,"lng":48.2481647787235}}],"dur":416,"cnt":0,"elapsed":0}]'
]
const U4H_TOPO = '[[4401,{"name":"Hütteldorf","coord":{"lat":16.2616900341892,"lng":48.1967033921057}}],[4403,{"name":"Ober St. Veit","coord":{"lat":16.2761421051764,"lng":48.1922152206823}}],[4405,{"name":"Unter St. Veit","coord":{"lat":16.2862309151268,"lng":48.191059913826}}],[4407,{"name":"Braunschweiggasse","coord":{"lat":16.2958489362735,"lng":48.1893909421753}}],[4409,{"name":"Hietzing","coord":{"lat":16.3048074382037,"lng":48.1875411225411}}],[4411,{"name":"Schönbrunn","coord":{"lat":16.3188756298956,"lng":48.1860242352856}}],[4413,{"name":"Meidling Hauptstraße","coord":{"lat":16.3278462545748,"lng":48.1836150390959}}],[4437,{"name":"Längenfeldgasse","coord":{"lat":16.3350274604032,"lng":48.1848294222246}}],[4415,{"name":"Margaretengürtel","coord":{"lat":16.3430565952858,"lng":48.1884624935717}}],[4417,{"name":"Pilgramgasse","coord":{"lat":16.3543418369313,"lng":48.192148491652}}],[4419,{"name":"Kettenbrückengasse","coord":{"lat":16.3580963578673,"lng":48.1966084835194}}],[4421,{"name":"Karlsplatz","coord":{"lat":16.3696266443499,"lng":48.2003468882865}}],[4423,{"name":"Stadtpark","coord":{"lat":16.3797045857124,"lng":48.202834635245}}],[4425,{"name":"Wien Mitte-Landstraße","coord":{"lat":16.3849013036542,"lng":48.2068884928784}}],[4427,{"name":"Schwedenplatz","coord":{"lat":16.3781379720207,"lng":48.2118734058631}}],[4429,{"name":"Schottenring","coord":{"lat":16.3720190919918,"lng":48.2166328870559}}],[4431,{"name":"Roßauer Lände","coord":{"lat":16.3676222777947,"lng":48.2223538520703}}],[4433,{"name":"Friedensbrücke","coord":{"lat":16.3643548168789,"lng":48.2275707529209}}],[4439,{"name":"Spittelau","coord":{"lat":16.3585973388896,"lng":48.2348654941687}}],[4435,{"name":"Heiligenstadt","coord":{"lat":16.3657126383479,"lng":48.2481647787235}}]]'
