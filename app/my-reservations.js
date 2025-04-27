import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';

const MyReservations = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-reservations');
  const { width } = useWindowDimensions();
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [filteredReservations, setFilteredReservations] = useState([]);

  const isDesktop = width >= 768;

  const fetchReservations = async () => {
    try {
      setLoading(true);
  
      const storedUserId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('authToken');
      const adminFlag = await AsyncStorage.getItem('isAdmin');
  
      if (!storedUserId || !token) {
        router.push('/login');
        return;
      }
  
      const isAdmin = adminFlag === 'true';
      setIsAdmin(isAdmin);
      const url = isAdmin
        ? 'http://localhost:3000/reservations' // Admin: get all
        : `http://localhost:3000/reservations/${storedUserId}`; // Normal user: get only their own
  
      const res = await fetch(url, {
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
      setFilteredReservations(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchReservations);
    return unsubscribe;
  }, [navigation]);


  const handleFilter = () => {
    const query = filterQuery.toLowerCase();
  
    const results = reservations.filter(item =>
      item.name?.toLowerCase().includes(query) || // user's name
      item.restaurant_name?.toLowerCase().includes(query) ||
      new Date(item.date).toLocaleDateString('el-GR').includes(query)
    );
  
    setFilteredReservations(results);
  };
  
  const handleDelete = async (reservation_id) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`http://localhost:3000/reservations/reservation/${reservation_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Failed to delete reservation');

      Alert.alert('Success', result.message || 'Reservation deleted');
      fetchReservations();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message);
    }
  };

  const renderItem = ({ item }) => {
    const reservationDate = new Date(item.date);
    const isPast = reservationDate < new Date(); // check if it's in the past
  
    return (
     
      <View
        style={[
          styles.card,
          {
            width: isDesktop ? (width - 120) / 3 : '100%',
            marginHorizontal: isDesktop ? 10 : 0,
            backgroundColor: isPast ? '#f0f0f0' : '#ffffff', // change card color
          },
        ]}
      >
        <Text style={styles.cardTitle}>Reservation #{item.reservation_id}</Text>
  
        <View style={styles.cardRow}>
          <Ionicons name="restaurant" size={18} color="#444" />
          <Text style={styles.cardText}>Restaurant: {item.restaurant_name}</Text>
        </View>
  
        <View style={styles.cardRow}>
          <Ionicons name="calendar" size={18} color="#444" />
          <Text style={styles.cardText}>
            Date: {new Date(item.date).toLocaleDateString('el-GR', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </Text>
        </View>
  
        <View style={styles.cardRow}>
          <Ionicons name="time" size={18} color="#444" />
          <Text style={styles.cardText}>Time: {item.time}</Text>
        </View>
  
        <View style={styles.cardRow}>
          <Ionicons name="people" size={18} color="#444" />
          <Text style={styles.cardText}>People: {item.people_count}</Text>
        </View>

        <View style={styles.cardRow}>
          <Text style={[styles.cardText, {fontWeight : 800}]}>{item.name}</Text>
        </View>
  
        {!isPast && (
          <>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() =>
                navigation.navigate('EditReservation', { reservation_id: item.reservation_id })
              }
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
  
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() =>
                Alert.alert(
                  'Delete Reservation',
                  'Are you sure you want to delete this reservation?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => handleDelete(item.reservation_id),
                    },
                  ]
                )
              }
            >
              <Text style={styles.editButtonText} onPress = { () => handleDelete(item.reservation_id) }>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };
  

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.push('/login');
  };

  return (
    <View style={{ flex: 1, overflowY: 'auto' }}>
      <View style={styles.container}>
        <Text style={styles.title}>My Reservations</Text>

        {isAdmin && (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>
        Filter Reservations
      </Text>
      <TextInput
        placeholder="Search by user, restaurant typing ..."
        value={filterQuery}
        onChangeText={(text) => {
          setFilterQuery(text);
          handleFilter();
        }}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          borderRadius: 8,
          marginBottom: 10,
          backgroundColor: '#fff',
        }}
      />
    </View>
  )}

        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : reservations.length > 0 ? (
          <FlatList
            data={isAdmin ? filteredReservations : reservations}
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
            style={[
              styles.footerIcon,
              activeTab === 'my-reservations' && styles.activeTab,
            ]}
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
            style={[
              styles.footerIcon,
              activeTab === 'dashboard' && styles.activeTab,
            ]}
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
                    style={[
                      styles.footerIcon,
                      activeTab === 'settings' && styles.activeTab,
                    ]}
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
  editButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
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
    minWidth: 300,
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
  editButton: {
    backgroundColor: 'rgb(60, 97, 135)',
    borderWidth: 1,
    borderColor: 'blue',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    width: 70,
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  deleteButton: {
    backgroundColor: 'rgba(132, 63, 63, 0.88)',
    borderWidth: 1,
    borderColor: 'red',
    padding: 10,
    borderRadius: 10,
    width: 70,
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  footer: {
    position: 'fixed', // Replaces 'fixed' which doesn't work in RN
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

export default MyReservations;
