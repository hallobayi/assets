$(function() {

    $().click(function(e) {
        e.preventDefault();
    })

    /* source: https://stackoverflow.com/a/3291856*/
    Object.defineProperty(String.prototype, 'capitalize', {
        value: function() {
          return this.charAt(0).toUpperCase() + this.slice(1);
        },
        enumerable: false
    });

    $('#status_perokok, #diagnosa_dokter, #riwayat_penyakit, #riwayat_alergi_obat, #keluhan_utama, #riwayat_alergi_lainnya').keyup(function(){
        this.value = this.value.capitalize();
    });

    $('#nama_pasien, #alamat, #nama_suami, #keterangan_lain').keyup(function(){
        this.value = this.value.toUpperCase();
    });

    /* source: https://stackoverflow.com/a/67184094*/
    var tokenHash=$("input[name=csrf_test_name]").val();

    /* Saran pasien tampil dua/ tiga baris: nomor RM + nama, alamat, lalu ringkasan riwayat. */
    function suggestionPasien(item) {
        var utama  = (item.no_rm_format || item.no_rm || '-') + ' - ' + (item.nama || '-');
        var alamat = item.alamat || '-';
        var html   = '<div class="tt-pasien">'
            + '<div class="tt-pasien-utama">' + utama + '</div>'
            + '<div class="tt-pasien-alamat">' + alamat + '</div>';

        /* Baris riwayat hanya ada bila sumbernya pendaftaran/typeahead */
        if (item.jml_kunjungan > 0) {
            html += '<div class="tt-pasien-riwayat">' + item.jml_kunjungan + 'x daftar'
                + (item.kunjungan_terakhir ? ' &middot; terakhir ' + item.kunjungan_terakhir : '')
                + (item.layanan_terakhir ? ' &middot; ' + item.layanan_terakhir : '')
                + '</div>';
        } else if (item.jml_kunjungan === 0) {
            html += '<div class="tt-pasien-riwayat">Pasien baru, belum pernah mendaftar</div>';
        }

        return html + '</div>';
    }

    /* Satu baris JSON pasien -> datum typeahead. Field riwayat undefined kalau
       sumbernya master/pasien/typeahead yang memang tidak mengirimkannya. */
    function datumPasien(row) {
        return {
            id: row.id_pasien,
            value: (row.nomor_rm_format || row.nomor_rm) + " - " + row.nama_pasien + " - " + row.alamat,
            no_rm_format: row.nomor_rm_format,
            alamat: row.alamat,
            no_rm: row.nomor_rm,
            nama: row.nama_pasien,
            tgl_lahir_ibu: row.tgl_lahir_ibu,
            tgl_lahir: row.tgl_lahir_ibu ? $.date(row.tgl_lahir_ibu) : '',
            no_wa: row.no_wa,
            jml_kunjungan: typeof row.jml_kunjungan === 'undefined' ? undefined : parseInt(row.jml_kunjungan, 10),
            kunjungan_terakhir: row.kunjungan_terakhir ? $.date(row.kunjungan_terakhir) : '',
            layanan_terakhir: row.layanan_terakhir,
            tp_terakhir: row.tp_terakhir ? $.date(row.tp_terakhir) : ''
        };
    }

    /* source: https://stackoverflow.com/a/30340490*/
    /* Pemasang typeahead pasien yang dipakai bersama oleh kotak cari di header
       dan kolom No RM form pendaftaran. Yang berbeda cuma URL sumber data
       (bisa dioper lewat atribut data-typeahead-url), teks saat kosong, dan
       aksi ketika saran dipilih. */
    function initTypeaheadPasien($input, opsi) {
        if ($input.length === 0) {
            return;
        }

        var url = $input.data('typeahead-url') || opsi.url;

        // Debounce + batalkan request sebelumnya: tanpa ini tiap ketukan langsung
        // POST ke server dan diproses berurutan (session lock), jadi mengetik
        // "siti" = 4 request beruntun. minLength 2 karena 1 huruf hasilnya
        // terlalu umum untuk berguna.
        var debounceMs = 300, timerKetik = null, xhrAktif = null;

        $input.typeahead({
            hint: true,
            highlight: true,
            minLength: 2
        },
        {
            display: function(item){
                return item.no_rm
            },
            limit: 12,
            async: true,
            templates: {
                empty: [opsi.empty].join('\n'),
                suggestion: suggestionPasien
            },
            source: function (query, processSync, processAsync) {
              if (timerKetik) clearTimeout(timerKetik);
              if (xhrAktif && xhrAktif.readyState !== 4) xhrAktif.abort();
              timerKetik = setTimeout(function () {
                xhrAktif = $.ajax({
                url: base_url + url,
                dataType: "json",
                type: "POST",
                data: {
                    max_rows: 15,
                    q:query
                },
                beforeSend: function (xhr)
                {
                xhr.setRequestHeader('X-CSRF-Token' , tokenHash);
                },
                success: function (data) {
                    var return_list = [], i = data.length;
                    while (i--) {
                        return_list[i] = datumPasien(data[i]);
                    }
                  return processAsync(return_list);
                }
                });
              }, debounceMs);
            }
        }).on('typeahead:selected', opsi.onSelected).on('typeahead:asyncrequest', function(e) {
            $(e.target).addClass('sLoading');
        }).on('typeahead:asynccancel typeahead:asyncreceive', function(e) {
            $(e.target).removeClass('sLoading');
        });
    }

    initTypeaheadPasien($('#no_rm_header'), {
        url: 'master/pasien/typeahead',
        empty: '<div class="empty">Data Pasien Tidak Ada!</div>',
        onSelected: onSelectedNomorRmHeader
    });

    initTypeaheadPasien($('.no_rm'), {
        url: 'master/pasien/typeahead',
        empty: '<div class="d-flex justify-content-center">Data Pasien Tidak Ada! .:: <a target="_blank" class="tambah-pasien-off-dulu" href="'+base_url+'master/pasien/add">&nbsp;<i class="fas fa-plus"></i> Tambah Pasien&nbsp;</a>::. </div>',
        onSelected: onSelectedNomorRm
    });

    /* source: https://stackoverflow.com/a/19540313*/
    function onSelectedNomorRmHeader($e, datum) {
        window.location = base_url+'master/pasien/profile/'+datum.no_rm;
    }

    /* source: https://stackoverflow.com/a/19540313*/
    function onSelectedNomorRm($e, datum) {
        $('#nama_ibu').val(datum.nama);
        $('#tanggal_lahir_ibu').val(datum.tgl_lahir);
        $('#no_wa').val(datum.no_wa);
        $("#nama_pasien_span").data('id', datum.nama);
        $('span[data-id="nama_pasien"]').attr('data-id', datum.nama);

        /* TP dari pendaftaran terakhir pasien ini. Sengaja lewat .change() supaya
           HPHT dan usia kehamilan ikut dihitung ulang oleh pendaftaran.js. */
        if (datum.tp_terakhir) {
            $('.tp').val(datum.tp_terakhir).trigger('change');
        }

        /* Tampilkan pendaftaran terakhir milik pasien yang dipilih */
        muatRiwayatPendaftaran($(this).data('riwayat-target'), datum.no_rm);
    }

    /* Panel pendaftaran terakhir di form pendaftaran. Isinya dirender server
       (Pendaftaran::ajaxRiwayatPendaftaran) supaya markupnya satu sumber dengan
       yang tampil saat halaman pertama kali dibuka. */
    function muatRiwayatPendaftaran(selector, noRm) {
        var $panel = $(selector || '#riwayat-pendaftaran');

        if ($panel.length === 0 || !noRm) {
            return;
        }

        var $isi = $panel.find('#riwayat-pendaftaran-isi');
        $isi.html('<div class="text-center py-3">'
            + '<div class="spinner-border spinner-border-sm text-secondary" role="status"><span class="visually-hidden">Memuat...</span></div>'
            + '<small class="d-block mt-1 text-muted">Memuat pendaftaran terakhir...</small>'
            + '</div>');

        $.ajax({
            url: $panel.data('url'),
            type: 'POST',
            data: {
                no_rm: noRm
            },
            beforeSend: function (xhr)
            {
            xhr.setRequestHeader('X-CSRF-Token' , tokenHash);
            },
            success: function(html) {
                $isi.html(html);
                $panel.find('.collapse').addClass('show');
            },
            error: function() {
                $isi.html('<div class="text-center text-danger py-3">Data pendaftaran terakhir gagal dimuat.</div>');
            }
        });
    }

    /* Show Popup Pasien New*/
    $('body').delegate('.tambah-pasien', 'click', function(e) {
        e.preventDefault();
		showFormPasienBaru();
    });

	function showFormPasienBaru() {
        $bootbox = bootbox.dialog({
            title: 'Tambah Form Pasien Baru',
            message: '<div class="text-center text-secondary"><div class="spinner-border"></div></div>',
            buttons: {
                cancel: {
                    label: 'Cancel'
                },
                success: {
                    label: 'Submit',
                    className: 'btn-success submitJanjian',
                    callback: function() {
                        $bootbox.find('.alert').remove();
                        $button_submit.prepend('<i class="fas fa-circle-notch fa-spin me-2 fa-lg"></i>');
                        $button.prop('disabled', true);

                        /* Submit Form Janjian*/
                        form = $bootbox.find('form')[0];
                        $.ajax({
                            type: 'POST',
                            url: base_url+'master/pasien/ajaxUpdateDataPasien',
                            data: new FormData(form),
                            processData: false,
                            contentType: false,
                            dataType: 'json',
                            success: function(data) { console.log(data)

                                $bootbox.modal('hide');
                                if (data.message.status == 'ok') {
                                    const Toast = Swal.mixin({
                                        toast: true,
                                        position: 'top-end',
                                        showConfirmButton: false,
                                        timer: 2500,
                                        timerProgressBar: true,
                                        iconColor: 'white',
                                        customClass: {
                                            popup: 'bg-success text-light toast p-2'
                                        },
                                        didOpen: (toast) => {
                                            toast.addEventListener('mouseenter', Swal.stopTimer)
                                            toast.addEventListener('mouseleave', Swal.resumeTimer)
                                        }
                                    })
                                    Toast.fire({
                                        html: '<div class="toast-content"><i class="far fa-check-circle me-2"></i> Data berhasil disimpan</div>'
                                    })
                                  
                                    /* Load Ajax Datatables */
                                    /* TODO: Masih ada Bugs CSRF Nyangkut*/
                                    /* settingsPerjanjian.ajax.url = data.message.urlAjax;*/
                                    /* dataTablesPerjanjian.destroy();*/
                                    /* len = $('#tabel-perjanjian').find('thead').find('th').length;*/
                                    /* $('#tabel-perjanjian').find('tbody').html('<tr>' + '<td colspan="' + len + '" class="text-center">Loading data...</td>' + '</tr>');*/
                                    /* dataTablesPerjanjian = $('#tabel-perjanjian').DataTable(settingsPerjanjian);*/
                                    /* dataTablesPerjanjian.draw();*/

                                    location.reload();
                                    
                                } else {
                                    show_alert('Error !!!', data.message, 'error');
                                }
                            },
                            error: function(xhr) {
                                show_alert('Error !!!', xhr.responseText, 'error');
                                console.log(xhr.responseText);
                            }
                        })
                        return false;
                    }
                }
            }
        });

        $bootbox.find('.modal-dialog').css('max-width', '950px');
        var $button = $bootbox.find('button').prop('disabled', true);
        var $button_submit = $bootbox.find('button.submitJanjian');

        $.get(base_url+'master/pasien/ajaxFormPasienBaru', function(html) {
            $button.prop('disabled', false);
            $bootbox.find('.modal-body').empty().append(html);
            /* $('.tglJanjiDatang').flatpickr({*/
            /*     dateFormat: "d-m-Y",*/
            /*     minDate: new Date()*/
            /* });*/
            /* $('.jamJanjiDatang').flatpickr({*/
            /*     enableTime: true,*/
            /*     noCalendar: true,*/
            /*     dateFormat: "H:i",*/
            /*     time_24hr: true*/
            /* });*/
        });
    };

    /* source: https://stackoverflow.com/a/16958005*/
    $.date = function(dateObject) {
        var d = new Date(dateObject);
        var day = d.getDate();
        var month = d.getMonth() + 1;
        var year = d.getFullYear();
        if (day < 10) {
            day = "0" + day;
        }
        if (month < 10) {
            month = "0" + month;
        }
        var date = day + "-" + month + "-" + year;
        return date;
    };

    /* source: https://stackoverflow.com/a/30340490*/
    $('.diagnosa').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        display: function(item){
            return item.value 
        },
        limit: 12,
        async: true,
        templates: {
            empty: [
                '<div class="empty">Data Diagnosa Tidak Ada!</div>'
            ].join('\n'),
            suggestion: function (item){
                return '<div>' + item.value + '</div>'
            }
        },
        source: function (query, processSync, processAsync) {
        /* processSync(['This suggestion appears immediately', 'This one too']);*/
          return $.ajax({
            url: base_url + 'master/rekammedis/icd10-typeahead',
            dataType: "json",
            type: "POST",
            data: {
                max_rows: 15,
                q:query,
                csrf_test_name:tokenHash /* source: https://stackoverflow.com/a/50541928*/
            },
            beforeSend: function (xhr) 
            {       
            xhr.setRequestHeader('X-CSRF-Token' , tokenHash);       
            },
            success: function (data) {
                var return_list = [], i = data.length;
                while (i--) {
                    return_list[i] = {
                        id: data[i].kode,
                        value: data[i].kode + " - " + data[i].nama,
                        nama_diagnosa: data[i].nama
                    };
                }    
              /* in this example, json is simply an array of strings*/
              return processAsync(return_list);
            }
          });
        }
    }).on('typeahead:selected', onSelectedDiagnosa).on('typeahead:asyncrequest', function(e) {
        $(e.target).addClass('sLoading');
    }).on('typeahead:asynccancel typeahead:asyncreceive', function(e) {
        $(e.target).removeClass('sLoading');
    });

    /* source: https://stackoverflow.com/a/19540313*/
    function onSelectedDiagnosa($e, datum) {
        $('#nama_diagnosa').val(datum.nama_diagnosa);
        /* $('#diagnosa_utama').val(datum.id);*/
    }

    /* source: https://stackoverflow.com/a/30340490*/
    $('.tindakan').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        display: function(item){
            return item.value
        },
        limit: 12,
        async: true,
        templates: {
            empty: [
                '<div class="empty">Data Tindakan Tidak Ada!</div>'
            ].join('\n'),
            suggestion: function (item){
                return '<div>' + item.value + '</div>'
            }
        },
        source: function (query, processSync, processAsync) {
        /* processSync(['This suggestion appears immediately', 'This one too']);*/
            return $.ajax({
            url: base_url + 'master/rekammedis/icd9-typeahead',
            dataType: "json",
            type: "POST",
            data: {
                max_rows: 15,
                q:query,
                csrf_test_name:tokenHash /* source: https://stackoverflow.com/a/50541928*/
            },
            beforeSend: function (xhr) 
            {       
            xhr.setRequestHeader('X-CSRF-Token' , tokenHash);       
            },
            success: function (data) {
                var return_list = [], i = data.length;
                while (i--) {
                    return_list[i] = {
                        id: data[i].kode,
                        value: data[i].kode + " - " + data[i].nama,
                        nama_tindakan: data[i].nama
                    };
                }    
                /* in this example, json is simply an array of strings*/
                return processAsync(return_list);
            }
            });
        }
    }).on('typeahead:selected', onSelectedTindakan).on('typeahead:asyncrequest', function(e) {
        $(e.target).addClass('sLoading');
    }).on('typeahead:asynccancel typeahead:asyncreceive', function(e) {
        $(e.target).removeClass('sLoading');
    });

    /* source: https://stackoverflow.com/a/19540313*/
    function onSelectedTindakan($e, datum) {
        $('#nama_tindakan').val(datum.nama_tindakan);
    }

	$('body').delegate('.tambah-anak', 'click', function(e) {
        e.preventDefault;
        $this = $(this);
        $bootbox = bootbox.dialog({
            title: 'Tambah Detail Anak',
            message: '<div class="loader-ring loader"></div>',
            buttons: {
                cancel: {
                    label: 'Cancel'
                },
                success: {
                    label: 'Submit',
                    className: 'btn-success submit',
                    callback: function() {
                        $bootbox.find('.alert').remove();
                        $button_submit.prepend('<i class="fas fa-circle-notch fa-spin me-2 fa-lg"></i>');
                        $button.prop('disabled', true);
                        $form_filled = $bootbox.find('form');
                        url_edit = $form_filled.attr('action');

                        $.ajax({
                            type: 'POST',
                            url: url_edit,
                            data: $form_filled.serialize(),
                            dataType: 'text',
                            success: function(data) {
                                console.log(data);
                                data = $.parseJSON(data);
								console.log(data);
				
                                if (data.status == 'ok') {
									$bootbox.modal('hide');
                                    const Toast = Swal.mixin({
                                        toast: true,
                                        position: 'top-end',
                                        showConfirmButton: false,
                                        timer: 2500,
                                        timerProgressBar: true,
                                        iconColor: 'white',
                                        customClass: {
                                            popup: 'bg-success text-light toast p-2'
                                        },
                                        didOpen: (toast) => {
                                            toast.addEventListener('mouseenter', Swal.stopTimer)
                                            toast.addEventListener('mouseleave', Swal.resumeTimer)
                                        }
                                    })
                                    Toast.fire({
                                        html: '<div class="toast-content"><i class="far fa-check-circle me-2"></i> Data berhasil disimpan</div>'
                                    })
                                    table.draw(true);
                                } else {
                                    $button_submit.find('i').remove();
                                    $button.prop('disabled', false);
                                    $bootbox.find('.modal-body').prepend('<div class="alert alert-dismissible alert-danger" role="alert">' + data.message + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>');
                                }
                            },
                            error: function(xhr) {
                                console.log(xhr.responseText);
                            }
                        })
                        return false;
                    }
                }
            }
        });


        var $button = $bootbox.find('button').prop('disabled', true);
        var $button_submit = $bootbox.find('button.submit');
        var nomor_rm = $(this).attr('data-rm');
        $.get(current_url + '/ajaxTambahDataAnak?nomor_rm=' + nomor_rm, function(html) {
            $button.prop('disabled', false);
            $bootbox.find('.modal-body').empty().append(html);
        });
    });

});

