import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerScreenProps,
  createDrawerNavigator,
} from "@react-navigation/drawer";
import {
  NavigationContainer,
  createNavigationContainerRef,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Pressable,
  ScrollView,
  View,
  ViewStyle,
  useColorScheme,
} from "react-native";
import {
  Button,
  Dialog,
  IconButton,
  Text,
  MD3Colors,
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  Portal,
  TextInput,
  adaptNavigationTheme,
  useTheme,
  Drawer,
  SegmentedButtons,
  TouchableRipple,
} from "react-native-paper";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useMaterial3Theme } from "@pchmn/expo-material3-theme";
import { Innings, Match, Player, PlayerScore, Team, store } from "./store";
import { observer } from "mobx-react-lite";
import {
  StackScreenProps,
  createStackNavigator,
} from "@react-navigation/stack";

const isDev = process.env.NODE_ENV === "development";

type RootStackParamList = {
  Main: undefined;
  Match: { id: string };
  PlayerScore: { playerScore: PlayerScore; innings: Innings };
};

type DrawerParamList = {
  Matches: undefined;
  Players: undefined;
};

const navigationRef = createNavigationContainerRef<RootStackParamList>();

const Toss = observer(({ match }: { match: Match }) => {
  const theme = useTheme();

  const [teamThatWillCall] = useState<Team>(
    () => match.teams[Math.floor(Math.random() * 2)],
  );
  const [teamThatWonToss, setTeamThatWonToss] = useState<Team | null>(null);

  const toss = (call: "heads" | "tails") => {
    const result = Math.random() > 0.5 ? "heads" : "tails";
    if (result === call) {
      setTeamThatWonToss(teamThatWillCall);
    } else {
      setTeamThatWonToss(match.teams.find((t) => t !== teamThatWillCall)!);
    }
  };

  if (!teamThatWonToss) {
    return (
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: 20,
          gap: 15,
        }}
      >
        <Text
          style={{
            fontSize: theme.fonts.headlineSmall.fontSize,
            textAlign: "center",
            marginBottom: 5,
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
            }}
          >
            {teamThatWillCall.name}
          </Text>{" "}
          will call
        </Text>
        <Button
          onPress={() => {
            toss("heads");
          }}
          mode="contained"
          labelStyle={{
            fontSize: theme.fonts.bodyLarge.fontSize,
          }}
        >
          Heads
        </Button>
        <Button
          onPress={() => {
            toss("tails");
          }}
          mode="contained"
          labelStyle={{
            fontSize: theme.fonts.bodyLarge.fontSize,
          }}
        >
          Tails
        </Button>
      </View>
    );
  }

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 20,
        gap: 15,
      }}
    >
      <Text
        style={{
          fontSize: theme.fonts.headlineSmall.fontSize,
          textAlign: "center",
          marginBottom: 5,
        }}
      >
        <Text
          style={{
            fontWeight: "bold",
          }}
        >
          {teamThatWonToss.name}
        </Text>{" "}
        won! Choose:
      </Text>
      <Button
        onPress={() => {
          match.startInnings(teamThatWonToss);
          match.completeToss();
        }}
        mode="contained"
        labelStyle={{
          fontSize: theme.fonts.bodyLarge.fontSize,
        }}
      >
        Bat
      </Button>
      <Button
        onPress={() => {
          match.startInnings(
            teamThatWonToss === match.teams[0]
              ? match.teams[1]
              : match.teams[0],
          );
          match.completeToss();
        }}
        mode="contained"
        labelStyle={{
          fontSize: theme.fonts.bodyLarge.fontSize,
        }}
      >
        Bowl
      </Button>
    </View>
  );
});

const ScoreButton = ({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}) => {
  const theme = useTheme();

  return (
    <TouchableRipple
      onPress={onPress}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "46%",
        padding: 20,
        backgroundColor: MD3Colors.primary40,
        borderRadius: theme.roundness,
        ...style,
      }}
    >
      <Text
        style={{
          fontSize: theme.fonts.displaySmall.fontSize,
          fontWeight: theme.fonts.displaySmall.fontWeight,
          color: MD3Colors.primary100,
        }}
      >
        {children}
      </Text>
    </TouchableRipple>
  );
};

