import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Dimensions, Button, ActivityIndicator, Pressable, PanResponder } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { captureRef } from 'react-native-view-shot';
import { api } from '../../services/api';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_GRID = 16;
const DEFAULT_COLOR = '#fff';
const DEFAULT_SELECTED_COLOR = '#000';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_CONTAINER_SIZE = SCREEN_WIDTH - 100;

const ALL_TOOLS = [
  { name: 'draw',    icon: 'draw' },
  { name: 'erase',   icon: 'erase' },
  { name: 'fill',    icon: 'fill' },
  { name: 'lasso',   icon: 'lasso' },
  { name: 'dropper', icon: 'dropper' },
  { name: 'line',    icon: 'line' },
  { name: 'square',  icon: 'square' },
  { name: 'circle',  icon: 'circle' },
  { name: 'undo',    icon: 'undo',    onPress: undefined as (() => void) | undefined },
  { name: 'redo',    icon: 'redo' },
];

export default function Challenge() {
  const { token } = useAuth();
  const [allowedColors, setAllowedColors] = useState<string[]>([]);
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [gridSize, setGridSize] = useState<number>(DEFAULT_GRID);
  const [grid, setGrid] = useState<string[]>(
    Array(DEFAULT_GRID * DEFAULT_GRID).fill(DEFAULT_COLOR)
  );
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_SELECTED_COLOR);
  const [isUploading, setIsUploading] = useState(false);
  const cellSize = GRID_CONTAINER_SIZE / gridSize;

  const gridRef = useRef<View>(null);
  const [prevGrid, setPrevGrid] = useState<string[][]>([Array(DEFAULT_GRID * DEFAULT_GRID).fill(DEFAULT_COLOR)]);
  const index = useRef(0);
  const gridLayout = useRef({ x: 0, y: 0 });

  useEffect(() => {
    api.getTodayChallenge()
      .then((c: any) => {
        if (c.allowedColors?.length) setAllowedColors(c.allowedColors);
        if (c.allowedTools?.length) setAllowedTools(c.allowedTools);
      })
      .catch(() => {}); // no challenge today — no restriction
  }, []);

  const onGridLayout = () => {
    gridRef.current?.measure((x, y, width, height, pageX, pageY) => {
      gridLayout.current = { x: pageX, y: pageY };
    });
  };

  const colorCellAtPosition = (pageX: number, pageY: number) => {
    const relativeX = pageX - gridLayout.current.x;
    const relativeY = pageY - gridLayout.current.y;
    const col = Math.floor(relativeX / cellSize);
    const row = Math.floor(relativeY / cellSize);

    if (col >= 0 && col < gridSize && row >= 0 && row < gridSize) {
      const i = row * gridSize + col;
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid[i] = selectedColor;
        return newGrid;
      });
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { pageX, pageY } = evt.nativeEvent;
      colorCellAtPosition(pageX, pageY);
    },
    onPanResponderMove: (evt) => {
      const { pageX, pageY } = evt.nativeEvent;
      colorCellAtPosition(pageX, pageY);
    },
    onPanResponderRelease: () => {
      setPrevGrid((prevHistory) => {
        const newGrid = prevHistory.slice(0, index.current + 1);
        const updatedGrid = [...newGrid, [...grid]];
        index.current = updatedGrid.length - 1;
        return updatedGrid;
      });
    },
  });

  const handleGridChange = (text: string) => {
    const newGridSize = parseInt(text) || 0;
    setGridSize(newGridSize);
    setGrid(Array(newGridSize * newGridSize).fill(DEFAULT_COLOR));
  };

  const handleClear = () => {
    setGrid(Array(gridSize * gridSize).fill(DEFAULT_COLOR));
  };

  const handleUndo = () => {
    if (index.current > 0) {
      const prevIndex = index.current - 1;
      setGrid(prevGrid[prevIndex]);
      index.current = prevIndex;
    }
  };

  const tools = ALL_TOOLS.map(t => t.name === 'undo' ? { ...t, onPress: handleUndo } : t);

  const handleSaveAndUpload = async () => {
    if (isUploading) return;
    setIsUploading(true);
    try {
      const base64 = await captureRef(gridRef, { format: 'png', quality: 1, result: 'base64' });
      const filename = `pix.png`;
      const { signedUrl, publicUrl } = await api.getPresignedUrl(filename, token);
      await api.uploadToS3(signedUrl, base64);
      await api.createPost({ title: 'Challenge Post', imageUrl: publicUrl }, token);
      alert('Post Success!');
    } catch (error) {
      console.error('Upload process failed:', error);
      alert('Failed to save image. Check console.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>challenge!</Text>
      <View style={styles.controls}>
        <View style={styles.inputGroup}>
          <Text>pick grid size: </Text>
          <TextInput keyboardType="numeric" value={gridSize.toString()} onChangeText={handleGridChange} style={styles.input} />
        </View>
        <View style={styles.colorSwatches}>
          {allowedColors.map((color) => (
            <Pressable
              key={color}
              onPress={() => setSelectedColor(color)}
              style={[
                styles.swatch,
                { backgroundColor: color },
                selectedColor === color && styles.swatchSelected,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.gridAndTools}>
        <View style={styles.toolsContainer}>
          {tools.filter(t => allowedTools.includes(t.name)).map(t => (
            <Pressable key={t.name} style={styles.button} onPress={t.onPress}>
              <IconSymbol name={t.icon} color={'currentColor'} />
            </Pressable>
          ))}
        </View>

        <View
          {...panResponder.panHandlers}
          ref={gridRef}
          collapsable={false}
          onLayout={onGridLayout}
          style={[styles.grid, { width: GRID_CONTAINER_SIZE, height: GRID_CONTAINER_SIZE }]}
        >
          {grid.map((color, i) => (
            <View
              key={i}
              style={{
                width: `${100 / gridSize}%`,
                height: cellSize,
                backgroundColor: color,
                borderWidth: 0.5,
                borderColor: '#eee',
              }}
            />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="clear" onPress={handleClear} color="#000" />
        <View style={{ width: 20 }} />
        {isUploading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Button title="post" onPress={handleSaveAndUpload} color="#000" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#fff',
  },
  toolsContainer: {
    width: 20,
    height: 20,
    color: 'rgb(255, 0, 255)',
  },
  button: {
    padding: 5,
    width: 30,
    height: 30,
    backgroundColor: 'rgb(175, 175, 175)',
  },
  controls: {
    marginBottom: 20,
    width: '80%',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    width: 100,
    borderRadius: 5,
  },
  gridAndTools: {
    flexDirection: 'row',
    marginTop: 70,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
    marginLeft: 40,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  colorSwatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  swatch: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: '#fff',
  },
});
