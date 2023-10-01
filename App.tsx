import {
  DrawerScreenProps,
  createDrawerNavigator,
} from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Alert, Text, View } from "react-native";
import {
  Button,
  IconButton,
  List,
  MD3Colors,
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  TextInput,
  adaptNavigationTheme,
  useTheme,
} from "react-native-paper";
import { useStore } from "./store";
import { useMemo, useState } from "react";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import { useMaterial3Theme } from "@pchmn/expo-material3-theme";

type RootStackParamList = {
  Matches: undefined;
  Teams: undefined;
  Players: undefined;
};

function MatchesScreen({
  navigation,
}: DrawerScreenProps<RootStackParamList, "Matches">) {
  const theme = useTheme();
  const teamsCount = useStore((state) => state.teams.length);

  if (!teamsCount) {
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
          No teams found. You need to create at least 2 teams to start a match.
        </Text>
        <Button
          mode="contained"
          style={{ marginTop: 20 }}
          icon={"plus"}
          onPress={() => navigation.navigate("Teams")}
        >
          Create teams
        </Button>
      </View>
    );
  }

  return <Text>Matches</Text>;
}

function TeamsScreen(props: DrawerScreenProps<RootStackParamList, "Teams">) {
  const playersCount = useStore((state) => state.players.length);

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
        <Text style={{ textAlign: "center" }}>
          No players found. You need to add at least 2 players to create a team.
        </Text>
        <Button
          mode="contained"
          style={{ marginTop: 20 }}
          icon="plus"
          onPress={() => props.navigation.navigate("Players")}
        >
          Add players
        </Button>
      </View>
    );
  }

  return <Text>Teams</Text>;
}

function PlayersScreen() {
  const theme = useTheme();

  const [newPlayerName, setNewPlayerName] = useState("");
  const players = useStore((state) => state.players);
  const addPlayer = useStore((state) => state.addPlayer);
  const removePlayer = useStore((state) => state.removePlayer);

  const addPlayerHandler = () => {
    if (!newPlayerName) return;
    addPlayer(newPlayerName);
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
              key={player.id}
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
                  Alert.alert(
                    "Remove player",
                    `Are you sure you want to remove ${player.name}?`,
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Remove",
                        style: "destructive",
                        onPress: () => removePlayer(player.id),
                      },
                    ]
                  );
                }}
              />
            </View>
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
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const Drawer = createDrawerNavigator<RootStackParamList>();
  const playersCount = useStore((state) => state.players.length);

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

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={combinedTheme}>
        <Drawer.Navigator
          initialRouteName={playersCount > 1 ? "Matches" : "Players"}
        >
          <Drawer.Screen
            name="Matches"
            component={MatchesScreen}
            options={{ title: "Matches" }}
          />
          <Drawer.Screen
            name="Teams"
            component={TeamsScreen}
            options={{ title: "Teams" }}
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
