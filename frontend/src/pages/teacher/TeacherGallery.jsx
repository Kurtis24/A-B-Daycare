import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AGE_GROUP_LABELS, USER_ROLES } from '../../constants/roles';

const TeacherGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedChildName, setSelectedChildName] = useState(null);
  const [searchParams] = useSearchParams();
  const childIdFromUrl = searchParams.get('childId');
  const [filters, setFilters] = useState({
    ageGroup: 'all',
    childId: childIdFromUrl || 'all',
  });
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userRole) {
      fetchData();
    }
  }, [user, userRole, filters]);

  useEffect(() => {
    if (childIdFromUrl && childIdFromUrl !== filters.childId) {
      setFilters(prev => ({ ...prev, childId: childIdFromUrl }));
    }
  }, [childIdFromUrl]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Determine which age groups the teacher can access
      let accessibleAgeGroups = [];
      if (userRole.role === USER_ROLES.SUPER_TEACHER || userRole.role === USER_ROLES.ADMIN) {
        // Super teachers and admins can access all age groups
        accessibleAgeGroups = null;
      } else {
        // Regular teachers can only access their assigned age groups
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('assigned_age_groups')
          .eq('user_id', user.id)
          .single();

        accessibleAgeGroups = teacherData?.assigned_age_groups || [];
      }

      // Fetch children based on accessible age groups
      let childrenQuery = supabase.from('children').select('*');
      
      if (accessibleAgeGroups && accessibleAgeGroups.length > 0) {
        childrenQuery = childrenQuery.in('age_group', accessibleAgeGroups);
      }

      if (filters.ageGroup !== 'all') {
        childrenQuery = childrenQuery.eq('age_group', filters.ageGroup);
      }

      const { data: childrenData, error: childrenError } = await childrenQuery.order('name');
      if (childrenError) throw childrenError;
      setChildren(childrenData || []);

      if (childIdFromUrl) {
        const selectedChild = childrenData.find(c => c.id === childIdFromUrl);
        setSelectedChildName(selectedChild?.name || null);
      } else {
        setSelectedChildName(null);
      }

      // Build query for photos
      const childIds = childrenData.map(c => c.id);
      
      if (childIds.length === 0) {
        setPhotos([]);
        setLoading(false);
        return;
      }

      // Fetch photos through the junction table
      let photoQuery = supabase
        .from('photo_children')
        .select(`
          photo_id,
          child_id,
          children:child_id (name),
          photos (
            id,
            file_path,
            thumbnail_path,
            upload_date,
            uploaded_by,
            users:uploaded_by (name)
          )
        `)
        .in('child_id', childIds);

      if (filters.childId !== 'all') {
        photoQuery = photoQuery.eq('child_id', filters.childId);
      }

      const { data: photosData, error: photosError } = await photoQuery.order('created_at', { ascending: false });
      if (photosError) throw photosError;

      // Group photos and include tagged children
      const photoMap = new Map();
      photosData.forEach(item => {
        if (!item.photos) return;
        
        if (!photoMap.has(item.photos.id)) {
          photoMap.set(item.photos.id, {
            ...item.photos,
            tagged_children: [item.children?.name],
          });
        } else {
          photoMap.get(item.photos.id).tagged_children.push(item.children?.name);
        }
      });

      setPhotos(Array.from(photoMap.values()));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (path) => {
    if (!path) return '';
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      alert('Photo deleted successfully');
      setSelectedPhoto(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo');
    }
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          {selectedChildName && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <button
                onClick={() => navigate('/teacher/children')}
                className="flex items-center gap-1 hover:text-primary-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Children
              </button>
              <span>/</span>
              <span className="font-medium text-gray-900">{selectedChildName}'s Photos</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedChildName ? `${selectedChildName}'s Photos` : 'Photo Gallery'}
              </h1>
              <p className="text-gray-600">{photos.length} photos</p>
            </div>
            <div className="flex gap-3">
              {!selectedChildName && (
                <button
                  onClick={() => navigate('/teacher/children')}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Children
                </button>
              )}
              <button
                onClick={() => navigate('/teacher/upload')}
                className="btn-primary"
              >
                + Upload Photos
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age Group</label>
              <select
                value={filters.ageGroup}
                onChange={(e) => setFilters({ ...filters, ageGroup: e.target.value, childId: 'all' })}
                className="input-field"
              >
                <option value="all">All Age Groups</option>
                {Object.entries(AGE_GROUP_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Child</label>
              <select
                value={filters.childId}
                onChange={(e) => setFilters({ ...filters, childId: e.target.value })}
                className="input-field"
              >
                <option value="all">All Children</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600">No photos found</p>
            <p className="text-sm text-gray-500 mt-1">Upload photos to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={getPhotoUrl(photo.thumbnail_path || photo.file_path)}
                  alt="Photo"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Photo Viewer Modal */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <div className="text-white">
                  <p className="text-sm">
                    Uploaded {new Date(selectedPhoto.upload_date).toLocaleDateString()}
                  </p>
                  {selectedPhoto.users && (
                    <p className="text-sm text-gray-300">by {selectedPhoto.users.name}</p>
                  )}
                  {selectedPhoto.tagged_children && selectedPhoto.tagged_children.length > 0 && (
                    <p className="text-sm text-gray-300 mt-1">
                      Tagged: {selectedPhoto.tagged_children.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {selectedPhoto.uploaded_by === user.id && (
                    <button
                      onClick={() => handleDeletePhoto(selectedPhoto.id)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="p-2 bg-white rounded-lg hover:bg-gray-100"
                  >
                    <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <img
                src={getPhotoUrl(selectedPhoto.file_path)}
                alt="Photo"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherGallery;
