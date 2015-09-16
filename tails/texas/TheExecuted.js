import React from 'react';

import ReactCanvas from 'react-canvas';

import PageContainer from 'react-page-transitions';

var Surface = ReactCanvas.Surface;
var Group = ReactCanvas.Group;
var Image = ReactCanvas.Image;
var Text = ReactCanvas.Text;
var FontFace = ReactCanvas.FontFace;

//const URL = 'http://www.tdcj.state.tx.us/death_row/dr_executed_offenders.html'
const URL = 'http://www.thprd.org'

class TheExecuted extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      name: '',
      age: '',
      race: '',
      date: ''
    };
  }
  componentDidMount () {
    const osc = this.props.osc;
    osc.on("message", (oscMsg) => {
      if (oscMsg.address === '/uniform') {
        var n = oscMsg.args[0]
        var v = oscMsg.args[1]
        if (n === 'executed') {
          let d = JSON.parse(v)
          this.setState(d);  
        }
      }
    }); 
  }
  render() {
    var size = this.getSize();
    console.log(size)
    const {name, age, date} = this.state;
    return (
      <Surface top={0} left={0} width={size.width} height={size.height} enableCSSLayout={true}>
        <Group style={this.getPageStyle()}>
          <Text style={this.getTitleStyle()}>
            {name}
          </Text>
          <Text style={this.getExcerptStyle()}>
            Executed on {date}
          </Text>
          <Text style={this.getExcerptStyle()}>
            at age {age}
          </Text>
        </Group>
      </Surface>
    );
  }
  getSize () {
    return document.getElementById('container').getBoundingClientRect();
  }
  getPageStyle() {
    var size = this.getSize();
    return {
      position: 'relative',
      padding: 14,
      width: size.width,
      height: size.height,
      backgroundColor: this.raceToBgColor(),
      flexDirection: 'column'
    };
  }
  raceToBgColor() {
    if (this.state.race === "White") {
      return "#fff";
    }
    if (this.state.race === "Black") {
      return "#000";
    }
    if (this.state.race === "Hispanic") {
      return "#573A2D";
    }
  }
  raceToFgColor() {
    if (this.state.race === "White") {
      return "#000";
    }
    if (this.state.race === "Black") {
      return "#fff";
    }
    if (this.state.race === "Hispanic") {
      return "#000";
    }
  }
  getTitleStyle() {
    return {
      fontFace: FontFace('Georgia'),
      fontSize: 28,
      lineHeight: 28,
      height: 28,
      marginBottom: 10,
      color: this.raceToFgColor(),
      textAlign: 'center'
    };
  }
  getExcerptStyle() {
    return {
      fontFace: FontFace('Georgia'),
      fontSize: 22,
      lineHeight: 25,
      marginTop: 15,
      flex: 1,
      color: this.raceToFgColor(),
      textAlign: 'center'
    };
  }
}

export default TheExecuted;
