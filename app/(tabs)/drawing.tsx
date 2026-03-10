import DefaultColorPanel from '../../components/color_picker';
import React, { useState, useRef, useEffect } from 'react';
import {StyleSheet, Text, View, TextInput, Dimensions, ActivityIndicator, PanResponder, Pressable, TouchableOpacity, Alert, Modal, Keyboard, TouchableWithoutFeedback } from 'react-native';

import { captureRef } from "react-native-view-shot";
import { api } from '../../services/api';
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

  const gridSize = Number(size)
  
  useEffect(() => {
    setGrid(Array(Number(size) * Number(size)).fill(DEFAULT_COLOR))
    setPrevGrid([Array(Number(size) * Number(size)).fill(DEFAULT_COLOR)])
    index.current = 0
  }, [size])

  const[grid, setGrid] = useState<string[]>(
    Array(Number(size) * Number(size)).fill(DEFAULT_COLOR) // fill w white 
  )

  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_SELECTED_COLOR);
  const activeTool = useRef('draw');
  const [isUploading, setIsUploading] = useState(false);
  const[captionFocused, setCaptionFocused] = useState(false);
  const cellSize = GRID_CONTAINER_SIZE/gridSize;

  const [caption, setCaption] = useState<string>('');

  const gridRef = useRef<View>(null);
  const exportRef = useRef<View>(null);

  const [prevGrid, setPrevGrid] = useState<string[][]>([Array(Number(size) * Number(size)).fill(DEFAULT_COLOR)]); // need the brackets!!
  const index = useRef(0);

  const zoomState = useRef({
    level: 1,
  });


  const getCellIndex = (pageX: number, pageY: number, gridOriginX: number, gridOriginY: number) => {
    // pageX/pageY: where you clicked on screen; gridOriginX/gridOriginY: where the current origin of the grid is
    const { level } = zoomState.current;

    const xInGrid = (pageX - gridOriginX) / level; // 
    const yInGrid = (pageY - gridOriginY) / level;

    const col = Math.floor(xInGrid / cellSize);
    const row = Math.floor(yInGrid / cellSize);

    if (col >= 0 && col < gridSize && row >= 0 && row < gridSize) {
      return row * gridSize + col;
    }
    return null;
  }


  const colorCellAtPosition = (pageX: number, pageY: number, gridOriginX: number, gridOriginY: number) => {
    const cellIndex = getCellIndex(pageX, pageY, gridOriginX, gridOriginY);
    if (cellIndex === null) return;
    
    if (activeTool.current === 'fill') {
      handleFill(cellIndex, grid[cellIndex]);
      return;
    }

    if (activeTool.current === 'dropper'){
      handleDropper(grid[cellIndex]);
      return;
    }

    const drawingColor = activeTool.current === 'erase' ? DEFAULT_COLOR : selectedColor; // if eraser is toggled set selected color to white
    setGrid((currentGrid) => {
      if (currentGrid[cellIndex] === drawingColor) { return currentGrid }
        const newGrid = [...currentGrid];
        newGrid[cellIndex] = drawingColor;
        return newGrid;
    });
  };


  const panResponder = PanResponder.create({
  onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 1,
  onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 1,

  onPanResponderGrant: (evt) => { // runs once you touch screen for the first time
    const { pageX, pageY } = evt.nativeEvent; // capture whatever pageX/pageY is
    gridRef.current?.measure((x, y, width, height, gridOriginX, gridOriginY) => { // gives updated gridOriginX/gridOriginY
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
    if (activeTool.current === 'dropper') return; // don't call setPrevGrid if using dropper 

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

  const handleSaveAndUpload = async (showLikes: boolean) => {
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
      await api.createPost({ content: caption, imageUrl: publicUrl, showLikes }, token);

      handleClear(); // make sure to clear canvas
      setSelectedColor(DEFAULT_SELECTED_COLOR);
      setCaption('');

      // alert(`Post Success!`);
      setShowAlertPosting(true);

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

  const handleFill = (cellIndex: number, cellColor: string) => {
    if (cellColor === selectedColor) return;

    setGrid((currentGrid)=> {
      const newGrid = [...currentGrid];
      const neighborCells = [cellIndex];

      while (neighborCells.length > 0) {
        const currentCell = neighborCells.pop()!;

        if (newGrid[currentCell] !== cellColor) continue; // if fill finds a color that is different (boundary)

        newGrid[currentCell] = selectedColor;

        const row = Math.floor(currentCell / gridSize);
        const col = currentCell % gridSize;

        // make sure neighbors are within bounds
        if (col > 0) {
          neighborCells.push(currentCell - 1); // left neighbor cell
        }
        if (row > 0){
          neighborCells.push(currentCell - gridSize); // up neighbor cell
        } 
        if (row < gridSize - 1){
          neighborCells.push(currentCell + gridSize); // down neighbor cell
        }
        if (col < gridSize - 1){
          neighborCells.push(currentCell + 1); // right neighbor cell
        } 
      }
      return newGrid;
    });

  }

  const handleDropper = (cellColor: string) => {
   if (cellColor !== selectedColor){
      setSelectedColor(cellColor);
    }
  }

  const [showAlertClear, setShowAlertClear] = useState(false);
  const [showAlertCaption, setShowAlertCaption] = useState(false);
  const [showAlertPosting, setShowAlertPosting] = useState(false);
  const [showAlertLike, setShowAlertLike] = useState(false);

  const clearAlert = () => {
    // Alert.alert(
    //   "alert!",
    //   "are you sure you want to clear the canvas?",
    //   [
    //     { text: "cancel" },
    //     { text: "clear",
    //       onPress: handleClear
    //     }
    //   ],
    //   { cancelable: false }
    // )
    setShowAlertClear(true)
    return;
  }

  const captionAlert = () => {
    if (caption.trim().length === 0) {
    //   Alert.alert(
    //   "alert!",
    //   "please add a caption!",
    //   [],
    //   { cancelable: true }
    // )
      setShowAlertCaption(true)
      return;
    }
    else {
      // Alert.alert(
      //   'show number of likes on this post?',
      //   'the number of likes will only be visible to you if toggled on',
      //   [
      //     { text: 'yes!', onPress: () => handleSaveAndUpload(true) },
      //     { text: 'no!', onPress: () => handleSaveAndUpload(false) },
      //     { text: 'cancel', style: 'cancel' },
      //   ],
      //   { cancelable: true }
      // )
      setShowAlertLike(true)
      return;
    }
  }


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.replace('/create')}>
        <IconSymbol name="undo" size={24} color="#ffffff" />
      </Pressable>

      <View ref={exportRef} collapsable={false} style={[styles.exportGrid, { width: GRID_CONTAINER_SIZE, height: GRID_CONTAINER_SIZE }]}>
        {grid.map((color, index) => (
          //<View key={index} style={{ width: `${100/gridSize}%`, height: cellSize, backgroundColor: color }} />
          <GridCell key={index} color={color} gridSize={gridSize} cellSize={cellSize} noBorder={true}/>
        ))}
      </View>
       
      <View style = {styles.gridAndTools}>
        <View style = {{marginTop: 60}}>
          <Toolbar allowedTools={ALL_TOOL_NAMES} onToolChange={t => { activeTool.current = t; }} onUndo={handleUndo} onRedo={handleRedo}/>

        </View>
        
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
      <TextInput value={caption} onFocus={() => setCaptionFocused(true)} onBlur = {() => setCaptionFocused(false)} onChangeText={setCaption} style = {[captionFocused ? styles.focusedCaption : styles.caption, BORDER_FRAME, {fontFamily:'ms'}]} multiline placeholder='enter caption!' placeholderTextColor='rgba(81, 116, 207, 0.5)' autoCapitalize='none'/>
      
      <View style={styles.actions}>
        <TouchableOpacity onPress={clearAlert} style={[styles.clearButton, {borderWidth: 0.25, borderColor: '#000', paddingVertical: 5, paddingHorizontal: 10}, BORDER_FRAME]}>
            <Text style={{fontFamily:'ms'}} >clear</Text>
        </TouchableOpacity>
        {isUploading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <TouchableOpacity onPress={captionAlert} style={[styles.postButton, {borderWidth: 0.25, borderColor: '#000', paddingVertical: 5, paddingHorizontal: 10}, BORDER_FRAME]}>
            <Text style={{fontFamily:'ms'}} >post</Text>
          </TouchableOpacity>
        )}
      </View>

        <Modal
          visible={showAlertCaption}
          transparent={true}
          animationType='fade'
          onRequestClose={() => setShowAlertCaption(false)}
        >
          <View style={[styles.alertOverlay]}>
            <Pressable style={styles.backdrop} onPress={() => setShowAlertCaption(false)} />
              <View style={[BORDER_FRAME, styles.alertBox]}>
                <View style={[styles.captionTitle]}>
                  <Text style={{fontFamily: 'ms', fontSize: 20}}>no caption!</Text>
                </View>
                <View style={[styles.captionBody]}>
                  <Text style={{fontFamily: 'ms'}}>please add a caption before posting!</Text>
                </View>
                <TouchableOpacity style={[BORDER_FRAME, styles.alertButton]} onPress={() => setShowAlertCaption(false)}>
                  <Text style={{fontFamily: 'ms'}} >ok</Text>
                </TouchableOpacity>
              </View>
          </View>
        </Modal>

        <Modal
          visible={showAlertLike}
          transparent={true}
          animationType='fade'
          onRequestClose={() => setShowAlertLike(false)}
        >
          <View style={[styles.alertOverlay]}>
            <Pressable style={styles.backdrop} onPress={() => setShowAlertLike(false)} />
              <View style={[BORDER_FRAME, styles.alertBox]}>
                <View style={[styles.captionTitle]}>
                  <Text style={{fontFamily: 'ms', fontSize: 20}}>show number of likes on this post?</Text>
                </View>
                <View style={[styles.captionBody]}>
                  <Text style={{fontFamily: 'ms'}}>the number of likes will only be visible to you if toggled on.</Text>
                </View>
                <View style={styles.alertButtons}>
                  <TouchableOpacity style={[BORDER_FRAME, styles.alertButton]} onPress={() => {setShowAlertLike(false); handleSaveAndUpload(true);}}>
                    <Text style={{fontFamily: 'ms'}} >yes!</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[BORDER_FRAME, styles.alertButton]} onPress={() => {setShowAlertLike(false); handleSaveAndUpload(false);}}>
                    <Text style={{fontFamily: 'ms'}} >no!</Text>
                  </TouchableOpacity>
                </View>
                
              </View> 
          </View>
        </Modal>

        <Modal
          visible={showAlertPosting}
          transparent={true}
          animationType='fade'
          onRequestClose={() => setShowAlertPosting(false)}
        >
          <View style={[styles.alertOverlay]}>
            <Pressable style={styles.backdrop} onPress={() => setShowAlertPosting(false)} />
              <View style={[BORDER_FRAME, styles.alertBox]}>
                <View style={[styles.captionTitle]}>
                  <Text style={{fontFamily: 'ms', fontSize: 20}}>post success!</Text>
                </View>
                <View style={styles.goHome}>
                  <View>
                    <Text style={{fontFamily: 'ms'}}>go home and view?</Text>
                  </View>
                    <TouchableOpacity style={[BORDER_FRAME, styles.homeButton]} onPress={() => 
                      {setShowAlertPosting(false);
                        router.push({pathname: '/(tabs)'});
                      }
                      }>
                      <IconSymbol name={'home'} color={'currentColor'} />
                    </TouchableOpacity>   
                </View>
              </View>
          </View>
        </Modal>

        <Modal
          visible={showAlertClear}
          transparent={true}
          animationType='fade'
          onRequestClose={() => setShowAlertClear(false)}
        >
          <View style={[styles.alertOverlay]}>
            <Pressable style={styles.backdrop} onPress={() => setShowAlertClear(false)} />
              <View style={[BORDER_FRAME, styles.alertBox]}>
                <View style={[styles.captionTitle]}>
                  <Text style={{fontFamily: 'ms', fontSize: 20}}>warning!</Text>
                </View>
                <View style={[styles.captionBody]}>
                  <Text style={{fontFamily: 'ms'}}>are you sure you want to clear?? think carefully!</Text>
                </View>
                <View style={styles.alertButtons}>
                  <TouchableOpacity style={[BORDER_FRAME, styles.alertButton]} onPress={() => {setShowAlertClear(false); handleClear()}}>
                    <Text style={{fontFamily: 'ms'}} >yes!</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[BORDER_FRAME, styles.alertButton]} onPress={() => setShowAlertClear(false)}>
                    <Text style={{fontFamily: 'ms'}} >no!</Text>
                  </TouchableOpacity>
                </View>
                
              </View> 
          </View>
        </Modal>

      </View>
    </TouchableWithoutFeedback>
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
    borderWidth: 0.25, 
    paddingTop: 10,
    paddingBottom: 100, 
    paddingHorizontal: 15,
    width: '85%',
    height: '20%',
    borderRadius: 5,
    color: '#141415',
    backgroundColor: 'white',
  },
  focusedCaption: {
    position: 'fixed',
    top: -475,
    fontSize: 15,
    borderWidth: 0.25, 
    paddingTop: 10,
    paddingBottom: 100, 
    paddingHorizontal: 15,
    width: '100%',
    height: '25%',
    backgroundColor: 'white',
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
    display: 'flex',
    flexDirection: 'row',
    padding: 20,
    width: '95%',
    gap: 20,
    justifyContent: 'flex-end',
  },
  clearButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
  },
  postButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'white',
  },
  backButton: {
    marginTop: 10,
    marginLeft: 15,
    alignSelf: 'flex-start',
  },
  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'  
  },
  alertBox: {
    width: '80%',
    padding: 10,
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: '#ececec',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  captionTitle: {
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  captionBody: {
    margin: 5,
    marginBottom: 15,
    alignSelf: 'flex-start'
  },
  alertButton: {
    padding: 2,
    backgroundColor: 'white',
    paddingHorizontal: 5,
    alignSelf: 'flex-end',
  },
  alertButtons: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    gap: 15,
  },
  homeButton: {
    padding: 5,
    backgroundColor: 'white',
  },
  goHome: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginBottom: 10,
  }
});

