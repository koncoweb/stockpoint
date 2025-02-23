import { useState, useEffect } from 'react';
import { Plus, Warehouse } from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { Warehouse as WarehouseType } from '../types';
import AddWarehouseModal from '../components/warehouse/AddWarehouseModal';
import EditWarehouseModal from '../components/warehouse/EditWarehouseModal';
import { getWarehouses, addWarehouse, updateWarehouse, deleteWarehouse } from '../lib/db';

const WarehousePage = () => {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const fetchedWarehouses = await getWarehouses();
      setWarehouses(fetchedWarehouses);
      setError('');
    } catch (err) {
      setError('Failed to load warehouses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWarehouse = async (warehouse: Omit<WarehouseType, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addWarehouse(warehouse);
      const newWarehouse: WarehouseType = {
        id: docRef.id,
        ...warehouse,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setWarehouses(prev => [...prev, newWarehouse]);
    } catch (err) {
      console.error('Failed to add warehouse:', err);
      throw new Error('Failed to add warehouse');
    }
  };

  const handleEditWarehouse = async (id: string, data: Partial<WarehouseType>) => {
    try {
      await updateWarehouse(id, data);
      setWarehouses(prev =>
        prev.map(warehouse =>
          warehouse.id === id
            ? { ...warehouse, ...data, updatedAt: new Date().toISOString() }
            : warehouse
        )
      );
    } catch (err) {
      console.error('Failed to update warehouse:', err);
      throw new Error('Failed to update warehouse');
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return;
    
    try {
      await deleteWarehouse(id);
      setWarehouses(prev => prev.filter(warehouse => warehouse.id !== id));
    } catch (err) {
      console.error('Failed to delete warehouse:', err);
      throw new Error('Failed to delete warehouse');
    }
  };

  const openEditModal = (warehouse: WarehouseType) => {
    setSelectedWarehouse(warehouse);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading warehouses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Warehouse Management</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Add Warehouse
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map(warehouse => (
          <div
            key={warehouse.id}
            className="bg-white rounded-lg shadow p-6 space-y-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => openEditModal(warehouse)}
          >
            <div className="flex items-center gap-2">
              <Warehouse className="h-6 w-6 text-gray-400" />
              <h2 className="text-lg font-medium">{warehouse.name}</h2>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Address:</strong> {warehouse.address}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Capacity:</strong> {warehouse.capacity} units
              </p>
              <p className="text-sm text-gray-600">
                <strong>Manager:</strong> {warehouse.manager}
              </p>
              <p className="text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  warehouse.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {warehouse.status.toUpperCase()}
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(warehouse);
                }}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Edit
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteWarehouse(warehouse.id);
                }}
                className="bg-red-100 text-red-700 hover:bg-red-200"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AddWarehouseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddWarehouse}
      />

      {selectedWarehouse && (
        <EditWarehouseModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedWarehouse(null);
          }}
          onEdit={handleEditWarehouse}
          warehouse={selectedWarehouse}
        />
      )}
    </div>
  );
};

export default WarehousePage;
