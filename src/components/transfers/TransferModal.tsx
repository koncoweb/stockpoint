import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { getProducts, getWarehouses } from '../../lib/db';
import type { Product, StockTransfer, Location, TransferType, TransferPriority, Warehouse } from '../../types';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transfer: Omit<StockTransfer, 'id'>) => Promise<void>;
  transfer?: StockTransfer;
  mode: 'add' | 'edit';
}

const TransferModal = ({ isOpen, onClose, onSubmit, transfer, mode }: TransferModalProps) => {
  const [formData, setFormData] = useState({
    transferNumber: '',
    transferType: 'warehouse-to-warehouse' as TransferType,
    sourceLocation: {} as Location,
    destinationLocation: {} as Location,
    priority: 'medium' as TransferPriority,
    expectedDeliveryDate: '',
    notes: ''
  });
  const [selectedProducts, setSelectedProducts] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{
    source?: string;
    destination?: string;
  }>({});

  

  useEffect(() => {
    const loadData = async () => {
      if (isOpen) {
        try {
          setLoadingProducts(true);
          setLoadingWarehouses(true);
          
          // Load products from Firebase
          const fetchedProducts = await getProducts();
          setProducts(fetchedProducts);
          
          // Load warehouses from Firebase
          const fetchedWarehouses = await getWarehouses();
          setWarehouses(fetchedWarehouses);
          
          setError('');
        } catch (err) {
          console.error('Error loading data:', err);
          setError('Failed to load necessary data');
        } finally {
          setLoadingProducts(false);
          setLoadingWarehouses(false);
        }
      }
    };

    loadData();
  }, [isOpen]);

  useEffect(() => {
    if (transfer && mode === 'edit') {
      setFormData({
        transferNumber: transfer.transferNumber,
        transferType: transfer.transferType,
        sourceLocation: transfer.sourceLocation,
        destinationLocation: transfer.destinationLocation,
        priority: transfer.priority,
        expectedDeliveryDate: transfer.expectedDeliveryDate,
        notes: transfer.notes || ''
      });
      setSelectedProducts(transfer.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })));
    } else {
      // Generate a new transfer number for new transfers
      const newTransferNumber = `TRF-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      setFormData(prev => ({ ...prev, transferNumber: newTransferNumber }));
    }
  }, [transfer, mode]);

  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (type: 'source' | 'destination', warehouseId: string) => {
    const selectedWarehouse = warehouses.find(w => w.id === warehouseId);
    if (selectedWarehouse) {
      const location: Location = {
        id: selectedWarehouse.id,
        name: selectedWarehouse.name,
        type: 'warehouse',
        address: selectedWarehouse.address
      };
      
      setFormData(prev => ({
        ...prev,
        [type === 'source' ? 'sourceLocation' : 'destinationLocation']: location
      }));

      // Clear validation errors when changing selection
      setValidationErrors(prev => ({
        ...prev,
        [type]: undefined
      }));

      // Validate locations are different
      if (type === 'source' && formData.destinationLocation.id === warehouseId) {
        setValidationErrors(prev => ({
          ...prev,
          destination: 'Source and destination warehouses must be different'
        }));
      } else if (type === 'destination' && formData.sourceLocation.id === warehouseId) {
        setValidationErrors(prev => ({
          ...prev,
          destination: 'Source and destination warehouses must be different'
        }));
      }
    }
  };

  const handleAddProduct = () => {
    setSelectedProducts(prev => [...prev, { productId: '', quantity: 1 }]);
  };

  const handleProductChange = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    setSelectedProducts(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors: { source?: string; destination?: string } = {};

    if (!formData.sourceLocation.id) {
      errors.source = 'Source warehouse is required';
    }
    if (!formData.destinationLocation.id) {
      errors.destination = 'Destination warehouse is required';
    }
    if (formData.sourceLocation.id === formData.destinationLocation.id) {
      errors.destination = 'Source and destination warehouses must be different';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return 'Please correct the warehouse selection errors';
    }

    if (!formData.expectedDeliveryDate) return 'Expected delivery date is required';
    if (selectedProducts.length === 0) return 'At least one product is required';
    if (selectedProducts.some(p => !p.productId || p.quantity <= 0)) {
      return 'All products must have valid quantities';
    }
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

      const transferData: Omit<StockTransfer, 'id'> = {
        transferNumber: formData.transferNumber,
        transferType: formData.transferType,
        sourceLocation: formData.sourceLocation,
        destinationLocation: formData.destinationLocation,
        priority: formData.priority,
        status: 'awaiting-validation', // Set initial status to awaiting validation
        requestDate: new Date().toISOString(),
        expectedDeliveryDate: formData.expectedDeliveryDate,
        notes: formData.notes,
        requestedBy: {
          userId: '1', // This should come from your auth context
          name: 'John Doe', // This should come from your auth context
          role: 'staff' // This should come from your auth context
        },
        items: selectedProducts.map(p => ({
          productId: p.productId,
          quantity: p.quantity,
          currentStock: products.find(prod => prod.id === p.productId)?.stock || 0,
          condition: 'good'
        })),
        totalItems: selectedProducts.length,
        totalQuantity: selectedProducts.reduce((sum, p) => sum + p.quantity, 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSubmit(transferData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transfer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loadingWarehouses || loadingProducts) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  // Get available destination warehouses (excluding source warehouse)
  const availableDestinationWarehouses = warehouses.filter(
    w => w.id !== formData.sourceLocation.id && w.status === 'active'
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {mode === 'add' ? 'Create New Transfer' : 'Edit Transfer'}
          </h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transfer Number
              </label>
              <input
                type="text"
                name="transferNumber"
                value={formData.transferNumber}
                readOnly
                className="w-full p-2 border rounded bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transfer Type
              </label>
              <select
                name="transferType"
                value={formData.transferType}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="warehouse-to-warehouse">Warehouse to Warehouse</option>
                <option value="warehouse-to-store">Warehouse to Store</option>
                <option value="store-to-warehouse">Store to Warehouse</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Location
              </label>
              <select
                value={formData.sourceLocation.id || ''}
                onChange={(e) => handleLocationChange('source', e.target.value)}
                className={`w-full p-2 border rounded ${
                  validationErrors.source ? 'border-red-500' : ''
                }`}
              >
                <option value="">Select source warehouse</option>
                {warehouses.filter(w => w.status === 'active').map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              {validationErrors.source && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.source}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Location
              </label>
              <select
                value={formData.destinationLocation.id || ''}
                onChange={(e) => handleLocationChange('destination', e.target.value)}
                className={`w-full p-2 border rounded ${
                  validationErrors.destination ? 'border-red-500' : ''
                }`}
              >
                <option value="">Select destination warehouse</option>
                {availableDestinationWarehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              {validationErrors.destination && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.destination}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                name="expectedDeliveryDate"
                value={formData.expectedDeliveryDate}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Products
            </label>
            <div className="space-y-2">
              {selectedProducts.map((product, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={product.productId}
                    onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                    className="flex-1 p-2 border rounded"
                  >
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={product.quantity}
                    onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value))}
                    className="w-24 p-2 border rounded"
                    min="1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(index)}
                    className="p-2 text-red-600 hover:text-red-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                onClick={handleAddProduct}
                className="w-full mt-2"
              >
                Add Product
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Add any additional notes here..."
            />
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
              {loading ? 'Saving...' : mode === 'add' ? 'Create Transfer' : 'Update Transfer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;
