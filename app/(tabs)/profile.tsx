import React, { useCallback, useState}from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View, KeyboardAvoidingView, TouchableOpacity, TextInput, Pressable, FlatList, Image, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { api } from '../../services/api';
import Animated, { useSharedValue, withSpring, withDecay, useAnimatedStyle, withTiming} from 'react-native-reanimated';
import DefaultColorPanel from '../../components/color_picker';

import { useRouter } from 'expo-router';
import { unlockSticker } from '@/utils/unlockSticker';
import { STICKER_DEFS } from '@/constants/stickers';
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
  colors?: string[];
  _count?: {
    likes?: number;
    comments?: number;
  };
  likedByMe?: boolean;
  showLikes?: boolean;
  author?: {
    username?: string;
    profilePicture?: string | null;
  };
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

type ColorProp = {
  color: string;
  index: number;
}

const DEFAULT_SELECTED_COLOR = "#FF0000"
const ITEM_SIZE = (Dimensions.get('window').width - 48) / 3;
const SHEET_HEIGHT = Dimensions.get('window').height * 0.5;
const defaultPallette = ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"]

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

const { width: wid, height: hei } = Dimensions.get('window')
const bookWidth = wid - 60;
const bookHeight = hei - 400

const Profile = () => {
  const { user, logout, token, updateUser } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [colorPallete, setColorPallete] = useState<string[]>(defaultPallette);
  const [pfpPickerVisible, setPfpPickerVisible] = useState(false);
  const [pfpPosts, setPfpPosts] = useState<{ id: string; imageUrl: string }[]>([]);
  const [pfpPostsLoading, setPfpPostsLoading] = useState(false);
  const [updatingPfp, setUpdatingPfp] = useState(false);
  const router = useRouter();
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const openBookCover = useSharedValue(false);
  const fade = useSharedValue(1);

  const [editMode, setEditMode] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [EditPallete, setEditPallete] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_SELECTED_COLOR);
  const [savedPallete, setSavedPallete] = useState<string[]>(defaultPallette);
  const pfpSheetY = useSharedValue(SHEET_HEIGHT);
  const pfpSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pfpSheetY.value }],
  }));

  const settingsSheetY = useSharedValue(SHEET_HEIGHT);
  const settingsSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: settingsSheetY.value }],
  }));

  const openPfpPicker = async () => {
    setPfpPickerVisible(true);
    pfpSheetY.value = withTiming(0, { duration: 300 });
    setPfpPostsLoading(true);
    try {
      const fetched = await api.getPostsByUser(user?.id, token, user?.id);
      setPfpPosts(fetched);
    } catch {
    } finally {
      setPfpPostsLoading(false);
    }
  };

  const handlePallette = () => {
    setSavedPallete([...colorPallete]);
    setEditPallete(true);
  };

  const handlePalletteCancel = () => {
    setColorPallete([...savedPallete]);
    setEditPallete(false);
  };

  const handlePalletteDone = async () => {
    await updateUser({ colorPalette: colorPallete });
    setEditPallete(false);
  };

  const handleColor = (props: ColorProp) => {
    const updated = [...colorPallete];
    updated[props.index] = selectedColor;
    setColorPallete(updated);
  };

  const enterEditMode = () => {
    setEditBio(user?.bio ?? '');
    setEditMode(true);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateUser({ bio: editBio });
      setEditMode(false);
    } finally {
      setSavingProfile(false);
    }
  };

  const openSettings = () => {
    setSettingsVisible(true);
    settingsSheetY.value = withTiming(0, { duration: 300 });
  };

  const closeSettings = () => {
    settingsSheetY.value = withTiming(SHEET_HEIGHT, { duration: 250 });
    setTimeout(() => setSettingsVisible(false), 260);
  };

  const closePfpPicker = () => {
    pfpSheetY.value = withTiming(SHEET_HEIGHT, { duration: 250 });
    setTimeout(() => setPfpPickerVisible(false), 260);
  };

  const handleSelectPfp = async (imageUrl: string) => {
    closePfpPicker();
    try {
      setUpdatingPfp(true);
      await updateUser({ profilePicture: imageUrl });
    } finally {
      setUpdatingPfp(false);
    }
  };

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

      await unlockSticker('FIRST_COMMENT', user?.stickers ?? [], updateUser);
    } finally {
      setSubmittingComment(false);
    }
  };
  
  const offset = useSharedValue<number>(0);
  const coverOffset = useSharedValue<number>(0);
  const [currentPage, setCurrentPage] = useState(0)
  const currentPageShared = useSharedValue(0);

  const nextPage = () => {
    setCurrentPage(p => 
      Math.min(p + 1, posts.length - 1))
  }

  const prevPage = () => {
    setCurrentPage(p => 
      Math.max(p - 1, 0)
    )
  }

  const imagePercent = .60
  const translateX = useSharedValue(0)

  const pan = Gesture.Pan()
    .onChange((event) => {
      offset.set((value) => value += event.translationX*0.8) ;
      offset.set((value) => value =  Math.min(0, Math.max(-92, offset.value))); 
    })

    .onFinalize((event) => {
      if (offset.get() < -80) return; 

      offset.set((value) => withDecay({
        velocity: event.velocityX * 0.3,
        rubberBandEffect: true,
        clamp: [-92,0],
      }))
    })

    .onEnd(() => {
      if (offset.get() < -45 && offset.get() > -125 && currentPageShared.get() < posts.length - 1 && currentPageShared.get() !== posts.length) {    
        fade.value = withTiming(0, {duration: 300})
        offset.value = withTiming(-90, { duration: 100 }, (finished) => {
        fade.value = withTiming(1, {duration: 320})
        scheduleOnRN(nextPage);
        currentPageShared.set(value => value + 1);
        setTimeout(() => {
          offset.set(0);
        }, 250);
      });
      } else if (offset.get() > -90 && currentPageShared.value > 0 && currentPageShared.value !== posts.length && currentPageShared.value !== posts.length) {
        currentPageShared.value -= 1;
        offset.set(withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          scheduleOnRN(prevPage);
        }})) 
      } else if (offset.get() === 0 && currentPageShared.value === 0) {
        offset.set(withTiming(0, { duration: 0 }));
        coverOffset.value = withSpring(0, { duration: 300 })
      } else {
        offset.set(withTiming(0, { duration: 300 }));
      }
    })
    
  const lastPan = Gesture.Pan()
    .onChange((event) => {
      offset.set((value) => value += event.translationX*0.8) ;
      offset.set((value) => value =  Math.min(0, Math.max(-92, offset.value))); 
    })

    .onFinalize((event) => {
        if (offset.get() < -80) return; 

        offset.set((value) => withDecay({
          velocity: event.velocityX * 0.3,
          rubberBandEffect: true,
          clamp: [-92,0],
        }))
      })

    .onEnd(() => {
        if (offset.get() === 0 && currentPageShared.value === 0) {
          offset.set(withTiming(0, { duration: 0 }));
          coverOffset.value = withSpring(0, { duration: 300 })
        }
      })
    
  const animatedStyles = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{perspective: 6000}, {translateX: (-bookWidth/2)}, { rotateY: `${offset.value}deg`}, {translateX: bookWidth/2}],
    backfaceVisibility: 'hidden'
  }));

  const coverPan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })

    .onEnd(() => {
      if (coverOffset.value < -90 && currentPageShared.value < posts.length - 1) {
        coverOffset.value = withTiming(-109, { duration: 200 }, (finished) => {
          openBookCover.value = false
        });
      } 
    })

    .onChange((event) => {
      coverOffset.set((value) => value += event.changeX) ;
      coverOffset.set((value) => value =  Math.min(0, Math.max(-90.1, coverOffset.value))); 
    })

    .onFinalize((event) => {
      if (coverOffset.get() < -90) return; 
      coverOffset.set((value) => withDecay({
        velocity: event.velocityX * 0.3,
        rubberBandEffect: true,
        clamp: [-92,0],
      }))
    });

  const coverAnimatedStyles = useAnimatedStyle(() => ({
    transform: [{perspective: 6000}, {translateX: (-bookWidth/2)}, { rotateY: `${coverOffset.value}deg`}, {translateX: bookWidth/2}],  
    backfaceVisibility: 'hidden'
  }));  

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      setLoading(true);
      Promise.all([
        api.getPostsByUser(user.id, token, user.id),
        api.getUser(user.id),
      ])
        .then(([userPosts, fullUser]) => {
          setPosts(userPosts);
          setFollowerCount(fullUser._count?.followers ?? 0);
          setFollowingCount(fullUser._count?.following ?? 0);
          setColorPallete(fullUser?.colorPalette?.length ? fullUser.colorPalette : defaultPallette)
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    }, [user?.id, token])
  );
  
  if (error) return <Text>{error}</Text>;

  return (
    <View style={styles.main_container}>
      <View style={styles.profile_header}>
        <TouchableOpacity style={styles.profile_box} onPress={editMode ? openPfpPicker : undefined} disabled={updatingPfp || !editMode}>
          {updatingPfp ? (
            <ActivityIndicator />
          ) : user?.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={{ width: 92, height: 92 }} />
          ) : (
            <IconSymbol name="profile" color={"currentColor"}/>
          )}
          {editMode && (
            <View style={styles.pfpEditOverlay}>
              <Text style={styles.pfpEditText}>tap to{'\n'}edit</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.info_container}>
          <Text style={styles.username}>{user?.username ?? 'your profile'}</Text>
          <Text style={styles.texts}>{followerCount} followers · {followingCount} following</Text>
          {editMode ? (
            <TextInput
              style={[styles.texts, styles.bioInput]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Write a bio!"
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              autoFocus
            />
          ) : (
            <Text style={styles.texts}>{user?.bio ?? 'No bio yet!'}</Text>
          )}
          <View style={styles.action_container}>
            {editMode ? (
              <>
                <Pressable style={styles.action_button} onPress={handleSaveProfile} disabled={savingProfile}>
                  <Text style={styles.button_text}>{savingProfile ? '...' : 'Save'}</Text>
                </Pressable>
                <Pressable style={[styles.action_button, styles.action_button_cancel]} onPress={() => setEditMode(false)}>
                  <Text style={styles.button_text}>Cancel</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable style={styles.action_button} onPress={enterEditMode}>
                  <Text style={styles.button_text}>Edit Profile</Text>
                </Pressable>
                <Pressable style={styles.action_button} onPress={openSettings}>
                  <Text style={styles.button_text}>Settings</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.favorite_container}>
        <Pressable style={styles.sticker_container} onPress={() => router.push(`/sticker-collection/${user?.id}` as any)}>
          <Text style={[styles.texts, {textAlign: 'center' }]}>Sticker Collection</Text>
          <View style={styles.sticker_box}>
            {(user?.stickers ?? []).length === 0 ? (
              <>
                <View style={[styles.sticker, BORDER_FRAME, {backgroundColor: '#e0e0e0', opacity: 0.5}]} />
                <View style={[styles.sticker, BORDER_FRAME, {backgroundColor: '#e0e0e0', opacity: 0.5}]} />
              </>
            ) : (
              (user?.stickers ?? []).slice(0, 2).map((stickerId) => {
                const def = STICKER_DEFS.find(s => s.id === stickerId);
                if (!def) return null;
                return (
                  <View key={stickerId} style={[styles.sticker, BORDER_FRAME, {backgroundColor: '#ffffff'}]}>
                    <IconSymbol name={def.iconName as any} size={70} color={'currentColor'} />
                  </View>
                );
              })
            )}
          </View>
        </Pressable>

        <View style={styles.main_color}>
          <Text style={[styles.texts, {textAlign: 'center'}]}>Favorite Colors</Text>

          <Pressable onPress={handlePallette}>
            <View style={styles.pallete_box}>
              <View style={styles.color_pallette}>
                {colorPallete.map((item, index) => (
                  <View key={index} style={[ styles.color_box, BORDER_FRAME, { backgroundColor: item }]}/>
                ))}
              </View>
            </View>
          </Pressable>

          <Modal style={styles.pallete_modal} visible={EditPallete} transparent animationType="none" >
            <View style={styles.pallete_edit}>
              <Text style={{fontFamily: 'ms', marginBottom: 10}}> Pick a color then click the square to fill in the color </Text>
              <View style={styles.small_pallete_edit}>
                {colorPallete.map((item, index) => (
                  <Pressable key={index} onPress={() => handleColor({color: item, index})} style={[ styles.color_box, BORDER_FRAME, { backgroundColor: item , width: 70, height: 70, margin: 10 }]}/>  
                ))}
              </View>

              <View style={{ width: '100%' }}>
                  <DefaultColorPanel value={selectedColor} onColorChange={setSelectedColor}/>
              </View>
            
              <View style={styles.button_row}>
                <Pressable onPress={handlePalletteCancel} style={[styles.actionButton, {backgroundColor: '#fff396', padding: 15, width: '30%', alignSelf: 'center', justifyContent: 'center', alignItems: 'center'}]}>
                  <Text>Cancel</Text>
                </Pressable>
                <Pressable onPress={handlePalletteDone} style={[styles.actionButton, {backgroundColor: '#998be8', padding: 15, width: '30%', alignSelf: 'center', justifyContent: 'center', alignItems: 'center'}]}>
                  <Text style={{fontFamily: 'ms'}}>Done</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </View>
      </View>


    <GestureHandlerRootView style={styles.container}>
      <View style={styles.book_container}>
        {loading && <ActivityIndicator size="large" />}
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
        
        <GestureDetector key={'last'} gesture={lastPan}>
          <View style={[styles.page, {width: bookWidth, alignSelf: 'center', alignItems: 'center'}]}>
            <View style={styles.last_page}>
              {posts.length === 0 && !loading && (<Text style={styles.no_post}>No pix in sketchbook yet!</Text>)}
            </View>
          </View>
        </GestureDetector>

        {posts.slice(0, 100).map((item, index) => {
          const isLast = index === currentPage;
          const isPrev = index === currentPage - 1;
          const isTop = index === currentPage;
          const isNext = index === currentPage;
          
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
                <Text style={{fontFamily: 'ms', fontSize: 17, justifyContent: 'flex-start', width: wid*imagePercent, marginTop: 5, maxHeight: 110}}>{item.content ?? JSON.stringify(item)}</Text>

                <View style={[styles.post_action_box, {width: wid*imagePercent}]}>
                  <View style={styles.color_row}>
                    {(item.colors ?? []).map((color: string, i: number) => (
                      <View key={`${item.id}${color}${i}`} style={[BORDER_FRAME, styles.color_box_post, { backgroundColor: color ?? "#ffffff" }]} />
                    ))}
                  </View>

                  <View style={styles.interact_box}>
                  <TouchableOpacity onPress={() => handleToggleLike(item.id)} style={styles.actionButton}>
                    <View style={styles.like_and_count}>
                      <IconSymbol
                        name={item.likedByMe ? 'liked' : 'like'}
                        color={'currentColor'}
                        size={24}
                      />
                      {item.showLikes && (<Text style={[styles.num_likes, {color: item.likedByMe ? '#ffffff' : '#ff004d'}]}>{(item._count?.likes ?? 0)}</Text>)}
                    </View>
                    
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

      <Modal visible={settingsVisible} transparent animationType="none" onRequestClose={closeSettings}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity style={[StyleSheet.absoluteFillObject, styles.pickerOverlay]} activeOpacity={1} onPress={closeSettings} />
          <Animated.View style={[styles.modalSheet, settingsSheetStyle, { height: undefined }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={closeSettings} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.settingsRow} onPress={logout}>
              <Text style={styles.settingsLogout}>Log Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsRow} onPress={closeSettings}>
              <Text style={styles.settingsCancel}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={pfpPickerVisible} transparent animationType="none" onRequestClose={closePfpPicker}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity style={[StyleSheet.absoluteFillObject, styles.pickerOverlay]} activeOpacity={1} onPress={closePfpPicker} />
          <Animated.View style={[styles.modalSheet, pfpSheetStyle]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose your profile picture</Text>
              <TouchableOpacity onPress={closePfpPicker} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            {pfpPostsLoading ? (
              <ActivityIndicator style={{ marginTop: 24 }} />
            ) : (
              <FlatList
                data={pfpPosts}
                keyExtractor={(item) => String((item as any).id ?? (item as any)._id)}
                numColumns={3}
                contentContainerStyle={{ gap: 4 }}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => handleSelectPfp(item.imageUrl)}>
                    <Image source={{ uri: item.imageUrl }} style={styles.pickerThumb} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No posts yet</Text>}
              />
            )}
          </Animated.View>
        </View>
      </Modal>
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
    marginTop: 80,
    flexDirection: 'row',
    paddingLeft: 30,
    paddingRight: 30,
    width: '100%',
  },
  profile_box: {
    height: 110,
    width: 110,
    padding: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
    textAlign: 'center',
    fontFamily: 'ms',
  },
  username: {
    fontSize: 25,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'ms',
  },
  texts: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 5,
    fontFamily: 'ms',
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
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: 75,
    width: 75,
  },
  pallete_box: {
    backgroundColor: '#d0d0d0',
    height: 75,
    width: 110,
    justifyContent: 'center',
    alignContent: 'center'
  },

  color_pallette: {
    display: 'flex',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center'
  },
  color_box: {
    display: 'flex',
    flexWrap: 'wrap',
    height: 28,
    width: 28,
    margin: 2,
  },
  color_box_post: {
    height: 28,
    width: 28,
    margin: 2,
    justifyContent: 'center',
    alignContent: 'center',
    alignSelf: 'center',
  },
  color_box_edit: {
    height:80,
    width: 80,
    margin: 5,
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
    height: bookHeight,
    borderRadius: 20,
    backgroundColor: '#fff8ce',
    borderWidth: 6,
    borderColor: '#3c0404',
  },
  page_cover: {
    position: 'absolute',
    height: bookHeight,
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
    alignItems: 'center',
  },
  pickerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalSheet: {
    height: SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopWidth: 2,
    borderTopColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#5174CF',
    marginHorizontal: -16,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
    fontFamily: 'ms',
  },
  closeBtn: {
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: '#7f9fe0',
    borderLeftColor: '#7f9fe0',
    borderRightColor: '#3a5499',
    borderBottomColor: '#3a5499',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#5174CF',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
    fontFamily: 'ms',
  },
  pickerThumb: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#888',
    fontSize: 14,
    fontFamily: 'ms',
  },  
  commentsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  commentsContainer: {
    height: '40%',
    backgroundColor: '#ececec',
    padding: 30,
  },
  commentsList: {

  },
  commentRow: {
    flexDirection: 'row',
    gap: 40,
  },
  commentAuthor: {
    fontWeight: '800',
    fontFamily: 'ms',
  },
  commentBody: {
    fontFamily: 'ms',
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
  },
  action_button_cancel: {
    backgroundColor: '#888',
  },
  bioInput: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 2,
    marginBottom: 5,
    color: '#ffffff',
  },
  pfpEditOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pfpEditText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'ms',
  },
  settingsRow: {
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  settingsLogout: {
    fontSize: 16,
    color: '#e02020',
    fontFamily: 'ms',
  },
  settingsCancel: {
    fontSize: 16,
    color: '#555',
    fontFamily: 'ms',
  },
  pallete_edit: {
    marginTop: 200,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center', 
    alignSelf: 'center',
    backgroundColor: '#ffc5e7',
    paddingTop: 30,
    width: '83%',
    height: 500
  },
  small_pallete_edit: {
    backgroundColor: '#6260c392',
    display: 'flex',
    width: 300,
    height: 200,
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center'
  }, 
  pallete_modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center'
  },
  button_row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  num_likes: {
    fontFamily: 'ms',
    position: 'absolute',
    fontSize: 9,
  },
  like_and_count: {
    position: 'relative',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -7,
    marginLeft: -3,
  },
  no_post: {
    fontFamily: 'ms',
    fontSize: 25,
    alignSelf: 'center'
  },
  last_page: {
    width: '100%',    
    height: '100%',
    justifyContent: 'center',
    alignSelf: 'center'
  }
});

export default Profile;