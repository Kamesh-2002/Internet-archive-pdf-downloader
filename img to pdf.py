from PIL import Image
import os

def images_to_pdf(input_folder, output_pdf):
    images = []

    # Supported image formats
    valid_ext = ('.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp')

    # Sort files to keep page order correct
    files = sorted([
        f for f in os.listdir(input_folder)
        if f.lower().endswith(valid_ext)
    ])

    if not files:
        raise Exception("No images found in the folder")

    for file in files:
        path = os.path.join(input_folder, file)
        img = Image.open(path)

        # Convert all images to RGB (PDF doesn't support RGBA)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        images.append(img)

    # First image is base, rest are appended
    images[0].save(
        output_pdf,
        save_all=True,
        append_images=images[1:],
        resolution=300
    )

    print(f"✅ PDF created: {output_pdf}")


# ===== USAGE =====
images_to_pdf(r"./", "output 1.pdf")
