import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { MapPinIcon, ClockIcon, UserGroupIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import TravelPatternVisualization from '@/components/features/TravelPatternVisualization';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <Layout>
      <Head>
        <title>Dashboard | RideShare</title>
        <meta name="description" content="RideShare dashboard" />
      </Head>
      
      <div className="space-y-6">
        {/* Welcome section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.first_name}!
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Find rides, manage your preferences, and view your travel patterns all in one place.
            </p>
          </div>
        </div>
        
        {/* Quick actions */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <MapPinIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="ml-4">
                  <CardTitle className="text-lg">Find Rides</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    Search for available rides
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Link href="/find-rides" passHref>
                  <Button 
                    variant="default" 
                    className="w-full"
                    aria-label="Go to find rides page"
                  >
                    Find Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <ClockIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                </div>
                <div className="ml-4">
                  <CardTitle className="text-lg">My Rides</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    View your upcoming rides
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Link href="/my-rides" passHref>
                  <Button 
                    variant="default" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    aria-label="Go to my rides page"
                  >
                    View Rides
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <UserGroupIcon className="h-6 w-6 text-purple-600" aria-hidden="true" />
                </div>
                <div className="ml-4">
                  <CardTitle className="text-lg">Profile</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage your profile
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Link href="/profile" passHref>
                  <Button 
                    variant="default" 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    aria-label="Go to profile page"
                  >
                    View Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <Cog6ToothIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                </div>
                <div className="ml-4">
                  <CardTitle className="text-lg">Preferences</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    Update your preferences
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Link href="/preferences" passHref>
                  <Button 
                    variant="default" 
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                    aria-label="Go to preferences page"
                  >
                    Manage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Travel patterns */}
        <TravelPatternVisualization />
      </div>
    </Layout>
  );
}
