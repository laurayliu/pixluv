import React, { useEffect, useState } from 'react';
import { FlatList, Text, View, ActivityIndicator } from 'react-native';
import { api } from '../../services/api';

const HomeScreen = () => {
  const [hello, setHello] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.hello().then((data: any) => setHello(data.message ?? JSON.stringify(data)));
    api.getPosts()
      .then(setPosts)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
        data={posts}
        keyExtractor={(item) => String(item.id ?? item._id)}
        renderItem={({ item }) => (
          <View>
            <Text>{item.title ?? item.caption ?? JSON.stringify(item)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>no posts yet</Text>}
      />
    </View>
  );
};

export default HomeScreen;
