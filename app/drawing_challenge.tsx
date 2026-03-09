import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Dimensions, ActivityIndicator, Pressable, PanResponder, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { api } from '../services/api';
import { useAuth } from '@/context/AuthContext';
import Toolbar, { ALL_TOOL_NAMES } from '@/components/toolbar';
import { useRouter } from 'expo-router';
import BackIcon from '../assets/icons/editor/undo.svg';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import PaletteImg from '../assets/icons/palette_img.svg';

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
  const { token, user } = useAuth();
  const [submissions, setSubmissions] = useState<{ id: string; imageUrl: string; author: { username: string } }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [allowedColors, setAllowedColors] = useState<string[]>([]);

  const [grid, setGrid] = useState<string[]>(
    Array(GRID_SIZE * GRID_SIZE).fill(DEFAULT_COLOR)
  );
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_SELECTED_COLOR);
  const [isUploading, setIsUploading] = useState(false);
  const cellSize = GRID_CONTAINER_SIZE / GRID_SIZE;

  const activeTool = useRef('draw');
  const [caption, setCaption] = useState<string>('');

  const gridRef = useRef<View>(null);
  const exportRef = useRef<View>(null);

  const [prevGrid, setPrevGrid] = useState<string[][]>([Array(GRID_SIZE * GRID_SIZE).fill(DEFAULT_COLOR)]);
  const index = useRef(0);

  const zoomState = useRef({
      level: 1,
  });


  useEffect(() => {
    api.getTodayChallenge()
      .then((c: any) => {
        if (c.allowedColors?.length) setAllowedColors(c.allowedColors);
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
      setPrevGrid((prevHistory) => {
        const newGrid = prevHistory.slice(0, index.current + 1); // prevents weird things if someone undos then starts drawing again
        const updatedGrid = [...newGrid, [...grid]];  // takes saved states and adds on current grid at the end
        index.current = updatedGrid.length - 1;
        return updatedGrid;
      });
    }
  });

  const handleClear = () => {
    setGrid(Array(GRID_SIZE * GRID_SIZE).fill(DEFAULT_COLOR))
    setPrevGrid([Array(GRID_SIZE * GRID_SIZE).fill(DEFAULT_COLOR)])
    index.current = 0;
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

  const handleSaveAndUpload = async () => {
    if (isUploading) return;
    setIsUploading(true);
    try {
      const base64 = await captureRef(exportRef, { format: 'png', quality: 1, result: 'base64' });
      const filename = `pix.png`;
      const { signedUrl, publicUrl } = await api.getPresignedUrl(filename, token);
      await api.uploadToS3(signedUrl, base64);
      await api.createPost({ title: 'Challenge Post', content: caption, imageUrl: publicUrl, challengeDate: new Date().toISOString() }, token);
      const { posts } = await api.getTodayChallengePosts(token);
      setSubmissions(posts);
      setSubmitted(true);
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

        const row = Math.floor(currentCell / GRID_SIZE);
        const col = currentCell % GRID_SIZE;

        // make sure neighbors are within bounds
        // if (col > 0 && row > 0) {
        //   neighborCells.push(currentCell - 1 - GRID_SIZE); // upper left neighbor cell
        // }
        if (col > 0) {
          neighborCells.push(currentCell - 1); // left neighbor cell
        }
        // if (col > 0 && row < GRID_SIZE - 1) {
        //   neighborCells.push(currentCell - 1 + GRID_SIZE); // lower left neighbor cell
        // }
        if (row > 0){
          neighborCells.push(currentCell - GRID_SIZE); // up neighbor cell
        } 
        if (row < GRID_SIZE - 1){
          neighborCells.push(currentCell + GRID_SIZE); // down neighbor cell
        }
        // if (col < GRID_SIZE - 1 && row > 0){
        //   neighborCells.push(currentCell + 1 - GRID_SIZE); // upper right neighbor cell
        // } 
        if (col < GRID_SIZE - 1){
          neighborCells.push(currentCell + 1); // right neighbor cell
        } 
        // if (col < GRID_SIZE - 1 && row < GRID_SIZE - 1){
        //   neighborCells.push(currentCell + 1 + GRID_SIZE); // lower right neighbor cell
        // } 

      }
      return newGrid;
    });

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
      Alert.alert(
        "alert!",
        "are you sure you want to clear the canvas?",
        [
          { text: "cancel" },
          { text: "clear",
            onPress: handleClear
          }
        ],
        { cancelable: false }
      )
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
      <Text style={{ fontSize: 20, marginBottom: 10, fontFamily: 'PixelifySans_700Bold' }}>challenge!</Text>
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
        <Toolbar allowedTools={ALL_TOOL_NAMES} onToolChange={t => { activeTool.current = t; }} onUndo={handleUndo} onRedo={handleRedo} />

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

      <TextInput value={caption} onChangeText={setCaption} style = {[styles.caption, BORDER_FRAME]} multiline placeholder='enter caption!' placeholderTextColor='rgba(81, 116, 207, 0.5)' autoCapitalize='none'/>
      <View style={styles.actions}>
        <TouchableOpacity onPress={clearAlert} style={[styles.clearButton, {borderWidth: 0.25, borderColor: '#000', paddingVertical: 5, paddingHorizontal: 10}, BORDER_FRAME]}>
          <Text>clear</Text>
        </TouchableOpacity>
          {isUploading ? (
            <ActivityIndicator color="#000" />
          ) : (
          <TouchableOpacity onPress={handleSaveAndUpload} style={[styles.postButton, {borderWidth: 0.25, borderColor: '#000', paddingVertical: 5, paddingHorizontal: 10}, BORDER_FRAME]}>
             <Text>post</Text>
          </TouchableOpacity>
          )}
       </View>

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
    borderRadius: 5,
    color: '#5174cf',
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
    gap: 230,
  },
  clearButton: {
    alignSelf: 'flex-start'
  },
  postButton: {
    alignSelf: 'flex-end'
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
    fontFamily: 'PixelifySans_700Bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'PixelifySans_400Regular',
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
    fontFamily: 'PixelifySans_700Bold',
    color: '#1a1a1a',
    alignSelf: 'flex-start',
  },
  username: {
    fontSize: 16,
    fontFamily: 'PixelifySans_700Bold',
    color: '#1a1a1a',
    alignSelf: 'flex-start',
  },
  image: {
    width: 200,
    height: 200,
  },
});
