import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const EditReservation = () => {
  const router = useRouter();
  const route = useRoute();
  const navigation = useNavigation();
  const { reservation_id } = route.params;
  const [activeTab, setActiveTab] = useState('settings');

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    people_count: '',
    user_id: '',
    restaurant_id: '',
  });

  useEffect(() => {
    const fetchReservationDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const res = await fetch(`http://localhost:3000/reservations/reservation/${reservation_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to fetch reservation');

        const r = data[0]; // Assuming the reservation is returned in an array
        setReservation(r);
        setFormData({
          date: r.date.split('T')[0],
          time: r.time,
          people_count: String(r.people_count),
          user_id: r.user_id,
          restaurant_id: r.restaurant_id,
        });
      } catch (err) {
        console.error(err);
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReservationDetails();
  }, [reservation_id]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      const res = await fetch(`http://localhost:3000/reservations/reservation/${reservation_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          people_count: parseInt(formData.people_count, 10),
        }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Update failed');

      Alert.alert('Success', result.message || 'Reservation updated successfully!');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  }

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.push('/login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>Edit Reservation #{reservation_id}</Text>

    <View style={styles.formWrapper}>
        <TextInput
        style={styles.input}
        value={formData.date}
        placeholder="Date (YYYY-MM-DD)"
        onChangeText={(text) => handleChange('date', text)}
        />

        <TextInput
        style={styles.input}
        value={formData.time}
        placeholder="Time (HH:MM:SS)"
        onChangeText={(text) => handleChange('time', text)}
        />

        <TextInput
        style={styles.input}
        value={formData.people_count}
        placeholder="People Count"
        keyboardType="numeric"
        onChangeText={(text) => handleChange('people_count', text)}
        />

        <Button title="Update Reservation" onPress={handleSubmit} color="#007aff" />
    </View>

    <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/my-reservations')}>
        <Ionicons name="home" size={28} color="#007aff" style={styles.footerIcon} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/dashboard')}>
        <Ionicons name="calendar" size={28} color="#007aff" style={styles.footerIcon} />
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
    </ScrollView>

  );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
        flexGrow: 1,
        alignItems: 'center',
        backgroundColor: '#f2f2f2'
      },
      formWrapper: {
        backgroundColor: '#f9f9f9',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        minWidth: 300
      },
      
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  footer: {
    position: 'fixed',
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

export default EditReservation;
