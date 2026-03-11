import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AGE_GROUPS, AGE_GROUP_LABELS, USER_ROLES } from '../../constants/roles';

const TeacherChildren = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userRole) {
      fetchChildren();
    }
  }, [user, userRole]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError(null);

      let accessibleAgeGroups = [];
      if (userRole.role === USER_ROLES.SUPER_TEACHER || userRole.role === USER_ROLES.ADMIN) {
        accessibleAgeGroups = null;
      } else {
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('assigned_age_groups')
          .eq('user_id', user.id)
          .single();

        accessibleAgeGroups = teacherData?.assigned_age_groups || [];
      }

      let childrenQuery = supabase.from('children').select('*');
      
      if (accessibleAgeGroups && accessibleAgeGroups.length > 0) {
        childrenQuery = childrenQuery.in('age_group', accessibleAgeGroups);
      }

      const { data: childrenData, error: childrenError } = await childrenQuery.order('name');
      
      if (childrenError) throw childrenError;
      
      setChildren(childrenData || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      setError('Failed to load children. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age === 0) {
      const months = monthDiff + (today.getDate() >= birthDate.getDate() ? 0 : -1);
      return `${Math.max(0, months)} months`;
    }
    
    return `${age} year${age !== 1 ? 's' : ''} old`;
  };

  const getProfilePhotoUrl = (path) => {
    if (!path) return null;
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleChildClick = (childId) => {
    navigate(`/teacher/gallery?childId=${childId}`);
  };

  const groupChildrenByAgeGroup = () => {
    const grouped = {
      [AGE_GROUPS.INFANT]: [],
      [AGE_GROUPS.TODDLER]: [],
      [AGE_GROUPS.PRESCHOOL]: [],
    };

    children.forEach((child) => {
      if (grouped[child.age_group]) {
        grouped[child.age_group].push(child);
      }
    });

    return grouped;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button onClick={fetchChildren} className="btn-primary">
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  const groupedChildren = groupChildrenByAgeGroup();

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Children Directory</h1>
            <p className="text-gray-600 mt-1">View and manage children by age group</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/teacher/gallery')}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View All Photos
            </button>
            <button
              onClick={() => navigate('/teacher/upload')}
              className="btn-primary"
            >
              + Upload Photos
            </button>
          </div>
        </div>

        {children.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-600 text-lg">No children found</p>
            <p className="text-sm text-gray-500 mt-1">Contact your administrator to assign children to your age groups</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(AGE_GROUP_LABELS).map(([ageGroup, label]) => {
              const childrenInGroup = groupedChildren[ageGroup] || [];
              
              if (childrenInGroup.length === 0) return null;

              return (
                <div key={ageGroup} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">{label}</h2>
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                      {childrenInGroup.length} {childrenInGroup.length === 1 ? 'child' : 'children'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {childrenInGroup.map((child) => (
                      <div
                        key={child.id}
                        onClick={() => handleChildClick(child.id)}
                        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden border border-gray-100"
                      >
                        <div className="aspect-square bg-gradient-to-br from-yellow-100 to-yellow-200 relative overflow-hidden">
                          {child.profile_photo_url ? (
                            <img
                              src={getProfilePhotoUrl(child.profile_photo_url)}
                              alt={child.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-20 h-20 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">{child.name}</h3>
                          <p className="text-sm text-gray-600">{calculateAge(child.date_of_birth)}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Born: {new Date(child.date_of_birth).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherChildren;
