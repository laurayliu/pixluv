import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, Image, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { unlockSticker } from '@/utils/unlockSticker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 48) / 3;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.5;

type Message = {
  id: string;
  message?: string;
  imageUrl?: string;
  createdAt: string;
  senderId: string;
  receiverId: string;
  sender: { username: string };
};

export default function PixingThread() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { token, user, updateUser } = useAuth();

  const [otherUserPfp, setOtherUserPfp] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [userPosts, setUserPosts] = useState<{ id: string; imageUrl: string }[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const listRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const fetchMessages = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.getConversation(userId, token);
      setMessages(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!userId) return;
    api.getUser(userId).then((u: any) => {
      if (u?.profilePicture) setOtherUserPfp(u.profilePicture);
    }).catch(() => {});
  }, [userId]);

  const openPicker = async () => {
    setPickerVisible(true);
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    setPostsLoading(true);
    try {
      const posts = await api.getPostsByUser(user?.id, token);
      setUserPosts(posts);
    } catch {
    } finally {
      setPostsLoading(false);
    }
  };

  const closePicker = () => {
    Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 250, useNativeDriver: true }).start(() => {
      setPickerVisible(false);
    });
  };

  const handleSelectDrawing = async (imageUrl: string) => {
    closePicker();
    await api.sendPix(userId, undefined, imageUrl, token);
    await fetchMessages();
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    await unlockSticker('SEND_PIX', user?.stickers ?? [], updateUser);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await api.sendPix(userId, text, undefined, token);
      setInputText('');
      await fetchMessages();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      await unlockSticker('SEND_PIX', user?.stickers ?? [], updateUser);
    } finally {
      setSending(false);
    }
  };

  const isFirstInGroup = (index: number) => {
    if (index === 0) return true;
    return messages[index - 1].senderId !== messages[index].senderId;
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="undo" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/profile/${userId}` as any)} style={styles.topUserInfo}>
          <ProfileAvatar imageUrl={otherUserPfp} size={40} />
          <Text style={styles.topUsername}>{username}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item, index }) => {
              const mine = item.senderId === user?.id;
              const showAvatar = !mine && isFirstInGroup(index);
              return (
                <View style={[styles.messageRow, mine ? styles.rowRight : styles.rowLeft]}>
                  {!mine && (
                    <View style={styles.avatarSlot}>
                      {showAvatar && (
                        <TouchableOpacity onPress={() => router.push(`/profile/${userId}` as any)}>
                          <ProfileAvatar imageUrl={otherUserPfp} size={24} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  <View style={[styles.bubble, !item.imageUrl && styles.bubbleWithText, !item.imageUrl && (mine ? styles.bubbleMine : styles.bubbleTheirs)]}>
                    {item.message ? <Text style={styles.bubbleText}>{item.message}</Text> : null}
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.pixelArtImage} />
                    ) : null}
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.paletteBtn} onPress={openPicker}>
            <IconSymbol name="palette_img" size={28} color="#FF77A8" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type your message"
            placeholderTextColor="#898989"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!sending}
          />
          <TouchableOpacity onPress={handleSend} disabled={sending} style={styles.sendBtn}>
            <IconSymbol name="send" size={28} color="#FF77A8" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={pickerVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closePicker}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={[StyleSheet.absoluteFillObject, styles.modalBackdrop]} activeOpacity={1} onPress={closePicker} />
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send your pix!</Text>
            <TouchableOpacity onPress={closePicker} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          {postsLoading ? (
            <ActivityIndicator style={{ marginTop: 24 }} />
          ) : userPosts.length === 0 ? (
            <Text style={styles.emptyText}>No drawings yet</Text>
          ) : (
            <FlatList
              data={userPosts}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.gridContent}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelectDrawing(item.imageUrl)}>
                  <Image source={{ uri: item.imageUrl }} style={styles.gridItem} />
                </TouchableOpacity>
              )}
            />
          )}
        </Animated.View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    width: '100%',
    height: 62,
    backgroundColor: '#FF77A8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  topUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topUsername: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    fontFamily:'ms',
  },
  messageList: {
    padding: 12,
    gap: 4,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 2,
    alignItems: 'flex-end',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  avatarSlot: {
    width: 28,
    alignItems: 'center',
    marginRight: 12,
  },
  bubble: {
    maxWidth: '70%',
  },
  bubbleWithText: {
    padding: 8,
    borderWidth: 2,
  },
  bubbleMine: {
    backgroundColor: '#FF77A8',
    borderTopColor: '#ffaacc',
    borderLeftColor: '#ffaacc',
    borderRightColor: '#cc4477',
    borderBottomColor: '#cc4477',
  },
  bubbleTheirs: {
    backgroundColor: '#F0F0F0',
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightColor: '#a0a0a0',
    borderBottomColor: '#a0a0a0',
  },
  bubbleText: {
    fontSize: 16,
    color: '#000',
    fontFamily:'ms',
  },
  pixelArtImage: {
    width: 200,
    height: 200,
    marginTop: 4,
    borderTopColor: '#c4c4c4',
    borderLeftColor: '#c4c4c4',
    borderBottomColor: '#e8e8e8',
    borderRightColor: '#e8e8e8',
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#a0a0a0',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#fff',
    gap: 8,
  },
  paletteBtn: {
    padding: 4,
  },
  input: {
    width: 273,
    height: 41,
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 10,
    fontSize: 16,
    fontFamily:'ms',
    color: '#000',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: '#a0a0a0',
    borderLeftColor: '#a0a0a0',
    borderRightColor: '#ffffff',
    borderBottomColor: '#ffffff',
  },
  sendBtn: {
    padding: 4,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalSheet: {
    height: '50%',
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
    backgroundColor: '#FF77A8',
    marginHorizontal: -16,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
    fontFamily:'ms',
  },
  closeBtn: {
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: '#ffaacc',
    borderLeftColor: '#ffaacc',
    borderRightColor: '#cc4477',
    borderBottomColor: '#cc4477',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FF77A8',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
    fontFamily:'ms',
  },
  gridContent: {
    gap: 4,
  },
  gridItem: {
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
    fontFamily:'ms',
  },
});