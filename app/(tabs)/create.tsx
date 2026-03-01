import React from 'react';
import {StyleSheet, Text, View, Image, Pressable} from 'react-native';
import { withDecay } from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';


const create = () => {
  return (
    <View style={styles.container}>
      <Text>Post</Text>

      <View style= {styles.toolsContainer}>
        <Pressable style={styles.button}> 
          <IconSymbol name="lasso" color={"currentColor"} />        
        </Pressable>

        <Pressable style={styles.button}> 
          <IconSymbol name="line" color={"currentColor"} />        
        </Pressable>

        <Pressable style={styles.button}> 
          <IconSymbol name="square" color={"currentColor"} />        
        </Pressable>

        <Pressable style={styles.button}> 
          <IconSymbol name="circle" color={"currentColor"} />        
        </Pressable>

        <Pressable style={styles.button}> 
          <IconSymbol name="fill" color={"currentColor"} />        
        </Pressable>

        <Pressable style={styles.button}> 
          <IconSymbol name="dropper" color={"currentColor"} />        
        </Pressable>

        <Pressable style={styles.button}> 
          <IconSymbol name="erase" color={"currentColor"} />        
        </Pressable>

        <Pressable style={styles.button}> 
          <IconSymbol name="draw" color={"currentColor"} />        
        </Pressable>

        <Pressable style={styles.button}> 
          <IconSymbol name="undo" color={"currentColor"} />        
        </Pressable>

        <Pressable style={styles.button}> 
          <IconSymbol name="redo" color={"currentColor"} />        
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%'
  },
  toolsContainer: {
    width: 20,
    height: 20,
    color: 'rgb(255, 0, 255)'
  },
  image: {
    height: 20,
    width: 20,
  },
  button: {
    padding: 5,
    width: 30,
    height: 30,
    backgroundColor: 'rgb(175, 175, 175)'
  }
});

export default create;
