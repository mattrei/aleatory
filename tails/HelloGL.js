const React = require("react");
const GL = require("gl-react");





const shaders = GL.Shaders.create({
  helloGL: {
    frag: `
precision highp float;
varying vec2 uv; // This variable vary in all pixel position (normalized from vec2(0.0,0.0) to vec2(1.0,1.0))

uniform float value;

void main () { // This function is called FOR EACH PIXEL
  gl_FragColor = vec4(uv.x, uv.y, value, 1.0); // red vary over X, green vary over Y, blue is 50%, alpha is 100%.
}
    `
  }
});

class HelloGL extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      value: 0
    };
  }
  componentDidMount () {
    const loop = time => {
      requestAnimationFrame(loop);

      const osc = this.props.osc;
      osc.on("message", function (oscMsg) {
          if (oscMsg.address === '/uniform') {
              var uniformName = oscMsg.args[0]
              var uniformValue = oscMsg.args[1]
              this.setState({
                value: uniformValue
              });
          }
      }.bind(this));
    };
    requestAnimationFrame(loop);
  }
  render () {
    const { width, height } = this.props;
    const { value } = this.state;
    return <GL.View
      shader={shaders.helloGL}
      width={width}
      height={height}
      uniforms={{ value }}
    />;
  }
}

module.exports = HelloGL;
