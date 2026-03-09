
import React, { useCallback, useState}from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View, Button, LayoutChangeEvent, TouchableOpacity, Pressable, FlatList, Image, ActivityIndicator} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { api } from '../../services/api';
import Animated, { useSharedValue, withSpring, withDecay, useAnimatedStyle, withTiming, withDelay} from 'react-native-reanimated';
import { Dimensions } from 'react-native';

import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {scheduleOnRN } from 'react-native-worklets';

const Profile = () => {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offset = useSharedValue<number>(0);
  const width = useSharedValue<number>(0);
  const pageWidth = useSharedValue(0);
  const flip = useSharedValue<number>(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0)
  const currentPageShared = useSharedValue(0);

const nextPage = () => {
  setCurrentPage(p => {
    const next = Math.min(p + 1, posts.length - 1);
    currentPageShared.value = next;  
    return next;
  });
}

const prevPage = () => {
  setCurrentPage(p => {
    const prev = Math.max(p - 1, 0);
    currentPageShared.value = prev; 
    return prev;
  });
}
  const { width: wid, height: hei } = Dimensions.get('window')
  const bookWidth = wid * 0.75;

  const onLayout = (event: LayoutChangeEvent) => {
    pageWidth.value = event.nativeEvent.layout.width;
  };

  const handlePress = () => {
    width.value = withSpring(Math.random() * 100 + 50);
  };

  const translateX = useSharedValue(0)

  const pan = Gesture.Pan()
      .onUpdate((e) => {
        translateX.value = e.translationX;
      })

      .onEnd(() => {
        if (offset.value < -90 && currentPageShared.value < posts.length - 1) {
          console.log(`Turn page ${currentPageShared.value}`)
            currentPageShared.value += 1;

          offset.value = withTiming(-109, { duration: 300 }, (finished) => {
            if (finished) {
              scheduleOnRN(nextPage);
              offset.value = 0;
              console.log(`T: Update current page ${currentPageShared.value}`)
            }
          });
        } else if (offset.value > -90 && currentPageShared.value > 0) {
          console.log(`Flip back page ${currentPageShared.value}`)
          currentPageShared.value -= 1;
          offset.value = withTiming(0, { duration: 300 }, (finished) => {
            if (finished) {
              scheduleOnRN(prevPage);
              console.log(`F: Update current page ${currentPageShared.value}`)
            }
          });
        } else {
          offset.value = withTiming(0, { duration: 300 });
        }
      })

      .onChange((event) => {
        offset.value += event.changeX;
        offset.value = Math.min(0, Math.max(-120, offset.value)); 
      })

      .onFinalize((event) => {
        if (offset.value < -90) return; 
        offset.value = withDecay({
          velocity: event.velocityX * 0.3,
          rubberBandEffect: true,
          clamp: [-110,0],
        });
      });

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{perspective: 3000}, {translateX: -bookWidth/2}, { rotateY: `${offset.value}deg`}, {translateX: bookWidth/2}],  
  }));

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api.getPostsByUser(user?.id)
        .then(setPosts)
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) return <ActivityIndicator size="large" />;
  if (error) return <Text>{error}</Text>;
  
  return (

    <View style={styles.main_container}>
      <View style={styles.profile_header}>
        <View style={styles.profile_box}>
          <IconSymbol name="profile" color={"currentColor"}/>        
        </View>

        <View style={styles.info_container}>
          <Text style={styles.username}>{user?.username ?? 'your profile'}</Text>
          <Text style={styles.texts}>Bio goes here oooh</Text>
          <View style={styles.action_container}>
            {/* Needd to add edit button instead for personal profile view */}
            <Pressable style={styles.action_button}>
              <Text style={styles.button_text}>Follow</Text>
            </Pressable>

            <Pressable style={styles.action_button}>
              <Text  style={styles.button_text}>Pix Me!</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.favorite_container}>
        <View style={styles.sticker_container}>
          <Text style={[styles.texts, {textAlign: 'center' }]}>Sticker Collection</Text>
          <View style={styles.sticker_box}>
            <View style={styles.sticker}>
              {/* use image here to display the sticker */}
              {/* <Image
                source={{ uri: item.imageUrl }}
              /> */}
            </View>

            <View style={styles.sticker}>
              {/* use image here to display the sticker */}
            </View>
          </View>
        </View>

        <View style={styles.main_color}>
          <Text style={[styles.texts, {textAlign: 'center'}]}>Favorite Colors</Text>

          <View style={styles.pallete_box}>
            <View style={styles.color_row}>
              <View style={[
                styles.color_box, 
              { backgroundColor: '#a22d2d' }, // take user info to fill color
              ]}></View>
            <View style={[
                styles.color_box, 
              { backgroundColor: '#a22d2d' }, // take user info to fill color
              ]}></View>

            <View style={[
                styles.color_box, 
              { backgroundColor: '#a22d2d' }, // take user info to fill color
              ]}></View>          
            </View>

            <View style={styles.color_row}>
              <View style={[
                styles.color_box, 
              { backgroundColor: '#a22d2d' }, // take user info to fill color
              ]}></View>
            <View style={[
                styles.color_box, 
              { backgroundColor: '#a22d2d' }, // take user info to fill color
              ]}></View>

            <View style={[
                styles.color_box, 
              { backgroundColor: '#a22d2d' }, // take user info to fill color
              ]}></View>          
            </View>
          </View>


          <View>
            {/* <Text>Edit tton</Text> */}
          </View>
        </View>
      </View>

      {/* <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>log out</Text>
      </TouchableOpacity>  */}

    <GestureHandlerRootView style={styles.container}>
      <View style={styles.book_container}>
        {posts.length === 0 && (<Text>No post yet</Text>)}
        {posts.slice(0, 10).map((item, index) => {
          const isPrev = index < currentPage ;
          const isTop = index === currentPage;
          const isNext = index === currentPage + 1;
          const Page = (
            <Animated.View
              key={String(item.id ?? item._id)}
              style={[isTop && animatedStyles, styles.boxy, {width: bookWidth, alignSelf: 'center', alignItems: 'center'}, {zIndex: isTop ? 1000
                : isPrev
                ? 900 - index
                : isNext
                ? 950
                : 0} 
              ]}>
              <Text>{item.title ?? item.caption ?? JSON.stringify(item)}</Text>
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: 300, height: 300, justifyContent: 'center'}}
              />
            </Animated.View>
          );

          if (isTop) {
            return(
              <GestureDetector key={String(item.id ?? item._id)} gesture={pan}>
                {Page}
              </GestureDetector>
            )
          } else if (isNext) {
            return Page;
          } 
          return null;
        })}

        </View>
      </GestureHandlerRootView>
    </View>
  );
};


