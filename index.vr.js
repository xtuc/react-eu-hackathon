import React from 'react';
import {
  Animated,
  AppRegistry,
  asset,
  Pano,
  Text,
  Model,
  PointLight,
  View,
} from 'react-vr';


export default class hackathon extends React.Component {
  static defaultProps = {
    speed: .1,
  }

  state = {
    rotation: 0,
  };
  
  rotate = () => {
    requestAnimationFrame(() => {
      this.setState(({ rotation }) => ({ rotation: rotation + (1 * this.props.speed) }), this.rotate);
    });
  }

  componentDidMount() {
    this.rotate();
  }

  render() {
    return (
      <View>
        <Pano source={asset('chess-world.jpg')}/>
        <PointLight style={{color:'white', transform:[{translate : [0, 0, 0]}]}} />

        <Model
          lit
          style={{
            position: 'absolute',
            transform: [
              {translate: [0, 0, -100]},
              {scale: .5},
              {rotateY: this.state.rotation}
            ],
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
