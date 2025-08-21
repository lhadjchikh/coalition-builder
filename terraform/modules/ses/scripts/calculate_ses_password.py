#!/usr/bin/env python3
"""
Calculate AWS SES SMTP password from IAM secret access key.
This version outputs JSON for Terraform external data source.
"""

import hmac
import hashlib
import base64
import json
import sys


def calculate_ses_smtp_password(secret_access_key, region='us-east-1'):
    """
    Calculate SES SMTP password from IAM secret access key.
    
    The algorithm is:
    1. Sign the message "SendRawEmail" with AWS4 + secret key
    2. Prepend version byte 0x04
    3. Base64 encode the result
    """
    message = 'SendRawEmail'
    version = b'\x04'
    
    # Create signature using HMAC-SHA256
    signature = hmac.new(
        ('AWS4' + secret_access_key).encode('utf-8'),
        msg=message.encode('utf-8'),
        digestmod=hashlib.sha256
    ).digest()
    
    # Prepend version byte and encode
    signature_and_version = version + signature
    smtp_password = base64.b64encode(signature_and_version).decode('utf-8')
    
    return smtp_password


if __name__ == "__main__":
    # Read input from Terraform
    input_data = json.load(sys.stdin)
    
    secret_key = input_data.get('secret_key', '')
    region = input_data.get('region', 'us-east-1')
    
    if not secret_key:
        print(json.dumps({"error": "secret_key is required"}))
        sys.exit(1)
    
    try:
        password = calculate_ses_smtp_password(secret_key, region)
        # Output must be valid JSON with string values only
        print(json.dumps({"password": password}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)