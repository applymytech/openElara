# OpenElara Digital Signing Setup Guide

## Overview
OpenElara includes a digital signing system for AI-generated content to ensure authenticity and prevent tampering. This system uses ECDSA cryptographic signatures and C2PA (Content Authenticity Initiative) standards.

## Setup Instructions

### 1. Generate ECDSA Signing Keys

You need to generate an ECDSA private key for content signing:

```bash
# Generate a new ECDSA private key
openssl ecparam -name prime256v1 -genkey -noout -out private_key.pem

# Convert to PKCS#8 format (required by Node.js crypto)
openssl pkcs8 -topk8 -nocrypt -in private_key.pem -out signing_key.pem
```

### 2. Configure Signing Keys

1. Copy the template file:
   ```bash
   cp signing-keys.env.template signing-keys.env
   ```

2. Edit `signing-keys.env` and replace the placeholder with your actual private key:
   ```bash
   # Open the file and replace [REPLACE WITH YOUR ACTUAL ECDSA PRIVATE KEY PEM CONTENT]
   # with the content of your signing_key.pem file
   ```

3. **Important**: The `signing-keys.env` file is gitignored and should never be committed to version control.

### 3. Code Signing Certificate (for Windows builds)

For production builds, you'll need a code signing certificate:

1. Obtain a code signing certificate (.pfx file) from a trusted Certificate Authority
2. Set environment variables for the build process:
   ```bash
   # Copy the example file
   cp .env.example .env

   # Edit .env with your certificate details
   CERTIFICATE_FILE=C:/path/to/your/certificate.pfx
   CERTIFICATE_PASSWORD=your_certificate_password
   ```

## How It Works

### Content Signing Process
1. **File Hashing**: SHA-256 hash of the original content
2. **Digital Signature**: ECDSA signature of the hash using your private key
3. **Certificate Creation**: JSON certificate containing metadata, hash, and signature
4. **C2PA Embedding**: Industry-standard content credentials embedded in supported formats
5. **Legacy Watermarking**: Fallback embedding for unsupported formats

### Verification Process
1. **Extract Metadata**: Read embedded signature data
2. **Hash Verification**: Recalculate file hash and compare
3. **Signature Verification**: Verify ECDSA signature using public key
4. **Certificate Validation**: Check certificate integrity and metadata

## Security Notes

- **Private Key Protection**: Never commit `signing-keys.env` to version control
- **Key Backup**: Keep secure backups of your signing keys
- **Certificate Renewal**: Monitor certificate expiration dates
- **Key Rotation**: Plan for periodic key rotation in production environments

## Troubleshooting

### Common Issues

**"signing-keys.env file not found"**
- Ensure you've created the `signing-keys.env` file from the template
- Check file permissions and location

**"SIGNING_PRIVATE_KEY not properly configured"**
- Verify the private key is in correct PEM format
- Ensure the key was generated with ECDSA prime256v1 curve
- Check for proper PKCS#8 format

**"C2PA embedding failed"**
- Falls back to legacy watermarking automatically
- Check electron-log for detailed error messages
- Some file formats may not support C2PA

### Testing the Setup

1. Generate a test file through the OpenElara interface
2. Check the Output/signed directory for signed files and certificates
3. Use the verification feature to test signature validation
4. Check electron-log for any signing-related messages

## File Locations

- **Signing Keys**: `signing-keys.env` (gitignored)
- **Signed Content**: `%AppData%\Roaming\openelara\Output\signed\`
- **Certificates**: JSON files alongside signed content
- **Logs**: `%AppData%\Roaming\openelara\logs\main.log`