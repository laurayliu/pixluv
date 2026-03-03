import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.username}>{user?.username ?? 'your profile'}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>log out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff0f3',
    padding: 32,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d2b53',
    marginBottom: 6,
  },
  email: {
    fontSize: 14,
    color: '#ff6161',
    marginBottom: 40,
  },
  logoutButton: {
    borderWidth: 2,
    borderColor: '#ff6161',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  logoutText: {
    color: '#ff6161',
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default Profile;