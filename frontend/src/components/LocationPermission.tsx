import React from 'react'
import { useLocation } from '../hooks/useLocation'
import { useLocationContext } from '../context/LocationContext'

interface LocationPermissionProps {
  onLocationGranted?: (location: { latitude: number; longitude: number }) => void
  showOnlyWhenDenied?: boolean
  className?: string
}

/**
 * Component để yêu cầu quyền truy cập vị trí từ người dùng
 */
export default function LocationPermission({
  onLocationGranted,
  showOnlyWhenDenied = false,
  className = ''
}: LocationPermissionProps) {
  const {
    location,
    loading,
    error,
    permissionStatus,
    requestPermission,
    getCurrentLocation
  } = useLocation()
  
  const { address, setAddress } = useLocationContext()
  const [isEditingAddress, setIsEditingAddress] = React.useState(false)
  const [editedAddress, setEditedAddress] = React.useState('')

  // Nếu đã có vị trí, gọi callback
  React.useEffect(() => {
    if (location && onLocationGranted) {
      onLocationGranted({
        latitude: location.latitude,
        longitude: location.longitude
      })
    }
  }, [location, onLocationGranted])

  // Nếu showOnlyWhenDenied và quyền chưa bị từ chối, không hiển thị
  if (showOnlyWhenDenied && permissionStatus !== 'denied') {
    return null
  }

  // Khởi tạo editedAddress khi có address
  React.useEffect(() => {
    if (address && !editedAddress) {
      setEditedAddress(address)
    }
  }, [address, editedAddress])

  // Nếu đã có vị trí, hiển thị thông tin vị trí thay vì form yêu cầu
  if (location && !showOnlyWhenDenied) {
    const handleSaveAddress = () => {
      if (editedAddress.trim()) {
        setAddress(editedAddress.trim())
        setIsEditingAddress(false)
      }
    }

    const handleCancelEdit = () => {
      setEditedAddress(address || '')
      setIsEditingAddress(false)
    }

    return (
      <div className={`bg-white rounded-xl shadow-lg border border-green-200 p-6 ${className}`}>
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                ✓ Vị trí của bạn đã được xác định
              </h3>
              {!isEditingAddress && (
                <button
                  onClick={() => setIsEditingAddress(true)}
                  className="text-sm text-grabGreen-700 hover:text-grabGreen-800 font-medium"
                >
                  Chỉnh sửa địa chỉ
                </button>
              )}
            </div>
            
            {isEditingAddress ? (
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Địa chỉ của bạn:</label>
                <textarea
                  value={editedAddress}
                  onChange={(e) => setEditedAddress(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-grabGreen-500 focus:border-grabGreen-500 transition duration-150"
                  rows={3}
                  placeholder="Nhập địa chỉ chi tiết (ví dụ: Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố)"
                />
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  💡 Ví dụ: Số 123, Đường ABC, Phường XYZ, Quận 1, TP.HCM
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveAddress}
                    className="px-4 py-2 bg-grabGreen-700 text-white rounded-lg font-medium hover:bg-grabGreen-800 transition duration-150"
                  >
                    Lưu địa chỉ
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition duration-150"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <>
                {address ? (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Địa chỉ:</p>
                    <p className="text-base font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      📍 {address}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Tọa độ: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-yellow-600 mt-2">
                      ⚠️ Nếu địa chỉ không chính xác, vui lòng nhấn "Chỉnh sửa địa chỉ" để sửa lại
                    </p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Không thể lấy địa chỉ tự động. Vui lòng nhập thủ công:</p>
                    <textarea
                      value={editedAddress}
                      onChange={(e) => setEditedAddress(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-grabGreen-500 focus:border-grabGreen-500 transition duration-150"
                      rows={3}
                      placeholder="Nhập địa chỉ chi tiết (ví dụ: Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố)"
                    />
                    <p className="text-xs text-gray-500 mt-1 mb-3">
                      💡 Ví dụ: Gần KCN Hố Nai, Đường ABC, Phường XYZ, Quận 1, TP.HCM
                    </p>
                    <button
                      onClick={handleSaveAddress}
                      className="px-4 py-2 bg-grabGreen-700 text-white rounded-lg font-medium hover:bg-grabGreen-800 transition duration-150"
                    >
                      Lưu địa chỉ
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Tọa độ: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Action buttons */}
            {!isEditingAddress && (
              <div className="flex space-x-3">
                <button
                  onClick={getCurrentLocation}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang cập nhật...' : 'Làm mới vị trí'}
                </button>
              </div>
            )}

            {/* Privacy note */}
            <p className="mt-4 text-xs text-gray-500">
              Vị trí của bạn chỉ được sử dụng để cải thiện trải nghiệm đặt hàng và sẽ không được chia sẻ với bên thứ ba.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handleRequestLocation = async () => {
    if (permissionStatus === 'denied') {
      // Hướng dẫn người dùng cấp quyền trong cài đặt
      alert(
        'Vui lòng cấp quyền truy cập vị trí trong cài đặt trình duyệt của bạn:\n\n' +
        'Chrome/Edge: Cài đặt > Quyền riêng tư và bảo mật > Cài đặt trang web > Vị trí\n' +
        'Firefox: Cài đặt > Quyền riêng tư & Bảo mật > Quyền > Vị trí\n' +
        'Safari: Tùy chọn > Quyền riêng tư > Dịch vụ định vị'
      )
    } else {
      await requestPermission()
    }
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-grabGreen-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-grabGreen-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Cho phép truy cập vị trí của bạn
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Chúng tôi cần vị trí của bạn để:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-4 list-disc list-inside">
            <li>Tìm các nhà hàng gần bạn</li>
            <li>Tự động điền địa chỉ giao hàng</li>
            <li>Ước tính thời gian giao hàng chính xác hơn</li>
          </ul>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="mb-4 flex items-center space-x-2 text-sm text-gray-600">
              <svg
                className="animate-spin h-4 w-4 text-grabGreen-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Đang lấy vị trí...</span>
            </div>
          )}

          {/* Success message with address */}
          {location && !showOnlyWhenDenied && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 mb-1">
                    ✓ Đã lấy vị trí thành công!
                  </p>
                  {address ? (
                    <div>
                      <p className="text-xs text-green-600 mb-1">Địa chỉ của bạn:</p>
                      <p className="text-sm font-semibold text-green-900 bg-white p-2 rounded border border-green-200">
                        📍 {address}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Tọa độ: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-green-600">
                      Đang lấy địa chỉ từ tọa độ...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleRequestLocation}
              disabled={loading}
              className="px-4 py-2 bg-grabGreen-700 text-white rounded-lg font-medium hover:bg-grabGreen-800 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {permissionStatus === 'denied' ? 'Hướng dẫn cấp quyền' : 'Cho phép truy cập vị trí'}
            </button>
            {location && (
              <button
                onClick={getCurrentLocation}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Làm mới vị trí
              </button>
            )}
          </div>

          {/* Privacy note */}
          <p className="mt-4 text-xs text-gray-500">
            Vị trí của bạn chỉ được sử dụng để cải thiện trải nghiệm đặt hàng và sẽ không được chia sẻ với bên thứ ba.
          </p>
        </div>
      </div>
    </div>
  )
}

