from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Adds Order.payment_method and Order.cod_fee.

    The SQL uses IF NOT EXISTS so this migration also succeeds on a database
    that already has these columns (for example one that was used with an
    earlier build), instead of failing with "column already exists".
    """

    dependencies = [
        ("orders", "0003_order_claim_token_order_guest_email_alter_order_user"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name="order",
                    name="cod_fee",
                    field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
                ),
                migrations.AddField(
                    model_name="order",
                    name="payment_method",
                    field=models.CharField(
                        choices=[("online", "Online Payment"), ("cod", "Cash on Delivery")],
                        default="online",
                        max_length=20,
                    ),
                ),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql=[
                        "ALTER TABLE orders_order ADD COLUMN IF NOT EXISTS cod_fee numeric(10,2) NOT NULL DEFAULT 0;",
                        "ALTER TABLE orders_order ALTER COLUMN cod_fee DROP DEFAULT;",
                        "ALTER TABLE orders_order ADD COLUMN IF NOT EXISTS payment_method varchar(20) NOT NULL DEFAULT 'online';",
                        "ALTER TABLE orders_order ALTER COLUMN payment_method DROP DEFAULT;",
                    ],
                    reverse_sql=[
                        "ALTER TABLE orders_order DROP COLUMN IF EXISTS payment_method;",
                        "ALTER TABLE orders_order DROP COLUMN IF EXISTS cod_fee;",
                    ],
                ),
            ],
        ),
    ]
