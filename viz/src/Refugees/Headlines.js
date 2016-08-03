import Boid from 'boid'
import AObject from '../AObject'

const DURATION = 2000

export
default class Headlines extends AObject {
    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this.currIdx = 0
        this.curr = "hello world"
        this.lights = {
            l1: null,
            l2: null,
            l3: null,
            l4: null
        }


        this.flockingSpeed = 3

        this.startStats();
        this.startGUI();

        this.system = null
        this.renderer = null;
        this.camera = null;
        this.scene = null;
        this.counter = 0;
        this.clock = new THREE.Clock();

        this.createRender();
        this.createScene();
        this.addObjects();
        this.addLights()

        //this.initParticulate()

        this.onResize();
        this.update();

        this.init()
    }

    headlines() {

        const VIS = 'headlines'
        const conf = {
            on: false,
            speed: 1
        }

        let group = new THREE.Group()
        this.scene.add(group)
        group.visible = conf.on

        this.events.on(VIS + '::visOn', _ => group.visible = true)
        this.events.on(VIS + '::visOff', _ => group.visible = false)

        const meshes = [],
            descriptions = []
        let mIdx = 0


        const SPREAD = 200
        let boidText = (text) => {
            let material = new THREE.MeshNormalMaterial();

            material = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                specular: 0xffffff,
                metal: true
            })

            let pos = 0
            let textMeshes = []
            for (var i = 0; i < text.length; i++) {
                let c = text[i]

                let shapes = THREE.FontUtils.generateShapes(c, {
                        font: "oswald",
                        weight: "normal",
                        size: 10
                    }),
                    textGeom = new THREE.ShapeGeometry(shapes)

                /*
            var textGeom = new THREE.TextGeometry( c, {
                    font: 'helvetiker',
                    size: 10
                });*/
                textGeom.computeBoundingBox();
                let w = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;

                var textMesh = new THREE.Mesh(textGeom, material);
                textMesh.relposition = new THREE.Vector3()
                textMesh.relposition.x = pos

                var p = new THREE.Object3D();
                p.position.x = THREE.Math.randFloatSpread(SPREAD)
                p.position.y = THREE.Math.randFloatSpread(SPREAD)
                p.position.z = THREE.Math.randFloatSpread(SPREAD)

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
                group.add(textMesh)
                textMeshes.push(textMesh)
            }

            return textMeshes
        }

        let staticText = (text => {
            let material = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                specular: 0xffffff,
                metal: true,
                transparent: true
            })

            let shapes = THREE.FontUtils.generateShapes(text, {
                    font: "oswald",
                    weight: "normal",
                    size: 10
                }),
                geometry = new THREE.ShapeGeometry(shapes)

            geometry.center()
            let mesh = new THREE.Mesh(geometry, material);
            mesh.visible = false
            group.add(mesh)
            return mesh
        })

        const BOUNDS = {
            x: window.innerWidth,
            y: window.innerHeight
        }
        this.events.on(VIS + '::data', data => {

            data.forEach(headline => {

                const text = headline.date + ' ' + headline.title + ' ' + headline.source

                let textMeshes = boidText(text)
                meshes.push(textMeshes)

                let descriptionMesh = staticText(headline.descr)
                descriptions.push(descriptionMesh)

                textMeshes.forEach(m => {

                    var boid = new Boid()
                    boid.setBounds(BOUNDS.x, BOUNDS.y)
                    boid.position.x = m.position.x
                    boid.position.y = m.position.y
                    boid.maxSpeed = this.flockingSpeed * 2
                    boid.velocity.x = random(5, 10)
                    boid.velocity.y = random(5, 10)

                    this.events.on('tick', t => {
                        if (!m.isShown) {
                            boid.wander().update()
                            boid.maxSpeed = conf.speed
                            m.position.x = boid.position.x - window.innerWidth / 2
                            m.position.y = boid.position.y - window.innerHeight / 2
                        }
                    })

                })
            })

        })



        const DUR = 2

        const doNext = () => {



            let descr = descriptions[mIdx % descriptions.length]
            descr.visible = true
            descr.position.set(0, 0, 100)
            descr.material.opacity = 0

            tweenr.to(descr.material, {
                opacity: 1,
                duration: random(DUR * 2, DUR * 4)
            })

            let textMeshes = meshes[mIdx % meshes.length]
            textMeshes.forEach(m => {
                m.isShown = true

                tweenr.to(m.position, {
                    x: m.relposition.x,
                    y: m.relposition.y,
                    z: m.relposition.z,
                    duration: random(DUR, DUR * 2)
                })

                tweenr.to(m.rotation, {
                    x: 0,
                    y: 0,
                    z: 0,
                    duration: random(DUR, DUR * 2)
                })
            })

            mIdx += 1
        }

        this.events.on(VIS + '::doNext', _ => doNext())
        conf.doNext = doNext


        const doReset = () => {

            let descr = descriptions[mIdx - 1 % descriptions.length]

            tweenr.to(descr.material, {
                opacity: 0,
                duration: random(DUR * 2, DUR * 4)
            })
                .on('complete', () => descr.visible = false)

            let textMeshes = meshes[mIdx - 1 % meshes.length]
            textMeshes.forEach(m => {

                tweenr.to(m.position, {
                    x: m.randposition.x,
                    y: m.randposition.y,
                    z: m.randposition.z,
                    duration: random(DUR, DUR * 2)
                })
                    .on('complete', () => m.isShown = false)

                tweenr.to(m.rotation, {
                    x: random(0, Math.PI * 2),
                    y: random(0, Math.PI * 2),
                    z: random(0, Math.PI * 2),
                    duration: random(DUR, DUR * 2)
                })

            })
        }

        this.events.on(VIS + '::doReset', _ => doReset())
        conf.doReset = doReset


        const doShuffle = () => {
            const DURATION = 2
            const SPREAD = 400

            let randPos = () => {
                    return new THREE.Vector3(
                        THREE.Math.randFloatSpread(SPREAD),
                        THREE.Math.randFloatSpread(SPREAD),
                        THREE.Math.randFloatSpread(SPREAD))
                },
                randRot = () => {
                    return new THREE.Vector3(
                        THREE.Math.randFloatSpread(Math.PI * 2),
                        THREE.Math.randFloatSpread(Math.PI * 2),
                        THREE.Math.randFloatSpread(Math.PI * 2))
                }


            meshes.forEach(textMeshes => {
                textMeshes.forEach(m => {

                    let p = randPos()
                    let r = randRot()
                    m.isShuffled = true

                    tweenr.to(m.position, {
                        x: p.x,
                        y: p.y,
                        z: p.z,
                        duration: random(DURATION, DURATION * 2),
                        ease: sineInOut
                    }).on('complete', () => m.isShuffled = false)

                    tweenr.to(m.rotation, {
                        x: r.x,
                        y: r.y,
                        z: r.z,
                        duration: random(DURATION, DURATION * 2),
                        ease: sineInOut
                    })

                })

            })
        }

        // TODO needed?
        this.events.on(VIS + '::doShuffle', _ => doShuffle())
        conf.doShuffle = doShuffle

        super.addVis(VIS, conf)

    }

    animate() {
        let time = Date.now() * 0.00025;
        let d = 150

        this.lights.l1.position.x = Math.sin(time * 0.7) * d;
        this.lights.l1.position.z = Math.cos(time * 0.3) * d;

        this.lights.l2.position.x = Math.cos(time * 0.3) * d;
        this.lights.l2.position.z = Math.sin(time * 0.7) * d;

        this.lights.l3.position.x = Math.sin(time * 0.7) * d;
        this.lights.l3.position.z = Math.sin(time * 0.5) * d;

        this.lights.l4.position.x = Math.sin(time * 0.3) * d;
        this.lights.l4.position.z = Math.sin(time * 0.5) * d;
    }


    background() {
        let intensity = 200

        var sphere = new THREE.SphereGeometry(0.5, 16, 8);

        let light1 = new THREE.PointLight(0xffffff, intensity, 50);
        light1.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({
            color: 0xffffff
        })));
        this.scene.add(light1);

        let light2 = new THREE.PointLight(0xffffff, intensity, 50);
        light2.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({
            color: 0xffffff
        })));
        this.scene.add(light2);

        let light3 = new THREE.PointLight(0xffffff, intensity, 50);
        light3.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({
            color: 0xffffff
        })));
        this.scene.add(light3);


        let light4 = new THREE.PointLight(0xffffff, intensity, 50);
        light4.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({
            color: 0xffffff
        })));
        this.scene.add(light4);


        this.scene.add(new THREE.AmbientLight(0x444444));
        var dlight = new THREE.DirectionalLight(0xffffff, 2.0);
        dlight.position.set(0, 0, 0).normalize();
        this.scene.add(dlight);

    }

}