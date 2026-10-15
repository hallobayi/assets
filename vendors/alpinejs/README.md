# Alpine.js

[![Version](https://img.shields.io/badge/version-3.17.4-blue.svg)](https://github.com/alpinejs/alpine/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE.md)

Mirror vendor untuk [Alpine.js](https://alpinejs.dev) — framework JavaScript
minimal untuk menambah perilaku reaktif langsung di atribut HTML.

**Version:** `3.17.4` · **License:** MIT · **Author:** Caleb Porzio

---

## Isi Folder

| File                   | Ukuran  | Kegunaan                                                   |
| ---------------------- | ------- | ---------------------------------------------------------- |
| `cdn.min.js`           | ~55 KB  | **Build utama (IIFE)**. `<script src>` biasa. Production.  |
| `cdn.js`               | ~134 KB | Sama seperti di atas, versi tidak terminifikasi. Debugging. |
| `module.esm.min.js`    | ~55 KB  | ES module. Untuk `import Alpine from '...'` / bundler.      |
| `module.esm.js`        | ~125 KB | ES module, tidak terminifikasi.                             |
| `module.cjs.js`        | ~180 KB | CommonJS. Untuk `require()` di Node/build tool.             |
| `csp/cdn.min.js`       | ~71 KB  | **CSP-friendly build**. Lihat bagian CSP di bawah.          |
| `csp/module.esm.min.js`| ~71 KB  | CSP build dalam bentuk ES module.                           |
| `plugins/`             | ~944 KB | 9 plugin resmi Alpine 3.17.4 (45 file). Lihat bagian Plugin. |
| `LICENSE.md`           | —       | MIT License (Copyright © 2019-2025 Caleb Porzio).           |

`cdn.js` / `cdn.min.js` adalah *standalone build* — Alpine core sudah termasuk
di dalamnya. Tidak perlu memuat file lain.

---

## ⚠️ Penting: CSP dan `unsafe-eval`

Repo ini dipakai oleh aplikasi dengan Content Security Policy ketat
(`script-src 'self' https://cdn.jsdelivr.net`). Ada satu hal yang harus
diputuskan sebelum memakai Alpine:

Build standar (`cdn.min.js`) mengevaluasi ekspresi atribut (`x-text`,
`x-show`, `@click`, ...) dengan `new Function(...)`. Artinya build ini
**diblokir oleh CSP tanpa `'unsafe-eval'`** di `script-src`, dan menambah
`'unsafe-eval'` berarti melepas sebagian besar proteksi XSS yang jadi alasan
CSP dipasang sejak awal.

Alpine menyediakan build alternatif: **`csp/cdn.min.js`**. Build ini tidak
memakai `new Function` sama sekali (sudah diverifikasi: 0 kemunculan
`new Function` / `Function(` / `eval(`), sehingga jalan di bawah CSP ketat
tanpa `'unsafe-eval'`.

| Build            | `unsafe-eval` | Dukungan ekspresi inline |
| ---------------- | ------------- | ------------------------ |
| `cdn.min.js`     | **Wajib**     | Penuh (sama dengan JS)   |
| `csp/cdn.min.js` | Tidak perlu   | Terbatas (lihat tabel di bawah) |

### Batasan nyata build CSP

Hasil uji langsung terhadap file di folder ini (10 kasus ekspresi, dijalankan
di jsdom):

| Ekspresi inline                                        | Standar | CSP |
| ------------------------------------------------------ | :-----: | :-: |
| `x-data="{ count: 0 }"` + `@click="count++"`            |  ✅ | ✅ |
| `x-text="count * 3"`                                    |  ✅ | ✅ |
| `x-text="n + 'b'"`                                      |  ✅ | ✅ |
| `x-text="count > 3 ? 'yes' : 'no'"`                     |  ✅ | ✅ |
| `x-data="cmp"` (komponen `Alpine.data()`)               |  ✅ | ✅ |
| `x-data="{ label() { return 1 } }"` (method shorthand)  |  ✅ | ❌ |
| `x-data="{ label: function() { return 1 } }"`           |  ✅ | ❌ |
| `x-text="(() => 42)()"` (arrow function)                |  ✅ | ❌ |
| `x-text="[1,2].map(i => i*2)"` (arrow di dalam ekspresi) |  ✅ | ❌ |
| ``x-text="`hi ${n}`"`` (template literal)               |  ✅ | ❌ |

Kesimpulan praktis: **jangan letakkan definisi fungsi di dalam `x-data`** dan
**jangan pakai arrow function / template literal di ekspresi atribut** kalau
memilih build CSP. Semua logika dipindah ke `Alpine.data()`.

```js
// ✅ Aman untuk build CSP — data literal + logika di Alpine.data()
document.addEventListener("alpine:init", () => {
  Alpine.data("counter", () => ({
    count: 0,
    increment() {
      this.count++;
    },
  }));
});
// <div x-data="counter"><button @click="increment()">

// ❌ Gagal di build CSP — definisi method inline di x-data
// <div x-data="{ count: 0, inc() { this.count++ } }">

// ❌ Gagal di build CSP — arrow function di ekspresi
// <span x-text="(() => 42)()"></span>

// ❌ Gagal di build CSP — template literal di ekspresi
// <span x-text="`hi ${name}`"></span>
```

Gejala kalau melanggar: Alpine menulis
`Alpine Expression Error: CSP Parser Error: ...` ke console dan binding-nya
diam-diam tidak terisi (bukan error yang terlihat di UI).

**Jangan memuat keduanya sekaligus** — `csp/cdn.min.js` sudah berisi Alpine
core lengkap. Pilih salah satu.

---

## Cara Penggunaan

### Option 1: jsDelivr (Production, CSP-compatible delivery)

```html
<!-- Build standar (butuh 'unsafe-eval') -->
<script
  defer
  src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.6.3/vendors/alpinejs/cdn.min.js"
></script>

<!-- Build CSP-friendly (tanpa 'unsafe-eval') -->
<script
  defer
  src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.6.3/vendors/alpinejs/csp/cdn.min.js"
></script>
```

### Option 2: GitHub Pages (Development)

```html
<script defer src="https://hallobayi.github.io/assets/vendors/alpinejs/cdn.min.js"></script>
```

### Option 3: StaticDelivr (CSP-compatible alternative)

```html
<script defer src="https://cdn.staticdelivr.com/gh/hallobayi/assets/1.6.3/vendors/alpinejs/cdn.min.js"></script>
```

### Option 4: ES Module / Bundler

```js
import Alpine from "./vendors/alpinejs/module.esm.min.js";

window.Alpine = Alpine;
Alpine.start();
```

### Fallback Chain

```html
<script
  defer
  src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.6.3/vendors/alpinejs/cdn.min.js"
></script>
<script>
  window.addEventListener("load", function () {
    if (typeof window.Alpine === "undefined") {
      var s = document.createElement("script");
      s.defer = true;
      s.src = "https://hallobayi.github.io/assets/vendors/alpinejs/cdn.min.js";
      document.head.appendChild(s);
    }
  });
</script>
```

---

## Catatan Integrasi

- **`defer` wajib.** Alpine harus dieksekusi setelah DOM siap. Tanpa `defer`,
  `x-data` di markup yang belum ter-parse tidak akan terinisialisasi.
- **Taruh di akhir `<head>` atau sebelum `</body>`.** Alpine otomatis
  menjalankan `Alpine.start()` saat DOMContentLoaded.
- **Registrasi komponen/plugin lewat event `alpine:init`**, bukan langsung
  setelah tag `<script>`:

  ```js
  document.addEventListener("alpine:init", () => {
    Alpine.data("dropdown", () => ({
      open: false,
      toggle() {
        this.open = !this.open;
      },
    }));
  });
  ```

- **Plugin resmi Alpine** sudah di-mirror di `plugins/`. Lihat bagian
  [Plugin Resmi](#plugin-resmi) di bawah.

---

## Plugin Resmi

9 plugin resmi Alpine, semuanya versi **3.17.4** — cocok dengan core di folder
ini. Masing-masing punya 5 file (`cdn.js`, `cdn.min.js`, `module.esm.js`,
`module.esm.min.js`, `module.cjs.js`) dengan pola yang sama seperti core.

| Plugin      | Directive / magic  | `cdn.min.js` | Kegunaan                                        |
| ----------- | ------------------ | -----------: | ----------------------------------------------- |
| `persist`   | `$persist`         |       929 B  | Simpan state ke `localStorage` lintas page load |
| `collapse`  | `x-collapse`       |     1.4 KB   | Animasi buka/tutup tinggi elemen yang mulus    |
| `intersect` | `x-intersect`      |     2.0 KB   | Jalankan kode saat elemen masuk viewport       |
| `mask`      | `x-mask`           |     2.1 KB   | Format input otomatis (`99/99/9999`, `AAA-999`) |
| `morph`     | `x-morph`          |     5.5 KB   | Diff & patch blok HTML dari `<template>`        |
| `resize`    | `x-resize`         |       945 B  | Jalankan kode saat elemen berubah ukuran       |
| `anchor`    | `x-anchor`         |    15.7 KB   | Posisikan elemen relatif ke elemen lain        |
| `focus`     | `x-trap`           |    26.1 KB   | Kelola focus (focus trap untuk modal/dialog)   |
| `sort`      | `x-sort`           |    38.9 KB   | Drag & drop sorting list                       |

`anchor` membundel `@floating-ui/dom`, `focus` membundel `focus-trap` +
`tabbable`, `sort` membundel SortableJS. Semua MIT, dan lisensinya sudah
tercantum di dalam file bundle masing-masing.

### Cara pakai (route `<script>` biasa)

Plugin **mendaftarkan dirinya sendiri** lewat `document.addEventListener("alpine:init", () => window.Alpine.plugin(...))`.
Jadi cukup pasang tag `<script>` **setelah** core — tidak perlu memanggil
`Alpine.plugin()` manual:

```html
<script defer src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.6.3/vendors/alpinejs/cdn.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.6.3/vendors/alpinejs/plugins/persist/cdn.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.6.3/vendors/alpinejs/plugins/mask/cdn.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.6.3/vendors/alpinejs/plugins/collapse/cdn.min.js"></script>
```

**Urutan wajib:** core dulu, plugin setelahnya. `defer` menjaga urutan eksekusi
sesuai urutan tag, jadi ini aman. Kalau plugin dimuat **setelah**
`alpine:init` sudah lewat (mis. di-inject belakangan secara dinamis), plugin
tidak akan terdaftar — tanpa error apa pun.

### Cara pakai (route ESM / bundler)

Di route ini plugin **tidak** mendaftar sendiri; panggil manual:

```js
import Alpine from "./vendors/alpinejs/module.esm.min.js";
import persist from "./vendors/alpinejs/plugins/persist/module.esm.min.js";
import collapse from "./vendors/alpinejs/plugins/collapse/module.esm.min.js";

Alpine.plugin(persist);
Alpine.plugin(collapse);

window.Alpine = Alpine;
Alpine.start();
```

### Kompatibilitas dengan build CSP

Plugin-plugin ini **tidak** memakai `new Function` sendiri (sudah dicek: 0
kemunculan di kesembilan `cdn.min.js`). Plugin menumpang evaluator dari core,
jadi tetap kompatibel dengan `csp/cdn.min.js` — selama ekspresi yang Anda tulis
sendiri patuh aturan di [batasan build CSP](#batasan-nyata-build-csp).

Catatan: `x-mask` dengan pattern string aman-CSP. Tapi `x-mask:dynamic="..."`,
`x-intersect:enter` dengan ekspresi kompleks, dan callback inline yang pakai
arrow function tetap akan gagal — pindahkan ke `Alpine.data()`.

---

## Verifikasi

Semua file di folder ini adalah **byte-identical** dengan dist resmi npm
(dibandingkan lewat MD5), dan lolos `node --check`. Bukti terkuat: md5 dari
npm `alpinejs@3.17.4` / `@alpinejs/csp@3.17.4`.

**Core + CSP build:**

| File                        | MD5                                |
| --------------------------- | ---------------------------------- |
| `cdn.min.js`                | `37bbf94201a78634b2780338ce1ba9d9` |
| `cdn.js`                    | `15b156f3a4d98d500116294bb2b74ab3` |
| `module.esm.min.js`         | `106aa414605000a9b72eddd33dd3887c` |
| `module.esm.js`             | `fe55c961367e6df7db323d8e674c0815` |
| `module.cjs.js`             | `bdfcb25af363a6deaf168354d5104183` |
| `csp/cdn.min.js`            | `9ef4a2916a4e1ddd2176d948a800ef91` |
| `csp/cdn.js`                | `11ffb6c185384b21148699b2454137f9` |
| `csp/module.esm.min.js`     | `3668b99532d709ff616d978b896ed3f4` |
| `csp/module.esm.js`         | `e00b5c1238b1f49029c8e08b7749e616` |
| `csp/module.cjs.js`         | `15de4a05663a6edf2d0672b88e7f0e31` |

**Plugin** (`plugins/<nama>/cdn.min.js`):

| Plugin      | MD5                                |
| ----------- | ---------------------------------- |
| `persist`   | `40b0dd0f40259569b4561c425c95de3e` |
| `collapse`  | `9c8363b44f4f4d55d36379db4a8d3e17` |
| `intersect` | `3c91f9e026b3fb161eb2e6ea9f154de8` |
| `mask`      | `098ec639bed7d04eefc2011321bef539` |
| `morph`     | `d5b3eb841c50a7c9d61132c7aa898d75` |
| `resize`    | `839216ee53ad012f489cafc0470fbaa8` |
| `anchor`    | `ee8caee9462834b9f4675984657cf8cb` |
| `focus`     | `0caff82aa139a8e41cf966d47903c95c` |
| `sort`      | `c69960096a590c4ac3c6296da88fce4e` |

Verifikasi ulang:

```bash
npm pack alpinejs@3.17.4 @alpinejs/csp@3.17.4
tar -xzf alpinejs-3.17.4.tgz && md5sum package/dist/cdn.min.js

# plugin
for p in persist collapse focus intersect mask morph sort anchor resize; do
  npm pack "@alpinejs/$p@3.17.4" >/dev/null
  tar -xzf "alpinejs-$p-3.17.4.tgz" && md5sum package/dist/cdn.min.js
done
```

### Smoke test (jsdom)

| Uji                                                        | Standar | CSP |
| ---------------------------------------------------------- | :-----: | :-: |
| Alpine boot + reaktivitas `x-text` / `@click`               |  ✅ PASS | ✅ PASS |
| `$persist` round-trip ke `localStorage`                     |  ✅ PASS | ✅ PASS |
| `x-mask="99/99/9999"` — `"12311990"` → `"12/31/1990"`       |  ✅ PASS | ✅ PASS |
| `x-collapse` directive terpasang                            |  ✅ PASS | ✅ PASS |
| `x-intersect` directive terpasang                           |  ✅ PASS | ✅ PASS |
| 9 plugin dimuat bersamaan di satu halaman, 0 error          |  ✅ PASS | ✅ PASS |

Semua direktif terverifikasi terpasang saat 9 plugin dimuat sekaligus:
`x-mask`, `x-collapse`, `x-intersect`, `x-trap`, `x-anchor`, `x-resize`,
`x-sort`, `x-morph` (di `<template>`), dan magic `$persist`.

Catatan versi: Alpine 3.x butuh browser modern (ES2015+). Kalau masih ada
target IE11, Alpine 3 **tidak** akan jalan — tidak ada polyfill resmi.

---

## License

MIT License — lihat [`LICENSE.md`](./LICENSE.md).

Copyright © 2019-2025 Caleb Porzio and contributors.
