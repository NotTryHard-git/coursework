from django.contrib import admin
from .models import Goods, Shelving

@admin.register(Goods)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'quantity', 'code', 'type_id']

@admin.register(Shelving)
class ShelvingAdmin(admin.ModelAdmin):
    list_display = ['id','name', 'sections']
