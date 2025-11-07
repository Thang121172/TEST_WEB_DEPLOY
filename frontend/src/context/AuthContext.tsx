import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
// Import API service đã cấu hình
import api from '../services/http'; 


// Định nghĩa kiểu dữ liệu cho người dùng
interface User {
  id: string;
  email: string;
  role: 'customer' | 'merchant' | 'shipper' | 'admin';
  name?: string; // Tên là tùy chọn
}

// Định nghĩa kiểu dữ liệu cho Context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

// Tạo Context với giá trị mặc định
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===================================
// PROVIDER COMPONENT
// ===================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Hàm đăng nhập: lưu token và thông tin người dùng
  const login = (token: string, userData: User) => {
    localStorage.setItem('authToken', token);
    setUser(userData);
  };

  // Hàm đăng xuất: xóa token và thông tin người dùng
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  /**
   * Logic kiểm tra trạng thái đăng nhập khi tải ứng dụng (Không dùng Mock Data)
   * Sử dụng token đã lưu để gọi API /accounts/me/
   */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Gọi API để xác thực token và lấy thông tin người dùng
        try {
          // Lệnh gọi API này sẽ tự động đính kèm token nhờ Interceptor trong http.ts
          const meResp = await api.get('/accounts/me/');
          
          const meData = meResp.data || {};
          
          // Chuẩn hoá dữ liệu từ API thành định dạng User của Context
          const userData: User = {
            id: String(meData.id ?? ''),
            email: meData.email ?? '',
            // Đảm bảo role là một trong các giá trị định trước
            role: (meData.role ?? 'customer') as 
              | 'customer'
              | 'merchant'
              | 'shipper'
              | 'admin',
            name: meData.username ?? '', 
          };

          setUser(userData); 
          
        } catch (error) {
          // Nếu API lỗi (ví dụ 401 Unauthorized), Interceptor trong http.ts sẽ tự động xóa token.
          // Chúng ta chỉ cần đảm bảo user là null ở đây.
          console.error("Token verification failed or API call to get user failed:", error);
          // localStorage.removeItem('authToken'); // Đã xử lý trong http.ts
          setUser(null); 
        }
      }
      // Dù có token hay không, quá trình kiểm tra đã kết thúc
      setLoading(false);
    };

    checkAuth();
  }, []); // Chỉ chạy một lần khi component mount

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ===================================
// HOOK
// ===================================

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};