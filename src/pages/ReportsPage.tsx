import { BarChart2 } from 'lucide-react';

const ReportsPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sales Summary Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Sales Summary</h2>
          <div className="text-3xl font-bold">
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR'
            }).format(5000000)}
          </div>
          <p className="text-sm text-gray-500 mt-1">Today's Sales</p>
        </div>

        {/* Transactions Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Transactions</h2>
          <div className="text-3xl font-bold">24</div>
          <p className="text-sm text-gray-500 mt-1">Total Transactions Today</p>
        </div>

        {/* Stock Alert Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Low Stock Alert</h2>
          <div className="text-3xl font-bold text-red-500">3</div>
          <p className="text-sm text-gray-500 mt-1">Products below minimum stock</p>
        </div>
      </div>

      {/* Placeholder for charts */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="h-6 w-6 text-gray-400" />
          <h2 className="text-lg font-medium">Sales Trend</h2>
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">Chart will be implemented here</p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
