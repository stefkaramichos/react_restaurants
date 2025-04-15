import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MyReservations = () => {
  const router = useRouter();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const fetchReservations = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('authToken');

      if (!storedUserId || !token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`http://localhost:3000/reservations/${storedUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch reservations');
      }

      setReservations(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.card,
        {
          width: isDesktop ? (width - 80) / 3 : '90%',
          marginHorizontal: isDesktop ? 10 : 0,
        },
      ]}
    >
      <Text style={styles.cardTitle}>Reservation #{item.reservation_id}</Text>
      <View style={styles.cardRow}>
        <Ionicons name="restaurant" size={18} color="#444" />
        <Text style={styles.cardText}>Restaurant ID: {item.restaurant_id}</Text>
      </View>
      <View style={styles.cardRow}>
        <Ionicons name="calendar" size={18} color="#444" />
        <Text style={styles.cardText}>Date: {new Date(item.date).toDateString()}</Text>
      </View>
      <View style={styles.cardRow}>
        <Ionicons name="time" size={18} color="#444" />
        <Text style={styles.cardText}>Time: {item.time}</Text>
      </View>
      <View style={styles.cardRow}>
        <Ionicons name="people" size={18} color="#444" />
        <Text style={styles.cardText}>People: {item.people_count}</Text>
      </View>
    </View>
  );

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.push('/login');
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>My Reservations</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : reservations.length > 0 ? (
          <FlatList
            data={reservations}
            keyExtractor={(item) => item.reservation_id.toString()}
            renderItem={renderItem}
            numColumns={isDesktop ? 3 : 1}
            contentContainerStyle={{
              paddingBottom: 100,
              paddingHorizontal: 10,
              alignItems: isDesktop ? 'flex-start' : 'center',
            }}
          />
        ) : (
          <Text style={styles.noData}>No reservations found.</Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/my-reservations')}>
          <Ionicons name="home" size={28} color="#007aff" style={styles.footerIcon} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/dashboard')}>
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
  container: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#333',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#444',
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

export default MyReservations;
