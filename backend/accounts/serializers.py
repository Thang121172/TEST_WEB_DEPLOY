from rest_framework import serializers
from django.contrib.auth import get_user_model

# Lấy User model tùy chỉnh
User = get_user_model()
class UserSerializer(serializers.ModelSerializer):
    # Loại bỏ type hint để Pylance không báo lỗi
    username = serializers.CharField(source='username') 
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('username', 'email') 
# --- Serializer cho Đăng ký người dùng (Đã đổi tên thành RegisterSerializer) ---
# Tên này khớp với lỗi ImportError từ views.py
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name')
        
    def create(self, validated_data):
        # Tạo người dùng bằng phương thức create_user an toàn
        user = User.objects.create_user(**validated_data)
        return user