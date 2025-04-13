# Database Migration Utilities

This directory contains utilities for managing database migrations in the RideShare application.

## Quick Start

### Adding a New Table

To add a new table to the database, use the `add_table.py` script:

```bash
python add_table.py table_name [--columns col1:type1 col2:type2 ...] [--foreign-keys col1:table1.id col2:table2.id ...]
```

Example:

```bash
python add_table.py user_preferences --columns theme:String notifications:Boolean --foreign-keys user_id:users.id
```

This will:
1. Create a migration file in `migrations/versions/`
2. Apply the migration directly to the database
3. Record the migration in the `alembic_version` table

### Advanced Migration Management

For more advanced migration management, use the `db_migration_utility.py` script:

```bash
python db_migration_utility.py [command] [options]
```

Available commands:

- `create-migration`: Create a new migration file
- `apply-direct`: Apply a migration directly to the database
- `check-status`: Check migration status
- `fix-heads`: Fix migration heads

Example:

```bash
python db_migration_utility.py create-migration "add user preferences" --table "user_preferences"
```

## Supported Column Types

The following column types are supported:

- `String`: Text data
- `Integer`: Integer numbers
- `Boolean`: True/False values
- `Float`: Floating-point numbers
- `DateTime`: Date and time
- `Date`: Date only
- `Time`: Time only
- `Text`: Long text data
- `JSON`: JSON data (stored as text)

## Troubleshooting

If you encounter issues with migrations, try the following:

1. Check migration status:
   ```bash
   python db_migration_utility.py check-status
   ```

2. Fix migration heads:
   ```bash
   python db_migration_utility.py fix-heads
   ```

3. Apply a migration directly:
   ```bash
   python db_migration_utility.py apply-direct --migration-id "your_migration_id" --table "your_table"
   ```

## Examples

### Adding a BookingPassenger Table

```bash
python add_table.py booking_passengers --columns email:String name:String phone:String is_primary:Boolean --foreign-keys booking_id:ride_bookings.id user_id:users.id
```

### Adding a UserPreferences Table

```bash
python add_table.py user_preferences --columns theme:String language:String notifications:Boolean --foreign-keys user_id:users.id
```

### Adding a PaymentMethod Table

```bash
python add_table.py payment_methods --columns method_type:String card_number:String expiry_date:String is_default:Boolean --foreign-keys user_id:users.id
```

## Best Practices

1. Always use these utilities to create and apply migrations
2. Keep migration files in version control
3. Run `check-status` before and after applying migrations
4. Use descriptive names for migrations and tables
5. Add appropriate indexes for frequently queried columns
