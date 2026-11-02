import os
from PIL import Image, ImageDraw, ImageFont

def generate_icons():
    out_dir = "/home/allen20306/allen/DSA_Tracker/chrome-extension/icons"
    os.makedirs(out_dir, exist_ok=True)

    sizes = [16, 48, 128]

    for size in sizes:
        # Create image with RGBA
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Draw rounded rectangle background (Indigo/Violet)
        pad = max(1, int(size * 0.08))
        draw.rounded_rectangle(
            [(pad, pad), (size - pad, size - pad)],
            radius=int(size * 0.25),
            fill=(79, 70, 229, 255), # Indigo-600 #4f46e5
            outline=(129, 140, 248, 255), # Indigo-400
            width=max(1, int(size * 0.05))
        )

        # Draw inner lightning bolt / "R" shape in cyan/white
        cx, cy = size / 2, size / 2
        s = size / 16

        # Sleek lightning / flash polygon
        points = [
            (cx + 1*s, cy - 5*s),
            (cx - 4*s, cy + 0.5*s),
            (cx - 0.5*s, cy + 0.5*s),
            (cx - 2*s, cy + 5.5*s),
            (cx + 4.5*s, cy - 0.5*s),
            (cx + 0.5*s, cy - 0.5*s),
        ]
        draw.polygon(points, fill=(255, 255, 255, 255))

        out_path = os.path.join(out_dir, f"icon{size}.png")
        img.save(out_path, "PNG")
        print(f"Generated {out_path} ({size}x{size})")

if __name__ == "__main__":
    generate_icons()
