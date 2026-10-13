#!/usr/bin/env python3
"""Read-only bounded measurements. Never print Docker environments or raw logs."""
import datetime
import json
import os
import pathlib
import shutil
import statistics
import subprocess
import time

def command(*args, include_stderr=False):
    return subprocess.check_output(args, text=True, stderr=subprocess.STDOUT if include_stderr else subprocess.DEVNULL, timeout=15)

def percentile(values, fraction):
    if not values:
        return None
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, int((len(ordered) - 1) * fraction))]

def http_summary(rows):
    durations = [item["durationMs"] for item in rows]
    return {"sampleCount": len(rows), "p50Ms": percentile(durations, .5), "p95Ms": percentile(durations, .95), "p99Ms": percentile(durations, .99), "serverErrorRate": sum(item["status"] >= 500 for item in rows) / len(rows) if rows else None, "clientErrorCount": sum(400 <= item["status"] < 500 for item in rows)}

def main():
    memory = {line.split(":")[0]: int(line.split()[1]) * 1024 for line in pathlib.Path("/proc/meminfo").read_text().splitlines() if line.split()[1].isdigit()}
    disk = shutil.disk_usage(pathlib.Path.home())
    report = {"timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(), "host": {"cpuLoad1m": os.getloadavg()[0], "cpuCount": os.cpu_count(), "memoryTotalBytes": memory["MemTotal"], "memoryAvailableBytes": memory["MemAvailable"], "diskFreeBytes": disk.free, "diskUsedPercent": round(disk.used / disk.total * 100, 2)}, "containers": []}
    for name in command("docker", "ps", "--filter", "label=com.docker.compose.project=bastak-school", "--format", "{{.Names}}").splitlines():
        inspect = json.loads(command("docker", "inspect", name))[0]
        stats = json.loads(command("docker", "stats", "--no-stream", "--format", "{{json .}}", name))
        entry = {"name": name, "imageId": inspect["Image"], "restartCount": inspect["RestartCount"], "health": inspect["State"].get("Health", {}).get("Status", "unknown"), "cpuPercent": stats["CPUPerc"], "memoryUsage": stats["MemUsage"]}
        if "backend-v2" in name:
            http, slow = [], []
            # Tail is capped; only allowlisted aggregate values leave this process.
            for line in command("docker", "logs", "--since", "5m", "--tail", "5000", name, include_stderr=True).splitlines():
                try:
                    item = json.loads(line)
                except (ValueError, TypeError):
                    continue
                if item.get("event") == "http.request.completed" and isinstance(item.get("durationMs"), (float, int)) and isinstance(item.get("status"), int):
                    if item.get("route") not in ("/health", "/ready", "/api/v2/events"):
                        http.append(item)
                if item.get("event") == "db.query.slow" and isinstance(item.get("durationMs"), (float, int)):
                    slow.append(item["durationMs"])
            entry["http5m"] = http_summary(http)
            families = {}
            for item in http:
                route = item.get("route", "")
                family = next((name for name in ("students", "attendance", "dashboard", "auth", "classes", "dormitory", "chat") if f"/{name}" in route), "other")
                families.setdefault(family, []).append(item)
            entry["httpByFamily5m"] = {family: http_summary(rows) for family, rows in families.items()}
            entry["database5m"] = {"slowQueryCount": len(slow), "maxSlowQueryMs": max(slow) if slow else None, "thresholdMs": 100}
            entry["logSampleLimit"] = 5000
        report["containers"].append(entry)
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
