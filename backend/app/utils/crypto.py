import os
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
from app.core.config import settings

def get_cipher_key() -> bytes:
    # Use SECRET_KEY to derive a 32-byte key
    return hashlib.sha256(settings.SECRET_KEY.encode('utf-8')).digest()

def encrypt_key(plain_text: str) -> str:
    if not plain_text:
        return ""
    key = get_cipher_key()
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(plain_text.encode('utf-8')) + padder.finalize()
    
    encrypted = encryptor.update(padded_data) + encryptor.finalize()
    # Prepend IV to the encrypted text so we can decrypt it later
    return base64.b64encode(iv + encrypted).decode('utf-8')

def decrypt_key(cipher_text: str) -> str:
    if not cipher_text:
        return ""
    try:
        key = get_cipher_key()
        raw_data = base64.b64decode(cipher_text.encode('utf-8'))
        if len(raw_data) < 16:
            return "Decryption Error"
        iv = raw_data[:16]
        encrypted = raw_data[16:]
        
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        
        decrypted_padded = decryptor.update(encrypted) + decryptor.finalize()
        
        unpadder = padding.PKCS7(128).unpadder()
        decrypted = unpadder.update(decrypted_padded) + unpadder.finalize()
        return decrypted.decode('utf-8')
    except Exception:
        return "Decryption Error"
