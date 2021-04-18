import React, {Component, useState } from 'react';
import {Text, View, Button, StyleSheet, Image, Switch} from 'react-native';

class MainScreen extends Component{

  state = {
    witchValue: false,
    inPlace: false,
    cnt: 2,
    latitude: null,
    longitude: null
  };
  toggleSwitch = value =>{ this.setState({ switchValue: value})};
  inPlaceChange = value =>{ this.setState({ inPlace: value})};

  render(){
    let placeName = "양덕 초등학교";

    return (
      <View style={styles.background}>
        <View style={styles.active}>
          <Switch style={{ marginTop: 31 }} onValueChange={this.toggleSwitch} value={this.state.switchValue}/>
          <Text style={styles.active_text}>{this.state.switchValue ? '어플이 활성화되었습니다!' : '어플을 활성화시켜주세요!'}</Text>
        </View>
        {this.state.switchValue && this.state.inPlace ?
          <View>
            <View style={styles.alert_place}>
              <Text style={styles.placeName}>"{placeName}"</Text>
              <Text style={styles.text}>어린이 보호 구역입니다.</Text>
            </View>
            <View style={styles.alert_num}>
              <View style={{ flex: 1}}>
                <Image source={require('./images/child2.png')} style={styles.img}></Image>
              </View>
              <View style={{ flex: 3, paddingLeft: 15,}}>
                <View style={{flexDirection: "row"}}>
                  <Text style={styles.text}>현재 </Text><Text style={styles.num}>{this.state.cnt}명</Text><Text style={styles.text}> 감지됩니다. </Text>
                </View>
                <View>
                  <Text style={styles.text}>주의하세요!</Text>
                </View>
              </View>
            </View>
          </View>
        : <View style={{ flexGlow: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text>Latitude : {this.state.latitude}</Text>
            <Text>Longitude: {this.state.longitude}</Text>
          </View>}
        <View style={styles.test}>
          <Switch style={{ marginTop: 31 }} onValueChange={this.inPlaceChange} value={this.state.inPlace}/>
          <Text style={styles.active_text}>{this.state.inPlace ? '어린이 보호 구역 안' : '어린이 보호 구역 밖'}</Text>
          <Text style={styles.active_text}>나중에는 사용자의 위치에 따라 변경됨 (현재는 임시로 스위치 사용)</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
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
    marginTop: 100,
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
  img: {
    width: "100%",
    height: "100%",
    //resizeMode: 'contain',
  }
});

export default MainScreen;

/*
import React, {Component} from 'react';
import {Platform, StyleSheer, Text, View} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
export default class App extends Component{
  constructor(props){
    super(props);
    this.state = {
      latitude: null,
      longitude: null,
      error: null,
    };
  }
  componentDidMount() {
    Geolocation.getCurrentPosition(
      (position) => {
          this.setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            error: null,
          });
        },
        (error) => this.setState({error: error.message}),
        {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
      );
    }
      render(){
        return (
          <View style={{ flexGlow: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text>Latitude : {this.state.latitude}</Text>
              <Text>Longitude: {this.state.longitude}</Text>
            </View>
        );
      }
  }*/
