import React, { useCallback, useEffect, useState}from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View, Button, LayoutChangeEvent, KeyboardAvoidingView, TouchableOpacity, TextInput, Pressable, FlatList, Image, ActivityIndicator, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Animated, { useSharedValue, withSpring, withDecay, useAnimatedStyle, withTiming, withDelay} from 'react-native-reanimated';


import { useRouter } from 'expo-router';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {scheduleOnRN } from 'react-native-worklets';

type Post = {
  id: string;
  title?: string;
  caption?: string;
  imageUrl?: string;
  _count?: {
    likes?: number;
    comments?: number;
  };
  likedByMe?: boolean;
};

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  user: {
    username: string;
    id: string;
  };
};


const BORDER_FRAME = {
  borderRadius: 0,
  borderTopColor: '#c4c4c4',
  borderLeftColor: '#c4c4c4',
  borderBottomColor: 'hsl(0, 100%, 98%)',
  borderRightColor: '#ffffff',
  borderTopWidth: 3,
  borderLeftWidth: 3,
  borderBottomWidth: 3,
  borderRightWidth: 3,
  overflow: 'hidden',
} as const;


export default function UserProfile() {
  const { user, token } = useAuth();

  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { token, user: me } = useAuth();
  const [profile, setProfile] = useState<{ username: string; profilePicture?: string; bio?: string; _count?: { followers: number; following: number } } | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [openCover, setOpenCover] = useState(false);
  const openBookCover = useSharedValue(false);


  const handleToggleLike = async (postId: string) => {
    if (!token) {
      router.replace('/login');
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              _count: {
                ...(p._count ?? {}),
                likes: (p._count?.likes ?? 0) + (p.likedByMe ? -1 : 1),
              },
            }
          : p,
      ),
    );

    try {
      await api.likePost(postId, token);
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByMe: !p.likedByMe,
                _count: {
                  ...(p._count ?? {}),
                  likes: (p._count?.likes ?? 0) + (!p.likedByMe ? -1 : 1),
                },
              }
            : p,
        ),
      );
    }
  };
  
  
    const openComments = async (post: Post) => {
      setActivePost(post);
      setCommentsVisible(true);
      setLoadingComments(true);
      setNewComment('');
  
      try {
        const data = await api.getComments(post.id);
        setComments(data);
      } catch (err) {
        console.error('Failed to load comments', err);
  
      } finally {
        setLoadingComments(false);
      }
    };
  
    const closeComments = () => {
      setCommentsVisible(false);
      setActivePost(null);
      setComments([]);
      setNewComment('');
    };
  
    const handleSubmitComment = async () => {
      if (!token || !activePost) return;
      const body = newComment.trim();
      if (!body) return;
  
      setSubmittingComment(true);
      try {
        const created = await api.createComment(activePost.id, body, token);
        setComments((prev) => [...prev, created]);
        setNewComment('');
  
        // optionally bump comment count on the post list
        setPosts((prev) =>
          prev.map((p) =>
            p.id === activePost.id
              ? {
                  ...p,
                  _count: {
                    ...(p._count ?? {}),
                    comments: (p._count?.comments ?? 0) + 1,
                  },
                }
              : p,
          ),
        );
      } finally {
        setSubmittingComment(false);
      }
    };
  
      const offset = useSharedValue<number>(0);
      const coverOffset = useSharedValue<number>(0);
      const width = useSharedValue<number>(0);
      const pageWidth = useSharedValue(0);
      const [currentPage, setCurrentPage] = useState(0)
      const currentPageShared = useSharedValue(0); 

       // currentPageShared.set(next);  
        useEffect(() => {
          currentPageShared.set(currentPage);
        })
      
      
      const nextPage = () => {
        setCurrentPage(p => 
          Math.min(p + 1, posts.length - 1))
          // currentPageShared.set(next); 
      }


      const prevPage = () => {
        setCurrentPage(p => 
          Math.max(p - 1, 0)
        )
      }
      
      const { width: wid, height: hei } = Dimensions.get('window')
      const bookWidth = wid - 60;
      const imagePercent = .60
      const translateX = useSharedValue(0)

  
    
    
  // useEffect(() => {
  //   if (!userId) return;
  //   setLoading(true);
  //   Promise.all([
  //     api.getUser(userId),
  //     api.getPostsByUser(userId, token),
      api.getFollowers(userId).catch(() => []),
  //   ])
  //     .then(([user, userPosts, followers]) => {
  //       setProfile(user);
  //       setPosts(userPosts);
        setFollowerCount(user._count?.followers ?? followers.length);
        if (me?.id) {
          setIsFollowing(followers.some((f: any) => f.id === me.id));
        }
  //     })
  //     .catch((err: Error) => setError(err.message))
  //     .finally(() => setLoading(false));
  // }, [userId, token]);

  // if (loading) return <ActivityIndicator size="large" style={{ marginTop: 80 }} />;
  // if (error) return <Text style={styles.errorText}>{error}</Text>;

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
              offset.set(0);
              console.log(`T: Update current page ${currentPageShared.value}`)
            }
          });
        } else if (offset.get() > -90 && currentPageShared.value > 0) {
          console.log(`Flip back page ${currentPageShared.value}`)
          currentPageShared.value -= 1;
          offset.set(withTiming(0, { duration: 300 }, (finished) => {
            if (finished) {
              scheduleOnRN(prevPage);
              console.log(`F: Update current page ${currentPageShared.value}`)
            }
          })) 
        } else if (offset.get() < 10 || offset.get() > 0 && currentPageShared.value === 0) {
            coverOffset.value = withTiming(0, { duration: 100 })
            offset.set(withTiming(0, { duration: 0 }));
  
        } else {
          offset.set(withTiming(0, { duration: 300 }));
        }
      })
  
      .onChange((event) => {
        offset.set((value) => value += event.changeX) ;
        offset.set((value) => value =  Math.min(0, Math.max(-120, offset.value))); 
      })
  
      .onFinalize((event) => {
        if (offset.get() < -90) return; 
        offset.set((value) => withDecay({
          velocity: event.velocityX * 0.3,
          rubberBandEffect: true,
          clamp: [-110,0],
        }))
      });
    
      const animatedStyles = useAnimatedStyle(() => ({
        transform: [{perspective: 8000}, {translateX: (-bookWidth/2)}, { rotateY: `${offset.value}deg`}, {translateX: bookWidth/2}],  
        backfaceVisibility: 'hidden'
      }));
    

  const coverPan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })

    .onEnd(() => {

      if (coverOffset.value < -90 && currentPageShared.value < posts.length - 1) {
        coverOffset.value = withTiming(-109, { duration: 300 }, (finished) => {
          openBookCover.value = false
        });
      } else if (coverOffset.get() > -90 && currentPageShared.value > 0) {
        console.log(`Flip back page ${currentPageShared.value}`)
      } else {
        coverOffset.set(withTiming(0, { duration: 300 }));
      }
    })

    .onChange((event) => {
      coverOffset.set((value) => value += event.changeX) ;
      coverOffset.set((value) => value =  Math.min(0, Math.max(-120, coverOffset.value))); 
    })

    .onFinalize((event) => {
      if (coverOffset.get() < -90) return; 
      coverOffset.set((value) => withDecay({
        velocity: event.velocityX * 0.3,
        rubberBandEffect: true,
        clamp: [-110,0],
      }))
    });

  const coverAnimatedStyles = useAnimatedStyle(() => ({
    transform: [{perspective: 8000}, {translateX: (-bookWidth/2)}, { rotateY: `${coverOffset.value}deg`}, {translateX: bookWidth/2}],  
    backfaceVisibility: 'hidden'
  }));  


  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api.getPostsByUser(user?.id ?? null, token)
        .then(setPosts)
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    }, [user?.id, token])
  );

  if (error) return <Text>{error}</Text>;

  const handleFollowToggle = async () => {
    if (!token) { router.replace('/login'); return; }
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowerCount(c => c + (wasFollowing ? -1 : 1));
    try {
      if (wasFollowing) {
        await api.unfollowUser(userId, token);
      } else {
        await api.followUser(userId, token);
      }
    } catch (err) {
      console.error('Follow/unfollow failed:', err);
      setIsFollowing(wasFollowing);
      setFollowerCount(c => c + (wasFollowing ? 1 : -1));
    } finally {
      setFollowLoading(false);
    }
  };

  
  return (
    <View style={styles.main_container}>
      <Pressable style={styles.back_button} onPress={() => router.back()}>
        <IconSymbol name="undo" size={24} color="#ffffff" />
      </Pressable>
      <View style={styles.profile_header}>
        <View style={styles.profile_box}>
          {profile?.profilePicture ? (
            <Image source={{ uri: profile.profilePicture }} style={{ width: 92, height: 92 }} />
          ) : (
            <IconSymbol name="profile" color="currentColor" />
          )}
        </View>

        <View style={styles.info_container}>
          <Text style={styles.username}>{profile?.username ?? ''}</Text>
          <Text style={styles.texts}>{followerCount} followers · {profile?._count?.following ?? 0} following</Text>
          <View style={styles.action_container}>
            <Pressable style={[styles.action_button, isFollowing && styles.action_button_active]} onPress={handleFollowToggle} disabled={followLoading}>
              <Text style={styles.button_text}>{isFollowing ? 'Following' : 'Follow'}</Text>
            </Pressable>
            <Pressable
              style={styles.action_button}
              onPress={() =>
                router.push(
                  `/pixing/${userId}?username=${encodeURIComponent(profile?.username ?? '')}` as any
                )
              }
            >
              <Text style={styles.button_text}>Pix Me!</Text>
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
                styles.color_box, BORDER_FRAME,
              { backgroundColor: '#faeb4d' }, // take user info to fill color
              ]}></View>
            <View style={[
                styles.color_box, BORDER_FRAME,
              { backgroundColor: '#d73a3a' }, // take user info to fill color
              ]}></View>

            <View style={[
                styles.color_box, BORDER_FRAME,
              { backgroundColor: '#51c770' }, // take user info to fill color
              ]}></View>          
            </View>

            <View style={styles.color_row}>
              <View style={[
                  styles.color_box, BORDER_FRAME,
                { backgroundColor: '#9b3b00' }, // take user info to fill color
                ]}/>       

              <View style={[
                  styles.color_box, BORDER_FRAME,
                { backgroundColor: '#b74caf' }, // take user info to fill color
                ]}/>       
              
              <View style={[
                  styles.color_box, BORDER_FRAME,
                { backgroundColor: '#3400f1' }, // take user info to fill color
                ]}/>       
            </View>
          </View>


          <View>
            {/* <Text>Edit tton</Text> */}
          </View>
        </View>
      </View>

      {/* <View style={styles.book_container}>
        <FlatList
          data={posts.slice(0, 5)}
          keyExtractor={(item) => String(item.id ?? item._id)}
          renderItem={({ item }) => (
            <View>
              <Text>{item.title ?? item.caption ?? ''}</Text>
              <Image source={{ uri: item.imageUrl }} style={{ width: 200, height: 200 }} />
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No posts yet</Text>}
        />
      </View> */}

    <GestureHandlerRootView style={styles.container}>
      <View style={styles.book_container}>
        {loading && <ActivityIndicator size="large" />}
        {posts.length === 0 && !loading && (<Text>No post yet</Text>)}
            <Modal visible={commentsVisible} animationType="fade" transparent={true} onRequestClose={closeComments}>
              <View style={styles.commentsOverlay}>
                <Pressable style={styles.backdrop} onPress={closeComments} />
                    <KeyboardAvoidingView
                      style={styles.commentsContainer}
                    >
                      {loadingComments ? (
                        <ActivityIndicator size="large" />
                      ) : (
                        <FlatList
                          data={comments}
                          keyExtractor={(c) => c.id}
                          contentContainerStyle={styles.commentsList}
                          renderItem={({ item }) => (
                            <View style={styles.commentRow}>
                              <Text style={styles.commentAuthor}>{item.user.username}</Text>
                              <Text style={styles.commentBody}>{item.body}</Text>
                            </View>
                          )}
                          ListEmptyComponent={<Text>be the first comment!</Text>}
                        />
                      )}

                      <View style={styles.commentInputRow}>
                        <TextInput
                          style={[styles.commentInput]}
                          placeholder="leave a comment..."
                          value={newComment}
                          onChangeText={setNewComment}
                          placeholderTextColor='rgba(81, 116, 207, 0.5)' 
                          autoCapitalize='none'
                        />
                        <TouchableOpacity
                          onPress={handleSubmitComment}
                          disabled={submittingComment || !newComment.trim()}
                          style={[styles.commentSendButton]}
                        >
                          <IconSymbol
                            name={'mail'}
                            color={'currentColor'}
                            size={20}
                          />
                        </TouchableOpacity>
                      </View>
                    </KeyboardAvoidingView>
              </View>
       
      </Modal>

        <GestureDetector key={'cover'} gesture={coverPan}>
          <Animated.View style={[coverAnimatedStyles, styles.page_cover, {width: bookWidth, alignSelf: 'center', alignItems: 'center'}, {zIndex: 77500}]}>
            <Image style={[{width: '100%', height: '100%', borderRadius: 15}]} source={require('../../assets/images/book_cover.png')}/>
          </Animated.View>
        </GestureDetector>
        {posts.slice(0, 10).map((item, index) => {
          const isLast = index === currentPage
          const isPrev = index < currentPage ;
          const isTop = index === currentPage;
          const isNext = index === currentPage + 1;
          
          const Page = (
            <Animated.View
              key={String(item.id ?? item._id)}
              style={[isTop && animatedStyles, styles.page, {width: bookWidth, alignSelf: 'center', alignItems: 'center'}, {zIndex: isTop ? 1000
                : isPrev
                ? 900 - index
                : isNext
                ? 950
                : 0} 
              ]}>
              <View style={[styles.art_wrapper, BORDER_FRAME, {marginTop: wid*.1}]}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: wid*imagePercent, height: wid*imagePercent, justifyContent: 'center', alignItems: 'center'}}
                />
                <Text style={{fontSize: 17, justifyContent: 'flex-start'}}>{item.content ?? JSON.stringify(item)}</Text>

                <View style={[styles.post_action_box, {width: wid*imagePercent}]}>
                  <View style={styles.color_row}>
                    <View style={[
                        styles.color_box, BORDER_FRAME,
                      { backgroundColor: '#312da2' }, // take user info to fill color
                      ]}/>       

                    <View style={[
                        styles.color_box, BORDER_FRAME,
                      { backgroundColor: '#687ad7' }, // take user info to fill color
                      ]}/>       
                    
                    <View style={[
                        styles.color_box, BORDER_FRAME,
                      { backgroundColor: '#3ead3c' }, // take user info to fill color
                      ]}/>       
                    <View style={[
                        styles.color_box, BORDER_FRAME,
                      { backgroundColor: '#f798ec' }, // take user info to fill color
                      ]}/>       
                    
                    <View style={[
                        styles.color_box, BORDER_FRAME,
                      { backgroundColor: '#a22d2d' }, // take user info to fill color
                      ]}/> 
                  </View>

                  <View style={styles.interact_box}>
                  <TouchableOpacity onPress={() => handleToggleLike(item.id)} style={styles.actionButton}>
                    <IconSymbol
                      name={item.likedByMe ? 'liked' : 'like'}
                      color={'currentColor'}
                      size={24}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => openComments(item)} style={styles.actionButton}>
                    <IconSymbol
                      name={commentsVisible && activePost?.id === item.id ? 'commented' : 'comment'}
                      color={'currentColor'}
                      size={24}
                    />
                  </TouchableOpacity>          
                  </View>
                </View> 
              </View>

            </Animated.View>
            
          );

          if (isTop || isLast) {
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
}

