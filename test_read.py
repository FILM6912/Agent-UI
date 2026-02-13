import os

file_path = r"d:\github\Agent-UI\server\uploads\8f80dda1-dbc7-4264-aacc-45063e40f28e\generated_test.md"

try:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    print(f"Content: {content}")
except UnicodeDecodeError as e:
    print(f"Error: {e}")
except Exception as e:
    print(f"Other Error: {e}")
