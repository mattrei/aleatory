<!DOCTYPE html>
<html lang="en">
<head>
<title>three.js webgl - lines - cubes - colors</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
<style>body{background-color:#000;margin:0px;overflow:hidden}a{color:#0078ff}#info{position:absolute;top:10px;width:100%;color:#fff;padding:5px;font-family:monospace;font-size:13px;text-align:center;z-index:100}a{color:#ffa500;text-decoration:none}a:hover{color:#0080ff}</style>
</head>
<body>
<div id="info">
<a href="https://twitter.com/BlurSpline/status/396697405774520320" target="_blank">@blurspline</a> Chasing Bezier Lights with
<a href="http://threejs.org" target="_blank">three.js</a><br/><br/>
<a href="#" onclick="return dizzy()">[Make me Dizzy!]</a><br/>
<a href="windows.html">click here if you're on windows</a>
</div>
<script src="http://jabtunes.com/labs/3d/bezierlights/three.min.js.pagespeed.jm.6wUDRfNluV.js"></script>
<script>//<![CDATA[
THREE.ConvolutionShader={defines:{"KERNEL_SIZE_FLOAT":"25.0","KERNEL_SIZE_INT":"25",},uniforms:{"tDiffuse":{type:"t",value:null},"uImageIncrement":{type:"v2",value:new THREE.Vector2(0.001953125,0.0)},"cKernel":{type:"fv1",value:[]}},vertexShader:["uniform vec2 uImageIncrement;","varying vec2 vUv;","void main() {","vUv = uv - ( ( KERNEL_SIZE_FLOAT - 1.0 ) / 2.0 ) * uImageIncrement;","gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );","}"].join("\n"),fragmentShader:["uniform float cKernel[ KERNEL_SIZE_INT ];","uniform sampler2D tDiffuse;","uniform vec2 uImageIncrement;","varying vec2 vUv;","void main() {","vec2 imageCoord = vUv;","vec4 sum = vec4( 0.0, 0.0, 0.0, 0.0 );","for( int i = 0; i < KERNEL_SIZE_INT; i ++ ) {","sum += texture2D( tDiffuse, imageCoord ) * cKernel[ i ];","imageCoord += uImageIncrement;","}","gl_FragColor = sum;","}"].join("\n"),buildKernel:function(sigma){function gauss(x,sigma){return Math.exp(-(x*x)/(2.0*sigma*sigma));}
var i,values,sum,halfWidth,kMaxKernelSize=25,kernelSize=2*Math.ceil(sigma*3.0)+1;if(kernelSize>kMaxKernelSize)kernelSize=kMaxKernelSize;halfWidth=(kernelSize-1)*0.5;values=new Array(kernelSize);sum=0.0;for(i=0;i<kernelSize;++i){values[i]=gauss(i-halfWidth,sigma);sum+=values[i];}
for(i=0;i<kernelSize;++i)values[i]/=sum;return values;}};
//]]></script>
<script>//<![CDATA[
THREE.CopyShader={uniforms:{"tDiffuse":{type:"t",value:null},"opacity":{type:"f",value:1.0}},vertexShader:["varying vec2 vUv;","void main() {","vUv = uv;","gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );","}"].join("\n"),fragmentShader:["uniform float opacity;","uniform sampler2D tDiffuse;","varying vec2 vUv;","void main() {","vec4 texel = texture2D( tDiffuse, vUv );","gl_FragColor = opacity * texel;","}"].join("\n")};
//]]></script>
<script src="http://jabtunes.com/labs/3d/bezierlights/js/shaders/FXAAShader.js.pagespeed.jm.xPLZV1Qbk1.js"></script>
<script src="http://jabtunes.com/labs/3d/bezierlights/js/postprocessing/EffectComposer.js.pagespeed.jm.n7m5KVoyvT.js"></script>
<script>//<![CDATA[
THREE.MaskPass=function(scene,camera){this.scene=scene;this.camera=camera;this.enabled=true;this.clear=true;this.needsSwap=false;this.inverse=false;};THREE.MaskPass.prototype={render:function(renderer,writeBuffer,readBuffer,delta){var context=renderer.context;context.colorMask(false,false,false,false);context.depthMask(false);var writeValue,clearValue;if(this.inverse){writeValue=0;clearValue=1;}else{writeValue=1;clearValue=0;}
context.enable(context.STENCIL_TEST);context.stencilOp(context.REPLACE,context.REPLACE,context.REPLACE);context.stencilFunc(context.ALWAYS,writeValue,0xffffffff);context.clearStencil(clearValue);renderer.render(this.scene,this.camera,readBuffer,this.clear);renderer.render(this.scene,this.camera,writeBuffer,this.clear);context.colorMask(true,true,true,true);context.depthMask(true);context.stencilFunc(context.EQUAL,1,0xffffffff);context.stencilOp(context.KEEP,context.KEEP,context.KEEP);}};THREE.ClearMaskPass=function(){this.enabled=true;};THREE.ClearMaskPass.prototype={render:function(renderer,writeBuffer,readBuffer,delta){var context=renderer.context;context.disable(context.STENCIL_TEST);}};
//]]></script>
<script>//<![CDATA[
THREE.RenderPass=function(scene,camera,overrideMaterial,clearColor,clearAlpha){this.scene=scene;this.camera=camera;this.overrideMaterial=overrideMaterial;this.clearColor=clearColor;this.clearAlpha=(clearAlpha!==undefined)?clearAlpha:1;this.oldClearColor=new THREE.Color();this.oldClearAlpha=1;this.enabled=true;this.clear=true;this.needsSwap=false;};THREE.RenderPass.prototype={render:function(renderer,writeBuffer,readBuffer,delta){this.scene.overrideMaterial=this.overrideMaterial;if(this.clearColor){this.oldClearColor.copy(renderer.getClearColor());this.oldClearAlpha=renderer.getClearAlpha();renderer.setClearColor(this.clearColor,this.clearAlpha);}
renderer.render(this.scene,this.camera,readBuffer,this.clear);if(this.clearColor){renderer.setClearColor(this.oldClearColor,this.oldClearAlpha);}
this.scene.overrideMaterial=null;}};
//]]></script>
<script>//<![CDATA[
THREE.ShaderPass=function(shader,textureID){this.textureID=(textureID!==undefined)?textureID:"tDiffuse";this.uniforms=THREE.UniformsUtils.clone(shader.uniforms);this.material=new THREE.ShaderMaterial({uniforms:this.uniforms,vertexShader:shader.vertexShader,fragmentShader:shader.fragmentShader});this.renderToScreen=false;this.enabled=true;this.needsSwap=true;this.clear=false;};THREE.ShaderPass.prototype={render:function(renderer,writeBuffer,readBuffer,delta){if(this.uniforms[this.textureID]){this.uniforms[this.textureID].value=readBuffer;}
THREE.EffectComposer.quad.material=this.material;if(this.renderToScreen){renderer.render(THREE.EffectComposer.scene,THREE.EffectComposer.camera);}else{renderer.render(THREE.EffectComposer.scene,THREE.EffectComposer.camera,writeBuffer,this.clear);}}};
//]]></script>
<script src="http://jabtunes.com/labs/3d/bezierlights/js/postprocessing/BloomPass.js.pagespeed.jm.8gVQOO0Bms.js"></script>
<script>//<![CDATA[
var Detector={canvas:!!window.CanvasRenderingContext2D,webgl:(function(){try{var canvas=document.createElement('canvas');return!!window.WebGLRenderingContext&&(canvas.getContext('webgl')||canvas.getContext('experimental-webgl'));}catch(e){return false;}})(),workers:!!window.Worker,fileapi:window.File&&window.FileReader&&window.FileList&&window.Blob,getWebGLErrorMessage:function(){var element=document.createElement('div');element.id='webgl-error-message';element.style.fontFamily='monospace';element.style.fontSize='13px';element.style.fontWeight='normal';element.style.textAlign='center';element.style.background='#fff';element.style.color='#000';element.style.padding='1.5em';element.style.width='400px';element.style.margin='5em auto 0';if(!this.webgl){element.innerHTML=window.WebGLRenderingContext?['Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />','Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join('\n'):['Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>','Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join('\n');}
return element;},addGetWebGLMessage:function(parameters){var parent,id,element;parameters=parameters||{};parent=parameters.parent!==undefined?parameters.parent:document.body;id=parameters.id!==undefined?parameters.id:'oldie';element=Detector.getWebGLErrorMessage();element.id=id;parent.appendChild(element);}};
//]]></script>
<script src="http://jabtunes.com/labs/3d/bezierlights/js/libs/stats.min.js.pagespeed.jm.IGPzmnrWg_.js"></script>
<script>if(!Detector.webgl)Detector.addGetWebGLMessage();var effectFXAA;var mouseX=0,mouseY=0,windowHalfX=window.innerWidth/2,windowHalfY=window.innerHeight/2,camera,scene,renderer,material,composer;var POINTS=100;var SPREAD=400;var SUBDIVISIONS=20;var VISIBLE_POINTS=7*SUBDIVISIONS;var SPEED=1.4;var BRUSHES=5;var DIZZY=false;var curve;var j;var chain,points,midpoint;var chains;var brushes=[];function Chain(){this.points=[];this.midpoints=[];this.curve=new THREE.QuadraticBezierCurve3();}
function Brush(){this.geometry=new THREE.Geometry();this.points=[];this.colors=[];this.hueOffset=(Math.random()-0.5)*0.1;}
function addWayPoint(x,y,z,randomRadius){var p=new THREE.Vector3(x,y,z);for(j=BRUSHES;j--;){chain=chains[j];p=p.clone();p.y+=(Math.random()-0.5)*randomRadius;if(DIZZY){p.x+=(Math.random()-0.5)*randomRadius;p.z+=(Math.random()-0.5)*randomRadius;}
chain.points.push(p);points=chain.points;midpoint=p.clone()
l=points.length;if(l==1){midpoint.add(p)}else{midpoint.add(points[l-2])}
midpoint.multiplyScalar(0.5);chain.midpoints.push(midpoint);}}
function restart(){chains=[];for(j=BRUSHES;j--;){chains.push(new Chain());}
for(i=0;i<POINTS;i++){randomRadius=10.20+Math.random()*40;addWayPoint(SPREAD*(Math.random()-0.5),SPREAD*(Math.random()-0.5),SPREAD*(Math.random()-0.5),randomRadius);}
if(brushes.length)for(b=BRUSHES;b--;){brush=brushes[b]
lpoints=[];for(i=0;i<POINTS-1;i++){chain=chains[b];curve=chain.curve;midpoints=chain.midpoints;points=chain.points;curve.v0=midpoints[i];curve.v1=points[i];curve.v2=midpoints[i+1];for(j=0;j<SUBDIVISIONS;j++){lpoints.push(curve.getPoint(j/SUBDIVISIONS))}}
brush.points=lpoints;}
t=0;}
function dizzy(){DIZZY=true;camera.setLens(16);SPEED=0.5;restart();return false;}
var t=0,u,v;var tmp=new THREE.Vector3();var lookAt=new THREE.Vector3();init();animate();function init(){restart();var i,container;container=document.createElement('div');document.body.appendChild(container);camera=new THREE.PerspectiveCamera(33,window.innerWidth/window.innerHeight,1,10000);camera.position.z=700;scene=new THREE.Scene();renderer=new THREE.WebGLRenderer({antialias:false,alpha:false});renderer.setSize(window.innerWidth,window.innerHeight);renderer.autoClear=false;container.appendChild(renderer.domElement);material=new THREE.LineBasicMaterial({color:0xffffff,opacity:1,linewidth:5,vertexColors:THREE.VertexColors});var line;for(b=BRUSHES;b--;){brush=new Brush();brushes.push(brush);lpoints=brush.points;for(i=0;i<POINTS-1;i++){chain=chains[b];curve=chain.curve;midpoints=chain.midpoints;points=chain.points;curve.v0=midpoints[i];curve.v1=points[i];curve.v2=midpoints[i+1];for(j=0;j<SUBDIVISIONS;j++){lpoints.push(curve.getPoint(j/SUBDIVISIONS))}}}
for(b=BRUSHES;b--;){brush=brushes[b]
geometry=brush.geometry;line=new THREE.Line(geometry,material);scene.add(line);colors=geometry.colors;for(i=0;i<VISIBLE_POINTS;i++){geometry.vertices.push(new THREE.Vector3());colors[i]=new THREE.Color(0xffffff);}}
stats=new Stats();stats.domElement.style.position='absolute';stats.domElement.style.top='0px';container.appendChild(stats.domElement);document.addEventListener('mousedown',restart,false);document.addEventListener('mousemove',onDocumentMouseMove,false);document.addEventListener('touchstart',onDocumentTouchStart,false);document.addEventListener('touchmove',onDocumentTouchMove,false);var renderModel=new THREE.RenderPass(scene,camera);var effectBloom=new THREE.BloomPass(1.3+1);var effectCopy=new THREE.ShaderPass(THREE.CopyShader);effectFXAA=new THREE.ShaderPass(THREE.FXAAShader);var width=window.innerWidth||2;var height=window.innerHeight||2;effectFXAA.uniforms['resolution'].value.set(1/width,1/height);effectCopy.renderToScreen=true;composer=new THREE.EffectComposer(renderer);composer.addPass(renderModel);composer.addPass(effectFXAA);composer.addPass(effectBloom);composer.addPass(effectCopy);window.addEventListener('resize',onWindowResize,false);}
function onWindowResize(){windowHalfX=window.innerWidth/2;windowHalfY=window.innerHeight/2;camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);effectFXAA.uniforms['resolution'].value.set(1/window.innerWidth,1/window.innerHeight);composer.reset();}
function onDocumentMouseMove(event){mouseX=event.clientX-windowHalfX;mouseY=event.clientY-windowHalfY;}
function onDocumentTouchStart(event){if(event.touches.length>1){event.preventDefault();mouseX=event.touches[0].pageX-windowHalfX;mouseY=event.touches[0].pageY-windowHalfY;}}
function onDocumentTouchMove(event){if(event.touches.length==1){event.preventDefault();mouseX=event.touches[0].pageX-windowHalfX;mouseY=event.touches[0].pageY-windowHalfY;}}
function animate(){requestAnimationFrame(animate);render();stats.update();}
function render(){t+=SPEED;u=t|0;for(j=BRUSHES;j--;){brush=brushes[j]
geometry=brush.geometry;lpoints=brush.points;for(i=0;i<VISIBLE_POINTS;i++){v=(i+u)%lpoints.length;geometry.vertices[i].copy(lpoints[v]);d=i/VISIBLE_POINTS;d=1-(1-d)*(1-d);geometry.colors[i].setHSL(brush.hueOffset+(v/lpoints.length*4)%1,0.7,0.2+d*0.4);}
geometry.verticesNeedUpdate=true;geometry.colorsNeedUpdate=true;}
if(!DIZZY){var targetAngle=mouseX/windowHalfX*Math.PI;var targetX=Math.cos(targetAngle)*500;var targetZ=Math.sin(targetAngle)*300;camera.position.x+=(targetX-camera.position.x)*.04;camera.position.y+=(-mouseY+200-camera.position.y)*.05;camera.position.z+=(targetZ-camera.position.z)*.04;camera.lookAt(scene.position);}else{v=geometry.vertices;tmp.copy(v[v.length*0.4|0]);tmp.y+=50;camera.position.x+=(tmp.x-camera.position.x)*.04;camera.position.y+=(tmp.y-camera.position.y)*.05;camera.position.z+=(tmp.z-camera.position.z)*.04;tmp.copy(lookAt)
lookAt.subVectors(v[v.length-2],lookAt).multiplyScalar(0.5);lookAt.add(tmp)
camera.lookAt(lookAt);}
var time=Date.now()*0.0005;renderer.clear();composer.render();}</script>
<script type="text/javascript">var _gaq=_gaq||[];_gaq.push(['_setAccount','UA-7549263-1']);_gaq.push(['_trackPageview']);(function(){var ga=document.createElement('script');ga.type='text/javascript';ga.async=true;ga.src=('https:'==document.location.protocol?'https://ssl':'http://www')+'.google-analytics.com/ga.js';var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(ga,s);})();</script>
<script>//<![CDATA[
(function(){var d=encodeURIComponent,f=window,g=document,h="documentElement",k="length",l="prototype",m="body",p="&",s="&ci=",t=",",u="?",v="Content-Type",w="Microsoft.XMLHTTP",x="Msxml2.XMLHTTP",y="POST",z="application/x-www-form-urlencoded",A="img",B="input",C="load",D="oh=",E="on",F="pagespeed_url_hash",G="url=";f.pagespeed=f.pagespeed||{};var H=f.pagespeed,I=function(a,b,c){this.c=a;this.e=b;this.d=c;this.b=this.f();this.a={}};I[l].f=function(){return{height:f.innerHeight||g[h].clientHeight||g[m].clientHeight,width:f.innerWidth||g[h].clientWidth||g[m].clientWidth}};I[l].g=function(a){a=a.getBoundingClientRect();return{top:a.top+(void 0!==f.pageYOffset?f.pageYOffset:(g[h]||g[m].parentNode||g[m]).scrollTop),left:a.left+(void 0!==f.pageXOffset?f.pageXOffset:(g[h]||g[m].parentNode||g[m]).scrollLeft)}};I[l].h=function(a){if(0>=a.offsetWidth&&0>=a.offsetHeight)return!1;a=this.g(a);var b=a.top.toString()+t+a.left.toString();if(this.a.hasOwnProperty(b))return!1;this.a[b]=!0;return a.top<=this.b.height&&a.left<=this.b.width};I[l].i=function(a){var b;if(f.XMLHttpRequest)b=new XMLHttpRequest;else if(f.ActiveXObject)try{b=new ActiveXObject(x)}catch(c){try{b=new ActiveXObject(w)}catch(e){}}if(!b)return!1;b.open(y,this.c+(-1==this.c.indexOf(u)?u:p)+G+d(this.e));b.setRequestHeader(v,z);b.send(a);return!0};I[l].k=function(){for(var a=[A,B],b=[],c={},e=0;e<a[k];++e)for(var q=g.getElementsByTagName(a[e]),n=0;n<q[k];++n){var r=q[n].getAttribute(F);r&&(q[n].getBoundingClientRect&&this.h(q[n]))&&!(r in c)&&(b.push(r),c[r]=!0)}if(0!=b[k]){a=D+this.d;a+=s+d(b[0]);for(e=1;e<b[k];++e){c=t+d(b[e]);if(131072<a[k]+c[k])break;a+=c}H.criticalImagesBeaconData=a;this.i(a)}};H.j=function(a,b,c){if(a.addEventListener)a.addEventListener(b,c,!1);else if(a.attachEvent)a.attachEvent(E+b,c);else{var e=a[E+b];a[E+b]=function(){c.call(this);e&&e.call(this)}}};H.l=function(a,b,c){var e=new I(a,b,c);H.j(f,C,function(){f.setTimeout(function(){e.k()},0)})};H.criticalImagesBeaconInit=H.l;})();pagespeed.criticalImagesBeaconInit('/mod_pagespeed_beacon','http://jabtunes.com/labs/3d/bezierlights/','f81aupMvhr');
//]]></script></body>
</html>