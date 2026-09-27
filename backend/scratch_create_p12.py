import os

def create_structure():
    dirs = [
        "ml/models/trained",
        "ml/models/metadata",
        "ml/models/metrics",
        "ml/training",
        "ml/evaluation",
        "ml/inference"
    ]
    for d in dirs:
        os.makedirs(os.path.join("d:\\Bimba AI\\backend", d), exist_ok=True)
        init_file = os.path.join("d:\\Bimba AI\\backend", d, "__init__.py")
        if not os.path.exists(init_file) and not d.startswith("ml/models/"):
            with open(init_file, "w") as f:
                f.write("")

if __name__ == "__main__":
    create_structure()
