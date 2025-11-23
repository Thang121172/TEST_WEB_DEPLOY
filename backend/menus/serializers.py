from rest_framework import serializers
from .models import MenuItem, Merchant


class MenuItemSerializer(serializers.ModelSerializer):
    merchant_name = serializers.CharField(source='merchant.name', read_only=True)
    merchant_address = serializers.SerializerMethodField()
    distance_km = serializers.FloatField(read_only=True, required=False, help_text='Khoảng cách từ vị trí khách hàng (km)')
    image_url = serializers.URLField(required=False, allow_null=True)
    
    def get_merchant_address(self, obj):
        """Lấy địa chỉ merchant, trả về chuỗi rỗng nếu None"""
        return obj.merchant.address if obj.merchant and obj.merchant.address else ''
    
    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'description', 'price', 'stock', 'image_url', 'merchant_name', 'merchant_address', 'distance_km', 'is_available']


class MerchantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Merchant
        fields = ['id', 'name', 'address', 'latitude', 'longitude', 'phone', 'is_active']
