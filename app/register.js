import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const Register = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setErrorMessage('All fields are required!');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.status === 201) {
        Alert.alert('Success', 'User registered successfully!');
        router.push('/login');
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Registration failed');
      }
    } catch (error) {
      setErrorMessage('Error: Unable to register.');
    }
  };

  return (
    <LinearGradient colors={['#fffff', ' rgb(211 211 211)']} style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Register</Text>
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <TextInput 
          placeholder="Full Name" 
          value={name} 
          onChangeText={setName} 
          style={styles.input} 
        />
        <TextInput 
          placeholder="Email" 
          value={email} 
          onChangeText={setEmail} 
          keyboardType="email-address" 
          style={styles.input} 
        />
        <TextInput 
          placeholder="Password" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
          style={styles.input} 
        />

        <TouchableOpacity onPress={handleRegister} style={styles.button}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    alignItems: 'center',
    maxWidth: '400px'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: '#4facfe',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  link: {
    marginTop: 15,
    color: '#007BFF',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    fontSize: 14,
  },
};

export default Register;
