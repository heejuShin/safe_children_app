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
    //await this.koreaGrid();
    /*await this.getData(this.gridX*10 + this.gridY);
    if(this.placeInfo.length != 0){ // 현재 시,구 정보가 내장되어 있을 경우
      await this.getSchoolZoneByPlace();
    }else{ // 처음가보는 곳일 경우
      await this.getSchoolZoneByPlaceFirstTime(); //날짜가 없어야함
      //console.log("INFO is ", this.placeInfo);
    }*/
    //this.getPlaceInfo(); //스쿨존 정보를 받아옴 TODO -> 거리에 따른 정보를 받아오게
    await this.getSchoolZoneByPlaceFirstTime();
  }

  state = {
    isLoading: true, //로딩페이지를 불러오기 위한 변수
    switchValue: false, //앱 활성화
    inPlace: false, //스쿨존 안에 있는지 확인
    latitude: null, //현재 위도
    longitude: null, //현재 경도
    placeId: 15053, //school zone id
    placeName: null,
    //sectionId: 10, //section id
    getReceiverInfo: false, //수신기 정보 받았는지
    getSectionInfo: false, //섹션 정보 받았는지
    isFirstTimeEnter: true, //진입 알림용
    isFirstTimeOut: false, //이탈 알림용
    cnt: 0, //어린이 수
    last_cnt: 0, //지난 어린이 수 (변화용)
    out: 0, //나간지 몇 초 됐는지

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

  korea_longitude=[125.86, 129.64];
  korea_latitude = [38.183, 34.277];
  per_x = (129.64 - 125.86) / 9.0;
  per_y = (38.183 - 34.277) / 9.0;
  gridX = 0;
  gridY = 0;
  gridSemi = [];

  //위치로 그리드 구하는 함수
  koreaGrid = async () => {
    var self = this;
    for(let i=0;i<9;i++){
      if(self.state.longitude < self.korea_longitude[0]+self.per_x*i){
        self.gridX = i;
        break;
      }
      if(i==8) self.gridX = i;
    }

    for(let i=0;i<9;i++){
      if(self.korea_latitude[0]- self.per_y*i < self.state.latitude ){
        self.gridY = i;
        break;
      }
    }
    if(self.state.longitude < self.korea_latitude[1]) y = 10;
    console.log("Korea Grid ",self.gridX,self.gridY);
  };

  //100개 이상일 때 여기로 옴
  koreaGridSemi = async() =>{
    var self = this;
    var astartX = self.placeInfo[3];
    var astartY = self.placeInfo[2];
    var aendX = self.placeInfo[1];
    var aendY = self.placeInfo[0];
    var per_x = (aendX - astartX)/9.0;
    var per_y = (astartY - aendY)/9.0;

    var pre_gridX = self.gridX;
    var pre_gridY = self.gridY;

    for(let i=0;i<9;i++){
      if(self.state.longitude < self.korea_longitude[0]+per_x*i){
        self.gridX = i;
        break;
      }
      if(i==8) self.gridX = i;
    }

    for(let i=0;i<9;i++){
      if(self.korea_latitude[0]- per_y*i < self.state.latitude ){
        self.gridY = i;
        break;
      }
    }

    console.log(self.placeInfo);
    console.log(pre_gridX, " ", pre_gridY, " " ,self.gridX," ", self.gridY," ", aendX["endX"]," ", aendY["endY"]," ", astartX.startX," ", astartY["startY"]);

    await axios({
        method: 'GET',
        url: "https://capstone18z.herokuapp.com/rest/schoolzone/grid/"+self.gridX+'/'+self.gridY,// 몇 번째 그리드인지 보내기
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
        },
        params : {
          endY: aendY["endY"],
          endX: aendX["endX"],
          startY: astartY.startY,
          startX: astartX.startX,
        }
      }).then(function (response){
        console.log("Semi start ", response.data);
        self.placeInfo = Object.entries(response.data.placeData).map(([key, val])=> ({
          [key]: val
        }));
        self.placeInfo[self.placeInfo.length] = response.data.timeData;
        console.log("Semi ", self.placeInfo[0]);
        console.log("semi ", self.placeInfo[self.placeInfo.length-1]);
      }).then(function (response){
        self.storeData(pre_gridX*10 + pre_gridY);
        console.log("Semi then after");
      }).catch(function (error) {
        console.log("can not get KoreaGridSemi\n",error)
    });
  };

  getSchoolZoneByPlaceFirstTime = async () => {
    console.log("getschoolzonebyplacefirsttime enter\n");
    var self = this;
    var d = new Date();
    var date = new Date().getDate();
    var month = new Date().getMonth();

    var dS = d.toString();
    var year = dS.substring(11,15);

    var flag = 0;
    await axios({
      method: 'GET',
      url: "https://capstone18z.herokuapp.com/rest/schoolzone/grid/"+self.gridX+'/'+self.gridY,// 몇 번째 그리드인지 보내기
      headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
      }
    }).then(function (response){
      console.log("Test" ,response.data.placeData);
      if(response.data.placeData.length == 0){
        self.placeInfo = {"0" : {"0" : {"name" : "None"}}, "timeData" :{"updateTime" : year+'-'+month+'-'+date}};
        console.log("Zero test ", self.placeInfo);
      }else{
        self.placeInfo = Object.entries(response.data.placeData).map(([key, val])=> ({
          [key]: val
        }));
        self.placeInfo[self.placeInfo.length] = response.data.timeData;
        if(self.placeInfo.length == 5){
          flag = 1;
          self.koreaGridSemi();
          console.log("Over hundred");
        }
      }
      console.log("getSchoolZoneByPlaceFirstTime ",self.placeInfo.length);
    }).then(function(response){
      if(flag==0)
        self.storeData(self.gridX*10+self.gridY);
    }).catch(function (error) {
      console.log("can not get getSchoolZoneByPlaceFirstTime\n")
    });
  };


