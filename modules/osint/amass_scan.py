import subprocess

def run_amass(domain):

    cmd = ["amass","enum","-passive","-d",domain]

    result = subprocess.run(cmd,capture_output=True,text=True)

    return result.stdout.splitlines()