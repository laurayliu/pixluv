import React, { useState } from 'react';
import { Button, Modal, StyleSheet, View } from 'react-native';

import ColorPicker, { Preview, HueSlider, BrightnessSlider,  SaturationSlider} from 'reanimated-color-picker';

export default function DefaultColorPanel() {
  const [showModal, setShowModal] = useState(false);

  // Note: use `onCompleteJS` and `onChangeJS` for non-worklet functions
  const onSelectColor = ({ hex }: { hex: string }) => {
    'worklet';
    // do something with the selected color.
    console.log(hex);
  };

  return (
    <View style={styles.container}>
      <Button title='Color Picker' onPress={() => setShowModal(true)} />

      <Modal visible={showModal} animationType='slide'>
        <ColorPicker style={{ width: '70%' }} value='red' onComplete={onSelectColor}>
          <Preview />
          <HueSlider />
          <BrightnessSlider />
          <SaturationSlider />
        </ColorPicker>

        <Button title='Ok' onPress={() => setShowModal(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});