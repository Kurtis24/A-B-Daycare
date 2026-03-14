import { supabase } from '../lib/supabase';

const PhotoModal = ({ 
  photo, 
  onClose, 
  onDownload, 
  onDelete, 
  canDelete = false,
  showTaggedChildren = false 
}) => {
  if (!photo) return null;

  const getPhotoUrl = (path) => {
    if (!path) return '';
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleDownload = async () => {
    if (onDownload) {
      await onDownload(photo);
    } else {
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
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(photo.id);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div className="text-white">
            <p className="text-sm">
              Uploaded {new Date(photo.upload_date).toLocaleDateString()}
            </p>
            {photo.users && (
              <p className="text-sm text-gray-300">by {photo.users.name}</p>
            )}
            {showTaggedChildren && photo.tagged_children && photo.tagged_children.length > 0 && (
              <p className="text-sm text-gray-300 mt-1">
                Tagged: {photo.tagged_children.join(', ')}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            {onDownload && (
              <button
                onClick={handleDownload}
                className="p-2 bg-white rounded-lg hover:bg-gray-100"
                title="Download photo"
              >
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            )}
            {canDelete && onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                title="Delete photo"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-white rounded-lg hover:bg-gray-100"
              title="Close"
            >
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <img
          src={getPhotoUrl(photo.file_path)}
          alt="Photo"
          className="w-full h-auto rounded-lg"
        />
      </div>
    </div>
  );
};

export default PhotoModal;
