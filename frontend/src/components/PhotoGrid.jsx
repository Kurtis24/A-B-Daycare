import { supabase } from '../lib/supabase';

const PhotoGrid = ({ 
  photos, 
  onPhotoClick, 
  selectMode = false, 
  selectedPhotos = new Set(), 
  onToggleSelection,
  emptyMessage = "No photos yet",
  emptySubMessage = "Check back soon for new photos!"
}) => {
  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-600">{emptyMessage}</p>
        <p className="text-sm text-gray-500 mt-1">{emptySubMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
      {photos.map((photo) => (
        <PhotoGridItem
          key={photo.id}
          photo={photo}
          selectMode={selectMode}
          isSelected={selectedPhotos.has(photo.id)}
          onClick={() => selectMode ? onToggleSelection(photo.id) : onPhotoClick(photo)}
        />
      ))}
    </div>
  );
};

const PhotoGridItem = ({ photo, selectMode, isSelected, onClick }) => {
  const getPhotoUrl = (path) => {
    if (!path) return '';
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div
      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
      onClick={onClick}
    >
      <img
        src={getPhotoUrl(photo.thumbnail_path || photo.file_path)}
        alt="Photo"
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {selectMode && (
        <div className="absolute top-2 right-2">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            isSelected 
              ? 'bg-primary-600 border-primary-600' 
              : 'bg-white border-gray-300'
          }`}>
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGrid;
