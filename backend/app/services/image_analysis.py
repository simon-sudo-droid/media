"""Real, dependency-light image analysis for the Slide Analyzer.

Decodes an uploaded image (data URL or raw base64) and computes objective
metrics with Pillow — dimensions, aspect ratio, brightness, contrast,
colorfulness and a small dominant-colour palette. These power genuine,
image-derived feedback even when no vision LLM key is configured.
"""
from __future__ import annotations

import base64
import binascii
import io
from math import gcd


def _decode(image_base64: str) -> bytes:
    """Accept a data URL (data:image/png;base64,...) or raw base64."""
    data = image_base64.strip()
    if data.startswith("data:"):
        _, _, data = data.partition(",")
    try:
        return base64.b64decode(data, validate=False)
    except (binascii.Error, ValueError) as exc:  # pragma: no cover
        raise ValueError("Invalid base64 image data") from exc


def _aspect_ratio(w: int, h: int) -> str:
    if not w or not h:
        return "—"
    g = gcd(w, h) or 1
    rw, rh = w // g, h // g
    # Collapse awkward ratios to the nearest common one for readability.
    common = {
        (16, 9): "16:9", (9, 16): "9:16", (4, 3): "4:3", (3, 4): "3:4",
        (1, 1): "1:1", (21, 9): "21:9", (3, 2): "3:2", (2, 3): "2:3",
    }
    if (rw, rh) in common:
        return common[(rw, rh)]
    ratio = w / h
    best = min(common, key=lambda c: abs((c[0] / c[1]) - ratio))
    return f"~{common[best]}"


def analyze_image(image_base64: str) -> dict:
    """Return objective metrics for the supplied image."""
    from PIL import Image, ImageStat

    raw = _decode(image_base64)
    img = Image.open(io.BytesIO(raw))
    img.load()
    width, height = img.size
    rgb = img.convert("RGB")

    # Brightness (perceived luminance) and contrast (stddev) on a 0-100 scale.
    gray = rgb.convert("L")
    stat = ImageStat.Stat(gray)
    brightness = round(stat.mean[0] / 255 * 100)
    contrast = round(min(stat.stddev[0] / 110 * 100, 100))

    # Colorfulness via Hasler-Süsstrunk metric on a downscaled copy.
    small = rgb.copy()
    small.thumbnail((200, 200))
    px = list(small.getdata())
    n = len(px) or 1
    rg = [abs(r - g) for r, g, b in px]
    yb = [abs((r + g) / 2 - b) for r, g, b in px]
    mean_rg, mean_yb = sum(rg) / n, sum(yb) / n
    std_rg = (sum((x - mean_rg) ** 2 for x in rg) / n) ** 0.5
    std_yb = (sum((x - mean_yb) ** 2 for x in yb) / n) ** 0.5
    colorfulness_raw = (std_rg**2 + std_yb**2) ** 0.5 + 0.3 * (
        mean_rg**2 + mean_yb**2
    ) ** 0.5
    colorfulness = round(min(colorfulness_raw / 110 * 100, 100))

    # Dominant palette via adaptive-palette quantization.
    pal_img = rgb.copy()
    pal_img.thumbnail((120, 120))
    quant = pal_img.quantize(colors=6, method=Image.Quantize.FASTOCTREE)
    palette = quant.getpalette() or []
    counts = sorted(quant.getcolors() or [], reverse=True)
    swatches: list[str] = []
    for _, idx in counts[:5]:
        r, g, b = palette[idx * 3 : idx * 3 + 3]
        swatches.append(f"#{r:02x}{g:02x}{b:02x}")

    orientation = (
        "landscape" if width > height else "portrait" if height > width else "square"
    )

    return {
        "width": width,
        "height": height,
        "aspect_ratio": _aspect_ratio(width, height),
        "orientation": orientation,
        "megapixels": round(width * height / 1_000_000, 2),
        "brightness": brightness,
        "contrast": contrast,
        "colorfulness": colorfulness,
        "palette": swatches,
    }
