# apps/api/app/services/apple_storekit_jws.py
"""
Apple StoreKit 2 JWS Verification Module

Cryptographically verifies StoreKit 2 signed transactions (JWS format).
This is production-grade verification that:
1. Validates the x5c certificate chain against Apple Root CA - G3
2. Verifies the ES256 signature using the leaf certificate
3. Extracts and returns the verified payload

SECURITY: Never trust the payload until signature is verified.
"""

import os
import json
import base64
from datetime import datetime, timezone
from dataclasses import dataclass
from typing import Optional
from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
from cryptography.hazmat.backends import default_backend
from cryptography.x509 import load_der_x509_certificate, load_pem_x509_certificate
from cryptography.exceptions import InvalidSignature


# Path to pinned Apple Root CA - G3 certificate (DER format)
APPLE_ROOT_CA_PATH = Path(__file__).parent / "AppleRootCA-G3.cer"

# Expected bundle ID for Bass Clarity
EXPECTED_BUNDLE_ID = "com.bassclarity.app"

# Allowed product IDs
ALLOWED_PRODUCT_IDS = {"com.bassclarity.app.pro.monthly"}


@dataclass
class VerifiedTransaction:
    """Verified and trusted transaction data from Apple JWS."""
    transaction_id: str
    original_transaction_id: str
    product_id: str
    bundle_id: str
    purchase_date: Optional[datetime]  # May be absent in some edge cases
    expiration_date: Optional[datetime]
    revocation_date: Optional[datetime]
    is_upgraded: bool
    environment: str  # "Sandbox" or "Production"
    raw_payload: dict  # Full payload for debugging (don't log in production)


class JWSVerificationError(Exception):
    """Raised when JWS verification fails."""
    pass


def _load_apple_root_ca() -> x509.Certificate:
    """Load the pinned Apple Root CA - G3 certificate."""
    if not APPLE_ROOT_CA_PATH.exists():
        raise JWSVerificationError(
            f"Apple Root CA certificate not found at {APPLE_ROOT_CA_PATH}"
        )

    with open(APPLE_ROOT_CA_PATH, "rb") as f:
        cert_data = f.read()

    # Try DER format first, then PEM
    try:
        return load_der_x509_certificate(cert_data, default_backend())
    except Exception:
        try:
            return load_pem_x509_certificate(cert_data, default_backend())
        except Exception as e:
            raise JWSVerificationError(f"Failed to load Apple Root CA: {e}")


def _base64url_decode(data: str) -> bytes:
    """Decode base64url (URL-safe base64 without padding)."""
    # Add padding if needed
    padding = 4 - len(data) % 4
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data)


def _parse_jws(jws: str) -> tuple[dict, dict, bytes]:
    """
    Parse JWS into header, payload, and signature.
    Returns (header_dict, payload_dict, signature_bytes).
    Does NOT verify - just parses.
    """
    parts = jws.split(".")
    if len(parts) != 3:
        raise JWSVerificationError("Invalid JWS format: expected 3 parts")

    try:
        header = json.loads(_base64url_decode(parts[0]))
        payload = json.loads(_base64url_decode(parts[1]))
        signature = _base64url_decode(parts[2])
    except Exception as e:
        raise JWSVerificationError(f"Failed to parse JWS: {e}")

    return header, payload, signature


def _verify_certificate_chain(x5c_chain: list[str], apple_root: x509.Certificate) -> x509.Certificate:
    """
    Verify the x5c certificate chain against Apple Root CA.
    Returns the leaf certificate (for signature verification).

    The chain should be: [leaf, intermediate, ..., root]
    We verify each cert is signed by its parent, up to Apple Root.
    """
    if not x5c_chain:
        raise JWSVerificationError("Empty x5c certificate chain")

    # Decode all certificates
    certs = []
    for cert_b64 in x5c_chain:
        try:
            cert_der = base64.b64decode(cert_b64)
            cert = load_der_x509_certificate(cert_der, default_backend())
            certs.append(cert)
        except Exception as e:
            raise JWSVerificationError(f"Failed to decode certificate in chain: {e}")

    # Verify chain: each cert should be signed by the next one
    for i in range(len(certs) - 1):
        try:
            # Verify cert[i] is signed by cert[i+1]
            issuer_public_key = certs[i + 1].public_key()
            certs[i].verify_directly_issued_by(certs[i + 1])
        except Exception as e:
            raise JWSVerificationError(f"Certificate chain verification failed at position {i}: {e}")

    # Verify the last cert in chain is signed by Apple Root CA
    # Or the last cert IS the Apple Root CA
    last_cert = certs[-1]

    # Check if last cert is the root itself
    if last_cert.subject == apple_root.subject:
        # Verify it's self-signed correctly
        try:
            last_cert.verify_directly_issued_by(apple_root)
        except Exception as e:
            raise JWSVerificationError(f"Root certificate verification failed: {e}")
    else:
        # Last cert should be signed by Apple Root
        try:
            last_cert.verify_directly_issued_by(apple_root)
        except Exception as e:
            raise JWSVerificationError(f"Certificate chain does not terminate at Apple Root CA: {e}")

    # Return the leaf certificate for signature verification
    return certs[0]


