import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PhotoGrid from '../components/PhotoGrid';
import PhotoModal from '../components/PhotoModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AGE_GROUP_LABELS, USER_ROLES } from '../constants/roles';

const TabbedGallery = () => {
  const [activeTab, setActiveTab] = useState('');
  const [photos, setPhotos] = useState([]);
  const [children, setChildren] = useState([]);
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [filters, setFilters] = useState({
    ageGroup: 'all',
    childId: 'all',
  });
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const tabs = getTabs(userRole?.role);

  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    if (user && userRole && activeTab) {
      fetchData();
    }
  }, [user, userRole, activeTab, filters]);

  function getTabs(role) {
    if (!role) return [];
    
    switch (role) {
      case USER_ROLES.PARENT:
        return [{ id: 'my-child', label: "My Child's Photos" }];
      case USER_ROLES.TEACHER:
        return [{ id: 'my-gallery', label: 'My Gallery' }];
      case USER_ROLES.SUPER_TEACHER:
      case USER_ROLES.ADMIN:
        return [
          { id: 'my-gallery', label: 'My Gallery' },
          { id: 'all-photos', label: 'All Photos' }
        ];
      default:
        return [];
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'my-child') {
        await fetchParentPhotos();
      } else if (activeTab === 'my-gallery') {
        await fetchTeacherPhotos(false);
      } else if (activeTab === 'all-photos') {
        await fetchTeacherPhotos(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParentPhotos = async () => {
    const { data: childData, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('parent_user_id', user.id)
      .single();

    if (childError) throw childError;
    setChild(childData);

    const { data: photosData, error: photosError } = await supabase
      .from('photo_children')
      .select(`
        photo_id,
        photos (
          id,
          file_path,
          thumbnail_path,
          upload_date,
          uploaded_by,
          users:uploaded_by (name)
        )
      `)
      .eq('child_id', childData.id)
      .order('created_at', { ascending: false });

    if (photosError) throw photosError;

    const photosList = photosData
      .map(item => item.photos)
      .filter(photo => photo !== null);

    setPhotos(photosList);
  };

  const fetchTeacherPhotos = async (allPhotos = false) => {
    let accessibleAgeGroups = [];
    
    if (allPhotos || userRole.role === USER_ROLES.SUPER_TEACHER || userRole.role === USER_ROLES.ADMIN) {
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

    if (filters.ageGroup !== 'all') {
      childrenQuery = childrenQuery.eq('age_group', filters.ageGroup);
    }

    const { data: childrenData, error: childrenError } = await childrenQuery.order('name');
    if (childrenError) throw childrenError;
    setChildren(childrenData || []);

    const childIds = childrenData.map(c => c.id);
    
    if (childIds.length === 0) {
      setPhotos([]);
      return;
    }

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
  };

  const handleDownloadPhoto = async (photo) => {
    try {
      const { data, error } = await supabase.storage
        .from('photos')
        .download(photo.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo_${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading photo:', error);
      alert('Failed to download photo');
    }
  };

  const handleDownloadSelected = async () => {
    for (const photoId of selectedPhotos) {
      const photo = photos.find(p => p.id === photoId);
      if (photo) {
        await handleDownloadPhoto(photo);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    setSelectedPhotos(new Set());
    setSelectMode(false);
  };

  const togglePhotoSelection = (photoId) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);
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

  if (loading && !activeTab) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  const isParent = userRole?.role === USER_ROLES.PARENT;
  const isTeacher = userRole?.role === USER_ROLES.TEACHER || 
                    userRole?.role === USER_ROLES.SUPER_TEACHER || 
                    userRole?.role === USER_ROLES.ADMIN;
  const canDelete = isTeacher && selectedPhoto?.uploaded_by === user.id;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setFilters({ ageGroup: 'all', childId: 'all' });
                  setSelectMode(false);
                  setSelectedPhotos(new Set());
                }}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            {isParent && child && (
              <div className="flex items-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-600">
                    {child.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">{child.name}'s Photos</h1>
                  <p className="text-gray-600">{photos.length} photos available</p>
                </div>
              </div>
            )}
            {isTeacher && (
              <>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeTab === 'all-photos' ? 'All Photos' : 'Photo Gallery'}
                </h1>
                <p className="text-gray-600">{photos.length} photos</p>
              </>
            )}
          </div>
          
          {photos.length > 0 && (
            <div className="flex space-x-2">
              {isParent && (
                selectMode ? (
                  <>
                    <button
                      onClick={handleDownloadSelected}
                      disabled={selectedPhotos.size === 0}
                      className="btn-primary disabled:opacity-50"
                    >
                      Download ({selectedPhotos.size})
                    </button>
                    <button
                      onClick={() => {
                        setSelectMode(false);
                        setSelectedPhotos(new Set());
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectMode(true)}
                    className="btn-secondary"
                  >
                    Select Photos
                  </button>
                )
              )}
              {isTeacher && (
                <button
                  onClick={() => navigate('/teacher/upload')}
                  className="btn-primary"
                >
                  + Upload Photos
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filters for Teacher Views */}
        {isTeacher && (
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
        )}

        {/* Photos Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <PhotoGrid
            photos={photos}
            onPhotoClick={setSelectedPhoto}
            selectMode={selectMode}
            selectedPhotos={selectedPhotos}
            onToggleSelection={togglePhotoSelection}
            emptyMessage={isParent ? "No photos yet" : "No photos found"}
            emptySubMessage={isParent ? "Check back soon for new photos!" : "Upload photos to get started"}
          />
        )}

        {/* Photo Viewer Modal */}
        {selectedPhoto && !selectMode && (
          <PhotoModal
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            onDownload={isParent ? handleDownloadPhoto : null}
            onDelete={canDelete ? handleDeletePhoto : null}
            canDelete={canDelete}
            showTaggedChildren={isTeacher}
          />
        )}
      </div>
    </Layout>
  );
};

export default TabbedGallery;
