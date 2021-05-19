import Loading from  "./Loading";
import * as Location from "expo-location";
import React, {Component, useState, useEffect, useRef } from 'react';
import {Text, View, Button, StyleSheet, Image, Switch, Alert} from 'react-native';
import axios from 'axios';
import * as Geolib from 'geolib';
//alarm
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

//alarm
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default class extends React.Component {

  async componentDidMount() {
    var getSetting = await this.getSettingInfo(); //setting 정보를 받아옴
    this.getLocation(); //지속적으로 정보 받아옴
    this.getPlaceInfo(); //스쿨존 정보를 받아옴 TODO -> 거리에 따른 정보를 받아오게
  }
  state = {
    isLoading: true, //로딩페이지를 불러오기 위한 변수
    switchValue: false, //앱 활성화
    inPlace: true, //스쿨존 안에 있는지 확인
    latitude: null, //현재 위도
    longitude: null, //현재 경도
    placeId: 1, //school zone id
    sectionId: 1, //section id
    getReceiverInfo: false, //수신기 정보 받았는지
    getSectionInfo: false, //섹션 정보 받았는지
    cnt: 3, //어린이 수

    //setting information
    open_api_update_date: null,
    location_update_time: null,
    location_update_distance: null,
    section_update: null,
    clean_date: null,

    //alaram
    expoPushToken: null,
    setExpoPushToken: null,

  };

  //상범에게 -> 이 부분을 내장 저장 하면 돼!
  placeInfo = [
    {
      name: "양덕초등학교",
      lat: 12.313,
      lon: 12.124,
    },
    {
      name: "양덕초등학교",
      lat: 12.313,
      lon: 12.124,
    },
  ];
  //앱 활성화
  toggleSwitch = value =>{this.setState({ switchValue: value})};
  //거리 계산 함수
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
          this.getNum(this.state.sectionId); //지속적으로 받아옴
        }
        if(distance<500){
          this.state.getSectionInfo ? console.log() : this.getSectionByPlace(this.state.placeId); //업데이트시만 받아옴
          this.state.getReceiverInfo ? console.log() : this.getReceiverByPlace(this.state.placeId); //업데이트시만 받아옴
        }
        //section 나갔는지 확인
        //나갔으면 place 나갔는지 확인
        //place 안나갔으면 어느 섹션 속했는지
        /*console.log(
            'You are '+distance+' meters away from '+this.state.latitude+','+this.state.longitude,
        );*/
    };

  //Rest API
  //setting 정보 받아오기
  getSettingInfo = async () => {
    var self = this;
    var getSetting = await axios({
            method: 'GET',
            url: "https://capstone18z.herokuapp.com/rest/setting",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                 "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
              },
          }).then(function (response) {
            for(var i=0; i<response.data.length; i++){
              if(response.data[i].key == "open_api_update_date")
                self.setState({open_api_update_date: response.data[i].value});
              else if(response.data[i].key == "location_update_time")
                self.setState({location_update_time: response.data[i].value});
              else if(response.data[i].key == "location_update_distance")
                self.setState({location_update_distance: response.data[i].value});
              else if(response.data[i].key == "section_update")
                self.setState({section_update: response.data[i].value});
              else if(response.data[i].key == "clean_date")
                self.setState({clean_date: response.data[i].value});
              }
          }) .catch(function (error) {
              console.log("can not get school zone info\n")
            //console.log(error);
          });
  }
  //어린이 보호구역 전체 정보 받아오기
  getPlaceInfo = () => {
    var self = this;
    axios({
            method: 'GET',
            url: "https://capstone18z.herokuapp.com/rest/setting",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                 "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
              },
          }).then(function (response) {
            //console.log(response)
            self.setState({getReceivernInfo: true});
          }) .catch(function (error) {
              console.log("can not get setting info\n")
            //console.log(error);
          });
  }
  //Place Id로 section 받아오기 (500M)
  getSectionByPlace = (placeId) => {
    var self = this;
    axios({
           method: 'GET',
           url: "https://capstone18z.herokuapp.com/rest/section/"+placeId,
           headers: {
               "Content-Type": "application/x-www-form-urlencoded",
                "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
             },
         }).then(function (response) {
           //console.log(response.data);
           /*
           "data": Array [
               Object {
                 "endX": 36.093,
                 "endY": 129.388,
                 "id": 3,
                 "placeId": 1,
                 "regDate": 1620354698000,
                 "startX": 36.0929,
                 "startY": 129.387,
               },
               Object {
                 "endX": 36.098,
                 "endY": 129.39,
                 "id": 4,
                 "placeId": 1,
                 "regDate": 1620355302000,
                 "startX": 36.0929,
                 "startY": 129.387,
               },
             ],
           */
           self.setState({getSectionInfo: true});
         }) .catch(function (error) {
           console.log("[error] can not get sectionInfo.\n")
           //console.log(error);
         });
  }
  //Place Id로 수신기 받아오기 (300M ? 500M?)
  getReceiverByPlace = (placeId) => {
    var self = this;
    axios({
           method: 'GET',
           url: "https://capstone18z.herokuapp.com/rest/receiver/"+placeId,
           headers: {
               "Content-Type": "application/x-www-form-urlencoded",
                "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
             },
         }).then(function (response) {
           //console.log(response);
           //[{"id":3,"serialNum":"receiver_1","placeId":1,"latitude":36.0929,"longitude":129.388,"radius":50,"regDate":1620231390000,"editDate":1620491816000},{"id":4,"serialNum":"receiver_2","placeId":1,"latitude":36.0929,"longitude":129.385,"radius":50,"regDate":1618759295000,"editDate":1618759295000}]
           self.setState({getReceiverInfo: true});
         }) .catch(function (error) {
             //console.log("[error] can not get receiver info.\n")
           //console.log(error);
         });
  }
  //어린이 숫자 받아오기 (300M안에서 계속)
  getNum = (sectionId) => {
    var self = this;
    axios({
           method: 'GET',
           url: "https://capstone18z.herokuapp.com/rest/section/children/"+sectionId,
           headers: {
               "Content-Type": "application/x-www-form-urlencoded",
                "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
             },
         }).then(function (response) {
           self.setState({cnt: parseInt(response.data)});
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
        {accuracy:Location.Accuracy.High, timeInterval: parseInt(this.state.location_update_time), distanceInterval: parseInt(this.state.location_update_distance)},
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
    const { isLoading } = this.state.isLoading;

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
            </View>}
          <View style={styles.test}>
          <Button
            title="Press to schedule a notification"
            onPress={async () => {
              await schedulePushNotification(this.placeInfo[this.state.placeId].name, this.state.cnt);
            }}
          />
          </View>
        </View>
      );
  }
}

//alarm
async function schedulePushNotification(name, num) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: name+ " 📬",
      body: '어린이가 '+num+'명 감지됩니다',
      data: { data: 'goes here' },
    },
    trigger: { seconds: 2 },
  });
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
