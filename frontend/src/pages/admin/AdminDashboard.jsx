import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChildren: 0,
    totalPhotos: 0,
    storageUsed: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  // Auto-hide loading after 2 seconds for debugging
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Force setting loading to false');
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch user count
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch children count
      const { count: childrenCount } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true });

      // Fetch photos count
      const { count: photosCount } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: userCount || 0,
        totalChildren: childrenCount || 0,
        totalPhotos: photosCount || 0,
        storageUsed: 0, // This would need to be calculated from Supabase Storage
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, bgColor }) => (
    <div className={`${bgColor} rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-700 mb-2 font-medium">{title}</p>
          <p className="text-4xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-3xl p-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back, Admin! 👋</h1>
              <p className="text-gray-800 text-lg">Here's what's happening with your daycare today</p>
            </div>
            <div className="hidden md:block">
              <svg className="w-32 h-32 text-gray-900 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            color="bg-yellow-400"
            bgColor="bg-white"
            icon={
              <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StatCard
            title="Total Children"
            value={stats.totalChildren}
            color="bg-yellow-400"
            bgColor="bg-yellow-50"
            icon={
              <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Total Photos"
            value={stats.totalPhotos}
            color="bg-yellow-400"
            bgColor="bg-white"
            icon={
              <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            title="Storage Used"
            value={`${stats.storageUsed} MB`}
            color="bg-yellow-400"
            bgColor="bg-yellow-50"
            icon={
              <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            }
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center p-6 bg-yellow-50 rounded-2xl hover:bg-yellow-100 transition-all hover:shadow-md group"
            >
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Manage Users</h3>
                <p className="text-sm text-gray-600">Create and edit accounts</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/children')}
              className="flex items-center p-6 bg-yellow-50 rounded-2xl hover:bg-yellow-100 transition-all hover:shadow-md group"
            >
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Manage Children</h3>
                <p className="text-sm text-gray-600">Add and update profiles</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/photos')}
              className="flex items-center p-6 bg-yellow-50 rounded-2xl hover:bg-yellow-100 transition-all hover:shadow-md group"
            >
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">View All Photos</h3>
                <p className="text-sm text-gray-600">Browse and manage</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
