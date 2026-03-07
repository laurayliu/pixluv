import React, { useState, useRef } from 'react';
import {StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';


export default function ChooseSize() {
  const router = useRouter()
  
  return (
    <View style={styles.container}>

      <Text style = {{fontSize: 30, marginBottom: 70, marginTop: 100, color:'#5174cf'}}>pick canvas size:</Text>
      <View style = {styles.buttons}>
        <View style = {styles.gridButton}>
          <Image style = {styles.image} source={require('../../assets/images/16x16-grid.png')}/>
          <TouchableOpacity onPress={() => router.push({
          pathname: '/drawing',
          params: {
            size: 16,
          },
        })}>
          <Text style = {{color:'#5174cf', fontSize: 18}}>16 x 16</Text>
        </TouchableOpacity>
        </View>
        
        <View style = {styles.gridButton}>
          <Image style = {styles.image} source={require('../../assets/images/32x32-grid.png')}/>
          <TouchableOpacity onPress={() => router.push({
            pathname: '/drawing',
            params: {
              size: 32,
            },
          })}>
          <Text style = {{color:'#5174cf', fontSize: 18}}>32 x 32</Text>
        </TouchableOpacity>
        </View>
        
        <View style = {styles.gridButton}>
          <Image style = {styles.image} source={require('../../assets/images/64x64-grid.png')}/>
           <TouchableOpacity onPress={() => router.push({
              pathname: '/drawing',
              params: {
                size: 64,
              },
            })}>
            <Text style = {{color:'#5174cf', fontSize: 18}}>64 x 64</Text>
          </TouchableOpacity>
        </View>  
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttons: {
    width: '70%',
    alignItems: 'flex-end',
    gap: 30,
  },
  gridButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 45,
  },
  nextButton: {
    width: 200,
    height: 40,
    backgroundColor: '#5174cf',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 4,
    marginTop: 150,
  },
  image: {
    width: 150,
    height: 150,
  }

});
