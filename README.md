# Instructions for Downloading Files from Internet Archive PDF Viewer

Follow the steps below carefully to automate file extraction from the Internet Archive PDF viewer.

---

## **Steps**

1. **Open the PDF file** on the Internet Archive website.

2. **Zoom the file** so that the content is clearly visible to you.

3. **Open the browser console**:

   * Right‑click anywhere on the page.
   * Select **Inspect**.
   * Navigate to the **Console** tab.

4. **Paste the following code into the console:**

   [Download the file](https://raw.githubusercontent.com/Kamesh-2002/Internet-archive-pdf-downloader/refs/heads/main/script.js)

   ```
   javascript
   // === Auto flip + capture + download (per-URL dedup for img.BRpageimage) ===
   async function captureFlipbookPages({
    delayBetweenPages = 1200,   // ms to wait after flipping
    maxPages = 200,             // safety limit
    filenamePrefix = 'page_'
    } = {}) {
  
    const sleep = ms => new Promise(r => setTimeout(r, ms));
  
    // Set of already-downloaded image identifiers (URLs or dataURLs)
    const downloaded = new Set();
    let downloadedCount = 0;    // for naming files
  
    function downloadHref(href, filename) {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    }
  
    function ensureImageLoaded(img) {
      return new Promise(resolve => {
        if (img.complete && img.naturalWidth > 0) return resolve();
        const done = () => {
          img.removeEventListener('load', done);
          img.removeEventListener('error', done);
          resolve();
        };
        img.addEventListener('load', done);
        img.addEventListener('error', done);
        setTimeout(done, 2000); // fallback timeout
      });
    }
  
    async function getPageNumber(imgEl) {
      return imgEl.parentElement.dataset.index
    }
  
    async function imgToHref(imgEl) {
      const src = imgEl.currentSrc || imgEl.src || '';
      // If it's a normal URL (not blob:), use it directly (original as possible)
      if (src && !src.startsWith('blob:')) return src;

    // For blob: URLs, convert to dataURL via canvas
    await ensureImageLoaded(imgEl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = imgEl.naturalWidth || imgEl.width;
    canvas.height = imgEl.naturalHeight || imgEl.height;
    ctx.drawImage(imgEl, 0, 0);
    const dataURL = canvas.toDataURL('image/jpeg', 0.95);
    canvas.width = canvas.height = 1;
    return dataURL;
    }
  
    function flipRight() {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        code: 'ArrowRight',
        keyCode: 39,
        which: 39,
        bubbles: true
      }));
    }
  
    for (let page = 1; page <= maxPages; page++) {
      console.log(`Scanning page ${page}…`);

    // Find ALL flipbook images on the current view
    const imgs = Array.from(document.querySelectorAll('img.BRpageimage'));

    if (!imgs.length) {
      console.warn('No img.BRpageimage found on this page. Stopping.');
      break;
    }

    let newOnThisPage = 0;

    for (const img of imgs) {
      try {
        const href = await imgToHref(img);
        const pageNum = await getPageNumber(img);
        if (!href) {
          console.warn('Could not resolve image href, skipping one element.');
          continue;
        }

        if (downloaded.has(href)) {
          // Already downloaded earlier in the book
          continue;
        }

        downloaded.add(href);
        downloadedCount++;

        const num = String(pageNum).padStart(3, '0');
        const ext = href.startsWith('data:') ? '.jpg' : ''; // keep URL ext, add .jpg for dataURLs
        const filename = `${filenamePrefix}${num}${ext}`;
        downloadHref(href, filename);
        newOnThisPage++;

        console.log(`Downloaded ${filename}`);
      } catch (e) {
        console.error('Error processing an image:', e);
      }
    }

    console.log(`Page ${page}: ${newOnThisPage} new image(s).`);

    // Flip to next page and wait for it to load
    flipRight();
    await sleep(delayBetweenPages);
      }
    
      console.log('Done captureFlipbookPages. Total unique images downloaded:', downloadedCount);
    }

   ```

5. **Run the script** by pasting the following line:

   ```
   javascript
   captureFlipbookPages({
      delayBetweenPages: 2000,  // increase if pages load slowly
      maxPages: 400,
      filenamePrefix: 'book_page_'
    });

   ```

6. Once the script finishes running, **the files will be saved automatically** to your **local Downloads directory**.

---

## ⚠️ **Important Warning**

Before running the script, make sure to **disable** the following browser setting:

* **“Ask every time before downloading”**

This ensures the files download automatically without interruptions.

---

## 🐍 **Python code for converting the images to pdf (Optional)**

[Download the file](https://raw.githubusercontent.com/Kamesh-2002/Internet-archive-pdf-downloader/refs/heads/main/img%20to%20pdf.py)

```
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
images_to_pdf(r"replace with images downloaded directory", "output 1.pdf")

```

---

If you need help customizing the script or adding explanations, feel free to ask!
