try:
    from app.main import app
    print("Compilation check: SUCCESS. FastAPI app loaded cleanly.")
except Exception as e:
    import traceback
    print("Compilation check: FAILED.")
    traceback.print_exc()
