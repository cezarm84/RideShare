import React from 'react';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import MatchingPreferences from '@/components/features/MatchingPreferences';

const PreferencesPage: React.FC = () => {
  return (
    <Layout>
      <Head>
        <title>Preferences | RideShare</title>
        <meta name="description" content="Manage your ride matching preferences" />
      </Head>
      
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Preferences
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Customize how we match you with rides and other passengers
            </p>
          </div>
        </div>
        
        <MatchingPreferences />
      </div>
    </Layout>
  );
};

export default PreferencesPage;
