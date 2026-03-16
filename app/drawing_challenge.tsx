import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Dimensions, ActivityIndicator, Pressable, PanResponder, Image, TouchableOpacity, ScrollView, Alert, Keyboard, TouchableWithoutFeedback, Modal } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { api } from '../services/api';
import { useAuth } from '@/context/AuthContext';
import Toolbar, { ALL_TOOL_NAMES, ToolName } from '@/components/toolbar';
import { useRouter } from 'expo-router';
import BackIcon from '../assets/icons/editor/undo.svg';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import PaletteImg from '../assets/icons/palette_img.svg';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { unlockSticker } from '@/utils/unlockSticker';

const GRID_SIZE = 32;
const DEFAULT_COLOR = '#fff';
const DEFAULT_SELECTED_COLOR = '#000';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_CONTAINER_SIZE = SCREEN_WIDTH - 100;


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

export default function Challenge() {
  const router = useRouter();
  const { token, user, updateUser } = useAuth();
  const [submissions, setSubmissions] = useState<{ id: string; imageUrl: string; author: { username: string } }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [allowedColors, setAllowedColors] = useState<string[]>([]);
  const [allowedTools, setAllowedTools] = useState<ToolName[]>(ALL_TOOL_NAMES);

  const [grid, setGrid] = useState<string[]>(
    Array(GRID_SIZE * GRID_SIZE).fill(DEFAULT_COLOR)
  );
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_SELECTED_COLOR);
  const [isUploading, setIsUploading] = useState(false);
  const[captionFocused, setCaptionFocused] = useState(false);
  const cellSize = GRID_CONTAINER_SIZE / GRID_SIZE;

  const activeTool = useRef('draw');
  const [caption, setCaption] = useState<string>('');

  const gridRef = useRef<View>(null);
  const exportRef = useRef<View>(null);

  const [prevGrid, setPrevGrid] = useState<string[][]>([Array(GRID_SIZE * GRID_SIZE).fill(DEFAULT_COLOR)]);
  const [prevColor, setPrevColor] = useState<string>('rgb(217, 216, 216)')

  const index = useRef(0);

  const zoomState = useRef({
      level: 1,
  });

  const isPinching = useRef(false);
  const storePosition = useRef<{pageX: number, pageY: number} | null>(null);

  const drawnCells = useRef<boolean[]>(Array(GRID_SIZE * GRID_SIZE).fill(false));
  const recentColor = useRef<string>('rgb(217, 216, 216)');

  const [showAlertClear, setShowAlertClear] = useState(false);
  const [showAlertCaption, setShowAlertCaption] = useState(false);
  const [showAlertPosting, setShowAlertPosting] = useState(false);
  const [showAlertLike, setShowAlertLike] = useState(false);


  useEffect(() => {
    api.getTodayChallenge()
      .then((c: any) => {
        if (c.allowedColors?.length) setAllowedColors(c.allowedColors);
        if (c.allowedTools?.length) setAllowedTools(c.allowedTools as ToolName[]);
      })
      .catch(() => {});

    api.getTodayChallengePosts(token)
      .then(({ posts, hasSubmitted }: any) => {
        setSubmissions(posts);
        setSubmitted(hasSubmitted);
      })
      .catch(() => {});
  }, []);

   const getCellIndex = (pageX: number, pageY: number, gridOriginX: number, gridOriginY: number) => {
    // pageX/pageY: where you clicked on screen; gridOriginX/gridOriginY: where the current origin of the grid is
    const { level } = zoomState.current;

    const xInGrid = (pageX - gridOriginX) / level; // 
    const yInGrid = (pageY - gridOriginY) / level;

    const col = Math.floor(xInGrid / cellSize);
    const row = Math.floor(yInGrid / cellSize);

    if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
      return row * GRID_SIZE + col;
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
      if (recentColor.current !== selectedColor) {
          setPrevColor(recentColor.current);
      }
      const newGrid = [...currentGrid];
      newGrid[cellIndex] = drawingColor;
      drawnCells.current[cellIndex] = activeTool.current !== 'erase';
      return newGrid;
    });
  };

   const panResponder = PanResponder.create({
     onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 1,
     onMoveShouldSetPanResponder: (evt) => {
       if (evt.nativeEvent.touches.length > 1) { // user pinched to zoom; stored position not needed
         isPinching.current = true; 
         storePosition.current = null;
         return false; 
       }
       return true; 
     },
     onPanResponderGrant: (evt) => { // runs once you touch screen for the first time
       if (evt.nativeEvent.touches.length > 1) return; 
       isPinching.current = false;
       storePosition.current = { pageX: evt.nativeEvent.pageX, pageY: evt.nativeEvent.pageY }; // store the position you clicked at
     },
   
     onPanResponderMove: (evt) => {
       if (evt.nativeEvent.touches.length > 1) {
         return;
       }
       if (!isPinching.current) {
         const { pageX, pageY } = evt.nativeEvent;
         if (storePosition.current) { // color the cell at stored position
           const { pageX: grantX, pageY: grantY } = storePosition.current;
           storePosition.current = null;
           gridRef.current?.measure((x, y, width, height, gridOriginX, gridOriginY) => {
             colorCellAtPosition(grantX, grantY, gridOriginX, gridOriginY);
           });
         }
         gridRef.current?.measure((x, y, width, height, gridOriginX, gridOriginY) => { // color cell where your finger moved
           colorCellAtPosition(pageX, pageY, gridOriginX, gridOriginY);
         });
       }
     },
   
      onPanResponderRelease: (evt) => {
       if (isPinching.current) {
         isPinching.current = false; // zoom is done
         storePosition.current = null;
         return;
       }
   
       if (storePosition.current) {
         const { pageX, pageY } = storePosition.current;
         storePosition.current = null;
         
         gridRef.current?.measure((x, y, width, height, gridOriginX, gridOriginY) => {
           colorCellAtPosition(pageX, pageY, gridOriginX, gridOriginY);
   
           if (activeTool.current !== 'dropper') {
              setPrevGrid((prevHistory) => {
               const newGrid = prevHistory.slice(0, index.current + 1); // prevents weird things if someone undos then starts drawing again
               const updatedGrid = [...newGrid, [...grid]];  // takes saved states and adds on current grid at the end
               index.current = updatedGrid.length - 1;
               return updatedGrid;
             });
           }
         });
   
         recentColor.current = selectedColor
         return;
       }
   
       if (activeTool.current === 'dropper') return; // don't call setPrevGrid if using dropper
   
       setPrevGrid((prevHistory) => {
         const newGrid = prevHistory.slice(0, index.current + 1); // prevents weird things if someone undos then starts drawing again
         const updatedGrid = [...newGrid, [...grid]];  // takes saved states and adds on current grid at the end
         index.current = updatedGrid.length - 1;
         return updatedGrid;
       });
   
       recentColor.current = selectedColor;
     }
   });
   

  const handleClear = () => {
    setGrid(Array(GRID_SIZE * GRID_SIZE).fill(DEFAULT_COLOR))
    setPrevGrid([Array(GRID_SIZE * GRID_SIZE).fill(DEFAULT_COLOR)])
    index.current = 0;
    drawnCells.current = Array(GRID_SIZE * GRID_SIZE).fill(false);
  };

  const handleUndo = () => {
    if (index.current > 0) {
      const prevIndex = index.current - 1;
      setGrid(prevGrid[prevIndex]);
      index.current = prevIndex;
    }
  };

  const handleRedo = () => {
    if (index.current < prevGrid.length - 1) {
      const nextIndex = index.current + 1;
      setGrid(prevGrid[nextIndex]);
      index.current = nextIndex;
    }
  }

  const handleSaveAndUpload = async (showLikes: boolean) => {
    if (isUploading) return;
    setIsUploading(true);
    try {
      const base64 = await captureRef(exportRef, { format: 'png', quality: 1, result: 'base64' });
      const filename = `pix.png`;
      const { signedUrl, publicUrl } = await api.getPresignedUrl(filename, token);
      await api.uploadToS3(signedUrl, base64);
      const counts: Record<string, number> = {};
      for (let i = 0; i < grid.length; i++) {
        if (drawnCells.current[i]) {
          counts[grid[i]] = (counts[grid[i]] || 0) + 1;
        }
      }
      const topColors = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([color]) => color);
      await api.createPost({ title: 'Challenge Post', content: caption, imageUrl: publicUrl, challengeDate: new Date().toISOString(), showLikes, colors: topColors }, token);

      await unlockSticker('DAILY_CHALLENGE', user?.stickers ?? [], updateUser);

      const { posts } = await api.getTodayChallengePosts(token);
      setSubmissions(posts);
      setSubmitted(true);   
      // router.navigate('/(tabs)');

      handleClear(); // make sure to clear canvas
      setSelectedColor(DEFAULT_SELECTED_COLOR);
      setCaption('');

      setShowAlertPosting(true);

    } catch (error) {
      console.error('Upload process failed:', error);
      alert('Failed to save image. Check console.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFill = (cellIndex: number, cellColor: string) => {
    if (cellColor === selectedColor) return;

    setGrid((currentGrid)=> {
      const newGrid = [...currentGrid];
      const neighborCells = [cellIndex];

      while (neighborCells.length > 0) {
        const currentCell = neighborCells.pop()!;

        if (newGrid[currentCell] !== cellColor) continue; // if fill finds a color that is different (boundary)

        newGrid[currentCell] = selectedColor;
        drawnCells.current[currentCell] = true;

        const row = Math.floor(currentCell / GRID_SIZE);
        const col = currentCell % GRID_SIZE;

        // make sure neighbors are within bounds
        if (col > 0) {
          neighborCells.push(currentCell - 1); // left neighbor cell
        }
        if (row > 0){
          neighborCells.push(currentCell - GRID_SIZE); // up neighbor cell
        } 
        if (row < GRID_SIZE - 1){
          neighborCells.push(currentCell + GRID_SIZE); // down neighbor cell
        }
        if (col < GRID_SIZE - 1){
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

  if (submitted) {
    return (
      <View style={{ flex: 1 }}>
        <Pressable onPress={() => router.back()} style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}>
          <BackIcon width={24} height={24} />
        </Pressable>
        <ScrollView style={submissionStyles.scroll} contentContainerStyle={submissionStyles.container}>
          <Text style={submissionStyles.title}>#pixoftheday</Text>
          <Text style={submissionStyles.subtitle}>today&apos;s submissions</Text>
          <View style={submissionStyles.divider} />
          {(() => {
            const mine = submissions.find(p => p.author.username === user?.username);
            const others = submissions.filter(p => p.author.username !== user?.username);
            return (
              <>
                {mine && (
                  <View style={submissionStyles.card}>
                    <Text style={submissionStyles.yourLabel}>Your submission:</Text>
                    <Image source={{ uri: mine.imageUrl }} style={submissionStyles.image} />
                  </View>
                )}
                {others.map(p => (
                  <View key={p.id} style={submissionStyles.card}>
                    <Text style={submissionStyles.username}>{p.author.username}</Text>
                    <Image source={{ uri: p.imageUrl }} style={submissionStyles.image} />
                  </View>
                ))}
              </>
            );
          })()}
        </ScrollView>
      </View>
    );
  }

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
        // Alert.alert(
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
        //     { cancelable: true }
        // )
        setShowAlertLike(true)
        return;
      }
  }

  return (
    <View style={styles.container}>
      <View ref={exportRef} collapsable={false} style={[styles.exportGrid, { width: GRID_CONTAINER_SIZE, height: GRID_CONTAINER_SIZE }]}>
        {grid.map((color, index) => (
          <GridCell key={index} color={color} gridSize={GRID_SIZE} cellSize={cellSize} noBorder={true}/>
        ))}
      </View>
      <Pressable onPress={() => router.back()} style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}>
        <BackIcon width={24} height={24} />
      </Pressable>
      <Text style={{ fontSize: 20, marginBottom: 10, fontFamily: 'ms' }}>challenge!</Text>
      <View style={styles.controls}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
          <PaletteImg style={{marginTop: 20}} width={62} height={48} />
          <Text style={styles.colon}>:</Text>
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
        <Toolbar allowedTools={allowedTools} onToolChange={t => { activeTool.current = t; }} onUndo={handleUndo} onRedo={handleRedo} prevColor={prevColor} onPrevColorSelect={() => setSelectedColor(prevColor)}/>

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
               <GridCell key={index} color={color} gridSize={GRID_SIZE} cellSize={cellSize} noBorder={false}/>
            ))}
            </View>
          </ReactNativeZoomableView>
        </View>
      </View>

      {captionFocused && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.darkOverlay} />
        </TouchableWithoutFeedback>
      )}

      <TextInput value={caption} onFocus={() => setCaptionFocused(true)} onBlur = {() => setCaptionFocused(false)} onChangeText={setCaption} style = {[captionFocused ? styles.focusedCaption : styles.caption, BORDER_FRAME, {fontFamily:'ms'}]} multiline placeholder='enter caption!' placeholderTextColor='rgba(81, 116, 207, 0.5)' autoCapitalize='none'/>
      <View style={styles.actions}>
        <TouchableOpacity onPress={clearAlert} style={[styles.clearButton, {borderWidth: 0.25, borderColor: '#000', paddingVertical: 5, paddingHorizontal: 10}, BORDER_FRAME]}>
          <Text style={{fontFamily:'ms'}}>clear</Text>
        </TouchableOpacity>
          {isUploading ? (
            <ActivityIndicator color="#000" />
          ) : (
          <TouchableOpacity onPress={captionAlert} style={[styles.postButton, {borderWidth: 0.25, borderColor: '#000', paddingVertical: 5, paddingHorizontal: 10}, BORDER_FRAME]}>
             <Text style={{fontFamily:'ms'}}>post</Text>
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
                <Text style={{fontFamily: 'ms', fontSize: 20}}>submission success!</Text>
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
  );
}

