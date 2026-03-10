import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useAuth } from '@/context/AuthContext';
import BackIcon from '../../assets/icons/editor/undo.svg';

type Submission = { id: string; imageUrl: string; author: { username: string } };

export default function ChallengeSubmissions() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getChallengePosts(date, token)
      .then(({ posts }: { posts: Submission[]; hasSubmitted: boolean }) => setSubmissions(posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [date]);

  const mine = submissions.find(p => p.author.username === user?.username);
  const others = submissions.filter(p => p.author.username !== user?.username);

  return (
    <View style={{ flex: 1 }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <BackIcon width={24} height={24} />
      </Pressable>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.title}>#pixoftheday</Text>
        <Text style={styles.subtitle}>{formatDate(date)}</Text>
        <View style={styles.divider} />
        {loading ? (
          <ActivityIndicator color="#5174CF" />
        ) : submissions.length === 0 ? (
          <Text style={styles.empty}>no submissions for this challenge</Text>
        ) : (
          <>
            {mine && (
              <View style={styles.card}>
                <Text style={styles.yourLabel}>your submission:</Text>
                <Image source={{ uri: mine.imageUrl }} style={styles.image} />
              </View>
            )}
            {others.map(p => (
              <View key={p.id} style={styles.card}>
                <Text style={styles.username}>{p.author.username}</Text>
                <Image source={{ uri: p.imageUrl }} style={styles.image} />
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

const styles = StyleSheet.create({
  back: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  scroll: {
    backgroundColor: '#FFF1E8',
  },
  container: {
    padding: 20,
    paddingTop: 90,
    paddingBottom: 40,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: 'PixelifySans_700Bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'PixelifySans_400Regular',
    color: '#1a1a1a',
    marginTop: -6,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 4,
  },
  empty: {
    fontSize: 14,
    fontFamily: 'PixelifySans_400Regular',
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#5174CF',
    borderRadius: 4,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  yourLabel: {
    fontSize: 16,
    fontFamily: 'PixelifySans_700Bold',
    color: '#1a1a1a',
    alignSelf: 'flex-start',
  },
  username: {
    fontSize: 16,
    fontFamily: 'PixelifySans_700Bold',
    color: '#1a1a1a',
    alignSelf: 'flex-start',
  },
  image: {
    width: 200,
    height: 200,
  },
});
