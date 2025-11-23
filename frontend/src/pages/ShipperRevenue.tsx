import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import api from '../services/http';

interface RevenueStats {
  total_earnings: number;
  total_deliveries: number;
  earnings_today: number;
  deliveries_today: number;
  earnings_this_month: number;
  deliveries_this_month: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  color: string;
  icon: string;
}> = ({ title, value, color, icon }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col transition duration-300 hover:shadow-xl border border-gray-100">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className={`p-2 rounded-full ${color} bg-opacity-20 text-2xl`}>
        {icon}
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
  </div>
);

export default function ShipperRevenue() {
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!authLoading && isAuthenticated && user?.role !== 'shipper') {
      navigate('/');
      return;
    }

    const fetchRevenueStats = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual shipper revenue API endpoint
        // const response = await api.get('/shipper/revenue/');
        // setStats(response.data);
        
        // Mock data for now
        setStats({
          total_earnings: 0,
          total_deliveries: 0,
          earnings_today: 0,
          deliveries_today: 0,
          earnings_this_month: 0,
          deliveries_this_month: 0,
        });
      } catch (error) {
        console.error('Failed to fetch revenue stats:', error);
        setStats({
          total_earnings: 0,
          total_deliveries: 0,
          earnings_today: 0,
          deliveries_today: 0,
          earnings_this_month: 0,
          deliveries_this_month: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'shipper') {
      fetchRevenueStats();
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Đang tải thống kê doanh thu...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Không thể tải dữ liệu.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Link
          to="/shipper"
          className="text-grabGreen-700 hover:text-grabGreen-800 font-medium mb-4 inline-block"
        >
          &larr; Quay lại Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Doanh thu của tôi</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Tổng thu nhập"
          value={formatCurrency(stats.total_earnings)}
          color="text-grabGreen-700"
          icon="💰"
        />
        <StatCard
          title="Tổng chuyến giao"
          value={stats.total_deliveries}
          color="text-blue-500"
          icon="📦"
        />
        <StatCard
          title="Thu nhập hôm nay"
          value={formatCurrency(stats.earnings_today)}
          color="text-yellow-500"
          icon="📅"
        />
        <StatCard
          title="Chuyến giao hôm nay"
          value={stats.deliveries_today}
          color="text-green-500"
          icon="🚗"
        />
        <StatCard
          title="Thu nhập tháng này"
          value={formatCurrency(stats.earnings_this_month)}
          color="text-purple-500"
          icon="📊"
        />
        <StatCard
          title="Chuyến giao tháng này"
          value={stats.deliveries_this_month}
          color="text-red-500"
          icon="📈"
        />
      </div>

      {/* Additional revenue details can be added here */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Lịch sử giao hàng</h2>
        <p className="text-gray-600">
          Chi tiết lịch sử giao hàng và thu nhập sẽ được hiển thị ở đây.
        </p>
      </div>
    </div>
  );
}

