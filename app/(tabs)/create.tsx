import React, { useState } from 'react';
import {StyleSheet, Text, View, TextInput, TouchableOpacity, Dimensions, ScrollView, Button } from 'react-native';

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
  const cellSize = GRID_CONTAINER_SIZE/gridSize;

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

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <Text>new pix!</Text>
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

      <View style={[styles.grid, { width: GRID_CONTAINER_SIZE, height: GRID_CONTAINER_SIZE }]}>
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
      <View style={styles.clear}>
        <Button title ="clear" onPress={() => handleClear()} color='#000'></Button>
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
  clear: {
    padding: 20,
  },
});