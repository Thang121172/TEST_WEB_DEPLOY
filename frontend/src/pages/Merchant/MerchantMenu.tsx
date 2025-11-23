import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import api from '../../services/http';

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function MerchantMenu() {
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_available: true,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!authLoading && isAuthenticated && user?.role !== 'merchant' && user?.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchMenuItems = async () => {
      setLoading(true);
      try {
        const response = await api.get('/menus/');
        // Filter items for current merchant (if API doesn't filter by default)
        setMenuItems(response.data || []);
      } catch (error) {
        console.error('Failed to fetch menu items:', error);
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && (user?.role === 'merchant' || user?.role === 'admin')) {
      fetchMenuItems();
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/menus/', {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        image_url: formData.image_url || null,
        is_available: formData.is_available,
      });
      setMenuItems([...menuItems, response.data]);
      setFormData({ name: '', description: '', price: '', image_url: '', is_available: true });
      setShowAddForm(false);
      alert('Thêm món thành công!');
    } catch (error) {
      console.error('Failed to add menu item:', error);
      alert('Không thể thêm món. Vui lòng thử lại.');
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const response = await api.put(`/menus/${editingItem.id}/`, {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        image_url: formData.image_url || null,
        is_available: formData.is_available,
      });
      setMenuItems(menuItems.map(item => item.id === editingItem.id ? response.data : item));
      setEditingItem(null);
      setFormData({ name: '', description: '', price: '', image_url: '', is_available: true });
      alert('Cập nhật món thành công!');
    } catch (error) {
      console.error('Failed to update menu item:', error);
      alert('Không thể cập nhật món. Vui lòng thử lại.');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa món này?')) return;

    try {
      await api.delete(`/menus/${id}/`);
      setMenuItems(menuItems.filter(item => item.id !== id));
      alert('Xóa món thành công!');
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      alert('Không thể xóa món. Vui lòng thử lại.');
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const response = await api.put(`/menus/${item.id}/`, {
        ...item,
        is_available: !item.is_available,
      });
      setMenuItems(menuItems.map(i => i.id === item.id ? response.data : i));
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      alert('Không thể thay đổi trạng thái. Vui lòng thử lại.');
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      image_url: item.image_url || '',
      is_available: item.is_available,
    });
    setShowAddForm(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Đang tải menu...</div>
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Món ăn</h1>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingItem(null);
              setFormData({ name: '', description: '', price: '', image_url: '', is_available: true });
            }}
            className="px-6 py-3 bg-grabGreen-700 text-white rounded-lg font-semibold hover:bg-grabGreen-800 transition"
          >
            {showAddForm ? 'Hủy' : '+ Thêm món mới'}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingItem) && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {editingItem ? 'Chỉnh sửa món' : 'Thêm món mới'}
          </h2>
          <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên món *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-grabGreen-500 focus:border-grabGreen-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-grabGreen-500 focus:border-grabGreen-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-grabGreen-500 focus:border-grabGreen-500"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL hình ảnh</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-grabGreen-500 focus:border-grabGreen-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                className="w-4 h-4 text-grabGreen-600 border-gray-300 rounded focus:ring-grabGreen-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">Có sẵn</label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-3 bg-grabGreen-700 text-white rounded-lg font-semibold hover:bg-grabGreen-800 transition"
              >
                {editingItem ? 'Cập nhật' : 'Thêm món'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                  setFormData({ name: '', description: '', price: '', image_url: '', is_available: true });
                }}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Items List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-xl shadow-lg overflow-hidden border ${
              item.is_available ? 'border-gray-100' : 'border-gray-300 opacity-60'
            }`}
          >
            <img
              src={item.image_url || 'https://via.placeholder.com/200?text=Food'}
              alt={item.name}
              className="w-full h-40 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://via.placeholder.com/200?text=Food';
              }}
            />
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-1">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-gray-600 h-10 overflow-hidden mb-2">
                  {item.description}
                </p>
              )}
              <p className="text-xl font-extrabold text-red-500 mb-4">
                {formatCurrency(item.price)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(item)}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleToggleAvailability(item)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    item.is_available
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {item.is_available ? 'Ẩn' : 'Hiện'}
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center p-10 bg-white rounded-xl shadow-lg text-gray-500">
          Chưa có món nào. Hãy thêm món đầu tiên!
        </div>
      )}
    </div>
  );
}

