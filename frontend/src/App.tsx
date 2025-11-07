import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import './index.css'

import Home from './pages/Home'
import CustomerApp from './pages/CustomerApp'
import Merchant from './pages/Merchant'
import ShipperApp from './pages/ShipperApp'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import PaymentMethods from './pages/PaymentMethods'
import PaymentCard from './pages/PaymentCard'
import VerifyOTP from './pages/VerifyOTP'

import MerchantDashboard from './pages/Merchant/MerchantDashboard'
import MerchantConfirmOrder from './pages/Merchant/MerchantConfirmOrder'
import RegisterStore from './pages/Merchant/RegisterStore'

import ProtectedRoute from './components/ProtectedRoute'
import RoleGate from './components/RoleGate'

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="container py-6">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/customer" element={<CustomerApp />} />

          {/* đăng ký cửa hàng */}
          <Route path="/merchant/register" element={<RegisterStore />} />

          {/* trang merchant chính (nếu bạn vẫn muốn giữ /merchant riêng) */}
          <Route path="/merchant" element={<Merchant />} />

          {/* dashboard merchant có bảo vệ */}
          <Route
            path="/merchant/dashboard"
            element={
              <ProtectedRoute>
                <RoleGate allow={['merchant', 'admin']}>
                  <MerchantDashboard />
                </RoleGate>
              </ProtectedRoute>
            }
          />

          {/* confirm order */}
          <Route
            path="/merchant/orders/:orderId/confirm"
            element={<MerchantConfirmOrder />}
          />

          <Route path="/shipper" element={<ShipperApp />} />

          <Route path="/cart" element={<Cart />} />

          {/* auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

          {/* thanh toán */}
          <Route path="/payment" element={<PaymentMethods />} />
          <Route path="/payment/card" element={<PaymentCard />} />
        </Routes>
      </main>
    </div>
  )
}
