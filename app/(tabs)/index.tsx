import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

const index = () => {
  return (
    <View style={styles.container}>
      <Text>Home feed</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'pink',
  },
});

export default index;