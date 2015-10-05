function startDemo(e) {
    switch (e) {
        case "lo":
            numParticles = 5e4;
            break;
        case "sd":
            numParticles = 15e4;
            break;
        case "hi":
            numParticles = 1e6
    }
    isDemoStarted = !0, isAudioLoaded && (document.getElementById("info").style.display = "none", audioLoader.play(0), init(), render())
}

function preloadAssets() {
    audioLoader = new AudioBufferLoader("wohhh.mp3", function(e) {
        return null == e ? (document.getElementById("buttonContainer").style.display = "none", void(document.getElementById("description").innerHTML = "Web Audio API not supported. Try using Chrome or something.")) : (isAudioLoaded = !0, void(isDemoStarted && (document.getElementById("info").style.display = "none", audioLoader.play(0), init(), render(), isAudioLoaded = !1)))
    }), audioLoader.load()
}

function decompressShader(e) {
    for (var t = [{
        token: /\$2/g,
        word: "vec2"
    }, {
        token: /\$3/g,
        word: "vec3"
    }, {
        token: /\$4/g,
        word: "vec4"
    }, {
        token: /\$f/g,
        word: "float"
    }, {
        token: /\$e/g,
        word: "else"
    }, {
        token: /\$m/g,
        word: "main"
    }, {
        token: /\$u/g,
        word: "uniform"
    }, {
        token: /\$v/g,
        word: "varying"
    }, {
        token: /\$r/g,
        word: "return"
    }, {
        token: /\$d/g,
        word: "define"
    }, {
        token: /\$p/g,
        word: "gl_Position"
    }, {
        token: /\$x/g,
        word: "noiseX"
    }, {
        token: /\$y/g,
        word: "noiseY"
    }, {
        token: /\$z/g,
        word: "noiseZ"
    }], n = 0; n < t.length; n++) e = e.replace(t[n].token, t[n].word);
    return e
}

