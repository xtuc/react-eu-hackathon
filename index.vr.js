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
  }

  render() {
    const { speakers } = this.state;
    const { setSpeaker } = this.props;

    return (
      <View>
        <Model
          lit
          style={{
            position: "absolute",
            transform: [
              { translate: [0, 0, -4] },
              { scale: 0.016 },
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

const TwitterFeed = ({ data, left = false, right = false }) => {
  if (data.loading) {
    return null;
  }

  const tweets = data.twitter.search.map(tweet => (
    <Text
      key={tweet.id}
      numberOfLines={2}
      style={{
        display: "flex",
        color: "black",
        marginBottom: 0.2,
        fontSize: 0.2
      }}
    >
      {tweet.text}
    </Text>
  ));
  const leftTransform = [{ translate: [-8, 3, -3] }, { rotateY: 50 }];
  const rightTransform = [{ translate: [2.5, 3, -3] }, { rotateY: -50 }];
  return (
    <View
      style={{
        position: "absolute",
        flexDirection: "column",
        height: 6,
        width: 5,
        padding: 0.2,
        backgroundColor: "white",
        transform: (left && leftTransform) || (right && rightTransform)
      }}
    >
      {tweets}
    </View>
  );
};

const provideTwitterSearch = Component => query =>
  graphql(
    gql`
      query GetTwitterFeed($query: String!) {
        twitter {
          search(q: $query, count: 8) {
            id
            text
          }
        }
      }
    `,
    {
      options: { variables: { query }, pollInterval: 10000 }
    }
  )(Component);

class App extends React.Component {
  state = {
    selectedSpeaker: "necolas"
  };
  setSpeaker = speaker => this.setState({ speaker: selectedSpeaker });

  render() {
    const SpeakerFeed = provideTwitterSearch(TwitterFeed)(
      `@${this.state.selectedSpeaker}`
    );
    const ReactEuFeed = provideTwitterSearch(TwitterFeed)(`@reacteurope`);
    return (
      <View>

        <Pano source={asset("pano.jpg")} />

        <PointLight
          style={{ color: "white", transform: [{ translate: [0, 0, 0] }] }}
        />
        <ApolloProvider client={client}>
          <MainWithData setSpeaker={this.setSpeaker} />
        </ApolloProvider>
        <ApolloProvider client={twitterClient}>
          <View>
            <SpeakerFeed right />
            <ReactEuFeed left />
          </View>
        </ApolloProvider>
      </View>
    );
  }
}

AppRegistry.registerComponent("hackathon", () => App);
