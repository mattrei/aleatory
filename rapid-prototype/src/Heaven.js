import THREE from 'three'; 
import OC    from 'three-orbit-controls';
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import FirstPersonControls from './controls/FirstPersonControls' ;

const SKYBOX_PATH = "/assets/skybox/"
const NUM_BIRDS = 400

// http://www.themigrantsfiles.com/
// https://docs.google.com/spreadsheets/d/1YNqIzyQfEn4i_be2GGWESnG2Q80E_fLASffsXdCOftI/edit#gid=1085726718

class Demo {
  constructor(args) 
  {
    this.startStats();
    this.startGUI();

    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.controls = null;
    this.counter  = 0;
    this.clock    = new THREE.Clock();

    this.createRender();
    this.createScene();
    this.addObjects();


    this.birds = []
    this.boids = []

    this.addBirds()

    this.onResize();
    this.update();
  }

  startStats()
  {
    this.stats = new Stats(); 
    this.stats.domElement.style.position = 'absolute';
    document.body.appendChild(this.stats.domElement);
  }

  createRender()
  {
    this.renderer = new THREE.WebGLRenderer( {
        antialias : true,
        clearColor: 0
    } );
    document.body.appendChild(this.renderer.domElement)
  }

  createScene()
  {
    const OrbitControls = OC(THREE);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 10000 );
    this.camera.position.set(0, 45, 240);
    //this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    //this.controls.maxDistance = 500;

    this.scene = new THREE.Scene();

    this.controls = new THREE.FirstPersonControls( this.camera );
    this.controls.movementSpeed = 300;
    this.controls.lookSpeed = 0.3;
  }

  addObjects()
  {
    var gridHelper = new THREE.GridHelper( 100, 10 );        
    this.scene.add( gridHelper );


    let materials = [

          new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( SKYBOX_PATH + 'px.jpg' ) } ), // right
          new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( SKYBOX_PATH + 'nx.jpg' ) } ), // left
          new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( SKYBOX_PATH + 'py.jpg' ) } ), // top
          new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( SKYBOX_PATH + 'ny.jpg' ) } ), // bottom
          new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( SKYBOX_PATH + 'pz.jpg' ) } ), // back
          new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( SKYBOX_PATH + 'nz.jpg' ) } )  // front

        ];

    let mesh = new THREE.Mesh( new THREE.BoxGeometry( 10000, 10000, 10000, 7, 7, 7 ),
     new THREE.MeshFaceMaterial( materials ) );
    mesh.scale.x = - 1;
    
    this.scene.add(mesh);

  }

  addBirds() 
  {

        for ( var i = 0; i < NUM_BIRDS; i ++ ) {

          let boid = this.boids[ i ] = new Boid();
          boid.position.x = Math.random() * 600 - 300;
          boid.position.y = Math.random() * 600 - 300;
          boid.position.z = Math.random() * 600 - 300;
          boid.velocity.x = Math.random() * 2 - 1;
          boid.velocity.y = Math.random() * 2 - 1;
          boid.velocity.z = Math.random() * 2 - 1;
          boid.setAvoidWalls( true );
          boid.setWorldSize( 600, 600, 600 );

          let bird = this.birds[ i ] = new THREE.Mesh( new Bird(), new THREE.MeshBasicMaterial( { color:Math.random() * 0xffffff, side: THREE.DoubleSide } ) );
          bird.phase = Math.floor( Math.random() * 62.83 );
          this.scene.add( bird );


        }
  }

  startGUI()
  {
    // var gui = new dat.GUI()
    // gui.add(camera.position, 'x', 0, 400)
    // gui.add(camera.position, 'y', 0, 400)
    // gui.add(camera.position, 'z', 0, 400)
  }

  update()
  {
    this.stats.begin();

    this.controls.update( this.clock.getDelta() );
    this.render()

    this.renderer.render(this.scene, this.camera);

    this.stats.end()
    requestAnimationFrame(this.update.bind(this));
  }

  render() 
  {
      for ( var i = 0, il = this.birds.length; i < il; i++ ) {

          let boid = this.boids[ i ];
          boid.run( this.boids );

          let bird = this.birds[ i ];
          bird.position.copy( this.boids[ i ].position );

          let color = bird.material.color;
          color.r = color.g = color.b = ( 500 - bird.position.z ) / 1000;

          bird.rotation.y = Math.atan2( - boid.velocity.z, boid.velocity.x );
          bird.rotation.z = Math.asin( boid.velocity.y / boid.velocity.length() );

          bird.phase = ( bird.phase + ( Math.max( 0, bird.rotation.z ) + 0.1 )  ) % 62.83;
          bird.geometry.vertices[ 5 ].y = bird.geometry.vertices[ 4 ].y = Math.sin( bird.phase ) * 5;

        }

  }

  onResize()
  {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}

