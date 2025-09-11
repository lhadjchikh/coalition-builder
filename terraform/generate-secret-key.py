#!/usr/bin/env python3
"""
Generate a secure Django secret key for terraform.tfvars
"""

import random
import string

def generate_secret_key(length=50):
    """Generate a Django-compatible secret key."""
    chars = string.ascii_letters + string.digits + "!@#$%^&*(-_=+)"
    return ''.join(random.SystemRandom().choice(chars) for _ in range(length))

if __name__ == "__main__":
    key = generate_secret_key()
    print("\n🔑 Generated Django Secret Key:")
    print("=" * 60)
    print(key)
    print("=" * 60)
    print("\n📝 Add this to your terraform.tfvars file:")
    print(f'django_secret_key = "{key}"')
    print("\n⚠️  Keep this key secret and never commit it to version control!")