const PlayerScoreScreen = observer(
  ({
    navigation,
    route,
  }: StackScreenProps<RootStackParamList, "PlayerScore">) => {
    const theme = useTheme();
    const { playerScore, innings } = route.params;

    useEffect(() => {
      if (playerScore.out || innings.isComplete) {
        navigation.goBack();
      }
    }, [playerScore.out, innings.isComplete]);

    return (
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexGrow: 1,
          padding: 20,
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: theme.fonts.headlineSmall.fontSize,
              fontWeight: theme.fonts.headlineSmall.fontWeight,
              marginBottom: 5,
            }}
          >
            {playerScore.player.name}
          </Text>
          <Text
            style={{
              fontSize: theme.fonts.displayMedium.fontSize,
              fontWeight: theme.fonts.displayMedium.fontWeight,
            }}
          >
            {playerScore.totalRuns}
          </Text>
          <Text
            style={{
              fontSize: theme.fonts.headlineSmall.fontSize,
              fontWeight: theme.fonts.headlineSmall.fontWeight,
            }}
          >
            ({playerScore.ballsFaced})
          </Text>
        </View>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 20,
            pointerEvents:
              playerScore.out || innings.isComplete ? "none" : "auto",
            opacity: playerScore.out || innings.isComplete ? 0.5 : 1,
          }}
        >
          <ScoreButton
            onPress={() => {
              Alert.alert(
                "Confirm",
                "Are you sure you want to mark this player as out?",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "OK",
                    onPress: () => {
                      innings.markPlayerOut(playerScore.player);
                    },
                  },
                ],
              );
            }}
            style={{
              backgroundColor: MD3Colors.error40,
            }}
          >
            Out
          </ScoreButton>
          <ScoreButton
            onPress={() => {
              playerScore.addBall(0);
            }}
          >
            Dot
          </ScoreButton>
          <ScoreButton
            onPress={() => {
              playerScore.addBall(1);
            }}
          >
            1
          </ScoreButton>
          <ScoreButton
            onPress={() => {
              playerScore.addBall(2);
            }}
          >
            2
          </ScoreButton>
          <ScoreButton
            onPress={() => {
              playerScore.addBall(4);
            }}
          >
            4
          </ScoreButton>
          <ScoreButton
            onPress={() => {
              playerScore.addBall(6);
            }}
          >
            6
          </ScoreButton>
        </View>
      </View>
    );
  },
);