export default Demo;


    // Based on http://www.openprocessing.org/visuals/?visualID=6910

      var Boid = function() {

        var vector = new THREE.Vector3(),
        _acceleration, _width = 500, _height = 500, _depth = 200, _goal, _neighborhoodRadius = 100,
        _maxSpeed = 4, _maxSteerForce = 0.1, _avoidWalls = false;

        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        _acceleration = new THREE.Vector3();

        this.setGoal = function ( target ) {

          _goal = target;

        };

        this.setAvoidWalls = function ( value ) {

          _avoidWalls = value;

        };

        this.setWorldSize = function ( width, height, depth ) {

          _width = width;
          _height = height;
          _depth = depth;

        };

        this.run = function ( boids ) {

          if ( _avoidWalls ) {

            vector.set( - _width, this.position.y, this.position.z );
            vector = this.avoid( vector );
            vector.multiplyScalar( 5 );
            _acceleration.add( vector );

            vector.set( _width, this.position.y, this.position.z );
            vector = this.avoid( vector );
            vector.multiplyScalar( 5 );
            _acceleration.add( vector );

            vector.set( this.position.x, - _height, this.position.z );
            vector = this.avoid( vector );
            vector.multiplyScalar( 5 );
            _acceleration.add( vector );

            vector.set( this.position.x, _height, this.position.z );
            vector = this.avoid( vector );
            vector.multiplyScalar( 5 );
            _acceleration.add( vector );

            vector.set( this.position.x, this.position.y, - _depth );
            vector = this.avoid( vector );
            vector.multiplyScalar( 5 );
            _acceleration.add( vector );

            vector.set( this.position.x, this.position.y, _depth );
            vector = this.avoid( vector );
            vector.multiplyScalar( 5 );
            _acceleration.add( vector );

          }/* else {

            this.checkBounds();

          }
          */

          if ( Math.random() > 0.5 ) {

            this.flock( boids );

          }

          this.move();

        };

        this.flock = function ( boids ) {

          if ( _goal ) {

            _acceleration.add( this.reach( _goal, 0.005 ) );

          }

          _acceleration.add( this.alignment( boids ) );
          _acceleration.add( this.cohesion( boids ) );
          _acceleration.add( this.separation( boids ) );

        };

        this.move = function () {

          this.velocity.add( _acceleration );

          var l = this.velocity.length();

          if ( l > _maxSpeed ) {

            this.velocity.divideScalar( l / _maxSpeed );

          }

          this.position.add( this.velocity );
          _acceleration.set( 0, 0, 0 );

        };

        this.checkBounds = function () {

          if ( this.position.x >   _width ) this.position.x = - _width;
          if ( this.position.x < - _width ) this.position.x =   _width;
          if ( this.position.y >   _height ) this.position.y = - _height;
          if ( this.position.y < - _height ) this.position.y =  _height;
          if ( this.position.z >  _depth ) this.position.z = - _depth;
          if ( this.position.z < - _depth ) this.position.z =  _depth;

        };

        //

        this.avoid = function ( target ) {

          var steer = new THREE.Vector3();

          steer.copy( this.position );
          steer.sub( target );

          steer.multiplyScalar( 1 / this.position.distanceToSquared( target ) );

          return steer;

        };

        this.repulse = function ( target ) {

          var distance = this.position.distanceTo( target );

          if ( distance < 150 ) {

            var steer = new THREE.Vector3();

            steer.subVectors( this.position, target );
            steer.multiplyScalar( 0.5 / distance );

            _acceleration.add( steer );

          }

        };

        this.reach = function ( target, amount ) {

          var steer = new THREE.Vector3();

          steer.subVectors( target, this.position );
          steer.multiplyScalar( amount );

          return steer;

        };

        this.alignment = function ( boids ) {

          var boid, velSum = new THREE.Vector3(),
          count = 0;

          for ( var i = 0, il = boids.length; i < il; i++ ) {

            if ( Math.random() > 0.6 ) continue;

            boid = boids[ i ];

            let distance = boid.position.distanceTo( this.position );

            if ( distance > 0 && distance <= _neighborhoodRadius ) {

              velSum.add( boid.velocity );
              count++;

            }

          }

          if ( count > 0 ) {

            velSum.divideScalar( count );

            var l = velSum.length();

            if ( l > _maxSteerForce ) {

              velSum.divideScalar( l / _maxSteerForce );

            }

          }

          return velSum;

        };

        this.cohesion = function ( boids ) {

          var boid, distance,
          posSum = new THREE.Vector3(),
          steer = new THREE.Vector3(),
          count = 0;

          for ( var i = 0, il = boids.length; i < il; i ++ ) {

            if ( Math.random() > 0.6 ) continue;

            boid = boids[ i ];
            distance = boid.position.distanceTo( this.position );

            if ( distance > 0 && distance <= _neighborhoodRadius ) {

              posSum.add( boid.position );
              count++;

            }

          }

          if ( count > 0 ) {

            posSum.divideScalar( count );

          }

          steer.subVectors( posSum, this.position );

          var l = steer.length();

          if ( l > _maxSteerForce ) {

            steer.divideScalar( l / _maxSteerForce );

          }

          return steer;

        };

        this.separation = function ( boids ) {

          var boid, distance,
          posSum = new THREE.Vector3(),
          repulse = new THREE.Vector3();

          for ( var i = 0, il = boids.length; i < il; i ++ ) {

            if ( Math.random() > 0.6 ) continue;

            boid = boids[ i ];
            distance = boid.position.distanceTo( this.position );

            if ( distance > 0 && distance <= _neighborhoodRadius ) {

              repulse.subVectors( this.position, boid.position );
              repulse.normalize();
              repulse.divideScalar( distance );
              posSum.add( repulse );

            }

          }

          return posSum;

        }

      }


var Bird = function () {

  var scope = this;

  THREE.Geometry.call( this );

  v(   5,   0,   0 );
  v( - 5, - 2,   1 );
  v( - 5,   0,   0 );
  v( - 5, - 2, - 1 );

  v(   0,   2, - 6 );
  v(   0,   2,   6 );
  v(   2,   0,   0 );
  v( - 3,   0,   0 );

  f3( 0, 2, 1 );
  // f3( 0, 3, 2 );

  f3( 4, 7, 6 );
  f3( 5, 6, 7 );

  this.computeFaceNormals();

  function v( x, y, z ) {

    scope.vertices.push( new THREE.Vector3( x, y, z ) );

  }

  function f3( a, b, c ) {

    scope.faces.push( new THREE.Face3( a, b, c ) );

  }

}

Bird.prototype = Object.create( THREE.Geometry.prototype );
Bird.prototype.constructor = Bird;