const styles = StyleSheet.create({
  exportGrid: {
    position: 'absolute',
    left: -99999,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    width: '80%',
  },
  colon: {
    fontSize: 20,
    fontFamily: 'PixelifySans_700Bold',
    color: '#1a1a1a',
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
    marginTop: 30, 
    borderWidth: 0.25, 
    paddingTop: 10,
    paddingBottom: 100, 
    paddingHorizontal: 15,
    width: '85%',
    height: '20%',
    borderRadius: 5,
    color: '#5174cf',
    backgroundColor: 'white',
  },
   focusedCaption: {
    position: 'fixed',
    top: -460,
    fontSize: 15,
    borderWidth: 0.25, 
    paddingTop: 10,
    paddingBottom: 100, 
    paddingHorizontal: 15,
    width: '100%',
    height: '25%',
    backgroundColor: 'white',
    zIndex: 11,
  },
   darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    zIndex: 10, 
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

const submissionStyles = StyleSheet.create({
  scroll: {
    backgroundColor: '#FFF1E8',
  },
  container: {
    padding: 20,
    paddingTop: 90,
    paddingBottom: 40,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: 'ms',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'ms',
    color: '#1a1a1a',
    marginTop: -6,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 4,
  },
  card: {
    backgroundColor: '#5174CF',
    borderRadius: 4,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  yourLabel: {
    fontSize: 16,
    fontFamily: 'ms',
    color: '#1a1a1a',
    alignSelf: 'flex-start',
  },
  username: {
    fontSize: 16,
    fontFamily: 'ms',
    color: '#1a1a1a',
    alignSelf: 'flex-start',
  },
  image: {
    width: 200,
    height: 200,
  },
});
