import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

const message = () => {
  return (
    <View style={styles.container}>
      <Text>Message here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'pink',
  },
});

export default message;