def _normalize(text):
    return " ".join((text or "").lower().replace("-", " ").replace("_", " ").split())


def get_remedy(vulnerability_name):
    name = _normalize(vulnerability_name)

    # Exact/common findings
    exact_remedies = {
        "sql injection": (
            "Use parameterized queries or prepared statements. "
            "Validate and sanitize all user inputs."
        ),
        "cross site scripting": (
            "Sanitize user input and encode output properly. "
            "Use Content Security Policy (CSP)."
        ),
        "open redirect": (
            "Avoid user-controlled redirects. "
            "Implement allowlists for redirect destinations."
        ),
        "exposed git repository": (
            "Restrict access to .git directories and remove them from production servers."
        ),
        "directory listing": "Disable directory listing in web server configuration.",
        "default credentials": (
            "Change default credentials immediately and enforce strong password policies."
        ),
        "sensitive information exposure": (
            "Remove sensitive information from responses and restrict debug outputs."
        ),
        "server version disclosure": (
            "Hide server version headers in web server configuration."
        ),
    }

    if name in exact_remedies:
        return exact_remedies[name]

    # Keyword-based matching for nuclei template names.
    keyword_rules = [
        (
            ("mod_negotiation", "pseudo directory listing"),
            "Disable MultiViews/auto-negotiation where not required and turn off directory listing in Apache (Options -Indexes)."
        ),
        (
            ("terrapin", "cve 2023 48795", "openssh terrapin attack"),
            "Upgrade OpenSSH to a patched release and prioritize modern ciphers/MACs; disable vulnerable cipher/MAC combinations where possible."
        ),
        (
            ("diffie hellman modulus", "1024 bits"),
            "Regenerate stronger DH parameters (>=2048 bits), remove weak groups, and prefer ECDHE-based key exchange."
        ),
        (
            ("cbc mode ciphers", "cbc"),
            "Disable CBC ciphers in SSH configuration and allow only modern AEAD ciphers (for example chacha20-poly1305, aes-gcm)."
        ),
        (
            ("weak mac algorithms", "hmac"),
            "Disable weak MACs (for example MD5/SHA1 variants where applicable) and keep only strong SHA-2 or AEAD-integrated options."
        ),
        (
            ("weak key exchange", "kex", "key exchange algorithms"),
            "Restrict SSH key exchange to strong algorithms (curve25519/ecdh-sha2) and remove legacy DH groups from sshd_config."
        ),
        (
            ("weak algorithms supported",),
            "Harden SSH by removing deprecated ciphers, MACs, and key-exchange algorithms; retain only modern, vetted cryptographic suites."
        ),
        (
            ("ssh",),
            "Review SSH hardening baseline: disable legacy crypto, enforce key-based auth, and keep OpenSSH updated."
        ),
    ]

    for keywords, remedy in keyword_rules:
        if any(keyword in name for keyword in keywords):
            return remedy

    return "Review the vulnerability and apply appropriate security hardening."