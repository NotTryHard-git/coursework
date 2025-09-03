from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OperationLogViewSet,ProductViewSet, TypeViewSet, SectionViewSet,PlacementViewSet, ShelvingViewSet, IssueViewSet, login_view,logout_view, current_user_view, get_csrf_token

router = DefaultRouter()
router.register(r'goods', ProductViewSet)
router.register(r'type', TypeViewSet)
router.register(r'section', SectionViewSet)
router.register(r'placement', PlacementViewSet)
router.register(r'shelving', ShelvingViewSet)
router.register(r'issue', IssueViewSet)
router.register(r'operation-logs', OperationLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', login_view, name='login'),
    path('auth/csrf/', get_csrf_token, name='csrf-token'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/current-user/', current_user_view, name='current-user'),]