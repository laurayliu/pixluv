import React, { useCallback, useState } from 'react';
import {ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

type InboxEntry = {
  user: { id: string; username: string };
  latestMessage: { message?: string; imageUrl?: string; createdAt: string };
};

export default function PixingScreen() {
  const { token } = useAuth();
  const [inbox, setInbox] = useState<InboxEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setError(null);
      api.getInbox(token)
        .then(setInbox)
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    }, [token])
  );

  const preview = (entry: InboxEntry) => {
    if (entry.latestMessage.message) return entry.latestMessage.message;
    if (entry.latestMessage.imageUrl) return 'pixel art';
    return '';
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Pink header with search bar */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <IconSymbol name="search" size={16} color="#6B6B6B" />
          <Text style={styles.searchText}>Search</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Pixing</Text>

      {loading && <ActivityIndicator style={{ marginTop: 24 }} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={inbox}
        keyExtractor={(item) => item.user.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              router.push(`/pixing/${item.user.id}?username=${encodeURIComponent(item.user.username)}` as any)
            }
          >
            <View style={styles.avatarWrap}>
              <IconSymbol name="profile_frame" size={50} color="#5F574F" />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.username}>{item.user.username}</Text>
              <Text style={styles.previewText} numberOfLines={1}>
                {preview(item)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>No pixs yet</Text> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#FF77A8',
    paddingVertical: 16,
    paddingHorizontal: 23,
  },
  searchBar: {
    width: 356,
    height: 31,
    backgroundColor: '#fff',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
    alignSelf: 'center',
  },
  searchText: {
    color: '#6B6B6B',
    fontSize: 15,
  },
  sectionLabel: {
    color: '#000',
    fontSize: 12,
    marginLeft: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatarWrap: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  previewText: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 78,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 14,
  },
  errorText: {
    textAlign: 'center',
    color: '#ff6161',
    marginTop: 16,
    fontSize: 13,
  },
});