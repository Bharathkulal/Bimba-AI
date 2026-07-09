import base64
import hashlib
from app.core.config import settings

def get_cipher_key() -> bytes:
    # Use SECRET_KEY to derive a 32-byte key
    return hashlib.sha256(settings.SECRET_KEY.encode()).digest()

def encrypt_key(plain_text: str) -> str:
    if not plain_text:
        return ""
    key = get_cipher_key()
    plain_bytes = plain_text.encode('utf-8')
    # Simple secure XOR stream cipher using derived key
    encrypted_bytes = bytearray()
    for i, byte in enumerate(plain_bytes):
        key_byte = key[i % len(key)]
        encrypted_bytes.append(byte ^ key_byte)
    return base64.b64encode(encrypted_bytes).decode('utf-8')

def decrypt_key(cipher_text: str) -> str:
    if not cipher_text:
        return ""
    try:
        key = get_cipher_key()
        encrypted_bytes = base64.b64decode(cipher_text.encode('utf-8'))
        decrypted_bytes = bytearray()
        for i, byte in enumerate(encrypted_bytes):
            key_byte = key[i % len(key)]
            decrypted_bytes.append(byte ^ key_byte)
        return decrypted_bytes.decode('utf-8')
    except Exception:
        return "Decryption Error"
