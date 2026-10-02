import hashlib
import secrets


def hash_password(password):
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 600000)
    return salt + "$" + hashed.hex()


def check_password(password, stored):
    # Google accounts have no password
    if "$" not in stored:
        return False
    salt, hashed = stored.split("$")
    new_hash = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 600000)
    return secrets.compare_digest(new_hash.hex(), hashed)
