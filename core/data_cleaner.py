def deduplicate_services(services):
    seen = set()
    cleaned = []

    for s in services:
        key = (s["protocol"], s["port"], s["service"])
        if key not in seen:
            seen.add(key)
            cleaned.append(s)

    return cleaned
