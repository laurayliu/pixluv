import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { api } from '../../services/api';
import PaletteImg from '../../assets/icons/palette_img.svg';
import PencilIcon from '../../assets/icons/editor/pencil.svg';

type Challenge = {
  id: string;
  date: string;
  prompt: string;
  allowedColors: string[];
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}:`;
}

function ColorStack({ colors }: { colors: string[] }) {
  return (
    <View style={styles.colorStack}>
      {colors.map((color) => (
        <View key={color} style={[styles.colorBlock, { backgroundColor: color }]}>
          <Text style={styles.hexLabel}>{color}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ChallengeTab() {
  const router = useRouter();
  const [today, setToday] = useState<Challenge | null>(null);
  const [pastChallenges, setPastChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    api.getTodayChallenge()
      .then((c: any) => setToday(c))
      .catch(() => {});

    api.getChallenges()
      .then((challenges: Challenge[]) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const past = challenges
          .filter((c) => new Date(c.date).toISOString().split('T')[0] !== todayStr)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPastChallenges(past);
      })
      .catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>#pixoftheday</Text>
      <Text style={styles.subtitle}>daily challenge!</Text>
      <View style={styles.divider} />

      {today && (
        <View style={styles.todayCard}>
          <Text style={[styles.cardDate, {textAlign: 'center'}]}>{formatDate(today.date)}</Text>
          <Text style={styles.cardPrompt}>{today.prompt}</Text>
          <View style={styles.cardRow}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
              <PaletteImg style={{marginTop: 20}} width={72} height={58} />
              <Text style={styles.colon}>:</Text>
            </View>
            <ColorStack colors={today.allowedColors} />
          </View>
          <Text style={styles.tagLine}>tag your creation: #pixoftheday</Text>
          <Link href="/drawing_challenge" asChild>
            <Pressable style={styles.drawButton}>
              <Text style={styles.drawButtonText}>draw it!</Text>
              <PencilIcon width={20} height={20} />
            </Pressable>
          </Link>
        </View>
      )}

      <Text style={styles.title}>see past creations!</Text>
      <View style={styles.divider} />

      {pastChallenges.map((c) => (
        <Pressable key={c.id} style={styles.card} onPress={() => router.push(`/challenge_submissions/${new Date(c.date).toISOString().split('T')[0]}`)}>
          <Text style={styles.cardDate}>{formatDate(c.date)}</Text>
          <View style={styles.cardRow}>
            <Text style={styles.pastPrompt}>{c.prompt}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
              <PaletteImg style={{marginTop: 15}} width={56} height={44} />
              <Text style={styles.colon}>:</Text>
            </View>
            <ColorStack colors={c.allowedColors} />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const CARD_COLOR = '#5174CF';
const TODAY_CARD_INNER = '#29ADFF';

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: '#FFF1E8',
  },
  container: {
    padding: 20,
    paddingTop: 60,
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
  todayCard: {
    backgroundColor: TODAY_CARD_INNER,
    borderWidth: 20,
    borderColor: CARD_COLOR,
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: CARD_COLOR,
    padding: 16,
    gap: 12,
  },
  cardDate: {
    fontSize: 18,
    fontFamily: 'PixelifySans_700Bold',
    color: '#1a1a1a',
  },
  cardPrompt: {
    fontSize: 18,
    fontFamily: 'PixelifySans_700Bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  colon: {
    fontSize: 20,
    fontFamily: 'PixelifySans_700Bold',
    color: '#1a1a1a',
  },
  colorStack: {
    flexDirection: 'column',
    gap: 0,
  },
  colorBlock: {
    width: 80,
    height: 28,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  hexLabel: {
    fontSize: 9,
    fontFamily: 'PixelifySans_400Regular',
    color: '#1a1a1a',
  },
  tagLine: {
    fontSize: 13,
    fontFamily: 'PixelifySans_700Bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  drawButton: {
    backgroundColor: CARD_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 8,
  },
  drawButtonText: {
    fontSize: 16,
    fontFamily: 'PixelifySans_700Bold',
    color: '#1a1a1a',
  },
  pastPrompt: {
    fontSize: 14,
    fontFamily: 'PixelifySans_700Bold',
    color: '#1a1a1a',
    flex: 1,
  },
});
