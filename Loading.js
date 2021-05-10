import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Loading() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Safe Children</Text>
      <Text>presented by 엠투테크</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 30,
    paddingVertical: 100,
    backgroundColor: "#ffe896"
  },
  text: {
    fontWeight: "bold",
    color: "#2c2c2c",
    fontSize: 30
  }
});
