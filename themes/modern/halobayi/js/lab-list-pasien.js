/**
 *  Developed by : Muchamad Desta Fadilah a.ka. topidesta
 *  Website      : https://topidesta.my.id
 *  Year         : 2026
 *  Description  : DataTables & live-refresh untuk halaman Lab → Daftar Pasien Lab.
 *
 *  Elemen penanda : #table-list-pasien
 *  Endpoint AJAX  : /lab/get-data-d-t  (GET, JSON { data: [...] })
 *  Tombol refresh : #btn-refresh-pasien
 *
 *  Kolom tabel (9 kolom, 0-based):
 *    0  No (auto-number, non-orderable)
 *    1  No. Reg
 *    2  No. RM
 *    3  Nama Pasien
 *    4  Dokter
 *    5  Layanan
 *    6  Cabang
 *    7  Tgl Masuk
 *    8  Jam Notif
 *
 *  Dependensi yang harus sudah dimuat sebelum file ini:
 *    - jquery.dataTables.min.js
 *    - dataTables.bootstrap5.min.js
 *    - dataTables.buttons.min.js  + turunannya (html5, print, jszip, pdfmake)
 */

jQuery(document).ready(function ($) {
    if (!$('#table-list-pasien').length) {
        return;
    }

    var $table  = $('#table-list-pasien');
    var ajaxUrl = $('#dataTables-url').text().trim();

    /* ================================================================
     * Inisialisasi DataTables
     * ================================================================ */
    var table = $table.DataTable({
        order: [],          /* Pertahankan urutan awal — terbaru di atas dari Redis */
        columnDefs: [
            { targets: 0, orderable: false, searchable: false },
            { targets: [1, 2, 7, 8], className: 'text-nowrap' }
        ],
        pageLength: 10,
        lengthMenu: [
            [10, 25, 50, 100, -1],
            ['10', '25', '50', '100', 'Semua']
        ],
        buttons: [
            {
                extend: 'copy',
                text: '<i class="far fa-copy me-1"></i> Salin',
                className: 'btn btn-sm btn-light border'
            },
            {
                extend: 'excel',
                text: '<i class="far fa-file-excel me-1 text-success"></i> Excel',
                className: 'btn btn-sm btn-light border',
                title: 'Daftar Pasien Laboratorium'
            },
            {
                extend: 'csv',
                text: '<i class="far fa-file-alt me-1 text-info"></i> CSV',
                className: 'btn btn-sm btn-light border',
                title: 'Daftar Pasien Laboratorium'
            },
            {
                extend: 'pdf',
                text: '<i class="far fa-file-pdf me-1 text-danger"></i> PDF',
                className: 'btn btn-sm btn-light border',
                title: 'Daftar Pasien Laboratorium'
            },
            {
                extend: 'print',
                text: '<i class="fas fa-print me-1 text-primary"></i> Cetak',
                className: 'btn btn-sm btn-light border',
                title: 'Daftar Pasien Laboratorium'
            }
        ],
        dom:
            "<'row mb-1'<'col-12'B>>" +
            "<'row mb-2'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row mt-2'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        language: {
            search:         'Cari Pasien:',
            searchPlaceholder: 'Ketik No. Reg / Nama / RM...',
            lengthMenu:     'Tampilkan _MENU_ data',
            info:           'Menampilkan _START_ – _END_ dari _TOTAL_ pasien',
            infoEmpty:      'Menampilkan 0 sampai 0 dari 0 pasien',
            infoFiltered:   '(disaring dari _MAX_ total pasien)',
            zeroRecords:    'Tidak ditemukan data pasien yang sesuai',
            emptyTable:     'Belum ada pasien dalam 24 jam terakhir (atau Redis tidak terjangkau)',
            paginate: {
                first:    'Awal',
                last:     'Akhir',
                next:     'Berikutnya',
                previous: 'Sebelumnya'
            }
        }
    });

    /* ================================================================
     * Auto-numbering kolom No saat sort / filter
     * ================================================================ */
    table.on('order.dt search.dt', function () {
        table
            .column(0, { search: 'applied', order: 'applied' })
            .nodes()
            .each(function (cell, i) {
                cell.innerHTML = i + 1;
            });
    }).draw();

    /* ================================================================
     * Tombol Muat Ulang — refresh data dari Redis via AJAX
     * ================================================================ */
    $('#btn-refresh-pasien').on('click', function (e) {
        e.preventDefault();

        var $btn  = $(this);
        var $icon = $btn.find('i');
        $icon.addClass('fa-spin');
        $btn.addClass('disabled').prop('disabled', true);

        if (!ajaxUrl) {
            window.location.reload();
            return;
        }

        $.ajax({
            url:      ajaxUrl,
            type:     'GET',
            dataType: 'json',
            success: function (res) {
                if (!res || !res.data) {
                    window.location.reload();
                    return;
                }

                table.clear();

                $.each(res.data, function (idx, row) {
                    table.row.add([
                        idx + 1,
                        '<span class="badge bg-secondary font-monospace">'
                            + (row.no_reg || '-') + '</span>',
                        '<strong>' + (row.nomor_rm || '-') + '</strong>',
                        '<span class="fw-semibold text-primary">'
                            + (row.nama_pasien || '-') + '</span>',
                        row.nama_dokter  || '-',
                        '<span class="badge bg-info text-dark">'
                            + (row.nama_layanan || '-') + '</span>',
                        '<span class="badge bg-light text-dark border">'
                            + (row.nama_cabang || '-') + '</span>',
                        row.tgl_masuk || '-',
                        '<i class="far fa-clock text-muted me-1"></i>'
                            + (row.waktu || '-')
                    ]);
                });

                table.draw();
            },
            error: function () {
                window.location.reload();
            },
            complete: function () {
                $icon.removeClass('fa-spin');
                $btn.removeClass('disabled').prop('disabled', false);
            }
        });
    });
});
