import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Product, Category, Warehouse, WarehouseStock } from '../../types';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string, product: Partial<Product>) => Promise<void>;
  product: Product;
}

const EditProductModal = ({ isOpen, onClose, onEdit, product }: EditProductModalProps) => {
  const [formData, setFormData] = useState({
    name: product.name,
    price: String(product.price),
    category: product.category,
    sku: product.sku
  });
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    // Load categories from localStorage
    const storedCategories = localStorage.getItem('categories');
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    }

    // Load warehouses and initialize warehouse stocks
    const storedWarehouses = localStorage.getItem('warehouses');
    if (storedWarehouses) {
      const loadedWarehouses = JSON.parse(storedWarehouses);
      setWarehouses(loadedWarehouses);
      
      // Initialize warehouse stocks with existing product stocks or zero
      const initialStocks = loadedWarehouses.map((warehouse: Warehouse) => {
        const existingStock = product.stocks.find(
          stock => stock.warehouseName === warehouse.name
        );
        return {
          warehouseName: warehouse.name,
          quantity: existingStock ? existingStock.quantity : 0
        };
      });
      setWarehouseStocks(initialStocks);
    }
  }, [product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWarehouseStockChange = (warehouseName: string, quantity: string) => {
    setWarehouseStocks(prev =>
      prev.map(stock =>
        stock.warehouseName === warehouseName
          ? { ...stock, quantity: parseInt(quantity) || 0 }
          : stock
      )
    );
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Product name is required';
    if (!formData.price || isNaN(Number(formData.price))) return 'Valid price is required';
    if (!formData.category.trim()) return 'Category is required';
    if (!formData.sku.trim()) return 'SKU is required';
    
    const totalStock = warehouseStocks.reduce((sum, stock) => sum + stock.quantity, 0);
    if (totalStock <= 0) return 'Total stock across warehouses must be greater than 0';
    
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

      const totalStock = warehouseStocks.reduce((sum, stock) => sum + stock.quantity, 0);
      
      await onEdit(product.id, {
        name: formData.name,
        price: Number(formData.price),
        stock: totalStock,
        category: formData.category,
        sku: formData.sku,
        stocks: warehouseStocks.filter(stock => stock.quantity > 0) // Only include non-zero stocks
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Product</h2>
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
              Product Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter SKU"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter price"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Stock Distribution
            </label>
            <div className="space-y-3">
              {warehouses.map(warehouse => (
                <div key={warehouse.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">
                      {warehouse.name}
                    </label>
                    <input
                      type="number"
                      value={warehouseStocks.find(stock => stock.warehouseName === warehouse.name)?.quantity || 0}
                      onChange={(e) => handleWarehouseStockChange(warehouse.name, e.target.value)}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter quantity"
                      min="0"
                    />
                  </div>
                  <div className="text-sm text-gray-500 w-24">
                    Max: {warehouse.capacity}
                  </div>
                </div>
              ))}
              <div className="text-sm text-gray-500 mt-2">
                Total Stock: {warehouseStocks.reduce((sum, stock) => sum + stock.quantity, 0)}
              </div>
            </div>
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
              {loading ? 'Updating...' : 'Update Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