const styles = StyleSheet.create({
  main_container: {
    height: '100%',
    width: '100%',
    backgroundColor: '#5174CF',
  },
  back_button: {
    marginTop: 56,
    marginLeft: 15,
    alignSelf: 'flex-start',
  },
  profile_header: {
    marginTop: 12,
    flexDirection: 'row',
    paddingLeft: 30,
    paddingRight: 30,
    width: '100%',
  },
  profile_box: {
    height: 92,
    width: 92,
    padding: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  info_container: {
    flex: 1,
    flexDirection: 'column',
    marginLeft: 12,
  },
  action_container: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  action_button_active: {
    backgroundColor: '#a0003200',
    borderWidth: 1,
    borderColor: '#FF004D',
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
  commentsContainer: {
    height: '40%',
    backgroundColor: '#ececec',
    padding: 30,
  },
  book_container: {
    marginTop: 15,
    alignSelf: 'center',
    width: '90%',
    height: '70%',
  },
  emptyText: {
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    textAlign: 'center',
    color: '#ff6161',
    marginTop: 80,
    fontSize: 14,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100%'
  },
    wrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  page: {
    position: 'absolute',
    height: 550,
    borderRadius: 20,
    backgroundColor: '#fff8ce',
    borderWidth: 6,
    borderColor: '#3c0404',
    // shadowColor: 'black',
    // shadowOpacity: 0.9,
    // elevation: 5,
  },
  
  page_cover: {
    position: 'absolute',
    height: 550,
    borderRadius: 20,
    backgroundColor: '#fff8ce',
  },
  post_action_box: {
    display: 'flex',
    // marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  interact_box: {
    display: 'flex',
    flexDirection: 'row',
  },
  commentsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  commentsList: {

  },
  commentRow: {
    flexDirection: 'row',
    gap: 40,
  },
  commentAuthor: {
    fontWeight: '800'
  },
  commentBody: {

  },
  commentInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 10,
    marginBottom: 5,
  },
  commentInput: {
    padding: 8,
    flex: 0.8,
    backgroundColor: 'white',
  },
  commentSendButton: {
    flex: 0.15,
  }, 
  actionButton: {
    margin: 5,
  },
  art_wrapper: {
    padding: 15,
    backgroundColor: '#e8e8e8',
  }

});
