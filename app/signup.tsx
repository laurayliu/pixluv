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
        placeholderTextColor="#f9a8c9"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="email"
        placeholderTextColor="#f9a8c9"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="password"
        placeholderTextColor="#f9a8c9"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {loading ? (
        <ActivityIndicator color="#ee708f" style={styles.button} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>sign up</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => router.replace('/login')}>
        <Text style={styles.link}>Already have a Pixluv account? Log in!</Text>
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
    color: '#ee708f',
    marginBottom: 32,
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#ffb3c6',
    borderRadius: 4,
    padding: 12,
    marginBottom: 14,
    fontSize: 15,
    color: '#1d2b53',
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    backgroundColor: '#ee708f',
    borderRadius: 4,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
  link: {
    textAlign: 'center',
    color: '#ee708f',
    fontSize: 13,
  },
});