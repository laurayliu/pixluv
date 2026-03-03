import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, Text, View, ActivityIndicator, Image } from 'react-native';
import { api } from '../../services/api';

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
      <FlatList
        data={posts.slice(0, 5)}
        keyExtractor={(item) => String(item.id ?? item._id)}
        renderItem={({ item }) => (
          <View>
            <Text>{item.title ?? item.caption ?? JSON.stringify(item)}</Text>
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: 200, height: 200 }}
            />
          </View>
        )}
        ListEmptyComponent={<Text>no posts yet</Text>}
      />
    </View>
  );
};

export default HomeScreen;
