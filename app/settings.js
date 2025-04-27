import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const Settings = () => {
  const router = useRouter();
  const [userData, setUserData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    const loadUserData = async () => {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUserId = await AsyncStorage.getItem('userId');

      if (!storedToken || !storedUserId) {
        router.push('/login');
        return;
      }

      setToken(storedToken);
      setUserId(storedUserId);

      try {
        const response = await fetch(`http://localhost:3000/users/${storedUserId}`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        const data = await response.json();
        const user = data[0]; // 🎯 Fix: API returns array

        setUserData({
          name: user?.name || '',
          email: user?.email || '',
        });
      } catch (error) {
        showAlert('Error', 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`http://localhost:3000/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      showAlert('Success', 'Profile updated!');
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.push('/login');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.centeredContainer}>
          <Text style={styles.title}>Settings</Text>

          <View style={styles.form}>
            {loading ? (
              <ActivityIndicator size="large" color="#000" />
            ) : (
              <>
                <Text style={styles.textName}>Change your name:</Text>
                <TextInput
                  style={styles.input}
                  value={userData.name}
                  onChangeText={(text) => setUserData({ ...userData, name: text })}
                  placeholder="Name"
                />

                <Text style={styles.textEmail}>Change your email:</Text>
                <TextInput
                  style={styles.input}
                  value={userData.email}
                  onChangeText={(text) => setUserData({ ...userData, email: text })}
                  placeholder="Email"
                />
                <View style={styles.button}>
                  <Button title="Save Changes" onPress={handleSubmit} />
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => {
            setActiveTab('my-reservations');
            router.push('/my-reservations');
          }}
        >
          <Ionicons
            name="home"
            size={28}
            color={activeTab === 'my-reservations' ? '#0051ff' : '#007aff'}
            style={[styles.footerIcon, activeTab === 'my-reservations' && styles.activeTab]}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('dashboard');
            router.push('/dashboard');
          }}
        >
          <Ionicons
            name="calendar"
            size={28}
            color={activeTab === 'dashboard' ? '#0051ff' : '#007aff'}
            style={[styles.footerIcon, activeTab === 'dashboard' && styles.activeTab]}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('settings');
            router.push('/settings');
          }}
        >
          <Ionicons
            name="settings"
            size={28}
            color={activeTab === 'settings' ? '#0051ff' : '#007aff'}
            style={[styles.footerIcon, activeTab === 'settings' && styles.activeTab]}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="red" style={styles.footerIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  textName: {
    marginBottom: 10,
    marginLeft: 2,
    color: 'rgb(135, 135, 135)'
  },
  centeredContainer: {
    alignSelf: 'center',
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  textEmail: {
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 2,
    color: 'rgb(135, 135, 135)'
  },
  form: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
  button: {
    marginTop: 10,
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    zIndex: 999,
  },
  footerIcon: {
    padding: 10,
  },
  activeTab: {
    backgroundColor: '#e0f0ff',
    borderRadius: 10,
  },
});

export default Settings;
