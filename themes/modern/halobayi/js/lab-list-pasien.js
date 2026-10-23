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
     * Inisialisasi DataTables Server-Side
     * ================================================================ */
    var table = $table.DataTable({
        processing:  true,
        serverSide:  true,
        searchDelay: 500,
        ajax: {
            url:  ajaxUrl,
            type: 'GET',
            data: function (d) {
                d.startDate = $('#startDate').val() || $('#filter-startDate').val() || '';
                d.endDate   = $('#endDate').val() || $('#filter-endDate').val() || '';
                d.lokasi    = $('#cabang').val() || '';
                d.nik       = $('#nik').val() || '';
            }
        },
        order: [[7, 'desc']], /* Default urutkan Tgl Masuk terbaru */
        columns: [
            {
                data: null,
                orderable: false,
                searchable: false,
                className: 'text-center',
                render: function (data, type, row, meta) {
                    return meta.row + meta.settings._iDisplayStart + 1;
                }
            },
            {
                data: 'no_reg',
                className: 'text-nowrap',
                render: function (data) {
                    return '<span class="badge bg-secondary font-monospace">' + (data || '-') + '</span>';
                }
            },
            {
                data: 'nomor_rm',
                className: 'text-nowrap',
                render: function (data) {
                    return '<strong>' + (data || '-') + '</strong>';
                }
            },
            {
                data: 'nama_pasien',
                render: function (data) {
                    return '<span class="fw-semibold text-primary">' + (data || '-') + '</span>';
                }
            },
            {
                data: 'nama_dokter',
                render: function (data) {
                    return data || '-';
                }
            },
            {
                data: 'nama_layanan',
                render: function (data) {
                    return '<span class="badge bg-info text-dark">' + (data || '-') + '</span>';
                }
            },
            {
                data: 'nama_cabang',
                render: function (data) {
                    return '<span class="badge bg-light text-dark border">' + (data || '-') + '</span>';
                }
            },
            {
                data: 'tgl_masuk',
                className: 'text-nowrap',
                render: function (data) {
                    return data || '-';
                }
            },
            {
                data: 'waktu',
                className: 'text-nowrap',
                render: function (data) {
                    return '<i class="far fa-clock text-muted me-1"></i>' + (data || '-');
                }
            },
            {
                data: 'status_layanan',
                className: 'text-center text-nowrap',
                render: function (data) {
                    var st = String(data || '').toLowerCase();
                    var badgeClass = 'secondary';
                    if (st === 'dokter')       { badgeClass = 'primary'; }
                    else if (st === 'selesai') { badgeClass = 'success'; }
                    else if (st === 'satset')  { badgeClass = 'warning text-dark'; }
                    else if (st === 'absen')   { badgeClass = 'info text-dark'; }
                    else if (st === 'failed')  { badgeClass = 'danger'; }
                    else if (st === 'daftar')  { badgeClass = 'secondary'; }
                    return '<span class="badge bg-' + badgeClass + ' text-capitalize">' + (data || '-') + '</span>';
                }
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                className: 'text-center text-nowrap',
                render: function (data, type, row) {
                    var appBaseUrl = (typeof base_url !== 'undefined' ? base_url : $('#dataTables-url').text().replace(/lab\/getDataDT.*$/, ''));
                    var noReg = encodeURIComponent(row.no_reg || '');
                    var urlTindakan = appBaseUrl + 'tindakandokter/add?no_reg=' + noReg + '&form=layanan';
                    var urlHasilLab = appBaseUrl + 'lab/input-hasil?no_reg=' + noReg;

                    return '<div class="d-inline-flex gap-1">' +
                        '<a href="' + urlTindakan + '" class="btn btn-xs btn-primary text-nowrap" title="Input Tindakan">' +
                            '<i class="fas fa-stethoscope me-1"></i>Input Tindakan' +
                        '</a>' +
                        '<a href="' + urlHasilLab + '" class="btn btn-xs btn-success text-nowrap" title="Input Hasil Lab">' +
                            '<i class="fas fa-flask me-1"></i>Input Hasil Lab' +
                        '</a>' +
                    '</div>';
                }
            }
        ],
        pageLength: 10,
        lengthMenu: [
            [10, 25, 50, 100],
            ['10', '25', '50', '100']
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
            processing:     '<i class="fa fa-spinner fa-spin fa-fw me-1"></i> Memuat data...',
            search:         'Cari Pasien:',
            searchPlaceholder: 'Ketik No. Reg / Nama / RM...',
            lengthMenu:     'Tampilkan _MENU_ data',
            info:           'Menampilkan _START_ – _END_ dari _TOTAL_ pasien',
            infoEmpty:      'Menampilkan 0 sampai 0 dari 0 pasien',
            infoFiltered:   '(disaring dari _MAX_ total pasien)',
            zeroRecords:    'Tidak ditemukan data pasien yang sesuai',
            emptyTable:     'Belum ada data pasien di tabel pendaftaran',
            paginate: {
                first:    'Awal',
                last:     'Akhir',
                next:     'Berikutnya',
                previous: 'Sebelumnya'
            }
        }
    });

    /* ================================================================
     * Inisialisasi Komponen Pencarian (Select2, Datepicker, Typeahead)
     * ================================================================ */
    if ($.fn.select2) {
        $('.select2, #cabang').select2({
            placeholder: 'Pilih Cabang',
            theme: 'bootstrap-5',
            allowClear: true,
        });
    }

    if ($.fn.datepicker) {
        $('.date-picker').datepicker({
            format: 'dd-mm-yyyy',
            weekStart: 1,
            language: 'id',
            autoclose: true,
            todayHighlight: true
        });
    }

    var tokenHash = $('input[name=csrf_test_name]').val() || '';
    if ($.fn.typeahead && $('.cariDokter').length) {
        $('.cariDokter').typeahead(
            {
                hint: true,
                highlight: true,
                minLength: 1,
            },
            {
                display: function (item) {
                    return item.value;
                },
                limit: 12,
                async: true,
                templates: {
                    empty: '<div class="d-flex justify-content-center p-2 text-muted">Data Dokter Tidak Ada!</div>',
                    suggestion: function (item) {
                        return '<div class="px-2 py-1">' + item.value + '</div>';
                    },
                },
                source: function (query, processSync, processAsync) {
                    var appBaseUrl = (typeof base_url !== 'undefined' ? base_url : $('#dataTables-url').text().replace(/lab\/getDataDT.*$/, ''));
                    return $.ajax({
                        url: appBaseUrl + 'master/dokter/typeahead',
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            max_rows: 15,
                            q: query,
                        },
                        beforeSend: function (xhr) {
                            if (tokenHash) {
                                xhr.setRequestHeader('X-CSRF-Token', tokenHash);
                            }
                        },
                        success: function (data) {
                            var return_list = [],
                                i = data.length;
                            while (i--) {
                                return_list[i] = {
                                    id: data[i].nik,
                                    value: data[i].nik + ' - ' + data[i].nama_pegawai,
                                    nama_pegawai: data[i].nama_pegawai,
                                    nik: data[i].nik,
                                };
                            }
                            return processAsync(return_list);
                        },
                    });
                },
            }
        ).on('typeahead:selected', function ($e, datum) {
            $('#nama_pegawai').val(datum.nama_pegawai);
            $('#nik').val(datum.nik);
        });

        $('.cariDokter').on('input typeahead:change', function () {
            if ($(this).val().trim() === '') {
                $('#nik').val('');
            }
        });
    }

    /* ================================================================
     * Event Filter Pencarian
     * ================================================================ */
    $('#form-filter-lab, #form-pendaftaran').on('submit', function (e) {
        e.preventDefault();
        table.ajax.reload();
    });

    $('#cabang').on('change', function () {
        table.ajax.reload();
    });

    /* ================================================================
     * Tombol Muat Ulang — reload data via AJAX (tetap di halaman aktif)
     * ================================================================ */
    $('#btn-refresh-pasien').on('click', function (e) {
        e.preventDefault();

        var $btn  = $(this);
        var $icon = $btn.find('i');
        $icon.addClass('fa-spin');
        $btn.addClass('disabled').prop('disabled', true);

        table.ajax.reload(function () {
            $icon.removeClass('fa-spin');
            $btn.removeClass('disabled').prop('disabled', false);
        }, false);
    });
});
