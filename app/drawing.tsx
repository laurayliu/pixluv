import DefaultColorPanel from '../components/color_picker';
import React, { useState, useRef, useEffect } from 'react';
import {StyleSheet, Text, View, TextInput, Dimensions, Button, ActivityIndicator, PanResponder, Pressable, TouchableOpacity } from 'react-native';
import { captureRef } from "react-native-view-shot";
import { api } from '../services/api';
import { useAuth } from '@/context/AuthContext';
import Toolbar, { ALL_TOOL_NAMES } from '@/components/toolbar';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { useLocalSearchParams , useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';


const DEFAULT_COLOR = "#fff";
const DEFAULT_SELECTED_COLOR = "#ff0000"

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_CONTAINER_SIZE = SCREEN_WIDTH - 100;

// https://www.youtube.com/watch?v=HN7FhKPTohA

const GridCell = React.memo(({ color, gridSize, cellSize, noBorder }: { 
  color: string, 
  gridSize: number,
  cellSize: number,
  noBorder?: boolean
}) => (
  <View style={{
    width: `${100 / gridSize}%`,
    height: cellSize,
    backgroundColor: color,
    borderWidth: noBorder ? 0 : 0.25,
    borderColor: noBorder ? 'transparent' : '#eee'
  }} />
));
GridCell.displayName = 'GridCell';

const BORDER_FRAME = {
  borderRadius: 0,
  borderTopColor: '#c4c4c4',
  borderLeftColor: '#c4c4c4',
  borderBottomColor: '#ffffff',
  borderRightColor: '#ffffff',
  borderTopWidth: 3,
  borderLeftWidth: 3,
  borderBottomWidth: 3,
  borderRightWidth: 3,
  overflow: 'hidden',
} as const;


export default function CreatePix() {
  const { token } = useAuth();

  const router = useRouter()
  const params = useLocalSearchParams();
  const { size } = params;

  const [gridSize, setGridSize] = useState<number>(Number(size));
  
  useEffect(() => {
    setGridSize(Number(size))
    setGrid(Array(Number(size) * Number(size)).fill(DEFAULT_COLOR))
  }, [size])

  const[grid, setGrid] = useState<string[]>(
    Array(Number(size) * Number(size)).fill(DEFAULT_COLOR) // fill w white 
  )

  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_SELECTED_COLOR);
  const activeTool = useRef('draw');
  const [isUploading, setIsUploading] = useState(false);
  const cellSize = GRID_CONTAINER_SIZE/gridSize;

  //const [title, setTitle] = useState<string>('');
  const [caption, setCaption] = useState<string>('');

  const gridRef = useRef<View>(null);
  const exportRef = useRef<View>(null);

  const [prevGrid, setPrevGrid] = useState<string[][]>([Array(Number(size) * Number(size)).fill(DEFAULT_COLOR)]); // need the brackets!!
  const index = useRef(0);

  const zoomState = useRef({
    level: 1,
  });

  const colorCellAtPosition = (pageX: number, pageY: number, gridOriginX: number, gridOriginY: number) => {
    // pageX/pageY: where you clicked on screen; gridOriginX/gridOriginY: where the current origin of the grid is
    const { level } = zoomState.current;

    const xInGrid = (pageX - gridOriginX) / level; // 
    const yInGrid = (pageY - gridOriginY) / level;

    const col = Math.floor(xInGrid / cellSize);
    const row = Math.floor(yInGrid / cellSize);

    if (col >= 0 && col < gridSize && row >= 0 && row < gridSize) {
      const cellIndex = row * gridSize + col;
      const drawingColor = activeTool.current === 'erase' ? DEFAULT_COLOR : selectedColor; // if eraser is toggled set selected color to white
      setGrid((prevGrid=> {
        if (prevGrid[cellIndex] === drawingColor) { return prevGrid }
        const newGrid = [...prevGrid];
        newGrid[cellIndex] = drawingColor;
        return newGrid;
      }));
    }
  };

  const panResponder = PanResponder.create({
  onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 1,
  onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 1,

  onPanResponderGrant: (evt) => { // runs once you touch screen for the first time
    const { pageX, pageY } = evt.nativeEvent; // capture whatever pageX/pageY is
    gridRef.current?.measure((x, y, width, height, gridOriginX, gridOriginY) => { // gives updated gridOriginX/gridOriginyY
      colorCellAtPosition(pageX, pageY, gridOriginX, gridOriginY); // callback with updated values 
    });
  },

  onPanResponderMove: (evt) => {
    const { pageX, pageY } = evt.nativeEvent;
    gridRef.current?.measure((x, y, width, height, gridOriginX, gridOriginY) => {
      colorCellAtPosition(pageX, pageY, gridOriginX, gridOriginY);
    });
  },

  onPanResponderRelease: (evt) => {
    if (evt.nativeEvent.touches.length > 0) return; 
    setPrevGrid((prevHistory) => {
      const newGrid = prevHistory.slice(0, index.current + 1); // prevents weird things if someone undos then starts drawing again
      const updatedGrid = [...newGrid, [...grid]];  // takes saved states and adds on current grid at the end
      index.current = updatedGrid.length - 1;
      return updatedGrid;
    });
  }
});

  const handleClear = () => {
    setGrid(Array(gridSize * gridSize).fill(DEFAULT_COLOR))
    setPrevGrid([Array(gridSize * gridSize).fill(DEFAULT_COLOR)])
    index.current = 0;
  }

  const handleSaveAndUpload = async () => {
    if (isUploading) return;
    setIsUploading(true);

    try {
      const base64 = await captureRef(exportRef, {
        format: "png",
        quality: 1,
        result: 'base64',
      });

      const filename = `pix.png`;
      const { signedUrl, publicUrl } = await api.getPresignedUrl(filename, token);
      await api.uploadToS3(signedUrl, base64);
      await api.createPost({ content: caption, imageUrl: publicUrl }, token);
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

  const handleRedo = () => {
    if (index.current < prevGrid.length - 1) {
      const nextIndex = index.current + 1;
      setGrid(prevGrid[nextIndex]);
      index.current = nextIndex;
    }
  }


  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <IconSymbol name="undo" size={24} color="#ffffff" />
      </Pressable>

      <View ref={exportRef} collapsable={false} style={[styles.exportGrid, { width: GRID_CONTAINER_SIZE, height: GRID_CONTAINER_SIZE }]}>
        {grid.map((color, index) => (
          //<View key={index} style={{ width: `${100/gridSize}%`, height: cellSize, backgroundColor: color }} />
          <GridCell key={index} color={color} gridSize={gridSize} cellSize={cellSize} noBorder={true}/>
        ))}
      </View>

      {/* <TextInput value={title} onChangeText={setTitle} style = {styles.title} placeholder='enter title' placeholderTextColor='rgba(81, 116, 207, 0.5)' autoCapitalize='none'/> */}
       
      <View style = {styles.gridAndTools}>
        <Toolbar allowedTools={ALL_TOOL_NAMES} onToolChange={t => { activeTool.current = t; }} onUndo={handleUndo} onRedo={handleRedo}/>

          <View style = {styles.zoomable}>
          <ReactNativeZoomableView
            maxZoom={4} 
            minZoom={1} 
            initialZoom={1} 
            bindToBorders={true}
            contentWidth={GRID_CONTAINER_SIZE}
            contentHeight={GRID_CONTAINER_SIZE}
            panEnabled={true}
            onTransform={(data: any) => {
            zoomState.current = {
              level: data.zoomLevel,
            };
            }}>
          <View {...panResponder.panHandlers} 
          ref={gridRef}
          collapsable={false}
          style={[BORDER_FRAME, styles.grid, { width: GRID_CONTAINER_SIZE, height: GRID_CONTAINER_SIZE }]}
          >
          {grid.map((color, index) => (
            <GridCell key={index} color={color} gridSize={gridSize} cellSize={cellSize} noBorder={false}/>
          ))}
          </View>
          </ReactNativeZoomableView>
          </View>
      </View>
      
      

      <View style={{ width: '100%' }}>
          <DefaultColorPanel value={selectedColor} onColorChange={setSelectedColor}/>
      </View>
      <TextInput value={caption} onChangeText={setCaption} style = {styles.caption} multiline placeholder='enter caption' placeholderTextColor='rgba(81, 116, 207, 0.5)' autoCapitalize='none'/>
      
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleClear()} style={{borderWidth: 0.25, borderColor: '#000', paddingVertical: 5, paddingHorizontal: 10}}>
            <Text>clear</Text>
        </TouchableOpacity>
        <View style={{ width: 20 }} />
        {isUploading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <TouchableOpacity onPress={handleSaveAndUpload} style={{borderWidth: 0.25, borderColor: '#000', paddingVertical: 5, paddingHorizontal: 10}}>
            <Text>post</Text>
          </TouchableOpacity>
        )}
      </View>
      </View>
  );
};

const styles = StyleSheet.create({
  exportGrid: {
    position: 'absolute',
    left: -99999,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#ececec',
  },
  caption: {
    fontSize: 15, 
    marginBottom: 10, 
    marginTop: 20, 
    borderWidth: 0.25, 
    paddingTop: 10,
    paddingBottom: 100, 
    paddingHorizontal: 15,
    width: 300,
    borderRadius: 5,
    color: '#5174cf'
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '80%',
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
    marginTop: 40,
    gap: 30,
  },
  zoomable: {
    overflow: 'hidden',
    width: GRID_CONTAINER_SIZE,
    height: GRID_CONTAINER_SIZE,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#5174cf',
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginRight: 32,
  },
  backButton: {
    marginTop: 10,
    marginLeft: 15,
    alignSelf: 'flex-start',
  }
});

