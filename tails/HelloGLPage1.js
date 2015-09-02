const React = require("react/addons");
const GL = require("gl-react");

const PageContainer = require('react-page-transitions');


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

class HelloGL1 extends React.Component {
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
      osc.on("message", this.handleOsc.bind(this));
    };
    requestAnimationFrame(loop);
  }
  handleOsc(oscMsg) {
    if (oscMsg.address === '/uniform') {
              var uniformName = oscMsg.args[0]
              var uniformValue = oscMsg.args[1]
              this.setState({
                value: uniformValue
              });
          }
  }
  render () {
    const { width, height } = this.props;
    const { value } = this.state;
    return (
      <PageContainer>
        <GL.View
          shader={shaders.helloGL}
          width={width}
          height={height}
          uniforms={{ value }}
        />
    </PageContainer>);
  }
}

module.exports = HelloGL1;