const MatchScreen = observer(
  ({ route }: StackScreenProps<RootStackParamList, "Match">) => {
    const theme = useTheme();

    const { id } = route.params;

    const match = store.matches.get(id);

    if (!match) {
      return <Text>Match not found</Text>;
    }

    if (!match.completedToss) {
      return <Toss match={match} />;
    }

    return (
      <ScrollView>
        <View
          style={{
            paddingVertical: 15,
            paddingHorizontal: 20,
            backgroundColor: theme.colors.secondaryContainer,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              marginBottom: 5,
            }}
          >
            {match.oversPerInnings === Infinity
              ? "Unlimited"
              : match.oversPerInnings}
            -over match
            {match.inningsPerTeam === 2 && " (2 innings per team)"}
          </Text>
          {match.teams.map((team) => {
            const canShowOvers =
              match.currentInnings.oversPlayed > 0 &&
              match.currentInnings.oversToPlay !== Infinity &&
              !match.currentInnings.isComplete;

            return (
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 3.5,
                  opacity:
                    (!match.currentInnings.isComplete &&
                      match.currentInnings.team === team) ||
                    match.winner === team
                      ? 1
                      : 0.5,
                }}
                key={team.id}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: theme.fonts.bodyLarge.fontSize + 2,
                  }}
                >
                  {team.name}
                  {match.winner === team ? " 🏆" : ""}
                </Text>
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: theme.fonts.bodyLarge.fontSize + 2,
                  }}
                >
                  {match.currentInnings.team === team &&
                    (canShowOvers || !!match.target) &&
                    `(${
                      canShowOvers
                        ? `${match.currentInnings.oversPlayed.toFixed(1)}/${
                            match.currentInnings.oversToPlay
                          } ov`
                        : ""
                    }${canShowOvers && !!match.target ? ", " : ""}${
                      match.target ? `T: ${match.target}` : ""
                    })`}{" "}
                  {match.innings
                    .filter((innings) => innings.team === team)
                    .map(
                      (innings) =>
                        `${innings.totalRuns}/${innings.totalWickets}`,
                    )
                    .join(" & ")}
                </Text>
              </View>
            );
          })}
          {!match.completedToss && (
            <Text
              style={{
                marginTop: 7.5,
              }}
            >
              Toss remaining
            </Text>
          )}
        </View>
        {match.innings.map((innings) => (
          <View
            key={innings.id}
            style={{
              marginBottom: 15,
            }}
          >
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                backgroundColor: theme.colors.primaryContainer,
                paddingHorizontal: 15,
                paddingVertical: 12.5,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: theme.fonts.bodyLarge.fontSize + 2,
                }}
              >
                {innings.team.name}
              </Text>
              {innings.oversToPlay !== Infinity && (
                <Text
                  style={{
                    fontWeight: "700",
                  }}
                >
                  ({innings.oversToPlay} ovs maximum)
                </Text>
              )}
            </View>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                backgroundColor: theme.colors.secondaryContainer,
              }}
            >
              <Text
                style={{
                  flexGrow: 1,
                  paddingVertical: 7,
                  paddingHorizontal: 15,
                  textTransform: "uppercase",
                  fontWeight: "700",
                }}
              >
                Batting
              </Text>
              <Text
                style={{
                  width: "10%",
                  padding: 7,
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                R
              </Text>
              <Text
                style={{
                  width: "10%",
                  padding: 7,
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                B
              </Text>
              <Text
                style={{
                  width: "10%",
                  padding: 7,
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                SR
              </Text>
            </View>
            {innings.scores.map((score) => (
              <Pressable
                key={score.player.id}
                onPress={() => {
                  navigationRef.navigate("PlayerScore", {
                    playerScore: score,
                    innings,
                  });
                }}
                disabled={score.out || innings.isComplete}
              >
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.backdrop,
                    borderLeftWidth: !score.out ? 2 : 0,
                    borderLeftColor: theme.colors.secondary,
                  }}
                >
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flexGrow: 1,
                      paddingVertical: 10,
                      paddingHorizontal: 15,
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: theme.fonts.bodyLarge.fontSize,
                      }}
                    >
                      {score.player.name}
                    </Text>
                    {!score.out && !innings.isComplete && (
                      <Text>Press to update score</Text>
                    )}
                  </View>
                  <Text
                    style={{
                      width: "10%",
                      padding: 7,
                      textAlign: "center",
                    }}
                  >
                    {score.totalRuns}
                  </Text>
                  <Text
                    style={{
                      width: "10%",
                      padding: 7,
                      textAlign: "center",
                    }}
                  >
                    {score.ballsFaced}
                  </Text>
                  <Text
                    style={{
                      width: "10%",
                      padding: 7,
                      textAlign: "center",
                    }}
                  >
                    {score.strikeRate.toFixed(0)}
                  </Text>
                </View>
              </Pressable>
            ))}
            {innings.playersYetToBat.length > 0 && (
              <View
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 15,
                }}
              >
                <Text>
                  Yet to bat:{" "}
                  {innings.playersYetToBat
                    .map((player) => player.name)
                    .join(", ")}
                </Text>
              </View>
            )}
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: theme.colors.secondaryContainer,
              }}
            >
              <Text
                style={{
                  flexGrow: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 15,
                  textTransform: "uppercase",
                  fontWeight: "700",
                }}
              >
                Total
              </Text>
              <Text
                style={{
                  padding: 7,
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                {innings.totalRuns}/{innings.totalWickets}
              </Text>
              {innings.oversPlayed > 0 && (
                <>
                  <Text
                    style={{
                      padding: 7,
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    {innings.oversPlayed.toFixed(1)} Ov
                  </Text>
                  <Text
                    style={{
                      padding: 7,
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    {innings.runRate.toFixed(2)} RPO
                  </Text>
                </>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  },
);

const MatchesScreen = observer(
  ({ navigation }: DrawerScreenProps<DrawerParamList, "Matches">) => {
    const theme = useTheme();

    const matches = Array.from(store.matches.values());
    const playersCount = store.playersCount;

    const [isCreating, setIsCreating] = useState(false);
    const closeCreateDialog = () => setIsCreating(false);

    const [inningsPerTeam, setInningsPerTeam] =
      useState<Match["inningsPerTeam"]>(1);
    const [oversPerInnings, setOversPerInnings] =
      useState<Match["oversPerInnings"]>(5);

    if (playersCount < 4) {
      return (
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 20,
            paddingVertical: 30,
          }}
        >
          <Text
            style={{ textAlign: "center", color: theme.colors.onBackground }}
          >
            Not enough players found. You need at least 4 players to start a
            match
          </Text>
          <Button
            mode="contained"
            style={{ marginTop: 20 }}
            icon="plus"
            onPress={() => navigation.navigate("Players")}
          >
            Add players
          </Button>
          {isDev && (
            <Button
              mode="contained"
              style={{ marginTop: 10 }}
              icon="plus"
              onPress={() => {
                store.dev__addPlayers();
              }}
            >
              Add required players
            </Button>
          )}
        </View>
      );
    }

    return (
      <View
        style={{
          padding: 10,
        }}
      >
        {matches.length > 0 ? (
          <View>
            <View
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {matches.map((match) => (
                <Pressable
                  onPress={() => {
                    navigationRef.navigate("Match", { id: match.id });
                  }}
                  key={match.id}
                >
                  <View
                    style={{
                      paddingVertical: 15,
                      paddingHorizontal: 20,
                      backgroundColor: theme.colors.secondaryContainer,
                      borderRadius: theme.roundness,
                    }}
                  >
                    <Text
                      style={{
                        marginBottom: 5,
                      }}
                    >
                      {match.oversPerInnings === Infinity
                        ? "Unlimited"
                        : match.oversPerInnings}
                      -over match
                      {match.inningsPerTeam === 2 && " (2 innings per team)"}
                    </Text>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: theme.fonts.bodyLarge.fontSize + 2,
                        marginBottom: 3.5,
                      }}
                    >
                      {match.teams[0].name}
                    </Text>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: theme.fonts.bodyLarge.fontSize + 2,
                      }}
                    >
                      {match.teams[1].name}
                    </Text>
                    {!match.completedToss && (
                      <Text
                        style={{
                          marginTop: 7.5,
                        }}
                      >
                        Toss remaining
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
            <Button
              mode="contained"
              style={{ marginTop: 10, marginHorizontal: 20 }}
              icon="plus"
              onPress={() => setIsCreating(true)}
            >
              Start match
            </Button>
          </View>
        ) : (
          <View
            style={{
              paddingHorizontal: 20,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                marginTop: 10,
              }}
            >
              No matches found
            </Text>
            <Button
              mode="contained"
              style={{ marginTop: 10, marginHorizontal: 20 }}
              icon="plus"
              onPress={() => setIsCreating(true)}
            >
              Start match
            </Button>
          </View>
        )}
        <Portal>
          <Dialog visible={isCreating} onDismiss={closeCreateDialog}>
            <Dialog.Title>Start match</Dialog.Title>
            <Dialog.Content
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text variant="bodyLarge" style={{ marginRight: 20 }}>
                  Innings per side
                </Text>
                <SegmentedButtons
                  value={inningsPerTeam.toString()}
                  onValueChange={(value) =>
                    setInningsPerTeam(parseInt(value, 10) as 1 | 2)
                  }
                  density="small"
                  buttons={[
                    { label: "1", value: "1" },
                    { label: "2", value: "2" },
                  ]}
                  style={{
                    flexShrink: 1,
                  }}
                />
              </View>
              <View
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                <Text variant="bodyLarge">Overs per inning</Text>
                <SegmentedButtons
                  value={oversPerInnings.toString()}
                  onValueChange={(value) =>
                    value === "Infinity"
                      ? setOversPerInnings(Infinity)
                      : setOversPerInnings(parseInt(value, 10))
                  }
                  density="small"
                  buttons={[
                    { label: "5", value: "5", style: { minWidth: 5 } },
                    { label: "10", value: "10", style: { minWidth: 5 } },
                    { label: "20", value: "20", style: { minWidth: 5 } },
                    { label: "50", value: "50", style: { minWidth: 5 } },
                    { label: "∞", value: "Infinity", style: { minWidth: 5 } },
                  ]}
                  style={{
                    flexShrink: 1,
                  }}
                />
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeCreateDialog}>Cancel</Button>
              <Button
                onPress={() => {
                  store.addMatch(inningsPerTeam, oversPerInnings);
                  closeCreateDialog();
                }}
              >
                Create
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    );
  },
);

const PlayerListItem = observer(({ player }: { player: Player }) => {
  const theme = useTheme();

  const [isRemoving, setIsRemoving] = useState(false);
  const closeRemoveDialog = () => setIsRemoving(false);

  const [name, setName] = useState(player.name);
  const [isEditing, setIsEditing] = useState(false);
  const closeEditDialog = () => setIsEditing(false);

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.secondaryContainer,
        borderRadius: theme.roundness,
        paddingVertical: 10,
        paddingLeft: 25,
        paddingRight: 15,
      }}
    >
      <Text
        style={{
          flexGrow: 1,
          fontSize: theme.fonts.bodyLarge.fontSize,
          color: theme.colors.onBackground,
        }}
      >
        {player.name}
      </Text>
      <IconButton
        size={20}
        icon="pencil"
        iconColor={MD3Colors.primary40}
        mode="contained"
        style={{
          backgroundColor: MD3Colors.primary80,
          marginLeft: 10,
        }}
        onPress={() => {
          setIsEditing(true);
        }}
      />
      <IconButton
        size={20}
        icon="delete"
        iconColor={MD3Colors.error40}
        mode="contained"
        style={{
          backgroundColor: MD3Colors.error80,
          marginLeft: 10,
        }}
        onPress={() => {
          setIsRemoving(true);
        }}
      />
      <Portal>
        <Dialog visible={isRemoving} onDismiss={closeRemoveDialog}>
          <Dialog.Title>Remove player</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to remove {player.name}?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeRemoveDialog}>Cancel</Button>
            <Button
              onPress={() => {
                store.removePlayer(player.id);
                closeRemoveDialog();
              }}
            >
              Remove
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={isEditing} onDismiss={closeEditDialog}>
          <Dialog.Title>Edit player</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Player name"
              value={name}
              onChangeText={setName}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeEditDialog}>Cancel</Button>
            <Button
              onPress={() => {
                store.updatePlayer(player.id, name);
                closeEditDialog();
              }}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
});

