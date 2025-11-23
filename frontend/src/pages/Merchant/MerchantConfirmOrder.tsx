import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import api from "../../services/http"; // chuẩn bị sẵn cho khi nối backend

// ===============================
// ICON COMPONENTS (thay cho lucide-react)
// ===============================
const BagIcon = ({ className = "w-6 h-6 text-grabGreen-700 mr-2" }) => (
  <span className={className} role="img" aria-label="bag">
    🛍️
  </span>
);

const XIcon = ({ className = "w-5 h-5 mr-2" }) => (
  <span className={className} role="img" aria-label="x">
    ✖
  </span>
);

const CheckIcon = ({ className = "w-5 h-5 mr-2" }) => (
  <span className={className} role="img" aria-label="check">
    ✅
  </span>
);

const ClockIcon = ({ className = "w-5 h-5 mr-2" }) => (
  <span className={className} role="img" aria-label="clock">
    ⏰
  </span>
);

// ===============================
// INTERFACES (Mock)
// ===============================
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
  order_time: string;
  delivery_time_estimate: string;
  payment_method: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: "Pending" | "Confirmed" | "Ready" | "Cancelled";
}

// ===============================
// MOCK DATA & UTILS
// ===============================
const mockOrderDetails: OrderDetails = {
  order_id: 9001,
  customer_name: "Trần Văn B",
  customer_address:
    "Tòa nhà A, 123 Đường Điện Biên Phủ, Phường Đa Kao, Quận 1, TP.HCM",
  customer_phone: "090xxxx999",
  order_time: "2025-10-25T13:55:00Z",
  delivery_time_estimate: "40 phút",
  payment_method: "VISA •••• 4242",
  items: [
    {
      id: 1,
      product_name: "Cơm Tấm Sườn Bì Chả Đặc Biệt",
      quantity: 1,
      price: 65000,
    },
    {
      id: 2,
      product_name: "Trà Sữa Khoai Môn",
      quantity: 2,
      price: 40000,
      notes: "Ít đường, thêm trân châu trắng",
    },
    { id: 3, product_name: "Khăn lạnh", quantity: 1, price: 2000 },
  ],
  subtotal: 147000,
  delivery_fee: 35000,
  total: 182000,
  status: "Pending",
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const timeSince = (dateString: string) => {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(dateString).getTime()) / 1000
  );

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ trước";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút trước";

  return Math.floor(seconds) + " giây trước";
};

