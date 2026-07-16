import { useEffect } from "react";
import { View, Text } from "react-native";
import { supabase } from "../services/supabase";

export default function Index() {
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("products")
        .select("name, barcode, stock_quantity")
        .limit(5);

      console.log("Products:", data);

      if (error) {
        console.log(error);
      }
    }

    load();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Connecting to Supabase...</Text>
    </View>
  );
}