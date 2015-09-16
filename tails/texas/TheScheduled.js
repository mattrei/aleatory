import React from "react";
import GL from "gl-react";
import { Surface, Image, Text } from "react-canvas";

const shaders = GL.Shaders.create({
  hueRotate: {
    frag: `
precision highp float;
varying vec2 uv;
uniform sampler2D tex;
uniform float factor;

const mat3 rgb2yiq = mat3(0.299, 0.587, 0.114, 0.595716, -0.274453, -0.321263, 0.211456, -0.522591, 0.311135);
const mat3 yiq2rgb = mat3(1.0, 0.9563, 0.6210, 1.0, -0.2721, -0.6474, 1.0, -1.1070, 1.7046);

void main() {
  vec3 yColor = rgb2yiq * texture2D(tex, uv).rgb;
  float originalHue = atan(yColor.b, yColor.g);
  float finalHue = originalHue + factor;
  float chroma = sqrt(yColor.b*yColor.b+yColor.g*yColor.g);
  vec3 yFinalColor = vec3(yColor.r, chroma * cos(finalHue), chroma * sin(finalHue));
  gl_FragColor = vec4(yiq2rgb*yFinalColor, 1.0);
}
    `
  }
});

class TheScheduled extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      factor: 1,
      img: '',
      text: ''
    };
  }
  componentDidMount() {
    const osc = this.props.osc;
    osc.on("message", (oscMsg) => {
      if (oscMsg.address === '/uniform') {
        var uniformName = oscMsg.args[0]
        var uniformValue = oscMsg.args[1]
        if (uniformName === 'img') {

          //console.log(uniformValue)
          this.setState({
            img: uniformValue
          });  
        }
        if (uniformName === 'date') {
          this.setState({
            text: uniformValue
          });  
        }
      }
    }); 
  }
  render () {
    const { width, height } = this.props;
    const { factor, img, text } = this.state;
    
    return <GL.View
      shader={shaders.hueRotate}
      width={width}
      height={height}
      uniforms={{ factor }}>
      <GL.Target uniform="tex">
        <TheScheduledCanvas width={width} height={height} text={text} img={img} />
      </GL.Target>
    </GL.View>;
  }
}

class TheScheduledCanvas extends React.Component {
  render () {
    const { width, height, text, img } = this.props;
    console.log(img)
    return <Surface width={width} height={height} top={0} left={0}>
      <Image
        crossOrigin={true}
        src= {"data:image/jpeg;base64," + img}
        style={{
          width: width,
          height: width * 244/256,
          top: 0,
          left: 0,
          color: "#7bf"
        }} />
      <Text>Throw me to the wolves</Text>
      <Text>and I will return</Text>
      <Text style={{color: '#fff'}}>{text}</Text>
    </Surface>;
  }
}

export default TheScheduled;
