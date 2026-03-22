def adjust_risk(original_risk, exposure_level):
    if original_risk == "UNKNOWN":
        return "UNKNOWN"

    if exposure_level == "EXTERNAL_CONFIRMED":
        return original_risk

    if exposure_level == "EXTERNAL_POTENTIAL":
        if original_risk == "CRITICAL":
            return "HIGH"
        return original_risk

    if exposure_level == "LOCAL":
        if original_risk == "CRITICAL":
            return "HIGH"
        if original_risk == "HIGH":
            return "MEDIUM"

    if exposure_level == "CONTAINER":
        return "LOW"

    return original_risk
