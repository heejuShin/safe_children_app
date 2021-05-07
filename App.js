import Loading from  "./Loading";
import * as Location from "expo-location";
import React, {Component, useState, useEffect } from 'react';
import {Text, View, Button, StyleSheet, Image, Switch, Alert} from 'react-native';
import axios from 'axios';
import * as Geolib from 'geolib';

const LOCATION_TRACKING = 'location-tracking';

export default class extends React.Component {
  componentDidMount() {
    this.getLocation();
    this.getPlaceInfo();
  }
  state = {
    isLoading: true,
    switchValue: false,
    inPlace: true,
    latitude: null,
    longitude: null,
    isLoading: true,
    placeId: 3,
    sectionId: 4,
    getReceiverInfo: false,
    getSectionInfo: false,
    cnt: 3,
    time: 0,
  };
  num = 3;
  placeInfo = [
    {
      name: "양덕초등학교",
      lat: 12.313,
      lon: 12.124,
    },
    {
      name: "와랩",
      lat: 12.313,
      lon: 12.124,
    },
  ];
  toggleSwitch = value =>{this.setState({ switchValue: value})};
  calculateDistance = (latitudeC, longitudeC) => {
        let distance = Geolib.getDistance(
          {
            latitude: latitudeC,
            longitude: longitudeC,
          },
          {
            latitude: this.state.latitude, //여기에 비교 값
            longitude: this.state.longitude, //여기에 비교 값
        });
        if(distance<300) {
          //school zone evernt => 지속적
          this.getNum(this.state.sectionId); //여기에 sectionId
        }
        if(distance<500){
          //section 이벤트 (이미 가지고 있는지 확인) => 일시적
          this.getSectionByPlace(this.state.placeId);
          this.getReceiverByPlace(this.state.placeId);
        }
        console.log(
            'You are '+distance+' meters away from '+this.state.latitude+','+this.state.longitude,
        );
    };

  //Rest API
  //어린이 보호구역 전체 정보 받아오기
  getPlaceInfo = () => {
    axios({
            method: 'GET',
            url: "https://capstone18z.herokuapp.com/rest/schoolzone",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                 "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
              },
          }).then(function (response) {
            //console.log(response)
          }) .catch(function (error) {
              console.log("can not get school zone info\n")
            console.log(error);
          });
  }
  //Place Id로 section 받아오기 (500M)
  getSectionByPlace = (placeId) => {
    axios({
           method: 'GET',
           url: "https://capstone18z.herokuapp.com/rest/section/"+placeId,
           headers: {
               "Content-Type": "application/x-www-form-urlencoded",
                "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
             },
         }).then(function (response) {
           //console.log(response)
         }) .catch(function (error) {
             console.log("[error] can not get sectionInfo.\n")
           console.log(error);
         });
  }
  //Place Id로 수신기 받아오기 (300M ? 500M?)
  getReceiverByPlace = (placeId) => {
    axios({
           method: 'GET',
           url: "https://capstone18z.herokuapp.com/rest/receiver/"+placeId,
           headers: {
               "Content-Type": "application/x-www-form-urlencoded",
                "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
             },
         }).then(function (response) {
           //console.log(response)
         }) .catch(function (error) {
             console.log("[error] can not get receiver info.\n")
           console.log(error);
         });
  }
  //어린이 숫자 받아오기 (300M안에서 계속)
  getNum = (sectionId) => {
    axios({
           method: 'GET',
           url: "https://capstone18z.herokuapp.com/rest/section/children/"+sectionId,
           headers: {
               "Content-Type": "application/x-www-form-urlencoded",
                "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
             },
         }).then(function (response) {
           //console.log(response)
           this.setState({ num : 3 });
         }) .catch(function (error) {
             console.log("[error] can not get children num.\n")
           console.log(error);
         });
  }

  getLocation = async () => {

    try {
      await Location.requestForegroundPermissionsAsync();
      const {
        coords: { latitude, longitude }
      } = await Location.getCurrentPositionAsync();
      this.setState({ isLoading: false });
      this.setState({ latitude: latitude, longitude: longitude});
      let location = await Location.watchPositionAsync(
        {accuracy:Location.Accuracy.High, timeInterval: 5000, distanceInterval: 0},
        (loc) => {
          const { isLoading } = this.state;
          /*console.log(
            `${new Date(Date.now()).toLocaleString()}:`+ loc.coords.latitude +" & "+ loc.coords.longitude
          );*/
          this.calculateDistance(loc.coords.latitude, loc.coords.longitude);
          this.setState({latitude: loc.coords.latitude, longitude: loc.coords.longitude});
        }
      );
    } catch (error) {
      //여기서 확인하는 과정도 넣자!
      Alert.alert("오류", "앱 실행을 위해 위치 정보가 필요합니다. 위치 권한을 설정해주세요.");
    }
  };

  render() {
    const { isLoading } = this.state;
    return isLoading ? <Loading />
    : (
        <View style={styles.background}>
          <View style={styles.active}>
            <Switch style={{ marginTop: 31 }} onValueChange={this.toggleSwitch} value={this.state.switchValue}/>
            <Text style={styles.active_text}>{this.state.switchValue ? '어플이 활성화되었습니다!' : '어플을 활성화시켜주세요!'}</Text>
          </View>
          {this.state.switchValue && this.state.inPlace ?
            <View>
              <View style={styles.alert_place}>
                <Text style={styles.placeName}>"{this.placeInfo[this.state.placeId].name}"</Text>
                <Text style={styles.text}>어린이 보호 구역입니다.</Text>
              </View>
              <View style={styles.alert_num}>
                <View style={{ flex: 1}}>
                  <Image source={require('./images/child.png')} style={styles.img}></Image>
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
              <Text>위도 : {this.state.latitude}</Text>
              <Text>경도 : {this.state.longitude}</Text>
            </View>}
          <View style={styles.test}>
           <Button title="Rest Api 보내기"/>
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
  img: {
    width: "100%",
    height: "100%",
    //resizeMode: 'contain',
  }
});
