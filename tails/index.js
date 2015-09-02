const React = require("react");

const Slider = require("./Slider");
const HelloGL = require("./HelloGL");

const Saturation = require("./Saturation");
const HueRotate = require("./HueRotate");
const PieProgress = require("./PieProgress");
const OneFingerResponse = require("./OneFingerResponse");
const AnimatedHelloGL = require("./AnimatedHelloGL");
const Blur = require("./Blur");
const ReactCanvasContentExample = require("./ReactCanvasContentExample");

import { Router, Route, Link } from 'react-router';
import { history } from 'react-router/lib/BrowserHistory';


const osc               = require('osc/dist/osc-browser.js');
const oscPort = new osc.WebSocketPort({
    url: "ws://localhost:8081" // URL to your Web Socket server. 
});


oscPort.open();

import TheExecuted from './TheExecuted';
import TheScheduled from './TheScheduledPixi';

const HelloGL1 = require("./HelloGLPage1");
const HelloGL2 = require("./HelloGLPage2");



class HelloGL1Factory extends React.Component {
  render() {
    return <HelloGL1 width={256} height={171} osc={oscPort} />
  }
}

class HelloGL2Factory extends React.Component {
  render() {
    return <HelloGL2 width={556} height={171} osc={oscPort} />
  }
}

class TheExecutedFactory extends React.Component {
  render() {
    return <TheExecuted osc={oscPort} />
  }
}

class TheScheduledFactory extends React.Component {
  render() {
    return <TheScheduled width={556} height={171} osc={oscPort} />
  }
}

class App extends React.Component {
  render() {
    return (
      <div>
        <TheScheduled osc={oscPort} />
        <Link to="/">Home</Link>
        <Link to="/hello1">Hello 1</Link>
        <Link to="/hello2">Hello 2</Link>
        <Link to="/TheExecuted">TheExecuted</Link>
        <Link to="/TheScheduled">TheScheduled</Link>
        {this.props.children}
      </div>
    );
  }
}

var myRouter = React.render((
  <Router history={history}>
    <Route path="/" component={App}>
      <Route path="hello1" component={HelloGL1Factory}/>  
      <Route path="hello2" component={HelloGL2Factory}/>  
      <Route path="TheExecuted" component={TheExecutedFactory}/>  
      <Route path="TheScheduled" component={TheScheduledFactory}/>  
    </Route>
  </Router>
), document.getElementById("container"));


oscPort.on("message", function (oscMsg) {
  if (oscMsg.address === '/page') {
        var pageName = oscMsg.args[0]
        console.log("Page change. "+ pageName)
        myRouter.transitionTo(pageName)
  }
});
