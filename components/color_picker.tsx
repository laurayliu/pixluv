import React, {useState} from 'react';
import { StyleProp, StyleSheet, View, ViewStyle, TouchableOpacity, Modal, Text } from 'react-native';
import ColorPicker, { HueSlider, BrightnessSlider,  SaturationSlider, Panel1,} from 'reanimated-color-picker';
import type { RenderThumbProps } from 'reanimated-color-picker';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

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
      <TouchableOpacity
        style={[BORDER_FRAME, styles.previewBox, {backgroundColor: value}]}
        activeOpacity={0.8}
        onPress={() => setShowModal(true)}
      />

      <View style={styles.slidersColumn}>
        <ColorPicker boundedThumb={false} thumbShape='triangleDown'
        style={{ width: '90%', marginBottom: 20, marginTop: 20}} value={value} onComplete={onSelectColor}>
          <HueSlider 
            style={[BORDER_FRAME, { marginTop: 15, marginBottom: 2 }]}
          />
          <SaturationSlider 
            style={[BORDER_FRAME, { marginTop: 2, marginBottom: 15 }]}
          />
          <BrightnessSlider 
            style={[BORDER_FRAME, { marginTop: 2, marginBottom: 2 }]}
          />
        </ColorPicker>
      </View>

      <Modal visible={showModal} animationType='slide'>
        <View style={styles.modalContent}>
          <ColorPicker value={value} onChange={onSelectColor} style={{width: '90%',}}>
            <View style={[BORDER_FRAME]}><Panel1/></View>
          </ColorPicker>
          <TouchableOpacity style={styles.closePanel} onPress={() => setShowModal(false)}>
            <Text>done</Text>
          </TouchableOpacity>
        </View>
      </Modal>
        
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  previewBox: {
    width: 75,
    height: 75,
    marginLeft: 20,
    marginRight: 20,
  },

  slidersColumn: {
    flex: 1,
  },

  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',

  },

  closePanel: {
    alignSelf: 'center',
  },

});