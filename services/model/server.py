"""Loopback CPU inference for SocioLine. Converts text and images to a bounded spec."""
import argparse
import base64
import io
import json
import re
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps
from tokenizers import Tokenizer

LABELS = {
    "type": {"village": "a rural village settlement", "campus": "a university campus for learning", "city": "a dense urban city center"},
    "biome": {"tropical": "humid tropical landscape with lush palm trees", "temperate": "temperate parkland with deciduous trees", "highland": "cool alpine highlands"},
    "terrain": {"rolling": "gently rolling green hills", "mountain": "steep mountains and rocky slopes", "plain": "flat plains and level open ground"},
    "features": {"school": "a school for students", "market": "a marketplace with vendors", "library": "a library with bookshelves", "farm": "a farm with rows of crops", "community": "a community center for neighbors", "river": "a winding river", "lake": "a lake surrounded by land"},
}
TRANSLATE = {
    "desa":"village", "kampung":"village", "kota":"city", "kampus":"campus", "tropis":"tropical",
    "datar":"flat", "pegunungan":"mountains", "bukit":"hills", "sekolah":"school", "pasar":"market",
    "perpustakaan":"library", "kebun":"farm", "sawah":"farm", "komunitas":"community", "sungai":"river",
    "danau":"lake", "dengan":"with", "dan":"and",
}
# Explicit features survive semantic ranking when a prompt names several facilities.
FEATURE_TERMS = {
    "school": {"school","schools","sekolah"},
    "market": {"market","markets","pasar"},
    "library": {"library","libraries","perpustakaan"},
    "farm": {"farm","farms","farmland","kebun","pertanian","sawah"},
    "community": {"community","komunitas"},
    "river": {"river","rivers","sungai"},
    "lake": {"lake","lakes","danau"},
}

def unit(rows):
    return rows / np.maximum(np.linalg.norm(rows, axis=-1, keepdims=True), 1e-9)

class RegionModel:
    def __init__(self, directory):
        options = ort.SessionOptions()
        options.intra_op_num_threads = 2
        options.inter_op_num_threads = 1
        def load(name):
            return ort.InferenceSession(str(directory / f"{name}_model_quantized.onnx"), options,
                                        providers=["CPUExecutionProvider"])
        self.text = load("text")
        self.vision = load("vision")
        self.tokenizer = Tokenizer.from_file(str(directory / "tokenizer.json"))
        self.tokenizer.enable_truncation(max_length=77)
        self.tokenizer.enable_padding(pad_id=49407, pad_token="<|endoftext|>")
        self.prototypes = {k: self.encode(list(v.values())) for k, v in LABELS.items()}

    def encode(self, descriptions):
        batch = self.tokenizer.encode_batch(descriptions)
        values = {"input_ids": np.asarray([b.ids for b in batch], dtype=np.int64),
                  "attention_mask": np.asarray([b.attention_mask for b in batch], dtype=np.int64)}
        inputs = {arg.name: values[arg.name] for arg in self.text.get_inputs()}
        return unit(self.text.run(["text_embeds"], inputs)[0])

    def describe(self, content):
        prompt = content if isinstance(content, str) else content[0]["text"]
        words = re.findall(r"[^\W_]+", prompt.lower())
        query = self.encode([" ".join(TRANSLATE.get(word, word) for word in words)])[0]
        if isinstance(content, list):
            raw = base64.b64decode(content[1]["image_url"]["url"].split(",", 1)[1], validate=True)
            with Image.open(io.BytesIO(raw)) as source:
                if source.width * source.height > 4_000_000:
                    raise ValueError("Image too large")
                im = ImageOps.fit(source.convert("RGB"), (224,224), method=Image.Resampling.BICUBIC)
                arr = np.asarray(im, dtype=np.float32) / 255
            mean = np.array([0.48145466,0.4578275,0.40821073], dtype=np.float32)
            std = np.array([0.26862954,0.26130258,0.27577711], dtype=np.float32)
            pixels = ((arr - mean) / std).transpose(2,0,1)[None,...]
            image_query = unit(self.vision.run(["image_embeds"], {"pixel_values": pixels})[0])[0]
            query = unit(0.78 * image_query + 0.22 * query)
        spec = {}
        for group, matrix in self.prototypes.items():
            keys = list(LABELS[group])
            order = np.argsort(-(matrix @ query))
            spec[group] = [keys[i] for i in order[:3]] if group == "features" else keys[order[0]]
        explicit = [kind for kind, terms in FEATURE_TERMS.items() if not terms.isdisjoint(words)]
        if explicit:
            spec["features"] = (explicit + [k for k in spec["features"] if k not in explicit][:1])[:7]
        terms = set(TRANSLATE.get(word, word) for word in words)
        overrides = {
            "type": {"village": {"village"}, "campus": {"campus"}, "city": {"city"}},
            "biome": {"tropical": {"tropical"}, "temperate": {"temperate"}, "highland": {"highlands", "alpine"}},
            "terrain": {"mountain": {"mountain", "mountains", "mountainous", "gunung"}, "plain": {"flat", "plain"}, "rolling": {"hills", "rolling"}},
        }
        for field, options in overrides.items():
            explicit_choices = [choice for choice, keywords in options.items() if terms & keywords]
            if len(explicit_choices) == 1:
                spec[field] = explicit_choices[0]
        noun = {"city":"Kota", "campus":"Kampus", "village":"Desa"}[spec["type"]]
        biome = {"temperate":"Hijau", "tropical":"Tropis", "highland":"Pegunungan"}[spec["biome"]]
        return dict(name=f"{noun} {biome}", **spec)

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def do_POST(self):
        if self.path != "/v1/chat/completions":
            self.send_error(404)
            return
        try:
            size = int(self.headers.get("Content-Length", 0))
            if not 0 < size <= 1_000_000:
                raise ValueError("Input size")
            message = json.loads(self.rfile.read(size))["messages"][-1]
            spec = self.server.model.describe(message["content"])
            result = json.dumps({"choices":[{"message":{"content":json.dumps(spec)}}]}).encode()
        except (ValueError, TypeError, IndexError, KeyError, OSError):
            self.send_error(400, "Invalid model input")
            return
        self.send_response(200)
        self.send_header("Content-Type","application/json")
        self.send_header("Content-Length",str(len(result)))
        self.end_headers()
        self.wfile.write(result)

if __name__ == "__main__":
    cli = argparse.ArgumentParser()
    cli.add_argument("--directory", type=Path, default=Path(".world-data/models/clip"))
    cli.add_argument("--port", type=int, default=4120)
    args = cli.parse_args()
    model = RegionModel(args.directory)
    with HTTPServer(("127.0.0.1", args.port), Handler) as server:
        server.model = model
        print(f"SocioLine CLIP CPU ready on loopback port {args.port}", flush=True)
        server.serve_forever()
