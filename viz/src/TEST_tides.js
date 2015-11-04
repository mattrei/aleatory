function TransitionsCubes() {}

function TransitionsSphereNoise() {}

function TransitionsTriangles() {}

function TransitionsReflection() {}

function TransitionsCurlNoise() {
    this.lockMouseMove = !1
}

function startDemo() {
    console.log("[app] start. assetsAreLoaded = " + assetsAreLoaded), isDemoStarted = !0, assetsAreLoaded && runDemo()
}

function preloadAssets() {
    console.log("[app] preloading assets..."), audioLoader = new AudioBufferLoader(AUDIO_PATH + "Bronze_Whale_Tides_feat_Bamiyah.mp3", function(e) {
        console.log("[app] audioLoader callback, buffer = " + e), null == e ? alert("null buffer") : onSceneLoaded(0)
    }), initRenderer(), scenes.push({
        scene: null,
        ready: !1
    }), scenes.push({
        scene: new SceneCurlNoise,
        ready: !1
    }), scenes.push({
        scene: new SceneTriangles,
        ready: !1
    }), scenes.push({
        scene: new SceneReflection,
        ready: !1
    }), scenes.push({
        scene: new SceneCubes,
        ready: !1
    }), scenes.push({
        scene: new SceneSphereNoise,
        ready: !1
    }), audioLoader.load();
    for (var e = 1; e < scenes.length; e++) scenes[e].scene.init(onSceneLoaded, renderer)
}

function onSceneLoaded(e) {
    scenes[e].ready = !0;
    for (var t = 0; t < scenes.length; t++)
        if (0 == scenes[t].ready) return;
    console.log("[app] assetsAreLoaded"), assetsAreLoaded = !0, isDemoStarted && runDemo()
}

function runDemo() {
    init();
    for (var e = 1; e < scenes.length; e++) scenes[e].scene.update(camera, 0, 0);
    onWindowResize(), render(), audioLoader.play(0), audioLoader.setVolume(1), clock.start()
}

function initRenderer() {
    appWidth = window.innerWidth, appHeight = window.innerHeight, renderer = new THREE.WebGLRenderer({
        antialias: !0
    }), renderer.setClearColor(0), renderer.setSize(appWidth, appHeight)
}

function init() {
    appWidth = window.innerWidth, appHeight = window.innerHeight, camera = new THREE.PerspectiveCamera(60, appWidth / appHeight, .1, 1e4), camera.position.x = 0, camera.position.y = 0, camera.position.z = 40, camera.lookAt(new THREE.Vector3(0, 0, 0)), document.body.appendChild(renderer.domElement), window.addEventListener("resize", onWindowResize, !1)
}

function render() {
    var e = clock.getDelta();
    requestAnimationFrame(render), et = audioLoader.update(), times.length && et >= times[0].t && (sceneIndex = times[0].s, times.shift()), scenes[sceneIndex].scene.update(camera, et, e)
}

function onWindowResize() {
    appWidth = window.innerWidth, appHeight = window.innerHeight, camera.aspect = appWidth / appHeight, camera.updateProjectionMatrix(), renderer.setSize(appWidth, appHeight);
    for (var e = 1; e < scenes.length; e++) scenes[e].scene.resize()
}

function SceneSphereNoise() {
    this.transitions = new TransitionsSphereNoise, this.camera = new THREE.PerspectiveCamera(60, appWidth / appHeight, .1, 1e4), this.camera.position.x = 0, this.camera.position.y = 0, this.camera.position.z = 40, this.camera.lookAt(new THREE.Vector3(0, 0, 0)), this.iParticleSize = 0, this.iTurbulance = .2, this.iNoiseMult = 1, this.iSpeed = 0, this.clearColor = new THREE.Color(16777215)
}

function SceneCurlNoise() {
    this.transitions = new TransitionsCurlNoise, this.camera = new THREE.PerspectiveCamera(60, appWidth / appHeight, .1, 1e3), this.camera.position.x = 0, this.camera.position.y = 0, this.camera.position.z = 40, this.iParticleSize = 1, this.iTurbulance = 1, this.iRadius = 1.5 * Math.PI, this.iNoiseMult = 0, this.iSpeed = .2, this.iRotSpeed = 1, this.lockMouse = !1, this.mouseX = appWidth / 2, this.mouseY = appHeight / 2, this.posX = appWidth / 2, this.posY = appHeight / 2
}

function SceneTriangles() {
    this.transitions = new TransitionsTriangles, this.cameraPosition = new THREE.Vector3(0, 0, 40), this.triangleRotationXSpeed = .2, this.triangleRotationYSpeed = .1, this.triangleRotationZSpeed = .1, this.cloudRotationXSpeed = 0, this.cloudRotationYSpeed = 0, this.occlusionBuffer = null, this.colourBuffer = null, this.orthoScene = null, this.orthoCam = null, this.grShader = null, this.colorBufferPlane = null, this.rt = null
}

function SceneReflection() {
    this.transitions = new TransitionsReflection, this.cube = null, this.cube2 = null, this.terrain = null, this.rt = null, this.cameraPosition = new THREE.Vector3(-10, 10, 40), this.camZRot = 0, this.terrainDepth = 150, this.heightSegments = 26, this.particlesCount = 128, this.lookAtVec = new THREE.Vector3(0, 0, 0), this.hasChangedLookAt = !1
}

