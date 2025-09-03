from rest_framework import serializers
from .models import Goods, Section, Placement, Type, Shelving,Issue, OperationLog
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

class OperationLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.code', read_only=True)
    old_location_name = serializers.SerializerMethodField()
    new_location_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = OperationLog
        fields = '__all__'
    
    def get_old_location_name(self, obj):
        if obj.old_location:
            return f"Стеллаж {obj.old_location.location.name} - Секция {obj.old_location.name}"
        return None
    
    def get_new_location_name(self, obj):
        if obj.new_location:
            return f"Стеллаж {obj.new_location.location.name} - Секция {obj.new_location.name}"
        return None

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError('Пользователь неактивен')
            else:
                raise serializers.ValidationError('Неверные учетные данные')
        else:
            raise serializers.ValidationError('Необходимо указать имя пользователя и пароль')
        
        return data

class UserSerializer(serializers.ModelSerializer):
    position = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'position')

    def get_position(self, obj):
        return getattr(obj, 'position', 'Сотрудник')


class PlacementSerializer(serializers.ModelSerializer):
    width =serializers.IntegerField(source='product.width', read_only=True)
    height = serializers.IntegerField(source='product.height', read_only=True)
    length = serializers.IntegerField(source='product.length', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    shelving_id= serializers.IntegerField(source='section.location.id', read_only=True)
    section_name = serializers.IntegerField(source='section.name', read_only=True)
    shelving_name = serializers.CharField(source='section.location.name', read_only=True)
    class Meta:
        model = Placement
        fields = ('id', 'product','product_name', 'width','height','length', 'section','shelving_id', 'shelving_name','section_name', 'quantity', 'date')
        
    

class ProductWithPlacementSerializer(serializers.ModelSerializer):
    placements = PlacementSerializer(many=True, read_only=True, source='placements.all')
    total_quantity_placed = serializers.SerializerMethodField()
    type_name = serializers.CharField(source='type_id.name', read_only=True)

    class Meta:
        model = Goods
        fields = ('id', 'code', 'name', 'width', 'height', 'length', 
                 'weight', 'quantity', 'type_id', 'type_name', 
                 'placements', 'total_quantity_placed')

    def get_total_quantity_placed(self, obj):
        """Общее количество товара, размещенного на складе"""
        return sum(placement.quantity for placement in obj.placements.all())


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = '__all__'



class TypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Type
        fields = '__all__'

class ShelvingSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)

    class Meta:
        model = Shelving
        fields = ('id','name', 'width','height','length','sections_sum', 'sections', 'space')


class IssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = '__all__'
