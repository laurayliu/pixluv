import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

const challenge = () => {
  return (
    <View style={styles.container}>
      <Text>Do a challenge here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'pink',
  },
});

export default challenge;