import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { api } from '../../services/api';

type Challenge = {
  id: string;
  date: string;
  prompt: string;
  allowedColors: string[];
};

export default function Challenge() {
  const [todayColors, setTodayColors] = useState<string[]>([]);
  const [pastChallenges, setPastChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    api.getTodayChallenge()
      .then((c: any) => {
        if (c.allowedColors?.length) setTodayColors(c.allowedColors);
      })
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text>today&apos;s challenge</Text>

      <View style={styles.swatches}>
        {todayColors.map((color) => (
          <View key={color} style={[styles.swatch, { backgroundColor: color }]} />
        ))}
      </View>

      <Link href="/drawing_challenge" asChild>
        <Pressable><Text>draw</Text></Pressable>
      </Link>

      <Text>past challenges</Text>
      {pastChallenges.map((c) => (
        <View key={c.id} style={styles.pastChallenge}>
          <Text>{new Date(c.date).toLocaleDateString()}</Text>
          <Text>{c.prompt}</Text>
          <View style={styles.swatches}>
            {c.allowedColors.map((color) => (
              <View key={color} style={[styles.swatch, { backgroundColor: color }]} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  swatch: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  pastChallenge: {
    alignItems: 'center',
    gap: 8,
  },
});
