import React from 'react';
import Head from 'next/head';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon, 
  BuildingOfficeIcon 
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Head>
        <title>Profile | RideShare</title>
        <meta name="description" content="Your RideShare profile" />
      </Head>
      
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Your Profile
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your personal information
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="h-12 w-12 text-gray-500" />
                  </div>
                  <h2 className="mt-4 text-xl font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </h2>
                  <p className="text-sm text-gray-500">{user.user_type}</p>
                  
                  {user.enterprise_name && (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <BuildingOfficeIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      {user.enterprise_name}
                    </div>
                  )}
                  
                  <div className="mt-6 w-full">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      aria-label="Edit profile"
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-gray-200">
                  <div className="py-4 flex items-center">
                    <dt className="text-sm font-medium text-gray-500 w-1/3 flex items-center">
                      <EnvelopeIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                      Email
                    </dt>
                    <dd className="text-sm text-gray-900 w-2/3">{user.email}</dd>
                  </div>
                  
                  <div className="py-4 flex items-center">
                    <dt className="text-sm font-medium text-gray-500 w-1/3 flex items-center">
                      <PhoneIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                      Phone
                    </dt>
                    <dd className="text-sm text-gray-900 w-2/3">{user.phone_number}</dd>
                  </div>
                  
                  {user.home_address && (
                    <div className="py-4 flex items-center">
                      <dt className="text-sm font-medium text-gray-500 w-1/3 flex items-center">
                        <MapPinIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                        Home Address
                      </dt>
                      <dd className="text-sm text-gray-900 w-2/3">{user.home_address}</dd>
                    </div>
                  )}
                  
                  {user.work_address && (
                    <div className="py-4 flex items-center">
                      <dt className="text-sm font-medium text-gray-500 w-1/3 flex items-center">
                        <BuildingOfficeIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                        Work Address
                      </dt>
                      <dd className="text-sm text-gray-900 w-2/3">{user.work_address}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    aria-label="Change password"
                  >
                    Change Password
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    aria-label="Notification settings"
                  >
                    Notification Settings
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    aria-label="Privacy settings"
                  >
                    Privacy Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
