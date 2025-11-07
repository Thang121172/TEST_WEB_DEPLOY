import React, { useState, useEffect } from 'react';
import api from '../services/http';
import { useAuthContext } from '../context/AuthContext'; 

// ===================================
// INTERFACES (Mock)
// ===================================

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    merchant_name: string;
}

// ===================================
// MOCK DATA
// ===================================
const mockProducts: Product[] = [
    { id: 1, name: 'Burger Phô Mai', description: 'Thịt bò Úc, phô mai tan chảy, sốt đặc biệt.', price: 85000, image_url: 'https://picsum.photos/id/1/200/200', merchant_name: 'Burger King' },
    { id: 2, name: 'Gà Rán Giòn', description: 'Gà tươi rán giòn, tẩm ướp kiểu Mỹ.', price: 70000, image_url: 'https://picsum.photos/id/2/200/200', merchant_name: 'KFC' },
    { id: 3, name: 'Pizza Hải Sản', description: 'Hải sản tươi ngon, phô mai Mozzarella.', price: 150000, image_url: 'https://picsum.photos/id/3/200/200', merchant_name: 'Pizza Hut' },
    { id: 4, name: 'Mì Ý Sốt Cà Chua', description: 'Sợi mì Ý dai ngon với sốt cà chua truyền thống.', price: 65000, image_url: 'https://picsum.photos/id/4/200/200', merchant_name: 'Italian Corner' },
];

// ===================================
// UTILITY FUNCTIONS
// ===================================
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};


// ===================================
// PRODUCT CARD COMPONENT
// ===================================
const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transition duration-300 hover:shadow-xl border border-gray-100">
            <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover" />
            <div className="p-4">
                <div className="text-xs font-semibold text-gray-500 mb-1 truncate">{product.merchant_name}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-1 truncate">{product.name}</h3>
                <p className="text-sm text-gray-600 h-10 overflow-hidden mb-3">{product.description}</p>
                <div className="flex justify-between items-center mt-3">
                    <span className="text-xl font-extrabold text-red-500">{formatCurrency(product.price)}</span>
                    <button 
                        className="px-4 py-2 text-sm font-medium rounded-full bg-grabGreen-700 text-white hover:bg-grabGreen-800 transition shadow-md"
                        // TODO: Thêm chức năng thêm vào giỏ hàng
                        onClick={() => console.log(`Added ${product.name} to cart`)}
                    >
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===================================
// MAIN COMPONENT
// ===================================

export default function CustomerApp() {
    const { user } = useAuthContext();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // TODO: Gọi API để lấy danh sách sản phẩm
                // const r = await api.get('/products');
                // setProducts(r.data);
                
                // Dùng mock data thay thế cho đến khi có API
                setTimeout(() => {
                    setProducts(mockProducts);
                    setLoading(false);
                }, 800);

            } catch (e) {
                console.error("Failed to fetch products:", e);
                setProducts(mockProducts); // Fallback to mock
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Lọc sản phẩm theo từ khóa tìm kiếm
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.merchant_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Xin chào{user?.name ? `, ${user.name}` : ''}!</h1>
            <p className="text-lg text-gray-600 mb-8">Bạn muốn ăn gì hôm nay?</p>
            
            {/* Search Bar */}
            <div className="mb-8">
                <input
                    type="text"
                    placeholder="Tìm kiếm món ăn, nhà hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-xl shadow-inner focus:ring-grabGreen-500 focus:border-grabGreen-500 transition duration-150"
                />
            </div>

            {loading ? (
                <div className="text-center p-10">Đang tải menu...</div>
            ) : (
                <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-5 border-b pb-2 border-gray-200">
                        {searchTerm ? `Kết quả tìm kiếm (${filteredProducts.length})` : 'Món ăn Nổi bật'}
                    </h2>
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                         <div className="p-10 text-center bg-white rounded-xl shadow-lg text-gray-500">
                            Không tìm thấy món ăn nào phù hợp với từ khóa "{searchTerm}".
                        </div>
                    )}
                </>
            )}
        </div>
    );
}