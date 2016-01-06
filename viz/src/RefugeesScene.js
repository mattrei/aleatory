global.THREE = require('three')
import Scene from './Scene'

const random = require('random-float')
const randomInt = require('random-int')

const TWEEN = require('tween.js')
const tweenr = require('tweenr')()
const Tween = require('tween-chain')

import randomSphere from 'gl-vec3/random'

const sineInOut = require('eases/sine-in-out')

const Boid = require('boid')


class Demo extends Scene {
  constructor(args)
  {
    super(args, {
      headlines: true
    }, new THREE.Vector3(0,45,240))

    this.currIdx = 0

    this.curr = "hello world"

    // demo
    super.onData({headlines: require('./test_data/headlines.json')})

    this.flockingSpeed = 3

    this.system = null

    this.createBackground()

    //this.initParticulate()

    this.createHeadlines()
  }

  createBackground()
  {
      let intensity = 200

      var sphere = new THREE.SphereGeometry( 0.5, 16, 8 );

      let light1 = new THREE.PointLight( 0xffffff, intensity, 50 );
        light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) ) );
        this.scene.add( light1 );

      let light2 = new THREE.PointLight( 0xffffff, intensity, 50 );
        light2.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) ) );
        this.scene.add( light2 );

      let light3 = new THREE.PointLight( 0xffffff, intensity, 50 );
        light3.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) ) );
        this.scene.add( light3 );


      let light4 = new THREE.PointLight( 0xffffff, intensity, 50 );
        light4.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffffff } ) ) );
        this.scene.add( light4 );


        this.scene.add( new THREE.AmbientLight( 0x444444 ) );
        var dlight = new THREE.DirectionalLight( 0xffffff, 2.0 );
        dlight.position.set( 0, 0, 0 ).normalize();
        this.scene.add( dlight );

  }

  startGUI(gui)
  {
    gui.add(this, 'shuffle')
    gui.add(this, 'resetLast')
    gui.add(this, 'showNext')
    gui.add(this, 'flockingSpeed', 0, 20)
  }

  createHeadlines()
  {

    const SPREAD = 200
    let createText = (text) => {
          let material = new THREE.MeshNormalMaterial();

          material =  new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0xffffff, metal: true})

          let pos = 0
          let meshes = []
          for (var i=0; i < text.length; i++) {
            let c = text[i]

            let shapes = THREE.FontUtils.generateShapes( c, {
              font: "oswald",
              weight: "normal",
              size: 10
            } ),
              textGeom = new THREE.ShapeGeometry( shapes )

            /*
            var textGeom = new THREE.TextGeometry( c, {
                    font: 'helvetiker',
                    size: 10
                });*/
            textGeom.computeBoundingBox();
            let w = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;

            var textMesh = new THREE.Mesh( textGeom, material );
            textMesh.relposition = new THREE.Vector3()
            textMesh.relposition.x = pos

            var p = new THREE.Object3D();
            p.position.x = random(-SPREAD, SPREAD)
            p.position.y = random(-SPREAD, SPREAD)
            p.position.z = random(0, -SPREAD*2)

            textMesh.randposition = p.position
            textMesh.position.copy(p.position)

            textMesh.rotation.x = Math.random() * Math.PI * 2;
            textMesh.rotation.y = Math.random() * Math.PI * 2;
            textMesh.rotation.z = Math.random() * Math.PI * 2;

            if (c === ' ') {
              w = 2
            }
            pos += w + 2

            material.side = THREE.DoubleSide;
            this.scene.add( textMesh );
            meshes.push(textMesh)
          }

          return meshes
    }


    this.data.headlines.forEach(h => {
      let meshes = createText(h.title)
      h.meshes = meshes
      h.meshes.forEach(m => {

        var boid = new Boid()
        boid.setBounds(window.innerWidth, window.innerHeight)
        boid.position.x = m.position.x
        boid.position.y = m.position.y
        boid.maxSpeed = this.flockingSpeed
        boid.velocity.x = random(5, 10)
        boid.velocity.y = random(5, 10)

        //m.boid = wanderer

        this.events.on('tick', t => {
          if (!m.isShown) {
            boid.wander().update()
            boid.maxSpeed = this.flockingSpeed
            m.position.x = boid.position.x - window.innerWidth / 2
            m.position.y = boid.position.y - window.innerHeight / 2
          }
        })

      })
    })
  }


  shuffle()
  {
    const DURATION = 2
    const SPREAD = 400

    let randPos = () => {
            return new THREE.Vector3(
              THREE.Math.randFloatSpread(SPREAD),
              THREE.Math.randFloatSpread(SPREAD),
              THREE.Math.randFloatSpread(SPREAD))
      },
      randRot = ()  => {
        return new THREE.Vector3(
              THREE.Math.randFloatSpread(Math.PI*2),
              THREE.Math.randFloatSpread(Math.PI*2),
              THREE.Math.randFloatSpread(Math.PI*2))
      }


    this.data.headlines.forEach(h => {
      h.meshes.forEach(m => {

        let p = randPos()
        let r = randRot()
        m.isShuffled = true

        tweenr.to(m.position, {
          x: p.x, y: p.y, z: p.z, duration: random(DURATION, DURATION*2) ,
          ease: sineInOut
        }).on('complete', () => m.isShuffled = false)

        tweenr.to(m.rotation, {
          x: r.x, y: r.y, z: r.z, duration: random(DURATION, DURATION*2) ,
          ease: sineInOut
        })

      })

    })

  }

  resetLast() {
    let oh = this.data.headlines[this.currIdx - 1 % this.data.headlines.length]
    oh.meshes.forEach(m => {

      new TWEEN.Tween( m.position )
            .to( { x: m.randposition.x, y: m.randposition.y, z: m.randposition.z },
                random(2000,4000 ))
            .easing( TWEEN.Easing.Exponential.InOut )
            .onComplete(() => {
              m.isShown = false
            })
            .start();

          new TWEEN.Tween( m.rotation )
            .to( { x: Math.random() * Math.PI * 2,
                  y: Math.random() * Math.PI * 2,
                  z: Math.random() * Math.PI * 2 },
                random(2000, 4000))
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
    })
  }

  showNext()
  {


    let h = this.data.headlines[this.currIdx++ % this.data.headlines.length]
    let duration = 2000
    console.log(h.meshes)
    h.meshes.forEach(m => {
      m.isShown = true

      tweenr.to(m.position, {
        x: m.relposition.x, y: m.relposition.y, z: m.relposition.z, duration: random(2,4)
      })

      tweenr.to(m.rotation, {
        x: 0, y: 0, z: 0, duration: random(2,4)
      })
      /*
      new TWEEN.Tween( m.position )
            .to( { x: m.relposition.x, y: m.relposition.y, z: m.relposition.z }, Math.random() * DURATION + DURATION )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();

          new TWEEN.Tween( m.rotation )
            .to( { x: 0, y: 0, z: 0 }, Math.random() * DURATION + DURATION )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
            */
    })


  }

  animate()
  {
      let time = Date.now() * 0.00025;
      let d = 150

        this.lights.l1.position.x = Math.sin( time * 0.7 ) * d;
        this.lights.l1.position.z = Math.cos( time * 0.3 ) * d;

        this.lights.l2.position.x = Math.cos( time * 0.3 ) * d;
        this.lights.l2.position.z = Math.sin( time * 0.7 ) * d;

        this.lights.l3.position.x = Math.sin( time * 0.7 ) * d;
        this.lights.l3.position.z = Math.sin( time * 0.5 ) * d;

        this.lights.l4.position.x = Math.sin( time * 0.3 ) * d;
        this.lights.l4.position.z = Math.sin( time * 0.5 ) * d;





  }

  tick(time, delta) {
      TWEEN.update()
  }
}

export default Demo;
