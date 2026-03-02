import DefaultColorPanel from '../../components/color_picker';
import React, { useState, useRef } from 'react';
import {StyleSheet, Text, View, TextInput, TouchableOpacity, Dimensions, ScrollView, Button, ActivityIndicator, Pressable} from 'react-native';
import { withDecay } from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';import { captureRef } from "react-native-view-shot";
import { api } from '../../services/api';

const DEFAULT_GRID = 16;
const DEFAULT_COLOR = "#fff";
const DEFAULT_SELECTED_COLOR = "#000"

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_CONTAINER_SIZE = SCREEN_WIDTH - 40;

// https://www.youtube.com/watch?v=HN7FhKPTohA

export default function CreatePix() {
  const [gridSize, setGridSize] = useState<number>(DEFAULT_GRID);
  const[grid, setGrid] = useState<string[]>(
    Array(DEFAULT_GRID * DEFAULT_GRID).fill(DEFAULT_COLOR) // fill w white 
  )

  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_SELECTED_COLOR);
  const [isUploading, setIsUploading] = useState(false);
  const cellSize = GRID_CONTAINER_SIZE/gridSize;

  const gridRef = useRef<View>(null);

  const handleCellPress = (index: number) => {
    const newGrid = [...grid];
    newGrid[index] = selectedColor;
    setGrid(newGrid);
  }

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
      const uri = await captureRef(gridRef, {
        format: "png",
        quality: 1,
      });

      const filename = `pix.png`;
      const { signedUrl, publicUrl } = await api.getPresignedUrl(filename);
      await api.uploadToS3(signedUrl, uri);

      alert(`Success! Your pix is live at: ${publicUrl}`);
    } catch (error) {
      console.error("Upload process failed:", error);
      alert("Failed to save image. Check console.");
    } finally {
      setIsUploading(false);
    }
  };

  return (

    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.container}>
      <Text>Post</Text>

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

        <Pressable style={styles.button}> 
          <IconSymbol name="erase" color={"currentColor"} />        
        </Pressable>

        <Pressable style={styles.button}> 
          <IconSymbol name="draw" color={"currentColor"} />        
        </Pressable>

        <Pressable style={styles.button}> 
          <IconSymbol name="undo" color={"currentColor"} />        
        </Pressable>

        <Pressable style={styles.button}> 
          <IconSymbol name="redo" color={"currentColor"} />        
        </Pressable>
      </View>
    </View>

      <Text>new pix!</Text>
      <View style={styles.controls}>
        <View style={styles.inputGroup}>
          <Text>pick grid size: </Text>
          <TextInput keyboardType="numeric" value={gridSize.toString()} onChangeText={handleGridChange} style={styles.input}/>
        </View>
        <View style={styles.inputGroup}>
          <Text>pick color: </Text>
          <TextInput value={selectedColor} onChangeText={setSelectedColor} style={[styles.input, { borderRightWidth: 10, borderRightColor: selectedColor }]}></TextInput>
          <DefaultColorPanel value={selectedColor} onColorChange={setSelectedColor}/>
        </View>
      </View>
      <View 
        ref={gridRef}
        collapsable={false}
        style={[styles.grid, { width: GRID_CONTAINER_SIZE, height: GRID_CONTAINER_SIZE }]}
      >
        {grid.map((color, index) => (
          <TouchableOpacity
            key={index} 
            onPress={() => handleCellPress(index)}
            activeOpacity={0.7}
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: color,
              borderWidth: 0.5,
              borderColor: '#eee'
            }}
          />
        ))}
      </View>
      <View style={styles.actions}>
        <Button title ="clear" onPress={() => handleClear()} color='#000'></Button>
        <View style={{ width: 20 }} />
        {isUploading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Button title ="save" onPress={handleSaveAndUpload} color='#000'></Button>
        )}
      </View>
      </ScrollView>
  );
};

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
    color: 'rgb(255, 0, 255)'
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
});
