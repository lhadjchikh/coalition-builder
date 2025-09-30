#!/usr/bin/env python3
"""
Generate a secure Django secret key for terraform.tfvars

This script generates a cryptographically secure secret key and writes it
to a file with restricted permissions. The key is NOT printed to stdout
to avoid exposure in logs or command history.
"""

import argparse
import os
import random
import string
import sys


def generate_secret_key(length=50):
    """Generate a Django-compatible secret key."""
    chars = string.ascii_letters + string.digits + "!@#$%^&*(-_=+)"
    return "".join(random.SystemRandom().choice(chars) for _ in range(length))


def write_key_to_file(key, filepath):
    """Write key to file with restricted permissions."""
    # Create file with restrictive permissions (owner read/write only)
    fd = os.open(filepath, os.O_CREAT | os.O_WRONLY | os.O_TRUNC, 0o600)
    try:
        with os.fdopen(fd, "w") as f:
            f.write(f'django_secret_key = "{key}"\n')
    except Exception:
        os.close(fd)
        raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate a secure Django secret key for Terraform"
    )
    parser.add_argument(
        "--output",
        "-o",
        default="secret_key.tfvars",
        help="Output file path (default: secret_key.tfvars)",
    )
    parser.add_argument(
        "--print",
        action="store_true",
        help="Print key to stdout (WARNING: may expose in logs)",
    )
    args = parser.parse_args()

    key = generate_secret_key()

    if args.print:
        print("\n⚠️  WARNING: Printing secret key to stdout (may appear in logs)")
        print("=" * 60)
        print(key)
        print("=" * 60)
    else:
        try:
            write_key_to_file(key, args.output)
            print(f"\n✅ Secret key generated and saved to: {args.output}")
            print(f"   File permissions set to 0600 (owner read/write only)")
            print(f"\n📝 To use with Terraform:")
            print(f"   terraform apply -var-file={args.output}")
            print("\n⚠️  Keep this file secure and never commit it to version control!")
            print("   Add to .gitignore: echo 'secret_key.tfvars' >> .gitignore")
        except Exception as e:
            print(f"\n❌ Error writing key to file: {e}", file=sys.stderr)
            sys.exit(1)