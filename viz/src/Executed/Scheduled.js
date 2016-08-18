import AObject from '../AObject'
const simplex = new(require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')

const newArray = require('new-array')

const NUM_PARTICLES = 100000,
    MAX_PARTICLE_DIST = 3000

export
default class Scheduled extends AObject {
    constructor(name, conf, renderer, loader, aaa, camera) {
        super(name, conf)

        this.renderer = renderer
        this.loader = loader
        this.aaa = aaa
        this.camera = camera

        this.ready = false
        this.tick = 0

        this.meshes = []
        this.currentIdx = 0
    }

    drawScheduledText() {

        let particleImg = THREE.ImageUtils.loadTexture('/dist/assets/Executed/particle.png')

        var particleShader = THREE.ParticleShader;
        var particleUniforms = THREE.UniformsUtils.clone(particleShader.uniforms);
        particleUniforms.texture.value = particleImg;
        particleUniforms.fog.value = 1;


        var particleMaterial = new THREE.ShaderMaterial({

            uniforms: particleUniforms,
            vertexShader: particleShader.vertexShader,
            fragmentShader: particleShader.fragmentShader,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });

        var textGeo = new THREE.TextGeometry("asdf");
        const particleCount = 50000

        let points = THREE.GeometryUtils.randomPointsInGeometry(textGeo, particleCount);

        let data = new Float32Array(particleCount * 3);

        var colors = new Float32Array(NUM_PARTICLES * 3);

        for (var i = 0, j = 0, l = data.length; i < l; i += 3, j += 1) {
            data[i] = points[j].x;
            data[i + 1] = points[j].y;
            data[i + 2] = points[j].z;
            //data[ i + 3 ] = 0.0;

            colors[i + 0] = 0.5;
            colors[i + 1] = 1.0;
            colors[i + 2] = 0.2;
        }

        var velData = new Float32Array(particleCount * 4);
        for (var i = 0, l = velData.length; i < l; i += 4) {
            velData[i] = (Math.random() - 0.5) * 0.004;
            velData[i + 1] = (Math.random() - 0.5) * 0.004;
            velData[i + 2] = (Math.random() - 0.5) * 0.004;
            velData[i + 3] = 0.0;
        }
        var randomSeedData = new Uint32Array(particleCount);
        for (var i = 0; i < randomSeedData.length; ++i) {
            randomSeedData[i] = Math.random() * 2147483647;
        }

        let sizes = new Float32Array(particleCount);
        for (var i = 0; i < randomSeedData.length; ++i) {
            sizes[i] = 20
        }

        let geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.BufferAttribute(data, 3));
        //geometry.addAttribute( 'velocity', new THREE.BufferAttribute( velData, 4 ) );
        //geometry.addAttribute( 'randomSeed', new THREE.BufferAttribute( randomSeedData, 1, false, true ) );
        geometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
        geometry.addAttribute('size', new THREE.BufferAttribute(colors, 3));

        var dot = new THREE.Points(geometry, particleMaterial)
        this.add(dot)
    }

    doNext() {

        const oldMesh = this.meshes[this.currentIdx % this.meshes.length]
        this.currentIdx += 1
        const newMesh = this.meshes[this.currentIdx % this.meshes.length]


        tweenr.to(oldMesh.material, {
            opacity: 0,
            duration: 2
        })
            .on('complete', _ => {
                oldMesh.visible = false
                newMesh.visible = true
            })
        tweenr.to(newMesh.material, {
            opacity: 1,
            delay: 2,
            duration: 5
        })
    }

    _getPixel(imgData, x, y) {
        let r, g, b, a, offset = x * 4 + y * 4 * imgData.width;
        r = imgData.data[offset];
        g = imgData.data[offset + 1];
        b = imgData.data[offset + 2];
        a = imgData.data[offset + 3];

        return Math.floor((r + g + b) / 256)
    }

    _getImgData(pic) {

        return new Promise(function(resolve, reject) {

            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            var image = new Image();
            image.src = pic;
            image.onload = function() {

                canvas.width = image.width;
                canvas.height = image.height;
                context.drawImage(image, 0, 0);
                var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
                resolve(imgData)
            }

        })

    }

    loadData(data, particle) {

        data.forEach(s => {
            this.loader.load(s.img, (texture) => {
                texture.minFilter = THREE.LinearFilter

                this._getImgData(s.img).then((imgData => {

                    const particleMaterial = new THREE.ShaderMaterial({

                        uniforms: {
                            color: {
                                value: new THREE.Color(0xffffff)
                            },
                            texture: {
                                value: particle
                            },
                            fog: {
                                value: 1.0
                            }
                        },
                        vertexShader: scheduledVS,
                        fragmentShader: scheduledFS,
                        blending: THREE.AdditiveBlending,
                        depthTest: false,
                        transparent: true
                    });

                    const geometry = new THREE.BufferGeometry();

                    const positions = new Float32Array(NUM_PARTICLES * 3),
                        colors = new Float32Array(NUM_PARTICLES * 3),
                        sizes = new Float32Array(NUM_PARTICLES);

                    var color = new THREE.Color();

                    let imageScale = 25,
                        zSpread = 200


                    for (let i = 0, i3 = 0; i < NUM_PARTICLES; i++, i3 += 3) {

                        let position = new THREE.Vector3(
                            random(-MAX_PARTICLE_DIST, MAX_PARTICLE_DIST),
                            random(-MAX_PARTICLE_DIST, MAX_PARTICLE_DIST),
                            random(-MAX_PARTICLE_DIST, MAX_PARTICLE_DIST)
                        );

                        let color = new THREE.Color(0xffffff)
                        let size = 10

                        var gotIt = false;

                        // Randomly select a pixel
                        const x = Math.round(imgData.width * Math.random()),
                            y = Math.round(imgData.height * Math.random()),
                            bw = this._getPixel(imgData, x, y)

                        // Read color from pixel
                        if (bw > 1) {
                            // If black, get position

                            position = new THREE.Vector3(
                                (imgData.width / 2 - x) * imageScale, (y - imgData.height / 2) * imageScale,
                                Math.random() * zSpread * 2 - Math.random() * zSpread
                            )

                            color = new THREE.Color(0xff00ff)
                            size = 20
                        }
                        // Position
                        positions[i3 + 0] = position.x;
                        positions[i3 + 1] = position.y;
                        positions[i3 + 2] = position.z;

                        // Color
                        colors[i3 + 0] = color.r;
                        colors[i3 + 1] = color.g;
                        colors[i3 + 2] = color.b;

                        // Size
                        sizes[i] = 20
                    }

                    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
                    geometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
                    geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));

                    let points = new THREE.Points(geometry, particleMaterial);
                    points.visible = false
                    this.add(points)

                    this.meshes.push(points)

                    super.tick(dt => {
                        points.rotation.x = -dt * 0.02;
                        points.rotation.y = -dt * 0.02;
                        points.rotation.z = Math.PI - dt * 0.004;
                    })

                }))
            })

        })

    }


    init() {


        super.on('doNext', p => this.doNext())

        const texture = this.loader.load('/dist/assets/Executed/particle.png')

        super.on('data', data => this.loadData(data, texture))
        if (this.conf.data) this.loadData(this.conf.data, texture)
    }

    update(dt) {
        super.update(dt)
    }
}



const scheduledFS = glslify(`
uniform vec3 color;
uniform sampler2D texture;
uniform float useTexture;
uniform float fog;

varying vec3 vColor;

void main() {

  float fogFactor = fog;

  if (fogFactor == 0.0) {
    float depth = gl_FragCoord.z / gl_FragCoord.w;
    fogFactor = smoothstep( 200.0, 100.0, depth );
  }

  gl_FragColor = vec4( (color * vColor) * fogFactor, 1.0 );
  gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );

}


`, {
    inline: true
})

const scheduledVS = glslify(`
attribute float size;
attribute vec3 customColor;

varying vec3 vColor;

void main() {

  vColor = customColor;

  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

  gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );

  gl_Position = projectionMatrix * mvPosition;

}

`, {
    inline: true
})