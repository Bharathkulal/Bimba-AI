import os
import ast

def audit_backend():
    print("========================================")
    print("STARTING BIMBA AI BACKEND STATIC AUDIT")
    print("========================================")
    
    app_dir = "../app"
    issues = {
        "CRITICAL": [],
        "HIGH": [],
        "MEDIUM": [],
        "LOW": [],
        "INFORMATIONAL": []
    }
    
    for root, dirs, files in os.walk(app_dir):
        for file in files:
            if not file.endswith(".py"):
                continue
            path = os.path.join(root, file)
            relative_path = os.path.relpath(path, app_dir)
            
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
                
            try:
                tree = ast.parse(content)
            except SyntaxError as se:
                issues["CRITICAL"].append({
                    "file": relative_path,
                    "line": se.lineno,
                    "msg": f"Syntax Error: {se.msg}"
                })
                continue
                
            # Perform AST checks
            for node in ast.walk(tree):
                # 1. Check for requests (sync) inside async def
                if isinstance(node, ast.AsyncFunctionDef):
                    for subnode in ast.walk(node):
                        if isinstance(subnode, ast.Call):
                            func_name = ""
                            if isinstance(subnode.func, ast.Attribute):
                                if isinstance(subnode.func.value, ast.Name):
                                    func_name = f"{subnode.func.value.id}.{subnode.func.attr}"
                            elif isinstance(subnode.func, ast.Name):
                                func_name = subnode.func.id
                            
                            if func_name in ["requests.get", "requests.post", "requests.put", "requests.delete", "requests.request"]:
                                issues["MEDIUM"].append({
                                    "file": relative_path,
                                    "line": subnode.lineno,
                                    "msg": f"Blocking sync call '{func_name}' inside async function '{node.name}'."
                                })
                            if func_name == "time.sleep":
                                issues["MEDIUM"].append({
                                    "file": relative_path,
                                    "line": subnode.lineno,
                                    "msg": f"Blocking time.sleep call inside async function '{node.name}'."
                                })
                
                # 2. Check for potential hardcoded API keys
                if isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name):
                            var_name = target.id.upper()
                            if "API_KEY" in var_name or "SECRET" in var_name or "PASSWORD" in var_name:
                                if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                                    val = node.value.value
                                    if len(val) > 10 and not val.startswith("VITE_") and not val.startswith("${") and not val.startswith("super_secret"):
                                        issues["HIGH"].append({
                                            "file": relative_path,
                                            "line": node.lineno,
                                            "msg": f"Possible hardcoded secret in '{target.id}': '{val[:5]}...'"
                                        })
            
            # Text based quick checks
            lines = content.splitlines()
            for idx, line in enumerate(lines):
                line_num = idx + 1
                # Check for prints instead of logging
                if "print(" in line and "test" not in relative_path and "seed" not in relative_path and "debug" not in relative_path:
                    # Exclude Step headers and simple prints
                    if not any(header in line for header in ["===", "MongoDB", "Insert Result", "Document before"]):
                        issues["LOW"].append({
                            "file": relative_path,
                            "line": line_num,
                            "msg": f"Console print statement: {line.strip()}"
                        })
                # Check for os.environ without getenv default values
                if "os.environ[" in line:
                    issues["LOW"].append({
                        "file": relative_path,
                        "line": line_num,
                        "msg": f"Direct dict environment access (throws KeyError if missing): {line.strip()}"
                    })
                # Check for localhost hardcoding
                if "http://localhost:" in line and "config.py" not in relative_path and "main.py" not in relative_path and "test" not in relative_path:
                    issues["MEDIUM"].append({
                        "file": relative_path,
                        "line": line_num,
                        "msg": f"Hardcoded localhost url: {line.strip()}"
                    })
                    
    # Print issues
    for level, list_issues in issues.items():
        print(f"\n--- {level} ISSUES ({len(list_issues)}) ---")
        for iss in list_issues[:20]:  # limit output to avoid overflow
            print(f"File: {iss['file']} | Line: {iss['line']} | {iss['msg']}")

if __name__ == "__main__":
    audit_backend()
