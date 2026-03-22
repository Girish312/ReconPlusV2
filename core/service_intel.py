SERVICE_MAP = {
    21: {"name": "FTP", "risk": "HIGH"},
    22: {"name": "SSH", "risk": "MEDIUM"},
    23: {"name": "TELNET", "risk": "CRITICAL"},
    25: {"name": "SMTP", "risk": "MEDIUM"},
    53: {"name": "DNS", "risk": "LOW"},
    80: {"name": "HTTP", "risk": "MEDIUM"},
    110: {"name": "POP3", "risk": "HIGH"},
    139: {"name": "SMB", "risk": "HIGH"},
    143: {"name": "IMAP", "risk": "HIGH"},
    443: {"name": "HTTPS", "risk": "LOW"},
    3306: {"name": "MySQL", "risk": "HIGH"},
    5432: {"name": "PostgreSQL", "risk": "HIGH"},
    6379: {"name": "Redis", "risk": "CRITICAL"},
    27017: {"name": "MongoDB", "risk": "CRITICAL"}
}
