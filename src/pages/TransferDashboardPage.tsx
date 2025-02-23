import { useState, useEffect } from 'react';
import { ArrowDownRight, ArrowUpRight, Check, Clock, FileDown, Package, TrendingUp, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getStockTransfers, updateStockTransfer } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import TransferValidationModal from '../components/transfers/TransferValidationModal';
import type { StockTransfer } from '../types';

const TransferDashboardPage = () => {
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
  const [recentValidatedTransfers, setRecentValidatedTransfers] = useState<StockTransfer[]>([]);
  const [pendingValidation, setPendingValidation] = useState<StockTransfer[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const transfers = await getStockTransfers();

      // Calculate metrics
      const pendingApprovals = transfers.filter(t => 
        t.status === 'pending' || t.status === 'awaiting-validation'
      ).length;
      const inTransit = transfers.filter(t => t.status === 'in-transit').length;
      const completed = transfers.filter(t => t.status === 'completed').length;
      const urgentTransfers = transfers.filter(t => t.priority === 'urgent').length;

      setMetrics({
        totalSales: transfers.length,
        totalRevenue: 0, // This should be calculated from actual sales data
        totalProducts: 0, // This should be from products count
        lowStockProducts: 0, // This should be from products below threshold
        pendingTransfers: pendingApprovals,
        activeWarehouses: 0 // This should be from warehouses count
      });

      // Get transfers needing validation
      const validationNeeded = transfers
        .filter(t => t.status === 'awaiting-validation' || t.status === 'pending')
        .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
      setPendingValidation(validationNeeded);

      // Get recent validated transfers
      const validatedTransfers = transfers
        .filter(t => t.status === 'approved' || t.status === 'rejected')
        .sort((a, b) => {
          const dateA = t.validatedBy?.date ? new Date(t.validatedBy.date).getTime() : 0;
          const dateB = t.validatedBy?.date ? new Date(t.validatedBy.date).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);
      setRecentValidatedTransfers(validatedTransfers);

      setError('');
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickValidation = async (transferId: string, isApproved: boolean) => {
    if (!currentUser) return;

    try {
      const validationData = {
        status: isApproved ? 'approved' as const : 'rejected' as const,
        validatedBy: {
          userId: currentUser.uid,
          name: currentUser.displayName || currentUser.email || 'Unknown',
          role: 'owner',
          date: new Date().toISOString(),
          notes: isApproved ? 'Quick approval from dashboard' : 'Quick rejection from dashboard'
        }
      };

      await updateStockTransfer(transferId, validationData);
      
      // Update local state
      setPendingValidation(prev =>
        prev.filter(transfer => transfer.id !== transferId)
      );

      // Add to recent validated transfers
      const validatedTransfer = pendingValidation.find(t => t.id === transferId);
      if (validatedTransfer) {
        setRecentValidatedTransfers(prev => [{
          ...validatedTransfer,
          ...validationData
        }, ...prev].slice(0, 5));
      }

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

  const handleOpenValidationModal = (transfer: StockTransfer) => {
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
      setPendingValidation(prev =>
        prev.filter(transfer => transfer.id !== transferId)
      );

      // Add to recent validated transfers
      const validatedTransfer = pendingValidation.find(t => t.id === transferId);
      if (validatedTransfer) {
        setRecentValidatedTransfers(prev => [{
          ...validatedTransfer,
          ...validationData
        }, ...prev].slice(0, 5));
      }

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        pendingTransfers: prev.pendingTransfers - 1
      }));

      setIsValidationModalOpen(false);
      setSelectedTransfer(null);

    } catch (err) {
      console.error('Failed to validate transfer:', err);
      throw new Error('Failed to validate transfer');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <h1 className="text-2xl font-semibold">Transfer Dashboard</h1>
        <Button onClick={loadDashboardData}>Refresh Data</Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Pending Validation Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Transfers Needing Validation</h2>
          <div className="space-y-4">
            {pendingValidation.length > 0 ? (
              pendingValidation.map(transfer => (
                <div 
                  key={transfer.id}
                  className="flex flex-col border rounded-lg p-4 hover:bg-gray-50 transition-colors"
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
                  <div className="mt-4 flex justify-between items-center">
                    <button
                      onClick={() => handleOpenValidationModal(transfer)}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </button>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleQuickValidation(transfer.id, false)}
                        className="bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleQuickValidation(transfer.id, true)}
                        className="bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No transfers pending validation</p>
                <p className="text-sm">All stock transfers have been processed</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Validated Transfers Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Recent Validated Transfers</h2>
          <div className="space-y-4">
            {recentValidatedTransfers.length > 0 ? (
              recentValidatedTransfers.map(transfer => (
                <div 
                  key={transfer.id}
                  className="flex flex-col border rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-indigo-600">{transfer.transferNumber}</p>
                      <p className="text-sm text-gray-500">
                        Validated on {formatDate(transfer.validatedBy?.date || '')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 text-xs rounded-full mb-2 ${
                        transfer.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {transfer.status.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transfer.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        transfer.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transfer.priority.toUpperCase()}
                      </span>
                    </div>
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
                  {transfer.validatedBy?.notes && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Notes:</strong> {transfer.validatedBy.notes}
                    </div>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    Validated by: {transfer.validatedBy?.name}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No recent validations</p>
                <p className="text-sm">Validated transfers will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedTransfer && (
        <TransferValidationModal
          isOpen={isValidationModalOpen}
          onClose={() => {
            setIsValidationModalOpen(false);
            setSelectedTransfer(null);
          }}
          transfer={selectedTransfer}
          onValidate={handleTransferValidation}
        />
      )}
    </div>
  );
};

export default TransferDashboardPage;
