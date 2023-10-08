import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerScreenProps,
  createDrawerNavigator,
} from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Appearance, View, useColorScheme } from "react-native";
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
} from "react-native-paper";
import { useMemo, useState } from "react";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import { useMaterial3Theme } from "@pchmn/expo-material3-theme";
import { Match, Player, store } from "./store";
import { observer } from "mobx-react-lite";

type RootStackParamList = {
  Matches: undefined;
  Players: undefined;
};

function MatchesScreen({
  navigation,
}: DrawerScreenProps<RootStackParamList, "Matches">) {
  const theme = useTheme();

  const matches = Array.from(store.matches.values());
  const playersCount = store.playersCount;

  const [isCreating, setIsCreating] = useState(false);
  const closeCreateDialog = () => setIsCreating(false);

  const [inningsPerTeam, setInningsPerTeam] =
    useState<Match["inningsPerTeam"]>(1);
  const [oversPerInnings, setOversPerInnings] =
    useState<Match["oversPerInnings"]>(5);

  if (playersCount < 2) {
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
        <Text style={{ textAlign: "center", color: theme.colors.onBackground }}>
          Not enough players found. You need at least 2 players to start a match
        </Text>
        <Button
          mode="contained"
          style={{ marginTop: 20 }}
          icon={"plus"}
          onPress={() => navigation.navigate("Players")}
        >
          Add players
        </Button>
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
                    textTransform: "uppercase",
                    marginBottom: 3.5,
                  }}
                >
                  {match.teams[0].name}
                </Text>
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: theme.fonts.bodyLarge.fontSize + 2,
                    textTransform: "uppercase",
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
            ))}
          </View>
          <Button
            mode="contained"
            style={{ marginTop: 10, marginHorizontal: 20 }}
            icon={"plus"}
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
            icon={"plus"}
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
                  setInningsPerTeam(parseInt(value) as 1 | 2)
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
                    : setOversPerInnings(parseInt(value))
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
}

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

function App() {
  // const hasStoreHydrated = useStore((state) => state._hasHydrated);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const Drawer = createDrawerNavigator<RootStackParamList>();
  const playersCount = store.playersCount;

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
      <NavigationContainer theme={combinedTheme}>
        <Drawer.Navigator
          initialRouteName={playersCount > 1 ? "Matches" : "Players"}
          drawerContent={(props) => <DrawerItems {...props} />}
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
        <StatusBar style="auto" />
      </NavigationContainer>
    </PaperProvider>
  );
}

export default observer(App);
