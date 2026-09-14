/**
 * Helper Modul Laboratorium
 * Format otomatis kode_tindakan: "LAB_nama tindakan das" -> "LAB_NAMA_TINDAKAN_DAS"
 * Memakai event delegation karena form GroceryCrud dimuat via AJAX.
 */
(function () {
    var PREFIX = 'LAB_';
    var SELECTOR = 'input[name="kode_tindakan"]';

    function formatKode(value) {
        var v = String(value || '')
            .toUpperCase()
            .replace(/[\s-]+/g, '_')
            .replace(/[^A-Z0-9_]/g, '')
            .replace(/_+/g, '_');
        if (v.indexOf(PREFIX) !== 0) {
            v = PREFIX + v.replace(/^_+/, '');
        }
        return v;
    }

    function isTarget(el) {
        return el && el.matches && el.matches(SELECTOR) && !el.readOnly;
    }

    document.addEventListener('input', function (e) {
        var el = e.target;
        if (!isTarget(el)) { return; }
        var v = formatKode(el.value);
        if (v !== el.value) { el.value = v; }
    });

    document.addEventListener('focusout', function (e) {
        var el = e.target;
        if (!isTarget(el)) { return; }
        var v = formatKode(el.value);
        if (v.length > PREFIX.length) { v = v.replace(/_+$/, ''); }
        el.value = v;
    });

    document.addEventListener('focusin', function (e) {
        var el = e.target;
        if (!isTarget(el)) { return; }
        if (el.value.trim() === '') { el.value = PREFIX; }
    });
})();
