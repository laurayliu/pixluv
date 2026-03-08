import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, Text, View, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { api } from '../../services/api';

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

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api.hello().then((data: any) => setHello(data.message ?? JSON.stringify(data)));
      api.getPosts()
        .then(setPosts)
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) return <ActivityIndicator size="large" />;
  if (error) return <Text>{error}</Text>;

  return (
    <View style={{ flex: 1 }}>
      {hello && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>test api connection: {hello}</Text>
        </View>
      )}
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
              <Text style={styles.caption}>{item.content ?? JSON.stringify(item)}</Text>
            </View>
          )}
          ListEmptyComponent={<Text>no posts yet</Text>}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  posts: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  post: {
    paddingBottom: 30,
    paddingHorizontal: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: '80%',
    marginBottom: 20,
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
  }
});

export default HomeScreen;
