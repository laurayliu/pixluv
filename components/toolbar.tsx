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

const BORDER_FRAME = {
  borderRadius: 0,
  borderTopColor: '#7b7b7b',
  borderLeftColor: '#7b7b7b',
  borderBottomColor: '#ffffff',
  borderRightColor: '#ffffff',
  borderTopWidth: 1,
  borderLeftWidth: 1,
  borderBottomWidth: 1,
  borderRightWidth: 1,
  overflow: 'hidden',
} as const;

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
          {[BORDER_FRAME, activeTool === t ? styles.buttonEnabled : styles.buttonDisabled]}
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
    backgroundColor: 'rgb(184, 184, 184)',
  },
  toolbar: {
    alignSelf: 'center',
    marginTop: 5,
  },
  buttonEnabled: {
    padding: 4,
    width: 32,
    height: 32,
    backgroundColor: 'rgb(156, 156, 156)',
    marginBottom: 5,
  },
  buttonDisabled: {
    padding: 4,
    width: 32,
    height: 32,
    backgroundColor: 'rgb(217, 216, 216)',
    marginBottom: 5,
  },
});
