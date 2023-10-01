import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { PaperProvider } from "react-native-paper";

export default function App() {
  const Drawer = createDrawerNavigator<{ Home: undefined }>();

  return (
    <PaperProvider>
      <NavigationContainer>
        <Drawer.Navigator>
          <Drawer.Screen
            name="Home"
            component={() => <Text>Home</Text>}
            options={{ title: "Home" }}
          />
        </Drawer.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </PaperProvider>
  );
}
