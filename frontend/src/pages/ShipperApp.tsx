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

// ===================================
// MOCK DATA
// ===================================

const mockSummary: ShipperSummary = {
  total_deliveries: 450,
  total_earnings: 15300000,
  current_orders: 1,
};

const mockAvailableOrders: Order[] = [
  {
    id: 2005,
    store_name: 'Phở 24',
    store_address: '108 Nguyễn Du, Q.1',
    customer_address: '25/5 Lê Lợi, Q.1',
    delivery_fee: 35000,
    distance_km: 1.5,
    status: 'Ready',
  },
  {
    id: 2006,
    store_name: 'Trà Sữa ToCoToCo',
    store_address: '50A Cao Thắng, Q.3',
    customer_address: '30/1 Trần Quốc Toản, Q.3',
    delivery_fee: 40000,
    distance_km: 2.1,
    status: 'Ready',
  },
  {
    id: 2007,
    store_name: 'Bánh Mì Huỳnh Hoa',
    store_address: '26 Lê Thị Riêng, Q.1',
    customer_address: '5/7 Bùi Viện, Q.1',
    delivery_fee: 28000,
    distance_km: 0.8,
    status: 'Ready',
  },
];

const mockInProgressOrder: Order | null = {
  id: 2001,
  store_name: 'Cơm Tấm Sài Gòn',
  store_address: '123 Đường A, Q.Bình Thạnh',
  customer_address: '55/1 Hẻm C, Q.Gò Vấp',
  delivery_fee: 55000,
  distance_km: 5.2,
  status: 'In Progress',
};

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
}> = ({ order, onAction }) => {
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

  // Lấy data trang Shipper (mock)
  const fetchShipperData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      // TODO: gọi API thật sau, ví dụ:
      // const summaryRes = await api.get('/shipper/summary', { headers: { Authorization: `Bearer ${token}` } })
      // const availableRes = await api.get('/shipper/orders/available', ...)
      // const currentRes = await api.get('/shipper/orders/current', ...)

      // Mock fallback
      setTimeout(() => {
        setSummary(mockSummary);
        setAvailableOrders(mockAvailableOrders);
        setInProgressOrder(mockInProgressOrder);
        setLoading(false);
      }, 800);
    } catch (e) {
      console.error('Failed to fetch shipper data:', e);
      // fallback mock
      setSummary(mockSummary);
      setAvailableOrders(mockAvailableOrders);
      setInProgressOrder(mockInProgressOrder);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipperData();
  }, []);

  // Nhận đơn hoặc hoàn tất giao
  const handleOrderAction = (
    orderId: number,
    action: 'accept' | 'complete'
  ) => {
    setLoading(true);

    // TODO: gọi API:
    //  - accept:   POST /api/shipper/orders/{orderId}/accept
    //  - complete: POST /api/shipper/orders/{orderId}/update_status {status: "DELIVERED"}
    //
    // hiện tại dùng mock:
    setTimeout(() => {
      if (action === 'accept') {
        const acceptedOrder = availableOrders.find((o) => o.id === orderId);
        if (acceptedOrder) {
          // Chuyển đơn đó thành in-progress
          setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
          setInProgressOrder({ ...acceptedOrder, status: 'In Progress' });
          setSummary((prev) =>
            prev
              ? {
                  ...prev,
                  current_orders: 1,
                }
              : prev
          );
          console.log(`Đã nhận đơn hàng #${orderId}.`);
        }
      } else if (action === 'complete') {
        // Giao xong
        setInProgressOrder(null);
        setSummary((prev) =>
          prev
            ? {
                ...prev,
                current_orders: 0,
                total_deliveries: prev.total_deliveries + 1,
                total_earnings:
                  prev.total_earnings +
                  (inProgressOrder?.delivery_fee || 0),
              }
            : prev
        );

        console.log(`Đã hoàn tất đơn hàng #${orderId}.`);

        // Sau khi hoàn thành thì làm mới
        fetchShipperData();
      }

      setLoading(false);
    }, 500);
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
