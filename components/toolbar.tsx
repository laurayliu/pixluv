import React, { useState } from 'react';
import { Dimensions, View, Pressable, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export type ToolName = 'draw' | 'erase' | 'fill' | 'dropper' | 'undo' | 'redo'; // add lasso back maybe

export const ALL_TOOL_NAMES: ToolName[] = ['draw', 'erase', 'fill', 'dropper', 'undo', 'redo'];

type Props = {
  allowedTools: ToolName[];
  onToolChange: (tool: ToolName) => void;
  onUndo: () => void;
  onRedo: () => void;
};

export default function Toolbar({ allowedTools, onToolChange, onUndo, onRedo }: Props) {
  const [activeTool, setActiveTool] = useState<ToolName>('draw');

  const handlePress = (tool: ToolName) => {
    if (tool === 'undo') { onUndo(); return; }
    if (tool === 'redo') { onRedo(); return; }
    setActiveTool(tool);
    onToolChange(tool);
  };

  return (
    <View style={styles.container}>
        <View style={styles.toolbar}>
      {ALL_TOOL_NAMES.filter(t => allowedTools.includes(t)).map(t => (
        <Pressable
          key={t}
          style=
          {[activeTool === t ? styles.buttonEnabled : styles.buttonDisabled]}
          onPress={() => handlePress(t)}
        >
          <IconSymbol name={t} color={'currentColor'} />
        </Pressable>
      ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: Dimensions.get('window').width - 100,
    backgroundColor: 'rgb(85, 84, 84)',
  },
  toolbar: {
    alignSelf: 'center',
    marginTop: 5,
  },
  buttonEnabled: {
    padding: 4,
    width: 30,
    height: 30,
    backgroundColor: 'rgb(135, 135, 135)',
  },
  buttonDisabled: {
    padding: 4,
    width: 30,
    height: 30,
    backgroundColor: 'rgb(175, 175, 175)',
  },
});
