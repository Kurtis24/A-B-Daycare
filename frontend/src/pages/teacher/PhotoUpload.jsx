import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES, AGE_GROUPS, AGE_GROUP_LABELS } from '../../constants/roles';

const PhotoUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChildren, setSelectedChildren] = useState(new Set());
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userRole) {
      fetchChildren();
    }
  }, [user, userRole, ageGroupFilter]);

  const fetchChildren = async () => {
    try {
      // Determine which age groups the teacher can access
      let accessibleAgeGroups = [];
      if (userRole.role === USER_ROLES.SUPER_TEACHER || userRole.role === USER_ROLES.ADMIN) {
        accessibleAgeGroups = null; // Can access all
      } else {
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('assigned_age_groups')
          .eq('user_id', user.id)
          .single();

        accessibleAgeGroups = teacherData?.assigned_age_groups || [];
      }

      let query = supabase.from('children').select('*');

      if (accessibleAgeGroups && accessibleAgeGroups.length > 0) {
        query = query.in('age_group', accessibleAgeGroups);
      }

      if (ageGroupFilter !== 'all') {
        query = query.eq('age_group', ageGroupFilter);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;

      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleChild = (childId) => {
    const newSelection = new Set(selectedChildren);
    if (newSelection.has(childId)) {
      newSelection.delete(childId);
    } else {
      newSelection.add(childId);
    }
    setSelectedChildren(newSelection);
  };

  const selectAllChildren = () => {
    setSelectedChildren(new Set(children.map(c => c.id)));
  };

  const deselectAllChildren = () => {
    setSelectedChildren(new Set());
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one photo');
      return;
    }

    if (selectedChildren.size === 0) {
      alert('Please select at least one child to tag');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = selectedFiles.length;
      let uploadedCount = 0;

      for (const file of selectedFiles) {
        // Generate unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `photos/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create photo record
        const { data: photoData, error: photoError } = await supabase
          .from('photos')
          .insert([
            {
              file_path: filePath,
              thumbnail_path: filePath, // In production, generate thumbnail
              uploaded_by: user.id,
              file_size: file.size,
              deletion_date: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years from now
            },
          ])
          .select()
          .single();

        if (photoError) throw photoError;

        // Create photo-children associations
        const photoChildrenRecords = Array.from(selectedChildren).map(childId => ({
          photo_id: photoData.id,
          child_id: childId,
        }));

        const { error: linkError } = await supabase
          .from('photo_children')
          .insert(photoChildrenRecords);

        if (linkError) throw linkError;

        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      }

      alert('Photos uploaded successfully!');
      navigate('/teacher/gallery');
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <button
            onClick={() => navigate('/teacher/gallery')}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Gallery
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Upload Photos</h1>
          <p className="text-gray-600 mt-1">Select photos and tag the children in them</p>
        </div>

        {/* File Upload */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Select Photos</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500">PNG, JPG, HEIC up to 10MB each</p>
            </label>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">{selectedFiles.length} photo(s) selected</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                      disabled={uploading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Child Selection */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">2. Tag Children</h2>
            <div className="flex space-x-2">
              <button
                onClick={selectAllChildren}
                className="text-sm text-primary-600 hover:text-primary-700"
                disabled={uploading}
              >
                Select All
              </button>
              <button
                onClick={deselectAllChildren}
                className="text-sm text-gray-600 hover:text-gray-700"
                disabled={uploading}
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Age Group</label>
            <select
              value={ageGroupFilter}
              onChange={(e) => setAgeGroupFilter(e.target.value)}
              className="input-field"
              disabled={uploading}
            >
              <option value="all">All Age Groups</option>
              {Object.entries(AGE_GROUP_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => toggleChild(child.id)}
                disabled={uploading}
                className={`p-3 rounded-lg border-2 transition-colors text-left ${
                  selectedChildren.has(child.id)
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{child.name}</span>
                  {selectedChildren.has(child.id) && (
                    <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-gray-500">{AGE_GROUP_LABELS[child.age_group]}</span>
              </button>
            ))}
          </div>

          {children.length === 0 && (
            <p className="text-center text-gray-500 py-4">No children available for tagging</p>
          )}
        </div>

        {/* Upload Button */}
        <div className="card">
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0 || selectedChildren.size === 0}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Photos'}
          </button>

          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PhotoUpload;
