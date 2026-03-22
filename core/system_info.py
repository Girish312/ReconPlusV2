import platform
import socket
import getpass
import os

def get_system_info():
    return {
        "os": platform.system(),
        "os_version": platform.version(),
        "kernel": platform.release(),
        "architecture": platform.machine(),
        "hostname": socket.gethostname(),
        "current_user": getpass.getuser()
    }
