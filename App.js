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
//내장 저장
import AsyncStorage from '@react-native-async-storage/async-storage';

import { styles } from './Styles';

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
    this.placeInfo = [];
    var getSetting = await this.getSettingInfo(); //setting 정보를 받아옴
    //this.getLocation(); //지속적으로 정보 받아옴
    await this.getLocation();
    await this.getData("충청북도 충주시 수안보면");
    if(this.placeInfo.length != 0){ // 현재 시,구 정보가 내장되어 있을 경우
      await this.getSchoolZoneByPlace(this.placeInfo);
      await this.storeData("충청북도 충주시 수안보면");
    }else{ // 처음가보는 곳일 경우
      await this.getSchoolZoneByPlaceFirstTime("충청북도 충주시 수안보면"); //날짜가 없어야함
      //console.log("INFO is ", this.placeInfo);
    }
    //this.getPlaceInfo(); //스쿨존 정보를 받아옴 TODO -> 거리에 따른 정보를 받아오게
  }

  state = {
    isLoading: true, //로딩페이지를 불러오기 위한 변수
    switchValue: false, //앱 활성화
    inPlace: true, //스쿨존 안에 있는지 확인
    latitude: null, //현재 위도
    longitude: null, //현재 경도
    placeId: 1, //school zone id
    //sectionId: 10, //section id
    getReceiverInfo: false, //수신기 정보 받았는지
    getSectionInfo: false, //섹션 정보 받았는지
    isFirstTimeEnter: true, //
    cnt: 0, //어린이 수
    last_cnt: 0, //지난 어린이 수 (변화용)

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

  //placeInfo = [];

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
  calculateDistance = async (latitudeC, longitudeC) => {
        //todo
        for(var i=0; i<this.placeInfo.length; i++){
          console.log("==>"+this.placeInfo[i][i].latitude+"&"+this.placeInfo[i][i].longitude);
          let distance = Geolib.getDistance(
            {
              latitude: latitudeC,
              longitude: longitudeC,
            },
            {
              latitude: this.state.latitude, //여기에 비교 값
              longitude: this.state.longitude, //여기에 비교 값
          });
          if(distance<500){
            //this.state.getSectionInfo ? console.log() : //this.getSectionByPlace(this.state.placeId); //업데이트시만 받아옴
            this.state.getReceiverInfo ? console.log() : this.getReceiverByPlace(this.state.placeId); //업데이트시만 받아옴
          }
          if(distance<300) {
            this.state.isFirstTimeEnter ? await this.EnterPushNotification("와랩유치원") : console.log();
            this.setState({ isFirstTimeEnter : false})
            this.getNum(this.state.placeId); //지속적으로 받아옴
            break;
          }
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
              //console.log("can not get school zone info\n")
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
              //console.log("can not get setting info\n")
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
  getNum = async (placeId) => {
    var self = this;
    axios({
           method: 'GET',
           url: "https://capstone18z.herokuapp.com/rest/section/children/"+placeId,
           headers: {
               "Content-Type": "application/x-www-form-urlencoded",
                "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
             },
         }).then(function (response) {
           self.setState({last_cnt: cnt});
           self.setState({cnt: parseInt(response.data)});
           console.log("어린이 수 : ", response.data);
         }) .catch(function (error) {
             //console.log("[error] can not get children num.\n")
           //console.log(error);
         });
         (this.state.last_cnt != this.state.cnt)
         ? await this.NumPushNotification("와랩유치원", this.state.cnt)
         : console.log();
  }

  getSchoolZoneByPlaceFirstTime = async (place) => {
  var self = this;
  //console.log("Address is :" ,place);
  axios({
    method: 'GET',
    url: "https://capstone18z.herokuapp.com/rest/schoolzone",//현재 place를 넣으면 404가 나옴
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
          "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
      }
  }).then(function (response) {
    console.log("getSchoolZoneByPlaceFirstTimeEarly ", self.placeInfo);
    self.placeInfo = Object.entries(response.data).map(([key, val])=> ({
      [key]: val
    }));
    //this.storeData("충청북도 충주시 수안보면");
    console.log("getSchoolZoneByPlaceFirstTime ",self.placeInfo[0]);
    //this.storeData("충청북도 충주시 수안보면");
  }).then(()=>{
    this.storeData("충청북도 충주시 수안보면");
  }) .catch(function (error) {
      //console.log("can not get getSchoolZoneByPlaceFirstTime\n")
    //console.log(error);
  });

};
getSchoolZoneByPlace = async (place) => {
  var self = this;
  //console.log("IN getschoolzonebyplace",place);
  //var date = new Date().getDate();
  //var month = new Date().getMonth();
  //var year = new Date().getFullYear();
  //console.log("Params are "+year+'-'+month+'-'+date)
  axios({
    method: 'GET',
    url: "https://capstone18z.herokuapp.com/rest/schoolzone/",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
          "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
      },
    params: {
      //updateDate: 2021+'-'+month+'-'+date
    }
  }).then(function (response) {
    self.placeInfo = response.data
    //console.log("getSchoolZoneByPlace ",self.placeInfo)
  }) .catch(function (error) {
      //console.log("can not get getSchoolZoneByPlace\n")
    //console.log(error);
  });

};

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
          // todo
          //-> 여기서 안들어가져있을때만 확인후에 나가면 처리할건지
          //-> 여기서 계속 for문 돌면서 확인할 건지!
          (this.state.switchValue) ?
          this.calculateDistance(loc.coords.latitude, loc.coords.longitude)
          : console.log() ;
          (this.state.switchValue) ?
          this.setState({latitude: loc.coords.latitude, longitude: loc.coords.longitude})
          : console.log() ;
        }
      );
    } catch (error) {
      //여기서 확인하는 과정도 넣자!
      Alert.alert("오류", "앱 실행을 위해 위치 정보가 필요합니다. 위치 권한을 설정해주세요.");
    }
  };

  storeData = async (key) => {//키 값은 시, 구 이름으로
      var self = this;
      //console.log("In sotre data key is:",key);
      //console.log("In store data placeinfo :",this.placeInfo);
      try {
        const jsonValue = JSON.stringify(this.placeInfo)
        await AsyncStorage.setItem(key, jsonValue)
        //console.log("json values are ",jsonValue);
      } catch (e) {
        //Alert.alert("Error occur in store data");
      }
    }

    getData = async (place) => {
      try {
        const value = await AsyncStorage.getItem(place);
        //console.log("get data check ",place);
        //console.log("get data check2",value);
        if(value !== null) {
          this.placeInfo = JSON.parse(value);
          // value previously stored
          //this.setState({savetest : JSON.parse(value)});
          //Alert.alert(a);
        }else{
          this.placeInfo=[];
        }
      } catch(e) {
        //console.log("Error occur in get data",e);
        // error reading value
      }
    }

    EnterPushNotification = async (name) => {
      console.log("enter test");
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "알림 📬",
                body: name+'에 진입했습니다',
                data: { data: 'goes here' },
              },
              trigger: { seconds: 1 },
            });
            await console.log("enter done");
    }

    NumberPushNotification = async (name, num) => {
      console.log("num test");
      await Notifications.scheduleNotificationAsync({
        content: {
          title: name+ " 📬",
          body: '어린이가 '+num+'명 감지됩니다',
          data: { data: 'goes here' },
        },
        trigger: { seconds: 0 },
      });
      await console.log("num done");

    }


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
                <Text style={styles.placeName}>"와랩 유치원"</Text>
                <Text style={styles.text}>어린이 보호 구역입니다.</Text>
              </View>
              <View style={styles.alert_num}>
                <View style={{flex: 1}}>
                  <Image source={require('./assets/child.png')} style={styles.img}></Image>
                </View>
                 <View style={{ flex: 3, paddingLeft: 15,}}>
                  <View style={{flexDirection: "row"}}>
                    {this.state.cnt != 0 ?
                    <Text style={styles.text}>현재 </Text>
                    : <Text style={styles.text_zero}>현재 </Text> }
                    {this.state.cnt != 0 ?
                    <Text style={styles.num}>{this.state.cnt}명</Text>
                    : <Text style={styles.text_zero}>감지되는</Text> }
                    {this.state.cnt != 0 ?
                    <Text style={styles.text}> 감지됩니다. </Text>
                    : <Text></Text>}
                  </View>
                 <View/>
                 <View/>
                  <View>
                    {this.state.cnt != 0 ?
                    <Text style={styles.text}>주의하세요!</Text>
                    : <Text style={styles.text_zero}>어린이가 없습니다.</Text>}
                  </View>
                </View>
              </View>
            </View>
          : <View style={{ flexGlow: 1, alignItems: 'center', justifyContent: 'center' }}>
            </View>}
          <View style={styles.test}>
            <Button
              title="알람 테스트"
              onPress={async () => {
                await this.EnterPushNotification("와랩 유치원", this.state.cnt);
              }}
            />
          </View>
        </View>
      );
  }
}
//const styles = Function.sheet;
