import { useState, useEffect, useCallback } from 'react'

export interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: number
}

export interface UseLocationReturn {
  location: LocationData | null
  loading: boolean
  error: string | null
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown'
  requestPermission: () => Promise<void>
  getCurrentLocation: () => Promise<void>
  clearLocation: () => void
}

/**
 * Hook để lấy và quản lý vị trí địa lý của người dùng
 */
export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown')

  // Kiểm tra trạng thái quyền geolocation
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setPermissionStatus('denied')
      setError('Trình duyệt của bạn không hỗ trợ định vị địa lý')
      return
    }

    // Kiểm tra quyền nếu browser hỗ trợ Permissions API
    if ('permissions' in navigator) {
      // @ts-ignore - Permissions API có thể chưa có type đầy đủ
      navigator.permissions.query({ name: 'geolocation' }).then((result: PermissionStatus) => {
        setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied')
        
        // Lắng nghe thay đổi quyền
        result.onchange = () => {
          setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied')
        }
      }).catch(() => {
        // Nếu không hỗ trợ Permissions API, mặc định là 'prompt'
        setPermissionStatus('prompt')
      })
    } else {
      // Nếu không hỗ trợ Permissions API, mặc định là 'prompt'
      setPermissionStatus('prompt')
    }

    // Lấy vị trí đã lưu từ localStorage
    const savedLocation = localStorage.getItem('user_location')
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation)
        // Kiểm tra xem vị trí có còn hợp lệ không (không quá 1 giờ)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
          setLocation(parsed)
        }
      } catch (e) {
        console.error('Failed to parse saved location:', e)
      }
    }
  }, [])

  // Yêu cầu quyền và lấy vị trí
  const requestPermission = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setError('Trình duyệt của bạn không hỗ trợ định vị địa lý')
      setPermissionStatus('denied')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        )
      })

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now()
      }

      setLocation(locationData)
      setPermissionStatus('granted')
      
      // Lưu vào localStorage
      localStorage.setItem('user_location', JSON.stringify(locationData))
    } catch (err: any) {
      let errorMessage = 'Không thể lấy vị trí của bạn'
      
      if (err.code === 1) {
        errorMessage = 'Bạn đã từ chối quyền truy cập vị trí'
        setPermissionStatus('denied')
      } else if (err.code === 2) {
        errorMessage = 'Không thể xác định vị trí của bạn'
      } else if (err.code === 3) {
        errorMessage = 'Yêu cầu vị trí đã hết thời gian chờ'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Lấy vị trí hiện tại (không yêu cầu quyền nếu đã có)
  const getCurrentLocation = useCallback(async () => {
    if (permissionStatus === 'denied') {
      setError('Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt.')
      return
    }

    await requestPermission()
  }, [permissionStatus, requestPermission])

  // Xóa vị trí đã lưu
  const clearLocation = useCallback(() => {
    setLocation(null)
    localStorage.removeItem('user_location')
  }, [])

  return {
    location,
    loading,
    error,
    permissionStatus,
    requestPermission,
    getCurrentLocation,
    clearLocation
  }
}

