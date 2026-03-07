import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { AGE_GROUPS, AGE_GROUP_LABELS } from '../../constants/roles';

const ChildrenManagement = () => {
  const [children, setChildren] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    age_group: AGE_GROUPS.INFANT,
    parent_user_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch children with parent info
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select(`
          *,
          users:parent_user_id (name, email)
        `)
        .order('created_at', { ascending: false });

      if (childrenError) throw childrenError;

      // Fetch all parents for the dropdown
      const { data: parentsData, error: parentsError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'parent')
        .order('name');

      if (parentsError) throw parentsError;

      setChildren(childrenData || []);
      setParents(parentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChild = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('children')
        .insert([formData]);

      if (error) throw error;

      alert('Child profile created successfully!');
      setShowCreateModal(false);
      setFormData({
        name: '',
        date_of_birth: '',
        age_group: AGE_GROUPS.INFANT,
        parent_user_id: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating child:', error);
      alert('Failed to create child profile: ' + error.message);
    }
  };

  const getAgeGroupBadgeColor = (ageGroup) => {
    switch (ageGroup) {
      case AGE_GROUPS.INFANT:
        return 'bg-blue-100 text-blue-800';
      case AGE_GROUPS.TODDLER:
        return 'bg-green-100 text-green-800';
      case AGE_GROUPS.PRESCHOOL:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Children Management</h1>
            <p className="text-gray-600 mt-1">Manage child profiles and parent assignments</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            + Add Child
          </button>
        </div>

        {/* Children Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <div key={child.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-600">
                      {child.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">{child.name}</h3>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getAgeGroupBadgeColor(child.age_group)}`}>
                      {AGE_GROUP_LABELS[child.age_group]}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">DOB:</span>{' '}
                  {new Date(child.date_of_birth).toLocaleDateString()}
                </p>
                {child.users && (
                  <p>
                    <span className="font-medium">Parent:</span>{' '}
                    {child.users.name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create Child Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Add New Child</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateChild} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Child's Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                  <select
                    value={formData.age_group}
                    onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                    className="input-field"
                  >
                    {Object.entries(AGE_GROUP_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Parent</label>
                  <select
                    value={formData.parent_user_id}
                    onChange={(e) => setFormData({ ...formData, parent_user_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select a parent</option>
                    {parents.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.name} ({parent.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Add Child
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChildrenManagement;
