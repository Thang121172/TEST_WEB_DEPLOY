import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext'; // ✅ sửa lại path
import api from '../../services/http';

// ===================================
// INTERFACES (Mock)
// ===================================

interface OrderSummary {
  id: number;
  customer_name: string;
  items_count: number;
  total_price: number;
  time_ago: string;
  status: 'Pending' | 'Confirmed' | 'Ready' | 'Cancelled';
}

interface MerchantStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  store_rating: number;
}

// ===================================
// MOCK DATA & UTILITY
// ===================================

const mockStats: MerchantStats = {
  total_orders: 1250,
  total_revenue: 155000000,
  pending_orders: 3,
  store_rating: 4.8,
};

const mockRecentOrders: OrderSummary[] = [
  {
    id: 9001,
    customer_name: 'Trần Văn B',
    items_count: 2,
    total_price: 105000,
    time_ago: '5 phút trước',
    status: 'Pending',
  },
  {
    id: 9002,
    customer_name: 'Lê Thị C',
    items_count: 1,
    total_price: 70000,
    time_ago: '10 phút trước',
    status: 'Pending',
  },
  {
    id: 9003,
    customer_name: 'Phạm Thanh D',
    items_count: 4,
    total_price: 210000,
    time_ago: '30 phút trước',
    status: 'Confirmed',
  },
  {
    id: 9004,
    customer_name: 'Nguyễn Văn E',
    items_count: 3,
    total_price: 155000,
    time_ago: '1 giờ trước',
    status: 'Ready',
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// ===================================
// STATS CARD COMPONENT
// ===================================
const StatCard: React.FC<{
  title: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}> = ({ title, value, color, icon }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col transition duration-300 hover:shadow-xl border border-gray-100">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className={`p-1 rounded-full ${color} bg-opacity-20 text-lg`}>
        {icon}
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

// ===================================
// ORDER ROW COMPONENT
// ===================================
const OrderRow: React.FC<{ order: OrderSummary }> = ({ order }) => {
  const statusClasses: Record<OrderSummary['status'], string> = {
    Pending: 'bg-red-100 text-red-700',
    Confirmed: 'bg-yellow-100 text-yellow-700',
    Ready: 'bg-blue-100 text-blue-700',
    Cancelled: 'bg-gray-100 text-gray-700',
  };

  return (
    <tr className="border-b hover:bg-gray-50 transition duration-100">
      <td className="py-3 px-4 text-sm font-medium text-gray-900">
        #{order.id}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {order.customer_name}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {order.items_count} món
      </td>
      <td className="py-3 px-4 text-sm font-semibold text-grabGreen-700">
        {formatCurrency(order.total_price)}
      </td>
      <td className="py-3 px-4">
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${statusClasses[order.status]}`}
        >
          {order.status === 'Pending'
            ? 'Chờ xác nhận'
            : order.status === 'Confirmed'
            ? 'Đã xác nhận'
            : order.status === 'Ready'
            ? 'Đã sẵn sàng'
            : 'Đã hủy'}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-gray-500">{order.time_ago}</td>
      <td className="py-3 px-4 text-right">
        <Link
          to={`/merchant/orders/${order.id}/confirm`}
          className="text-grabGreen-600 hover:text-grabGreen-800 text-sm font-medium transition duration-150"
        >
          Chi tiết &rarr;
        </Link>
      </td>
    </tr>
  );
};

// ===================================
// MAIN COMPONENT
// ===================================

export default function MerchantDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();

  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Điều hướng bảo vệ role
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    } else if (
      !authLoading &&
      isAuthenticated &&
      user?.role !== 'merchant' &&
      user?.role !== 'admin'
    ) {
      // Nếu không phải merchant/admin thì đẩy về trang merchant chính (ví dụ trang giới thiệu / đăng ký)
      navigate('/merchant', { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // TODO: khi backend sẵn: gọi /api/merchant_dashboard/ kèm Bearer token
      // const token = localStorage.getItem('authToken');
      // const r = await api.get('/merchant_dashboard/', {
      //   headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      // });
      // setStats(r.data?.stats ?? ... );
      // setRecentOrders(r.data?.recent_orders ?? ... );

      // Hiện tại dùng mock
      setTimeout(() => {
        setStats(mockStats);
        setRecentOrders(mockRecentOrders);
        setLoading(false);
      }, 800);
    } catch (e) {
      console.error('Failed to fetch merchant dashboard data:', e);

      // fallback mock nếu gọi API fail
      setStats(mockStats);
      setRecentOrders(mockRecentOrders);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'merchant' || user?.role === 'admin')) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">
          Đang tải Trang tổng quan cửa hàng...
        </div>
      </div>
    );
  }

  // Nếu lỡ stats null vì lỗi logic
  if (!stats) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-lg text-gray-600">
          Không thể tải dữ liệu cửa hàng.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">
        Dashboard Cửa hàng - {user?.name || 'Cửa hàng của tôi'}
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Đơn hàng Chờ xác nhận"
          value={stats.pending_orders}
          color="text-red-500"
          icon="🔔"
        />
        <StatCard
          title="Tổng Doanh thu"
          value={formatCurrency(stats.total_revenue)}
          color="text-grabGreen-700"
          icon="💰"
        />
        <StatCard
          title="Tổng đơn đã hoàn thành"
          value={stats.total_orders}
          color="text-blue-500"
          icon="📈"
        />
        <StatCard
          title="Đánh giá Cửa hàng"
          value={`${stats.store_rating} / 5`}
          color="text-yellow-500"
          icon="⭐"
        />
      </div>

      {/* Recent Orders */}
      <section className="bg-white rounded-xl shadow-2xl p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800">Đơn hàng Gần đây</h2>
          <Link
            to="/merchant/orders"
            className="text-grabGreen-600 font-medium hover:underline"
          >
            Xem tất cả &rarr;
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã Đơn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SL Món
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-6 text-gray-500">
            Hiện chưa có đơn hàng nào gần đây.
          </div>
        )}
      </section>
    </div>
  );
}
