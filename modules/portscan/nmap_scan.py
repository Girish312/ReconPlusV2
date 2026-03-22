import nmap

def run_nmap_scan(host):

    scanner = nmap.PortScanner()

    scanner.scan(host,arguments="-sV")

    results=[]

    for h in scanner.all_hosts():

        for proto in scanner[h].all_protocols():

            ports=scanner[h][proto].keys()

            for port in ports:

                service=scanner[h][proto][port]['name']

                results.append({
                    "port":port,
                    "service":service
                })

    return results