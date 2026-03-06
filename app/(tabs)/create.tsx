import DefaultColorPanel from '../../components/color_picker';
import React, { useState, useRef } from 'react';
import {StyleSheet, Text, View, TextInput, Dimensions, Button, ActivityIndicator, PanResponder} from 'react-native';
import { captureRef } from "react-native-view-shot";
import { api } from '../../services/api';
import { useAuth } from '@/context/AuthContext';
import Toolbar, { ALL_TOOL_NAMES } from '@/components/toolbar';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';


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
  const activeTool = useRef('draw');
  const [isUploading, setIsUploading] = useState(false);
  const cellSize = GRID_CONTAINER_SIZE/gridSize;

  const gridRef = useRef<View>(null);

  const [prevGrid, setPrevGrid] = useState<string[][]>([Array(DEFAULT_GRID * DEFAULT_GRID).fill(DEFAULT_COLOR)]); // need the brackets!!
  const index = useRef(0);

  const gridLayout = useRef({ x: 0, y: 0 });

  // capture the grid's position on the screen when it mounts
  const onGridLayout = () => {
    // use measure to get the absolute page position
    containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      gridLayout.current = { x: pageX, y: pageY };
    });
  };



  const colorCellAtPosition = (pageX: number, pageY: number) => {

    // const relativeX = pageX - gridLayout.current.x;
    // const relativeY = pageY - gridLayout.current.y;

    const { level, offsetX, offsetY } = zoomState.current;

    const xInContainer = pageX - gridLayout.current.x;
    const yInContainer = pageY - gridLayout.current.y;

    const halfSize = GRID_CONTAINER_SIZE / 2;
    const touchX = (xInContainer - offsetX) / level + halfSize - (halfSize / level);
    const touchY = (yInContainer - offsetY) / level + halfSize - (halfSize / level);

    const col = Math.floor(touchX / cellSize);
    const row = Math.floor(touchY / cellSize);

    if (col >= 0 && col < gridSize && row >= 0 && row < gridSize) {
      const index = row * gridSize + col;

      const drawingColor = activeTool.current === 'erase' ? DEFAULT_COLOR : selectedColor; // if eraser is toggled set selected color to white

      setGrid(prevGrid => {
        const newGrid = [...prevGrid];
        newGrid[index] = drawingColor;
        return newGrid;
      });
    }
  };



  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 1,
    onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 1,

    onPanResponderGrant: (evt) => {
      if (evt.nativeEvent.touches.length === 1) {
        const { pageX, pageY } = evt.nativeEvent;
        colorCellAtPosition(pageX, pageY);
      }
    },

    onPanResponderMove: (evt) => {
      if (evt.nativeEvent.touches.length === 1) {
        const { pageX, pageY } = evt.nativeEvent;
        colorCellAtPosition(pageX, pageY);
      }
    },

    onPanResponderRelease: () => {
      setPrevGrid((prevHistory) => {
        const newGrid = prevHistory.slice(0, index.current + 1); // prevents weird things if someone undos then starts drawing again
        const updatedGrid = [...newGrid, [...grid]] // takes saved states and adds on current grid state at the end
        index.current = updatedGrid.length - 1;
        return updatedGrid;
      })
    }
  });

  const handleGridChange = (text: string) => {
    const newGridSize = parseInt(text) || 0;
    if (newGridSize > 64){
      setGridSize(64);
    }
    else {
      setGridSize(newGridSize);
    }
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

  const handleRedo = () => {
    if (index.current < prevGrid.length - 1) {
      const nextIndex = index.current + 1;
      setGrid(prevGrid[nextIndex]);
      index.current = nextIndex;
    }
  }

  const zoomState = useRef({ level: 1, offsetX: 0, offsetY: 0 })
  const containerRef = useRef<View>(null)

  return (

    <View style={styles.container}>
      <Text style = {{fontSize: 20, marginBottom: 10, marginTop: 20}}>new pix!</Text>
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
        <Toolbar allowedTools={ALL_TOOL_NAMES} onToolChange={t => { activeTool.current = t; }} onUndo={handleUndo} onRedo={handleRedo}/>

          <View style = {styles.zoomable} ref={containerRef} >
          <ReactNativeZoomableView
            maxZoom={4} 
            minZoom={1} 
            initialZoom={1} 
            bindToBorders={true}
            contentWidth={GRID_CONTAINER_SIZE}
            contentHeight={GRID_CONTAINER_SIZE}
            panEnabled={true}
            onTransform={(data) => {
              zoomState.current = {
                level: data.zoomLevel,
                offsetX: data.offsetX,
                offsetY: data.offsetY,
              };
            }}
          >
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
                borderWidth: 0.25,
                borderColor: '#eee'
              }}
            />
          ))}
          </View>
          </ReactNativeZoomableView>
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
    marginTop: 15,
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
    borderColor: '#000',
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
});













