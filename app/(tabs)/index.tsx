import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Keyboard
} from 'react-native';
import { api } from '../../services/api';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { useRouter } from 'expo-router';

import Logo from '@/assets/logo.svg';

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
    profilePicture?: string | null;
  };
};

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


const HomeScreen = () => {
  const [hello, setHello] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { token, user } = useAuth();
  const router = useRouter();

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api.hello().then((data: any) => setHello(data.message ?? JSON.stringify(data)));
      api.getPosts(user?.id ?? null, token)
        .then(setPosts)
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    }, [user?.id, token])
  );

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

  if (loading) return <ActivityIndicator size="large" />;
  if (error) return <Text>{error}</Text>;

  return (
      <View style={{ backgroundColor: '#fff', flex: 1 }}>
        {hello && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text>test api connection: {hello}</Text>
          </View>
        )}
        <View style = {{backgroundColor: '#ff77a8', paddingTop: 70}}>
          <Logo width={150} height={40} style={styles.logo} />
        </View>
      <View style={styles.posts}>
        <FlatList
          data={posts.slice(0, 10)}
          keyExtractor={(item) => String(item.id ?? item._id)}
          renderItem={({ item }) => (
            <View style={[BORDER_FRAME, styles.post]}>
              {/* <Text style = {styles.title}>{item.title ?? item.caption ?? JSON.stringify(item)}</Text> */}
              <View style={styles.imageRow}>
                <View style={styles.colorSwatches}>
                  {Array.from({length: 7}).map((_, i) => {
                    const color = item.colors?.[i] ?? "#ffffff";
                    return (
                      <View key={i} style={[BORDER_FRAME, styles.colorSwatch, { backgroundColor: color }]} />
                    );
                  })}
                </View>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={[BORDER_FRAME, styles.postImage]}
                />
              </View>
              <View style={styles.actionsRow}>
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => handleToggleLike(item.id)} style={styles.actionButton}>
                    <IconSymbol
                      name={item.likedByMe ? 'liked' : 'like'}
                      color={'currentColor'}
                      size={24}
                    />
                  </TouchableOpacity>
                  <View style={styles.commentBar}>
                    <TouchableOpacity onPress={() => openComments(item)} style={styles.actionButton}>
                      <IconSymbol
                        name={commentsVisible && activePost?.id === item.id ? 'commented' : 'comment'}
                        color={'currentColor'}
                        size={24}
                      />
                    </TouchableOpacity>
                    <Text style={styles.commentCount}>({(item._count?.comments ?? 0)})</Text>
                  </View>
                </View>
                <View style={styles.postAuthor}>
                  <ProfileAvatar imageUrl={item.author?.profilePicture} size={36} />
                  {item.author?.username && (
                    <Text style={styles.postUsername}>{item.author.username}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.caption}>{item.content ?? JSON.stringify(item)}</Text>
            </View>
          )}
          ListEmptyComponent={<Text>no posts yet!</Text>}
        />
      </View>
            <Modal visible={commentsVisible} animationType="fade" transparent={true} onRequestClose={closeComments}>
              <View style={styles.commentsOverlay}>
                <Pressable style={styles.backdrop} onPress={closeComments} />

                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView
                      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                              <ProfileAvatar imageUrl={item.user.profilePicture} size={28} />
                              <View>
                                <Text style={styles.commentAuthor}>{item.user.username}</Text>
                                <Text style={styles.commentBody}>{item.body}</Text>
                              </View>
                            </View>
                          )}
                          ListEmptyComponent={<Text style={{fontFamily:'ms',}}>be the first comment!</Text>}
                        />
                      )}

                      <View style={styles.commentInputRow}>
                        <TextInput
                          style={[BORDER_FRAME, styles.commentInput]}
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
                    </TouchableWithoutFeedback>
              </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  posts: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  post: {
    paddingBottom: 30,
    paddingHorizontal: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: '85%',
    marginBottom: 20,
    backgroundColor: '#ececec',
  },
  title: {
    paddingTop: 5,
    paddingBottom: 5,
    fontSize: 15,
  },
  caption: {
    paddingTop: 15,
    marginLeft: -30,
    alignSelf: 'flex-start',
    fontFamily:'ms',
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginHorizontal: -30,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: 5,
  },
  commentBar: {
    flexDirection: 'row',
  },
  commentCount: {
    fontFamily: 'ms',
    fontSize: 12,
    alignSelf: 'center',
    //marginTop: 7,
    marginLeft: -2.5,
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
    flex: 1,
    height: '50%',
    backgroundColor: '#ececec',
    padding: 30,
  },
  commentsList: {

  },
  postAuthor: {
    alignItems: 'center',
    marginTop: 10,
  },
  postUsername: {
    fontFamily: 'ms',
    fontSize: 13,
    marginTop: 3,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  commentAuthor: {
    fontWeight: '800',
    fontFamily:'ms',
  },
  commentBody: {
    fontFamily:'ms'
  },
  commentInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 10,
    marginBottom: 30,
  },
  commentInput: {
    padding: 8,
    flex: 0.8,
    backgroundColor: 'white',
    fontFamily:'ms',
  },
  commentSendButton: {
    flex: 0.15,
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 8,
  },
  colorSwatches: {
    flexDirection: 'column',
    gap: 4,
    paddingRight: 10,
  },
  colorSwatch: {
    width: 26,
    height: 26,
  },
  postImage: {
    width: 230,
    height: 230,
  },
});

export default HomeScreen;
