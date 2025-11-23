from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import MenuItem, Merchant
from .serializers import MenuItemSerializer
from .utils import haversine_distance


class MenuViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.filter(is_available=True).select_related('merchant')
    serializer_class = MenuItemSerializer

    @action(detail=False, methods=['get'], url_path='nearby')
    def nearby(self, request):
        """
        Lấy danh sách menu items từ các merchant gần vị trí khách hàng.
        
        Query params:
        - lat: Vĩ độ của khách hàng (required)
        - lng: Kinh độ của khách hàng (required)
        - radius: Bán kính tìm kiếm (km), mặc định 10km
        """
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        try:
            radius = float(request.query_params.get('radius', 10))  # Mặc định 10km
        except (ValueError, TypeError):
            radius = 10.0  # Mặc định 10km nếu không hợp lệ

        if not lat or not lng:
            return Response(
                {'error': 'Thiếu tham số lat và lng'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            customer_lat = float(lat)
            customer_lng = float(lng)
        except (ValueError, TypeError):
            return Response(
                {'error': 'lat và lng phải là số hợp lệ'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Lấy tất cả merchant có tọa độ
        merchants_with_location = Merchant.objects.filter(
            is_active=True,
            latitude__isnull=False,
            longitude__isnull=False
        )

        # Tính khoảng cách và lọc merchant trong phạm vi
        nearby_merchants = []
        for merchant in merchants_with_location:
            try:
                # Đảm bảo latitude và longitude không phải None
                if merchant.latitude is None or merchant.longitude is None:
                    continue
                    
                merchant_lat = float(merchant.latitude)
                merchant_lng = float(merchant.longitude)
                
                distance = haversine_distance(
                    customer_lat, customer_lng,
                    merchant_lat, merchant_lng
                )
                if distance <= radius:
                    merchant.distance_km = distance
                    nearby_merchants.append(merchant)
            except (ValueError, TypeError) as e:
                # Bỏ qua merchant có tọa độ không hợp lệ
                continue

        # Lấy menu items từ các merchant gần đó
        if not nearby_merchants:
            return Response({
                'items': [],
                'message': f'Không tìm thấy cửa hàng nào trong phạm vi {radius}km'
            })

        merchant_ids = [m.id for m in nearby_merchants]
        menu_items = MenuItem.objects.filter(
            merchant_id__in=merchant_ids,
            is_available=True,
            merchant__isnull=False  # Đảm bảo merchant tồn tại
        ).select_related('merchant')

        # Tạo dict để tra cứu khoảng cách nhanh
        merchant_distance_map = {m.id: m.distance_km for m in nearby_merchants}

        # Serialize và thêm khoảng cách
        try:
            serializer = self.get_serializer(menu_items, many=True)
            data = serializer.data

            # Thêm khoảng cách vào mỗi item
            for item_data, item in zip(data, menu_items):
                item_data['distance_km'] = round(merchant_distance_map.get(item.merchant_id, 0), 2)

            # Sắp xếp theo khoảng cách (gần nhất trước)
            data.sort(key=lambda x: x.get('distance_km', float('inf')))
        except Exception as e:
            # Nếu có lỗi serialize, trả về lỗi
            return Response(
                {'error': f'Lỗi khi xử lý dữ liệu: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            'items': data,
            'count': len(data),
            'radius_km': radius,
            'customer_location': {'lat': customer_lat, 'lng': customer_lng}
        })
