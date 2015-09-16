const React = require("react");


import Headlines from './refugees/Headlines';
import Lager from './refugees/Lager';
import Hommage from './rand/Hommage';
import Hommage2 from './rand/Hommage2';


var myRouter = React.render((
  <Hommage w={1000} h={600} />
), document.getElementById("react-container"));

