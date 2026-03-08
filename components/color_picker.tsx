import React, {useState} from 'react';
import { StyleProp, StyleSheet, View, ViewStyle, TouchableOpacity, Modal, Text, TouchableWithoutFeedback, TextInput } from 'react-native';
import ColorPicker, { HueSlider, BrightnessSlider,  SaturationSlider, Panel2,} from 'reanimated-color-picker';
import type { RenderThumbProps } from 'reanimated-color-picker';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { IconSymbol } from './ui/icon-symbol';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

const BORDER_FRAME = {
  borderRadius: 0,
  borderTopColor: '#c4c4c4',
  borderLeftColor: '#c4c4c4',
  borderBottomColor: '#ffffff',
  borderRightColor: '#ffffff',
  borderTopWidth: 2,
  borderLeftWidth: 2,
  borderBottomWidth: 2,
  borderRightWidth: 2,
  overflow: 'hidden',
} as const;

export default function DefaultColorPanel( {value, onColorChange} : {value: string; onColorChange: (hex: string) => void;} ) {
  const onSelectColor = (selected: { hex: string }) => {
    'worklet';
    // onChangeJS deprecated
    scheduleOnRN(onColorChange, selected.hex);
  };

  const [showModal, setShowModal] = useState(false);

  return (
    <View style={styles.row}>
      <View style={styles.previewColumn}>
        <TouchableOpacity
          style={[BORDER_FRAME, styles.previewBox, {backgroundColor: value}]}
          activeOpacity={0.8}
          onPress={() => setShowModal(true)}
        />
        <View style={[styles.inputGroup, BORDER_FRAME]}>
          <TextInput value={value} onChangeText={onColorChange}></TextInput>
        </View>
      </View>

      <View style={[styles.slidersColumn]}>
        <ColorPicker boundedThumb={false} thumbShape='triangleDown'
        style={{ width: '90%', marginBottom: 20, marginTop: 20}} value={value} onComplete={onSelectColor}>
          <HueSlider 
            style={[BORDER_FRAME, { marginTop: 15, marginBottom: 2 }]}
          />
          <SaturationSlider 
            reverse={true} style={[BORDER_FRAME, { marginTop: 2, marginBottom: 2 }]}
          />
          <BrightnessSlider 
            reverse={true} style={[BORDER_FRAME, { marginTop: 2, marginBottom: 15 }]}
          />
        </ColorPicker>
      </View>
      <Modal 
        transparent={true}
        visible={showModal} 
        animationType='fade'
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setShowModal(false)}
          >
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <ColorPicker value={value} onChange={onSelectColor} style={{width: '100%'}}>
                <Panel2
                  verticalChannel='saturation'
                  thumbScaleUpValue={1}
                  renderThumb={({ width, height, positionStyle, adaptiveColor, currentColor, initialColor }) => (
                    <PanelThumb
                      width={width}
                      height={height}
                      positionStyle={positionStyle}
                      adaptiveColor={adaptiveColor}
                      currentColor={currentColor}
                      initialColor={initialColor}
                    />
                  )} 
                  style={[BORDER_FRAME]}
                />
              </ColorPicker>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal> 
    </View>
  );
}

function PanelThumb({ width, height, positionStyle, adaptiveColor, currentColor, initialColor }: RenderThumbProps) {
  // const animatedStyle = useAnimatedStyle(() => ({
  //   backgroundColor: currentColor.value,
  // }));

  return (
    <Animated.View style={positionStyle as StyleProp<ViewStyle>}>
      <Animated.View
        style={[
          {
            width: width,
            height: height,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          },
          //animatedStyle,
        ]}
      >
        <IconSymbol name='thumb' color='#000000' size={0.75*width} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },

  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },

  previewBox: {
    width: 75,
    height: 55,
  },

  previewColumn: {
    flexDirection: 'column',
    marginLeft: 20,
    marginRight: 20,
  },

  inputGroup: {
    flex: 0.2,
    width: 75,
    padding: 3,
  },

  slidersColumn: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    width: '100%'
  },

  modalContent: {
    position:'absolute',
    backgroundColor: '#ececec',
    padding: 10,
    width: '55%',
    marginTop: 207,
    marginRight: 32,
    borderStyle: 'solid'
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
});