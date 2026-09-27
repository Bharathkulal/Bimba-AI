import os

def create_structure():
    dirs = [
        "ml/data/raw",
        "ml/data/interim",
        "ml/data/processed",
        "ml/preprocessing",
        "ml/features",
        "ml/datasets",
        "ml/schemas"
    ]
    for d in dirs:
        os.makedirs(os.path.join("d:\\Bimba AI\\backend", d), exist_ok=True)
        init_file = os.path.join("d:\\Bimba AI\\backend", d, "__init__.py")
        if not os.path.exists(init_file) and not d.startswith("ml/data"):
            with open(init_file, "w") as f:
                f.write("")

if __name__ == "__main__":
    create_structure()
