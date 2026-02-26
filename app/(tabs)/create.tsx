import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

const create = () => {
  return (
    <View style={styles.container}>
      <Text>Create a post here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'pink',
  },
});

export default create;