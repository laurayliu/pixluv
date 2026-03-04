import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

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
  const { token, user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

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

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await api.sendPix(userId, text, undefined, token);
      setInputText('');
      await fetchMessages();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
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
        <IconSymbol name="profile_frame" size={40} color="#5F574F" />
        <Text style={styles.topUsername}>{username}</Text>
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
                      {showAvatar && <IconSymbol name="profile_frame" size={24} color="#5F574F" />}
                    </View>
                  )}
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
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
          <TouchableOpacity style={styles.paletteBtn}>
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
  topUsername: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
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
    marginRight: 4,
  },
  bubble: {
    maxWidth: '70%',
    borderRadius: 8,
    padding: 8,
  },
  bubbleMine: {
    backgroundColor: '#FF77A8',
  },
  bubbleTheirs: {
    backgroundColor: '#F0F0F0',
  },
  bubbleText: {
    fontSize: 16,
    color: '#000',
  },
  pixelArtImage: {
    width: 200,
    height: 200,
    marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
    color: '#000',
  },
  sendBtn: {
    padding: 4,
  },
});