$(document).ready(function() {

	/*
	 * =============================================================================
	 * CSRF token helper
	 * -----------------------------------------------------------------------------
	 * Config\Security::$regenerate = true, jadi token CSRF BERUBAH setiap kali ada
	 * request POST. Kalau token hanya dibaca sekali saat page load (cara lama),
	 * request typeahead ke-2 dst akan memakai token basi -> ditolak 403 -> tanpa
	 * error handler suggestion tidak pernah tampil & spinner muter terus.
	 *
	 * CSRFInitFilter (after '/ *') selalu mengirim token terbaru lewat response
	 * header X-CSRF-TOKEN. Kita baca ulang tiap response lalu simpan ke hidden
	 * input supaya request berikutnya (dan submit form) selalu pakai token valid.
	 * =============================================================================
	 */
	var CSRF_HEADER = 'X-CSRF-TOKEN';

	function getCsrfToken() {
		return $('input[name=csrf_test_name]').val();
	}

	function refreshCsrfToken(xhr) {
		if (!xhr || typeof xhr.getResponseHeader !== 'function') {
			return;
		}
		var fresh = xhr.getResponseHeader(CSRF_HEADER);
		if (fresh) {
			$('input[name=csrf_test_name]').val(fresh);
		}
	}

	function notifyError(message) {
		if (typeof Swal !== 'undefined') {
			Swal.fire({
				toast: true,
				position: 'top-end',
				icon: 'error',
				title: message,
				showConfirmButton: false,
				timer: 4000,
				timerProgressBar: true
			});
		} else {
			alert(message);
		}
	}

	function humanizeAjaxError(xhr) {
		if (!xhr || xhr.status === 0) {
			return 'Koneksi ke server terputus. Periksa jaringan lalu coba lagi.';
		}
		if (xhr.status === 403) {
			return 'Sesi keamanan (CSRF) kedaluwarsa. Silakan hapus semua data lalu ulangi pencarian.';
		}
		if (xhr.status === 404) {
			return 'Alamat data wilayah tidak ditemukan/ data belum tersedia.';
		}
		if (xhr.status >= 500) {
			return 'Terjadi kesalahan di server (' + xhr.status + '). Coba lagi.';
		}
		return 'Gagal memuat data wilayah (' + xhr.status + ').';
	}

	function generate_options(json) {
		var options = '';
		$.each(json, function(i, v) {
			options += '<option value="' + i + '">' + v + '</option>';
		});

		return options;
	}

	function set_options($elm) {
		var $next_option = '';
		var $wilayah = '';
		var url_wilayah = '';
		var value = $elm.val();

		if ($elm.hasClass('propinsi')) {
			$wilayah = $('.kabupaten, .kecamatan, .kelurahan').prop('disabled', true);
			$next_option = $('.kabupaten');
			url_wilayah = 'wilayah/ajaxgetkabupatenbyidpropinsi?id=' + value;
		} else if ($elm.hasClass('kabupaten')) {
			$wilayah = $('.kecamatan, .kelurahan').prop('disabled', true);
			$next_option = $('.kecamatan');
			url_wilayah = 'wilayah/ajaxgetkecamatanbyidkabupaten?id=' + value;
		} else if ($elm.hasClass('kecamatan')) {
			$wilayah = $('.kelurahan').prop('disabled', true);
			$next_option = $('.kelurahan');
			url_wilayah = 'wilayah/ajaxgetkelurahanbyidkecamatan?id=' + value;
		}

		if (!$next_option || !$wilayah) {
			return false;
		}

		var $spinner = $('<div class="spinner-border spinner-border-md" role="status" style="width: 1.5rem; height: 1.5rem; position:absolute; right: -27px; top:5px"></div>');
		var $wrapper = $('<div>').css('position', 'relative');
		$wrapper.insertAfter($next_option);
		$wrapper.append($spinner);

		function reenable() {
			// pastikan dropdown tidak pernah terkunci walau request gagal
			$wilayah.prop('disabled', false);
			$wrapper.remove();
		}

		$.getJSON(base_url + url_wilayah)
			.done(function(data) {
				var new_options = generate_options(data);
				$wilayah.each(function(i, elm) {
					var $item = $(elm);
					var teks = '-- Pilih Kelurahan --';
					if ($item.hasClass('kabupaten')) {
						teks = '-- Pilih Kabupaten --';
					} else if ($item.hasClass('kecamatan')) {
						teks = '-- Pilih Kecamatan --';
					}

					if (i === 0) {
						$item.prop('disabled', false);
					}
					$item
						.empty()
						.append(new_options)
						.prepend('<option value="">' + teks + '</option>')
						.val('');
				});
				$wrapper.remove();
			})
			.fail(function(xhr) {
				reenable();
				notifyError(humanizeAjaxError(xhr));
			})
			.always(function(dataOrXhr, status, xhrOrError) {
				// getJSON sukses -> arg ke-3 xhr; gagal -> arg ke-1 xhr
				refreshCsrfToken(status === 'success' ? xhrOrError : dataOrXhr);
			});
	}

	$('.propinsi, .kabupaten, .kecamatan').change(function() {
		set_options($(this));
	});

	// Pencarian Kelurahan
	// source: https://stackoverflow.com/a/30340490
	$('.kelurahanTypeahead').typeahead({
		hint: true,
		highlight: true,
		minLength: 1
	},
	{
		display: function(item) {
			return item.nama_kelurahan;
		},
		limit: 12,
		async: true,
		templates: {
			empty: [
				'<div class="d-flex justify-content-center p-2 text-muted">Data Kelurahan Tidak Ada!</div>'
			].join('\n'),
			suggestion: function(item) {
				return '<div>' + item.value + '</div>';
			}
		},
		source: function(query, processSync, processAsync) {
			return $.ajax({
				url: base_url + 'wilayah/typeahead',
				dataType: 'json',
				type: 'POST',
				data: {
					max_rows: 15,
					q: query
				},
				beforeSend: function(xhr) {
					xhr.setRequestHeader(CSRF_HEADER, getCsrfToken());
				},
				success: function(data) {
					var return_list = [];
					if (!$.isArray(data)) {
						data = [];
					}
					var i = data.length;
					while (i--) {
						return_list[i] = {
							id: data[i].kd_prop,
							value: data[i].nm_prop + ' - ' + data[i].nm_kab + ' - ' + data[i].nm_kec + ' - ' + data[i].nm_kel,
							nama_propinsi: data[i].nm_prop,
							nama_kabupaten: data[i].nm_kab,
							nama_kecamatan: data[i].nm_kec,
							nama_kelurahan: data[i].nm_kel,
							kd_propinsi: data[i].kd_prop,
							kd_kabupaten: data[i].kd_kab,
							kd_kecamatan: data[i].kd_kec,
							kd_kelurahan: data[i].kd_kel
						};
					}
					return processAsync(return_list);
				},
				error: function(xhr) {
					// PENTING: tetap panggil processAsync([]) supaya spinner berhenti
					// dan template "empty" tampil, bukan muter tanpa akhir.
					processAsync([]);
					notifyError(humanizeAjaxError(xhr));
				},
				complete: function(xhr) {
					// simpan token terbaru untuk request berikutnya (fix 403 berulang)
					refreshCsrfToken(xhr);
				}
			});
		}
	}).on('typeahead:selected', onSelectedKelurahan).on('typeahead:asyncrequest', function(e) {
		$(e.target).addClass('sLoading');
	}).on('typeahead:asynccancel typeahead:asyncreceive', function(e) {
		$(e.target).removeClass('sLoading');
	});

	// source: https://stackoverflow.com/a/19540313
	function onSelectedKelurahan($e, datum) {

		$('#propinsiTypeahead').val(datum.nama_propinsi);
		$('#kabupatenTypeahead').val(datum.nama_kabupaten);
		$('#kecamatanTypeahead').val(datum.nama_kecamatan);

		// source: https://github.com/twitter/typeahead.js/issues/860#issuecomment-48430835
		$('#kelurahanTypeahead').typeahead('val', datum.nama_kelurahan);

		$('#id_wilayah_propinsi').val(datum.kd_propinsi);
		$('#id_wilayah_kabupaten').val(datum.kd_kabupaten);
		$('#id_wilayah_kecamatan').val(datum.kd_kecamatan);
		$('#id_wilayah_kelurahan').val(datum.kd_kelurahan);

		return $.ajax({
			url: base_url + 'wilayah/getDataWilayahSelected/' + datum.id,
			dataType: 'json',
			type: 'GET',
			complete: function(xhr) {
				refreshCsrfToken(xhr);
			}
		});
	}
});
