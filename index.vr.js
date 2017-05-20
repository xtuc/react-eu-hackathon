import React from 'react';
import {
  AppRegistry,
  asset,
  Pano,
  Text,
  Model,
  PointLight,
  View,
} from 'react-vr';


export default class hackathon extends React.Component {
  render() {
    return (
      <View>
        <Pano source={asset('chess-world.jpg')}/>
        <PointLight style={{color:'white', transform:[{translate : [0, 0, 0]}]}} />

        <Model
          lit
          style={{
            translateX: 100,
            translateY: 100,
            scaleX: 0.5,
            scaleY: 0.5,
          }}
          source={{
            obj: asset('earth.obj'),
            mtl: asset('earth.mtl'),
          }}
        />
      </View>
    );
  }
};

AppRegistry.registerComponent('hackathon', () => hackathon);