getSchoolZoneByPlace = async () => {
  console.log("getschoolzonebyplace enter\n");
  var self = this;
    var d = new Date();
    var date = new Date().getDate();
    var month = new Date().getMonth();

    var dS = d.toString();
    var year = dS.substring(11,15);
    console.log("Params are "+year+'-'+month+'-'+date);

    var updateTime = self.placeInfo.length;

    var flag = 0;
    await axios({
      method: 'GET',
      url: "https://capstone18z.herokuapp.com/rest/schoolzone/grid/"+self.gridX+'/'+self.gridY,// 몇 번째 그리드인지 보내기
      headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
      }
    }).then(function (response){
      /*
      //시간 타입 맞추는거 보완
      console.log("shit?");
      console.log(self.placeInfo["timeData"].updateTime);
      console.log(response.data.timeData.updateTime);
      */
     console.log(response.data);
      if(self.placeInfo["timeData"] != response.data.timeData.updateTime){

        console.log("Test" ,response.data.placeData);
        if(response.data.placeData.length == 0){
          self.placeInfo = {"0" : {"0" : {"name" : "None"}}, "timeData" :{"updateTime" : year+'-'+month+'-'+date}};
          console.log("Zero test ", self.placeInfo);
        }else{
          self.placeInfo = Object.entries(response.data.placeData).map(([key, val])=> ({
            [key]: val
          }));
          self.placeInfo[self.placeInfo.length] = response.data.timeData;
          if(self.placeInfo.length == 5){
            flag = 1;
            self.koreaGridSemi();
            console.log("Over hundred");
          }
        }
        console.log("getSchoolZoneByPlaceFirstTime ",self.placeInfo.length);
      }
    }).then(function(response){
      if(flag==0)
        self.storeData(self.gridX*10+self.gridY);
    }) .catch(function (error) {
        console.log("can not get getSchoolZoneByPlace\n",error)
    });


  };

  storeData = async (key) => {
    var self = this;
    try {
      console.log("storedata ",key,self.placeInfo[0])
      const jsonValue = JSON.stringify(self.placeInfo)
      await AsyncStorage.setItem(key.toString(), jsonValue)
      console.log("json values are ",self.placeInfo[0]);
    } catch (e) {
      Alert.alert("Error occur in store data");
    }
  };

    getData = async (grid) => {
      var self = this;
      try {
        const value = await AsyncStorage.getItem(grid.toString());
        console.log("getData ", value, "getdatadone");
        if(value !== null) {
          self.placeInfo = JSON.parse(value);
        }else{
          self.placeInfo=[];
        }
      } catch(e) {
        console.log("Error occur in get data",e);
        // error reading value
      }
    };

  //앱 활성화
  toggleSwitch = value =>{
    this.setState({ switchValue: value});
    this.setState({ isFirstTimeOut : false});
    this.setState({ isFirstTimeEnter : true});
    this.setState({ inPlace : false});
  };
  //거리 계산 함수
  calculateDistance = async (latitudeC, longitudeC) => {
        for(var i=0; i<this.placeInfo.length-1; i++){
          let distance = Geolib.getDistance(
            {
              latitude: latitudeC,
              longitude: longitudeC,
              //latitude: 37.80098,
              //longitude: 126.25689, //지석초교 데이타
            },
            {
              latitude: this.placeInfo[i][i].latitude, //여기에 비교 값
              longitude: this.placeInfo[i][i].longitude, //여기에 비교 값
          });
          //console.log("->"+this.placeInfo[i][i].latitude+ " & " + this.placeInfo[i][i].longitude+ "->" + distance);
          //if(distance<500){
            //this.state.getSectionInfo ? console.log() : //this.getSectionByPlace(this.state.placeId); //업데이트시만 받아옴
            //this.state.getReceiverInfo ? console.log() : this.getReceiverByPlace(this.state.placeId); //업데이트시만 받아옴
          //}
          if(distance<300) {
            //console.log("->"+this.placeInfo[i][i].name);
            this.state.isFirstTimeEnter ? await this.EnterPushNotification(this.placeInfo[i][i].name) : console.log();
            this.setState({ isFirstTimeEnter : false});
            this.setState({ isFirstTimeOut : true});
            this.setState({ inPlace : true});
            this.setState({ placeId : this.placeInfo[i][i].id});
            this.setState({ placeName : this.placeInfo[i][i].name});
            this.getNum(this.state.placeId);
            this.setState({ out : 0});
            break;
          }
          else{
            if(this.state.out>5){
              this.state.isFirstTimeOut ? await this.OutPushNotification(this.state.placeName) : console.log();
              this.setState({ placeId : null});
              this.setState({ placeName: null});
              this.setState({ isFirstTimeOut : false});
              this.setState({ isFirstTimeEnter : true});
              this.setState({ inPlace : false});
            }
            else{
              this.setState({ out : this.state.out + 1});
            }
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
    //todo
    var self = this;
    axios({
           method: 'GET',
           url: "https://capstone18z.herokuapp.com/rest/children/placeId/"+placeId,
           headers: {
               "Content-Type": "application/x-www-form-urlencoded",
                "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
             },
         }).then(function (response) {
           //self.setState({last_cnt: self.state.cnt});
           self.setState({cnt: parseInt(response.data)});
           //console.log("어린이 수 : ", response.data);
         }) .catch(function (error) {
             console.log("[error] can not get children num.\n")
           console.log(error);
         });
         /*(this.state.last_cnt != this.state.cnt)
         ? await this.NumPushNotification(this.state.placeName, this.state.cnt)
         : console.log();*/
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
          // todo
          //-> 여기서 안들어가져있을때만 확인후에 나가면 처리할건지
          //-> 여기서 계속 for문 돌면서 확인할 건지!
          (this.state.switchValue) ?
          this.calculateDistance(loc.coords.latitude, loc.coords.longitude)
          : console.log() ;
          this.setState({latitude: loc.coords.latitude, longitude: loc.coords.longitude});
          /*(this.state.switchValue) ?
          this.setState({latitude: loc.coords.latitude, longitude: loc.coords.longitude})
          : console.log() ;*/
        }
      );
    } catch (error) {
      //여기서 확인하는 과정도 넣자!
      Alert.alert("오류", "앱 실행을 위해 위치 정보가 필요합니다. 위치 권한을 설정해주세요.");
    }
  };


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

    OutPushNotification = async (name) => {
      console.log("out test");
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "알림 📬",
                body: name+'을 이탈했습니다',
                data: { data: 'goes here' },
              },
              trigger: { seconds: 1 },
            });
            await console.log("out done");
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
                <Text style={styles.placeName}>{this.state.placeName}</Text>
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
          </View>
        </View>
      );
  }
}
//const styles = Function.sheet;
