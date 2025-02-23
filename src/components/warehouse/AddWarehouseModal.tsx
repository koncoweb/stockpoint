import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Warehouse } from '../../types';

interface AddWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (warehouse: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const AddWarehouseModal = ({ isOpen, onClose, onAdd }: AddWarehouseModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    capacity: '',
    manager: '',
    status: 'active' as const
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Warehouse name is required';
    if (!formData.address.trim()) return 'Address is required';
    if (!formData.capacity || isNaN(Number(formData.capacity))) return 'Valid capacity is required';
    if (!formData.manager.trim()) return 'Manager name is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await onAdd({
        name: formData.name,
        address: formData.address,
        capacity: Number(formData.capacity),
        manager: formData.manager,
        status: formData.status
      });

      setFormData({
        name: '',
        address: '',
        capacity: '',
        manager: '',
        status: 'active'
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add warehouse');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Warehouse</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter warehouse name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter warehouse address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity (units)
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter warehouse capacity"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manager
            </label>
            <input
              type="text"
              name="manager"
              value={formData.manager}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter manager name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Warehouse'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWarehouseModal;