// import DefaultColorPanel from '../../components/color_picker';
// import React, { useState, useRef } from 'react';
// import {StyleSheet, Text, View, TextInput, Dimensions, Button, ActivityIndicator, PanResponder} from 'react-native';
// import { captureRef } from "react-native-view-shot";
// import { api } from '../../services/api';
// import { useAuth } from '@/context/AuthContext';
// import Toolbar, { ALL_TOOL_NAMES } from '@/components/toolbar';
// import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';


// const DEFAULT_GRID = 16;
// const DEFAULT_COLOR = "#fff";
// const DEFAULT_SELECTED_COLOR = "#000"

// const SCREEN_WIDTH = Dimensions.get('window').width;
// const GRID_CONTAINER_SIZE = SCREEN_WIDTH - 100;

// // https://www.youtube.com/watch?v=HN7FhKPTohA

// export default function CreatePix() {
//   const { token } = useAuth();
//   const [gridSize, setGridSize] = useState<number>(DEFAULT_GRID);
//   const[grid, setGrid] = useState<string[]>(
//     Array(DEFAULT_GRID * DEFAULT_GRID).fill(DEFAULT_COLOR) // fill w white 
//   )

//   const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_SELECTED_COLOR);
//   const activeTool = useRef('draw');
//   const [isUploading, setIsUploading] = useState(false);
//   const cellSize = GRID_CONTAINER_SIZE/gridSize;

//   const gridRef = useRef<View>(null);

//   const [prevGrid, setPrevGrid] = useState<string[][]>([Array(DEFAULT_GRID * DEFAULT_GRID).fill(DEFAULT_COLOR)]); // need the brackets!!
//   const index = useRef(0);

//   const gridLayout = useRef({ x: 0, y: 0 });

//   // capture the grid's position on the screen when it mounts
//   const onGridLayout = () => {
//     // use measure to get the absolute page position
//     containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
//       gridLayout.current = { x: pageX, y: pageY };
//     });
//   };



//   const colorCellAtPosition = (pageX: number, pageY: number) => {

//     // const relativeX = pageX - gridLayout.current.x;
//     // const relativeY = pageY - gridLayout.current.y;

//     const { level, offsetX, offsetY } = zoomState.current;

//     const xInContainer = pageX - gridLayout.current.x;
//     const yInContainer = pageY - gridLayout.current.y;

//     const halfSize = GRID_CONTAINER_SIZE / 2;
//     const touchX = (xInContainer - offsetX) / level + halfSize - (halfSize / level);
//     const touchY = (yInContainer - offsetY) / level + halfSize - (halfSize / level);

//     const col = Math.floor(touchX / cellSize);
//     const row = Math.floor(touchY / cellSize);

//     if (col >= 0 && col < gridSize && row >= 0 && row < gridSize) {
//       const index = row * gridSize + col;

//       const drawingColor = activeTool.current === 'erase' ? DEFAULT_COLOR : selectedColor; // if eraser is toggled set selected color to white

//       setGrid(prevGrid => {
//         const newGrid = [...prevGrid];
//         newGrid[index] = drawingColor;
//         return newGrid;
//       });
//     }
//   };



//   const panResponder = PanResponder.create({
//     onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 1,
//     onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 1,

//     onPanResponderGrant: (evt) => {
//       if (evt.nativeEvent.touches.length === 1) {
//         const { pageX, pageY } = evt.nativeEvent;
//         colorCellAtPosition(pageX, pageY);
//       }
//     },

//     onPanResponderMove: (evt) => {
//       if (evt.nativeEvent.touches.length > 1) {
//         const { pageX, pageY } = evt.nativeEvent;
//         colorCellAtPosition(pageX, pageY);
//       }
//     },

//     onPanResponderRelease: () => {
//       setPrevGrid((prevHistory) => {
//         const newGrid = prevHistory.slice(0, index.current + 1); // prevents weird things if someone undos then starts drawing again
//         const updatedGrid = [...newGrid, [...grid]] // takes saved states and adds on current grid at the end
//         index.current = updatedGrid.length - 1;
//         return updatedGrid;
//       })
//     }
//   });

//   const handleGridChange = (text: string) => {
//     const newGridSize = parseInt(text) || 0;
//     if (newGridSize > 64){
//       setGridSize(64);
//     }
//     else {
//       setGridSize(newGridSize);
//     }
//     setGrid(Array(newGridSize * newGridSize).fill(DEFAULT_COLOR))
//   }

//   const handleClear = () => {
//     setGrid(Array(gridSize * gridSize).fill(DEFAULT_COLOR))
//   }