function SceneCubes() {
    this.transitions = new TransitionsCubes, this.camXPos = 8, this.camYPos = -12, this.camZPos = 100, this.zAngle = 0, this.cubesCount = 52, this.cubes = [], this.speedMult = 256, this.particlesCount = 64, this.mouseX = 0, this.mouseY = 0, this.posX = 0, this.posY = 0, this.fog, this.occlusionBuffer = null, this.colourBuffer = null, this.orthoScene = null, this.orthoCam = null, this.grShader = null, this.colorBufferPlane = null
}
TransitionsCubes.prototype.tweenCA = function(e) {
    e.grShader.uniforms.weight.value = .97, TweenLite.to(e.grShader.uniforms.decay, 1, {
        value: .95
    }), e.grShader.uniforms.amount.value = 50, TweenLite.to(e.grShader.uniforms.amount, 1, {
        value: 6
    }), e.light.intensity = 2, TweenLite.to(e.light, 1, {
        intensity: .5
    })
}, TransitionsCubes.prototype.list = [{
    time: 51.26,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 51.86,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 54.92,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 56.24,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 57.42,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 58.01,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 60.51,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 60.71,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 60.93,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 61,
    run: function(e) {
        TweenLite.to(e, 3, {
            camZPos: -100
        })
    }
}, {
    time: 63.61,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 63.82,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 64.02,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 67.28,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 69,
    run: function(e) {
        TweenLite.to(e, 5, {
            camZPos: 100
        })
    }
}, {
    time: 69.8,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 70.42,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 72.91,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 73.11,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 73.31,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 128.66,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 129.23,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 131.74,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 132.32,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 133,
    run: function(e) {
        TweenLite.to(e, 2.5, {
            camZPos: 5
        })
    }
}, {
    time: 134.83,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 135.03,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 135.21,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 137.97,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 138,
    run: function(e) {
        TweenLite.to(e, 15, {
            camZPos: 100
        })
    }
}, {
    time: 138.15,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 138.35,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 141.01,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 144.13,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 144.66,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 147.2,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 147.42,
    run: TransitionsCubes.prototype.tweenCA
}, {
    time: 147.65,
    run: TransitionsCubes.prototype.tweenCA
}], TransitionsSphereNoise.it = 1, TransitionsSphereNoise.prototype.sizeTween = function(e) {
    e.renderShader.uniforms.size.value = 2, TweenLite.to(e.renderShader.uniforms.size, .25, {
        value: 1
    }), e.renderShader.uniforms.radius.value = 2.8, TweenLite.to(e.renderShader.uniforms.radius, .25, {
        value: 3
    })
}, TransitionsSphereNoise.prototype.sizeTween2 = function(e, t) {
    TransitionsSphereNoise.it = TransitionsSphereNoise.it <= 10 ? 10 + 10 * Math.random() : 1.2 * Math.random();
    var i = TransitionsSphereNoise.it;
    TweenLite.to(e.renderShader.uniforms.size, 2 * t, {
        value: i
    }), 1.32 == t && TweenLite.to(e.computeShader.uniforms.speed, t, {
        value: -4.1
    })
}, TransitionsSphereNoise.prototype.lightTween = function(e) {
    e.light.intensity = 2, TweenLite.to(e.light, .35, {
        intensity: .5
    })
}, TransitionsSphereNoise.prototype.list = [{
    time: 100.75,
    run: function(e) {
        TweenLite.to(e.computeShader.uniforms.speed, 4, {
            value: 1
        }), e.renderShader.uniforms.clr.value = 10, TweenLite.to(e.renderShader.uniforms.clr, 6, {
            value: 0,
            delay: 2
        })
    }
}, {
    time: 113.19,
    run: TransitionsSphereNoise.prototype.sizeTween
}, {
    time: 113.77,
    run: TransitionsSphereNoise.prototype.sizeTween
}, {
    time: 115.37,
    run: TransitionsSphereNoise.prototype.sizeTween
}, {
    time: 116.3,
    run: TransitionsSphereNoise.prototype.sizeTween
}, {
    time: 116.89,
    run: TransitionsSphereNoise.prototype.sizeTween
}, {
    time: 118.44,
    run: TransitionsSphereNoise.prototype.sizeTween
}, {
    time: 119.31,
    run: TransitionsSphereNoise.prototype.sizeTween
}, {
    time: 119.93,
    run: TransitionsSphereNoise.prototype.sizeTween
}, {
    time: 121.51,
    run: TransitionsSphereNoise.prototype.sizeTween
}, {
    time: 122.43,
    run: TransitionsSphereNoise.prototype.sizeTween
}, {
    time: 125.8,
    run: function(e) {
        var t = {
            c: 1
        };
        TweenLite.to(t, 1, {
            c: 0,
            onUpdate: function() {
                var i = new THREE.Color(t.c, t.c, t.c);
                e.clearColor = i, e.cube.material.emissive = i
            }
        })
    }
}, {
    time: 150.37,
    run: function(e) {
        e.computeShader.uniforms.speed.value = -53, e.renderShader.blending = THREE.AdditiveBlending, e.renderShader.uniforms.clr.value = 1, e.cube.material.color = new THREE.Color(0), e.cube.material.emissive = new THREE.Color(0), e.cube.material.wireframe = !1
    }
}, {
    time: 150.4,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 150.54,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 150.74,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 153.1,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 153.07,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 153.15,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 154.75,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 155,
    run: function(e) {
        e.renderShader.uniforms.radius.value = 12, e.camera.lookAt(new THREE.Vector3(0, 4, 0)), e.computeShader.uniforms.noiseMult.value = 10, TransitionsSphereNoise.prototype.sizeTween2(e, 1.32)
    }
}, {
    time: 156.51,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 157.13,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 159.6,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 159.82,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 160.03,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 162.69,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 162.93,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 163.14,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 165.85,
    run: function(e) {
        TweenLite.to(e.computeShader.uniforms.noiseMult, 3, {
            value: 1
        })
    }
}, {
    time: 168.85,
    run: function(e) {
        e.computeShader.uniforms.speed.value = -53, e.renderShader.uniforms.radius.value = 3, e.camera.lookAt(new THREE.Vector3(0, 0, 0)), TransitionsSphereNoise.prototype.sizeTween2(e, 1.34), TweenLite.to(e.computeShader.uniforms.speed, 7, {
            value: -2
        }), TweenLite.to(e.renderShader.uniforms.size, 4, {
            value: 3,
            delay: 3
        })
    }
}, {
    time: 168.88,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 169.5,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 171.99,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 172.2,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 172.4,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 174.94,
    run: TransitionsSphereNoise.prototype.lightTween
}, {
    time: 174.99,
    run: TransitionsSphereNoise.prototype.lightTween
}], TransitionsTriangles.prototype.weightTween = function(e) {
    e.grShader.uniforms.weight.value = .5, TweenLite.to(e.grShader.uniforms.weight, .25, {
        value: .116
    }), e.light.intensity = 2, TweenLite.to(e.light, .25, {
        intensity: 1
    })
}, TransitionsTriangles.prototype.list = [{
    time: 38.8,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 39.21,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 39.59,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 39.99,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 40.38,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 40.78,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 41.15,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 41.55,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 41.93,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 42.33,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 42.71,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 43.12,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 43.48,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 43.88,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 44.27,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 44.65,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 45.05,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 45.44,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 45.82,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 46.21,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 46.59,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 46.96,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 47.38,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 47.77,
    run: TransitionsTriangles.prototype.weightTween
}, {
    time: 45.2,
    run: function(e) {
        TweenLite.to(e.grShader.uniforms.density, 3, {
            value: .8
        }), TweenLite.to(e.grShader.uniforms.decay, 3, {
            value: .97
        }), TweenLite.to(e.grShader.uniforms.weight, 3, {
            value: .08
        }), TweenLite.to(e.light, 3, {
            intensity: 3
        })
    }
}], TransitionsReflection.prototype.list = [{
    time: 76,
    run: function(e) {
        var t = {
            x: -10
        };
        TweenLite.to(t, 24, {
            x: 10,
            onUpdate: function(t) {
                e.cameraPosition.setX(t.x)
            },
            onUpdateParams: [t]
        }), TransitionsReflection.prototype.waveModifier(e, 2)
    }
}, {
    time: 76.07,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 76.26,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 76.44,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 77.4,
    run: function(e) {
        TransitionsReflection.prototype.waveModifier(e, .2)
    }
}, {
    time: 78.77,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 78.89,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 78.97,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 79.15,
    run: function(e) {
        TransitionsReflection.prototype.waveModifier(e, 2)
    }
}, {
    time: 80.1,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 80.26,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 80.47,
    run: function(e) {
        TransitionsReflection.prototype.waveModifier(e, .2)
    }
}, {
    time: 80.8,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 80.81,
    run: function(e) {
        var t = {
            y: 10
        };
        TweenLite.to(t, .75, {
            y: 5,
            onUpdate: function(t) {
                e.cameraPosition.setY(t.y)
            },
            onUpdateParams: [t]
        }), e.cube.material.uniforms.colourModifier.value = 1, e.cube2.material.uniforms.colourModifier.value = 1
    }
}, {
    time: 82.14,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 82.73,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 82.19,
    run: function(e) {
        TransitionsReflection.prototype.waveModifier(e, 2)
    }
}, {
    time: 83.54,
    run: function(e) {
        TransitionsReflection.prototype.waveModifier(e, .2)
    }
}, {
    time: 85.27,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 85.28,
    run: function(e) {
        TransitionsReflection.prototype.waveModifier(e, 2)
    }
}, {
    time: 85.31,
    run: function(e) {
        TweenLite.to(e.cube2.material.uniforms.colourModifier, 3, {
            value: 0
        }), TweenLite.to(e.terrain.material.uniforms.colourModifier, 1.5, {
            value: 0
        })
    }
}, {
    time: 85.49,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 85.69,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 86.63,
    run: function(e) {
        TransitionsReflection.prototype.waveModifier(e, .2)
    }
}, {
    time: 88.05,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 88.1,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 88.2,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 88.35,
    run: function(e) {
        TransitionsReflection.prototype.waveModifier(e, 2)
    }
}, {
    time: 88.41,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 88.59,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 88.78,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 89.69,
    run: function(e) {
        TransitionsReflection.prototype.waveModifier(e, .2)
    }
}, {
    time: 91.16,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 91.25,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 91.31,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 91.46,
    run: function(e) {
        TransitionsReflection.prototype.waveModifier(e, 2)
    }
}, {
    time: 92.53,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 92.71,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 92.86,
    run: function(e) {
        TransitionsReflection.prototype.waveModifier(e, .2)
    }
}, {
    time: 94.55,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 94.58,
    run: function(e) {
        TransitionsReflection.prototype.waveModifier(e, 2)
    }
}, {
    time: 95,
    run: function(e) {
        TweenLite.to(e.terrain.material.uniforms.colourModifier, 13, {
            value: 1
        })
    }
}, {
    time: 95.23,
    run: function(e) {
        TransitionsReflection.prototype.something(e)
    }
}, {
    time: 95.95,
    run: function(e) {
        TransitionsReflection.prototype.waveModifier(e, .2)
    }
}, {
    time: 97,
    run: function(e) {
        TweenLite.to(e.cube2.material.uniforms.colourModifier, 3, {
            value: 1
        })
    }
}], TransitionsReflection.prototype.waveModifier = function(e, t) {
    TweenLite.to(e.terrain.material.uniforms.modifier, 1, {
        value: t
    })
}, TransitionsReflection.prototype.something = function(e) {
    var t = e.cube.material.attributes,
        i = {
            s: 1 + 1 * Math.random(),
            i: Math.round(Math.random() * t.scale.value.length),
            m: 1 + .35 * Math.random()
        };
    TweenLite.to(i, .15 + .2 * Math.random(), {
        s: 1,
        m: 1,
        onUpdate: function() {
            e.cube.scale.set(i.m, i.m, i.m), e.cube2.scale.set(i.m + .06, i.m + .06, i.m + .06), t.scale.value[i.i] = i.s, t.scale.needsUpdate = !0
        }
    })
}, TransitionsCurlNoise.prototype.kickTween = function(e, t) {
    e.light.intensity = .8, TweenLite.to(e.light, .5, {
        intensity: .3
    }), e.computeShader.uniforms.radius.value = t, TweenLite.to(e.computeShader.uniforms.radius, .5, {
        value: 0,
        ease: Circ.easeIn
    })
}, TransitionsCurlNoise.prototype.list = [{
    time: 0,
    run: function(e) {
        e.computeShader.uniforms.rotSpeed.value = 1, TweenLite.to(e.computeShader.uniforms.rotSpeed, 14, {
            value: -2.2,
            ease: Circ.easeInOut
        }), e.computeShader.uniforms.speed.value = .2, e.computeShader.uniforms.noiseMult.value = 0, TweenLite.to(e.computeShader.uniforms.speed, 7, {
            value: 1.5,
            ease: Circ.easeInOut,
            delay: 7
        }), e.computeShader.uniforms.turbulance.value = 1.1
    }
}, {
    time: 14,
    run: function(e) {
        TransitionsCurlNoise.prototype.kickTween(e, 3 * Math.PI), TweenLite.to(e.computeShader.uniforms.rotSpeed, .54, {
            value: 0,
            ease: Circ.easeIn
        })
    }
}, {
    time: 14.54,
    run: function(e) {
        TransitionsCurlNoise.prototype.kickTween(e, 5 * Math.PI), TweenLite.to(e.computeShader.uniforms.speed, 1, {
            value: -1,
            ease: Circ.easeIn
        })
    }
}, {
    time: 17.12,
    run: function(e) {
        TransitionsCurlNoise.prototype.kickTween(e, 3 * Math.PI), TweenLite.to(e.computeShader.uniforms.noiseMult, .5, {
            value: 1,
            ease: Circ.easeIn
        })
    }
}, {
    time: 17.62,
    run: function(e) {
        TransitionsCurlNoise.prototype.kickTween(e, 5 * Math.PI)
    }
}, {
    time: 20.19,
    run: function(e) {
        TransitionsCurlNoise.prototype.kickTween(e, 3 * Math.PI)
    }
}, {
    time: 20.8,
    run: function(e) {
        TransitionsCurlNoise.prototype.kickTween(e, 5 * Math.PI), e.computeShader.uniforms.rotSpeed.value = 1, TweenLite.to(e.computeShader.uniforms.rotSpeed, 1, {
            value: 0,
            ease: Circ.easeIn
        })
    }
}, {
    time: 23.4,
    run: function(e) {
        TransitionsCurlNoise.prototype.kickTween(e, 3 * Math.PI), TweenLite.to(e.computeShader.uniforms.noiseMult, .5, {
            value: 0,
            ease: Circ.easeIn
        }), TweenLite.to(e.computeShader.uniforms.speed, 1, {
            value: 1,
            ease: Circ.easeIn
        })
    }
}, {
    time: 24,
    run: function(e) {
        TransitionsCurlNoise.prototype.kickTween(e, 5 * Math.PI), TweenLite.to(e.computeShader.uniforms.turbulance, 1, {
            value: 8,
            ease: Circ.easeInOut
        }), TweenLite.to(e.computeShader.uniforms.rotSpeed, 4.5, {
            value: 0,
            ease: Circ.easeInOut
        })
    }
}, {
    time: 26.5,
    run: function(e) {
        e.lockMouse = !0, e.computeShader.uniforms.origin.value = new THREE.Vector2(0, 0)
    }
}, {
    time: 27,
    run: function(e) {
        TweenLite.to(e.computeShader.uniforms.radius, 2, {
            value: 8,
            ease: Circ.easeIn
        }), TweenLite.to(e.computeShader.uniforms.speed, 3.5, {
            value: .25,
            ease: Circ.easeOut
        }), TweenLite.to(e.computeShader.uniforms.rotSpeed, 3.5, {
            value: -1,
            ease: Circ.easeInOut
        })
    }
}, {
    time: 31.5,
    run: function(e) {
        TweenLite.to(e.computeShader.uniforms.speed, 2, {
            value: .011,
            ease: Circ.easeOut
        }), TweenLite.to(e.computeShader.uniforms.rotSpeed, 2, {
            value: .011,
            ease: Circ.easeInOut
        })
    }
}, {
    time: 38.8,
    run: function(e) {
        e.computeShader.uniforms.speed.value = 1, TweenLite.to(e.computeShader.uniforms.noiseMult, 15, {
            value: 1,
            ease: Circ.easeOut
        }), e.computeShader.uniforms.radius.value = 10, TweenLite.to(e.computeShader.uniforms.radius, 6.4, {
            value: 0
        }), TweenLite.to(e.computeShader.uniforms.turbulance, 5, {
            value: 1,
            ease: Circ.easeInOut
        })
    }
}, {
    time: 45.2,
    run: function(e) {
        TweenLite.to(e.computeShader.uniforms.radius, 6, {
            value: 10,
            ease: Sine.easeInOut
        }), TweenLite.to(e.computeShader.uniforms.noiseMult, 4, {
            value: 0
        })
    }
}, {
    time: 52.8,
    run: function(e) {
        e.computeShader.uniforms.speed.value = 2, TweenLite.to(e.computeShader.uniforms.radius, 1.52, {
            value: 0
        })
    }
}, {
    time: 127,
    run: function(e) {
        e.computeShader.uniforms.rotSpeed.value = .1, e.computeShader.uniforms.speed.value = 2, e.computeShader.uniforms.radius.value = 10, e.computeShader.uniforms.noiseMult.value = 1, TweenLite.to(e.computeShader.uniforms.radius, 1.5, {
            value: 2,
            ease: Sine.easeInOut
        })
    }
}];
var assetsAreLoaded = !1,
    isDemoStarted = !1,
    appWidth, appHeight, stats, renderer, camera, timeDiv, clock = new THREE.Clock,
    et, TEXTURES_PATH = "assets/textures/",
    AUDIO_PATH = "assets/audio/",
    GuiParams = function() {},
    _GUI_PARAMS_ = new GuiParams,
    _GUI_, audioLoader, sceneIndex = 5,
    scenes = [],
    times = [{
        t: 0,
        s: 1
    }, {
        t: 38.75,
        s: 2
    }, {
        t: 51.25,
        s: 4
    }, {
        t: 52.8,
        s: 1
    }, {
        t: 54.32,
        s: 4
    }, {
        t: 59,
        s: 2
    }, {
        t: 60.52,
        s: 4
    }, {
        t: 76,
        s: 3
    }, {
        t: 100.75,
        s: 5
    }, {
        t: 127,
        s: 2
    }, {
        t: 128.66,
        s: 4
    }, {
        t: 133.25,
        s: 1
    }, {
        t: 134.87,
        s: 4
    }, {
        t: 150.37,
        s: 5
    }],
    it = 0;