function init() {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer = new THREE.WebGLRenderer({
        antialias: !0
    }), renderer.setSize(width, height), container = document.getElementById("container"), container.appendChild(renderer.domElement), scene = new THREE.Scene, particlesGeom = new THREE.Geometry;
    for (var e = 0; numParticles > e; e++) {
        var t, n = Math.random() * Math.PI * 2,
            i = 2 * Math.random();
        t = 1 > i ? Math.sqrt(i) * Math.PI * .5 : (2 - Math.sqrt(2 - i)) * Math.PI * .5, i = 1.5 + .25 * Math.random(), particlesGeom.vertices.push(new THREE.Vector3(Math.sin(t) * Math.cos(n) * i, Math.cos(t) * i, Math.sin(t) * Math.sin(n) * i))
    }
    particlesUniforms = {
        time: {
            type: "f",
            value: .75
        },
        something: {
            type: "f",
            value: 10
        },
        something2: {
            type: "f",
            value: .0487
        },
        radius: {
            type: "f",
            value: 1
        },
        factor: {
            type: "f",
            value: 0
        },
        noiseTable: {
            type: "v4v",
            value: [new THREE.Vector4(-.569811, .432591, -.698699, 0), new THREE.Vector4(.78118, .163006, .60265, 1), new THREE.Vector4(.436394, -.297978, .848982, 2), new THREE.Vector4(.843762, -.185742, -.503554, 3), new THREE.Vector4(.663712, -.68443, -.301731, 4), new THREE.Vector4(.616757, .768825, .168875, 5), new THREE.Vector4(.457153, -.884439, -.093694, 6), new THREE.Vector4(-.956955, .110962, -.268189, 7), new THREE.Vector4(.115821, .77523, .620971, 8), new THREE.Vector4(-.716028, -.477247, -.50945, 9), new THREE.Vector4(.819593, -.123834, .559404, 10), new THREE.Vector4(-.522782, -.586534, .618609, 11), new THREE.Vector4(-.792328, -.577495, -.196765, 12), new THREE.Vector4(-.674422, .0572986, .736119, 13), new THREE.Vector4(-.224769, -.764775, -.60382, 14), new THREE.Vector4(.492662, -.71614, .494396, 15), new THREE.Vector4(.470993, -.645816, .600905, 16), new THREE.Vector4(-.19049, .321113, .927685, 17), new THREE.Vector4(.0122118, .946426, -.32269, 18), new THREE.Vector4(.577419, .408182, .707089, 19), new THREE.Vector4(-.0945428, .341843, -.934989, 20), new THREE.Vector4(.788332, -.60845, -.0912217, 21), new THREE.Vector4(-.346889, .894997, -.280445, 22), new THREE.Vector4(-.165907, -.649857, .741728, 23), new THREE.Vector4(.791885, .124138, .597919, 24), new THREE.Vector4(-.625952, .73148, .270409, 25), new THREE.Vector4(-.556306, .580363, .594729, 26), new THREE.Vector4(.673523, .719805, .168069, 27), new THREE.Vector4(-.420334, .894265, .153656, 28), new THREE.Vector4(-.141622, -.279389, .949676, 29), new THREE.Vector4(-.803343, .458278, .380291, 30), new THREE.Vector4(.49355, -.402088, .77119, 31), new THREE.Vector4(-.569811, .432591, -.698699, 0), new THREE.Vector4(.78118, .163006, .60265, 1), new THREE.Vector4(.436394, -.297978, .848982, 2), new THREE.Vector4(.843762, -.185742, -.503554, 3), new THREE.Vector4(.663712, -.68443, -.301731, 4), new THREE.Vector4(.616757, .768825, .168875, 5), new THREE.Vector4(.457153, -.884439, -.093694, 6), new THREE.Vector4(-.956955, .110962, -.268189, 7), new THREE.Vector4(.115821, .77523, .620971, 8), new THREE.Vector4(-.716028, -.477247, -.50945, 9), new THREE.Vector4(.819593, -.123834, .559404, 10), new THREE.Vector4(-.522782, -.586534, .618609, 11), new THREE.Vector4(-.792328, -.577495, -.196765, 12), new THREE.Vector4(-.674422, .0572986, .736119, 13), new THREE.Vector4(-.224769, -.764775, -.60382, 14), new THREE.Vector4(.492662, -.71614, .494396, 15), new THREE.Vector4(.470993, -.645816, .600905, 16), new THREE.Vector4(-.19049, .321113, .927685, 17), new THREE.Vector4(.0122118, .946426, -.32269, 18), new THREE.Vector4(.577419, .408182, .707089, 19), new THREE.Vector4(-.0945428, .341843, -.934989, 20), new THREE.Vector4(.788332, -.60845, -.0912217, 21), new THREE.Vector4(-.346889, .894997, -.280445, 22), new THREE.Vector4(-.165907, -.649857, .741728, 23), new THREE.Vector4(.791885, .124138, .597919, 24), new THREE.Vector4(-.625952, .73148, .270409, 25), new THREE.Vector4(-.556306, .580363, .594729, 26), new THREE.Vector4(.673523, .719805, .168069, 27), new THREE.Vector4(-.420334, .894265, .153656, 28), new THREE.Vector4(-.141622, -.279389, .949676, 29), new THREE.Vector4(-.803343, .458278, .380291, 30), new THREE.Vector4(.49355, -.402088, .77119, 31), new THREE.Vector4(-.569811, .432591, -.698699, 0), new THREE.Vector4(.78118, .163006, .60265, 1)]
        }
    }, particlesMat = new THREE.ShaderMaterial({
        uniforms: particlesUniforms,
        vertexShader: decompressShader(particlesVS),
        fragmentShader: decompressShader(particlesPS),
        transparent: !0,
        blending: THREE.AdditiveBlending
    }), particlesMesh = new THREE.PointCloud(particlesGeom, particlesMat), scene.add(particlesMesh), camera = new THREE.PerspectiveCamera(45, width / height, .1, 1e4), camera.position.x = 0, camera.position.y = 0, camera.position.z = 175, camera.lookAt(new THREE.Vector3(0, 0, 0)), scene.add(camera), clock.start(), window.addEventListener("resize", onWindowResize, !1), composer = new WAGNER.Composer(renderer), composer.setSize(window.innerWidth, window.innerHeight), multiPassBloomPass = new WAGNER.MultiPassBloomPass, renderer.autoClearColor = !0, composer.reset(), useBloom = !0
}

