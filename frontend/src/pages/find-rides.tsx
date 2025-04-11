import React from 'react';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import RideSearch from '@/components/features/RideSearch';

const FindRidesPage: React.FC = () => {
  return (
    <Layout>
      <Head>
        <title>Find Rides | RideShare</title>
        <meta name="description" content="Search for rides that match your travel needs" />
      </Head>
      
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Find Rides
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Search for rides that match your travel needs and preferences
            </p>
          </div>
        </div>
        
        <RideSearch />
      </div>
    </Layout>
  );
};

export default FindRidesPage;
