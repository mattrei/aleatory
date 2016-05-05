const MAX = 100
const VISIBLE_HS = 5

const random = require('random-float')
const randomInt = require('random-int')
const glslify = require('glslify')

const simplex = new(require('simplex-noise'))
const smoothstep = require('smoothstep')

require('../utils/THREE.MeshLine')

let resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );

const HALTESTELLEN = require('./WienerLinienHaltestellen.json'),
 HALTESTELLEN_KEYS = Object.keys(HALTESTELLEN),
 HALTESTELLEN_LENGTH = HALTESTELLEN_KEYS.length

 const VIS = 'stations'
 const conf = {on: true}


 function _randHaltestelle() {
    return HALTESTELLEN[HALTESTELLEN_KEYS[
      randomInt(0, HALTESTELLEN_LENGTH-1)]]['NAME']
  }

function text(scene) {

  const c = scene.getTextCanvas()

  c.lineWidth   = 15;
  c.strokeRect(window.innerWidth/2-200,window.innerHeight/2-50,400,100);


  c.fillStyle="black";
  c.font = "80px Passion One";
  c.fontWeight = '900';
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("TRAFFIC", window.innerWidth/2, window.innerHeight/2);

}

function stations(scene) {
  const group = new THREE.Group()
  scene.getScene().add(group)
  group.visible = conf.on

  text(scene)
  background(group)
  ribbons(scene, group)
  names(scene, group)

  scene.getEvents().on(VIS + '::visOn', _ => group.visible = true)
  scene.getEvents().on(VIS + '::visOff', _ => group.visible = false)

  scene.addVis(VIS, conf)
}

function names(scene, group) {

   const meshes = []

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

  meshes.slice(0, 1).forEach(m => m.visible = true)

  let currentMesh = 1

  const [hh, wh] = [window.innerHeight/4, window.innerWidth/4]

  scene.getEvents().on('tick', t => {

      meshes.forEach((m, i) => {
        if(m.visible) {

          m.scale.x = m.scale.y = smoothstep(0, 1, 1 - m.position.z / -500 )
          m.position.z += t.delta + m._velocity

          if (m.position.z > 0) {
            m.visible = false

            let nm = meshes[currentMesh++ % meshes.length]
            nm._velocity = random(0.7, 1.9)
            nm.position.set(random(-wh, wh), random(-hh, hh), - 500)
            nm.scale.x = nm.scale.y = 0.1
            nm.visible = true
          }
        }
      })
  })


}


function background(group)
  {

      const top = 0xB4F3FD,
        middle = 0xFBFEA4,
        bottom = 0x5492DB,
        lightMix = 0xe7b300


      let skyGeo = new THREE.SphereGeometry( 750, 32, 15 );
      let skyMat = new THREE.ShaderMaterial( { vertexShader: glslify('./Sky.vert'),
                                              fragmentShader: glslify('./Sky.frag'),
                                              side: THREE.BackSide,
                                              uniforms: {
        topColor: 	 { type: "c", value: new THREE.Color(top) },
        middleColor: { type: "c", value: new THREE.Color(middle) },
        bottomColor: { type: "c", value: new THREE.Color(bottom) },

        endTopColor: 	 { type: "c", value: new THREE.Color(top) },
        endMiddleColor: { type: "c", value: new THREE.Color(middle) },
        endBottomColor: { type: "c", value: new THREE.Color(bottom) },

        lightMixColor: { type: "c", value: new THREE.Color(lightMix) },

        mixFactor:		 { type: "f", value: 0 },
        offset:		 { type: "f", value: 0 },
        exponent:	 { type: "f", value: 0.8 }
      },

                                             } );

      const sky = new THREE.Mesh( skyGeo, skyMat );
      group.add( sky );
  }


function ribbons(scene, group) {
  const LINE_LENGTH = 40

  let speed = 1.1,
    rotateSpeed = 1,
    smoothCoef = 0.05

  let smoothX = 0,
    smoothY = 0,
    smoothZ = 0

  let globalX = 0,
      globalY = 0,
      globalZ = 0

  const geometry = new Float32Array( LINE_LENGTH * 3 ),
	   geometryClone = new Float32Array( LINE_LENGTH * 3 )

  for( var j = 0; j < geometry.length; j += 3 ) {
     geometry[ j ] = geometry[ j + 1 ] = geometry[ j + 2 ] = j;
     geometryClone[ j ] = geometryClone[ j + 1 ] = geometryClone[ j + 2 ] = 0;
   }

   // line
   const line = new THREE.MeshLine();
   line.setGeometry( geometry );

   const lineClone = new THREE.MeshLine();
   lineClone.setGeometry( geometryClone );




		const material = new THREE.MeshLineMaterial({
      useMap: false,
      opacity: 1,
      color:new THREE.Color(0xffffff),
      lineWidth:6,
      transparent: true,
      resolution: resolution
    })
		const materialClone = new THREE.MeshLineMaterial({
      useMap: false,
      color:new THREE.Color(0xF1BBF5),
      lineWidth:4,
      opacity: 1,
      transparent: true,
      resolution: resolution
    })


    const mesh = new THREE.Mesh( line.geometry, material );
		const meshClone = new THREE.Mesh( lineClone.geometry, materialClone );


    group.add(mesh)
    group.add(meshClone)

    let dist = 0

    scene.getEvents().on('tick', t => {

      for( var j = 0; j < geometry.length; j+= 3 ) {
				geometry[ j ] = geometry[ j + 3 ] * speed;
				geometry[ j + 1 ] = geometry[ j + 4 ] * speed;
				geometry[ j + 2 ] = geometry[ j + 5 ] * speed;

				geometryClone[ j ] = geometryClone[ j + 3 ] * speed;
				geometryClone[ j + 1 ] = geometryClone[ j + 4 ] * speed;
				geometryClone[ j + 2 ] = geometryClone[ j + 5 ] * speed;
			}


      globalZ = 0;

      dist += 0.001
      const nx = simplex.noise2D(dist, t.time * 0.1),
        ny = simplex.noise2D(dist + 10, t.time * 0.1)
      globalX = nx * window.innerWidth * 0.25
      globalY = ny * window.innerHeight * 0.25


      smoothX += (globalX - smoothX) * smoothCoef;
      smoothY += (globalY - smoothY) * smoothCoef;
      smoothZ += (globalZ - smoothZ) * smoothCoef;

      geometry[ geometry.length - 3 ] = smoothX;
			geometry[ geometry.length - 2 ] = smoothY;
			geometry[ geometry.length - 1 ] = smoothZ;

			geometryClone[ geometryClone.length - 3 ] = smoothX + Math.sin(t.time * rotateSpeed * 3) * 10;
			geometryClone[ geometryClone.length - 2 ] = smoothY + Math.cos(t.time * rotateSpeed * 3) * 10;
			geometryClone[ geometryClone.length - 1 ] = smoothZ + Math.sin(t.time * rotateSpeed * 3) * 10;


      line.setGeometry( geometry, ( p ) => {
				return Math.sin(p * Math.PI);
			});

      lineClone.setGeometry( geometryClone, ( p ) => {
        return Math.sin(p * Math.PI);
      });


    })
}

function  spirals(scene) {

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

          const low = scene.getFreq(40, 100)
          const high = scene.getFreq(4400, 4500)
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


    scene.addVis(VIS, conf)
  }

export default stations
