import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import ColorPicker, { HueSlider, BrightnessSlider,  SaturationSlider} from 'reanimated-color-picker';
import type { RenderThumbProps } from 'reanimated-color-picker';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export default function DefaultColorPanel( {value, onColorChange} : {value: string; onColorChange: (hex: string) => void;} ) {
  const onSelectColor = (selected: { hex: string }) => {
    'worklet';
    // onChangeJS deprecated
    scheduleOnRN(onColorChange, selected.hex);
  };

  return (
    <View style={styles.container}>
        <ColorPicker boundedThumb={false} thumbShape='triangleDown'
        style={{ width: '70%' }} value={value} onComplete={onSelectColor}>
          <HueSlider 
            style={{
              borderRadius: 0,
              overflow: 'hidden',
            }}
          />
          <BrightnessSlider 
            style={{
              borderRadius: 0,
              overflow: 'hidden',
            }}
          />
          <SaturationSlider 
            style={{
              borderRadius: 0,
              overflow: 'hidden',
            }}
          />
        </ColorPicker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});