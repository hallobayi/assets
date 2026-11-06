# RawBT JavaScript Library - Unofficial Documentation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Bahasa**: [English](#english) | [Indonesia](#indonesia)

---

# English

## What is RawBT?

RawBT is an Android application that allows web pages to print directly to Bluetooth/USB thermal printers using ESC/POS commands. This documentation covers the JavaScript library that interfaces with the RawBT app.

**RawBT App**: [Play Store](https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter)

## Features

- ✅ Print text with various styles (bold, underline, sizes)
- ✅ Print barcodes (CODE128, EAN13, etc.)
- ✅ Print QR codes
- ✅ Open cash drawer
- ✅ Cut paper (full/partial)
- ✅ Multiple encodings support (UTF-8, CP866, Windows-1251, etc.)
- ✅ Image printing

## Installation

### Option 1: Direct Include
```html
<script src="iconv-lite.bundle.js"></script>
<script src="app.js"></script>
```

### Option 2: Module Import
```javascript
import { PosPrinterJob, EscPosDriver, RawBtTransport } from './app.js';
```

## Quick Start

```javascript
// Create printer job
const job = new PosPrinterJob();
const driver = new EscPosDriver();

// Configure encoding (optional)
driver.setEncoding('UTF-8');

// Add content
job.text('Hello World!');

// Send to printer
RawBtTransport.send(driver.getData(job));
```

## API Reference

### Text Formatting

```javascript
// Basic text
job.text('Normal text');

// Bold text
job.bold(true);
job.text('Bold text');
job.bold(false);

// Underline
job.underline(true);
job.text('Underlined text');
job.underline(false);

// Text sizes (1-8)
job.textSize(2, 2); // width, height
job.text('Large text');
job.textSize(1, 1); // reset to normal
```

### Text Alignment

```javascript
job.align('left');   // or 0
job.align('center'); // or 1  
job.align('right');  // or 2
```

### Line Spacing

```javascript
job.newLine();       // Single line break
job.feed(3);         // Feed 3 lines
```

### Cash Drawer

```javascript
// Open cash drawer
job.openDrawer();

// Alternative with timing
job.openDrawer(0, 50, 200); // pin, on-time, off-time
```

### Barcode

```javascript
// CODE128 barcode
job.barcode('123456789', 'CODE128');

// With options
job.barcode('123456789', 'CODE128', {
    width: 2,      // 1-6
    height: 60,    // dots
    position: 2    // 0=none, 1=above, 2=below, 3=both
});
```

Supported barcode types:
- `UPC_A`, `UPC_E`
- `EAN13`, `EAN8`
- `CODE39`
- `ITF` (Interleaved 2 of 5)
- `CODE93`
- `CODE128`
- `CODABAR`

### QR Code

```javascript
// Simple QR code
job.qrCode('https://example.com');

// With size
job.qrCode('https://example.com', 6); // size 1-16
```

### Paper Cut

```javascript
job.cut();        // Full cut
job.cut('full');
job.cut('partial'); // Partial cut
```

### Raw ESC/POS Commands

```javascript
// Send raw bytes
job.raw([0x1B, 0x40]); // Initialize printer

// Common commands
const ESC = 0x1B;
const GS = 0x1D;

job.raw([ESC, 0x40]);           // Initialize
job.raw([ESC, 0x64, 5]);        // Feed 5 lines
job.raw([GS, 0x56, 0]);         // Full cut
job.raw([ESC, 0x70, 0, 25, 250]); // Open drawer
```

## ESC/POS Command Reference

| Command | Bytes | Description |
|---------|-------|-------------|
| Initialize | `1B 40` | Reset printer |
| Line Feed | `0A` | New line |
| Feed N lines | `1B 64 n` | Feed n lines |
| Align Left | `1B 61 00` | Left align |
| Align Center | `1B 61 01` | Center align |
| Align Right | `1B 61 02` | Right align |
| Bold On | `1B 45 01` | Enable bold |
| Bold Off | `1B 45 00` | Disable bold |
| Underline On | `1B 2D 01` | Enable underline |
| Underline Off | `1B 2D 00` | Disable underline |
| Text Size | `1D 21 n` | n = (w-1)*16 + (h-1) |
| Full Cut | `1D 56 00` | Cut paper |
| Partial Cut | `1D 56 01` | Partial cut |
| Open Drawer | `1B 70 00 19 FA` | Trigger drawer |

## Complete Receipt Example

```javascript
const job = new PosPrinterJob();
const driver = new EscPosDriver();

// Initialize
job.raw([0x1B, 0x40]);

// Header
job.align('center');
job.bold(true);
job.textSize(2, 2);
job.text('MY STORE');
job.textSize(1, 1);
job.bold(false);
job.text('Jl. Example No. 123');
job.text('Tel: 021-12345678');
job.newLine();

// Separator
job.text('================================');

// Items
job.align('left');
job.text('Product A          x2   Rp 50.000');
job.text('Product B          x1   Rp 25.000');
job.text('================================');

// Total
job.align('right');
job.bold(true);
job.text('TOTAL: Rp 75.000');
job.bold(false);

// Footer
job.align('center');
job.newLine();
job.text('Thank you for shopping!');
job.qrCode('INV-2024-001', 5);

// Cut and open drawer
job.feed(3);
job.cut();
job.openDrawer();

// Send to printer
RawBtTransport.send(driver.getData(job));
```

