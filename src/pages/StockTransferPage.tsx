import { useState, useEffect } from 'react';
import { ArrowLeftRight, Check, CircleX, Plus, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import TransferModal from '../components/transfers/TransferModal';
import TransferValidationModal from '../components/transfers/TransferValidationModal';
import { getStockTransfers, addStockTransfer, updateStockTransfer, deleteStockTransfer } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import type { StockTransfer, TransferStatus } from '../types';

const StockTransferPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const { currentUser } = useAuth();

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const fetchedTransfers = await getStockTransfers();
      setTransfers(fetchedTransfers);
      setError('');
    } catch (err) {
      setError('Failed to load transfers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedTransfer(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (transfer: StockTransfer) => {
    setModalMode('edit');
    setSelectedTransfer(transfer);
    setIsModalOpen(true);
  };

  const handleOpenValidationModal = (transfer: StockTransfer) => {
    setSelectedTransfer(transfer);
    setIsValidationModalOpen(true);
  };

  const handleRowClick = (transfer: StockTransfer) => {
    // First set the selected transfer
    setSelectedTransfer(transfer);

    // Then determine which modal to show based on status
    if (transfer.status === 'awaiting-validation' || transfer.status === 'pending') {
      setIsValidationModalOpen(true);
    } else if (['draft', 'approved', 'in-transit', 'partially-received'].includes(transfer.status)) {
      setModalMode('edit');
      setIsModalOpen(true);
    }
  };

  const handleModalSubmit = async (transferData: Omit<StockTransfer, 'id'>) => {
    try {
      if (modalMode === 'add') {
        const docRef = await addStockTransfer(transferData);
        setTransfers(prev => [...prev, { id: docRef.id, ...transferData }]);
      } else if (selectedTransfer) {
        await updateStockTransfer(selectedTransfer.id, transferData);
        setTransfers(prev =>
          prev.map(t =>
            t.id === selectedTransfer.id
              ? { ...t, ...transferData }
              : t
          )
        );
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save transfer:', err);
      throw new Error('Failed to save transfer');
    }
  };

  const handleDeleteTransfer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transfer?')) return;
    
    try {
      await deleteStockTransfer(id);
      setTransfers(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete transfer:', err);
      throw new Error('Failed to delete transfer');
    }
  };

  const handleValidateTransfer = async (transferId: string, isApproved: boolean, notes: string) => {
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
      
      setTransfers(prev =>
        prev.map(t =>
          t.id === transferId
            ? { ...t, ...validationData }
            : t
        )
      );
      setIsValidationModalOpen(false);
      setSelectedTransfer(null);
    } catch (err) {
      console.error('Failed to validate transfer:', err);
      throw new Error('Failed to validate transfer');
    }
  };

  const getStatusColor = (status: TransferStatus): string => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'awaiting-validation': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'in-transit': 'bg-purple-100 text-purple-800',
      'partially-received': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.draft;
  };

  const renderActions = (transfer: StockTransfer) => {
    if (transfer.status === 'awaiting-validation' || transfer.status === 'pending') {
      return (
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenValidationModal(transfer);
            }}
            className="text-indigo-600 hover:text-indigo-900"
          >
            Validate
          </button>
        </div>
      );
    }

    if (['completed', 'cancelled', 'rejected'].includes(transfer.status)) {
      return null; // No actions for completed, cancelled, or rejected transfers
    }

    return (
      <div className="flex justify-end gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenEditModal(transfer);
          }}
          className="text-indigo-600 hover:text-indigo-900"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteTransfer(transfer.id);
          }}
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </button>
      </div>
    );
  };

  // Filter transfers based on search term
  const filteredTransfers = transfers.filter(transfer =>
    transfer.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.sourceLocation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.destinationLocation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading transfers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Stock Transfers</h1>
        <Button onClick={handleOpenAddModal}>
          <Plus className="h-5 w-5 mr-2" />
          New Transfer
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search transfers..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transfer Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                From
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Validation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransfers.map((transfer) => (
              <tr 
                key={transfer.id}
                onClick={() => handleRowClick(transfer)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <ArrowLeftRight className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="font-medium">{transfer.transferNumber}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {transfer.sourceLocation.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {transfer.destinationLocation.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transfer.status)}`}>
                    {transfer.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {transfer.validatedBy ? (
                    <div className="text-sm">
                      <span className="text-green-600">✓ Validated by</span>
                      <br />
                      <span className="text-gray-500">{transfer.validatedBy.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">Not validated</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    transfer.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    transfer.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    transfer.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {transfer.priority.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {transfer.totalItems} items ({transfer.totalQuantity} units)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {renderActions(transfer)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TransferModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTransfer(null);
        }}
        onSubmit={handleModalSubmit}
        transfer={selectedTransfer || undefined}
        mode={modalMode}
      />

      {selectedTransfer && (
        <TransferValidationModal
          isOpen={isValidationModalOpen}
          onClose={() => {
            setIsValidationModalOpen(false);
            setSelectedTransfer(null);
          }}
          transfer={selectedTransfer}
          onValidate={handleValidateTransfer}
        />
      )}
    </div>
  );
};

export default StockTransferPage;
