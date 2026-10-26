$(document).ready(function() {

    /* Perbarui token CSRF setiap kali selesai AJAX. Server mengirim token baru*/
    /* lewat header X-CSRF-TOKEN karena regenerate=true di Config\Security,*/
    /* sehingga token lama di halaman menjadi tidak valid setelah 1x POST.*/
    $(document).ajaxComplete(function(event, xhr) {
        var newToken = xhr.getResponseHeader('X-CSRF-TOKEN');
        if (newToken) {
            $('.csrf_token').val(newToken);
        }
    });

    /* Jenis diskon menentukan satuan input: nominal = Rupiah, persentase = % dari tagihan.*/
    /* Nilai yang dikirim ke server tetap nominal rupiah (diskon*Kalkulasi).*/
    function jenisDiskonPersentase() {
        return $("#jenis_diskon").val() === 'persentase';
    }

    function angkaDiskon(selector) {
        return parseFloat(String($(selector).val()).replace(/[^0-9]/g, '')) || 0;
    }

    /* Tulis ulang isi input sesuai satuan yang berlaku (Rp. 10.000 atau 10)*/
    function formatInputDiskon(el) {
        if (jenisDiskonPersentase()) {
            var persen = parseFloat(String(el.value).replace(/[^0-9]/g, '')) || 0;
            if (persen > 100) persen = 100;
            el.value = el.value === '' ? '' : String(persen);
        } else {
            el.value = formatRupiah(el.value, "Rp. ");
        }
    }

    function hitungTotalDiskon() {
        var totalTagihan = parseFloat($("#totalTagihan").val()) || 0;
        var persentase = jenisDiskonPersentase();
        var inputKlinik = angkaDiskon("#diskonKlinik");
        var inputDokter = angkaDiskon("#diskonDokter");
        var valKlinik, valDokter;

        if (persentase) {
            if (inputKlinik > 100) inputKlinik = 100;
            if (inputDokter > 100) inputDokter = 100;
            valKlinik = Math.round(totalTagihan * inputKlinik / 100);
            valDokter = Math.round(totalTagihan * inputDokter / 100);
        } else {
            valKlinik = inputKlinik;
            valDokter = inputDokter;
        }

        /* Diskon tidak boleh melebihi tagihan: pangkas mulai dari diskon dokter*/
        if (valKlinik > totalTagihan) valKlinik = totalTagihan;
        if (valKlinik + valDokter > totalTagihan) valDokter = totalTagihan - valKlinik;

        var totalDiskon = valKlinik + valDokter;
        var totalBayar = totalTagihan - totalDiskon;

        $("#diskonKlinikKalkulasi").val(valKlinik);
        $("#diskonDokterKalkulasi").val(valDokter);

        var teksDiskon = totalDiskon > 0 ? formatRupiah(String(totalDiskon), "Rp. ") : "0";
        var totalPersen = totalTagihan > 0 ? Math.round(totalDiskon / totalTagihan * 1000) / 10 : 0;
        $("#totale").text(persentase && totalPersen > 0 ? teksDiskon + ' (' + totalPersen + '%)' : teksDiskon);
        $("#footerDiskon").text(teksDiskon);
        $("#totalBayar").text(formatRupiah(String(totalBayar), "Rp. "));
    }

    /* Ganti jenis diskon: ubah label satuan dan hitung ulang dari angka yang sudah diketik*/
    $("#jenis_diskon").on("change", function() {
        var label = jenisDiskonPersentase() ? '%' : 'Rupiah';
        $("#satuanDiskonKlinik, #satuanDiskonDokter").text(label);
        $("#diskonKlinik").attr('placeholder', jenisDiskonPersentase() ? 'Diskon Klinik (%)' : 'Diskon Klinik');
        $("#diskonDokter").attr('placeholder', jenisDiskonPersentase() ? 'Diskon Dokter (%)' : 'Diskon Dokter');
        /* Kosongkan isian supaya angka rupiah tidak terbaca sebagai persen (atau sebaliknya)*/
        $("#diskonKlinik, #diskonDokter").val('');
        hitungTotalDiskon();
    }).trigger("change");

    $("#diskonKlinik").on("keyup", function() {
        formatInputDiskon(this);
        hitungTotalDiskon();
    });

    $("#diskonDokter").on("keyup", function() {
        formatInputDiskon(this);
        hitungTotalDiskon();
    });

    /* State ringkasan tagihan terakhir dari server. Dipakai untuk memutuskan
       tombol mana yang tampil dan berapa nominal yang masih harus dibayar.
       Nilai awal diambil dari input tersembunyi (dirender server) supaya tetap
       benar bila AJAX tagihan gagal. */
    var tagihanState = {
        total: 0,
        terbayar: 0,
        belum: Number($("#total_belum_hidden").val()) || 0,
        jumlah_belum: Number($("#jumlah_belum_hidden").val()) || 0,
        jumlah_terbayar: 0,
        status_bayar: $("#status_bayar_hidden").val() || '',
        no_invoice: $("#no_invoice_hidden").val() || ''
    };

    function rupiah(n) {
        return formatRupiah(String(Math.round(Number(n) || 0)), "Rp. ");
    }

    function escHtml(s) {
        return $('<div>').text(s === null || s === undefined ? '' : String(s)).html();
    }

    /* Tampilkan / sembunyikan tombol sesuai sisa tagihan.
       Flag pendaftaran "lunas" saja TIDAK cukup: dokter bisa menambahkan
       tindakan setelah pasien membayar, dan item itu belum bertanda terbayar.
       Karena itu penentunya jumlah_belum, bukan status_bayar. */
    function sinkronTombolBayar() {
        var adaBelum = tagihanState.jumlah_belum > 0;

        $("#konfirmasi-pembayaran").toggle(adaBelum);
        $("#cetak-nota").toggle(!!tagihanState.no_invoice);

        if (adaBelum && tagihanState.status_bayar === 'lunas') {
            if (!$("#badge-tagihan-baru").length) {
                $("#konfirmasi-pembayaran").append(
                    ' <span class="badge bg-light text-dark ms-1" id="badge-tagihan-baru"></span>'
                );
            }
            $("#badge-tagihan-baru").text(tagihanState.jumlah_belum + ' item baru');
        } else {
            $("#badge-tagihan-baru").remove();
        }
    }

    /* Nominal di halaman selalu dihitung dari SISA tagihan, bukan seluruh
       baris: item yang sudah terbayar tidak boleh ikut didiskon/ditagih. */
    function renderRingkasan() {
        $("#ringkasanTotal").text(rupiah(tagihanState.total));
        $("#ringkasanTerbayar").text(rupiah(tagihanState.terbayar));
        $("#ringkasanBelum").text(rupiah(tagihanState.belum));

        $("#totalTagihan").val(tagihanState.belum);
        $("#footerTagihan").text(rupiah(tagihanState.belum));

        hitungTotalDiskon();
        sinkronTombolBayar();
    }

    /* Memuat detail komponen tagihan (#tb_komponen_tagihan) via AJAX*/
    function loadKomponenTagihan() {
        var $table = $("#tb_komponen_tagihan");
        if (!$table.length) return;

        var $tbody = $table.find("tbody");
        var no_reg = $("#noreg_hidden").val();

        var requestData = { no_reg: no_reg };
        var csrfName = $('.csrf_token').attr('name');
        var csrfHash = $('.csrf_token').val();
        if (csrfName) {
            requestData[csrfName] = csrfHash;
        }

        $tbody.html('<tr><td colspan="8" class="text-center"><i class="fa fa-spin fa-spinner"></i> Memuat data tagihan...</td></tr>');

        $.ajax({
            type: "POST",
            url: window.location.origin + "/kasir/ajaxdatabayar",
            data: requestData,
            dataType: "json",
            success: function(response) {
                /* Server membalas {status, data, ringkasan, bayar}. Bentuk
                   array langsung tetap diterima agar tidak pecah bila ada
                   pemanggil lain. */
                var rows = [];
                if (Array.isArray(response)) {
                    rows = response;
                } else if (response && Array.isArray(response.data)) {
                    rows = response.data;
                }

                var ringkasan = (response && response.ringkasan) || {};
                var bayar = (response && response.bayar) || {};

                tagihanState = {
                    total: Number(ringkasan.total) || 0,
                    terbayar: Number(ringkasan.terbayar) || 0,
                    belum: Number(ringkasan.belum) || 0,
                    jumlah_belum: Number(ringkasan.jumlah_belum) || 0,
                    jumlah_terbayar: Number(ringkasan.jumlah_terbayar) || 0,
                    status_bayar: bayar.status_bayar || $("#status_bayar_hidden").val() || '',
                    no_invoice: bayar.no_invoice || $("#no_invoice_hidden").val() || ''
                };

                /* Segarkan hidden input agar handler lain memakai data terbaru */
                $("#status_bayar_hidden").val(tagihanState.status_bayar);
                $("#no_invoice_hidden").val(tagihanState.no_invoice);

                $tbody.empty();

                if (!rows.length) {
                    $tbody.html('<tr><td colspan="8" class="text-center">Tidak ada data tagihan.</td></tr>');
                } else {
                    $.each(rows, function(i, row) {
                        var hargaJual = parseFloat(row.harga_jual) || 0;
                        var total = parseFloat(row.total) || 0;
                        var terbayar = !!row.sudah_terbayar;

                        /* Kolom Keterangan: penanda item mana yang sudah masuk
                           nota sebelumnya (mis. tindakan lama setelah dokter
                           menambahkan layanan baru). */
                        var keterangan = terbayar
                            ? '<span class="badge bg-success"><i class="fa fa-check"></i> Sudah Terbayar</span>'
                            : '<span class="badge bg-warning text-dark">Belum Terbayar</span>';

                        if (terbayar && row.no_invoice_terbayar) {
                            keterangan += '<div class="small text-muted">' + escHtml(row.no_invoice_terbayar) + '</div>';
                        }

                        var tr = '<tr' + (terbayar ? ' class="table-light text-muted"' : '') + '>' +
                            '<td>' + (i + 1) + '</td>' +
                            '<td>' + escHtml(row.nama_order || '-') + '</td>' +
                            '<td>' + escHtml(row.nama_dokter || '-') + '</td>' +
                            '<td>' + escHtml(row.satuan || '-') + '</td>' +
                            '<td>' + escHtml(row.jml_order || 0) + '</td>' +
                            '<td>' + rupiah(hargaJual) + '</td>' +
                            '<td>' + rupiah(total) + '</td>' +
                            '<td>' + keterangan + '</td>' +
                            '</tr>';
                        $tbody.append(tr);
                    });
                }

                renderRingkasan();
            },
            error: function(xhr, status, error) {
                $tbody.html('<tr><td colspan="8" class="text-center text-danger">Gagal memuat data tagihan.</td></tr>');
            }
        });
    }

    loadKomponenTagihan();

    /* Pilihan setelah tagihan lunas: cetak nota (PDF) atau kirim nota ke WhatsApp pasien*/
    function pilihanNota(noInvoice, judul, pesan) {
        if (!noInvoice) {
            Swal.fire('Nota tidak ditemukan', 'Tagihan sudah lunas, tetapi nomor nota tidak ditemukan.', 'warning');
            return;
        }
        Swal.fire({
            title: judul || 'Tagihan Sudah Lunas',
            html: (pesan ? pesan + '<br>' : '') + 'No. Nota: <b>' + $('<div>').text(noInvoice).html() + '</b>',
            icon: 'success',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            denyButtonColor: '#25D366',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="fa fa-print"></i> Cetak ke Printer',
            denyButtonText: '<i class="fab fa-whatsapp"></i> Kirim ke WhatsApp',
            cancelButtonText: 'Tutup'
        }).then(function(result) {
            if (result.isConfirmed) {
                cetakNotaRawbt(noInvoice);
            } else if (result.isDenied) {
                kirimNotaWa(noInvoice);
            }
        });
    }

    /* Cetak nota langsung ke printer thermal via aplikasi Android RawBT (lihat vendors/rawbt).
       Di perangkat non-Android (tanpa RawBT) tetap membuka nota PDF.*/
    function cetakNotaRawbt(noInvoice) {
        /* Deteksi Android. Sebagian tablet Android memakai UA "desktop mode" tanpa kata "android",
           jadi cek juga userAgentData.platform dan indikator Linux+touch sebagai fallback.*/
        var uaData = navigator.userAgentData;
        var isAndroid = /android/i.test(navigator.userAgent) ||
            (uaData && /android/i.test(uaData.platform || '')) ||
            (/\blinux\b/i.test(navigator.userAgent) && 'ontouchstart' in window && !/windows|macintosh|cros/i.test(navigator.userAgent));
        if (!isAndroid) {
            /* Buka nota lewat klik tombol (gesture) agar tidak diblokir popup blocker*/
            window.open(window.location.origin + '/kasir/generateNotaBayar?no_invoice=' + encodeURIComponent(noInvoice), '_blank');
            return;
        }

        $.ajax({
            type: "GET",
            url: window.location.origin + "/kasir/notaRawbt",
            data: { no_invoice: noInvoice },
            dataType: "json",
            cache: false,
            success: function(response) {
                if (!response.status) {
                    Swal.fire('Gagal!', response.message, 'error');
                    return;
                }
                /* Di PWA standalone, mengganti location.href ke intent: gagal senyap.
                   Gunakan anchor _blank agar intent diserahkan ke browser/OS.*/
                var intentUrl = 'intent:base64,' + response.data + '#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;';
                var a = document.createElement('a');
                a.href = intentUrl;
                a.target = '_blank';
                a.rel = 'noopener';
                document.body.appendChild(a);
                a.click();
                a.remove();
            },
            error: function() {
                Swal.fire('Error!', 'Terjadi kesalahan saat menyiapkan nota untuk printer.', 'error');
            }
        });
    }

    function kirimNotaWa(noInvoice) {
        var requestData = { no_invoice: noInvoice };
        requestData[$('.csrf_token').attr('name')] = $('.csrf_token').val();

        Swal.fire({
            title: 'Mengirim nota...',
            allowOutsideClick: false,
            didOpen: function() { Swal.showLoading(); }
        });

        $.ajax({
            type: "POST",
            url: window.location.origin + "/kasir/kirimNotaWa",
            data: requestData,
            dataType: "json",
            success: function(response) {
                Swal.fire(response.status ? 'Terkirim!' : 'Gagal!', response.message, response.status ? 'success' : 'error');
            },
            error: function() {
                Swal.fire('Error!', 'Terjadi kesalahan saat mengirim nota ke WhatsApp.', 'error');
            }
        });
    }

    /* Tombol cetak/kirim nota selalu tersedia bila pendaftaran sudah pernah
       dibayar, termasuk saat masih ada tagihan tambahan yang belum dibayar. */
    $("#cetak-nota").on("click", function() {
        pilihanNota($("#no_invoice_hidden").val());
    });

    $("#konfirmasi-pembayaran").on("click", function() {
        /* Tidak ada sisa tagihan: tidak ada yang perlu dibayar, langsung ke nota. */
        if (tagihanState.jumlah_belum <= 0) {
            pilihanNota($("#no_invoice_hidden").val());
            return;
        }

        var no_reg = $("#noreg_hidden").val();
        var id_pasien = $("#id_pasien_hidden").val();
        var diskonKlinik = $("#diskonKlinikKalkulasi").val() || 0;
        var diskonDokter = $("#diskonDokterKalkulasi").val() || 0;

        var csrfName = $('.csrf_token').attr('name');
        var csrfHash = $('.csrf_token').val();

        var requestData = {
            no_reg: no_reg,
            id_pasien: id_pasien,
            diskonKlinik: diskonKlinik,
            diskonDokter: diskonDokter
        };
        requestData[csrfName] = csrfHash;

        /* Pendaftaran sudah lunas tetapi ada item baru: beri konteks bahwa
           yang dibayar hanya tagihan tambahan, bukan seluruh tagihan. */
        var pesanKonfirmasi = "Apakah Anda yakin ingin memproses pembayaran ini?";
        if (tagihanState.status_bayar === 'lunas' && tagihanState.jumlah_terbayar > 0) {
            pesanKonfirmasi = "Pendaftaran ini sudah pernah dibayar. Yang diproses sekarang hanya "
                + tagihanState.jumlah_belum + " item baru sebesar " + rupiah(tagihanState.belum) + ".";
        }

        Swal.fire({
            title: 'Konfirmasi Pembayaran',
            text: pesanKonfirmasi,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Proses',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: "POST",
                    url: window.location.origin + "/kasir/konfirmasipembayaran",
                    data: requestData,
                    dataType: "json",
                    success: function(response) {
                        if (response.status) {
                            /* Tandai lunas di halaman supaya klik berikutnya langsung ke pilihan nota*/
                            $("#status_bayar_hidden").val('lunas');
                            $("#no_invoice_hidden").val(response.no_invoice);

                            /* Diskon sudah dipakai pada nota ini; kosongkan agar
                               tidak ikut terpakai lagi saat ada tagihan berikutnya. */
                            $("#diskonKlinik, #diskonDokter").val('');
                            $("#diskonKlinikKalkulasi, #diskonDokterKalkulasi").val(0);

                            /* Muat ulang tabel: item yang baru dibayar harus
                               berubah keterangannya menjadi "Sudah Terbayar". */
                            loadKomponenTagihan();

                            pilihanNota(response.no_invoice, 'Berhasil!', response.message);
                        } else {
                            Swal.fire(
                                'Gagal!',
                                response.message,
                                'error'
                            );
                        }
                    },
                    error: function(xhr, status, error) {
                        Swal.fire(
                            'Error!',
                            'Terjadi kesalahan saat memproses pembayaran.',
                            'error'
                        );
                    }
                });
            }
        });
    });

});



