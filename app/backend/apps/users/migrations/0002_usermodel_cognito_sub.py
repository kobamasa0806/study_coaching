# cognito_sub フィールドを users テーブルに追加するマイグレーション

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='usermodel',
            name='cognito_sub',
            field=models.CharField(
                blank=True,
                max_length=128,
                null=True,
                unique=True,
                verbose_name='Cognito Sub',
            ),
        ),
    ]
