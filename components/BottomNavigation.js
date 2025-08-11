import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BottomNavigation({ activeTab = 'home', onTabPress, bottomOffset = 0 }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: { active: 'home-outline', inactive: 'home-outline' } },
    { id: 'wallet', label: 'Wallet', icon: { active: 'wallet', inactive: 'wallet-outline' } },
    { id: 'profile', label: 'Profile', icon: { active: 'account-circle', inactive: 'account-circle-outline' } },
  ];

  return (
    <View style={[styles.bottomNav, { bottom: bottomOffset }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.navItem}
          onPress={() => onTabPress && onTabPress(tab.id)}
        >
          <MaterialCommunityIcons
            name={activeTab === tab.id ? tab.icon.active : tab.icon.inactive}
            size={28}
            color={activeTab === tab.id ? '#01a1a6' : '#3a3a3a'}
          />
          <Text
            style={[
              styles.navText,
              { color: activeTab === tab.id ? '#01a1a6' : '#3a3a3a' }
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    shadowColor: '#0c0c0d',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    fontFamily: 'Satoshi',
    color: '#3a3a3a',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
});