/* Fungsi formatRupiah 
 * source: https://malasngoding.github.io/format-rupiah-javascript/
*/
function formatRupiah(angka, prefix){
	var number_string = angka.replace(/[^,\d]/g, '').toString(),
	split   		= number_string.split(','),
	sisa     		= split[0].length % 3,
	rupiah     		= split[0].substr(0, sisa),
	ribuan     		= split[0].substr(sisa).match(/\d{3}/gi);
 
	/* tambahkan titik jika yang di input sudah menjadi angka ribuan*/
	if(ribuan){
		separator = sisa ? '.' : '';
		rupiah += separator + ribuan.join('.');
	}
 
	rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
	return prefix == undefined ? rupiah : (rupiah ? 'Rp. ' + rupiah : '');
}


function kembali() {
    window.location.href = (base_url + "/penjualan/index");
}

function kembalikasir() {
    window.location.href = (base_url + "/kasir/home");
}

function tampildatatemppenjualan() {
    console.log('ah oh ah');
    /* $.ajax({*/
    /*     type: "post",*/
    /*     url: "https://sim.halobayi.co.id/kasir/tampildatatemp",*/
    /*     data: {*/
    /*         jualfaktur: $('#faktur').val(),*/
    /*         diskonmember: $('#diskonmember').val()*/
    /*     },*/
    /*     beforeSend: function() {*/
    /*         $('.viewtampildetailtemp').html('<i class="fa fa-spin fa-spinner"></i> Tunggu').show();*/
    /*     },*/
    /*     success: function(response) {*/
    /*         $('.viewtampildetailtemp').html(response).show();*/
    /*         $('#kode').focus();*/
    /*     },*/
    /*     error: function(xhr, ajaxOptions, thrownError) {*/
    /*         alert(xhr.status + "\n" + xhr.responseText + "\n" +*/
    /*             thrownError);*/
    /*     }*/
    /* });*/
}
$(document).ready(function() {
    tampildatatemppenjualan();

    $('#kodemember').click(function(e) {
        e.preventDefault();
        $(this).prop('readonly', false);
    });
    $('#kodemember').keydown(function(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            let kodemember = $(this).val();

            console.log('detail member: ', e.keyCode)

            /* $.ajax({*/
            /*     type: "post",*/
            /*     url: "https://sim.halobayi.co.id/kasir/detaildatamember",*/
            /*     data: {*/
            /*         kodemember: kodemember*/
            /*     },*/
            /*     dataType: "json",*/
            /*     cache: false,*/
            /*     success: function(response) {*/
            /*         if (response.sukses) {*/
            /*             $('#kodemember').prop('readonly', true);*/
            /*             $('#namamember').val(response.sukses.namamember);*/
            /*             $('#diskonmember').val(response.sukses.diskonmember);*/
            /*             $('#tabunganmember').val(response.sukses.tabunganmember);*/
            /*             tampildatatemppenjualan();*/
            /*         }*/
            /*         if (response.error) {*/
            /*             $.toast({*/
            /*                 heading: 'Maaf',*/
            /*                 text: response.error,*/
            /*                 showHideTransition: 'slide',*/
            /*                 icon: 'error',*/
            /*                 position: 'top-right'*/
            /*             });*/
            /*             $('#kodemember').val('');*/
            /*             $('#namamember').val('');*/
            /*         }*/
            /*     },*/
            /*     error: function(xhr, ajaxOptions, thrownError) {*/
            /*         alert(xhr.status + "\n" + xhr.responseText + "\n" + thrownError);*/
            /*     }*/
            /* });*/
        }
    });

    $(this).keydown(function(e) {
        if (e.keyCode == 114) { /*Press F3 cari Member*/

            console.log('Cari Member: ', e)
            /* e.preventDefault();*/
            /* $.ajax({*/
            /*     url: "https://sim.halobayi.co.id/kasir/carimember",*/
            /*     success: function(response) {*/
            /*         $('.viewmodal').html(response).show();*/
            /*         const element = document.querySelector('#modalcarimember');*/
            /*         element.classList.add('animated', 'zoomIn');*/
            /*         $('#modalcarimember').modal('show');*/
            /*     },*/
            /*     error: function(xhr, ajaxOptions, thrownError) {*/
            /*         alert(xhr.status + "\n" + xhr.responseText + "\n" + thrownError);*/
            /*     }*/
            /* });*/
        }
    });

    $(this).keydown(function(e) {
        if (e.keyCode == 119) { /*Press F8*/
            e.preventDefault();

            transaksipembayaran();
        }
    });

    $(this).keydown(function(e) {
        if (e.keyCode == 115) { /* Press F4*/
            e.preventDefault();
            Swal.fire({
                title: `Batal Transaksi`,
                text: `Yakin membatalkan transaksi ?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya',
                cancelButtonText: 'Tidak'
            }).then((result) => {
                if (result.value) { console.log('Batal Transaksi: ', result)
                    /* $.ajax({*/
                    /*     type: "post",*/
                    /*     url: "https://sim.halobayi.co.id/kasir/bataltransaksi",*/
                    /*     data: {*/
                    /*         faktur: $('#faktur').val()*/
                    /*     },*/
                    /*     dataType: "json",*/
                    /*     success: function(response) {*/
                    /*         if (response.sukses) {*/
                    /*             Swal.fire({*/
                    /*                 position: 'top-center',*/
                    /*                 icon: 'success',*/
                    /*                 title: response.sukses,*/
                    /*                 showConfirmButton: false,*/
                    /*                 timer: 1000,*/
                    /*                 timerProgressBar: true,*/
                    /*             }).then((result) => {*/
                    /*                 window.location.reload();*/
                    /*             })*/
                    /*         } else {*/
                    /*             $.toast({*/
                    /*                 heading: 'Maaf',*/
                    /*                 text: response.error,*/
                    /*                 showHideTransition: 'slide',*/
                    /*                 icon: 'error',*/
                    /*                 position: 'top-right'*/
                    /*             });*/
                    /*         }*/

                    /*     },*/
                    /*     error: function(xhr, ajaxOptions, thrownError) {*/
                    /*         alert(xhr.status + "\n" + xhr.responseText + "\n" +*/
                    /*             thrownError);*/
                    /*     }*/
                    /* });*/
                }
            })
        }
    });

    /*Holding Transaksi Press F9*/
    $(this).keydown(function(e) {
        if (e.keyCode == 120) {
            e.preventDefault();
            holdingtransaksi();
        }
    });

    /* Menampilkan Transaksi di Tanan F10*/
    $(this).keydown(function(e) {
        if (e.keyCode == 121) { console.log('f10')
            /* e.preventDefault();*/
            /* $.ajax({*/
            /*     url: "https://sim.halobayi.co.id/kasir/data-transaksi-ditahan",*/
            /*     dataType: "json",*/
            /*     success: function(response) {*/
            /*         $('.viewmodaltransaksiditahan').html(response.data).show();*/
            /*         $('#modaltransaksiditahan').modal('show');*/
            /*     },*/
            /*     error: function(xhr, ajaxOptions, thrownError) {*/
            /*         alert(xhr.status + "\n" + xhr.responseText + "\n" + thrownError);*/
            /*     }*/
            /* });*/
        }
    });

    /* Pembayaran dengan tabungan member CTRL+F7*/
    $(this).keydown(function(e) {
        if (e.ctrlKey && e.keyCode == 118) {
            e.preventDefault();
            let kodemember = $('#kodemember').val();
            let pembulatan = $('#pembulatan').autoNumeric('get');
            if (kodemember.length == 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Sorry !',
                    html: 'Maaf, silahkan pilih member terlebih dahulu'
                });
            } else {
                Swal.fire({
                    title: 'Pembayaran Menggunakan Tabungan Point',
                    text: "Yakin dilanjutkan ?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Ya',
                    cancelButtonText: 'Tidak',
                }).then((result) => {
                    if (result.value) { console.log('Pembayaran: ', result)
                        /* $.ajax({*/
                        /*     type: "post",*/
                        /*     url: "https://sim.halobayi.co.id/kasir/pembayaranmember",*/
                        /*     data: {*/
                        /*         kodemember: kodemember,*/
                        /*         pembulatan: pembulatan,*/
                        /*         faktur: $('#faktur').val(),*/
                        /*         kodemember: $('#kodemember').val(),*/
                        /*         total_kotor: $('#total_kotor').val(),*/
                        /*         total_bersih_semua: $('#total_bersih_semua').autoNumeric('get'),*/
                        /*         dispersensemua: $('#dispersensemua').autoNumeric('get'),*/
                        /*         disuangsemua: $('#disuangsemua').autoNumeric('get'),*/
                        /*     },*/
                        /*     dataType: "json",*/
                        /*     success: function(response) {*/
                        /*         if (response.sukses) {*/
                        /*             Swal.fire({*/
                        /*                 icon: 'success',*/
                        /*                 title: 'Berhasil',*/
                        /*                 html: response.sukses*/
                        /*             }).then((result) => {*/
                        /*                 if (result.value) {*/
                        /*                     window.location.reload();*/
                        /*                 }*/
                        /*             });*/
                        /*         } else {*/
                        /*             Swal.fire({*/
                        /*                 icon: 'error',*/
                        /*                 title: 'Maaf',*/
                        /*                 html: response.error*/
                        /*             });*/
                        /*         }*/

                        /*     },*/
                        /*     error: function(xhr, ajaxOptions, thrownError) {*/
                        /*         alert(xhr.status + "\n" + xhr.responseText + "\n" +*/
                        /*             thrownError);*/
                        /*     }*/
                        /* });*/
                    }
                })
            }
        }
    });

    $(this).keydown(function(e) {
        if (e.ctrlKey && e.keyCode == 68) {
            e.preventDefault();
            $('#dispersensemua').focus();
        }
    });
});

/* Transaksi Pembayaran */
function transaksipembayaran() { alert('Transaksi Pembayaran')
    /* $.ajax({*/
    /*     type: "post",*/
    /*     url: "https://sim.halobayi.co.id/kasir/pembayaran",*/
    /*     data: {*/
    /*         faktur: $('#faktur').val(),*/
    /*         kodemember: $('#kodemember').val(),*/
    /*         namamember: $('#namamember').val(),*/
    /*         total_kotor: $('#total_kotor').val(),*/
    /*         total_bersih_semua: $('#total_bersih_semua').autoNumeric('get'),*/
    /*         pembulatan: $('#pembulatan').autoNumeric('get'),*/
    /*         dispersensemua: $('#dispersensemua').autoNumeric('get'),*/
    /*         disuangsemua: $('#disuangsemua').autoNumeric('get'),*/
    /*     },*/
    /*     dataType: "json",*/
    /*     success: function(response) {*/
    /*         if (response.sukses) {*/
    /*             $('.viewmodalpembayaran').html(response.sukses).show();*/
    /*             $('#modalpembayaran').on('shown.bs.modal', function(e) {*/
    /*                 $('#jumlahuang').focus();*/
    /*             });*/
    /*             $('#modalpembayaran').modal('show');*/
    /*         } else {*/
    /*             $.toast({*/
    /*                 heading: 'Maaf',*/
    /*                 text: response.error,*/
    /*                 showHideTransition: 'slide',*/
    /*                 icon: 'error',*/
    /*                 position: 'top-right'*/
    /*             });*/
    /*         }*/

    /*     },*/
    /*     error: function(xhr, ajaxOptions, thrownError) {*/
    /*         alert(xhr.status + "\n" + xhr.responseText + "\n" + thrownError);*/
    /*     }*/
    /* });*/
}

/* Holding Transaksi*/
function holdingtransaksi() {
    let faktur = $('#faktur').val();
    let kodemember = $('#kodemember').val();
    Swal.fire({
        title: 'Tahan Transaksi',
        text: `Yakin transaksi faktur ${faktur} di tahan ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya',
        cancelButtonText: 'Tidak'
    }).then((result) => {
        if (result.value) { console.log(result)
            /* $.ajax({*/
            /*     type: "post",*/
            /*     url: "https://sim.halobayi.co.id/kasir/holdingtransaksi",*/
            /*     data: {*/
            /*         faktur: faktur,*/
            /*         kodemember: kodemember,*/
            /*         total_subtotal: $('#pembulatan').autoNumeric('get')*/
            /*     },*/
            /*     dataType: "json",*/
            /*     success: function(response) {*/
            /*         if (response.sukses) {*/
            /*             Swal.fire({*/
            /*                 icon: 'success',*/
            /*                 title: 'Transaksi berhasil ditahan',*/
            /*                 // text: 'Something went wrong!',*/
            /*                 // footer: '<a href>Why do I have this issue?</a>'*/
            /*             }).then((result) => {*/
            /*                 window.location.reload();*/
            /*             });*/
            /*         } else {*/
            /*             $.toast({*/
            /*                 heading: 'Maaf',*/
            /*                 text: response.error,*/
            /*                 showHideTransition: 'slide',*/
            /*                 icon: 'error',*/
            /*                 position: 'top-center'*/
            /*             });*/
            /*         }*/
            /*     }*/
            /* });*/
        }
    })
}

window.setTimeout("waktu()", 1000);

function waktu() {
    var d = new Date();
    setTimeout(waktu, 1000);
    var elJam = document.getElementById("jam");
    var elMenit = document.getElementById("menit");
    var elDetik = document.getElementById("detik");

    if (elJam && elMenit && elDetik) {
        elJam.innerHTML = d.getHours() + ` : `;
        elMenit.innerHTML = d.getMinutes() + ` : `;
        elDetik.innerHTML = d.getSeconds();
    }
}