// ===============================
// ORDER SUMMARY CARD
// ===============================
const OrderSummaryCard: React.FC<{ details: OrderDetails }> = ({ details }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-grabGreen-700 sticky top-4">
    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
      <BagIcon />
      <span>Chi tiết Đơn hàng #{details.order_id}</span>
    </h2>

    <div className="space-y-4">
      {details.items.map((item) => (
        <div key={item.id} className="border-b pb-3 pt-1">
          <div className="flex justify-between items-center text-gray-800">
            <span className="font-medium">
              {item.quantity}x {item.product_name}
            </span>
            <span className="font-semibold">
              {formatCurrency(item.quantity * item.price)}
            </span>
          </div>
          {item.notes && (
            <p className="text-sm text-red-500 italic mt-1 pl-2">
              Lưu ý: {item.notes}
            </p>
          )}
        </div>
      ))}
    </div>

    <div className="mt-4 space-y-2 text-gray-700">
      <div className="flex justify-between text-sm">
        <span>Tạm tính:</span>
        <span>{formatCurrency(details.subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Phí giao hàng:</span>
        <span className="text-red-500">
          {formatCurrency(details.delivery_fee)}
        </span>
      </div>
    </div>

    <div className="flex justify-between items-center mt-4 pt-3 border-t border-dashed">
      <span className="text-xl font-bold text-gray-900">Tổng cộng:</span>
      <span className="text-2xl font-extrabold text-red-600">
        {formatCurrency(details.total)}
      </span>
    </div>
  </div>
);

// ===============================
// MAIN COMPONENT
// ===============================
export default function MerchantConfirmOrder() {
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // bảo vệ role merchant
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    } else if (
      !authLoading &&
      isAuthenticated &&
      user?.role !== "merchant" &&
      user?.role !== "admin"
    ) {
      navigate("/merchant/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // fetch chi tiết đơn
  const fetchOrderData = async () => {
    setLoading(true);
    try {
      // TODO call API thật, ví dụ:
      // const token = localStorage.getItem('authToken');
      // const res = await api.get(`/orders/${orderId}/`, {
      //   headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      // });
      // setOrderDetails(res.data);

      // Tạm mock:
      setTimeout(() => {
        setOrderDetails({
          ...mockOrderDetails,
          order_id: Number(orderId || mockOrderDetails.order_id),
        });
        setLoading(false);
      }, 500);
    } catch (e) {
      console.error("Failed to fetch order details:", e);
      setOrderDetails({
        ...mockOrderDetails,
        order_id: Number(orderId || mockOrderDetails.order_id),
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      isAuthenticated &&
      (user?.role === "merchant" || user?.role === "admin") &&
      orderId
    ) {
      fetchOrderData();
    }
  }, [isAuthenticated, user, orderId]);

  // action confirm / cancel
  const handleAction = async (action: "confirm" | "cancel") => {
    if (!orderDetails) return;
    setIsProcessing(true);

    try {
      // TODO gọi API backend:
      // - confirm: POST /api/orders/{id}/set_status/  body {status:"confirmed"}
      // - cancel:  POST /api/orders/{id}/set_status/  body {status:"cancelled"}
      //
      // const token = localStorage.getItem("authToken");
      // await api.post(
      //   `/orders/${orderDetails.order_id}/set_status/`,
      //   { status: action === "confirm" ? "confirmed" : "cancelled" },
      //   { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      // );

      const newStatus = action === "confirm" ? "Confirmed" : "Cancelled";

      // update UI mock
      setOrderDetails((prev) =>
        prev ? { ...prev, status: newStatus } : prev
      );

      alert(
        `Đơn hàng #${orderDetails.order_id} đã được ${
          action === "confirm" ? "XÁC NHẬN" : "HỦY"
        } thành công!`
      );

      navigate("/merchant/dashboard");
    } catch (err) {
      console.error(`Failed to ${action} order:`, err);
      alert(
        `Lỗi: Không thể thực hiện hành động ${action.toUpperCase()}.`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-600">
          Đang tải chi tiết đơn hàng #{orderId}...
        </div>
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

  const isPending = orderDetails.status === "Pending";
  const timeSinceOrder = timeSince(orderDetails.order_time);

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      {/* Header + status badge */}
      <div className="flex justify-between items-center mb-6 border-b pb-3 flex-col md:flex-row gap-4 md:gap-0">
        <div>
          <div className="text-sm text-gray-500 mb-1">
            <Link
              to="/merchant/dashboard"
              className="hover:text-grabGreen-700 transition"
            >
              &larr; Quay lại Dashboard
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-800">
            {isPending ? "Đơn hàng MỚI" : "Chi tiết Đơn hàng"}
          </h1>
        </div>

        <div
          className={`text-lg font-bold px-4 py-2 rounded-full text-center min-w-[160px] ${
            isPending
              ? "bg-red-500 text-white animate-pulse"
              : orderDetails.status === "Confirmed"
              ? "bg-yellow-500 text-white"
              : orderDetails.status === "Ready"
              ? "bg-grabGreen-700 text-white"
              : "bg-gray-400 text-white"
          }`}
        >
          {isPending
            ? "CHỜ XÁC NHẬN"
            : orderDetails.status.toUpperCase()}
        </div>
      </div>

      {/* Layout 2 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Thông tin KH + Hành động */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cảnh báo thời gian */}
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-xl shadow-md flex items-start font-medium border border-yellow-300 text-sm">
            <ClockIcon />
            <div>
              Đơn hàng đặt {timeSinceOrder} trước. Vui lòng xác nhận sớm để
              chuẩn bị món và phân công shipper.
            </div>
          </div>

          {/* Thông tin khách hàng */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
              Thông tin Khách hàng
            </h2>

            <div className="text-gray-700 space-y-2 text-sm">
              <p>
                <span className="font-semibold">Tên Khách hàng:</span>{" "}
                {orderDetails.customer_name}
              </p>
              <p>
                <span className="font-semibold">Địa chỉ Giao hàng:</span>{" "}
                {orderDetails.customer_address}
              </p>
              <p>
                <span className="font-semibold">SĐT:</span>{" "}
                {orderDetails.customer_phone}
              </p>
              <p>
                <span className="font-semibold">Thanh toán bằng:</span>{" "}
                <span className="text-grabGreen-700">
                  {orderDetails.payment_method}
                </span>
              </p>
              <p>
                <span className="font-semibold">
                  Ước tính Giao hàng:
                </span>{" "}
                {orderDetails.delivery_time_estimate}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {isPending ? (
            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button
                onClick={() => handleAction("confirm")}
                className={`flex-1 py-3 text-lg text-white rounded-xl font-bold transition duration-150 shadow-lg flex items-center justify-center ${
                  isProcessing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-grabGreen-700 hover:bg-grabGreen-800"
                }`}
                disabled={isProcessing}
              >
                <CheckIcon />
                {isProcessing
                  ? "Đang xác nhận..."
                  : "Xác nhận Đơn hàng"}
              </button>

              <button
                onClick={() => handleAction("cancel")}
                className={`flex-1 py-3 text-lg rounded-xl font-bold transition duration-150 shadow-md flex items-center justify-center border ${
                  isProcessing
                    ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                    : "bg-red-100 text-gray-700 border-red-300 hover:bg-red-200"
                }`}
                disabled={isProcessing}
              >
                <XIcon />
                Từ chối Đơn hàng
              </button>
            </div>
          ) : orderDetails.status === "Confirmed" || orderDetails.status === "Ready" ? (
            <div className="flex gap-3">
              <Link
                to={`/merchant/orders/${orderDetails.order_id}/handle-out-of-stock`}
                className="flex-1 py-3 text-lg rounded-xl font-bold transition duration-150 shadow-md flex items-center justify-center border bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200"
              >
                ⚠️ Xử lý thiếu kho
              </Link>
              {orderDetails.payment_method && orderDetails.payment_method !== "Cash" && (
                <Link
                  to={`/merchant/orders/${orderDetails.order_id}/refund`}
                  className="flex-1 py-3 text-lg rounded-xl font-bold transition duration-150 shadow-md flex items-center justify-center border bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200"
                >
                  💰 Hoàn tiền
                </Link>
              )}
            </div>
          ) : (
            <div className="p-4 bg-grabGreen-50 text-grabGreen-800 rounded-xl font-medium border border-grabGreen-300 text-center text-sm">
              Đơn hàng này đã được xử lý.{" "}
              <Link
                to="/merchant/dashboard"
                className="font-bold hover:underline"
              >
                Quay lại Dashboard
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT: Tóm tắt đơn */}
        <div className="lg:col-span-1">
          <OrderSummaryCard details={orderDetails} />
        </div>
      </div>
    </div>
  );
}
