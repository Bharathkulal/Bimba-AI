import os
import re
import sys
import importlib

# Find all python files
imports = set()
for root, dirs, files in os.walk("d:/Bimba AI/backend/app"):
    for file in files:
        if file.endswith(".py"):
            with open(os.path.join(root, file), "r", encoding="utf-8") as f:
                content = f.read()
                # Find standard imports
                for match in re.finditer(r"^(?:import|from)\s+([a-zA-Z0-9_]+)", content, re.MULTILINE):
                    imports.add(match.group(1))

print("Found top-level imports in codebase:", imports)

stdlib = sys.builtin_module_names
missing = []
for imp in sorted(imports):
    if imp in stdlib or imp == "app":
        continue
    try:
        importlib.import_module(imp)
        print(f"  [OK] {imp}")
    except ModuleNotFoundError:
        print(f"  [MISSING] {imp}")
        missing.append(imp)
    except Exception as e:
        print(f"  [ERROR] {imp}: {e}")

if missing:
    print(f"\nMissing packages detected: {missing}")
else:
    print("\nAll required packages are successfully installed!")