//   const handleSaveAndUpload = async () => {
//     if (isUploading) return;
//     setIsUploading(true);

//     try {
//       const base64 = await captureRef(gridRef, {
//         format: "png",
//         quality: 1,
//         result: 'base64',
//       });

//       const filename = `pix.png`;
//       const { signedUrl, publicUrl } = await api.getPresignedUrl(filename, token);
//       await api.uploadToS3(signedUrl, base64);
//       await api.createPost({ title: "Post Title", imageUrl: publicUrl }, token);
//       alert(`Post Success!`);
//     } catch (error) {
//       console.error("Upload process failed:", error);
//       alert("Failed to save image. Check console.");
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const handleUndo = () => {
//     if (index.current > 0) {
//       const prevIndex = index.current - 1;
//       setGrid(prevGrid[prevIndex]);
//       index.current = prevIndex;
//     }
//   }

//   const handleRedo = () => {
//     if (index.current < prevGrid.length - 1) {
//       const nextIndex = index.current + 1;
//       setGrid(prevGrid[nextIndex]);
//       index.current = nextIndex;
//     }
//   }

//   const zoomState = useRef({ level: 1, offsetX: 0, offsetY: 0 })
//   const containerRef = useRef<View>(null)

//   return (

//     <View style={styles.container}>
//       <Text style = {{fontSize: 20, marginBottom: 10, marginTop: 20}}>new pix!</Text>
//       <View style={styles.controls}>
//         <View style={styles.inputGroup}>
//           <Text>pick grid size: </Text>
//           <TextInput keyboardType="numeric" value={gridSize.toString()} onChangeText={handleGridChange} style={styles.input}/>
//         </View>
//         <View style={styles.inputGroup}>
//           <Text>pick color: </Text>
//           <TextInput value={selectedColor} onChangeText={setSelectedColor} style={[styles.input, { borderRightWidth: 10, borderRightColor: selectedColor }]}></TextInput>
//         </View>
//       </View>

       
//       <View style = {styles.gridAndTools}>
//         <Toolbar allowedTools={ALL_TOOL_NAMES} onToolChange={t => { activeTool.current = t; }} onUndo={handleUndo} onRedo={handleRedo}/>

//           <View style = {styles.zoomable} ref={containerRef} >
//           <ReactNativeZoomableView
//             maxZoom={4} 
//             minZoom={1} 
//             initialZoom={1} 
//             bindToBorders={true}
//             contentWidth={GRID_CONTAINER_SIZE}
//             contentHeight={GRID_CONTAINER_SIZE}
//             panEnabled={true}
//             onTransform={(data) => {
//               zoomState.current = {
//                 level: data.zoomLevel,
//                 offsetX: data.offsetX,
//                 offsetY: data.offsetY,
//               };
//             }}
//           >
//           <View {...panResponder.panHandlers} 
//           ref={gridRef}
//           collapsable={false}
//           onLayout={onGridLayout}
//           style={[styles.grid, { width: GRID_CONTAINER_SIZE, height: GRID_CONTAINER_SIZE }]}
//           >
//           {grid.map((color, index) => (
//             <View
//               key={index} 
//               style={{
//                 width: `${100/gridSize}%`,
//                 height: cellSize,
//                 backgroundColor: color,
//                 borderWidth: 0.25,
//                 borderColor: '#eee'
//               }}
//             />
//           ))}
//           </View>
//           </ReactNativeZoomableView>
//           </View>
//       </View>
      
      
      
//       <View style={{ width: '100%' }}>
//           <DefaultColorPanel value={selectedColor} onColorChange={setSelectedColor}/>
//       </View>
      
//       <View style={styles.actions}>
//         <Button title ="clear" onPress={() => handleClear()} color='#000'></Button>
//         <View style={{ width: 20 }} />
//         {isUploading ? (
//           <ActivityIndicator color="#000" />
//         ) : (
//           <Button title ="post" onPress={handleSaveAndUpload} color='#000'></Button>
//         )}
//       </View>
//       </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 50,
//     backgroundColor: '#ececec',
//   },
//   controls: {
//     marginBottom: 20,
//     width: '80%',
//   },
//   inputGroup: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 10,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     padding: 5,
//     width: 100,
//     borderRadius: 5,
//   },
//   gridAndTools: {
//     flexDirection: 'row',
//     marginTop: 15,
//     gap: 30,
//   },
//   zoomable: {
//     overflow: 'hidden',
//     width: GRID_CONTAINER_SIZE,
//     height: GRID_CONTAINER_SIZE,
//   },
//   grid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     borderWidth: 1,
//     borderColor: '#000',
//     overflow: 'hidden',
//   },
//   actions: {
//     flexDirection: 'row',
//     padding: 20,
//     alignItems: 'center',
//   },
// });
