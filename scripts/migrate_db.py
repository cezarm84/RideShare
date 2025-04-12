#!/usr/bin/env python
import argparse
import subprocess


def main():
    parser = argparse.ArgumentParser(description="Manage database migrations")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create migration
    create_parser = subparsers.add_parser("create", help="Create a new migration")
    create_parser.add_argument("message", help="Migration message")

    # Apply migrations
    apply_parser = subparsers.add_parser("apply", help="Apply migrations")
    apply_parser.add_argument(
        "--revision", help="Specific revision to migrate to", default="head"
    )

    # Rollback migrations
    rollback_parser = subparsers.add_parser("rollback", help="Rollback migrations")
    rollback_parser.add_argument(
        "--revision", help="Revision to rollback to", default="-1"
    )

    # Show history
    subparsers.add_parser("history", help="Show migration history")

    # Show current
    subparsers.add_parser("current", help="Show current migration")

    args = parser.parse_args()

    if args.command == "create":
        create_migration(args.message)
    elif args.command == "apply":
        apply_migrations(args.revision)
    elif args.command == "rollback":
        rollback_migrations(args.revision)
    elif args.command == "history":
        show_history()
    elif args.command == "current":
        show_current()
    else:
        parser.print_help()


def create_migration(message):
    """Create a new migration with the given message"""
    print(f"Creating migration: {message}")
    subprocess.run(["alembic", "revision", "--autogenerate", "-m", message])


def apply_migrations(revision="head"):
    """Apply migrations up to the specified revision"""
    print(f"Applying migrations to: {revision}")
    subprocess.run(["alembic", "upgrade", revision])


def rollback_migrations(revision="-1"):
    """Rollback migrations to the specified revision"""
    print(f"Rolling back to: {revision}")
    subprocess.run(["alembic", "downgrade", revision])


def show_history():
    """Show migration history"""
    print("Migration history:")
    subprocess.run(["alembic", "history"])


def show_current():
    """Show current migration"""
    print("Current migration:")
    subprocess.run(["alembic", "current"])


if __name__ == "__main__":
    main()