SceneSphereNoise.prototype.init = function(e, t) {
    this.renderer = t, this.scene = new THREE.Scene, this.particleTexture = THREE.ImageUtils.loadTexture(TEXTURES_PATH + "dust.png"), this.particlesCount = 512;
    var i = new THREE.BoxGeometry(7, 7, 7);
    cubeMaterial = new THREE.MeshPhongMaterial({
        color: 15724543,
        emissive: 15724543,
        specular: 131618,
        wireframe: !0,
        side: THREE.DoubleSide
    }), this.cube = new THREE.Mesh(i, cubeMaterial), this.cube.scale.set(30, 30, 30), this.scene.add(this.cube), this.light = new THREE.PointLight(16777215, .3, 200), this.light.position.set(0, 0, 0), this.scene.add(this.light), this.renderShader = this.generateRenderShader(), this.computeShader = this.generateComputeShader();
    var n = new THREE.BufferGeometry,
        r = new Float32Array(this.particlesCount * this.particlesCount * 3),
        s = new Float32Array(this.particlesCount * this.particlesCount * 2);
    this.generateUVs(s), n.addAttribute("position", new THREE.BufferAttribute(r, 3)), n.addAttribute("idx", new THREE.BufferAttribute(s, 2)), this.particlesMesh = new THREE.PointCloud(n, this.renderShader), this.scene.add(this.particlesMesh), this.gpuParticles = new GPUCompute(t, 2 * this.particlesCount, this.particlesCount, 8, this.computeShader, function(e, t, i) {
        console.log("count:", t, ", stride:", i);
        for (var n = 0, r = 0; t > r; r += i) {
            var s, o = 2 * Math.random() * Math.PI,
                a = 2 * Math.random();
            s = 1 > a ? .5 * Math.sqrt(a) * Math.PI : .5 * (2 - Math.sqrt(2 - a)) * Math.PI, a = .1 * Math.random();
            var u = 1 + 5 * Math.random(),
                h = .1 + .1 * Math.random();
            e[r + 0] = o, e[r + 1] = s, e[r + 2] = u, e[r + 3] = 4, e[r + 4] = u, e[r + 5] = .5 + .5 * Math.random(), e[r + 6] = h, e[r + 7] = .02 * Math.random(), n++
        }
        console.log("iterations:", n)
    }.bind(this)), this.gpuParticles.init(), e(5)
}, SceneSphereNoise.prototype.generateUVs = function(e) {
    for (var t = 0, i = 0, n = this.particlesCount * this.particlesCount, r = 0, s = 1; n >= s; s += 1) e[r++] = t / (2 * this.particlesCount - 1), e[r++] = i / (this.particlesCount - 1), t += 2, s % this.particlesCount == 0 && s && (i++, t = 0)
}, SceneSphereNoise.prototype.generateRenderShader = function() {
    var e = new THREE.ShaderMaterial({
        uniforms: {
            texturePosition: {
                type: "t",
                value: null
            },
            resolution: {
                type: "v2",
                value: new THREE.Vector2(2 * this.particlesCount, this.particlesCount)
            },
            tex: {
                type: "t",
                value: this.particleTexture
            },
            clr: {
                type: "f",
                value: 1
            },
            size: {
                type: "f",
                value: this.iParticleSize
            },
            radius: {
                type: "f",
                value: 3
            }
        },
        attributes: {
            idx: {
                type: "v2",
                value: null
            }
        },
        vertexShader: decompressShader(sphereParticlesRender_vs),
        fragmentShader: decompressShader(sphereParticlesRender_ps),
        depthTest: !1,
        depthWrite: !0,
        transparent: !0
    });
    return e
}, SceneSphereNoise.prototype.generateComputeShader = function() {
    var e = new THREE.ShaderMaterial({
        uniforms: {
            resolution: {
                type: "v2",
                value: new THREE.Vector2(2 * this.particlesCount, this.particlesCount)
            },
            texturePosition: {
                type: "t",
                value: null
            },
            turbulance: {
                type: "f",
                value: this.iTurbulance
            },
            time: {
                type: "f",
                value: 0
            },
            radius: {
                type: "f",
                value: this.iRadius
            },
            noiseMult: {
                type: "f",
                value: this.iNoiseMult
            },
            speed: {
                type: "f",
                value: this.iSpeed
            }
        },
        vertexShader: decompressShader(sphereParticlesCompute_vs),
        fragmentShader: decompressShader(sphereParticlesCompute_ps)
    });
    return e
}, SceneSphereNoise.prototype.update = function(e, t, i) {
    this.transitions.list.length && t > this.transitions.list[0].time && (this.transitions.list[0].run(this), this.transitions.list.shift()), this.cube.rotation.x += .2 * i, this.cube.rotation.y += .2 * i, this.renderShader.uniforms.texturePosition.value = this.gpuParticles.update(), this.computeShader.uniforms.time.value++, this.particlesMesh.rotation.y += .075 * i, this.renderer.setClearColor(this.clearColor), this.renderer.render(this.scene, this.camera)
}, SceneSphereNoise.prototype.resize = function() {
    this.camera.aspect = appWidth / appHeight, this.camera.updateProjectionMatrix()
}, SceneCurlNoise.prototype.init = function(e, t) {
    this.renderer = t, this.scene = new THREE.Scene;
    var i = new THREE.BoxGeometry(7, 7, 7);
    cubeMaterial = new THREE.MeshPhongMaterial({
        color: 0,
        ambient: 0,
        emissive: 0,
        specular: 131618,
        wireframe: !1,
        side: THREE.DoubleSide,
        shading: THREE.FlatShading
    }), this.cube = new THREE.Mesh(i, cubeMaterial), this.cube.scale.set(30, 30, 30), this.scene.add(this.cube), this.cube.position.z += 25, this.light = new THREE.PointLight(16777215, .3, 200), this.light.position.set(0, 0, -25), this.scene.add(this.light), this.la = 0, this.particlesCount = 1024, this.renderShader = this.generateRenderShader(), this.computeShader = this.generateComputeShader();
    var n = new THREE.BufferGeometry,
        r = new Float32Array(this.particlesCount * this.particlesCount * 3),
        s = new Float32Array(this.particlesCount * this.particlesCount * 2);
    this.generateUVs(s), n.addAttribute("position", new THREE.BufferAttribute(r, 3)), n.addAttribute("idx", new THREE.BufferAttribute(s, 2)), this.particlesMesh = new THREE.PointCloud(n, this.renderShader), this.scene.add(this.particlesMesh), this.gpuParticles = new GPUCompute(t, 2 * this.particlesCount, this.particlesCount, 8, this.computeShader, function(e, t, i) {
        for (var n = 0, r = 0; t > r; r += i) {
            var s = 2 * Math.random() * Math.PI,
                o = 2 * Math.random();
            o = this.iRadius;
            var a = .5 + 5.2 * Math.random();
            e[r + 0] = Math.cos(s) * o, e[r + 1] = Math.sin(s) * o, e[r + 2] = a, e[r + 3] = .01 * Math.random(), e[r + 4] = a, e[r + 5] = .4 + .5 * Math.random(), e[r + 6] = 2 * Math.random(), e[r + 7] = 1 * Math.random(), n++
        }
    }.bind(this)), this.gpuParticles.init(), window.addEventListener("mousemove", function(e) {
        this.mouseX = e.clientX, this.mouseY = e.clientY
    }.bind(this)), e(1)
}, SceneCurlNoise.prototype.generateUVs = function(e) {
    for (var t = 0, i = 0, n = this.particlesCount * this.particlesCount, r = 0, s = 1; n >= s; s += 1) e[r++] = t / (2 * this.particlesCount - 1), e[r++] = i / (this.particlesCount - 1), t += 2, s % this.particlesCount == 0 && s && (i++, t = 0)
}, SceneCurlNoise.prototype.generateRenderShader = function() {
    var e = new THREE.ShaderMaterial({
        uniforms: {
            texturePosition: {
                type: "t",
                value: null
            },
            resolution: {
                type: "v2",
                value: new THREE.Vector2(2 * this.particlesCount, this.particlesCount)
            },
            clr: {
                type: "c",
                value: new THREE.Color(16777215)
            },
            size: {
                type: "f",
                value: 1
            }
        },
        attributes: {
            idx: {
                type: "v2",
                value: null
            }
        },
        vertexShader: decompressShader(curlNoiseRender_vs),
        fragmentShader: decompressShader(curlNoiseRender_ps),
        blending: THREE.AdditiveBlending,
        depthTest: !1,
        depthWrite: !1,
        transparent: !0
    });
    return e
}, SceneCurlNoise.prototype.generateComputeShader = function() {
    var e = new THREE.ShaderMaterial({
        uniforms: {
            resolution: {
                type: "v2",
                value: new THREE.Vector2(2 * this.particlesCount, this.particlesCount)
            },
            texturePosition: {
                type: "t",
                value: null
            },
            turbulance: {
                type: "f",
                value: this.iTurbulance
            },
            time: {
                type: "f",
                value: 0
            },
            radius: {
                type: "f",
                value: this.iRadius
            },
            noiseMult: {
                type: "f",
                value: this.iNoiseMult
            },
            speed: {
                type: "f",
                value: this.iSpeed
            },
            rotSpeed: {
                type: "f",
                value: this.iRotSpeed
            },
            origin: {
                type: "v2",
                value: new THREE.Vector2(0, 0)
            }
        },
        vertexShader: decompressShader(passThrough_vs),
        fragmentShader: decompressShader(curlNoiseCompute_ps)
    });
    return e
}, SceneCurlNoise.prototype.update = function(e, t, i, n) {
    if (this.transitions.list.length && t > this.transitions.list[0].time && (this.transitions.list[0].run(this), this.transitions.list.shift()), !this.lockMouse) {
        var r = this.mouseX - this.posX,
            s = this.mouseY - this.posY;
        this.posX += .24 * r, this.posY += .24 * s;
        var o = 2 * Math.tan(60 / 180 * Math.PI / 2) * 39.9,
            a = o * (appWidth / appHeight);
        this.computeShader.uniforms.origin.value.x = (this.posX / appWidth - .5) * a, this.computeShader.uniforms.origin.value.y = (this.posY / appHeight - .5) * -o
    }
    this.renderShader.uniforms.texturePosition.value = this.gpuParticles.update(), this.computeShader.uniforms.time.value++, this.light.position.set(50 * Math.cos(this.la), 0, 0), this.cube.rotation.x += .2 * i, this.cube.rotation.y += .2 * i, this.la += .25 * i, this.renderer.setClearColor(new THREE.Color(0)), null != n ? this.renderer.render(this.scene, this.camera, n) : this.renderer.render(this.scene, this.camera)
}, SceneCurlNoise.prototype.resize = function() {
    this.camera.aspect = appWidth / appHeight, this.camera.updateProjectionMatrix()
}, SceneTriangles.prototype.init = function(e, t) {
    this.renderer = t, this.scene = new THREE.Scene;
    var i = new THREE.BoxGeometry(7, 7, 7);
    cubeMaterial = new THREE.MeshPhongMaterial({
        color: 0,
        ambient: 0,
        emissive: 0,
        specular: 524288,
        wireframe: !1,
        side: THREE.DoubleSide,
        shading: THREE.FlatShading
    }), this.cube = new THREE.Mesh(i, cubeMaterial), this.cube.scale.set(30, 30, 30), this.scene.add(this.cube), this.cube.position.z += 25, this.light = new THREE.PointLight(16777215), this.light.position.set(0, 0, 0), this.scene.add(this.light), this.la = 0;
    for (var n = [], r = 256, s = 0; r > s; s++) {
        var o, a = 2 * Math.random() * Math.PI,
            u = 2 * Math.random();
        o = 1 > u ? .5 * Math.sqrt(u) * Math.PI : .5 * (2 - Math.sqrt(2 - u)) * Math.PI, u = 10 * Math.random(), n.push({
            size: 1.2 * Math.random(),
            scale: 1,
            angle: new THREE.Vector3(o, a, u),
            angleInc: 5 * Math.random() - 2.5,
            position: new THREE.Vector3(Math.cos(a) * Math.sin(o) * u, Math.cos(o) * u, Math.sin(a) * Math.sin(o) * u),
            colour: 16777215
        })
    }
    this.triCloud = new TriCloud(r, n), this.triCloud.mesh.scale.set(3, 3, 3), this.triCloud.mesh.position.z -= 20, this.scene.add(this.triCloud.mesh), this.triCloud.mesh.material.uniforms.opacity = {
        type: "f",
        value: 1
    }, this.triCloud.mesh.material.uniforms.projMap = {
        type: "t",
        value: null
    }, this.triCloud.mesh.material.uniforms.colour = {
        type: "c",
        value: new THREE.Color(67346)
    }, this.triCloud.mesh.material.uniforms.resolution = {
        type: "v2",
        value: new THREE.Vector2(appWidth, appHeight)
    }, this.triCloud.mesh.material.fragmentShader = trianglesTriCloud_ps, this.orthoCam = new THREE.OrthographicCamera(appWidth / -2, appWidth / 2, appHeight / 2, appHeight / -2, 0, 1), this.orthoScene = new THREE.Scene, this.orthoScene.add(this.orthoCam), this.occlusionBuffer = new THREE.WebGLRenderTarget(.5 * appWidth, .5 * appHeight), this.occlusionBuffer.generateMipmaps = !1, this.occlusionBuffer.magFilter = THREE.LinearFilter, this.occlusionBuffer.minFilter = THREE.LinearFilter, this.grShader = new THREE.ShaderMaterial({
        uniforms: {
            cbuff: {
                type: "t",
                value: null
            },
            obuff: {
                type: "t",
                value: null
            },
            exposure: {
                type: "f",
                value: 1
            },
            decay: {
                type: "f",
                value: .96
            },
            density: {
                type: "f",
                value: .4
            },
            weight: {
                type: "f",
                value: .116
            }
        },
        vertexShader: decompressShader(trianglesGodRays_vs),
        fragmentShader: decompressShader(trianglesGodRays_ps),
        depthTest: !1
    });
    var h = new THREE.PlaneGeometry(2, 2, 1, 1);
    this.colorBufferPlane = new THREE.Mesh(h, this.grShader), this.orthoScene.add(this.colorBufferPlane), this.colourBuffer = new THREE.WebGLRenderTarget(appWidth, appHeight), this.colourBuffer.generateMipmaps = !1, this.colourBuffer.magFilter = THREE.LinearFilter, this.colourBuffer.minFilter = THREE.LinearFilter, this.rt = new THREE.WebGLRenderTarget(appWidth, appHeight), this.rt.generateMipmaps = !1, this.rt.magFilter = THREE.LinearFilter, this.rt.minFilter = THREE.LinearFilter, window.addEventListener("mousemove", function(e) {
        this.cloudRotationYSpeed = e.clientX / appWidth - .5, this.cloudRotationXSpeed = e.clientY / appHeight - .5
    }.bind(this)), e(2)
}, SceneTriangles.prototype.update = function(e, t, i) {
    e.position.set(this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z), e.lookAt(new THREE.Vector3(0, 0, 0)), this.transitions.list.length && t > this.transitions.list[0].time && (this.transitions.list[0].run(this), this.transitions.list.shift()), this.triCloud.update(function(e, t) {
        for (var n = 0; e > n; n++) t.angle.value[n].x += this.triangleRotationXSpeed * i, t.angle.value[n].y += this.triangleRotationYSpeed * i, t.angle.value[n].z += this.triangleRotationZSpeed * i
    }.bind(this)), this.triCloud.mesh.rotation.x -= this.cloudRotationXSpeed * i, this.triCloud.mesh.rotation.y -= this.cloudRotationYSpeed * i, this.light.position.set(50 * Math.cos(this.la), 0, 0), this.cube.rotation.x += .2 * i, this.cube.rotation.y += .2 * i, this.la += .25 * i, this.renderer.setClearColor(new THREE.Color(0)), this.triCloud.mesh.material.uniforms.resolution.value = new THREE.Vector2(appWidth, appHeight), scenes[1].scene.update(e, t, i, this.rt), this.triCloud.mesh.material.uniforms.opacity.value = 1, this.triCloud.mesh.material.uniforms.projMap.value = this.rt, this.scene.add(this.cube), this.renderer.render(this.scene, e, this.colourBuffer), this.scene.remove(this.cube), this.triCloud.mesh.material.uniforms.resolution.value = new THREE.Vector2(appWidth / 2, appHeight / 2), this.triCloud.mesh.material.uniforms.opacity.value = .3, this.renderer.render(this.scene, e, this.occlusionBuffer), this.colorBufferPlane.material.uniforms.cbuff.value = this.colourBuffer, this.colorBufferPlane.material.uniforms.obuff.value = this.occlusionBuffer, this.renderer.render(this.orthoScene, this.orthoCam)
}, SceneTriangles.prototype.resize = function() {
    var e = this.rt.clone();
    e.setSize(appWidth, appHeight), this.rt = e, e = this.colourBuffer.clone(), e.setSize(appWidth, appHeight), this.colourBuffer = e, e = this.occlusionBuffer.clone(), e.setSize(appWidth / 2, appHeight / 2), this.occlusionBuffer = e
}, SceneReflection.prototype.init = function(e, t) {
    this.renderer = t, this.scene = new THREE.Scene;
    for (var i = new THREE.BoxGeometry(7, 7, 7), n = new THREE.ShaderMaterial({
            uniforms: {
                blueComponent: {
                    type: "c",
                    value: new THREE.Color(.9, .9, .99)
                },
                colourModifier: {
                    type: "f",
                    value: -1
                }
            },
            attributes: {
                scale: {
                    type: "f",
                    value: []
                }
            },
            vertexShader: terrainCube_vs,
            fragmentShader: terrainCube_ps,
            wireframe: !1
        }), r = new THREE.ShaderMaterial({
            uniforms: {
                blueComponent: {
                    type: "c",
                    value: new THREE.Color(.88, .88, .92)
                },
                colourModifier: {
                    type: "f",
                    value: -1
                }
            },
            attributes: {
                scale: {
                    type: "f",
                    value: []
                }
            },
            vertexShader: terrainCube_vs,
            fragmentShader: terrainCube_ps,
            wireframe: !0
        }), s = 0; s < i.vertices.length; s++) n.attributes.scale.value[s] = 1;
    this.cube = new THREE.Mesh(i, n), this.cube2 = new THREE.Mesh(i, r), this.scene.add(this.cube), this.scene.add(this.cube2), this.cube.position.y += 10, this.cube2.position.y += 10, this.cube.position.z += 5, this.cube2.position.z += 5, this.cube2.scale.set(1.06, 1.06, 1.06);
    var o = new THREE.PlaneGeometry(200, this.terrainDepth, 100, this.heightSegments),
        a = new THREE.ShaderMaterial({
            uniforms: {
                heightSegments: {
                    type: "f",
                    value: this.terrainDepth
                },
                time: {
                    type: "f",
                    value: 0
                },
                modifier: {
                    type: "f",
                    value: 1
                },
                scale: {
                    type: "f",
                    value: 1
                },
                colourModifier: {
                    type: "f",
                    value: -1
                }
            },
            attributes: {
                vh: {
                    type: "v3",
                    value: []
                }
            },
            vertexShader: terrain_vs,
            fragmentShader: terrain_ps
        });
    this.terrain = new THREE.Mesh(o, a), this.terrain.rotation.x = -Math.PI / 2;
    for (var s = 0; s < o.vertices.length; s++) a.attributes.vh.value[s] = new THREE.Vector3(0, 0, 0);
    for (var u = 0, h = .1, p = 1 / (h * Math.sqrt(2 * Math.PI)), l = this.terrain.geometry.vertices, c = l.length / (this.heightSegments + 1), d = 1, m = 2.5, f = 20, T = 0; T < this.heightSegments / 2; T++) {
        for (var w = -c / 2, s = 0; c > s; s++) {
            var g = p * Math.exp(-((w - u) * (w - u)) / 2 * h * h),
                S = f - g * m + Math.random();
            a.attributes.vh.value[c * d + s] = new THREE.Vector3(Math.max(S, 0), Math.random(), Math.random()), w++
        }
        d += 2, m += .3, f -= .5
    }
    this.scene.add(this.terrain), this.renderShader = this.generateRenderShader(), this.computeShader = this.generateComputeShader();
    var y = new THREE.BufferGeometry,
        v = new Float32Array(this.particlesCount * this.particlesCount * 3),
        E = new Float32Array(this.particlesCount * this.particlesCount * 2);
    this.generateUVs(E), y.addAttribute("position", new THREE.BufferAttribute(v, 3)), y.addAttribute("idx", new THREE.BufferAttribute(E, 2)), this.particlesMesh = new THREE.PointCloud(y, this.renderShader), this.scene.add(this.particlesMesh), this.gpuParticles = new GPUCompute(t, 2 * this.particlesCount, this.particlesCount, 8, this.computeShader, function(e, t, i) {
        for (var n = 0, r = 0; t > r; r += i) {
            var s = .5 + 1.5 * Math.random();
            e[r + 0] = 200 * Math.random() - 100, e[r + 1] = 40 * Math.random(), e[r + 2] = 180 * Math.random() - 90, e[r + 3] = s, e[r + 4] = 2 * Math.random() - 1, e[r + 5] = 2 * Math.random() - 1, e[r + 6] = 2 * Math.random() - 1, e[r + 7] = s, n++
        }
    }.bind(this)), this.gpuParticles.init(), e(3)
}, SceneReflection.prototype.generateUVs = function(e) {
    for (var t = 0, i = 0, n = this.particlesCount * this.particlesCount, r = 0, s = 1; n >= s; s += 1) e[r++] = t / (2 * this.particlesCount - 1), e[r++] = i / (this.particlesCount - 1), t += 2, s % this.particlesCount == 0 && s && (i++, t = 0)
}, SceneReflection.prototype.generateRenderShader = function() {
    var e = new THREE.ShaderMaterial({
        uniforms: {
            texturePosition: {
                type: "t",
                value: null
            },
            resolution: {
                type: "v2",
                value: new THREE.Vector2(2 * this.particlesCount, this.particlesCount)
            },
            clr: {
                type: "c",
                value: new THREE.Color(16777215)
            }
        },
        attributes: {
            idx: {
                type: "v2",
                value: null
            }
        },
        vertexShader: decompressShader(reflectionRender_vs),
        fragmentShader: decompressShader(reflectionRender_ps),
        blending: THREE.AdditiveBlending,
        depthTest: !0,
        depthWrite: !0,
        transparent: !0
    });
    return e
}, SceneReflection.prototype.generateComputeShader = function() {
    var e = new THREE.ShaderMaterial({
        uniforms: {
            resolution: {
                type: "v2",
                value: new THREE.Vector2(2 * this.particlesCount, this.particlesCount)
            },
            texturePosition: {
                type: "t",
                value: null
            }
        },
        vertexShader: decompressShader(passThrough_vs),
        fragmentShader: decompressShader(reflectionCompute_ps)
    });
    return e
}, SceneReflection.prototype.update = function(e, t, i) {
    this.transitions.list.length && t > this.transitions.list[0].time && (this.transitions.list[0].run(this), this.transitions.list.shift()), this.renderShader.uniforms.texturePosition.value = this.gpuParticles.update(), e.position.set(this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z), e.lookAt(this.lookAtVec), this.terrain.material.uniforms.time.value += 1 * i, this.cube.rotation.x += .99 * i, this.cube.rotation.y += .99 * i, this.cube2.rotation.x += .99 * i, this.cube2.rotation.y += .99 * i, this.renderer.setClearColor(new THREE.Color(16777215)), this.renderer.render(this.scene, e)
}, SceneReflection.prototype.resize = function() {}, SceneCubes.prototype.init = function(e, t) {
    this.renderer = t, this.scene = new THREE.Scene, this.scene.fog = new THREE.Fog(0, 150, 200);
    var i = new THREE.BoxGeometry(7, 7, 7);
    r = new THREE.MeshPhongMaterial({
        color: 0,
        ambient: 0,
        emissive: 0,
        specular: 6291456,
        wireframe: !1,
        side: THREE.DoubleSide
    }), this.cube = new THREE.Mesh(i, r), this.cube.scale.set(30, 30, 30), this.scene.add(this.cube), this.light = new THREE.PointLight(16777215, .5, 200), this.light.position.set(0, 0, 0), this.scene.add(this.light), this.la = 0;
    for (var n = 0; n < this.cubesCount; n++) {
        var i = new THREE.BoxGeometry(1, 1, 1),
            r = new THREE.MeshBasicMaterial({
                color: 16777215,
                wireframe: !1
            }),
            s = new THREE.Mesh(i, r);
        s.scale.set(8, .5, 12), s.position.z = -200 * Math.random(), this.scene.add(s), this.cubes.push({
            mesh: s,
            radius: 10 + 15 * Math.random(),
            angle: Math.random() * Math.PI * 2,
            speed: .2 + .8 * Math.random()
        })
    }
    this.renderShader = this.generateRenderShader(), this.computeShader = this.generateComputeShader();
    var o = new THREE.BufferGeometry,
        a = new Float32Array(this.particlesCount * this.particlesCount * 3),
        u = new Float32Array(this.particlesCount * this.particlesCount * 2);
    this.generateUVs(u), o.addAttribute("position", new THREE.BufferAttribute(a, 3)), o.addAttribute("idx", new THREE.BufferAttribute(u, 2)), this.particlesMesh = new THREE.PointCloud(o, this.renderShader), this.scene.add(this.particlesMesh), this.gpuParticles = new GPUCompute(t, 2 * this.particlesCount, this.particlesCount, 8, this.computeShader, function(e, t, i) {
        for (var n = 0, r = 0; t > r; r += i) {
            var s = 5 + 10 * Math.random(),
                o = 120 * Math.random(),
                a = Math.random() * Math.PI * 2;
            e[r + 0] = Math.cos(a) * o, e[r + 1] = Math.sin(a) * o, e[r + 2] = 100 + -300 * Math.random(), e[r + 3] = s, e[r + 4] = 0, e[r + 5] = 0, e[r + 6] = 100 + 100 * Math.random(), e[r + 7] = s, n++
        }
    }.bind(this)), this.gpuParticles.init(), this.cookieScene = new THREE.Scene;
    var h = new THREE.ImageUtils.loadTexture(TEXTURES_PATH + "gradient2.png"),
        p = new THREE.MeshBasicMaterial({
            color: 16777215,
            map: h,
            transparent: !0,
            opacity: .18
        });
    this.cookieMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 1), p), this.cookieScene.add(this.cookieMesh), this.cookieMesh.scale.set(125, 125, 1), this.cookieMesh.position = new THREE.Vector3(0, 0, -200), this.orthoCam = new THREE.OrthographicCamera(appWidth / -2, appWidth / 2, appHeight / 2, appHeight / -2, 0, 1), this.orthoScene = new THREE.Scene, this.orthoScene.add(this.orthoCam), this.occlusionBuffer = new THREE.WebGLRenderTarget(.5 * appWidth, .5 * appHeight), this.occlusionBuffer.generateMipmaps = !1, this.occlusionBuffer.magFilter = THREE.LinearFilter, this.occlusionBuffer.minFilter = THREE.LinearFilter, this.grShader = new THREE.ShaderMaterial({
        uniforms: {
            cbuff: {
                type: "t",
                value: null
            },
            obuff: {
                type: "t",
                value: null
            },
            exposure: {
                type: "f",
                value: 1
            },
            decay: {
                type: "f",
                value: .95
            },
            density: {
                type: "f",
                value: .9
            },
            weight: {
                type: "f",
                value: .9
            },
            time: {
                type: "f",
                value: 0
            },
            resolution: {
                type: "v2",
                value: new THREE.Vector2(appWidth, appHeight)
            },
            amount: {
                type: "f",
                value: 6
            }
        },
        vertexShader: decompressShader(trianglesGodRays_vs),
        fragmentShader: decompressShader(cubesGodRays_ps),
        depthTest: !1
    });
    var l = new THREE.PlaneGeometry(2, 2, 1, 1);
    this.colorBufferPlane = new THREE.Mesh(l, this.grShader), this.orthoScene.add(this.colorBufferPlane), this.colourBuffer = new THREE.WebGLRenderTarget(appWidth, appHeight), this.colourBuffer.generateMipmaps = !1, this.colourBuffer.magFilter = THREE.LinearFilter, this.colourBuffer.minFilter = THREE.LinearFilter, window.addEventListener("mousemove", function(e) {
        this.mouseX = e.clientX, this.mouseY = e.clientY
    }.bind(this)), e(4)
}, SceneCubes.prototype.generateUVs = function(e) {
    for (var t = 0, i = 0, n = this.particlesCount * this.particlesCount, r = 0, s = 1; n >= s; s += 1) e[r++] = t / (2 * this.particlesCount - 1), e[r++] = i / (this.particlesCount - 1), t += 2, s % this.particlesCount == 0 && s && (i++, t = 0)
}, SceneCubes.prototype.generateRenderShader = function() {
    var e = new THREE.ShaderMaterial({
        uniforms: {
            texturePosition: {
                type: "t",
                value: null
            },
            resolution: {
                type: "v2",
                value: new THREE.Vector2(2 * this.particlesCount, this.particlesCount)
            },
            clr: {
                type: "c",
                value: new THREE.Color(16777215)
            }
        },
        attributes: {
            idx: {
                type: "v2",
                value: null
            }
        },
        vertexShader: decompressShader(cubesParticlesRender_vs),
        fragmentShader: decompressShader(cubesParticlesRender_ps),
        blending: THREE.AdditiveBlending,
        depthTest: !0,
        depthWrite: !0,
        transparent: !0
    });
    return e
}, SceneCubes.prototype.generateComputeShader = function() {
    var e = new THREE.ShaderMaterial({
        uniforms: {
            resolution: {
                type: "v2",
                value: new THREE.Vector2(2 * this.particlesCount, this.particlesCount)
            },
            texturePosition: {
                type: "t",
                value: null
            }
        },
        vertexShader: decompressShader(passThrough_vs),
        fragmentShader: decompressShader(cubesParticlesCompute_ps)
    });
    return e
}, SceneCubes.prototype.update = function(e, t, i) {
    this.transitions.list.length && t > this.transitions.list[0].time && (this.transitions.list[0].run(this), this.transitions.list.shift()), this.renderShader.uniforms.texturePosition.value = this.gpuParticles.update(), this.light.position.set(50 * Math.cos(this.la), 0, 0);
    var n = this.mouseX - this.posX,
        r = this.mouseY - this.posY;
    this.posX += .14 * n, this.posY += .14 * r, e.position.setX(24 * (this.posX / window.innerWidth - .5)), e.position.setY(-24 * (this.posY / window.innerHeight - .5)), e.position.setZ(this.camZPos), e.lookAt(new THREE.Vector3(0, 0, 0));
    for (var s = 0; s < this.cubesCount; s++) this.cubes[s].mesh.position.x = Math.cos(this.cubes[s].angle) * this.cubes[s].radius, this.cubes[s].mesh.position.y = Math.sin(this.cubes[s].angle) * this.cubes[s].radius, this.cubes[s].mesh.rotation.z = Math.atan2(this.cubes[s].mesh.position.y, this.cubes[s].mesh.position.x) + Math.PI / 2, this.cubes[s].angle += this.cubes[s].speed * i, this.cubes[s].mesh.position.z += this.cubes[s].speed * i * this.speedMult, this.cubes[s].mesh.position.z > 100 && (this.cubes[s].mesh.position.z = -300);
    this.cube.rotation.x += .1 * i, this.cube.rotation.y += .1 * i, this.la += .25 * i, this.cookieMesh.rotation.z -= .24 * i, this.renderer.setClearColor(new THREE.Color(0)), this.renderer.render(this.scene, e, this.colourBuffer), this.scene.overrideMaterial = new THREE.MeshBasicMaterial({
        color: 0
    }), this.renderer.render(this.scene, e, this.occlusionBuffer), this.renderer.autoClear = !1, this.renderer.render(this.cookieScene, e, this.occlusionBuffer), this.renderer.autoClear = !0, this.scene.overrideMaterial = null, this.colorBufferPlane.material.uniforms.cbuff.value = this.colourBuffer, this.colorBufferPlane.material.uniforms.obuff.value = this.occlusionBuffer, this.renderer.render(this.orthoScene, this.orthoCam), this.grShader.uniforms.time.value += .25 * i
}, SceneCubes.prototype.resize = function() {
    var e = this.colourBuffer.clone();
    e.setSize(appWidth, appHeight), this.colourBuffer = e, e = this.occlusionBuffer.clone(), e.setSize(appWidth / 2, appHeight / 2), this.occlusionBuffer = e, this.grShader.uniforms.resolution.value = new THREE.Vector2(appWidth, appHeight)
};