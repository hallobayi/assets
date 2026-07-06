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

**Version:** 1.1.18

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
https://cdn.jsdelivr.net/gh/hallobayi/assets@1.1.18/vendors/jquery/jquery.min.js?r=1782870997
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

### 3. StaticDelivr ⚠️

**Status:** ❌ **NOT SUPPORT CSP**

```
https://cdn.staticdelivr.com/gh/hallobayi/assets/1.1.18/vendors/jquery/jquery.min.js
```

**Keterbatasan:**
- ❌ Tidak mendukung CSP
- ❌ Blocked by strict-dynamic directive
- ⚠️ Kurang optimal untuk modern security policies

**Use Case:** Fallback alternative untuk non-CSP environments

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

### Mengapa GitHub Pages & StaticDelivr Tidak Support CSP?

- GitHub Pages dan StaticDelivr tidak menyediakan CORS headers yang kompatibel dengan strict CSP
- Tidak mendukung nonce-based atau hash-based CSP
- Tidak ada support untuk `'strict-dynamic'` directive

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
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.1.18/vendors/bootstrap/css/bootstrap.min.css">
    
    <!-- JavaScript -->
    <script src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.1.18/vendors/jquery/jquery.min.js?r=1782870997"></script>
    <script src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.1.18/vendors/bootstrap/js/bootstrap.bundle.min.js"></script>
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
    <script src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.1.18/vendors/jquery/jquery.min.js?r=1782870997"></script>
    
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

✅ **WAJIB menggunakan jsDelivr**
- Aktifkan CSP headers di server
- Gunakan versioning (`@1.1.18`)
- Tambahkan cache buster parameter (`?r=timestamp`)
- Monitor CDN availability

```html
<script src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.1.18/vendors/jquery/jquery.min.js?r=1782870997"></script>
```

### Development Environment

✅ **Bisa menggunakan GitHub Pages atau StaticDelivr**
- Lebih cepat untuk testing lokal
- Tidak perlu konfigurasi CSP
- Mudah di-debug

```html
<script src="https://hallobayi.github.io/assets/vendors/jquery/jquery.min.js"></script>
```

### Staging Environment

✅ **Gunakan jsDelivr untuk simulasi production**
- Test CSP compatibility
- Validate cache behavior
- Performance testing

---

## 🏷️ Versioning

Project ini menggunakan semantic versioning:

```
MAJOR.MINOR.PATCH
```

**Current Version:** `1.1.21`

### Version History

- `1.1.21` - Current stable version
- `1.1.x` - Minor updates & bug fixes
- `1.x.x` - Feature updates

### Menggunakan Version Spesifik

```html
<!-- Latest version -->
<script src="https://cdn.jsdelivr.net/gh/hallobayi/assets@latest/vendors/jquery/jquery.min.js"></script>

<!-- Version spesifik (recommended for production) -->
<script src="https://cdn.jsdelivr.net/gh/hallobayi/assets@1.1.18/vendors/jquery/jquery.min.js"></script>

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
