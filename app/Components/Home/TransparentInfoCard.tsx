import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SimpleCard() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bookmycuts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#1877F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});