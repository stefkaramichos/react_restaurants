import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const Dashboard = () => {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [restaurantId, setRestaurantId] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [persons, setPersons] = useState('');
  const [loading, setLoading] = useState(true);

  // Load user ID and token from storage
  useEffect(() => {
    const loadUserData = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedToken = await AsyncStorage.getItem('authToken');
      if (!storedUserId || !storedToken) {
        router.push('/login');
        return;
      }
      setUserId(storedUserId);
      setToken(storedToken);
    };

    loadUserData();
  }, []);

  // Fetch restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch('http://localhost:3000/restaurants');
        const data = await res.json();
        setRestaurants(data);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        Alert.alert('Error', 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchRestaurants();
  }, [token]);

  const handleSubmit = async () => {
    if (!restaurantId || !date || !time || !persons) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }

    const reservation = {
      user_id: userId,
      restaurant_id: restaurantId,
      date,
      time,
      people_count: persons,
    };

    try {
      const response = await fetch('http://localhost:3000/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // optional
        },
        body: JSON.stringify(reservation),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      Alert.alert('Success', 'Reservation created!');
      setDate('');
      setTime('');
      setPersons('');
      setRestaurantId('');
    } catch (err) {
      console.error('Error creating reservation:', err);
      Alert.alert('Error', err.message);
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
          <Text style={styles.title}>Make a Reservation</Text>
  
          <View style={styles.form}>
            {loading ? (
              <ActivityIndicator size="large" color="#000" />
            ) : (
              <Picker
                selectedValue={restaurantId}
                onValueChange={(value) => setRestaurantId(value)}
                style={styles.input}
              >
                <Picker.Item label="Select Restaurant" value="" />
                {restaurants.map((rest) => (
                  <Picker.Item
                    key={rest.restaurant_id}
                    label={`${rest.name} (${rest.location})`}
                    value={rest.restaurant_id}
                  />
                ))}
              </Picker>
            )}
  
            <TextInput
              style={styles.input}
              placeholder="Date (dd/mm/yyyy)"
              value={date}
              onChangeText={setDate}
              keyboardType="numbers-and-punctuation"
            />
  
            <TextInput
              style={styles.input}
              placeholder="Time (hh:mm)"
              value={time}
              onChangeText={setTime}
              keyboardType="numbers-and-punctuation"
            />
  
            <TextInput
              style={styles.input}
              placeholder="Number of persons"
              value={persons}
              onChangeText={setPersons}
              keyboardType="numeric"
            />
  
            <View style={styles.button}>
              <Button title="Submit Reservation" onPress={handleSubmit} />
            </View>
          </View>
        </View>
      </ScrollView>
  

      <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.push('/my-reservations')}>
                <Ionicons name="home" size={28} color="#007aff" style={styles.footerIcon} />
              </TouchableOpacity>
      
              <TouchableOpacity onPress={() => router.push('/dashboard ')}>
                <Ionicons name="calendar" size={28} color="#007aff" style={styles.footerIcon} />
              </TouchableOpacity>
      
              <TouchableOpacity onPress={() => Alert.alert('Settings Pressed')}>
                <Ionicons name="settings" size={28} color="#007aff" style={styles.footerIcon} />
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
  logout: {
    marginTop: 20,
    alignItems: 'center',
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
  
});

export default Dashboard;
