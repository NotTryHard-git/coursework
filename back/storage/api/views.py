from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from .models import Goods, Placement, Type, Section, Shelving,Issue, OperationLog
from .serializers import OperationLogSerializer,TypeSerializer, SectionSerializer,PlacementSerializer, ShelvingSerializer,ProductWithPlacementSerializer, IssueSerializer 

from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.middleware.csrf import get_token
from .serializers import LoginSerializer, UserSerializer

class OperationLogViewSet(viewsets.ModelViewSet):
    queryset = OperationLog.objects.all().select_related('user', 'product', 'old_location', 'new_location')
    serializer_class = OperationLogSerializer
    permission_classes = [IsAuthenticated]
    def perform_create(self, serializer):
        # Автоматически подставляем текущего пользователя
        serializer.save(user=self.request.user)
    def get_queryset(self):
        queryset = super().get_queryset()
        # Фильтрация по действию
        action = self.request.query_params.get('action', None)
        if action:
            queryset = queryset.filter(action=action)
        return queryset
    
@api_view(['GET'])
@ensure_csrf_cookie
def get_csrf_token(request):
    return Response({'csrfToken': get_token(request)})

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_protect
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Успешный вход'
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_protect
def logout_view(request):
    logout(request)
    return Response({'message': 'Успешный выход'})

@api_view(['GET'])
@ensure_csrf_cookie
def current_user_view(request):
    if request.user.is_authenticated:
        return Response(UserSerializer(request.user).data)
    return Response({'user': None}, status=status.HTTP_200_OK)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Goods.objects.all()
    
    serializer_class = ProductWithPlacementSerializer
        
class TypeViewSet(viewsets.ModelViewSet):
    queryset = Type.objects.all()
    serializer_class = TypeSerializer
    
class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer

class PlacementViewSet(viewsets.ModelViewSet):
    queryset = Placement.objects.all()
    serializer_class = PlacementSerializer
    def perform_create(self, serializer):
        placement = serializer.save()
        # Лог размещения
        if self.request.user.is_authenticated:
            OperationLog.objects.create(
                user=self.request.user,
                action='placement',
                product=placement.product,
                quantity=placement.quantity,
                new_location=placement.section
            )

class ShelvingViewSet(viewsets.ModelViewSet):
    queryset = Shelving.objects.all().prefetch_related('sections') 
    serializer_class = ShelvingSerializer

class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    def perform_create(self, serializer):
        issue = serializer.save()
        # Лог выдачи
        if self.request.user.is_authenticated:
            OperationLog.objects.create(
                user=self.request.user,
                action='issue',
                product=issue.product,
                quantity=issue.quantity,
                old_location=issue.section
            )