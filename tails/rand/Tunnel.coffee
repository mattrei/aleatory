#/////////////////////////////////#
# VARS

webgl = null
gui   = null

animation = true
lookAhead = true

tubeGeometry = null
scale = 10
binormal = new THREE.Vector3()
normal = new THREE.Vector3()

#/////////////////////////////////#
# MAIN + INIT

init = ->
  webgl = new Webgl(window.innerWidth, window.innerHeight)
  $('.three').append webgl.renderer.domElement
  #gui = new (dat.GUI)
  #gui.close()
  $(window).on 'resize', resizeHandler
  animate()

resizeHandler = ->
  webgl.resize window.innerWidth, window.innerHeight

animate = ->
  requestAnimationFrame animate
  webgl.render()

$(document).ready init


#/////////////////////////////////
# Three.js Scene Basics

Webgl = do ->

  Webgl = (width, height) ->
    # Basic three.js setup
    @scene = new (THREE.Scene)
    # scene cam
    @camera = new (THREE.PerspectiveCamera)(50, width / height, 1, 10000)
    @camera.position.z = 100
    
    #spline cam
    @splineCamera = new (THREE.PerspectiveCamera)(85, width / height, 0.01, 1000)
    @scene.add @splineCamera
    
    # the renderer
    @renderer = new (THREE.WebGLRenderer)(antialias: true)
    @renderer.setPixelRatio(window.devicePixelRatio)
    @renderer.setSize width, height
    @renderer.setClearColor 0x000000
    
    # add the tooooob
    @tube = new Tube
    @tube.position.set 0, 0, 0
    @tube.scale.set scale, scale, scale
    @scene.add @tube
    
    # setup post-processing
    @renderer.autoClear = false
    @composer = new THREE.EffectComposer(@renderer)
    @composer.addPass new THREE.RenderPass(@scene, @splineCamera)
    
    # add a bleach pass
    @shaderEffect = new THREE.ShaderPass(THREE.BleachBypassShader)
    @shaderEffect.uniforms["opacity"].value = 0.95
    @composer.addPass @shaderEffect
    
    # add a bloom pass
    @bloomEffect = new THREE.BloomPass(2.5)
    @composer.addPass @bloomEffect
    
    # add a horz tilt shift pass
    bluriness = 1.5
    @hTiltPass = new THREE.ShaderPass(THREE.HorizontalTiltShiftShader)
    @hTiltPass.uniforms['h'].value = bluriness / (0.75 * width)
    @hTiltPass.uniforms['r'].value = 0.5
    @composer.addPass @hTiltPass
    
    # add a vert title shift pass
    @vTiltPass = new THREE.ShaderPass(THREE.VerticalTiltShiftShader)
    @vTiltPass.uniforms['v'].value = bluriness / (0.75 * width)
    @vTiltPass.uniforms['r'].value = 0.5
    @composer.addPass @vTiltPass
    
    # @bokehPass = new THREE.BokehPass( @scene, @splineCamera, {
    #   focus: 1.0
    #   aperture: 0.025
    #   maxblur: 1.0
    #   width: width
    #   height: height
    # })
    # @composer.addPass @bokehPass
    
    # add a film pass
    @filmPass = new THREE.FilmPass(0.25, 0.25, 2048, false)
    
    # render to screen so we can see something
    @filmPass.renderToScreen = true
    @composer.addPass @filmPass
    
    return

  Webgl::resize = (width, height) ->
    @camera.aspect = width / height
    @camera.updateProjectionMatrix()
    @renderer.setSize width, height
    return

  Webgl::render = ->
    # Animate Camera Along Spline
    time = Date.now()
    looptime = 25 * 1000
    t = time % looptime / looptime
    pos = tubeGeometry.parameters.path.getPointAt(t)
    pos.multiplyScalar scale
    
    # interpolation
    segments = tubeGeometry.tangents.length
    pickt = t * segments
    pick = Math.floor(pickt)
    pickNext = (pick + 1) % segments
    binormal.subVectors tubeGeometry.binormals[pickNext], tubeGeometry.binormals[pick]
    binormal.multiplyScalar(pickt - pick).add tubeGeometry.binormals[pick]
    dir = tubeGeometry.parameters.path.getTangentAt(t)
    offset = 5
    normal.copy(binormal).cross dir
    
    # We move on a offset on its binormal
    pos.add normal.clone().multiplyScalar(offset)
    @splineCamera.position.copy pos
    
    # Using arclength for stablization in look ahead.
    lookAt = tubeGeometry.parameters.path.getPointAt((t + 30 / tubeGeometry.parameters.path.getLength()) % 1).multiplyScalar(scale)
    
    # Camera Orientation - up orientation via normal
    if !lookAhead
      lookAt.copy(pos).add dir
    @splineCamera.matrix.lookAt @splineCamera.position, lookAt, normal
    @splineCamera.rotation.setFromRotationMatrix @splineCamera.matrix, @splineCamera.rotation.order
    
    @renderer.render @scene, if animation == true then @splineCamera else @camera
    
    if @composer
      @composer.render()
    
    return

  Webgl


#/////////////////////////////////
# TOOOOOB

Tube = do ->

  Tube = ->
    THREE.Object3D.call this
    extrudePath = new THREE.Curves.TrefoilKnot()
    segments = 200
    radiusSegments = 20
    repeatX = 10
    closed = true
    
    tubeGeometry = new (THREE.TubeGeometry)(extrudePath, segments, 4, radiusSegments, closed)
    
    THREE.ImageUtils.crossOrigin = ''
    texture = THREE.ImageUtils.loadTexture( "https://s3-us-west-2.amazonaws.com/s.cdpn.io/21693/grid-two-two.png" )
    texture.minFilter = THREE.NearestFilter
    texture.wrapS = THREE.RepeatWrapping
    texture.repeat.x = repeatX
    
    alphaTexture = THREE.ImageUtils.loadTexture("https://s3-us-west-2.amazonaws.com/s.cdpn.io/21693/grid-two-two-alpha.png")
    alphaTexture.minFilter = THREE.NearestFilter
    alphaTexture.wrapS = THREE.RepeatWrapping
    alphaTexture.repeat.x = repeatX
    
    gridTexture = THREE.ImageUtils.loadTexture("https://s3-us-west-2.amazonaws.com/s.cdpn.io/21693/wire-grid.png")
    gridTexture.minFilter = THREE.NearestFilter
    gridTexture.wrapS = THREE.RepeatWrapping
    gridTexture.repeat.x = repeatX
    
    @mesh = THREE.SceneUtils.createMultiMaterialObject(tubeGeometry, [
      new (THREE.MeshBasicMaterial)(
        side: THREE.DoubleSide
        map: gridTexture
        #alphaMap: gridTexture
        transparent: true)
      
      new (THREE.MeshBasicMaterial)(
        color: 0xB0E6E1
        side: THREE.BackSide
        map: texture
        #alphaMap: alphaTexture
        transparent: false)
    ])
    
    @add @mesh
    
  Tube.prototype = new (THREE.Object3D)
  Tube::constructor = Tube

  Tube::update = ->
    @mesh.rotation.y += 0.01
  

  Tube