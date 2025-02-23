import { useState, useEffect } from 'react';
import { ArrowDownRight, ArrowUpRight, ChartBar, DollarSign, Package, Store, TrendingUp, Warehouse } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getProducts, getTransactions, getStockTransfers, getWarehouses, updateStockTransfer } from '../lib/db';
import TransferValidationModal from '../components/transfers/TransferValidationModal';
import { useAuth } from '../contexts/AuthContext';
import type { Product, Transaction, StockTransfer, Warehouse as WarehouseType } from '../types';

const OwnerDashboardPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    pendingTransfers: 0,
    activeWarehouses: 0
  });
  const [recentTransfers, setRecentTransfers] = useState<StockTransfer[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all required data
      const [products, transactions, transfers, warehouses] = await Promise.all([
        getProducts(),
        getTransactions(),
        getStockTransfers(),
        getWarehouses()
      ]);

      // Calculate metrics
      const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
      const lowStockProducts = products.filter(p => p.stock < 10).length;
      const pendingTransfers = transfers.filter(t => 
        t.status === 'pending' || t.status === 'awaiting-validation'
      ).length;
      const activeWarehouses = warehouses.filter(w => w.status === 'active').length;

      setMetrics({
        totalSales: transactions.length,
        totalRevenue,
        totalProducts: products.length,
        lowStockProducts,
        pendingTransfers,
        activeWarehouses
      });

      // Get recent transfers needing approval (either pending or awaiting-validation)
      const transfersNeedingApproval = transfers
        .filter(t => t.status === 'pending' || t.status === 'awaiting-validation')
        .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
        .slice(0, 5);

      setRecentTransfers(transfersNeedingApproval);

      // Get recent transactions
      setRecentTransactions(
        transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
      );

      setError('');
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleTransferClick = (transfer: StockTransfer) => {
    setSelectedTransfer(transfer);
    setIsValidationModalOpen(true);
  };

  const handleTransferValidation = async (transferId: string, isApproved: boolean, notes: string) => {
    if (!currentUser) return;

    try {
      const validationData = {
        status: isApproved ? 'approved' as const : 'rejected' as const,
        validatedBy: {
          userId: currentUser.uid,
          name: currentUser.displayName || currentUser.email || 'Unknown',
          role: 'owner',
          date: new Date().toISOString(),
          notes: notes
        }
      };

      await updateStockTransfer(transferId, validationData);
      
      // Update local state
      setRecentTransfers(prev =>
        prev.filter(transfer => transfer.id !== transferId)
      );

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        pendingTransfers: prev.pendingTransfers - 1
      }));

    } catch (err) {
      console.error('Failed to validate transfer:', err);
      throw new Error('Failed to validate transfer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Owner Dashboard</h1>
        <Button onClick={loadDashboardData}>Refresh Data</Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <h3 className="text-2xl font-bold">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR'
                }).format(metrics.totalRevenue)}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpRight className="h-4 w-4 text-green-500" />
            <span className="text-green-500 font-medium">+12.5%</span>
            <span className="ml-2 text-gray-500">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <h3 className="text-2xl font-bold">{metrics.totalProducts}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-500 font-medium">{metrics.lowStockProducts} low stock items</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approvals</p>
              <h3 className="text-2xl font-bold">{metrics.pendingTransfers}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Warehouse className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-purple-500 font-medium">{metrics.activeWarehouses} active warehouses</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Transfers */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Transfers Needing Approval</h2>
            <div className="space-y-4">
              {recentTransfers.length > 0 ? (
                recentTransfers.map(transfer => (
                  <div 
                    key={transfer.id} 
                    className="flex flex-col border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleTransferClick(transfer.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-indigo-600">{transfer.transferNumber}</p>
                        <p className="text-sm text-gray-500">
                          Requested on {formatDate(transfer.requestDate)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transfer.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        transfer.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transfer.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{transfer.sourceLocation.name}</span>
                      <ArrowDownRight className="h-4 w-4" />
                      <span>{transfer.destinationLocation.name}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <span>{transfer.totalItems} items</span>
                      <span className="mx-2">•</span>
                      <span>{transfer.totalQuantity} units</span>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Requested by: </span>
                      <span className="font-medium">{transfer.requestedBy.name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">No transfers pending approval</p>
                  <p className="text-sm">All stock transfers have been processed</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Recent Transactions</h2>
            <div className="space-y-4">
              {recentTransactions.map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">Transaction #{transaction.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-medium">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR'
                    }).format(transaction.total)}
                  </p>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent transactions</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChartBar className="h-6 w-6 text-gray-400" />
            <h2 className="text-lg font-medium">Sales Trend</h2>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Sales trend chart will be implemented here</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6 text-gray-400" />
            <h2 className="text-lg font-medium">Revenue Analysis</h2>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Revenue analysis chart will be implemented here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboardPage;
