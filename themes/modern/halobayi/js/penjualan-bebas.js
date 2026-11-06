/**
 * penjualan-bebas.js
 * POS untuk penjualan bebas (walk-in, tanpa pendaftaran).
 * Item: obat (dengan stok FEFO) + tindakan (dengan tarif).
 * Pembayaran: simpan ke halobayi_penjualan + halobayi_penjualan_detail,
 * kurangi stok obat via MutasiStokModel::keluarFefo.
 */
$(document).ready(function() {

    // CSRF refresh
    $(document).ajaxComplete(function(event, xhr) {
        var newToken = xhr.getResponseHeader('X-CSRF-TOKEN');
        if (newToken) {
            $('.csrf_token').val(newToken);
        }
    });

    var baseUrl = $('#base_url').val();
    var keranjang = []; // {jenis, id_barang, nama, qty, harga, satuan}

    // ---------- Helpers ----------

    function rupiah(n) {
        n = Math.round(Number(n) || 0);
        return 'Rp. ' + n.toLocaleString('id-ID');
    }

    function escHtml(s) {
        return $('<div>').text(s === null || s === undefined ? '' : String(s)).html();
    }

    function getCsrfData() {
        var name = $('.csrf_token').attr('name');
        var hash = $('.csrf_token').val();
        var data = {};
        if (name) data[name] = hash;
        return data;
    }

    // ---------- Select2 Obat (AJAX search) ----------

    $('#select-obat').select2({
        theme: 'bootstrap-5',
        placeholder: 'Ketik nama obat...',
        minimumInputLength: 2,
        ajax: {
            url: baseUrl + 'penjualanbebas/searchobat',
            type: 'POST',
            dataType: 'json',
            delay: 300,
            data: function(params) {
                var data = { q: params.term };
                var csrf = getCsrfData();
                $.extend(data, csrf);
                return data;
            },
            processResults: function(data) {
                return {
                    results: data.map(function(item) {
                        return {
                            id: item.id_obat,
                            text: item.nama_obat + ' (Stok: ' + (item.stok_berjalan || 0) + ')',
                            nama: item.nama_obat,
                            // Kolom harga di tabel `obat` bernama harga_jual_satuan
                            // (bukan harga_jual). Sebelumnya salah nama -> undefined
                            // -> keranjang berharga 0 dan nota tercetak Rp 0.
                            harga: Math.round(Number(item.harga_jual_satuan) || 0),
                            satuan: item.nama_satuan || '-',
                            stok: Math.round(Number(item.stok_berjalan) || 0)
                        };
                    })
                };
            },
            cache: false
        }
    });

    // Tampilkan info obat yang dipilih
    $('#select-obat').on('select2:select', function(e) {
        var data = e.params.data;
        $('#obat-info').show();
        $('#obat-stok').html(
            '<strong>' + escHtml(data.nama) + '</strong> &mdash; ' +
            'Harga: ' + rupiah(data.harga) + ', Stok: ' + data.stok +
            ' ' + escHtml(data.satuan)
        );
        $('#obat-qty').val(1).focus();
    });

    // ---------- Tindakan: checklist lab + pencarian AJAX ----------

    // Checklist "Tindakan Lab" menentukan sumber pencarian:
    // dicentang  -> tindakan eksternal (laboratorium)
    // tidak      -> tindakan internal (layanan klinik)
    // (pola yang sama dengan form Tambah Tindakan/Layanan)
    function jenisTindakan() {
        return $('#is_lab').is(':checked') ? 'eksternal' : 'internal';
    }

    // Select2 tindakan TIDAK boleh diinisialisasi saat tab-nya masih
    // tersembunyi: lebar kotak pencarian dihitung dari elemen yang sedang
    // display:none, jadi hasilnya 0 — kotak pencarian menyusut jadi garis
    // tipis dan tidak bisa diketik (tab Obat tidak kena karena terlihat
    // sejak halaman dimuat). Karena itu init ditunda sampai tab Tindakan
    // pertama kali dibuka.
    var selectTindakanSiap = false;

    function initSelectTindakan() {
        if (selectTindakanSiap) return;
        selectTindakanSiap = true;

        $('#select-tindakan').select2({
            theme: 'bootstrap-5',
            placeholder: 'Ketik nama tindakan...',
            minimumInputLength: 0,
            ajax: {
                url: baseUrl + 'penjualanbebas/searchtindakan',
                type: 'POST',
                dataType: 'json',
                delay: 300,
                data: function(params) {
                    var data = { q: params.term || '', jenis: jenisTindakan() };
                    $.extend(data, getCsrfData());
                    return data;
                },
                processResults: function(data) {
                    return {
                        results: data.map(function(item) {
                            return {
                                id: item.kode_tindakan,
                                text: item.nama_tindakan + ' (' + item.kode_tindakan + ')',
                                nama: item.nama_tindakan
                            };
                        })
                    };
                },
                cache: false
            }
        });
    }

    $('#tab-tindakan-btn').on('shown.bs.tab', initSelectTindakan);

    // Untuk-jaga-jaga kalau suatu saat tab Tindakan jadi tab awal.
    if ($('#tab-tindakan').is(':visible')) {
        initSelectTindakan();
    }

    function resetPilihanTindakan() {
        $('#tindakan-info').hide();
        $('#btn-tambah-tindakan').prop('disabled', true).removeData();
    }

    function ambilTarifTindakan(kode) {
        var kodeCabang = $('#kode_cabang').val() || '';
        var requestData = { kode_tindakan: kode, kode_cabang: kodeCabang };
        $.extend(requestData, getCsrfData());

        $.ajax({
            type: 'POST',
            url: baseUrl + 'penjualanbebas/gettariftindakan',
            data: requestData,
            dataType: 'json',
            success: function(response) {
                if (response.status) {
                    var d = response.data;
                    $('#tindakan-info').show();
                    $('#tindakan-tarif').html(
                        '<strong>' + escHtml(d.nama_tindakan) + '</strong> &mdash; ' +
                        'Tarif: ' + rupiah(d.total)
                    );
                    $('#btn-tambah-tindakan')
                        .prop('disabled', false)
                        .data('kode', d.kode_tindakan)
                        .data('nama', d.nama_tindakan)
                        .data('tarif', d.total);
                } else {
                    $('#tindakan-info').show();
                    $('#tindakan-tarif').html('<span class="text-danger">' + escHtml(response.message || 'Tarif tidak ditemukan') + '</span>');
                    $('#btn-tambah-tindakan').prop('disabled', true);
                }
            },
            error: function() {
                $('#tindakan-info').show();
                $('#tindakan-tarif').html('<span class="text-danger">Gagal mengambil tarif</span>');
                $('#btn-tambah-tindakan').prop('disabled', true);
            }
        });
    }

    $('#select-tindakan').on('select2:select', function(e) {
        var data = e.params.data;
        ambilTarifTindakan(data.id);
    });

    $('#select-tindakan').on('change', function() {
        if (!$(this).val() || !$(this).select2('data').length) {
            resetPilihanTindakan();
        }
    });

    // Ganti checklist = ganti daftar sumber, jadi pilihan lama dibuang
    // supaya kode tindakan dari daftar yang sudah tidak berlaku tidak ikut
    // masuk keranjang.
    $('#is_lab').on('change', function() {
        $('#select-tindakan').val(null).trigger('change');
    });

    // ---------- Tambah ke keranjang ----------

    function tambahItem(jenis, idBarang, nama, qty, harga, satuan) {
        // Kalau item sama sudah ada, tambahkan qty-nya
        for (var i = 0; i < keranjang.length; i++) {
            if (keranjang[i].jenis === jenis && keranjang[i].id_barang === idBarang) {
                keranjang[i].qty += qty;
                renderKeranjang();
                return;
            }
        }
        keranjang.push({
            jenis: jenis,
            id_barang: idBarang,
            nama: nama,
            qty: qty,
            harga: harga,
            satuan: satuan || '-'
        });
        renderKeranjang();
    }

    $('#btn-tambah-obat').on('click', function() {
        var data = $('#select-obat').select2('data')[0];
        if (!data || !data.id) {
            Swal.fire('Pilih obat', 'Silakan pilih obat terlebih dahulu', 'warning');
            return;
        }
        var qty = parseInt($('#obat-qty').val()) || 0;
        if (qty <= 0) {
            Swal.fire('Qty tidak valid', 'Jumlah harus lebih dari 0', 'warning');
            return;
        }
        if (data.harga <= 0) {
            Swal.fire('Harga belum diisi', 'Obat ini belum punya harga jual. Lengkapi dulu di Master Farmasi.', 'warning');
            return;
        }
        if (qty > data.stok) {
            Swal.fire('Stok tidak cukup', 'Stok tersedia: ' + data.stok, 'warning');
            return;
        }
        tambahItem('obat', data.id, data.nama, qty, data.harga, data.satuan);

        // Reset pilihan obat
        $('#select-obat').val(null).trigger('change');
        $('#obat-info').hide();
        $('#obat-qty').val(1);
    });

    $('#btn-tambah-tindakan').on('click', function() {
        var kode = $(this).data('kode');
        var nama = $(this).data('nama');
        var tarif = $(this).data('tarif');
        if (!kode || !tarif) return;

        tambahItem('tindakan', kode, nama, 1, tarif, '-');

        // Reset pilihan tindakan (change handler menyembunyikan info & menonaktifkan tombol)
        $('#select-tindakan').val(null).trigger('change');
    });

    // Enter di qty obat = tambah
    $('#obat-qty').on('keydown', function(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            $('#btn-tambah-obat').click();
        }
    });

    // ---------- Render keranjang ----------

    function renderKeranjang() {
        var $body = $('#keranjang-body');
        $body.empty();

        if (keranjang.length === 0) {
            $body.html('<tr><td colspan="6" class="text-center text-muted small">Keranjang kosong</td></tr>');
            $('#btn-bayar').prop('disabled', true);
        } else {
            var subtotal = 0;
            $.each(keranjang, function(i, item) {
                var sub = item.qty * item.harga;
                subtotal += sub;
                var badge = item.jenis === 'obat'
                    ? '<span class="badge bg-info">Obat</span>'
                    : '<span class="badge bg-primary">Tindakan</span>';
                $body.append(
                    '<tr>' +
                    '<td>' + (i + 1) + '</td>' +
                    '<td>' + badge + ' ' + escHtml(item.nama) + '</td>' +
                    '<td><input type="number" class="form-control form-control-sm qty-edit" data-idx="' + i + '" value="' + item.qty + '" min="1" style="width: 55px;" /></td>' +
                    '<td class="text-end">' + rupiah(item.harga) + '</td>' +
                    '<td class="text-end">' + rupiah(sub) + '</td>' +
                    '<td class="text-center"><button class="btn btn-sm btn-outline-danger btn-hapus" data-idx="' + i + '"><i class="fa fa-times"></i></button></td>' +
                    '</tr>'
                );
            });
            $('#btn-bayar').prop('disabled', false);
        }

        // Hitung diskon & total
        var diskon = parseInt(String($('#diskon').val()).replace(/[^0-9]/g, '')) || 0;
        if (diskon > subtotal) diskon = subtotal;
        var total = subtotal - diskon;

        $('#footer-subtotal').text(rupiah(subtotal));
        $('#footer-diskon').text(rupiah(diskon));
        $('#footer-total').text(rupiah(total));
    }

    // Edit qty di keranjang
    $(document).on('change', '.qty-edit', function() {
        var idx = $(this).data('idx');
        var qty = parseInt($(this).val()) || 1;
        if (qty < 1) qty = 1;
        keranjang[idx].qty = qty;
        renderKeranjang();
    });

    // Hapus item dari keranjang
    $(document).on('click', '.btn-hapus', function() {
        var idx = $(this).data('idx');
        keranjang.splice(idx, 1);
        renderKeranjang();
    });

    // Diskon input
    $('#diskon').on('keyup', function() {
        renderKeranjang();
    });

    // ---------- Pembayaran ----------

    $('#btn-bayar').on('click', function() {
        if (keranjang.length === 0) {
            Swal.fire('Keranjang kosong', 'Tambah item terlebih dahulu', 'warning');
            return;
        }

        var namaCustomer = $('#nama_customer').val().trim() || 'Umum';
        var diskon = parseInt(String($('#diskon').val()).replace(/[^0-9]/g, '')) || 0;
        var kodeCabang = $('#kode_cabang').val() || 'BU';

        var items = keranjang.map(function(item) {
            return {
                jenis: item.jenis,
                id_barang: String(item.id_barang),
                nama: item.nama,
                qty: item.qty,
                harga: item.harga,
                satuan: item.satuan
            };
        });

        var requestData = {
            items: JSON.stringify(items),
            nama_customer: namaCustomer,
            id_pasien: 0,
            diskon: diskon,
            kode_cabang: kodeCabang
        };
        $.extend(requestData, getCsrfData());

        Swal.fire({
            title: 'Proses Pembayaran',
            text: 'Apakah Anda yakin ingin memproses pembayaran ini?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Bayar',
            cancelButtonText: 'Batal'
        }).then(function(result) {
            if (!result.isConfirmed) return;

            Swal.fire({
                title: 'Memproses...',
                allowOutsideClick: false,
                didOpen: function() { Swal.showLoading(); }
            });

            $.ajax({
                type: 'POST',
                url: baseUrl + 'penjualanbebas/bayar',
                data: requestData,
                dataType: 'json',
                success: function(response) {
                    if (response.status) {
                        Swal.fire({
                            title: 'Berhasil!',
                            html: 'Pembayaran berhasil.<br>No. Nota: <b>' + escHtml(response.no_invoice) + '</b><br>Total: ' + rupiah(response.total_dibayar),
                            icon: 'success',
                            showCancelButton: true,
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#6c757d',
                            confirmButtonText: '<i class="fa fa-print"></i> Cetak Nota',
                            cancelButtonText: 'Tutup'
                        }).then(function(r) {
                            if (r.isConfirmed) {
                                cetakNota(response.no_invoice);
                            }
                            // Reset keranjang
                            keranjang = [];
                            renderKeranjang();
                            $('#nama_customer').val('');
                            $('#diskon').val('0');
                        });
                    } else {
                        var msg = response.message;
                        if (Array.isArray(msg)) msg = msg.join('<br>');
                        Swal.fire('Gagal!', msg || 'Pembayaran gagal', 'error');
                    }
                },
                error: function() {
                    Swal.fire('Error!', 'Terjadi kesalahan saat memproses pembayaran', 'error');
                }
            });
        });
    });

    // ---------- Cetak Nota ----------

    function cetakNota(noInvoice) {
        var isAndroid = /android/i.test(navigator.userAgent) ||
            (navigator.userAgentData && /android/i.test(navigator.userAgentData.platform || ''));

        if (!isAndroid) {
            window.open(baseUrl + 'penjualanbebas/nota?no_invoice=' + encodeURIComponent(noInvoice), '_blank');
            return;
        }

        $.ajax({
            type: 'GET',
            url: baseUrl + 'penjualanbebas/notaRawbt',
            data: { no_invoice: noInvoice },
            dataType: 'json',
            cache: false,
            success: function(response) {
                if (response.status) {
                    var intentUrl = 'intent:base64,' + response.data + '#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;';
                    var a = document.createElement('a');
                    a.href = intentUrl;
                    a.target = '_blank';
                    a.rel = 'noopener';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                }
            }
        });
    }

    // Init
    renderKeranjang();
});
