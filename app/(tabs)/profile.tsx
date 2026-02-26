import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

const profile = () => {
  return (
    <View style={styles.container}>
      <Text>Your profile here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'pink',
  },
});

export default profile;