function render() {
    fixedTimeStep = clock.getDelta(), tt = audioLoader.update(), requestAnimationFrame(render), transitions.length && tt > transitions[0].time && (transitions[0].transition(), transitions.shift()), particlesUniforms.time.value += timeIncrement * fixedTimeStep, particlesMesh.rotation.x += xIncrement * fixedTimeStep, particlesMesh.rotation.y += yIncrement * fixedTimeStep, particlesMesh.rotation.z += zIncrement * fixedTimeStep, TWEEN.update(), renderer.render(scene, camera), composer.render(scene, camera), composer.pass(multiPassBloomPass), composer.toScreen()
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight, camera.updateProjectionMatrix(), renderer.setSize(window.innerWidth, window.innerHeight), composer.setSize(window.innerWidth, window.innerHeight), composer.reset()
}

function AudioBufferLoader(e, t) {
    this.url = e, this.buffer = null, this.callback = t, this.isPlaying = !1, this.offset = 0, this.audioAPIError = !1, this.context = this.getContext()
}
var timeDiv, stats, container, width = window.innerWidth,
    height = window.innerHeight,
    renderer, scene, camera, particlesGeom, particlesMat, particlesMesh, numParticles = 1e6,
    particlesUniforms, clock = new THREE.Clock,
    multiPassBloomPass, composer, angle = 0,
    timeIncrement = .02,
    xIncrement = 0,
    yIncrement = 0,
    zIncrement = 0,
    fixedTimeStep = .05,
    trIndex = 0,
    tt = 0,
    isAudioLoaded = !1,
    isDemoStarted = !1,
    audioLoader;
