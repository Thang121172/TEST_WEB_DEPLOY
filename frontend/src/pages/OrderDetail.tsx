import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/http';
import { useAuthContext } from '../context/AuthContext';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface OrderDetails {
  order_id: number;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  merchant_name?: string;
  merchant_address?: string;
  order_time: string;
  delivery_time_estimate?: string;
  payment_method: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/orders/${orderId}/`);
        setOrderDetails(response.data);
      } catch (error) {
        console.error('Failed to fetch order details:', error);
        alert('Không thể tải chi tiết đơn hàng. Vui lòng thử lại.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, isAuthenticated, navigate]);

  const handleCancelOrder = async () => {
    if (!orderId) return;
    
    setCanceling(true);
    try {
      await api.post(`/orders/${orderId}/cancel/`, {
        reason: 'Khách hàng hủy đơn'
      });
      alert('Đơn hàng đã được hủy thành công');
      setShowCancelConfirm(false);
      // Reload order details
      const response = await api.get(`/orders/${orderId}/`);
      setOrderDetails(response.data);
    } catch (error: any) {
      console.error('Failed to cancel order:', error);
      alert(error.response?.data?.detail || 'Không thể hủy đơn hàng. Vui lòng thử lại.');
    } finally {
      setCanceling(false);
    }
  };

  const canCancelOrder = () => {
    if (!orderDetails) return false;
    const status = orderDetails.status.toLowerCase();
    return status === 'pending' || status === 'confirmed';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Đang tải chi tiết đơn hàng...</div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-lg font-medium text-gray-700">
          Không tìm thấy đơn hàng #{orderId}.
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('pending')) return 'bg-yellow-100 text-yellow-800';
    if (statusLower.includes('confirmed')) return 'bg-blue-100 text-blue-800';
    if (statusLower.includes('ready')) return 'bg-green-100 text-green-800';
    if (statusLower.includes('delivering')) return 'bg-purple-100 text-purple-800';
    if (statusLower.includes('delivered')) return 'bg-grabGreen-100 text-grabGreen-800';
    if (statusLower.includes('cancelled')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Link
          to={user?.role === 'customer' ? '/customer' : user?.role === 'shipper' ? '/shipper' : '/'}
          className="text-grabGreen-700 hover:text-grabGreen-800 font-medium"
        >
          &larr; Quay lại
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mt-2">
          Chi tiết Đơn hàng #{orderDetails.order_id}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Status Badge */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Trạng thái đơn hàng</h2>
              <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(orderDetails.status)}`}>
                {orderDetails.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Đặt hàng lúc: {formatDate(orderDetails.order_time)}
            </p>
            {orderDetails.delivery_time_estimate && (
              <p className="text-sm text-gray-600">
                Ước tính giao hàng: {orderDetails.delivery_time_estimate}
              </p>
            )}
          </div>

          {/* Merchant Info (if available) */}
          {orderDetails.merchant_name && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Thông tin cửa hàng</h2>
              <div className="space-y-2 text-gray-700">
                <p><span className="font-semibold">Tên cửa hàng:</span> {orderDetails.merchant_name}</p>
                {orderDetails.merchant_address && (
                  <p><span className="font-semibold">Địa chỉ:</span> {orderDetails.merchant_address}</p>
                )}
              </div>
            </div>
          )}

          {/* Delivery Address */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Địa chỉ giao hàng</h2>
            <div className="space-y-2 text-gray-700">
              <p><span className="font-semibold">Người nhận:</span> {orderDetails.customer_name}</p>
              <p><span className="font-semibold">Địa chỉ:</span> {orderDetails.customer_address}</p>
              <p><span className="font-semibold">SĐT:</span> {orderDetails.customer_phone}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Danh sách món ăn</h2>
            <div className="space-y-4">
              {orderDetails.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start border-b pb-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {item.quantity}x {item.product_name}
                    </p>
                    {item.notes && (
                      <p className="text-sm text-gray-500 italic mt-1">Lưu ý: {item.notes}</p>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(item.quantity * item.price)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-grabGreen-700 sticky top-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Tóm tắt đơn hàng</h2>
            <div className="space-y-3 text-gray-700">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span className="font-medium">{formatCurrency(orderDetails.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí giao hàng:</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(orderDetails.delivery_fee)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="text-xl font-bold text-gray-900">Tổng cộng:</span>
                <span className="text-2xl font-extrabold text-red-600">
                  {formatCurrency(orderDetails.total)}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Thanh toán bằng:</span> {orderDetails.payment_method}
              </p>
            </div>
            
            {/* Cancel Order Button (Customer only) */}
            {user?.role === 'customer' && canCancelOrder() && (
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Hủy đơn hàng
                </button>
              </div>
            )}

            {/* Review & Complaint Buttons (Customer only, for delivered orders) */}
            {user?.role === 'customer' && orderDetails.status.toLowerCase() === 'delivered' && (
              <div className="mt-4 space-y-2">
                <Link
                  to={`/orders/${orderId}/review`}
                  className="block w-full bg-grabGreen-600 hover:bg-grabGreen-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center"
                >
                  Đánh giá đơn hàng
                </Link>
                <Link
                  to={`/orders/${orderId}/complaint`}
                  className="block w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center"
                >
                  Gửi khiếu nại
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Xác nhận hủy đơn hàng</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn hủy đơn hàng #{orderId}? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                disabled={canceling}
              >
                Hủy
              </button>
              <button
                onClick={handleCancelOrder}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                disabled={canceling}
              >
                {canceling ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

