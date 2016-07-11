import Force3 from '../utils/Force3'
import Points from '../utils/Points'
import Mover from '../utils/Mover'
import PointLight from '../utils/PointLight'

const random = require('random-float')
const randomInt = require('random-int')
const glslify = require('glslify')

const VIS = 'drones'
const conf = {name: 'drones',
  on:false}



const group = new THREE.Group()
group.visible = conf.on
const points = new Points()
const light = new PointLight()

const NUM_MOVERS = 400 // Light particles

const movers = []


const xRadius = 200;
const yRadius = 200;
const zRadius = 200;


const positions = new Float32Array(NUM_MOVERS * 3),
   colors = new Float32Array(NUM_MOVERS * 3),
   opacities = new Float32Array(NUM_MOVERS),
   sizes = new Float32Array(NUM_MOVERS),
   gravity = new THREE.Vector3(0, 0.1, 0)

function drones(scene, events) {


  for (var i = 0; i < NUM_MOVERS; i++) {
         var mover = new Mover();
         var h = randomInt(0, 45);
         var s = randomInt(60, 90);
         var color = new THREE.Color('hsl(' + h + ', ' + s + '%, 50%)');

         mover.init(new THREE.Vector3(randomInt(-100, 100), 0, 0));
         movers.push(mover);
         positions[i * 3 + 0] = mover.position.x;
         positions[i * 3 + 1] = mover.position.y;
         positions[i * 3 + 2] = mover.position.z;
         color.toArray(colors, i * 3);
         opacities[i] = mover.a;
         sizes[i] = mover.size;
       }


       points.init({
         scene: group,
         vs: glslify('../utils/Points.vert'),
         fs: glslify('../utils/Points.frag'),
         positions: positions,
         colors: colors,
         opacities: opacities,
         sizes: sizes,
         texture: createTexture(),
         blending: THREE.AdditiveBlending
       });


       light.init(0xff6600, 1800);
      //  group.add(light.obj);
    const   bg = createBackground();
    //group.add(bg);


  events.on('tick', t => {
    points.applyHook(0, 0.08);
    points.applyDrag(0.2);
    points.updateVelocity();
    points.updatePosition();
    light.applyHook(0, 0.08);
    light.applyDrag(0.2);
    light.updateVelocity();
    light.updatePosition();
      activateMover();
      updateMover();

      movePoints(t.time, 2)
  })

  events.on(VIS + '::visOn', _ => group.visible = true)
  events.on(VIS + '::visOff', _ => group.visible = false)

  scene.addVis(VIS, conf)

  return group
}

var createBackground =  function() {
  var geometry = new THREE.OctahedronGeometry(1500, 3);
  var material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shading: THREE.FlatShading,
    side: THREE.BackSide
  });
  return new THREE.Mesh(geometry, material);
};

  var last_time_activate = Date.now();
var activateMover =  function() {
    var count = 0;
    var now = Date.now();
    if (now - last_time_activate > 10) {
      for (var i = 0; i < movers.length; i++) {
        var mover = movers[i];
        if (mover.is_active) continue;
        var rad1 = THREE.Math.degToRad(Math.log(randomInt(0, 256)) / Math.log(256) * 260);
        var rad2 = THREE.Math.degToRad(randomInt(0, 360));
        var range = (1- Math.log(randomInt(32, 256)) / Math.log(256)) * 12;
        var vector = new THREE.Vector3();
        var force = getSpherical(rad1, rad2, range);
        vector.add(points.position);
        mover.activate();
        mover.init(vector);
        mover.applyForce(force);
        mover.a = 0.2;
        mover.size = Math.pow(12 - range, 2) * randomInt(1, 24) / 10;
        count++;
        if (count >= 6) break;
      }
      last_time_activate = Date.now();
    }
  };

  var getSpherical = function(rad1, rad2, r) {
    var x = Math.cos(rad1) * Math.cos(rad2) * r;
    var z = Math.cos(rad1) * Math.sin(rad2) * r;
    var y = Math.sin(rad1) * r;
    return new THREE.Vector3(x, y, z);
  }

var updateMover =  function() {
   for (var i = 0; i < movers.length; i++) {
     var mover = movers[i];
     if (mover.is_active) {
       mover.time++;
       mover.applyForce(gravity);
       mover.applyDrag(0.01);
       mover.updateVelocity();
       mover.updatePosition();
       mover.position.sub(points.position);
       if (mover.time > 50) {
         mover.size -= 0.7;
         mover.a -= 0.009;
       }
       if (mover.a <= 0) {
         mover.init(new THREE.Vector3(0, 0, 0));
         mover.time = 0;
         mover.a = 0.0;
         mover.inactivate();
       }
     }
     positions[i * 3 + 0] = mover.position.x - points.position.x;
     positions[i * 3 + 1] = mover.position.y - points.position.y;
     positions[i * 3 + 2] = mover.position.z - points.position.z;
     opacities[i] = mover.a;
     sizes[i] = mover.size;
   }
   points.updatePoints();
 };



 var movePoints = function(time, freq) {

   const t = 1 * time;
   const s = 0.07 * freq;

   const x = Math.cos(t) * xRadius,
    y = Math.sin(t * 0.8) * (yRadius + s),
    z = Math.sin(t) * zRadius;


  //  var y = vector.y * document.body.clientHeight / 3;
  //  var z = vector.x * document.body.clientWidth / -3;
    points.anchor.x = x;
    points.anchor.y = y;
    points.anchor.z = z;
    //console.log(x)
    //points.position.set(x,y,z)
  //  light.anchor.y = y;
  //  light.anchor.z = z;
  }

var createTexture =  function() {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var grad = null;
  var texture = null;

  canvas.width = 200;
  canvas.height = 200;
  grad = ctx.createRadialGradient(100, 100, 20, 100, 100, 100);
  grad.addColorStop(0.2, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.arc(100, 100, 100, 0, Math.PI / 180, true);
  ctx.fill();

  texture = new THREE.Texture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

export default drones