const styles = StyleSheet.create({
  main_container: {
    height: '100%',
    width: '100%',
    backgroundColor: '#5174CF'
  },
  profile_header: {
    display: 'flex',
    marginTop: 90,
    flexDirection: 'row',
    paddingLeft: 15,
    paddingRight: 15,
    width: '100%',
  },
  profile_box: {
    height: 92,
    width: 92,
    padding: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  info_container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    marginLeft: 12,
  },
  action_container: {
    display: 'flex',
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  main_color: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: 110,
    alignContent: 'center',
    justifyContent: 'flex-end'
  },
  color_row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  action_button: {
    display: 'flex',
    justifyContent: 'center',
    height: 33,
    width: '48%',
    fontSize: 15,
    backgroundColor: '#FF004D',
  },
  button_text: {
    width: '100%',
    color: '#ffffff',
    justifyContent: 'center',
    alignContent: 'center',
    textAlign: 'center'
  },
  username: {
    fontSize: 25,
    fontWeight: '700',
    color: '#ffffff',
  },
  texts: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 5,
  },
  favorite_container: {
    display: 'flex',
    height: 115,
    width: '80%', 
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center' 
  },
  sticker_container: {
    width: 160,
    height: '100%',
    marginRight: 40,
    justifyContent: 'flex-end'
  },
  sticker_box: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row'
  },
  sticker: {
    backgroundColor: '#382979',
    height: 75,
    width: 75,
  },
  pallete_box: {
    backgroundColor: '#d0d0d0',
    height: 75,
    width: 110,
    justifyContent: 'center'
  },
  color_box: {
    height: 28,
    width: 28,
    margin: 2,
    backgroundColor: '#a14c67',
    justifyContent: 'center',
    alignContent: 'center',
    alignSelf: 'center',
  },
  book_container: {
    display: 'flex',
    marginTop: 15,
    alignSelf: 'center',
    width: '90%',
    height: '70%'
  },
  email: {
    fontSize: 14,
    color: '#ff6161',
    marginBottom: 40,
  },
  logoutButton: {
    borderWidth: 2,
    borderColor: '#ff6161',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  logoutText: {
    color: '#ff6161',
    fontWeight: '700',
    letterSpacing: 1,
  },
    container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  wrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  boxy: {
    position: 'absolute',
    height: 500,
    backgroundColor: '#511f0b',
    borderRadius: 20,
  },
});

export default Profile;