const PlayersScreen = observer(() => {
  const theme = useTheme();

  const [newPlayerName, setNewPlayerName] = useState("");
  const players = Array.from(store.players.values());

  const addPlayerHandler = () => {
    if (!newPlayerName) return;
    store.addPlayer(newPlayerName);
    setNewPlayerName("");
  };

  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: theme.colors.background,
      }}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 15,
        }}
      >
        <TextInput
          mode="outlined"
          label="Player name"
          style={{ flexGrow: 1, marginRight: 10 }}
          value={newPlayerName}
          onChangeText={setNewPlayerName}
          onSubmitEditing={addPlayerHandler}
        />
        <IconButton
          icon="plus"
          iconColor={MD3Colors.primary40}
          mode="contained"
          accessibilityLabel="Add player"
          onPress={addPlayerHandler}
          style={{ backgroundColor: MD3Colors.primary90 }}
        />
      </View>
      {players.length > 0 ? (
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 15,
          }}
        >
          {players.map((player) => (
            <PlayerListItem player={player} key={player.id} />
          ))}
        </View>
      ) : (
        <Text
          style={{
            textAlign: "center",
            marginTop: 10,
          }}
        >
          No players found
        </Text>
      )}
    </View>
  );
});

function DrawerItems(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView>
      <Drawer.Item
        label="Matches"
        onPress={() => props.navigation.navigate("Matches")}
      />
      <Drawer.Item
        label="Players"
        onPress={() => props.navigation.navigate("Players")}
      />
    </DrawerContentScrollView>
  );
}

