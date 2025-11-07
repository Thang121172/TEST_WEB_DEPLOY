import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/http';
import { useAuthContext } from '../context/AuthContext';

// ===================================
// Kiểu dữ liệu
// ===================================
interface CartItem {
  id: number;
  product_name: string;
  store_name: string;
  price: number;
  quantity: number;
  image_url: string;
}

interface CartSummary {
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
}

// ===================================
// Mock data tạm thời
// ===================================
const mockCart: CartItem[] = [
  {
    id: 1,
    product_name: 'Cơm Tấm Sườn Bì Chả',
    store_name: 'Cơm Tấm Kiều Kiều',
    price: 55000,
    quantity: 1,
    image_url: 'https://placehold.co/100x100/A3E635/FFFFFF?text=CT',
  },
  {
    id: 2,
    product_name: 'Trà Sữa Trân Châu Đường Đen',
    store_name: 'Trà Sữa Bobapop',
    price: 45000,
    quantity: 2,
    image_url: 'https://placehold.co/100x100/34D399/FFFFFF?text=TS',
  },
];

const mockDeliveryFee = 35000;
const mockDiscount = 10000;

// ===================================
// Utils
// ===================================
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// ===================================
// Cart item card
// ===================================
const CartItemCard: React.FC<{
  item: CartItem;
  onUpdateQuantity: (id: number, newQuantity: number) => void;
  onRemove: (id: number) => void;
}> = ({ item, onUpdateQuantity, onRemove }) => {
  const handleQuantityChange = (delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity >= 1) {
      onUpdateQuantity(item.id, newQuantity);
    } else {
      if (
        window.confirm(
          `Bạn có chắc chắn muốn xóa "${item.product_name}" khỏi giỏ hàng?`
        )
      ) {
        onRemove(item.id);
      }
    }
  };

  return (
    <div className="flex items-start p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Hình ảnh món */}
      <img
        src={item.image_url}
        alt={item.product_name}
        className="w-16 h-16 object-cover rounded-lg mr-4 border border-gray-200"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src =
            'https://placehold.co/100x100/E5E7EB/6B7280?text=Food';
        }}
      />

      {/* Nội dung */}
      <div className="flex-grow">
        <p className="font-semibold text-gray-900">{item.product_name}</p>
        <p className="text-sm text-gray-500 mb-2">Từ: {item.store_name}</p>
        <p className="font-bold text-lg text-grabGreen-700">
          {formatCurrency(item.price * item.quantity)}
        </p>
      </div>

      {/* Điều khiển số lượng & xoá */}
      <div className="flex flex-col items-end space-y-2">
        <div className="flex items-center space-x-2 border border-gray-300 rounded-full p-0.5">
          <button
            onClick={() => handleQuantityChange(-1)}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-white hover:bg-grabGreen-600 rounded-full transition duration-150"
            title="Giảm số lượng"
          >
            −
          </button>
          <span className="text-base font-medium text-gray-800 w-4 text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(1)}
            className="w-8 h-8 flex items-center justify-center text-white bg-grabGreen-700 hover:bg-grabGreen-800 rounded-full transition duration-150"
            title="Tăng số lượng"
          >
            +
          </button>
        </div>

        <button
          onClick={() => onRemove(item.id)}
          className="text-xs text-red-500 hover:text-red-700 transition duration-150 font-medium"
        >
          Xóa
        </button>
      </div>
    </div>
  );
};

// ===================================
// Tóm tắt đơn hàng
// ===================================
const CartSummaryCard: React.FC<{
  summary: CartSummary;
  onCheckout: () => void;
}> = ({ summary, onCheckout }) => {
  return (
    <div className="bg-white rounded-xl shadow-2xl p-6 border-t-4 border-grabGreen-700 sticky top-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
        Tóm tắt Đơn hàng
      </h2>

      <div className="space-y-3 text-gray-700">
        <div className="flex justify-between">
          <span>Tổng tiền hàng (tạm tính):</span>
          <span className="font-medium">
            {formatCurrency(summary.subtotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Phí giao hàng:</span>
          <span className="font-medium text-red-600">
            {formatCurrency(summary.delivery_fee)}
          </span>
        </div>
        <div className="flex justify-between border-b pb-3">
          <span>Giảm giá/Khuyến mãi:</span>
          <span className="font-medium text-grabGreen-700">
            - {formatCurrency(summary.discount)}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <span className="text-xl font-bold text-gray-900">
          Thành tiền:
        </span>
        <span className="text-2xl font-extrabold text-red-600">
          {formatCurrency(summary.total)}
        </span>
      </div>

      <button
        onClick={onCheckout}
        className="mt-6 w-full py-3 text-lg text-white bg-grabGreen-700 rounded-full font-semibold hover:bg-grabGreen-800 transition duration-150 shadow-lg transform hover:scale-[1.01]"
        disabled={summary.total <= 0}
      >
        Tiến hành Đặt hàng
      </button>

      <p className="mt-3 text-xs text-center text-gray-500">
        Bằng việc nhấn Đặt hàng, bạn đồng ý với Điều khoản & Điều kiện.
      </p>
    </div>
  );
};

// ===================================
// Component chính
// ===================================
export default function CartPage() {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Giả lập fetch giỏ hàng của user
  const fetchCartData = async () => {
    setLoading(true);
    try {
      // TODO: ví dụ sau này gọi thật:
      // const res = await api.get('/cart/');
      // setCartItems(res.data.items);

      setTimeout(() => {
        setCartItems(mockCart);
        setLoading(false);
      }, 500);
    } catch (e) {
      console.error('Failed to fetch cart data:', e);
      setCartItems(mockCart); // fallback
      setLoading(false);
    }
  };

  useEffect(() => {
    // Nếu muốn khóa với user chưa login:
    // if (!isAuthenticated) { navigate('/login'); return; }
    fetchCartData();
  }, []);

  // Tính toán tổng tiền
  const cartSummary: CartSummary = useMemo(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const deliveryFee = subtotal > 0 ? mockDeliveryFee : 0;
    const discount = subtotal > 200000 ? mockDiscount : 0;
    const total = subtotal + deliveryFee - discount;

    return {
      subtotal,
      delivery_fee: deliveryFee,
      discount,
      total: Math.max(0, total),
    };
  }, [cartItems]);

  // Handlers
  const handleUpdateQuantity = (id: number, newQuantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Giỏ hàng trống! Vui lòng thêm sản phẩm.');
      return;
    }

    // Truyền tóm tắt đơn hàng sang trang thanh toán
    navigate('/payment', { state: { summary: cartSummary } });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">
          Đang tải giỏ hàng...
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Giỏ hàng của bạn đang trống
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Hãy tìm kiếm món ăn yêu thích và thêm vào giỏ!
        </p>
        <Link
          to="/"
          className="px-8 py-3 text-lg text-white bg-grabGreen-700 rounded-full font-semibold hover:bg-grabGreen-800 transition duration-150 shadow-lg"
        >
          Trở về Trang chủ
        </Link>
      </div>
    );
  }

  // Normal state
  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">
        Giỏ hàng của tôi
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List item giỏ hàng */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
            />
          ))}

          <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border border-grabGreen-100 flex justify-between items-center">
            <span className="font-medium text-gray-700">
              Bạn có mã giảm giá?
            </span>
            <button className="text-grabGreen-600 font-semibold hover:text-grabGreen-800">
              Áp dụng ngay
            </button>
          </div>
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className="lg:col-span-1">
          <CartSummaryCard
            summary={cartSummary}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
}
