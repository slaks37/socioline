"""Download pinned CLIP weights. No prompts or user images leave the computer."""
import argparse
import hashlib
import os
import shutil
import tempfile
from pathlib import Path
from urllib.request import urlopen

REVISION = "6b7c523703ae26e39be4b03774966f8571c7f523"
BASE = f"https://huggingface.co/Xenova/clip-vit-base-patch32/resolve/{REVISION}/"
FILES = {
    "onnx/text_model_quantized.onnx": "73baab855d406190da9faa498cfedf65f15cf309f4cc7385b7b032e6d08e5c3a",
    "onnx/vision_model_quantized.onnx": "583fd1110a514667812fee7d684952aaf82a99b959760c8d7dca7e0ab9839299",
    "tokenizer.json": "f7f3b7af117d467b58374797691a6438d3e6b9e9cef800dfd5dced7f697a90cd",
}

def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()

def download(directory):
    directory.mkdir(parents=True, exist_ok=True)
    for source, expected in FILES.items():
        target = directory / Path(source).name
        if target.is_file() and digest(target) == expected:
            continue
        with tempfile.NamedTemporaryFile(dir=directory, delete=False) as temp:
            name = Path(temp.name)
        try:
            with urlopen(BASE + source + "?download=true", timeout=90) as response, name.open("wb") as output:
                shutil.copyfileobj(response, output)
            if digest(name) != expected:
                raise ValueError(f"Checksum mismatch for {source}")
            os.replace(name, target)
        finally:
            name.unlink(missing_ok=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--directory", type=Path, default=Path(".world-data/models/clip"))
    download(parser.parse_args().directory)
