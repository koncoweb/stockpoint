import { useState } from 'react';
import { X, Check, CircleX, Box, ArrowDownRight } from 'lucide-react';
import { Button } from '../ui/Button';
import type { StockTransfer } from '../../types';

interface TransferValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: StockTransfer;
  onValidate: (transferId: string, isApproved: boolean, notes: string) => Promise<void>;
}

const TransferValidationModal = ({ isOpen, onClose, transfer, onValidate }: TransferValidationModalProps) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleValidate = async (isApproved: boolean) => {
    try {
      setLoading(true);
      setError('');
      await onValidate(transfer.id, isApproved, notes);
      onClose();
    } catch (err) {
      setError('Failed to validate transfer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Transfer Validation</h2>
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

        <div className="space-y-4">
          {/* Transfer Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Transfer Number</p>
                <p className="text-indigo-600">{transfer.transferNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Priority</p>
                <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                  transfer.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  transfer.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {transfer.priority.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">Transfer Route</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-medium">{transfer.sourceLocation.name}</span>
                <ArrowDownRight className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{transfer.destinationLocation.name}</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">Items ({transfer.totalItems})</p>
              <div className="mt-2 space-y-2">
                {transfer.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 text-sm">
                    <Box className="h-4 w-4 text-gray-400" />
                    <span className="flex-1">Product ID: {item.productId}</span>
                    <span className="text-gray-600">Qty: {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">Requested By</p>
              <p className="mt-1">{transfer.requestedBy.name} ({transfer.requestedBy.role})</p>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">Expected Delivery</p>
              <p className="mt-1">
                {new Date(transfer.expectedDeliveryDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Validation Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Validation Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder="Add any notes about this validation..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleValidate(false)}
              className="bg-red-100 text-red-700 hover:bg-red-200"
              disabled={loading}
            >
              <CircleX className="h-5 w-5 mr-2" />
              Reject Transfer
            </Button>
            <Button
              type="button"
              onClick={() => handleValidate(true)}
              disabled={loading}
            >
              <Check className="h-5 w-5 mr-2" />
              Approve Transfer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferValidationModal;
