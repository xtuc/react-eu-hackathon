import React from "react";
import {
  Animated,
  AppRegistry,
  asset,
  Pano,
  Text,
  Model,
  PointLight,
  View
} from "react-vr";
import {
  ApolloClient,
  createNetworkInterface,
  ApolloProvider,
  gql,
  graphql
} from "react-apollo";

const client = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: "https://www.react-europe.org/gql"
  })
});

function fetchSpeakersLocation(speakers) {
  const fetches = speakers.map(speaker =>
    fetch(`https://api.github.com/users/${speaker.github}`, {
      headers: {
        Authorization: "token 9bb471abc092a0cd87166b03029bd75a2ab02ab9"
      }
    }).then(res =>
      res.json().then(json => ({ ...speaker, location: json.location }))
    )
  );

  return Promise.all(fetches);
}

function fetchSpeakersCoords(speakers) {
  const fetches = speakers.map(speaker =>
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=${speaker.location}&key=AIzaSyDb5-BZCbyMYBAwr8PHlwp7w5F1sA0BdaY`
    )
      .then(res => res.json())
      .then(json => {
        return {
          ...speaker,
          coords: json.results[0].geometry.location
        };
      })
  );

  return Promise.all(fetches);
}

export default class Main extends React.Component {
  static defaultProps = {
    speed: 0.1
  };

  state = {
    rotation: 0
  };

  rotate = () => {
    requestAnimationFrame(() => {
      this.setState(
        ({ rotation }) => ({ rotation: rotation + 1 * this.props.speed }),
        this.rotate
      );
    });
  };

  componentWillReceiveProps({ data }) {
    if (data && data.loading === false) {
      fetchSpeakersLocation(data.events[0].speakers)
        .then(speakers => fetchSpeakersCoords(speakers))
        .then(speakers => this.setState({ speakers }));
    }
  }

  componentDidMount() {
    this.rotate();
    ``;
  }

  render() {
    const { speakers } = this.state;
    console.log(speakers);
    return (
      <View>
        <Pano source={asset("chess-world.jpg")} />
        <PointLight
          style={{ color: "white", transform: [{ translate: [0, 0, 0] }] }}
        />

        <Model
          lit
          style={{
            position: "absolute",
            transform: [
              { translate: [0, 0, -100] },
              { scale: 0.5 },
              { rotateY: this.state.rotation }
            ]
          }}
          source={{
            obj: asset("earth.obj"),
            mtl: asset("earth.mtl")
          }}
        />
      </View>
    );
  }
}

const MainWithData = graphql(gql`
  query GetSpeakersList {
    events(slug: "reacteurope-2017") {
      speakers {
        id
        name
        twitter
        github
      }
    }
  }
`)(Main);

function App() {
  return <ApolloProvider client={client}><MainWithData /></ApolloProvider>;
}

AppRegistry.registerComponent("hackathon", () => App);
