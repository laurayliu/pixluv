import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Dimensions, Button, ActivityIndicator, Pressable, PanResponder, Image, ScrollView } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { api } from '../services/api';
import { useAuth } from '@/context/AuthContext';
import Toolbar, { ToolName } from '@/components/toolbar';
import { useRouter } from 'expo-router';
import BackIcon from '../assets/icons/editor/undo.svg';

const GRID_SIZE = 32;
const DEFAULT_COLOR = '#fff';
const DEFAULT_SELECTED_COLOR = '#000';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_CONTAINER_SIZE = SCREEN_WIDTH - 100;

export default function Challenge() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [submissions, setSubmissions] = useState<{ id: string; imageUrl: string; author: { username: string } }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [allowedColors, setAllowedColors] = useState<string[]>([]);
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [grid, setGrid] = useState<string[]>(
    Array(GRID_SIZE * GRID_SIZE).fill(DEFAULT_COLOR)
  );
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_SELECTED_COLOR);
  const [isUploading, setIsUploading] = useState(false);
  const cellSize = GRID_CONTAINER_SIZE / GRID_SIZE;

  const activeTool = useRef('draw');
  const gridRef = useRef<View>(null);
  const exportRef = useRef<View>(null);
  const [prevGrid, setPrevGrid] = useState<string[][]>([Array(GRID_SIZE * GRID_SIZE).fill(DEFAULT_COLOR)]);
  const index = useRef(0);
  const gridLayout = useRef({ x: 0, y: 0 });

  useEffect(() => {
    api.getTodayChallenge()
      .then((c: any) => {
        if (c.allowedColors?.length) setAllowedColors(c.allowedColors);
        if (c.allowedTools?.length) setAllowedTools(c.allowedTools);
      })
      .catch(() => {});

    api.getTodayChallengePosts(token)
      .then(({ posts, hasSubmitted }: any) => {
        setSubmissions(posts);
        setSubmitted(hasSubmitted);
      })
      .catch(() => {});
  }, []);

  const colorCellAtPosition = (pageX: number, pageY: number) => {
    const relativeX = pageX - gridLayout.current.x;
    const relativeY = pageY - gridLayout.current.y;
    const col = Math.floor(relativeX / cellSize);
    const row = Math.floor(relativeY / cellSize);

    if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
      const i = row * GRID_SIZE + col;
      const drawingColor = activeTool.current === 'erase' ? DEFAULT_COLOR : selectedColor;
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid[i] = drawingColor;
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

  const handleClear = () => {
    setGrid(Array(GRID_SIZE * GRID_SIZE).fill(DEFAULT_COLOR));
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
      await api.createPost({ title: 'Challenge Post', imageUrl: publicUrl, challengeDate: new Date().toISOString() }, token);
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

  return (
    <View style={styles.container}>
      <View ref={exportRef} collapsable={false} style={[styles.exportGrid, { width: GRID_CONTAINER_SIZE, height: GRID_CONTAINER_SIZE }]}>
        {grid.map((color, i) => (
          <View key={i} style={{ width: `${100 / GRID_SIZE}%`, height: cellSize, backgroundColor: color }} />
        ))}
      </View>
      <Pressable onPress={() => router.back()} style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}>
        <BackIcon width={24} height={24} />
      </Pressable>
      <Text style={{ fontSize: 20, marginBottom: 10, fontFamily: 'PixelifySans_700Bold' }}>challenge!</Text>
      <View style={styles.controls}>
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
        <Toolbar allowedTools={allowedTools as ToolName[]} onToolChange={t => { activeTool.current = t; }} onUndo={handleUndo} onRedo={handleRedo}/>

        <View
          {...panResponder.panHandlers}
          ref={gridRef}
          collapsable={false}
          style={[styles.grid, { width: GRID_CONTAINER_SIZE, height: GRID_CONTAINER_SIZE }]}
        >
          {grid.map((color, i) => (
            <View
              key={i}
              style={{
                width: `${100 / GRID_SIZE}%`,
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
