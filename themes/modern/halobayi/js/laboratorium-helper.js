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

/* ================================================================
 * Modal Komponen Pemeriksaan
 * Dipanggil oleh setActionButton: javascript:bukaKomponenModal(url)
 * Konten dimuat via AJAX (partial view tanpa layout).
 * ================================================================ */
(function () {
    var MODAL_ID = 'modal-komponen-lab';

    /* Buat modal sekali saja saat DOM siap */
    function injectModal() {
        if (document.getElementById(MODAL_ID)) { return; }
        var html =
            '<div class="modal fade" id="' + MODAL_ID + '" tabindex="-1" aria-labelledby="' + MODAL_ID + '-label" aria-hidden="true">' +
            '  <div class="modal-dialog modal-xl modal-dialog-scrollable" style="max-width: 92vw; width: 92%;">' +
            '    <div class="modal-content w-100">' +
            '      <div class="modal-header py-2 bg-light">' +
            '        <h6 class="modal-title mb-0" id="' + MODAL_ID + '-label">' +
            '          <i class="fa fa-flask me-2 text-info"></i>Komponen Pemeriksaan' +
            '        </h6>' +
            '        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Tutup"></button>' +
            '      </div>' +
            '      <div class="modal-body p-3" id="' + MODAL_ID + '-body">' +
            '        <div class="text-center py-5 text-muted">' +
            '          <i class="fa fa-spinner fa-spin fa-2x"></i><br><small>Memuat...</small>' +
            '        </div>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>';
        document.body.insertAdjacentHTML('beforeend', html);
    }

    /* Fungsi global dipanggil dari href setActionButton */
    window.bukaKomponenModal = function (url) {
        injectModal();

        var modalEl = document.getElementById(MODAL_ID);
        var $body   = $('#' + MODAL_ID + '-body');

        /* Reset isi & tampilkan spinner */
        $body.html(
            '<div class="text-center py-5 text-muted">' +
            '<i class="fa fa-spinner fa-spin fa-2x"></i><br><small>Memuat...</small></div>'
        );

        /* Tampilkan modal (BS5 native atau jQuery adapter) */
        if (window.bootstrap && typeof bootstrap.Modal !== 'undefined') {
            bootstrap.Modal.getOrCreateInstance(modalEl).show();
        } else if (window.jQuery && typeof jQuery.fn.modal === 'function') {
            $('#' + MODAL_ID).modal('show');
        }

        /* Muat konten partial via AJAX */
        $.ajax({
            url         : url,
            type        : 'GET',
            headers     : { 'X-Requested-With': 'XMLHttpRequest' },
            success     : function (html) {
                $body.html(html);
            },
            error       : function (xhr) {
                var msg = xhr.status === 404
                    ? 'Tindakan tidak ditemukan.'
                    : 'Gagal memuat data (HTTP ' + xhr.status + ').';
                $body.html(
                    '<div class="alert alert-danger m-3"><i class="fa fa-exclamation-triangle me-1"></i>' + msg + '</div>'
                );
            }
        });
    };

    /* Pastikan modal terinjeksi sejak awal */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectModal);
    } else {
        injectModal();
    }
})();
