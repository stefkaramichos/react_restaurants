import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
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
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const Dashboard = () => {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [persons, setPersons] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Admin form states
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantLocation, setRestaurantLocation] = useState('');
  const [restaurantDescription, setRestaurantDescription] = useState('');

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedToken = await AsyncStorage.getItem('authToken');
      const adminFlag = await AsyncStorage.getItem('isAdmin');

      if (!storedUserId || !storedToken) {
        router.push('/login');
        return;
      }

      setUserId(storedUserId);
      setToken(storedToken);
      setIsAdmin(adminFlag === 'true');
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch('http://localhost:3000/restaurants');
        const data = await res.json();
        setRestaurants(data);
      } catch {
        showAlert('Error', 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:3000/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUsers(data);
      } catch {
        showAlert('Error', 'Failed to fetch users');
      }
    };

    if (token) {
      fetchRestaurants();
      if (isAdmin) fetchUsers();
    }
  }, [token, isAdmin]);

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const isValidDate = (str) => /^\d{2}\/\d{2}\/\d{4}$/.test(str);
  const isValidTime = (str) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(str);

  const handleSubmit = async () => {
    if (!restaurantId || !date || !time || !persons || (isAdmin && !selectedUserId)) {
      showAlert('Missing Info', 'Please fill in all fields');
      return;
    }

    if (!isValidDate(date)) {
      showAlert('Invalid Date', 'Date must be in DD/MM/YYYY format');
      return;
    }

    if (!isValidTime(time)) {
      showAlert('Invalid Time', 'Time must be in HH:MM format (24h)');
      return;
    }

    if (!/^\d+$/.test(persons) || parseInt(persons, 10) <= 0) {
      showAlert('Invalid People Count', 'Number of persons must be a positive number');
      return;
    }

    const formattedDate = date.split('/').reverse().join('-');

    const reservation = {
      user_id: isAdmin ? selectedUserId : userId,
      restaurant_id: restaurantId,
      date: formattedDate,
      time,
      people_count: parseInt(persons, 10),
    };

    try {
      const response = await fetch('http://localhost:3000/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reservation),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Something went wrong');

      showAlert('Success', '🎉 Reservation created!');
      setDate('');
      setTime('');
      setPersons('');
      setRestaurantId('');
      setSelectedUserId('');
    } catch (err) {
      console.error('Reservation error:', err);
      showAlert('Error', err.message);
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    try {
      const res = await fetch(`http://localhost:3000/restaurants/${restaurantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
  
      const result = await res.json();
  
      if (!res.ok) throw new Error(result.error || 'Failed to delete restaurant');
  
      showAlert('Success', result.message || 'Restaurant deleted');
      setRestaurants((prev) => prev.filter(r => r.restaurant_id !== restaurantId));
    } catch (err) {
      console.error('Delete error:', err);
      showAlert('Error', err.message);
    }
  };

  const handleCreateRestaurant = async () => {
    if (!restaurantName || !restaurantLocation || !restaurantDescription) {
      showAlert('Missing Info', 'Please fill out all restaurant fields.');
      return;
    }

    const restaurant = {
      name: restaurantName,
      location: restaurantLocation,
      description: restaurantDescription,
    };

    try {
      const res = await fetch('http://localhost:3000/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(restaurant),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create restaurant');

      showAlert('Success', '🏠 New restaurant added!');
      setRestaurantName('');
      setRestaurantLocation('');
      setRestaurantDescription('');
      setRestaurants((prev) => [...prev, data]);
    } catch (err) {
      console.error('Create restaurant error:', err);
      showAlert('Error', err.message);
    }
  };

  const searchRestaurants = async () => {
    if (!searchQuery.trim()) {
      showAlert('Search', 'Please enter a search term.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/restaurants/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setRestaurants(data);
      setIsSearching(true);
    } catch {
      showAlert('Error', 'Failed to search restaurants.');
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = async () => {
    setSearchQuery('');
    setIsSearching(false);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/restaurants');
      const data = await res.json();
      setRestaurants(data);
    } catch {
      showAlert('Error', 'Failed to reload restaurants.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.push('/login');
  };

  return (
    <View style={{ flex: 1, paddingBottom: 30 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.centeredContainer}>
        
          <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search restaurants..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <View style={styles.searchActions}>
                <Button title="Search" onPress={searchRestaurants} />
                {isSearching && <Button title="Reset" onPress={resetSearch} color="gray" />}
              </View>
          </View>
          

          {isSearching && restaurants.length > 0 && (
          <View style={styles.resultList}>
            <Text style={styles.resultHeader}>🔍 Search Results</Text>
            {restaurants.map((rest) => (
              <View key={rest.restaurant_id} style={styles.resultItem}>
                <Text style={styles.resultLabel}><Text style={styles.resultKey}>Name:</Text> {rest.name}</Text>
                <Text style={styles.resultLabel}><Text style={styles.resultKey}>Location:</Text> {rest.location}</Text>
                <Text style={styles.resultLabel}><Text style={styles.resultKey}>Description:</Text> {rest.description}</Text>

                {isAdmin && (
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: 'darkred', marginTop: 10 }]}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }} onPress = { () =>  handleDeleteRestaurant(rest.restaurant_id)}>
                      Delete Restaurant
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}


          <Text style={styles.title}>Make a Reservation</Text>

          <View style={styles.form}>
            {isAdmin && (
              <Picker
                selectedValue={selectedUserId}
                onValueChange={setSelectedUserId}
                style={styles.input}
              >
                <Picker.Item label="Select User" value="" />
                {users.map((u) => (
                  <Picker.Item key={u.user_id || u.id} label={u.name} value={u.user_id || u.id} />
                ))}
              </Picker>
            )}

            {loading ? (
              <ActivityIndicator size="large" color="#000" />
            ) : (
              <Picker
                selectedValue={restaurantId}
                onValueChange={setRestaurantId}
                style={styles.input}
              >
                <Picker.Item label="Select Restaurant" value="" />
                {restaurants.map((r) => (
                  <Picker.Item
                    key={r.restaurant_id}
                    label={`${r.name} (${r.location})`}
                    value={r.restaurant_id}
                  />
                ))}
              </Picker>
            )}

            <TextInput
              style={styles.input}
              placeholder="Date (DD/MM/YYYY)"
              value={date}
              onChangeText={setDate}
              keyboardType="numbers-and-punctuation"
            />

            <TextInput
              style={styles.input}
              placeholder="Time (HH:MM)"
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

          {isAdmin && (
            <View style={styles.form}>
              <Text style={styles.title}>Add New Restaurant</Text>

              <TextInput
                style={styles.input}
                placeholder="Restaurant Name"
                value={restaurantName}
                onChangeText={setRestaurantName}
              />
              <TextInput
                style={styles.input}
                placeholder="Location"
                value={restaurantLocation}
                onChangeText={setRestaurantLocation}
              />
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={restaurantDescription}
                onChangeText={setRestaurantDescription}
              />

              <View style={styles.button}>
                <Button title="Create Restaurant" onPress={handleCreateRestaurant} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => { setActiveTab('my-reservations'); router.push('/my-reservations'); }}>
          <Ionicons name="home" size={28} color={activeTab === 'my-reservations' ? '#0051ff' : '#007aff'} style={[styles.footerIcon, activeTab === 'my-reservations' && styles.activeTab]} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setActiveTab('dashboard'); router.push('/dashboard'); }}>
          <Ionicons name="calendar" size={28} color={activeTab === 'dashboard' ? '#0051ff' : '#007aff'} style={[styles.footerIcon, activeTab === 'dashboard' && styles.activeTab]} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setActiveTab('settings'); router.push('/settings'); }}>
          <Ionicons name="settings" size={28} color={activeTab === 'settings' ? '#0051ff' : '#007aff'} style={[styles.footerIcon, activeTab === 'settings' && styles.activeTab]} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="red" style={styles.footerIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  centeredContainer: { alignSelf: 'center', maxWidth: 400, width: '100%' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  form: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: 30,
  },
  resultList: {
    marginBottom: 20,
  },
  resultHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  resultItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultLabel: {
    fontSize: 16,
    marginBottom: 4,
    color: '#444',
  },
  resultKey: {
    fontWeight: 'bold',
    color: '#222',
  },
  
  
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
  button: { marginTop: 10, marginBottom: 20 },
  searchBox: { marginBottom: 20 },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  searchActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  footerIcon: { padding: 10 },
  activeTab: { backgroundColor: '#e0f0ff', borderRadius: 10 },
});

export default Dashboard;
