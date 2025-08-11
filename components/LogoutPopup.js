import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Dimensions 
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LogoutPopup({ visible, onCancel, onConfirm }) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.popupContainer}>
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.title}>Log out</Text>
            
            {/* Subtitle */}
            <Text style={styles.subtitle}>Are you sure to logout?</Text>
            
            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                <Text style={styles.confirmButtonText}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    alignItems: 'center',
    gap: 15,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '400',
    color: '#3a3a3a',
    textAlign: 'center',
    lineHeight: 16.8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 11,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0065fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '400',
    color: '#0065fb',
    lineHeight: 16.8,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#0065fb',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '400',
    color: '#fafafa',
    lineHeight: 16.8,
  },
});
