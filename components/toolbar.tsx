import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export type ToolName = 'draw' | 'erase' | 'fill' | 'lasso' | 'dropper' | 'line' | 'square' | 'circle' | 'undo' | 'redo';

export const ALL_TOOL_NAMES: ToolName[] = ['draw', 'erase', 'fill', 'lasso', 'dropper', 'line', 'square', 'circle', 'undo', 'redo'];

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
      {ALL_TOOL_NAMES.filter(t => allowedTools.includes(t)).map(t => (
        <Pressable
          key={t}
          style={activeTool === t ? styles.buttonEnabled : styles.buttonDisabled}
          onPress={() => handlePress(t)}
        >
          <IconSymbol name={t} color={'currentColor'} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 20,
    height: 20,
    color: 'rgb(255, 0, 255)',
  },
  buttonEnabled: {
    padding: 5,
    width: 30,
    height: 30,
    backgroundColor: 'rgb(128, 128, 128)',
  },
  buttonDisabled: {
    padding: 5,
    width: 30,
    height: 30,
    backgroundColor: 'rgb(175, 175, 175)',
  },
});
