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
} from 'react-native';
import { api } from '../../services/api';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';

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

import Logo from '@/assets/logo.svg';

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
          data={posts.slice(0, 5)}
          keyExtractor={(item) => String(item.id ?? item._id)}
          renderItem={({ item }) => (
            <View style={[BORDER_FRAME, styles.post]}>
              {/* <Text style = {styles.title}>{item.title ?? item.caption ?? JSON.stringify(item)}</Text> */}
              <Image
                source={{ uri: item.imageUrl }}
                style={[BORDER_FRAME, { width: 250, height: 250, marginTop: 15 }]}
              />
              <View style={styles.actionsRow}>
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
              <Text style={styles.caption}>{item.content ?? JSON.stringify(item)}</Text>
            </View>
          )}
          ListEmptyComponent={<Text>no posts yet!</Text>}
        />
      </View>
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
    marginTop: 10,
  },
  post: {
    paddingBottom: 30,
    paddingHorizontal: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: '80%',
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
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginLeft: -30,
  },
  actionButton: {
    margin: 5,
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
});

export default HomeScreen;
