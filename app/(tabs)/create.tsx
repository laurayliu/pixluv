import React from 'react';
import {StyleSheet, Text, View, Button} from 'react-native';

const create = () => {
  return (
    <View style={styles.container}>
      <Text>Create a post here</Text>
      <View style= {styles.toolsContainer}>
        
        <Button title='lasso' />
        <Button title='line'/>
        <Button title='square'/>
        <Button title='circle'/>
        <Button title='star'/>
        <Button title='eyedropper'/>
        <Button title='eraser'/>
        <Button title='draw'/>
        <Button title='undo'/>
        <Button title='redo'/>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'pink',
  },
  toolsContainer: {
    width: 30
  }
});

export default create;