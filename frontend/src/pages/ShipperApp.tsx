import React, { useState, useEffect } from 'react';
import api from '../services/http';
import { useAuthContext } from '../context/AuthContext';

// ===================================
// INTERFACES (Mock)
// ===================================

interface Order {
  id: number;
  store_name: string;
  store_address: string;
  customer_address: string;
  delivery_fee: number;
  distance_km: number;
  status: 'Ready' | 'In Progress' | 'Delivered';
}

interface ShipperSummary {
  total_deliveries: number;
  total_earnings: number;
  current_orders: number;
}

// API Response types
interface OrderResponse {
  id: number;
  status: string;
  created_at: string;
  merchant: {
    id: number;
    name: string;
  };
  total_amount: string;
}

// ===================================
// UTILITY
// ===================================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// ===================================
// SMALL COMPONENTS
// ===================================

const StatCard: React.FC<{
  title: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}> = ({ title, value, color, icon }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4 transition duration-300 hover:shadow-xl border border-gray-100">
    <div className={`p-3 rounded-full ${color} bg-opacity-20 text-xl`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const OrderCard: React.FC<{
  order: Order;
  onAction: (orderId: number, action: 'accept' | 'complete') => void;
  onReportIssue?: (orderId: number) => void;
}> = ({ order, onAction, onReportIssue }) => {
  const isAvailable = order.status === 'Ready';

  const handleAction = () => {
    if (isAvailable) {
      onAction(order.id, 'accept');
    } else {
      onAction(order.id, 'complete');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 space-y-3 border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2">
        <div className="text-lg font-bold text-gray-800">
          Đơn hàng #{order.id}
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full border ${
            isAvailable
              ? 'bg-grabGreen-50 text-grabGreen-700 border-grabGreen-300'
              : 'bg-blue-50 text-blue-700 border-blue-300'
          }`}
        >
          {isAvailable ? 'Sẵn sàng giao' : 'Đang trên đường'}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex items-start text-red-600 font-medium">
          <span className="mr-2 text-xl leading-none">📍</span>
          <div>
            <div>Lấy hàng:</div>
            <div>
              {order.store_address} ({order.store_name})
            </div>
          </div>
        </div>

        <div className="flex items-start text-blue-600 font-medium">
          <span className="mr-2 text-xl leading-none"></span>
          <div>
            <div>Giao đến:</div>
            <div>{order.customer_address}</div>
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>Khoảng cách: {order.distance_km} km</span>
          <span>Phí giao hàng: {formatCurrency(order.delivery_fee)}</span>
        </div>
      </div>

      {/* Action */}
      <div className="space-y-2">
        <button
          onClick={handleAction}
          className={`w-full py-2 text-white rounded-full font-semibold transition duration-150 shadow-md ${
            isAvailable
              ? 'bg-grabGreen-700 hover:bg-grabGreen-800'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isAvailable ? 'Nhận đơn này' : 'Hoàn tất giao hàng'}
        </button>
        {!isAvailable && onReportIssue && (
          <button
            onClick={() => onReportIssue(order.id)}
            className="w-full py-2 text-red-600 border-2 border-red-600 rounded-full font-semibold transition duration-150 hover:bg-red-50"
          >
            Báo cáo vấn đề
          </button>
        )}
      </div>
    </div>
  );
};

// ===================================
// MAIN COMPONENT
// ===================================

export default function ShipperApp() {
  const { user } = useAuthContext();

  const [summary, setSummary] = useState<ShipperSummary | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [inProgressOrder, setInProgressOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Lấy data từ API
  const fetchShipperData = async () => {
    setLoading(true);
    try {
      // Lấy danh sách đơn hàng chưa giao xong
      const response = await api.get('/shipper/');
      const orders: OrderResponse[] = response.data || [];
      
      // Phân loại đơn hàng
      const available = orders.filter(o => o.status === 'PENDING' || o.status === 'READY_FOR_PICKUP');
      const inProgress = orders.find(o => o.status === 'DELIVERING' && o.merchant) || null;
      
      // Transform data
      const availableOrders: Order[] = available.map(o => ({
        id: o.id,
        store_name: o.merchant.name,
        store_address: '', // API chưa trả về, có thể thêm sau
        customer_address: '', // API chưa trả về, có thể thêm sau
        delivery_fee: 0, // API chưa trả về, có thể tính sau
        distance_km: 0, // API chưa trả về, có thể tính sau
        status: o.status === 'READY_FOR_PICKUP' ? 'Ready' : 'Pending',
      }));
      
      const inProgressOrder: Order | null = inProgress ? {
        id: inProgress.id,
        store_name: inProgress.merchant.name,
        store_address: '',
        customer_address: '',
        delivery_fee: 0,
        distance_km: 0,
        status: 'In Progress',
      } : null;
      
      // Tính summary (có thể gọi API riêng sau)
      const summary: ShipperSummary = {
        total_deliveries: 0, // Cần API endpoint riêng
        total_earnings: 0, // Cần API endpoint riêng
        current_orders: inProgress ? 1 : 0,
      };
      
      setSummary(summary);
      setAvailableOrders(availableOrders);
      setInProgressOrder(inProgressOrder);
      setLoading(false);
    } catch (e) {
      console.error('Failed to fetch shipper data:', e);
      setSummary(null);
      setAvailableOrders([]);
      setInProgressOrder(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipperData();
  }, []);

  // Nhận đơn hoặc hoàn tất giao
  const handleOrderAction = async (
    orderId: number,
    action: 'accept' | 'complete'
  ) => {
    setLoading(true);

    try {
      if (action === 'accept') {
        // Gọi API để nhận đơn
        await api.post(`/shipper/${orderId}/pickup/`);
        
        // Refresh data
        await fetchShipperData();
        console.log(`Đã nhận đơn hàng #${orderId}.`);
      } else if (action === 'complete') {
        // Cập nhật trạng thái đơn hàng thành DELIVERED
        await api.patch(`/shipper/${orderId}/`, {
          status: 'DELIVERED'
        });
        
        // Refresh data
        await fetchShipperData();
        console.log(`Đã hoàn tất giao đơn hàng #${orderId}.`);
      }
    } catch (e) {
      console.error(`Failed to ${action} order:`, e);
      alert(`Không thể ${action === 'accept' ? 'nhận' : 'hoàn tất'} đơn hàng. Vui lòng thử lại.`);
    } finally {
      setLoading(false);
    }
  };

  // Báo cáo vấn đề
  const handleReportIssue = (orderId: number) => {
    const issueType = prompt('Chọn loại vấn đề:\n1. RETURNED - Khách hàng trả lại\n2. FAILED_DELIVERY - Giao hàng thất bại\n\nNhập 1 hoặc 2:');
    if (!issueType) return;

    const type = issueType === '1' ? 'RETURNED' : issueType === '2' ? 'FAILED_DELIVERY' : null;
    if (!type) {
      alert('Lựa chọn không hợp lệ');
      return;
    }

    const reason = prompt('Nhập lý do chi tiết:');
    if (!reason) return;

    setLoading(true);
    api.post(`/shipper/${orderId}/report_issue/`, {
      issue_type: type,
      reason: reason
    })
      .then(() => {
        alert('Đã báo cáo vấn đề thành công');
        fetchShipperData();
      })
      .catch((error) => {
        console.error('Failed to report issue:', error);
        alert('Không thể báo cáo vấn đề. Vui lòng thử lại.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Emoji icons dùng cho summary cards
  const Icons: Record<string, React.ReactNode> = {
    Deliveries: '',
    Earnings: '',
    Current: '',
  };

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-grabGreen-700 mb-6">
        Chào mừng, Shipper! 
      </h1>

      {loading ? (
        <div className="text-center p-10 text-gray-500">
          Đang tải dữ liệu và kiểm tra đơn hàng...
        </div>
      ) : (
        <>
          {/* Thông tin tổng quan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Tổng chuyến giao"
              value={summary?.total_deliveries || 0}
              color="text-grabGreen-700"
              icon={Icons.Deliveries}
            />
            <StatCard
              title="Tổng thu nhập"
              value={formatCurrency(summary?.total_earnings || 0)}
              color="text-yellow-600"
              icon={Icons.Earnings}
            />
            <StatCard
              title="Đơn đang chạy"
              value={summary?.current_orders || 0}
              color="text-red-500"
              icon={Icons.Current}
            />
          </div>

          {/* Đơn đang giao */}
          <section className="mb-8">
            <h2 className="text-2xl font-extrabold text-blue-700 mb-4 border-b pb-2">
              {inProgressOrder
                ? ' Đơn hàng đang thực hiện'
                : 'Tìm kiếm đơn hàng mới...'}
            </h2>

            {inProgressOrder ? (
              <OrderCard
                order={inProgressOrder}
                onAction={handleOrderAction}
                onReportIssue={handleReportIssue}
              />
            ) : (
              <div className="p-8 text-center bg-white rounded-xl shadow-lg text-gray-500 border border-dashed border-gray-300">
                Hiện tại không có đơn hàng nào bạn đang giao.
              </div>
            )}
          </section>

          {/* Danh sách đơn sẵn sàng nhận */}
          {!inProgressOrder && (
            <section>
              <h2 className="text-2xl font-extrabold text-grabGreen-700 mb-4 border-b pb-2">
                 Đơn hàng sẵn sàng ({availableOrders.length})
              </h2>

              <div className="space-y-6">
                {availableOrders.length > 0 ? (
                  availableOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAction={handleOrderAction}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center bg-white rounded-xl shadow-lg text-gray-500 border border-dashed border-gray-300">
                    Không có đơn hàng nào sẵn sàng ở khu vực của bạn.
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