## Troubleshooting

### Printer not found
- Ensure RawBT app is installed and running
- Check Bluetooth/USB connection
- Make sure printer is paired/connected

### Encoding issues (garbled text)
- Try different encodings: `driver.setEncoding('CP437')` or `driver.setEncoding('UTF-8')`
- Check your printer's supported encodings

### Cash drawer not opening
- Verify drawer is connected to printer's RJ11/RJ12 port
- Try different pin (0 or 1): `job.openDrawer(1, 50, 200)`
- Check drawer cable compatibility

---

# Indonesia

## Apa itu RawBT?

RawBT adalah aplikasi Android yang memungkinkan halaman web mencetak langsung ke printer thermal Bluetooth/USB menggunakan perintah ESC/POS.

**Aplikasi RawBT**: [Play Store](https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter)

## Fitur

- ✅ Cetak teks dengan berbagai gaya (bold, underline, ukuran)
- ✅ Cetak barcode (CODE128, EAN13, dll.)
- ✅ Cetak QR code
- ✅ Buka laci kasir (cash drawer)
- ✅ Potong kertas (full/partial)
- ✅ Dukungan berbagai encoding
- ✅ Cetak gambar

## Penggunaan Cepat

```javascript
// Buat print job
const job = new PosPrinterJob();
const driver = new EscPosDriver();

// Tambah konten
job.text('Halo Dunia!');

// Kirim ke printer
RawBtTransport.send(driver.getData(job));
```

## Contoh Struk Lengkap

```javascript
const job = new PosPrinterJob();
const driver = new EscPosDriver();

// Inisialisasi
job.raw([0x1B, 0x40]);

// Header
job.align('center');
job.bold(true);
job.textSize(2, 2);
job.text('TOKO SAYA');
job.textSize(1, 1);
job.bold(false);
job.text('Jl. Contoh No. 123');
job.newLine();

// Separator
job.text('================================');

// Items
job.align('left');
job.text('Produk A          x2   Rp 50.000');
job.text('Produk B          x1   Rp 25.000');
job.text('================================');

// Total
job.align('right');
job.bold(true);
job.text('TOTAL: Rp 75.000');

// Footer
job.align('center');
job.text('Terima kasih!');
job.qrCode('INV-2024-001', 5);

// Potong dan buka laci
job.feed(3);
job.cut();
job.openDrawer();

// Kirim ke printer
RawBtTransport.send(driver.getData(job));
```

## Buka Laci Kasir

```javascript
// Cara sederhana
job.openDrawer();

// Dengan timing
job.openDrawer(0, 50, 200); // pin, on-time, off-time

// Menggunakan raw command
job.raw([0x1B, 0x70, 0x00, 0x19, 0xFA]);
```

## Referensi Perintah ESC/POS

| Perintah | Bytes | Keterangan |
|----------|-------|------------|
| Inisialisasi | `1B 40` | Reset printer |
| Baris Baru | `0A` | Garis baru |
| Feed N baris | `1B 64 n` | Feed n baris |
| Rata Kiri | `1B 61 00` | Align left |
| Rata Tengah | `1B 61 01` | Align center |
| Rata Kanan | `1B 61 02` | Align right |
| Bold On | `1B 45 01` | Aktifkan bold |
| Bold Off | `1B 45 00` | Nonaktifkan bold |
| Garis Bawah On | `1B 2D 01` | Aktifkan underline |
| Garis Bawah Off | `1B 2D 00` | Nonaktifkan underline |
| Ukuran Teks | `1D 21 n` | n = (w-1)*16 + (h-1) |
| Potong Full | `1D 56 00` | Potong kertas |
| Potong Partial | `1D 56 01` | Potong sebagian |
| Buka Laci | `1B 70 00 19 FA` | Trigger laci |

---

## Examples

Check the `examples/` folder for working HTML examples:

- `01-basic-print.html` - Basic text printing
- `02-formatting.html` - Text formatting (bold, underline, sizes)
- `03-alignment.html` - Text alignment
- `04-barcode.html` - Barcode printing
- `05-qrcode.html` - QR code printing
- `06-cash-drawer.html` - Cash drawer control
- `07-paper-cut.html` - Paper cutting
- `08-receipt.html` - Complete receipt example
- `09-raw-commands.html` - Raw ESC/POS commands

## License

MIT License - Feel free to use in personal and commercial projects.

## Credits

- Original RawBT App: [rawbt.ru](https://rawbt.ru/)
- This documentation: Community contributed

## Contributing

Feel free to submit issues and pull requests to improve this documentation!
