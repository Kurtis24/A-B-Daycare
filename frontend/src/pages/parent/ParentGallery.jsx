import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const ParentGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchChildAndPhotos();
    }
  }, [user]);

  const fetchChildAndPhotos = async () => {
    try {
      // First, get the child assigned to this parent
      const { data: childData, error: childError } = await supabase
        .from('children')
        .select('*')
        .eq('parent_user_id', user.id)
        .single();

      if (childError) throw childError;
      setChild(childData);

      // Then fetch all photos tagged with this child
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

      // Extract photos from the junction table results
      const photosList = photosData
        .map(item => item.photos)
        .filter(photo => photo !== null);

      setPhotos(photosList);
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
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!child) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">No child profile found for your account.</p>
          <p className="text-sm text-gray-500 mt-2">Please contact the administrator.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
          
          {photos.length > 0 && (
            <div className="flex space-x-2">
              {selectMode ? (
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
              )}
            </div>
          )}
        </div>

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600">No photos yet</p>
            <p className="text-sm text-gray-500 mt-1">Check back soon for new photos!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => selectMode ? togglePhotoSelection(photo.id) : setSelectedPhoto(photo)}
              >
                <img
                  src={getPhotoUrl(photo.thumbnail_path || photo.file_path)}
                  alt="Child photo"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {selectMode && (
                  <div className="absolute top-2 right-2">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedPhotos.has(photo.id) 
                        ? 'bg-primary-600 border-primary-600' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {selectedPhotos.has(photo.id) && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Photo Viewer Modal */}
        {selectedPhoto && !selectMode && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <div className="text-white">
                  <p className="text-sm">
                    Uploaded {new Date(selectedPhoto.upload_date).toLocaleDateString()}
                  </p>
                  {selectedPhoto.users && (
                    <p className="text-sm text-gray-300">by {selectedPhoto.users.name}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownloadPhoto(selectedPhoto)}
                    className="p-2 bg-white rounded-lg hover:bg-gray-100"
                  >
                    <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
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
                alt="Child photo"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ParentGallery;
