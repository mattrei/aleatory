global.THREE = require('three')
import Scene from './Scene'


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


// TODO
// http://makiopolis.com/

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

    this.intro()
    //this.background()
    //this.haltestellen()
    //this.spirals()
    this.metro()
  }

  intro() {

    const VIS = 'intro'
    const conf = {on: true, num: 100, dist: 500}
    const group = new THREE.Group()
    group.visible = conf.on
    this.scene.add(group)

    this.loader.load('/assets/WienerLinien/particle.png', texture =>  {

      const geometry = new THREE.Geometry(),
        material = new THREE.PointsMaterial({
          color: 0xFFFFFF,
          size: 16,
          //opacity: 0,
          blending: THREE.AdditiveBlending,
          depthTest: false,
          map: texture,
          transparent: true
        })

      for (let i = 0; i < conf.num; i++) {
        const v = new THREE.Vector3(THREE.Math.randFloatSpread(conf.dist), THREE.Math.randFloatSpread(conf.dist), THREE.Math.randFloatSpread(conf.dist))
        geometry.vertices.push(v)
      }


        const points = new THREE.Points(geometry, material)

        const materialLine = new THREE.LineBasicMaterial({
          color: 0xFFFFFF,
          opacity: .6,
          transparent: true
        });
        const line = new THREE.Line(geometry.clone(), materialLine)
        group.add(points)
        group.add(line)


        this.events.on('tick', t => {
          points.rotation.x += Math.PI / 1800;
          line.rotation.x += Math.PI / 1800;
        })
    })



    super.addVis(VIS, conf)

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
    const conf = {on: false}

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

  metro() {
    const VIS = 'metro'
    const conf = {on: false, text: true, train: true}

    const group = new THREE.Group(),
      textGroup = new THREE.Group(),
      trainGroup = new THREE.Group()
    this.scene.add(group)
    group.add(textGroup)
    group.add(trainGroup)
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

            t.push(i)// push the index as 3rd element

            let id = t[0],
               e = t[1]

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
          line._spline = spline
          line._topo = topo
          line._name = u
          line._trains = []
          group.add(line)
          meshes.push(line)
        }
    })

    this.events.on(VIS + '::text', p => textGroup.visible = p)
    this.events.on(VIS + '::train', p => trainGroup.visible = p)

    this.events.on(VIS + '::visOn', _ => group.visible = true)
    this.events.on(VIS + '::visOff', _ => group.visible = false)


    this.events.on(VIS + '::data', data => {
        let trainGeom = new THREE.BoxGeometry(10, 5, 4),
          trainMat = new THREE.MeshBasicMaterial({
            color: 0xffff00
          });

        meshes.forEach(m => {



          if (m._name !== 'au4') {

          let spline = m._spline,
            topo = m._topo,
            name = m._name

            let dists = spline.getLengths(topo.length-1)

            const live = data[name]
            console.log(name)
            console.log(live)

            live.forEach(t => {
              //console.log(t)
              let stationA = 0,
                  stationB = 0,
                  stationAName = '',
                  stationBName = ''

              topo.forEach(to => {
                if (to[0] === t.a[0]) {
                  stationA = to[2]
                  stationAName = to[1].name
                }
                if (to[0] === t.b[0]) {
                  stationB = to[2]
                  stationBName = to[1].name
                }
              })


              let a = dists[stationA],
                b = dists[stationB],
                p = t.cnt / t.dur,
                pos = (Math.abs(a-b) * p) + a,
                posArc = pos / spline.getLength(),
                bArc = b / spline.getLength()

              // get a train that has a simmilar posArc
              const RANGE = 0.1
              let train = null
              m._trains.forEach(_ => {
                if (Math.abs(_.posArc - posArc) <= RANGE) {
                  train = _
                  if (_.posArc < posArc) train.posArc = posArc
                }
              })
              if (!train) {
                train = new THREE.Mesh(trainGeom, trainMat)


                train.posArc = posArc
                train._line = m

                m._trains.push(train)
                trainGroup.add(train)

              }


              train.stepPerSecond = Math.abs(train.posArc - bArc) / t.dur

              //console.log("a " + stationAName + " b "  + stationBName )
              //console.log("dur " + t.dur + " arc " + posArc + " " + bArc + " sps " + train.stepPerSecond)
            })

          }
        })




    })


    let lastTime = 0
    this.events.on('tick', t => {

      if (Math.floor(t.time) - lastTime > 1) {
        lastTime = Math.floor(t.time)
      } else {
        return
      }

      meshes.forEach(m => {

        m._trains.forEach(t => {

          t.posArc += t.stepPerSecond
          if (t.posArc <= 1) {
            t.position.copy( t._line._spline.getPointAt(t.posArc) )
          } else {
             t._ended = true
          }
        })
      })

    })

    super.addVis(VIS, conf)
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

export default WienerLinien
