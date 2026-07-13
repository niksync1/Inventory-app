import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
import { useEffect } from "react";
import { View, Text } from "react-native";
import { supabase } from "../services/supabase";

export default function Home() {
  useEffect(() => {
      async function testConnection() {
            const { data, error } = await supabase
                    .from("products")
                            .select("name")
                                    .limit(1);

                                          console.log(data);
                                                console.log(error);
                                                    }

                                                        testConnection();
                                                          }, []);

                                                            return (
                                                                <View
                                                                      style={{
                                                                              flex: 1,
                                                                                      justifyContent: "center",
                                                                                              alignItems: "center",
                                                                                                    }}
                                                                                                        >
                                                                                                              <Text>Inventory App</Text>
                                                                                                                  </View>
                                                                                                                    );
                                                                                                                    }