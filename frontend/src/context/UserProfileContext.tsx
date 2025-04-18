import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import api from '../services/api';

export interface UserAddress {
  street: string;
  house_number: string;
  post_code: string;
  city: string;
  country: string;
  coordinates?: string;
}

export interface UserProfileData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  home_address?: string;
  work_address?: string;
  home_street?: string;
  home_house_number?: string;
  home_post_code?: string;
  home_city?: string;
  work_street?: string;
  work_house_number?: string;
  work_post_code?: string;
  work_city?: string;
  latitude?: number;
  longitude?: number;
  work_latitude?: number;
  work_longitude?: number;
  is_active: boolean;
  is_admin?: boolean;
  is_superadmin?: boolean;
  user_type?: string;
  created_at?: string;
}

interface UserProfileContextType {
  profile: UserProfileData | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: Partial<UserProfileData>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  isProfileComplete: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if profile is complete (has all required fields)
  const isProfileComplete = !!profile && 
    !!profile.phone_number && 
    (!!profile.home_address || (!!profile.home_street && !!profile.home_post_code && !!profile.home_city));

  const fetchProfile = async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<UserProfileData>('/users/me');
      setProfile(response.data);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setError('Failed to load user profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile when auth state changes
  useEffect(() => {
    fetchProfile();
  }, [isAuthenticated]);

  const updateProfile = async (data: Partial<UserProfileData>) => {
    if (!profile) {
      throw new Error('No profile loaded');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.put<UserProfileData>('/users/me', data);
      setProfile(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    return fetchProfile();
  };

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        updateProfile,
        refreshProfile,
        isProfileComplete
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = (): UserProfileContextType => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
