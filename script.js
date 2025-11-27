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
