from datetime import datetime, timezone
import uuid

def generate_scan_metadata():
    return {
        "scan_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "scanner_version": "ReconGuard v0.1"
    }
