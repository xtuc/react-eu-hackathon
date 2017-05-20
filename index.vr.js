import React from "react";
import {
  Animated,
  AppRegistry,
  asset,
  Pano,
  Text,
  Model,
  Sphere,
  Image,
  PointLight,
  VrButton,
  Box,
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
          coords: json.results[0] && json.results[0].geometry.location
        };
      })
  );

  return Promise.all(fetches);
}

export default class Main extends React.Component {
  static defaultProps = {
    speed: 1
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
        .then(speakers => this.setState({ speakers }))
        .then(
          speakers =>
            speakers &&
            speakers.filter(speaker => speaker.location && speaker.twitter)
        );
    }
  }

  componentDidMount() {
    this.rotate();
  }

  render() {
    const { speakers } = this.state;
    const { setSpeaker } = this.props;

    const deg = this.state.rotation % 360;

    return (
      <View
        style={{
          position: "absolute",
          width: 4,
          height: 4,
          transform: [{ translate: [1 / deg, 0, 1 / (deg % 180)] }]
        }}
      >
        <View
          style={{
            position: "absolute",
            width: 4,
            height: 4,
            layoutOrigin: [-0.5, -0.5],
            transform: [
              { translate: [-2, 2, -4] },
              { rotateY: this.state.rotation }
            ]
          }}
        >
          {true &&
            <Model
              lit
              style={{
                position: "absolute",
                transform: [{ scale: 0.016 }],
                opacity: 0.2
              }}
              source={{
                obj: asset("earth.obj"),
                mtl: asset("earth.mtl")
              }}
            />}
          {speakers &&
            speakers.map((speaker, key) => {
              const num = speakers.length - 1;
              const splices = 360 / num;

              const rotateY = key * splices;

              return (
                <View
                  style={{
                    position: "absolute",
                    layoutOrigin: [0.5, 0.5],
                    transform: [
                      { rotateY },
                      { translateX: 1 },
                      { translateY: key % 2 ? 1.5 : 0.5 }
                    ]
                  }}
                >
                  <SpeakerPin
                    speaker={speaker}
                    onClick={setSpeaker}
                    rotation={this.state.rotation}
                  />
                </View>
              );
            })}
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
        bio
        twitter
        github
        avatarUrl
      }
    }
  }
`)(Main);

const TwitterFeed = ({ data, left = false, right = false, title = "foo" }) => {
  if (data.loading) {
    return null;
  }

  const tweets = data.twitter.search.map(tweet => {
    return (
      <View style={{ flexDirection: "row" }} key={tweet.id}>
        <Image
          style={{
            width: 0.5,
            height: 0.5,
            marginRight: 0.2,
            borderRadius: 0.05
          }}
          source={{
            uri: tweet.user.profile_image_url.replace("normal", "400x400")
          }}
        />
        <Text
          numberOfLines={2}
          style={{
            flex: 1,
            color: "black",
            marginBottom: 0.2,
            fontSize: 0.2
          }}
        >
          <Text style={{ fontWeight: "bold" }}>{tweet.user.screen_name}</Text>
          :
          {" "}
          {tweet.text}
        </Text>
      </View>
    );
  });
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
        borderRadius: 0.1,
        transform: (left && leftTransform) || (right && rightTransform)
      }}
    >
      <Text>{title}</Text>
      {tweets}
    </View>
  );
};

const SpeakerPin = ({ speaker, onClick, rotation }) => {
  return (
    <VrButton
      onClick={() => onClick(speaker.twitter)}
      style={{
        position: "absolute",
        flexDirection: "column",
        height: 2,
        width: 1.5,
        padding: 0.1,
        backgroundColor: "red",
        borderRadius: 0.1,
        transform: [{ rotateY: -rotation }, { scale: 0.25 }]
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 0.1
        }}
      >
        <Image
          style={{
            width: 0.5,
            height: 0.5,
            marginRight: 0.2,
            borderRadius: 0.05
          }}
          source={{
            uri: speaker.avatarUrl
          }}
        />
        <Text style={{ color: "black" }}>{speaker.name}</Text>
      </View>
      <Text style={{ color: "black" }}>{speaker.bio}</Text>
    </VrButton>
  );
};

const provideTwitterSearch = Component => query =>
  graphql(
    gql`
      query GetTwitterFeed($query: String!) {
        twitter {
          search(q: $query, count: 8) {
            user {
              screen_name
              profile_image_url
            }
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
