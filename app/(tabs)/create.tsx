import React, { useState, useRef } from 'react';
import {StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function ChooseSize() {
  const router = useRouter()
  
  return (
    <View style={styles.container}>

      <Text style = {{fontSize: 25, marginBottom: 45, marginTop: 100, color:'#5174cf'}}>pick canvas size:</Text>
      <View style = {styles.buttons}>
        <TouchableOpacity style = {styles.gridButton1} onPress={() => router.push({
            pathname: '/drawing',
            params: {
              size: 16,
            },
          })}>
          <Image style = {styles.image} source={require('../../assets/images/16x16-grid.png')}/>
          <Text style = {{color:'#5174cf', fontSize: 18}}>16 x 16</Text>
        </TouchableOpacity>

         <TouchableOpacity style = {styles.gridButton} onPress={() => router.push({
            pathname: '/drawing',
            params: {
              size: 32,
            },
          })}>
          <Image style = {styles.image} source={require('../../assets/images/32x32-grid.png')}/>
          <Text style = {{color:'#5174cf', fontSize: 18}}>32 x 32</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style = {styles.gridButton} onPress={() => router.push({
            pathname: '/drawing',
            params: {
              size: 64,
            },
          })}>
          <Image style = {styles.image} source={require('../../assets/images/64x64-grid.png')}/>
          <Text style = {{color:'#5174cf', fontSize: 18}}>64 x 64</Text>
        </TouchableOpacity>
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
    gap: 50,
  },
  gridButton1: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 54,
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
    borderWidth: 0.25,
    borderColor: '#000',
  },
});