import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/assets/logo.svg';

export default function SignupScreen() {
  const { signup } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!username || !email || !password) {
      Alert.alert('missing fields', 'please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await signup(username, email, password);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('signup failed', 'could not create account, please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Logo width={220} height={63} style={styles.logo} />

      <Text style={styles.subtitle}>create your account</Text>

      <TextInput
        style={styles.input}
        placeholder="username"
        placeholderTextColor="#c090a0"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="email"
        placeholderTextColor="#c090a0"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="password"
        placeholderTextColor="#c090a0"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {loading ? (
        <ActivityIndicator color="#ee708f" style={styles.button} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleSignup} activeOpacity={0.8}>
          <Text style={styles.buttonText}>sign up</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => router.replace('/login')}>
        <Text style={styles.link}>already have an account? log in!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff0f3',
  },
  logo: {
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#cd477a',
    marginBottom: 32,
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: '#9d687c',
    borderLeftColor: '#9d687c',
    borderRightColor: '#ffffff',
    borderBottomColor: '#ffffff',
    padding: 12,
    marginBottom: 14,
    fontSize: 15,
    color: '#1d2b53',
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    backgroundColor: '#f3dde8',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightColor: '#ac6f86',
    borderBottomColor: '#9d687c',
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#1d2b53',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  link: {
    color: '#cd477a',
    fontSize: 13,
    letterSpacing: 1,
  },
});
