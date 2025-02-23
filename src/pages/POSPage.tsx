import { useState, useEffect } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getProducts } from '../lib/db';
import type { Product, TransactionItem } from '../types';

const POSPage = () => {
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
      setError('');
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.productId === product.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { productId: product.id, quantity: 1, price: product.price }];
    });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row gap-4">
      {/* Products Section */}
      <div className="flex-1 bg-white rounded-lg shadow p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="text-left">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-gray-600">Stock: {product.stock}</p>
                <p className="text-sm font-medium text-green-600">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR'
                  }).format(product.price)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full md:w-96 bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-6 w-6" />
          <h2 className="text-lg font-medium">Current Cart</h2>
        </div>

        <div className="flex-1 overflow-auto">
          {cart.map(item => {
            const product = products.find(p => p.id === item.productId);
            return (
              <div key={item.productId} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">{product?.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.quantity} x {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR'
                    }).format(item.price)}
                  </p>
                </div>
                <p className="font-medium">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR'
                  }).format(item.price * item.quantity)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">Total</span>
            <span className="font-bold">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR'
              }).format(total)}
            </span>
          </div>

          <Button
            className="w-full"
            disabled={cart.length === 0}
            onClick={() => {
              // Handle checkout
              alert('Checkout functionality will be implemented here');
            }}
          >
            Checkout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default POSPage;
