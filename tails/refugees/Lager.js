import React from 'react'
import L from 'leaflet'
import Routing from 'leaflet-routing-machine'
import { Map, Marker, Popup, TileLayer, CanvasTileLayer } from 'react-leaflet'
import TweenLite from 'gsap-react-plugin'
import ReactMotion, {Spring, presets} from "react-motion"
import {Ease, Chain} from "react-ease"

const positions = {start: [51.505, -0.09], end: [51.55, -0.091]}


class Lager extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      route: null
    }
  }

  componentDidMount() {
    
    let map = this.refs.map.leafletElement

    let rr = L.Routing.control({
      waypoints: [
        L.latLng(57.74, 11.94),
        L.latLng(57.6792, 11.949)
      ]
    }).addTo(map);  

    rr.on('routesfound', e => {this.routeFound(e)})
  }
  routeFound(e) {
    let route = e.routes[0],
        data = getData(route)

    let values = data.map(d => {
            var x = d.geometry.coordinates[0]
            var y = d.geometry.coordinates[1]
            return {lat: x, lng: y}
        })
    //console.log(values)
    this.setState({route: values})
    //console.log(values)
  }
  

  render() {

    let r = this.state.route
    let c = [{from: [0,0], to: [1,1]}]
    if (r) {

      
      for (let i=0; i<4 /*r.length-1*/; i++) {
        c.push({from: [r[i].lat, r[i].lng], 
          to: [r[i+1].lat, r[i+1].lng]} )
      }
      console.log(c)

    }

    return   <Map center={positions.start} zoom={13} ref='map'>
    <TileLayer attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'/>
<Chain ref='cont' sequence={c} repeat={5}>
      {(val, done) => 

      <Marker key={1} position={val}>
          <Popup>
          </Popup>
        </Marker>
      }
</Chain>
  </Map>
  }
}
/*
<Ease from={51.505} to={51.61} duration={5000}>
{val => 
    <Marker position={[51.505, -0.09]}>
      <Popup>
      </Popup>
    </Marker>
  }
</Ease>
*/

/*

    <Chain sequence={c} onProgress={(i, val, done) => console.log(val)}>
      {(val, done) => 
      <Marker position={val}>
        <Popup>
        </Popup>
      </Marker>
    }
    </Chain>
    */

export default Lager

function getData(route) {

    var collection = {};
    collection.features = [];

    for (var i = 0; i < route.coordinates.length; i++) {
        collection.features.push( {
            type: "feature",
            properties: {
                time: i + 1,
                name: i + 1,
                id: "route1"
            },
            geometry: {
                type: "Point",
                coordinates: [route.coordinates[i].lat, route.coordinates[i].lng]
            }
        })
    }


    return collection.features
}