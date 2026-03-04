import DefaultColorPanel from '../../components/color_picker';
import React, { useState, useRef } from 'react';
import {StyleSheet, Text, View, TextInput, Dimensions, ScrollView, Button, ActivityIndicator, Pressable, PanResponder} from 'react-native';
import { withDecay } from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';import { captureRef } from "react-native-view-shot";
import { api } from '../../services/api';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_GRID = 16;
const DEFAULT_COLOR = "#fff";
const DEFAULT_SELECTED_COLOR = "#000"

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_CONTAINER_SIZE = SCREEN_WIDTH - 100;

// https://www.youtube.com/watch?v=HN7FhKPTohA

export default function CreatePix() {
  const { token } = useAuth();
  const [gridSize, setGridSize] = useState<number>(DEFAULT_GRID);
  const[grid, setGrid] = useState<string[]>(
    Array(DEFAULT_GRID * DEFAULT_GRID).fill(DEFAULT_COLOR) // fill w white 
  )

  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_SELECTED_COLOR);
  const [activeButton, setActiveButton] = useState<'draw' | 'erase'>('draw');
  const [isUploading, setIsUploading] = useState(false);
  const cellSize = GRID_CONTAINER_SIZE/gridSize;

  const gridRef = useRef<View>(null);

  const [prevGrid, setPrevGrid] = useState<string[][]>([Array(DEFAULT_GRID * DEFAULT_GRID).fill(DEFAULT_COLOR)]); // need the brackets!!
  const index = useRef(0);

  const gridLayout = useRef({ x: 0, y: 0 });

  // capture the grid's position on the screen when it mounts
  const onGridLayout = () => {
    // use measure to get the absolute page position
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
      const index = row * gridSize + col;

      const drawingColor = activeButton === 'erase' ? DEFAULT_COLOR : selectedColor; // if eraser is toggled set selected color to white

      setGrid(prevGrid => {
        const newGrid = [...prevGrid];
        newGrid[index] = drawingColor;
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
        const newGrid = prevHistory.slice(0, index.current + 1); // prevents weird things if someone undos then starts drawing again
        const updatedGrid = [...newGrid, [...grid]] // takes saved states and adds on current grid at the end
        index.current = updatedGrid.length - 1;
        return updatedGrid;
      })
    }
  });

  const handleGridChange = (text: string) => {
    const newGridSize = parseInt(text) || 0;
    setGridSize(newGridSize);
    setGrid(Array(newGridSize * newGridSize).fill(DEFAULT_COLOR))
  }

  const handleClear = () => {
    setGrid(Array(gridSize * gridSize).fill(DEFAULT_COLOR))
  }

  const handleSaveAndUpload = async () => {
    if (isUploading) return;
    setIsUploading(true);

    try {
      const base64 = await captureRef(gridRef, {
        format: "png",
        quality: 1,
        result: 'base64',
      });

      const filename = `pix.png`;
      const { signedUrl, publicUrl } = await api.getPresignedUrl(filename, token);
      await api.uploadToS3(signedUrl, base64);
      await api.createPost({ title: "Post Title", imageUrl: publicUrl }, token);
      alert(`Post Success!`);
    } catch (error) {
      console.error("Upload process failed:", error);
      alert("Failed to save image. Check console.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUndo = () => {
    if (index.current > 0) {
      const prevIndex = index.current - 1;
      setGrid(prevGrid[prevIndex]);
      index.current = prevIndex;
    }
  }

  return (

    <View style={styles.container}>

      <Text style = {{fontSize: 20, marginBottom: 10}}>new pix!</Text>
      <View style={styles.controls}>
        <View style={styles.inputGroup}>
          <Text>pick grid size: </Text>
          <TextInput keyboardType="numeric" value={gridSize.toString()} onChangeText={handleGridChange} style={styles.input}/>
        </View>
        <View style={styles.inputGroup}>
          <Text>pick color: </Text>
          <TextInput value={selectedColor} onChangeText={setSelectedColor} style={[styles.input, { borderRightWidth: 10, borderRightColor: selectedColor }]}></TextInput>
        </View>
      </View>

      <View style = {styles.gridAndTools}>
        <View style= {styles.toolsContainer}>
          <Pressable style={styles.button}> 
            <IconSymbol name="lasso" color={"currentColor"} />        
          </Pressable>

          <Pressable style={styles.button}> 
            <IconSymbol name="line" color={"currentColor"} />        
          </Pressable>

          <Pressable style={styles.button}> 
            <IconSymbol name="square" color={"currentColor"} />        
          </Pressable>

          <Pressable style={styles.button}> 
            <IconSymbol name="circle" color={"currentColor"} />        
          </Pressable>

          <Pressable style={styles.button}> 
            <IconSymbol name="fill" color={"currentColor"} />        
          </Pressable>

          <Pressable style={styles.button}> 
            <IconSymbol name="dropper" color={"currentColor"} />        
          </Pressable>

          <Pressable style={activeButton === 'erase' ? styles.buttonEnabled : styles.buttonDisabled} onPress={() => setActiveButton('erase')}> 
            <IconSymbol name="erase" color={"currentColor"} />        
          </Pressable>

          <Pressable style={activeButton === 'draw' ? styles.buttonEnabled : styles.buttonDisabled} onPress={() => setActiveButton('draw')}> 
            <IconSymbol name="draw" color={"currentColor"} />        
          </Pressable>

          <Pressable style={styles.button} onPress={() => handleUndo()}> 
            <IconSymbol name="undo" color={"currentColor"} />        
          </Pressable>

          <Pressable style={styles.button}> 
            <IconSymbol name="redo" color={"currentColor"} />        
          </Pressable>
        </View>

        <View {...panResponder.panHandlers} 
        ref={gridRef}
        collapsable={false}
        onLayout={onGridLayout}
        style={[styles.grid, { width: GRID_CONTAINER_SIZE, height: GRID_CONTAINER_SIZE }]}
        >
        {grid.map((color, index) => (
          <View
            key={index} 
            style={{
              width: `${100/gridSize}%`,
              height: cellSize,
              backgroundColor: color,
              borderWidth: 0.5,
              borderColor: '#eee'
            }}
          />
        ))}
        </View>
      </View>
      
      <View style={{ width: '100%' }}>
          <DefaultColorPanel value={selectedColor} onColorChange={setSelectedColor}/>
      </View>
      
      <View style={styles.actions}>
        <Button title ="clear" onPress={() => handleClear()} color='#000'></Button>
        <View style={{ width: 20 }} />
        {isUploading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Button title ="post" onPress={handleSaveAndUpload} color='#000'></Button>
        )}
      </View>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#ececec',
  },
  toolsContainer: {
    width: 20,
    height: 20,
    color: 'rgb(255, 0, 255)',
  },
  image: {
    height: 20,
    width: 20,
  },
  button: {
    padding: 5,
    width: 30,
    height: 30,
    backgroundColor: 'rgb(175, 175, 175)'
  },
  buttonEnabled: {
    padding: 5,
    width: 30,
    height: 30,
    backgroundColor: 'rgb(128, 128, 128)'
  },
  buttonDisabled: {
    padding: 5,
    width: 30,
    height: 30,
    backgroundColor: 'rgb(175, 175, 175)'
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
    marginTop: 15
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
});