!(function($) {
    "use strict";
    class MainApp {
        constructor() { }
        initLoader() {
            /* Preloader*/
            $(window).on("load", function () {
                $("#status").fadeOut();
                $("#preloader").delay(250).fadeOut("slow");
            });
        }
        init() {
            this.initLoader();
        }
    }
    /*init*/
    ($.MainApp = new MainApp()),
    ($.MainApp.Constructor = MainApp);
})(window.jQuery),
/*initializing*/
(function($) {
    "use strict";
    $.MainApp.init();
})(window.jQuery);
/* ===================================================================
   Sinkronisasi + pemulihan token CSRF untuk semua request AJAX
   -------------------------------------------------------------------
   Masalah yang diperbaiki: tiap halaman meng-cache token CSRF hasil render
   (variabel tokenHash di masing-masing file JS). Begitu hash CSRF di session
   berganti — login ulang di tab lain, session lama kadaluarsa — semua tab yang
   masih terbuka memakai token basi dan tiap POST-nya dibalas 403
   ("DataTables warning: ... Ajax error"). Respons 403 tidak membawa header
   X-CSRF-TOKEN, jadi halaman itu tidak pernah tahu token barunya dan rusak
   terus sampai di-reload manual.

   Tiga lapis penanganan:
   1. ajaxSend     - token selalu diambil ulang dari input[name=csrf_test_name]
                     (satu sumber kebenaran), menimpa nilai yang sudah di-cache
                     lewat beforeSend. jQuery mengganti (bukan menggandakan)
                     header dengan nama sama selama masih sebelum send().
   2. ajaxComplete - tiap respons yang membawa X-CSRF-TOKEN memperbarui input
                     tersebut, sehingga request berikutnya selalu pakai yang baru.
   3. ajaxError    - sekali kena 403, ambil token yang berlaku lewat GET
                     csrf/token (GET tidak diperiksa filter CSRF), lalu ulangi
                     request yang gagal satu kali saja.
   =================================================================== */
