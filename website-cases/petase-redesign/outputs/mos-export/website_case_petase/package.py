#!/usr/bin/env python3
"""Package the case directory into /workspace/website_case_petase.zip."""
import zipfile, pathlib, hashlib

root = pathlib.Path("/workspace/website_case_petase")
out = pathlib.Path("/workspace/website_case_petase.zip")
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for p in sorted(root.rglob("*")):
        if p.is_file():
            z.write(p, p.relative_to(root.parent))
size = out.stat().st_size
sha = hashlib.sha256(out.read_bytes()).hexdigest()
with zipfile.ZipFile(out) as z:
    n = len(z.namelist())
print(f"{out}  {size} bytes  {n} files  sha256 {sha}")