def _verify_jws_signature(jws: str, leaf_cert: x509.Certificate) -> None:
    """
    Verify the JWS signature using the leaf certificate's public key.

    IMPORTANT: JWS uses JOSE format for ECDSA signatures (R || S raw bytes),
    but cryptography's verify() expects DER-encoded ASN.1 format.
    We must convert JOSE → DER before verification.

    SECURITY: Signature length is derived from the curve's key_size, not assumed.
    """
    parts = jws.split(".")
    if len(parts) != 3:
        raise JWSVerificationError("Invalid JWS format")

    # The signature is over header.payload (the first two parts)
    signed_data = f"{parts[0]}.{parts[1]}".encode("utf-8")
    jose_signature = _base64url_decode(parts[2])

    public_key = leaf_cert.public_key()

    if not isinstance(public_key, ec.EllipticCurvePublicKey):
        raise JWSVerificationError("Expected EC public key for ES256")

    try:
        # Derive expected signature length from curve's key_size
        # key_size is in bits (e.g., 256 for P-256), convert to bytes
        # JOSE signature = R || S, each is key_size // 8 bytes
        key_size_bits = public_key.curve.key_size
        coord_size = key_size_bits // 8  # 32 bytes for P-256
        expected_sig_len = coord_size * 2  # 64 bytes for P-256

        if len(jose_signature) != expected_sig_len:
            raise JWSVerificationError(
                f"Invalid JOSE signature length: got {len(jose_signature)}, "
                f"expected {expected_sig_len} for {key_size_bits}-bit curve"
            )

        # Split signature by curve-derived coordinate size
        r = int.from_bytes(jose_signature[:coord_size], "big")
        s = int.from_bytes(jose_signature[coord_size:], "big")

        # Encode as DER (ASN.1 format that cryptography expects)
        der_signature = encode_dss_signature(r, s)

        # ES256 uses SHA256 with ECDSA
        public_key.verify(der_signature, signed_data, ec.ECDSA(hashes.SHA256()))
    except InvalidSignature:
        raise JWSVerificationError("Invalid JWS signature")
    except JWSVerificationError:
        raise
    except Exception as e:
        raise JWSVerificationError(f"Signature verification failed: {e}")


def _parse_apple_timestamp(timestamp_ms: int) -> datetime:
    """Parse Apple timestamp (milliseconds since epoch) to datetime."""
    return datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc)


def verify_storekit_transaction_jws(jws: str) -> VerifiedTransaction:
    """
    Verify a StoreKit 2 signed transaction JWS and return the verified payload.

    This performs:
    1. JWS parsing
    2. Certificate chain validation against Apple Root CA - G3
    3. ES256 signature verification
    4. Payload extraction

    Raises JWSVerificationError if verification fails.
    """
    # Load Apple Root CA
    apple_root = _load_apple_root_ca()

    # Parse JWS (don't trust payload yet)
    header, payload, signature = _parse_jws(jws)

    # Verify algorithm is ES256
    if header.get("alg") != "ES256":
        raise JWSVerificationError(f"Unexpected algorithm: {header.get('alg')}, expected ES256")

    # Extract x5c certificate chain
    x5c_chain = header.get("x5c")
    if not x5c_chain:
        raise JWSVerificationError("Missing x5c certificate chain in JWS header")

    # Verify certificate chain and get leaf cert
    leaf_cert = _verify_certificate_chain(x5c_chain, apple_root)

    # Verify JWS signature
    _verify_jws_signature(jws, leaf_cert)

    # NOW we can trust the payload
    # Extract transaction data
    try:
        transaction = VerifiedTransaction(
            transaction_id=str(payload.get("transactionId", "")),
            original_transaction_id=str(payload.get("originalTransactionId", payload.get("transactionId", ""))),
            product_id=payload.get("productId", ""),
            bundle_id=payload.get("bundleId", ""),
            purchase_date=_parse_apple_timestamp(payload["purchaseDate"]) if "purchaseDate" in payload else None,
            expiration_date=_parse_apple_timestamp(payload["expiresDate"]) if "expiresDate" in payload else None,
            revocation_date=_parse_apple_timestamp(payload["revocationDate"]) if "revocationDate" in payload else None,
            is_upgraded=payload.get("isUpgraded", False),
            environment=payload.get("environment", "Production"),
            raw_payload=payload,
        )
    except Exception as e:
        raise JWSVerificationError(f"Failed to extract transaction data: {e}")

    return transaction


def validate_transaction_for_activation(transaction: VerifiedTransaction) -> tuple[bool, str]:
    """
    Validate a verified transaction for subscription activation.

    Checks:
    1. Bundle ID matches our app
    2. Product ID is allowed
    3. Subscription is not revoked
    4. Subscription is not expired

    Returns (is_valid, error_message).
    """
    # Check bundle ID
    if transaction.bundle_id != EXPECTED_BUNDLE_ID:
        return False, f"Invalid bundle ID: {transaction.bundle_id}"

    # Check product ID
    if transaction.product_id not in ALLOWED_PRODUCT_IDS:
        return False, f"Invalid product ID: {transaction.product_id}"

    # Check revocation
    if transaction.revocation_date is not None:
        return False, f"Subscription was revoked on {transaction.revocation_date}"

    # Check expiration
    if transaction.expiration_date is None:
        return False, "No expiration date in transaction"

    now = datetime.now(timezone.utc)
    if transaction.expiration_date <= now:
        return False, f"Subscription expired on {transaction.expiration_date}"

    return True, ""


def verify_and_validate_jws(jws: str) -> tuple[Optional[VerifiedTransaction], str]:
    """
    Convenience function: verify JWS and validate for activation.

    Returns (transaction, error_message).
    If error_message is empty, transaction is valid and can be used.
    """
    try:
        transaction = verify_storekit_transaction_jws(jws)
    except JWSVerificationError as e:
        return None, f"JWS verification failed: {e}"

    is_valid, error = validate_transaction_for_activation(transaction)
    if not is_valid:
        return transaction, error

    return transaction, ""
