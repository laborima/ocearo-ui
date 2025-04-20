# 🔐 Local HTTPS Setup Guide for ocearo-ui (or any Local PWA)

This guide helps you:
1. Generate a local Root CA and certificate for your app domain (e.g., `ocearo.local`).
2. Install the Root CA on Android for secure PWA testing.
3. Enable HTTPS in a server like Signal K (or any HTTPS-capable backend).

---

## 🛠️ Step 1: Generate Certificates with Bash Script

Create a file named `generate-local-cert.sh`:

```bash
#!/bin/bash

DOMAIN="ocearo.local"
CERTS_DIR="./certs"
ROOT_KEY="$CERTS_DIR/rootCA.key"
ROOT_CERT="$CERTS_DIR/rootCA.pem"
DOMAIN_KEY="$CERTS_DIR/$DOMAIN.key"
DOMAIN_CSR="$CERTS_DIR/$DOMAIN.csr"
DOMAIN_CERT="$CERTS_DIR/$DOMAIN.crt"
DOMAIN_PEM="$CERTS_DIR/$DOMAIN.pem"
OPENSSL_CONFIG="$CERTS_DIR/openssl.cnf"

mkdir -p "$CERTS_DIR"

echo "🔐 Generating Root CA..."
openssl genrsa -out "$ROOT_KEY" 2048
openssl req -x509 -new -nodes -key "$ROOT_KEY" -sha256 -days 3650 -out "$ROOT_CERT" \
    -subj "/C=XX/ST=Local/L=Dev/O=LocalCert/CN=Local Root CA"

echo "🔑 Creating domain key..."
openssl genrsa -out "$DOMAIN_KEY" 2048

cat > "$OPENSSL_CONFIG" <<EOF
[req]
default_bits       = 2048
distinguished_name = req_distinguished_name
req_extensions     = req_ext
prompt             = no

[req_distinguished_name]
C  = XX
ST = Local
L  = Dev
O  = LocalDev
CN = $DOMAIN

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
EOF

echo "📄 Generating CSR..."
openssl req -new -key "$DOMAIN_KEY" -out "$DOMAIN_CSR" -config "$OPENSSL_CONFIG"

echo "🔏 Signing cert with Root CA..."
openssl x509 -req -in "$DOMAIN_CSR" -CA "$ROOT_CERT" -CAkey "$ROOT_KEY" -CAcreateserial \
    -out "$DOMAIN_CERT" -days 825 -sha256 -extfile "$OPENSSL_CONFIG" -extensions req_ext

cat "$DOMAIN_KEY" "$DOMAIN_CERT" > "$DOMAIN_PEM"

echo "✅ Done! Files are in: $CERTS_DIR"
```

Then run it:

```bash
chmod +x generate-local-cert.sh
./generate-local-cert.sh
```

---

## 📱 Step 2: Install Root CA on Android

1. Copy `certs/rootCA.pem` to your Android device.
2. Rename it to `rootCA.crt`.
3. On Android:
   - Go to **Settings > Security > Encryption & credentials**.
   - Tap **Install a certificate > CA certificate**.
   - Select the `rootCA.crt` file.
4. Accept the warning. This allows your browser to trust locally signed HTTPS sites.

> 💡 Note: Only some browsers (e.g., Firefox) trust user-added CAs. Chrome ignores them unless the device is rooted.

---

## 🌐 Step 3: Enable HTTPS for ocearo-ui Backend (e.g., Signal K)

If you're using **Signal K** or any other HTTPS backend:

1. Move the certificate files:
   ```bash
   cp certs/ocearo.local.pem ~/.signalk/ssl/key-cert.pem
   cp certs/rootCA.pem ~/.signalk/ssl/ca.pem
   ```

2. In Signal K web admin:
   - Enable **HTTPS**.
   - Set the cert path to the files above.
   - Restart the server.

3. Make sure your browser can access:  
   👉 `https://ocearo.local`

---

## 🧪 Tips for Dev Testing

- Use avahi (Bonjour) or manually update the /etc/hosts file on other devices.

- Add a line in your `/etc/hosts` or use `mDNS`:
   ```
   127.0.0.1 ocearo.local
   ```
- On Android, Firefox is preferred for self-signed cert testing.
- Always clear browser cache or reset PWA if HTTPS settings change.
