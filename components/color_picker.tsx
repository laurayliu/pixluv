import React, { useState } from 'react';
import { Button, Modal, StyleSheet, View } from 'react-native';
import ColorPicker, { Preview, HueSlider, BrightnessSlider,  SaturationSlider} from 'reanimated-color-picker';
import { scheduleOnRN } from 'react-native-worklets';

export default function DefaultColorPanel( {value, onColorChange} : {value: string; onColorChange: (hex: string) => void;} ) {
  const [showModal, setShowModal] = useState(false);

  const onSelectColor = (selected: { hex: string }) => {
    'worklet';
    // onChangeJS deprecated
    scheduleOnRN(onColorChange, selected.hex);
  };

  return (
    <View style={styles.container}>
      <Button title='Color Picker' onPress={() => setShowModal(true)} />

      <Modal visible={showModal} animationType='slide'>
        <ColorPicker style={{ width: '70%' }} value={value} onComplete={onSelectColor}>
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