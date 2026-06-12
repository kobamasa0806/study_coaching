from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('tasks', '0002_taskmodel_actual_dates_taskmodel_plan_dates_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudyLogModel',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('studied_on', models.DateField(verbose_name='勉強日')),
                ('start_time', models.TimeField(verbose_name='開始時刻')),
                ('end_time', models.TimeField(verbose_name='終了時刻')),
                ('memo', models.TextField(blank=True, default='', verbose_name='メモ')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='作成日時')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新日時')),
                ('task', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='study_logs', to='tasks.taskmodel', verbose_name='計画項目')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='study_logs', to=settings.AUTH_USER_MODEL, verbose_name='ユーザー')),
            ],
            options={
                'verbose_name': '勉強記録',
                'verbose_name_plural': '勉強記録一覧',
                'db_table': 'study_logs',
                'ordering': ['-studied_on', '-start_time'],
            },
        ),
    ]
