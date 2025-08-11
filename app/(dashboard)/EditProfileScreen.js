import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  StatusBar,
  Image,
  TextInput,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getUserData } from '../../utils/userStorage';
import images from '../../assets/images';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#0065fb',
  primary100: '#dae9ff',
  primary1000: '#002965',
  secondary800: '#01a1a6',
  text: '#3a3a3a',
  white: '#ffffff',
  chipText: '#0065fb',
  underline: '#01a1a6',
  open: '#4CAF50',
  closed: '#F44336',
  error: '#F44336',
  success: '#4CAF50',
};

export default function EditProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = React.useRef(null);
  const route = React.useRef(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [originalAddProofNo, setOriginalAddProofNo] = useState('');
  const [isUploadingKyc, setIsUploadingKyc] = useState(false);
  const [idProofAsset, setIdProofAsset] = useState(null);
  const [addressProofAsset, setAddressProofAsset] = useState(null);
  const canUploadKyc = !!(idProofAsset && addressProofAsset);
  
  // Form state
  const [formData, setFormData] = useState({
    firstname: '',
    middlename: '',
    lastname: '',
    mothers_maiden_name: '',
    dob: '',
    email: '',
    mobile: '',
    state: '',
    city: '',
    address: '',
    pincode: '',
    id_proof_type: 'PANCARD',
    id_proof_no: '',
    add_proof_type: 'PANCARD',
    add_proof_no: '',
    gender: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        const params = navigation?.getState?.()?.routes?.slice(-1)?.[0]?.params;
        if (params?.scrollToBottom && scrollRef.current) {
          scrollRef.current.scrollToEnd({ animated: true });
        }
      } catch {}
    }, 400);
    return () => clearTimeout(timeout);
  }, [navigation]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const data = await getUserData();
      if (data) {
        setUserData(data);
        const userAddType = data.userData?.add_proof_type || 'PANCARD';
        const userAddNo = data.userData?.add_proof_no || '';
        setOriginalAddProofNo(userAddNo);
        // Populate form with existing data
        setFormData({
          firstname: data.userData?.name || '',
          middlename: data.userData?.middlename || '',
          lastname: data.userData?.lastname || '',
          mothers_maiden_name: data.userData?.mothers_maiden_name || '',
          dob: data.userData?.dob || '',
          email: data.userData?.email || '',
          mobile: data.userData?.mobile || '',
          state: data.userData?.state || '',
          city: data.userData?.city || '',
          address: data.userData?.address || '',
          pincode: data.userData?.pincode || '',
          id_proof_type: data.userData?.id_proof_type || 'PANCARD',
          id_proof_no: data.userData?.id_proof_no || '',
          add_proof_type: userAddType,
          // Hide Aadhaar address proof number in the UI, preserve original in state
          add_proof_no: (userAddType === 'AadhaarCard' || userAddType === 'Aadhar') ? '' : userAddNo,
          gender: data.userData?.gender || '',
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validate required fields
    const requiredFields = ['firstname', 'lastname', 'dob', 'email', 'mobile', 'state', 'city', 'address', 'pincode', 'id_proof_no', 'gender'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    // Special-case validation for add_proof_no: allow blank for Aadhaar if original exists
    const isAadhaar = (formData.add_proof_type === 'AadhaarCard' || formData.add_proof_type === 'Aadhar');
    const addProofMissing = !formData.add_proof_no && !(isAadhaar && originalAddProofNo);
    if (addProofMissing) missingFields.push('add_proof_no');
    
    if (missingFields.length > 0) {
      Alert.alert('Validation Error', `Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsSaving(true);
    try {
      // Get token and userId from AsyncStorage
      const [token, userId] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userId'),
      ]);

      if (!token || !userId) {
        Alert.alert('Error', 'Authentication credentials not found. Please login again.');
        return;
      }

      // Determine which address proof number to send
      const addProofNoToSend = (isAadhaar && !formData.add_proof_no) ? originalAddProofNo : formData.add_proof_no;

      const apiData = {
        ...formData,
        add_proof_no: addProofNoToSend,
        KYCFLAG: '1' // Set internally as requested
      };

      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      Object.keys(apiData).forEach(key => {
        formDataToSend.append(key, apiData[key]);
      });

      console.log('Sending profile update to API:', apiData);

      // Make API call
      const response = await fetch('https://api.mediimpact.in/index.php/Wallet/registerUser', {
        method: 'POST',
        headers: {
          'User-ID': userId,
          'token': token,
        },
        body: formDataToSend,
      });

      const responseData = await response.json();
      
      // Enhanced logging for API response
      console.log('=== EDIT PROFILE API RESPONSE ===');
      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);
      console.log('Response Headers:', response.headers);
      console.log('Response Data:', JSON.stringify(responseData, null, 2));
      console.log('Response Data Type:', typeof responseData);
      console.log('Response Data Keys:', Object.keys(responseData || {}));
      console.log('================================');

      if (response.ok && responseData.status === 200) {
        console.log('✅ Profile update successful!');
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        console.log('❌ Profile update failed');
        console.log('Response not OK or status not 200');
        throw new Error(responseData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', `Failed to update profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderInputField = (label, field, placeholder, keyboardType = 'default', required = false) => (
    <View style={styles.inputRow}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={styles.textInput}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor="#999"
      />
    </View>
  );

  const renderDropdownField = (label, field, options, required = false) => (
    <View style={styles.inputRow}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => {
          // Toggle dropdown visibility for this field
          setFormData(prev => ({
            ...prev,
            [`${field}_open`]: !prev[`${field}_open`]
          }));
        }}
      >
        <Text style={styles.dropdownButtonText}>
          {formData[field] || 'Select an option'}
        </Text>
        <Ionicons 
          name={formData[`${field}_open`] ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={COLORS.text} 
        />
      </TouchableOpacity>
      
      {formData[`${field}_open`] && (
        <View style={styles.dropdownOptions}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.dropdownOption}
              onPress={() => {
                // Update type and, if switching to Aadhaar, hide the number in UI while keeping original
                handleInputChange(field, option);
                if (field === 'add_proof_type') {
                  setFormData(prev => ({
                    ...prev,
                    add_proof_no: (option === 'AadhaarCard' || option === 'Aadhar') ? '' : (prev.add_proof_no || originalAddProofNo)
                  }));
                }
                // Close dropdown after selection
                setFormData(prev => ({
                  ...prev,
                  [`${field}_open`]: false
                }));
              }}
            >
              <Text style={styles.dropdownOptionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const addressTypes = [
    'ValidPassport',
    'ValidDrivingLicense',
    'VotersID',
    'AadhaarCard',
    'ValidNREGAJobCard',
  ];

  const idTypes = [
    'PANCARD',
    'FORM60',
  ];

  const twoMB = 2 * 1024 * 1024;
  const inferName = (uri, fallback) => {
    try {
      const parts = uri.split('/');
      const last = parts[parts.length - 1];
      return last || fallback;
    } catch {
      return fallback;
    }
  };

  const pickFromFiles = async (setter) => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], multiple: false, copyToCacheDirectory: true });
    if (res.canceled) return;
    const file = res.assets?.[0];
    if (!file) return;
    const size = file.size ?? (await FileSystem.getInfoAsync(file.uri)).size;
    if (size && size > twoMB) {
      Alert.alert('File too large', 'Each file must be under 2 MB.');
      return;
    }
    setter({ uri: file.uri, name: file.name || inferName(file.uri, 'document'), type: file.mimeType || 'application/octet-stream', size: size || 0 });
  };

  const pickFromGallery = async (setter) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required to pick an image.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (res.canceled) return;
    const a = res.assets?.[0];
    if (!a) return;
    const info = await FileSystem.getInfoAsync(a.uri);
    if (info.size && info.size > twoMB) {
      Alert.alert('File too large', 'Each file must be under 2 MB.');
      return;
    }
    setter({ uri: a.uri, name: inferName(a.uri, 'image.jpg'), type: 'image/jpeg', size: info.size || 0 });
  };

  // Simple image picker restricted to jpg/jpeg/png for ID proof
  const pickIdProofImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required to pick an image.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (res.canceled) return;
    const a = res.assets?.[0];
    if (!a) return;
    const info = await FileSystem.getInfoAsync(a.uri);
    if (info.size && info.size > twoMB) {
      Alert.alert('File too large', 'Each file must be under 2 MB.');
      return;
    }
    const name = inferName(a.uri, 'image');
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      Alert.alert('Invalid format', 'Please select a JPG, JPEG, or PNG image.');
      return;
    }
    setIdProofAsset({ uri: a.uri, name: name.endsWith(ext) ? name : `${name}.${ext}`, type: ext === 'png' ? 'image/png' : 'image/jpeg', size: info.size || 0 });
  };

  const pickAddressProofImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required to pick an image.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (res.canceled) return;
    const a = res.assets?.[0];
    if (!a) return;
    const info = await FileSystem.getInfoAsync(a.uri);
    if (info.size && info.size > twoMB) {
      Alert.alert('File too large', 'Each file must be under 2 MB.');
      return;
    }
    const name = inferName(a.uri, 'image');
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      Alert.alert('Invalid format', 'Please select a JPG, JPEG, or PNG image.');
      return;
    }
    setAddressProofAsset({ uri: a.uri, name: name.endsWith(ext) ? name : `${name}.${ext}`, type: ext === 'png' ? 'image/png' : 'image/jpeg', size: info.size || 0 });
  };

  const handleUploadKyc = async () => {
    console.log('Upload KYC clicked', {
      hasIdProof: !!idProofAsset,
      idProof: idProofAsset ? { name: idProofAsset.name, size: idProofAsset.size, type: idProofAsset.type } : null,
      hasAddressProof: !!addressProofAsset,
      addressProof: addressProofAsset ? { name: addressProofAsset.name, size: addressProofAsset.size, type: addressProofAsset.type } : null,
      add_proof_type: formData.add_proof_type,
      add_proof_no: formData.add_proof_no || originalAddProofNo,
      id_proof_type: formData.id_proof_type,
      id_proof_no: formData.id_proof_no,
      email: formData.email,
    });
    if (!canUploadKyc) {
      Alert.alert('Documents required', 'Please select both ID Proof and Address Proof images (max 2 MB each).');
      return;
    }
    try {
      setIsUploadingKyc(true);
      const [token, userId] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userId'),
      ]);
      if (!token || !userId) {
        Alert.alert('Error', 'Authentication credentials not found. Please login again.');
        return;
      }

      const buildFormData = () => {
        const fd = new FormData();
        if (addressProofAsset) {
          fd.append('address_proof', {
            uri: addressProofAsset.uri,
            name: addressProofAsset.name,
            type: addressProofAsset.type,
          });
        }
        if (idProofAsset) {
          fd.append('id_proof_file', {
            uri: idProofAsset.uri,
            name: idProofAsset.name,
            type: idProofAsset.type,
          });
        }
        fd.append('add_proof_type', formData.add_proof_type || '');
        fd.append('add_proof_no', formData.add_proof_no || originalAddProofNo || '');
        fd.append('id_proof_type', formData.id_proof_type || '');
        fd.append('id_proof_no', formData.id_proof_no || '');
        fd.append('middlename', formData.middlename || '');
        fd.append('mothers_maiden_name', formData.mothers_maiden_name || '');
        fd.append('email', formData.email || '');
        return fd;
      };

      const doUpload = async (attempt) => {
        console.log(`Upload KYC attempt ${attempt}`);
        const response = await fetch('https://api.mediimpact.in/index.php/Wallet/UpgradeKYC', {
          method: 'POST',
          headers: {
            'User-ID': userId,
            'token': token,
            version: '10007',
          },
          body: buildFormData(),
        });
        const data = await response.json().catch(() => ({}));
        console.log(`Upload KYC attempt ${attempt} status`, response.status, 'json', data);
        return { ok: response.ok && data?.status === 200, data, httpOk: response.ok };
      };

      // Try up to 2 times
      let result = await doUpload(1);
      if (!result.ok) {
        // brief wait before retry
        await new Promise((r) => setTimeout(r, 500));
        result = await doUpload(2);
      }

      if (result.ok) {
        // Navigate back to Profile after successful upload
        navigation.replace('ProfileScreen');
      } else {
        Alert.alert('Error', result.data?.message || 'Invalid document format');
      }
    } catch (e) {
      console.log('Upload KYC error', e);
      Alert.alert('Error', e.message || 'Failed to upload KYC documents');
    } finally {
      setIsUploadingKyc(false);
    }
  };

  const renderGenderField = () => (
    <View style={styles.inputRow}>
      <Text style={styles.inputLabel}>
        Gender <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.genderButtonsRow}>
        {['Male', 'Female', 'Others'].map((label) => {
          const value = label.toLowerCase() === 'others' ? 'other' : label.toLowerCase();
          const selected = formData.gender === value;
          return (
            <TouchableOpacity
              key={label}
              style={[styles.genderButton, selected && styles.genderButtonSelected]}
              onPress={() => handleInputChange('gender', value)}
            >
              <Text style={[styles.genderButtonText, selected && styles.genderButtonTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#dae9ff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#dae9ff" />

      {/* TOP area (above safe area) */}
      <View style={{ height: insets.top, backgroundColor: '#dae9ff' }} />

      {/* SAFE area/content */}
      <View style={styles.pageRoot}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.primary1000} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image source={images.medicalLogo} style={styles.headerLogo} resizeMode="contain" />
              <Text style={styles.appName}>Medpass</Text>
            </View>
            <Text style={styles.headerPageTitle}>Edit Profile</Text>
          </View>
        </View>

        <View style={styles.container}>
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            ref={scrollRef}
          >
            {/* Personal Information */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <View style={styles.sectionLine} />
              </View>
              <View style={styles.sectionCard}>
                {renderInputField('First Name', 'firstname', 'Enter first name', 'default', true)}
                {renderInputField('Middle Name', 'middlename', 'Enter middle name')}
                {renderInputField('Last Name', 'lastname', 'Enter last name', 'default', true)}
                {renderInputField('Mother\'s Maiden Name', 'mothers_maiden_name', 'Enter mother\'s maiden name')}
                {renderInputField('Date of Birth', 'dob', 'DD/MM/YYYY', 'default', true)}
                {renderInputField('Email', 'email', 'Enter email address', 'email-address', true)}
                {renderInputField('Mobile', 'mobile', 'Enter mobile number', 'phone-pad', true)}
                {renderGenderField()}
              </View>
            </View>

            {/* Address Information */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Address Information</Text>
                <View style={styles.sectionLine} />
              </View>
              <View style={styles.sectionCard}>
                {renderInputField('Address', 'address', 'Enter address', 'default', true)}
                {renderInputField('City', 'city', 'Enter city', 'default', true)}
                {renderInputField('State', 'state', 'Enter state', 'default', true)}
                {renderInputField('Pincode', 'pincode', 'Enter pincode', 'numeric', true)}
              </View>
            </View>

            {/* Proof Information */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Proof Information</Text>
                <View style={styles.sectionLine} />
              </View>
              <View style={styles.sectionCard}>
                 {renderDropdownField('ID Proof Type', 'id_proof_type', idTypes, true)}
                 {renderInputField('ID Proof Number', 'id_proof_no', 'Enter ID proof number', 'default', true)}
                 {renderDropdownField('Address Proof Type', 'add_proof_type', addressTypes, true)}
                {renderInputField('Address Proof Number', 'add_proof_no', 'Enter address proof number', 'default', !((formData.add_proof_type === 'AadhaarCard' || formData.add_proof_type === 'Aadhar') && originalAddProofNo))}

                 {/* File upload pickers (optional) */}
                 <View style={styles.uploadGroup}>
                   <Text style={styles.uploadLabel}>ID Proof Image (JPG/PNG, optional, max 2 MB)</Text>
                   <TouchableOpacity style={styles.uploadBtn} onPress={pickIdProofImage}>
                     <Ionicons name="image" size={16} color="#fff" />
                     <Text style={styles.uploadBtnText}>Choose Image</Text>
                   </TouchableOpacity>
                   {!!idProofAsset && (
                     <Text style={styles.fileMeta}>Selected: {idProofAsset.name} {(idProofAsset.size/1024).toFixed(0)} KB</Text>
                   )}
                 </View>

                 <View style={styles.uploadGroup}>
                   <Text style={styles.uploadLabel}>Address Proof File (optional, max 2 MB)</Text>
                   <TouchableOpacity style={styles.uploadBtn} onPress={pickAddressProofImage}>
                     <Ionicons name="image" size={16} color="#fff" />
                     <Text style={styles.uploadBtnText}>Choose Image</Text>
                   </TouchableOpacity>
                   {!!addressProofAsset && (
                     <Text style={styles.fileMeta}>Selected: {addressProofAsset.name} {(addressProofAsset.size/1024).toFixed(0)} KB</Text>
                   )}
                 </View>

                 {/* Upload KYC button */}
                 <TouchableOpacity style={[styles.kycUploadBtn, (isUploadingKyc || !canUploadKyc) && styles.saveButtonDisabled]} onPress={handleUploadKyc} disabled={isUploadingKyc || !canUploadKyc}>
                   <Text style={styles.kycUploadBtnText}>{isUploadingKyc ? 'Uploading…' : 'Upload KYC details'}</Text>
                 </TouchableOpacity>
              </View>
            </View>

            {/* Bottom spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BOTTOM area (below safe area) */}
      <View style={{ height: insets.bottom, backgroundColor: '#ffffff' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  pageRoot: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Satoshi Variable',
  },
  header: {
    backgroundColor: '#dae9ff',
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    paddingHorizontal: 20,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 48,
    height: 36,
    marginRight: 9,
  },
  appName: {
    fontSize: 32,
    fontFamily: 'Satoshi',
    fontWeight: '500',
    color: '#017f83',
    letterSpacing: -2,
  },
  headerPageTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi',
    fontWeight: '600',
    color: '#017f83',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingTop: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: COLORS.primary1000,
    marginRight: 12,
  },
  sectionLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.underline,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#0c0c0d',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  inputRow: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Satoshi Variable',
    fontWeight: '600',
    color: COLORS.primary1000,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E3EEFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Satoshi Variable',
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#E3EEFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    fontSize: 16,
    fontFamily: 'Satoshi Variable',
    color: COLORS.text,
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E3EEFF',
    borderRadius: 12,
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionText: {
    fontSize: 16,
    fontFamily: 'Satoshi Variable',
    color: COLORS.text,
  },
  genderButtonsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  genderButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E3EEFF',
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  genderButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderButtonText: {
    fontSize: 14,
    fontFamily: 'Satoshi Variable',
    color: COLORS.text,
    fontWeight: '500',
  },
  genderButtonTextSelected: {
    color: COLORS.white,
  },
  bottomSpacing: {
    height: 40,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
  },
  uploadGroup: {
    marginTop: 16,
  },
  uploadLabel: {
    fontSize: 14,
    color: COLORS.primary1000,
    fontFamily: 'Satoshi Variable',
    fontWeight: '600',
    marginBottom: 8,
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  fileMeta: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
  },
  kycUploadBtn: {
    marginTop: 16,
    backgroundColor: COLORS.secondary800,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  kycUploadBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
