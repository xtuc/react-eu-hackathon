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

const twitterClient = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: "https://www.graphqlhub.com/graphql"
  })
});

const twitterClient = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: "https://www.graphqlhub.com/graphql"
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

    const tweets = [
      <Text style={{ color: 'black', display: 'block' }}>Hello World!</Text>,
      <Text style={{ color: 'black', display: 'block' }}>Hello World!</Text>,
      <Text style={{ color: 'black', display: 'block' }}>Hello World!</Text>,
    ];

    return (
      <View>
        <Pano source={asset("chess-world.jpg")} />
        <PointLight
          style={{ color: "white", transform: [{ translate: [0, 0, 0] }] }}
        />

        <Model
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
        >
        </Model>

        <View
          style={{
            flexDirection: 'row',
            height: 3,
            padding: 0.2,
            backgroundColor: 'white',
            transform: [{ translate: [3, 0.5, -4] }, { rotateY: -50 }],
          }}
        >
          {tweets}
        </View>

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

const TwitterFeed = data => {
  console.log(data);
  return null;
};

const provideTwitterSearch = Component => query =>
  graphql(
    gql`
      query GetTwitterFeed($query: String!) {
        twitter {
          search(q: $query) {
            text
          }
        }
      }
    `,
    {
      options: { variables: { query } }
    }
  )(Component);

class App extends React.Component {
  state = {
    selectedSpeaker: "necolas"
  };
  render() {
    const TwitterFeedWithData = provideTwitterSearch(TwitterFeed)(
      `@${this.state.selectedSpeaker}`
    );
    return (
      <View>
        {/*<ApolloProvider client={client}><MainWithData /></ApolloProvider>*/}
        <ApolloProvider client={twitterClient}>
          <TwitterFeedWithData />
        </ApolloProvider>
      </View>
    );
  }
}

AppRegistry.registerComponent("hackathon", () => App);
