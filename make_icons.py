from PIL import Image, ImageDraw, ImageFont
import os

def make_icon(size, path):
    img = Image.new("RGB", (size, size), "#AD1457")
    draw = ImageDraw.Draw(img)
    # Rožinis gradientas - paprastas
    for i in range(size):
        ratio = i / size
        r = int(0x6D + (0xAD - 0x6D) * ratio)
        g = int(0x1B + (0x14 - 0x1B) * ratio)
        b = int(0x3B + (0x57 - 0x3B) * ratio)
        draw.line([(0, i), (size, i)], fill=(r, g, b))
    # Širdutė / tekstas
    font_size = size // 3
    try:
        draw.text((size//2, size//2), "💗", fill="white", anchor="mm")
    except:
        draw.ellipse([size//4, size//4, 3*size//4, 3*size//4], fill="white")
    img.save(path)
    print(f"Sukurta: {path}")

os.makedirs("public", exist_ok=True)
make_icon(192, "public/icon-192.png")
make_icon(512, "public/icon-512.png")
