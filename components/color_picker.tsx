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
            renderThumb={({ width, height, positionStyle, adaptiveColor, currentColor, initialColor }) => (
              <CustomThumb 
                width={width}
                height={height}
                positionStyle={positionStyle}
                adaptiveColor={adaptiveColor}
                currentColor={currentColor}
                initialColor={initialColor}
              />
            )}
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

function CustomThumb({ width, height, positionStyle, adaptiveColor, currentColor, initialColor }: RenderThumbProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: adaptiveColor.value,
    backgroundColor: currentColor.value,
  }));

  return (
    <Animated.View style={positionStyle as StyleProp<ViewStyle>}>
      <Animated.View
        style={[
          {
            width: width * 0.35,
            height: height,
            borderWidth: 2,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            backgroundColor: initialColor,
            width: width * 0.2,
            height: height * 0.8,
            justifyContent: 'center',
            alignItems: 'center',
            alignSelf: 'flex-end',
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});