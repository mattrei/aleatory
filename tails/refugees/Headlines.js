import React from "react"
import {ReactPIXI, Stage, Text, BitmapText, DisplayObjectContainer} from "react-pixi"
import PIXI from "pixi.js"
import {Ease, Chain} from "react-ease"

class NewsItem extends React.Component {

    render () {
        return <Text text={this.props.title} x={this.props.x} y={this.props.y} 
                style={this.props.fontstyle} 
                anchor={new PIXI.Point(0,0)} key={this.props.key} />
               
    }
}

class News extends React.Component {

    constructor(props) {
        super(props)
        this.filter = [new PIXI.filters.BlurFilter(),
                        new PIXI.filters.ColorMatrixFilter(),
                        new PIXI.filters.TwistFilter()]
    }
    componentDidMount() {

    }

    render () {
        
        const fontSize = 40
        const gap = 20
        let news = []
        let y = 0
        let startx = this.props.width + (Math.random() * 100)
        let newsHeight = this.props.height / 3

        this.props.news.map((n, i) => {
            y += fontSize + gap
            let fontstyle = {font: fontSize + 'px Arial', dropShadow:false, fill: 0xff00ff}
            news.push(<NewsItem key={i} title={n.title} source={n.source} 
                filter={this.filter} x={0} y={y}
                fontstyle={fontstyle} />)
        })

        let fontstyle = {font: fontSize + 'px Arial', dropShadow:false, fill: 0xff00ff}
        let newsItems = []
        for (var i=0; i < 3; i++) {
            y = y + fontSize + gap
            newsItems.push(<Chain key={i} sequence={[
      {from: this.props.width, to: 0, duration: 4000}]}
     onProgress={(i, val, done) => {done && console.log('mat')}}
     repeat={2}>
      {(val) => 
                <NewsItem ref={"newsItem" + i} key={i} title={"ad"} source={""} 
                filter={this.filter} x={val} y={y}
                fontstyle={fontstyle}
                width={this.props.width} /> 
            }
            </Chain>
                )
        }

        
        return <Stage width={this.props.width} height={this.props.height}>
                {newsItems}
            </Stage>    

/*
        return <Chain sequence={[
      {from: 0, to: 100, duration: 1000}]}
     onProgress={(i, val, done) => {done && console.log('mat')}}
     repeat={2}>
      {(val) => 
            
            <Stage width={this.props.width} height={this.props.height}>
                {news}
            </Stage>    
            }
            </Chain>
            */
    }
}

const news_sample = [{title: "Ungarn und Bulgaren wollen Israels Hightech-Zau",
    description: "ort wurde ein 175 Kilometer langer und 1,5 Meter hoher Zaun gebaut, den die Flüchtlinge aber problemlos überwinden. Ungarn will deshalb eine Kopie jenes Hightech-Zauns errichten, mit dem Israel seine Grenze zu Ägypten schützt, wie die ungarische",
    source: "Kronen Zeitung",
    date: "2015-09-04"},
    {title: "Flüchtlinge Ungarn beschleunigt Bau von Grenzzaun zu Serbie",
    description: "ort wurde ein 175 Kilometer langer und 1,5 Meter hoher Zaun gebaut, den die Flüchtlinge aber problemlos überwinden. Ungarn will deshalb eine Kopie jenes Hightech-Zauns errichten, mit dem Israel seine Grenze zu Ägypten schützt, wie die ungarische",
    source: "derStandard",
    date: "2015-09-06"},
]

class Headlines extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            news: news_sample,
            images: []
        }
        this._animate = this._animate.bind(this)

        this.renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight,
            {backgroundColor: 0xffffff})
        this.stage = new PIXI.Container()



        this.playerOneText = new PIXI.Text('Player 1: 0')
    }
    componentDidMount() {

        let container = this.refs.container.getDOMNode()
        
        container.appendChild(this.renderer.view);

        // Create player one Text
        
     
        // Position the text
        this.playerOneText.x = 20;
        this.playerOneText.y = 15;
     
        // Add Player one Text to the stage
        this.stage.addChild(this.playerOneText);

        this._animate()
    }
    _animate () {
        this.playerOneText.y += 0.3


        this.renderer.render(this.stage)

        requestAnimationFrame(this._animate)
    }
    /*
    shouldComponentUpdate(nextProps, nextState) {
        return false
    }
    */
    render () {
        let {width, height} = this.props

        return <div className="container" ref="container">
        </div>
    }

}

export default Headlines