$(function () {
	function csrfInput() {
		return $("input[name=csrf_test_name]");
	}

	function csrfAmbil() {
		return csrfInput().first().val() || "";
	}

	function csrfSimpan(nilai) {
		if (nilai) {
			csrfInput().val(nilai);
		}
	}

	$(document).ajaxSend(function (event, xhr, settings) {
		if (settings.crossDomain) return;

		var token = csrfAmbil();
		if (token) {
			xhr.setRequestHeader("X-CSRF-TOKEN", token);
		}
	});

	$(document).ajaxComplete(function (event, xhr) {
		try {
			csrfSimpan(xhr.getResponseHeader("X-CSRF-TOKEN"));
		} catch (e) {
			/* sebagian transport tidak mengizinkan baca header, abaikan */
		}
	});

	$(document).ajaxError(function (event, xhr, settings) {
		if (xhr.status !== 403 || settings.crossDomain || settings.csrfDiulang)
			return;
		if ((settings.type || "GET").toUpperCase() === "GET") return;

		/* tandai dulu supaya tidak jadi loop kalau token barunya pun ditolak */
		settings.csrfDiulang = true;

		$.get(base_url + "csrf/token", function (resp) {
			var data = typeof resp === "string" ? JSON.parse(resp) : resp;
			if (!data || !data.value) return;

			csrfSimpan(data.value);
			$.ajax(settings);
		});
	});

	/* DataTables: ganti alert bawaan ("DataTables warning: ... Ajax error")
	   jadi pesan console saja. Kegagalan sesaat karena token basi sudah
	   ditangani retry di atas, dan popup itu tidak berarti apa-apa buat user. */
	if ($.fn.dataTable) {
		$.fn.dataTable.ext.errMode = function (settings, helpPage, message) {
			if (window.console && console.warn) {
				console.warn(message);
			}
		};
	}
});
