# Halo Bayi Assets CDN 🍼

Repository untuk mengelola dan mendistribusikan assets statis project Halo Bayi melalui berbagai Content Delivery Network (CDN).

## 📋 Daftar Isi

- [Tentang Project](#tentang-project)
- [Pilihan CDN](#pilihan-cdn)
- [Content Security Policy (CSP) Support](#content-security-policy-csp-support)
- [Struktur Direktori](#struktur-direktori)
- [Cara Penggunaan](#cara-penggunaan)
- [Rekomendasi Implementasi](#rekomendasi-implementasi)
- [Versioning](#versioning)
- [Kontribusi](#kontribusi)

---

## 🎯 Tentang Project

Repository ini menyediakan assets statis (JavaScript libraries, CSS frameworks, fonts, images) untuk aplikasi Halo Bayi dengan akses melalui multiple CDN untuk reliability dan performance optimization.

**Version:** 1.1.27

**Tech Stack:**
- jQuery
- Bootstrap
- Font Awesome
- Custom vendor libraries

---

## 🌐 Pilihan CDN

Project ini tersedia melalui 3 (tiga) CDN berbeda dengan karakteristik masing-masing:

### 1. jsDelivr (Recommended) ✅

**Status:** ✅ **CSP SUPPORT**

```
https://cdn.jsdelivr.net/gh/hallobayi/assets@1.1.27/vendors/jquery/jquery.min.js?r=1782870997
```

**Keunggulan:**
- ✅ Mendukung Content Security Policy (CSP)
- ✅ Global CDN dengan multiple mirrors
- ✅ Auto-fallback jika mirror gagal
- ✅ Cache optimal dengan versioning
- ✅ Support Subresource Integrity (SRI)
- ✅ CORS headers yang tepat

**Use Case:** Production environment dengan strict security policies

---

### 2. GitHub Pages ⚠️

**Status:** ❌ **NOT SUPPORT CSP**

```
https://hallobayi.github.io/assets/vendors/jquery/jquery.min.js
```

**Keterbatasan:**
- ❌ Tidak mendukung CSP
- ❌ Akan di-block oleh strict CSP policies
- ❌ Tidak ada integrity hash support
- ⚠️ CORS headers terbatas

**Use Case:** Development/testing lokal tanpa CSP requirements

---

### 3. StaticDelivr ✅

**Status:** ✅ **CSP SUPPORT**

```
https://cdn.staticdelivr.com/gh/hallobayi/assets/1.1.27/vendors/jquery/jquery.min.js
```

**Keunggulan:**
- ✅ **CSP Compatible** - Dapat digunakan dalam situs dengan Content Security Policy
- ✅ **Multi-CDN Architecture** - Menggunakan beberapa CDN untuk ketersediaan dan performa tinggi
- ✅ **Consistent Domain** - Semua aset di-host melalui domain konsisten yang dapat di-whitelist CSP
- ✅ **WordPress Integration** - Plugin otomatis untuk rewrite URL aset (CSS, JS, images, Google Fonts)
- ✅ **Auto Fallback System** - Fallback otomatis ke server asal jika CDN gagal atau blocked CSP
- ✅ **Security Policy Compliant** - Tetap kompatibel dengan kebijakan keamanan modern

**Use Case:** Production alternative dengan CSP support dan auto-fallback capability

---

## 🔒 Content Security Policy (CSP) Support

### Mengapa CSP Penting?

Content Security Policy adalah security header yang melindungi aplikasi dari:
- Cross-Site Scripting (XSS) attacks
- Code injection attacks
- Clickjacking
- Unauthorized data access

### CSP Configuration untuk jsDelivr

Untuk menggunakan jsDelivr dengan CSP, tambahkan header berikut di server configuration:

```apache
# Apache .htaccess
Header set Content-Security-Policy "script-src 'self' https://cdn.jsdelivr.net; style-src 'self' https://cdn.jsdelivr.net;"
```

```nginx
# Nginx
add_header Content-Security-Policy "script-src 'self' https://cdn.jsdelivr.net; style-src 'self' https://cdn.jsdelivr.net;" always;
```

```php
// PHP Header
header("Content-Security-Policy: script-src 'self' https://cdn.jsdelivr.net; style-src 'self' https://cdn.jsdelivr.net;");
```

### CSP Configuration untuk StaticDelivr

StaticDelivr juga mendukung CSP dengan domain konsisten yang dapat di-whitelist:

```apache
# Apache .htaccess
Header set Content-Security-Policy "script-src 'self' https://cdn.staticdelivr.com; style-src 'self' https://cdn.staticdelivr.com;"
```

```nginx
# Nginx
add_header Content-Security-Policy "script-src 'self' https://cdn.staticdelivr.com; style-src 'self' https://cdn.staticdelivr.com;" always;
```

```php
// PHP Header
header("Content-Security-Policy: script-src 'self' https://cdn.staticdelivr.com; style-src 'self' https://cdn.staticdelivr.com;");
```

**Catatan:** StaticDelivr memiliki fitur auto-fallback. Jika aset gagal dimuat karena CSP atau masalah jaringan, sistem otomatis fallback ke server asal tanpa merusak situs.

### Mengapa GitHub Pages Tidak Support CSP?

- GitHub Pages tidak menyediakan CORS headers yang kompatibel dengan strict CSP
- Tidak mendukung nonce-based atau hash-based CSP
- Tidak ada support untuk `'strict-dynamic'` directive
- Tidak memiliki fallback mechanism untuk CSP blocking

---

## 📁 Struktur Direktori

```
assets_halobayi/
├── vendors/
│   ├── jquery/
│   │   ├── jquery.min.js
│   │   └── jquery.js
│   ├── bootstrap/
│   │   ├── css/
│   │   └── js/
│   ├── fontawesome/
│   │   ├── css/
│   │   ├── webfonts/
│   │   └── js/
│   └── ...
├── css/
│   ├── custom.css
│   └── themes/
├── js/
│   ├── app.js
│   └── utils/
├── images/
│   ├── logo/
│   └── icons/
├── fonts/
├── index.html          # Dokumentasi visual interaktif
└── README.md           # Dokumentasi ini
```

---

## 🚀 Cara Penggunaan

### Option 1: jsDelivr (Production)

```html
<!DOCTYPE html>
<html>
<head>
    <!-- CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.1.27/vendors/bootstrap/css/bootstrap.min.css">
    
    <!-- JavaScript -->
    <script src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.1.27/vendors/jquery/jquery.min.js?r=1782870997"></script>
    <script src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.1.27/vendors/bootstrap/js/bootstrap.bundle.min.js"></script>
</head>
<body>
    <!-- Your content -->
</body>
</html>
```

### Option 2: GitHub Pages (Development)

```html
<!DOCTYPE html>
<html>
<head>
    <!-- CSS -->
    <link rel="stylesheet" href="https://hallobayi.github.io/assets/vendors/bootstrap/css/bootstrap.min.css">
    
    <!-- JavaScript -->
    <script src="https://hallobayi.github.io/assets/vendors/jquery/jquery.min.js"></script>
    <script src="https://hallobayi.github.io/assets/vendors/bootstrap/js/bootstrap.bundle.min.js"></script>
</head>
<body>
    <!-- Your content -->
</body>
</html>
```

### Option 3: Fallback Chain (Recommended)

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Primary: jsDelivr -->
    <script src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.1.27/vendors/jquery/jquery.min.js?r=1782870997"></script>
    
    <!-- Fallback jika primary gagal -->
    <script>
        if (typeof jQuery === 'undefined') {
            document.write('<script src="https://hallobayi.github.io/assets/vendors/jquery/jquery.min.js"><\/script>');
        }
    </script>
</head>
<body>
    <!-- Your content -->
</body>
</html>
```

---

## 💡 Rekomendasi Implementasi

### Production Environment

✅ **Pilihan 1: jsDelivr (Primary)**
- Global CDN dengan multiple mirrors
- Auto-fallback antar mirrors
- Aktifkan CSP headers di server
- Gunakan versioning (`@1.1.27`)
- Tambahkan cache buster parameter (`?r=timestamp`)

```html
<script src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.1.27/vendors/jquery/jquery.min.js?r=1782870997"></script>
```

✅ **Pilihan 2: StaticDelivr (Alternative)**
- Multi-CDN architecture untuk high availability
- Auto-fallback ke server asal jika CDN gagal
- WordPress integration ready
- CSP compatible dengan consistent domain

```html
<script src="https://cdn.staticdelivr.com/gh/hallobayi/assets/1.1.27/vendors/jquery/jquery.min.js"></script>
```

### Development Environment

✅ **Bisa menggunakan GitHub Pages**
- Lebih cepat untuk testing lokal
- Tidak perlu konfigurasi CSP (untuk dev)
- Mudah di-debug

```html
<script src="https://hallobayi.github.io/assets/vendors/jquery/jquery.min.js"></script>
```

✅ **Atau StaticDelivr untuk testing dengan CSP**
- Test CSP compatibility di development
- Simulate production behavior

### Staging Environment

✅ **Gunakan jsDelivr atau StaticDelivr**
- Test CSP compatibility
- Validate cache behavior
- Performance testing
- Fallback mechanism testing (khusus StaticDelivr)

---

## 🏷️ Versioning

Project ini menggunakan semantic versioning:

```
MAJOR.MINOR.PATCH
```

**Current Version:** `1.1.27`

### Version History

- `1.1.27` - Current stable version
- `1.1.x` - Minor updates & bug fixes
- `1.x.x` - Feature updates

### Menggunakan Version Spesifik

```html
<!-- Latest version -->
<script src="https://cdn.jsdelivr.net/gh/hallobayi/assets@latest/vendors/jquery/jquery.min.js"></script>

<!-- Version spesifik (recommended for production) -->
<script src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.1.27/vendors/jquery/jquery.min.js"></script>

<!-- Major version -->
<script src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1/vendors/jquery/jquery.min.js"></script>
```

---

## 🤝 Kontribusi

### Guidelines

1. **Testing**: Pastikan semua assets sudah di-test di local sebelum commit
2. **Minification**: Selalu provide versi `.min.js` dan `.min.css`
3. **Documentation**: Update README.md jika ada perubahan struktur
4. **Versioning**: Ikuti semantic versioning rules
5. **Security**: Scan assets untuk vulnerabilities sebelum publish

### Workflow

```bash
# Clone repository
git clone https://github.com/hallobayi/assets.git
cd assets

# Buat branch baru
git checkout -b feature/new-asset

# Tambahkan assets
# ...

# Commit changes
git add .
git commit -m "Add: new vendor library xyz"

# Push & create PR
git push origin feature/new-asset
```

---

## 📞 Support

Jika ada pertanyaan atau issue:

1. Buka [index.html](./index.html) untuk dokumentasi interaktif
2. Check [GitHub Issues](https://github.com/hallobayi/assets/issues)
3. Contact: support@halobayi.com

---

## 📄 License

Project ini dilisensikan untuk internal use Halo Bayi.

---

**Last Updated:** 2026-07-06
**Maintained by:** Halo Bayi Development Team
