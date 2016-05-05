
//https://github.com/brunoimbrizi/experiments/blob/master/07/src/view/LineView.coffee
function metro() {
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

export default metro