AudioBufferLoader.prototype.getContext = function() {
    return this.context || this.createContext(), this.context
}, AudioBufferLoader.prototype.createContext = function() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext, this.context = new AudioContext
    } catch (e) {
        return void(this.audioAPIError = !0)
    }
}, AudioBufferLoader.prototype.loadBuffer = function(e) {
    if (this.audioAPIError) return void this.callback(null);
    var t = new XMLHttpRequest;
    t.open("GET", e, !0), t.responseType = "arraybuffer";
    var n = this;
    t.onload = function() {
        n.context.decodeAudioData(t.response, function(e) {
            return e ? (n.buffer = e, void n.callback(n.buffer)) : void n.callback(null)
        }, function() {})
    }, t.onprogress = function() {}, t.onerror = function() {
        alert("AudioBufferLoader: XHR error")
    }, t.send()
}, AudioBufferLoader.prototype.load = function() {
    this.loadBuffer(this.url)
}, AudioBufferLoader.prototype.play = function(e) {
    var t = this.context.createBufferSource();
    t.buffer = this.buffer, t.connect(this.context.destination), this.position = "number" == typeof position ? position : this.position || 0, this.startTime = this.context.currentTime - (this.position || 0), e > 0 && (this.offset = e), t.start(this.context.currentTime, this.position + this.offset), this.isPlaying = !0
}, AudioBufferLoader.prototype.update = function() {
    return this.isPlaying && (this.position = this.context.currentTime - this.startTime + this.offset), this.position
};
var bb = !1,
    rewind = !1,
    transitions = [{
        time: 0,
        transition: function() {
            multiPassBloomPass.params.blurAmount = 1, multiPassBloomPass.params.applyZoomBlur = !1, multiPassBloomPass.params.zoomBlurStrength = 0, particlesUniforms.factor.value = 1, particlesUniforms.something.value = 24; {
                var e = {
                        radius: 0
                    },
                    t = {
                        radius: 1
                    };
                new TWEEN.Tween(e).to(t, 35e3).easing(TWEEN.Easing.Cubic.Out).onUpdate(function() {
                    particlesUniforms.radius.value = e.radius
                }).start()
            }
        }
    }, {
        time: 11.5,
        transition: function() {
            {
                var e = {
                        f: 1
                    },
                    t = {
                        f: 0
                    },
                    n = {
                        inc: .02
                    },
                    i = {
                        inc: .07
                    };
                new TWEEN.Tween(e).to(t, 15e3).easing(TWEEN.Easing.Cubic.InOut).onUpdate(function() {
                    particlesUniforms.factor.value = e.f
                }).start(), new TWEEN.Tween(n).to(i, 5e3).easing(TWEEN.Easing.Cubic.InOut).onUpdate(function() {
                    timeIncrement = n.inc
                }).start()
            }
        }
    }, {
        time: 24,
        transition: function() {
            {
                var e = {
                        xInc: .002
                    },
                    t = {
                        xInc: .2
                    };
                new TWEEN.Tween(e).to(t, 8e3).easing(TWEEN.Easing.Cubic.InOut).onUpdate(function() {
                    xIncrement = e.xInc
                }).start()
            }
        }
    }, {
        time: 37,
        transition: function() {
            {
                var e = {
                        zInc: 0
                    },
                    t = {
                        zInc: .2
                    };
                new TWEEN.Tween(e).to(t, 5e3).easing(TWEEN.Easing.Cubic.InOut).onUpdate(function() {
                    zIncrement = e.zInc
                }).start()
            }
        }
    }, {
        time: 42,
        transition: function() {
            {
                var e = {
                        inc: .07
                    },
                    t = {
                        inc: .09
                    };
                new TWEEN.Tween(e).to(t, 5e3).easing(TWEEN.Easing.Cubic.InOut).onUpdate(function() {
                    timeIncrement = e.inc
                }).start()
            }
        }
    }, {
        time: 47.75,
        transition: function() {
            {
                var e = {
                        xInc: .2,
                        yInc: 0,
                        zInc: .2,
                        f: 0
                    },
                    t = {
                        xInc: .1,
                        yInc: .1,
                        zInc: .1,
                        f: .5
                    };
                new TWEEN.Tween(e).to(t, 8e3).easing(TWEEN.Easing.Cubic.InOut).onUpdate(function() {
                    xIncrement = e.xInc, yIncrement = e.yInc, zIncrement = e.zInc, particlesUniforms.factor.value = e.f
                }).start()
            }
        }
    }, {
        time: 70.75,
        transition: function() {
            multiPassBloomPass.params.applyZoomBlur = !0; {
                var e = {
                        inc: .09,
                        radius: 1,
                        xInc: .1,
                        yInc: .1,
                        zInc: .2,
                        f: .5,
                        zb: 0
                    },
                    t = {
                        inc: .002,
                        radius: 1.14,
                        xInc: 0,
                        yInc: .2,
                        zInc: 0,
                        f: 1,
                        zb: .5
                    };
                new TWEEN.Tween(e).to(t, 6e3).easing(TWEEN.Easing.Cubic.InOut).onUpdate(function() {
                    multiPassBloomPass.params.zoomBlurStrength = e.zb, particlesUniforms.radius.value = e.radius, particlesUniforms.factor.value = e.f, xIncrement = e.xInc, yIncrement = e.yInc, zIncrement = e.zInc, timeIncrement = e.inc
                }).start()
            }
        }
    }, {
        time: 79,
        transition: function() {
            {
                var e = {
                        inc: .002,
                        radius: 1.14
                    },
                    t = {
                        inc: .02,
                        radius: 1
                    };
                new TWEEN.Tween(e).to(t, 1e4).easing(TWEEN.Easing.Cubic.InOut).onUpdate(function() {
                    particlesUniforms.radius.value = e.radius, timeIncrement = e.inc
                }).start()
            }
        }
    }, {
        time: 81.5,
        transition: function() {
            {
                var e = {
                        zb: .5
                    },
                    t = {
                        zb: .7
                    };
                new TWEEN.Tween(e).to(t, 5e3).easing(TWEEN.Easing.Cubic.InOut).onUpdate(function() {
                    multiPassBloomPass.params.zoomBlurStrength = e.zb
                }).start()
            }
        }
    }, {
        time: 95,
        transition: function() {
            {
                var e = {
                        radius: 1,
                        inc: .02,
                        xInc: 0,
                        zInc: 0,
                        zb: .7
                    },
                    t = {
                        radius: 4,
                        inc: .148,
                        xInc: .2,
                        zInc: .2,
                        zb: 0
                    };
                new TWEEN.Tween(e).to(t, 7e3).easing(TWEEN.Easing.Cubic.InOut).onUpdate(function() {
                    multiPassBloomPass.params.zoomBlurStrength = e.zb, particlesUniforms.radius.value = e.radius, timeIncrement = e.inc, xIncrement = e.xInc, zIncrement = e.zInc
                }).start()
            }
        }
    }, {
        time: 104.5,
        transition: function() {
            particlesUniforms.something.value = 1e-4, particlesUniforms.factor.value = 1, particlesUniforms.radius.value = 1, timeIncrement = .01, particlesMesh.rotation.x = 1.34, particlesMesh.rotation.y = .44, particlesMesh.rotation.z = .24, xInc = 0, yInc = .15, zInc = 0; {
                var e = {
                        s: 1e-4,
                        inc: .01,
                        xInc: 0,
                        r: 1,
                        zb: .5
                    },
                    t = {
                        s: 10,
                        inc: .15,
                        xInc: .2,
                        r: 1.5,
                        zb: 0
                    };
                new TWEEN.Tween(e).to(t, 2e3).easing(TWEEN.Easing.Elastic.Out).onUpdate(function() {
                    timeIncrement = e.inc, xIncrement = e.xInc, particlesUniforms.something.value = e.s, particlesUniforms.radius.value = e.r, multiPassBloomPass.params.zoomBlurStrength = e.zb
                }).start()
            }
        }
    }, {
        time: 110.1,
        transition: function() {
            {
                var e = {
                        inc: .15,
                        zb: 0
                    },
                    t = {
                        inc: .1,
                        zb: .5
                    };
                new TWEEN.Tween(e).to(t, 1e4).easing(TWEEN.Easing.Circular.InOut).onUpdate(function() {
                    multiPassBloomPass.params.zoomBlurStrength = e.zb, timeIncrement = e.inc
                }).start()
            }
        }
    }, {
        time: 120,
        transition: function() {
            {
                var e = {
                        inc: .1,
                        radius: 1.5,
                        f: 1,
                        zb: .5
                    },
                    t = {
                        inc: .01,
                        radius: 2,
                        f: .2,
                        zb: 0
                    };
                new TWEEN.Tween(e).to(t, 7e3).easing(TWEEN.Easing.Cubic.InOut).onUpdate(function() {
                    multiPassBloomPass.params.zoomBlurStrength = e.zb, particlesUniforms.radius.value = e.radius, particlesUniforms.factor.value = e.f, timeIncrement = e.inc
                }).start()
            }
        }
    }, {
        time: 127.15,
        transition: function() {
            particlesUniforms.time.value += 75, particlesUniforms.something.value = 1e-4, particlesUniforms.factor.value = 1, particlesUniforms.radius.value = 1, timeIncrement = .01, particlesMesh.rotation.x = 1.34, particlesMesh.rotation.y = .44, particlesMesh.rotation.z = .24, xInc = .1, yInc = 0, zInc = .1; {
                var e = {
                        s: 1e-4,
                        inc: .01,
                        zInc: 0,
                        zb: 2
                    },
                    t = {
                        s: 10,
                        inc: .15,
                        zInc: .2,
                        zb: 0
                    };
                new TWEEN.Tween(e).to(t, 1750).easing(TWEEN.Easing.Elastic.Out).onUpdate(function() {
                    timeIncrement = e.inc, zIncrement = e.zInc, particlesUniforms.something.value = e.s, multiPassBloomPass.params.zoomBlurStrength = e.zb
                }).start()
            }
        }
    }, {
        time: 138.25,
        transition: function() {
            {
                var e = {
                        factor: 1
                    },
                    t = {
                        factor: .2
                    };
                new TWEEN.Tween(e).to(t, 2e3).easing(TWEEN.Easing.Elastic.Out).onUpdate(function() {
                    particlesUniforms.factor.value = e.factor
                }).start()
            }
        }
    }, {
        time: 171.5,
        transition: function() {
            {
                var e = {
                        inc: .11,
                        factor: .2
                    },
                    t = {
                        inc: .04,
                        factor: 1
                    };
                new TWEEN.Tween(e).to(t, 8e3).easing(TWEEN.Easing.Cubic.InOut).onUpdate(function() {
                    particlesUniforms.factor.value = e.factor, timeIncrement = e.inc
                }).start()
            }
        }
    }];

