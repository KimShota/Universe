#!/bin/bash
# OpenSSL SECLEVEL=1 for MongoDB Atlas compatibility on Render
# Fixes TLSV1_ALERT_INTERNAL_ERROR with Ubuntu 24.04
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export OPENSSL_CONF="$SCRIPT_DIR/openssl-seclevel1.cnf"
exec uvicorn server:app --host 0.0.0.0 --port "${PORT:-8000}"
