import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import api from '../../services/http';

interface RevenueStats {
  total_revenue: number;
  revenue_today: number;
  revenue_this_month: number;
  revenue_this_year: number;
  total_orders: number;
  orders_today: number;
  orders_this_month: number;
  average_order_value: number;
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

export default function MerchantRevenue() {
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!authLoading && isAuthenticated && user?.role !== 'merchant' && user?.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchRevenueStats = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual merchant revenue API endpoint
        // const response = await api.get('/merchant/revenue/');
        // setStats(response.data);
        
        // Mock data for now
        setStats({
          total_revenue: 0,
          revenue_today: 0,
          revenue_this_month: 0,
          revenue_this_year: 0,
          total_orders: 0,
          orders_today: 0,
          orders_this_month: 0,
          average_order_value: 0,
        });
      } catch (error) {
        console.error('Failed to fetch revenue stats:', error);
        setStats({
          total_revenue: 0,
          revenue_today: 0,
          revenue_this_month: 0,
          revenue_this_year: 0,
          total_orders: 0,
          orders_today: 0,
          orders_this_month: 0,
          average_order_value: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && (user?.role === 'merchant' || user?.role === 'admin')) {
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
          to="/merchant/dashboard"
          className="text-grabGreen-700 hover:text-grabGreen-800 font-medium mb-4 inline-block"
        >
          &larr; Quay lại Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Doanh thu Cửa hàng</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(stats.total_revenue)}
          color="text-grabGreen-700"
          icon="💰"
        />
        <StatCard
          title="Doanh thu hôm nay"
          value={formatCurrency(stats.revenue_today)}
          color="text-yellow-500"
          icon="📅"
        />
        <StatCard
          title="Doanh thu tháng này"
          value={formatCurrency(stats.revenue_this_month)}
          color="text-blue-500"
          icon="📊"
        />
        <StatCard
          title="Doanh thu năm nay"
          value={formatCurrency(stats.revenue_this_year)}
          color="text-purple-500"
          icon="📈"
        />
        <StatCard
          title="Tổng đơn hàng"
          value={stats.total_orders}
          color="text-green-500"
          icon="📦"
        />
        <StatCard
          title="Đơn hàng hôm nay"
          value={stats.orders_today}
          color="text-orange-500"
          icon="🛒"
        />
        <StatCard
          title="Đơn hàng tháng này"
          value={stats.orders_this_month}
          color="text-red-500"
          icon="🎯"
        />
        <StatCard
          title="Giá trị đơn trung bình"
          value={formatCurrency(stats.average_order_value)}
          color="text-indigo-500"
          icon="📊"
        />
      </div>

      {/* Additional revenue details can be added here */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Biểu đồ doanh thu</h2>
        <p className="text-gray-600">
          Biểu đồ và báo cáo chi tiết doanh thu sẽ được hiển thị ở đây.
        </p>
      </div>
    </div>
  );
}

