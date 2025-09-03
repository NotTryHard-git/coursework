from django.db import models
from django.contrib.auth.models import User

# Добавим модель для логов
class OperationLog(models.Model):
    ACTION_CHOICES = [
        ('placement', 'Размещение'),
        ('issue', 'Выдача'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Пользователь")
    action = models.CharField(max_length=10, choices=ACTION_CHOICES, verbose_name="Действие")
    product = models.ForeignKey('Goods', on_delete=models.CASCADE, verbose_name="Товар")
    quantity = models.PositiveIntegerField(verbose_name="Количество")
    old_location = models.ForeignKey('Section', on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='old_operation_logs', verbose_name="Старое место")
    new_location = models.ForeignKey('Section', on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='new_operation_logs', verbose_name="Новое место")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Время операции")
    
    class Meta:
        verbose_name = "Лог операции"
        verbose_name_plural = "Логи операций"
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.get_action_display()} {self.product.name} ({self.quantity} шт.)"

class Shelving(models.Model):

    name = models.CharField(max_length=50) 
    width = models.FloatField()   
    height = models.FloatField()  
    length = models.FloatField()  
    sections_sum = models.IntegerField(verbose_name="Количество секций")
    space = models.FloatField(verbose_name="Место")
    class Meta:
        verbose_name = "Стеллаж"
        verbose_name_plural = "Стеллажи"
        ordering = ['id']  
    
    def __str__(self):
        return f"Стеллаж {self.name}"

    

class Section(models.Model):
    """Модель полки/ячейки - основная сущность для размещения"""
    id = models.BigAutoField(primary_key=True)
    location = models.ForeignKey(Shelving, on_delete=models.CASCADE, related_name='sections')
    name = models.IntegerField(default=1)
    width = models.FloatField()   
    height = models.FloatField()  
    length = models.FloatField()  
    
    max_weight = models.FloatField(blank=True, null=True)
    is_occupied = models.BooleanField(default=False) 
    class Meta:
        verbose_name = "Секция"
        verbose_name_plural = "Секции"
    
    def __str__(self):
        return f"Секция {self.id}"
    
class Type(models.Model):
    name = models.CharField(max_length=100, verbose_name="Название")

class Goods(models.Model):
    code = models.CharField(max_length=8, unique=True, db_index=True, verbose_name=" Код товара")
    width = models.FloatField()   # X
    height = models.FloatField()  # Z
    length = models.FloatField()  # Y
    weight = models.FloatField(blank=True, null=True)
    name = models.CharField(max_length=100, verbose_name="Название")
    quantity = models.PositiveIntegerField( verbose_name="Количество")
    type_id = models.ForeignKey(Type,on_delete=models.CASCADE)
    
    class Meta:
        verbose_name = "Товар"
        verbose_name_plural = "Товары"
        ordering = ['id']
    
    def __str__(self):
        return f"{self.name} (CODE: {self.code})"

    
class Placement(models.Model):
    """Самая важная модель: связывает товар и место, где он лежит.
       Фиксирует каждое размещение партии."""
    product = models.ForeignKey(Goods, on_delete=models.CASCADE, related_name='placements')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='placements')
    quantity = models.PositiveIntegerField() # Количество в этом месте
    date = models.DateTimeField(auto_now_add=True)
    class Meta:
        verbose_name = "Размещение"
        ordering = ['-date']
    
    
class Issue(models.Model):
    product = models.ForeignKey(Goods, on_delete=models.CASCADE, related_name='issue')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='issue')
    quantity = models.PositiveIntegerField() # Количество 
    date = models.DateTimeField(auto_now_add=True)
    class Meta:
        verbose_name = "Выдача"
        verbose_name_plural = "Выдачи"
        ordering = ['-date']
    
    def __str__(self):
        return f"Выдача {self.product.name} - {self.quantity} шт."
