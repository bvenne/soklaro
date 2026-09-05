"""Create responsive AVIF/WebP derivatives from soklaro's generated masters."""
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source"
OUTPUT = ROOT / "public" / "weather"
KINDS = {
    "clear": (1.14, 1.08, (15, 34, 54, 0)),
    "mostly-clear": (1.06, 1.02, (40, 55, 70, 18)),
    "partly-cloudy": (0.98, 0.93, (48, 62, 74, 28)),
    "overcast": (0.78, 0.66, (58, 68, 75, 60)),
    "fog": (1.10, 0.40, (210, 220, 220, 72)),
    "drizzle": (0.79, 0.72, (45, 66, 78, 58)),
    "rain": (0.68, 0.76, (20, 43, 61, 85)),
    "showers": (0.72, 0.88, (15, 45, 65, 74)),
    "thunderstorm": (0.49, 0.80, (8, 21, 38, 112)),
    "snow": (1.17, 0.42, (220, 228, 230, 74)),
    "snow-showers": (1.03, 0.52, (197, 213, 220, 65)),
    "freezing": (0.91, 0.62, (95, 125, 146, 62)),
    "extreme": (0.44, 0.94, (28, 20, 42, 105)),
    "fallback": (0.80, 0.52, (70, 76, 82, 52)),
}
SIZES = (640, 1280, 1920)

def crop(source: Image.Image, width: int) -> Image.Image:
    height = round(width * 1.25)
    ratio = width / height
    src_ratio = source.width / source.height
    if src_ratio > ratio:
        crop_width = round(source.height * ratio)
        left = (source.width - crop_width) // 2
        source = source.crop((left, 0, left + crop_width, source.height))
    else:
        crop_height = round(source.width / ratio)
        top = max(0, (source.height - crop_height) // 2)
        source = source.crop((0, top, source.width, top + crop_height))
    return source.resize((width, height), Image.Resampling.LANCZOS)

def create_variant(master: Image.Image, kind: str, width: int) -> Image.Image:
    brightness, color, tint = KINDS[kind]
    image = crop(master, width)
    image = ImageEnhance.Brightness(image).enhance(brightness)
    image = ImageEnhance.Color(image).enhance(color)
    if kind == "fog": image = image.filter(ImageFilter.GaussianBlur(max(1, width / 700)))
    overlay = Image.new("RGBA", image.size, tint)
    image = Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")
    if kind in {"rain", "showers", "thunderstorm", "extreme"}:
        draw = ImageDraw.Draw(image, "RGBA")
        step = max(18, width // 34)
        for x in range(-image.height, image.width, step):
            draw.line((x, 0, x + image.height // 5, image.height), fill=(190, 215, 230, 18), width=max(1, width // 900))
    return image

def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for period in ("day", "night"):
        with Image.open(SOURCE / f"master-{period}.png") as opened:
            master = ImageOps.exif_transpose(opened).convert("RGB")
            for kind in KINDS:
                for width in SIZES:
                    image = create_variant(master, kind, width)
                    image.save(OUTPUT / f"{kind}-{period}-{width}.webp", "WEBP", quality=78, method=6)
                    image.save(OUTPUT / f"{kind}-{period}-{width}.avif", "AVIF", quality=55)

if __name__ == "__main__":
    main()
