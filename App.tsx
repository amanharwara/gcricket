import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerScreenProps,
  DrawerHeaderProps,
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
  TextStyle,
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
  Appbar,
} from "react-native-paper";
import { Fragment, ReactNode, useMemo, useState } from "react";
import { useMaterial3Theme } from "@pchmn/expo-material3-theme";
import { Innings, Match, Player, PlayerScore, Team, store } from "./store";
import { observer } from "mobx-react-lite";
import {
  StackHeaderProps,
  StackScreenProps,
  createStackNavigator,
} from "@react-navigation/stack";
import { getHeaderTitle } from "@react-navigation/elements";

const isDev = process.env.NODE_ENV === "development";

type RootStackParamList = {
  Main: undefined;
  Match: { matchId: string };
  PlayerScore: { matchId: string; playerScore: PlayerScore; innings: Innings };
};

type DrawerParamList = {
  Matches: undefined;
  Players: undefined;
};

const navigationRef = createNavigationContainerRef<RootStackParamList>();

const Toss = observer(({ match }: { match: Match }) => {
  const theme = useTheme();

  const [teamThatWillCall] = useState<Team>(
    () => match.teams[Math.floor(Math.random() * 2)]!,
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
              ? match.teams[1]!
              : match.teams[0]!,
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
  textStyle,
}: {
  children: ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
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
        backgroundColor: theme.colors.primary,
        borderRadius: theme.roundness,
        ...style,
      }}
    >
      <Text
        style={{
          fontSize: theme.fonts.displaySmall.fontSize,
          fontWeight: theme.fonts.displaySmall.fontWeight,
          color: theme.colors.onPrimary,
          ...textStyle,
        }}
      >
        {children}
      </Text>
    </TouchableRipple>
  );
};

const PlayerScoreScreen = observer(
  ({ route }: StackScreenProps<RootStackParamList, "PlayerScore">) => {
    const theme = useTheme();
    const { playerScore, innings } = route.params;

    const disabled = playerScore.out || innings.isComplete;

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
              fontSize: theme.fonts.displayLarge.fontSize + 25,
              fontWeight: theme.fonts.displayLarge.fontWeight,
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
        {innings.balls.length > 0 && (
          <ScrollView
            horizontal
            style={{
              paddingVertical: 15,
              borderTopWidth: 2,
              borderTopColor: theme.colors.backdrop,
              borderBottomWidth: 2,
              borderBottomColor: theme.colors.backdrop,
              flexGrow: 0,
            }}
            contentContainerStyle={{
              display: "flex",
              flexDirection: "row-reverse",
              gap: 10,
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            {innings.balls.map((ball, index, array) => {
              if (ball.player !== playerScore.player) return null;

              const isFirstBallOfNewOver =
                (index + 1 - 1) % 6 === 0 && index !== 0;

              const isLastBallOfInnings = index === array.length - 1;

              const isDot = ball.runs === 0;
              const isFour = ball.runs === 4;
              const isSix = ball.runs === 6;
              const isBoundary = isFour || isSix;
              const isWicket = isLastBallOfInnings && playerScore.out && isDot;

              return (
                <Fragment key={index}>
                  {isFirstBallOfNewOver && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: theme.colors.surface,
                        marginHorizontal: 5,
                      }}
                    />
                  )}
                  <View
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 40,
                      height: 40,
                      borderRadius: theme.roundness,
                      backgroundColor: isSix
                        ? "#7a41d8"
                        : isFour
                        ? "#08774f"
                        : isWicket
                        ? MD3Colors.error40
                        : theme.colors.primary,
                    }}
                    key={index}
                  >
                    <Text
                      style={{
                        fontSize: theme.fonts.bodyLarge.fontSize,
                        fontWeight:
                          isBoundary || isWicket
                            ? "bold"
                            : theme.fonts.bodyLarge.fontWeight,
                        color:
                          isBoundary || isWicket
                            ? "white"
                            : theme.colors.onPrimary,
                      }}
                    >
                      {isWicket ? "W" : isDot ? "●" : ball.runs}
                    </Text>
                  </View>
                </Fragment>
              );
            })}
          </ScrollView>
        )}
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 20,
            pointerEvents: disabled ? "none" : "auto",
            opacity: disabled ? 0.5 : 1,
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
                      innings.addBall(0, true, playerScore.player);
                    },
                  },
                ],
              );
            }}
            style={{
              backgroundColor: MD3Colors.error40,
            }}
          >
            W
          </ScoreButton>
          <ScoreButton
            onPress={() => {
              innings.addBall(0, false, playerScore.player);
            }}
          >
            ●
          </ScoreButton>
          <ScoreButton
            onPress={() => {
              innings.addBall(1, false, playerScore.player);
            }}
          >
            1
          </ScoreButton>
          <ScoreButton
            onPress={() => {
              innings.addBall(2, false, playerScore.player);
            }}
          >
            2
          </ScoreButton>
          <ScoreButton
            onPress={() => {
              innings.addBall(4, false, playerScore.player);
            }}
          >
            4
          </ScoreButton>
          <ScoreButton
            onPress={() => {
              innings.addBall(6, false, playerScore.player);
            }}
          >
            6
          </ScoreButton>
        </View>
      </View>
    );
  },
);