const MainScreen = observer(() => {
  const Drawer = createDrawerNavigator<DrawerParamList>();

  return (
    <Drawer.Navigator drawerContent={(props) => <DrawerItems {...props} />}>
      <Drawer.Screen
        name="Matches"
        component={MatchesScreen}
        options={{ title: "Matches" }}
      />
      <Drawer.Screen
        name="Players"
        component={PlayersScreen}
        options={{ title: "Players" }}
      />
    </Drawer.Navigator>
  );
});

const Stack = createStackNavigator<RootStackParamList>();

function App() {
  // const hasStoreHydrated = useStore((state) => state._hasHydrated);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
  });

  const CombinedDefaultTheme = {
    ...MD3LightTheme,
    ...LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      ...LightTheme.colors,
    },
  };

  const CombinedDarkTheme = {
    ...MD3DarkTheme,
    ...DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      ...DarkTheme.colors,
    },
  };

  const combinedTheme = isDarkMode ? CombinedDarkTheme : CombinedDefaultTheme;

  const { theme: mdTheme } = useMaterial3Theme();
  const theme = useMemo(() => {
    return isDarkMode
      ? { ...MD3DarkTheme, colors: mdTheme.dark }
      : { ...MD3LightTheme, colors: mdTheme.light };
  }, [isDarkMode, mdTheme]);

  // if (!hasStoreHydrated) {
  //   return <Text>Loading...</Text>;
  // }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={combinedTheme} ref={navigationRef}>
        <Stack.Navigator>
          <Stack.Screen
            name="Main"
            component={MainScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Match" component={MatchScreen} />
          <Stack.Screen
            name="PlayerScore"
            component={PlayerScoreScreen}
            options={{
              headerTitle: "Player score",
            }}
          />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </PaperProvider>
  );
}

export default observer(App);
