import React from "react";
import { StyleSheet, Text, View } from "react-native";

export const styles = StyleSheet.create({
  test: {
    marginTop: 100,
    marginBottom : 20,
    width: '100%',
    height: 80,
    alignItems: 'center', //가로 정렬
    justifyContent: 'center', //세로 정렬
    position:'absolute',bottom:30,alignSelf:'flex-end'
  },
  background: {
    flex: 1,
    backgroundColor: '#ffe896',
  },
  active: {
    marginTop: 70,
    marginBottom : 20,
    width: '100%',
    height: 80,
    //backgroundColor: 'pink',
    alignItems: 'center', //가로 정렬
    justifyContent: 'center', //세로 정렬
  },
  alert_place: {
    marginTop: 10,
    marginLeft : '5%',
    marginRight : '5%',
    padding: 25,
    width: '90%',
    height:100,
    backgroundColor: 'white',
  },
  active_text: {
    marginTop : 10,
    color : '#616161',
  },
  alert_num: {
    marginTop: 10,
    marginLeft : '5%',
    marginRight : '5%',
    padding: 25,
    width: '90%',
    height:100,
    backgroundColor: 'white',
    flexDirection: "row",
  },
  placeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: "#5599e0",
  },
  num: {
    fontSize: 22,
    fontWeight: 'bold',
    color: "#f58302",
    marginTop : -1,
  },
  text: {
    fontSize: 20,
  },
  text_zero: {
    fontSize: 18,
  },
  img: {
    width: "100%",
    height: "100%",
    //resizeMode: 'contain',
  }
});