const MatchScorecard = observer(
  ({ match, style }: { match: Match; style?: ViewStyle }) => {
    const theme = useTheme();

    return (
      <View
        style={{
          paddingVertical: 15,
          paddingHorizontal: 20,
          backgroundColor: theme.colors.secondaryContainer,
          ...style,
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
          const canShowOvers = match.currentInnings
            ? match.currentInnings.oversPlayed > 0 &&
              match.currentInnings.oversToPlay !== Infinity &&
              !match.currentInnings.isComplete
            : false;

          const isBatting =
            !!match.currentInnings && match.currentInnings.team === team;
          const isWinner = match.winner === team;

          return (
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 3.5,
                opacity:
                  (!match.currentInnings?.isComplete && isBatting) ||
                  isWinner ||
                  !match.currentInnings
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
                {isWinner ? " 🏆" : ""}
              </Text>
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: theme.fonts.bodyLarge.fontSize + 2,
                }}
              >
                {isBatting &&
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
                    (innings) => `${innings.totalRuns}/${innings.totalWickets}`,
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
        {match.winner && (
          <Text
            style={{
              marginTop: 5,
            }}
          >
            {match.currentInnings?.team === match.winner
              ? `${match.winner.name} won by ${
                  match.currentInnings.team.players.length -
                  match.currentInnings.totalWickets
                } wickets`
              : `${match.winner.name} won by ${
                  match.target! - (match.currentInnings?.totalRuns || 0)
                } runs`}
          </Text>
        )}
      </View>
    );
  },
);

const MatchScreen = observer(
  ({ route }: StackScreenProps<RootStackParamList, "Match">) => {
    const theme = useTheme();

    const { matchId } = route.params;

    const match = store.matches.get(matchId);

    if (!match) {
      return <Text>Match not found</Text>;
    }

    if (!match.completedToss) {
      return <Toss match={match} />;
    }

    return (
      <ScrollView>
        <MatchScorecard
          match={match}
          style={{
            marginTop: 10,
            marginBottom: 15,
          }}
        />
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
                    matchId,
                  });
                }}
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
                <TouchableRipple
                  onPress={() => {
                    navigationRef.navigate("Match", { matchId: match.id });
                  }}
                  key={match.id}
                >
                  <MatchScorecard
                    match={match}
                    style={{
                      borderRadius: theme.roundness,
                    }}
                  />
                </TouchableRipple>
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
                    { label: "1", value: "1", style: { minWidth: 5 } },
                    { label: "2", value: "2", style: { minWidth: 5 } },
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
        iconColor={theme.colors.onPrimary}
        mode="contained"
        style={{
          backgroundColor: theme.colors.primary,
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
    <ScrollView
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
          iconColor={theme.colors.onPrimary}
          mode="contained"
          accessibilityLabel="Add player"
          onPress={addPlayerHandler}
          style={{ backgroundColor: theme.colors.primary }}
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
    </ScrollView>
  );
});

function DrawerItems(props: DrawerContentComponentProps) {
  const theme = useTheme();

  return (
    <DrawerContentScrollView
      style={{
        backgroundColor: theme.colors.surfaceVariant,
      }}
    >
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

const DrawerHeader = ({ navigation, options }: DrawerHeaderProps) => {
  const theme = useTheme();

  const title = getHeaderTitle(options, "Match");

  return (
    <Appbar.Header
      style={{
        backgroundColor: theme.colors.surfaceVariant,
      }}
    >
      <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
      <Appbar.Content title={title} />
    </Appbar.Header>
  );
};

const MainScreen = observer(() => {
  const Drawer = createDrawerNavigator<DrawerParamList>();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerItems {...props} />}
      screenOptions={{
        header: (props) => <DrawerHeader {...props} />,
      }}
    >
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

const NavHeader = observer(
  ({ navigation, route, options }: StackHeaderProps) => {
    const theme = useTheme();

    const match =
      route.params &&
      "matchId" in route.params &&
      typeof route.params.matchId === "string"
        ? store.matches.get(route.params.matchId)
        : null;

    const currentInnings = match ? match.currentInnings : null;

    const title = getHeaderTitle(options, "Match");

    return (
      <Appbar.Header
        style={{
          backgroundColor: theme.colors.surfaceVariant,
        }}
      >
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={title} />
        {match && route.name !== "PlayerScore" && (
          <Appbar.Action
            icon="delete"
            disabled={!match}
            onPress={() => {
              if (!match) return;

              Alert.alert(
                "Confirm",
                "Are you sure you want to delete this match?",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Delete",
                    onPress: () => {
                      store.deleteMatch(match.id);
                      navigation.goBack();
                    },
                    style: "destructive",
                  },
                ],
              );
            }}
            accessibilityLabel="Delete match"
          />
        )}
        {currentInnings && route.name !== "Match" && (
          <Appbar.Action
            icon="undo"
            disabled={!currentInnings.canUndo}
            onPress={currentInnings.undoLastBall}
          />
        )}
      </Appbar.Header>
    );
  },
);

function App() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const { theme: md3Theme } = useMaterial3Theme();

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
      ...md3Theme.light,
    },
  };

  const CombinedDarkTheme = {
    ...MD3DarkTheme,
    ...DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      ...DarkTheme.colors,
      ...md3Theme.dark,
      background: "#000000",
    },
  };

  const navigationTheme = isDarkMode ? CombinedDarkTheme : CombinedDefaultTheme;

  const paperTheme = useMemo(() => {
    return isDarkMode
      ? { ...MD3DarkTheme, colors: { ...md3Theme.dark, background: "#000000" } }
      : { ...MD3LightTheme, colors: md3Theme.light };
  }, [isDarkMode, md3Theme]);

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={navigationTheme} ref={navigationRef}>
        <Stack.Navigator
          screenOptions={{
            header: (props) => <NavHeader {...props} />,
          }}
        >
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
