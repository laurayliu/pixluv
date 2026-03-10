import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function UserProfile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { token, user: me } = useAuth();
  const [profile, setProfile] = useState<{ username: string; profilePicture?: string; bio?: string; _count?: { followers: number; following: number } } | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      api.getUser(userId),
      api.getPostsByUser(userId, token),
      api.getFollowers(userId).catch(() => []),
    ])
      .then(([user, userPosts, followers]) => {
        setProfile(user);
        setPosts(userPosts);
        setFollowerCount(user._count?.followers ?? followers.length);
        if (me?.id) {
          setIsFollowing(followers.some((f: any) => f.id === me.id));
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId, token]);

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

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 80 }} />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;

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

      <View style={styles.book_container}>
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
      </View>
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
  action_button: {
    justifyContent: 'center',
    height: 33,
    width: '48%',
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
    textAlign: 'center',
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
});
