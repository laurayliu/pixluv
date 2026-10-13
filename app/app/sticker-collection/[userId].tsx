import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { STICKER_DEFS, getStickerDef } from '@/constants/stickers';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function StickerCollection() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();

  const [stickers, setStickers] = useState<string[]>([]);
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const isOwnProfile = userId === user?.id;

  useEffect(() => {
    if (isOwnProfile) {
      setStickers(user?.stickers ?? []);
      setUsername(user?.username ?? '');
      setLoading(false);
    } else {
      api.getUser(userId)
        .then((data: any) => {
          setStickers(data?.stickers ?? []);
          setUsername(data?.username ?? '');
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [userId, isOwnProfile, user?.stickers, user?.username, user?.id]);

  const unlockedStickers = stickers
    .map((id) => getStickerDef(id))
    .filter(Boolean) as typeof STICKER_DEFS;

  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () =>
    setActiveIndex((i) => Math.min(unlockedStickers.length - 1, i + 1));

  const activeDef = unlockedStickers[activeIndex];

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <IconSymbol name="undo" size={24} color="#ffffff" />
      </TouchableOpacity>

      <View style={styles.centerContent}>
        <Text style={styles.headerTitle}>{username}&apos;s sticker collection</Text>

        <View style={styles.card}>
          {unlockedStickers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No stickers yet!{'\n'}Complete achievements to earn stickers
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.stickerDisplay}>
                <View style={styles.stickerScale}>
                  <IconSymbol
                    name={activeDef.iconName as any}
                    size={60}
                    color="currentColor"
                  />
                </View>
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity onPress={goPrev} disabled={activeIndex === 0}>
                  <IconSymbol
                    name="undo"
                    size={24}
                    color={activeIndex === 0 ? '#aaaaaa' : '#000000'}
                  />
                </TouchableOpacity>

                <Text style={styles.stickerLabel}>{activeDef.label}</Text>

                <TouchableOpacity
                  onPress={goNext}
                  disabled={activeIndex === unlockedStickers.length - 1}
                >
                  <IconSymbol
                    name="redo"
                    size={24}
                    color={
                      activeIndex === unlockedStickers.length - 1
                        ? '#aaaaaa'
                        : '#000000'
                    }
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.thumbnailRow}
                contentContainerStyle={styles.thumbnailContent}
              >
                {unlockedStickers.map((def, index) => (
                  <TouchableOpacity
                    key={def.id}
                    onPress={() => setActiveIndex(index)}
                    style={[
                      styles.thumbnail,
                      index === activeIndex && styles.thumbnailActive,
                    ]}
                  >
                    <IconSymbol
                      name={def.iconName as any}
                      size={48}
                      color="currentColor"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5174CF',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  headerTitle: {
    fontFamily: 'ms',
    fontSize: 25,
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFF1E8',
    width: 328,
    height: 473,
    paddingTop: 15,
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderBottomColor: '#aaaaaa',
    borderRightColor: '#aaaaaa',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'ms',
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 22,
  },
  stickerDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerScale: {
    transform: [{ scale: 4 }],
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  stickerLabel: {
    fontFamily: 'ms',
    fontSize: 15,
    color: '#000000',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  thumbnailRow: {
    width: '100%',
    flexGrow: 0,
  },
  thumbnailContent: {
    gap: 8,
  },
  thumbnail: {
    width: 64,
    height: 64,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#5174CF',
  },
});