var particlesVS = "$u $4 noiseTable[66];$u $f time;$u $f factor;$u $f radius;$u $f something;$u $f something2;$v $3 clr;$f BSIZE=32.0;$f FULLSIZE=66.0;$f NOISEFRAC=0.03125;$f noise($f v){v=v+10000.0;$f i=fract(v*NOISEFRAC)*BSIZE;$f f=fract(v);$2 r;r.x=noiseTable[int(i)].x*f;r.y=noiseTable[int(i)+1].x*(f-1.0);f=f*f*(3.0-2.0*f);$r mix(r.x,r.y,f);}void $m(){$f len=(length(position));$f tf=1.0;$f $x=noise(position.x+time*tf);$f $y=noise(position.y+time*tf);$f $z=noise(position.z+time*tf);$3 expPos=position/something;expPos.x+=$x;expPos.y+=$y;expPos.z+=$z;expPos*=radius;$f px=position.x+cos(time)*$z;$f py=position.y+cos(time)*$x;$f pz=position.z+sin(time)*$y;$x+=px*noise(px);$y+=py*noise(py);$z+=pz*noise(pz);$f e_dist_sq=expPos.x*expPos.x+expPos.y*expPos.y+expPos.z*expPos.z;$f e_dist=sqrt(e_dist_sq);$f e_force=$x/e_dist_sq;$f e_ax=e_force*expPos.x/e_dist;$f e_ay=e_force*expPos.y/e_dist;$f e_az=e_force*expPos.z/e_dist;expPos.x+=e_ax/$x;expPos.y+=e_ay/$x;expPos.z+=e_az/$x;$3 expClr=$3($z+$x+$y);expClr.b+=.1;$3 pos=$3(position.x+$z,position.y+$x,position.z+$y);$f dist_sq=pos.x*pos.x+pos.y*pos.y+pos.z*pos.z;$f dist=sqrt(dist_sq);$f fx=$x/dist_sq;$f fy=$y/dist_sq;$f fz=$z/dist_sq;$f ax=fx*pos.x/dist;$f ay=fy*pos.y/dist;$f az=fz*pos.z/dist;pos.x+=((ax+$z)*1.9);pos.y+=((ay+$x)*1.9);pos.z+=((az+$y)*1.9);$3 clr_;dist=pos.x*pos.x+pos.y*pos.y+pos.z*pos.z;$f repelDist=1.3;if(dist<repelDist*repelDist){$f tx=0.0-repelDist*pos.x/dist;$f ty=0.0-repelDist*pos.y/dist;$f tz=0.0-repelDist*pos.z/dist;clr_=$3($x,0.1,0.1);$f k=2.1+$x;pos.x+=(tx-pos.x)*k;pos.y+=(ty-pos.y)*k;pos.z+=(tz-pos.z)*k;}$e{clr_=$3(0.5+$y,0.0,0.5+$z);dist_sq=pos.x*pos.x+pos.y*pos.y+pos.z*pos.z;dist=sqrt(dist_sq);fx=$x/dist_sq;fy=$y/dist_sq;fz=$z/dist_sq;clr_=$3($z+$x+$y);clr_.r+=.1;clr_.b+=.1;ax=fx*pos.x/dist;ay=fy*pos.y/dist;az=fz*pos.z/dist;$f sm=0.01;pos.x=ax/$x*len/something2;pos.y=ay/$y*len/something2;pos.z=az/$z*len/something2;}pos*=10.0*radius;$3 fpos=mix(pos,expPos,factor);clr=mix(clr_,expClr,factor);$4 mvPosition=modelViewMatrix*$4(fpos,1.0);gl_PointSize=1.0;$p=projectionMatrix*mvPosition;}";
var particlesPS = "$v $3 clr;void $m(){gl_FragColor=$4(clr,1.0);}";