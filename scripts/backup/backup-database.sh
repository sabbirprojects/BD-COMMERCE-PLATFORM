#!/usr/bin/env bash
# ==============================================================================
# Automated Database Backup Script
# Bangladesh Single-Vendor E-commerce Platform
#
# Functionality:
#   1. Dumps PostgreSQL database using pg_dump (native or docker container).
#   2. Compresses archive with maximum gzip compression (-9).
#   3. Encrypts archive using OpenSSL AES-256-CBC with PBKDF2 key derivation.
#   4. Generates SHA-256 checksum file for cryptographic integrity verification.
#   5. Automatically prunes backups older than RETENTION_DAYS (default 30 days).
#   6. Optionally syncs encrypted backup and checksum to offsite S3/R2 bucket.
#
# Compliance:
#   - Architecture §20.2: Automated daily backup at 02:00 BST with 30-day retention.
#   - PRD FR-12.6, AC-12.3: Verifiable disaster recovery.
#   - Quality Gate: CHK-OPS-03.
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# Configuration & Defaults
# ------------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups}"
DB_NAME="${DB_NAME:-bd_commerce}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
CONTAINER_NAME="${DOCKER_POSTGRES_CONTAINER:-bd_commerce_prod_postgres}"

# Encryption key from environment or fallback key for drills
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-bd_commerce_backup_secret_passphrase_2026}"
S3_BUCKET="${S3_BUCKET:-}"

TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_BASE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}"
PLAIN_GZ="${BACKUP_BASE}.sql.gz"
ENCRYPTED_FILE="${BACKUP_BASE}.sql.gz.enc"
CHECKSUM_FILE="${ENCRYPTED_FILE}.sha256"

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "========================================================================"
echo " Starting Database Backup: ${DB_NAME}"
echo " Timestamp: ${TIMESTAMP}"
echo " Destination: ${ENCRYPTED_FILE}"
echo "========================================================================"

# ------------------------------------------------------------------------------
# Step 1: Execute pg_dump and Compress
# ------------------------------------------------------------------------------
echo "==> [1/5] Dumping PostgreSQL database and compressing with gzip..."

if command -v pg_dump >/dev/null 2>&1; then
  echo "    Using host pg_dump binary..."
  PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    | gzip -9 > "${PLAIN_GZ}"
else
  # Check for running Docker container
  if ! docker ps --format '{{.Names}}' | grep -q "${CONTAINER_NAME}"; then
    if docker ps --format '{{.Names}}' | grep -q "bd_commerce_postgres"; then
      CONTAINER_NAME="bd_commerce_postgres"
    else
      echo "ERROR: Neither host pg_dump nor running postgres docker container found!" >&2
      exit 1
    fi
  fi
  echo "    Using docker exec in container: ${CONTAINER_NAME}..."
  docker exec -e PGPASSWORD="${DB_PASSWORD}" "${CONTAINER_NAME}" \
    pg_dump \
      -U "${DB_USER}" \
      -d "${DB_NAME}" \
      --no-owner \
      --no-privileges \
      --clean \
      --if-exists \
    | gzip -9 > "${PLAIN_GZ}"
fi

PLAIN_SIZE=$(ls -lh "${PLAIN_GZ}" | awk '{print $5}')
echo "    Compressed dump created: ${PLAIN_GZ} (${PLAIN_SIZE})"

# ------------------------------------------------------------------------------
# Step 2: Encrypt Compressed Backup with OpenSSL AES-256-CBC
# ------------------------------------------------------------------------------
echo "==> [2/5] Encrypting dump with OpenSSL AES-256-CBC (PBKDF2)..."

openssl enc -aes-256-cbc -salt -pbkdf2 \
  -in "${PLAIN_GZ}" \
  -out "${ENCRYPTED_FILE}" \
  -pass "pass:${BACKUP_ENCRYPTION_KEY}"

# Securely remove unencrypted compressed dump
rm -f "${PLAIN_GZ}"

ENC_SIZE=$(ls -lh "${ENCRYPTED_FILE}" | awk '{print $5}')
echo "    Encrypted file created: ${ENCRYPTED_FILE} (${ENC_SIZE})"

# ------------------------------------------------------------------------------
# Step 3: Compute Cryptographic SHA-256 Checksum
# ------------------------------------------------------------------------------
echo "==> [3/5] Computing SHA-256 checksum..."

if command -v sha256sum >/dev/null 2>&1; then
  (cd "${BACKUP_DIR}" && sha256sum "$(basename "${ENCRYPTED_FILE}")" > "$(basename "${CHECKSUM_FILE}")")
else
  (cd "${BACKUP_DIR}" && shasum -a 256 "$(basename "${ENCRYPTED_FILE}")" > "$(basename "${CHECKSUM_FILE}")")
fi

echo "    Checksum file: ${CHECKSUM_FILE}"
echo "    SHA256: $(cat "${CHECKSUM_FILE}")"

# ------------------------------------------------------------------------------
# Step 4: Prune Backups Older than RETENTION_DAYS (30-day retention)
# ------------------------------------------------------------------------------
echo "==> [4/5] Pruning backups older than ${RETENTION_DAYS} days..."

# Find and prune files older than RETENTION_DAYS
PRUNED_COUNT=0
while IFS= read -r file; do
  if [ -n "$file" ]; then
    rm -f "$file"
    PRUNED_COUNT=$((PRUNED_COUNT + 1))
    echo "    Pruned expired backup: $(basename "$file")"
  fi
done < <(find "${BACKUP_DIR}" -name "${DB_NAME}_backup_*.sql.gz.enc*" -type f -mtime "+${RETENTION_DAYS}" 2>/dev/null || true)

echo "    Pruned ${PRUNED_COUNT} expired backup file(s)."

# ------------------------------------------------------------------------------
# Step 5: Optional Cloud Sync (S3 / Cloudflare R2)
# ------------------------------------------------------------------------------
echo "==> [5/5] Offsite Cloud Sync..."

if [ -n "${S3_BUCKET}" ]; then
  if command -v aws >/dev/null 2>&1; then
    echo "    Uploading to AWS S3 / Cloudflare R2: s3://${S3_BUCKET}/backups/..."
    aws s3 cp "${ENCRYPTED_FILE}" "s3://${S3_BUCKET}/backups/$(basename "${ENCRYPTED_FILE}")"
    aws s3 cp "${CHECKSUM_FILE}" "s3://${S3_BUCKET}/backups/$(basename "${CHECKSUM_FILE}")"
    echo "    Offsite cloud backup upload complete."
  else
    echo "    WARNING: S3_BUCKET is set but 'aws' CLI is not installed. Cloud upload skipped."
  fi
else
  echo "    S3_BUCKET not set. Backup stored in local retention repository: ${BACKUP_DIR}"
fi

echo "========================================================================"
echo " Backup Completed Successfully!"
echo " Encrypted Archive: ${ENCRYPTED_FILE}"
echo " Checksum File:     ${CHECKSUM_FILE}"
echo "========================================================================"
