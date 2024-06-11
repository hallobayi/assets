/**
 * 	Developed by : Muchamad Desta Fadilah a.ka. topidesta
 *	Website		 : https://topidesta.my.id
 *	Year		 : 2023-2024
 *  Description  : [TODO]
 */

jQuery(document).ready(function() {

    // source: https://stackoverflow.com/a/67184094
    var tokenHash=$("input[name=csrf_test_name]").val(); //console.log(tokenHash)

    if ($('.select2').length > 0 ) {
        $('.jadwal_dokter, .nik_dokter').prop('disabled', true);

		$(".select2, .cabang").select2({
            placeholder: 'Select an option',
			theme: "bootstrap-5"
        }).on('select2:opening', function(e){
            $(this).data('select2').$dropdown.find(':input.select2-search__field').attr('placeholder', 'Ketik atau Klik Pilihan').focus()
        });
	}

	let dataTablesPendaftaran = '';
    const column = (typeof $('#pendaftaran-column').html() === 'string') ? $.parseJSON($('#pendaftaran-column').html()) : {};
    let url = $('#pendaftaran-url').text();

    const settings = {
        "processing": true,
        "serverSide": true,
        "scrollX": true,
        "ajax": {
            "url": url,
            "type": "POST",
            "data": { 'csrf_test_name':tokenHash } // source: https://stackoverflow.com/a/50541928
        },
        "oLanguage": {
            "sLengthMenu": "_MENU_ records per page",
            "sSearch": "Cari <span style='color:#F00;'>(Tekan Enter)</span>: _INPUT_"
        },
        "columns": (typeof column === 'object') ? column : '',
        "initComplete": function(settings, json) {
            // source: https://stackoverflow.com/a/30937415
            $('.dataTables_filter input').unbind();
            $('.dataTables_filter input').bind('keyup', function(e) {
                if (e.keyCode == 13) {
                    dataTablesPendaftaran.search(this.value).draw();
                }
            });
        },
        "fnRowCallback": function(nRow, aoData) { console.log(aoData)
            if (aoData['status_layanan'] === 'daftar') {
                // $(nRow).css('color', '#0072c6').css("font-weight", "Bold");
				$('td', nRow).eq(9).text('Registrasi', nRow).css('color', 'Sienna').css("font-weight","Bold").addClass('kantongRelase').on("click", function(){ klikDetail(aoData['no_reg']); }).css('cursor', 'pointer');
            }

        }
    }

	dataTablesPendaftaran = $('#tabel-pendaftaran').DataTable(settings);
	dataTablesPendaftaran.columns.adjust().draw()


	$('#form-pendaftaran').submit(function(e) {

		e.preventDefault(); // avoid to execute the actual submit of the form.

		let startDate = $("#startDate").val();
		let endDate = $("#endDate").val();
		let lokasi = $("#cabang :selected").val();

        settings.ajax.url = base_url + 'pendaftaran/getDataPendaftar?startDate=' + startDate + '&endDate=' + endDate + '&lokasi=' + lokasi;
        dataTablesPendaftaran.destroy();
        len = $('#tabel-pendaftaran').find('thead').find('th').length;
        $('#tabel-pendaftaran').find('tbody').html('<tr>' + '<td colspan="' + len + '" class="text-center">Loading data...</td>' + '</tr>');
        dataTablesPendaftaran = $('#tabel-pendaftaran').DataTable(settings);
    })

	const klikDetail = (id) => {
		alert('sedang dikembangkan!');
		console.log(id)
	}

	// $("#display").on("click",".panggil", function(event){
	// 	event.preventDefault();
	  
	// 	var nm_pasien 	= $(this).attr("data-nm_pasien");
	// 	var nm_poli = $(this).attr("data-nm_poli");
	// 	var no_reg = $(this).attr("data-no_reg");
	// 	function play (){
	// 	  responsiveVoice.speak(
	// 		nm_pasien + ", nomor antrian " + no_reg + ", ke " + nm_poli ,"Indonesian Male", {pitch: 1,rate: 0.8,volume: 2}
	// 	  );
	// 	}
	// 	play();
	// });

    // Add Anak
    $('#add-row').on('click', function(){
		$source = $(this).parent().parent();
		$container = $source.parent();
		$clone = $source.clone();
		$clone.find('input').val('');
		$clone.find('a').removeAttr('class').addClass('btn btn-danger delete-row').removeAttr('id').find('i').removeAttr('class').addClass('fas fa-times');
		
		// Find DIV row before submit and text muted
		index = $container.children().length - 1 - 1;
		console.log(index);
		$last = $container.children().eq(index);
		
		$clone.insertAfter($last);
	});
	
	$('#form-container').on('click', '.delete-row', function(){
		$(this).parent().parent().remove();
		
	});

    function generate_options(json) {
		options = '';
		$.each(json, function(i, v) {
			options += '<option value="' + i + '">' + v + '</option>';
		})
		
		return options;
	}
	
	function set_caraMasuk($elm, url) 
	{
		let $next_option = '';
		let $caraMasuk = '';
		let urlCaraMasuk = '';
		const value = $elm.val();

		if ($elm.hasClass('prosedur_masuk'))
		{
			$caraMasuk = $('.cara_masuk').prop('disabled', true);
			$next_option = $('.cara_masuk');
			urlCaraMasuk = 'master/lainlain/ajaxCaraMasuk?id=' + value
		} 
		
		if (!$next_option || ! $caraMasuk) {
			return false;
		}
		
		$spinner = $('<div class="spinner-border spinner-border-md" role="status" style="width: 1.5rem; height: 1.5rem; position:absolute; right: -27px; top:5px"></div>');
		
		$wrapper = $('<div>').css('position', 'relative');
		$wrapper.insertAfter($next_option);
		$wrapper.append($spinner);

		$.getJSON(base_url + urlCaraMasuk, function(data) 
		{
			console.log('ff',data);
			new_options = generate_options(data);
			$caraMasuk.each (function(i, elm) 
			{
				$elm = $(elm);
				teks = '-- Pilih Prosedure --';
				if ($elm.hasClass('cara_masuk')) {
					teks = '-- Pilih Cara Masuk --';
				}
				
				if (i == 0) {
					$elm.prop('disabled', false)
				}
				$elm
					.empty()
					.append(new_options)
					.prepend('<option value="">' + teks + '</option>')
					.val('');
				$wrapper.remove();
			});
		});
	}

	function set_cabang($elm, url) 
	{
		let $next_option = '';
		let $cabangDokter = '';
		let urlCabang = '';
		const value = $elm.val();

		if ($elm.hasClass('cabang'))
		{
			$cabangDokter = $('.nik_dokter').prop('disabled', true);
			$next_option = $('.nik_dokter');
			urlCabang = 'master/dokter/ajaxCabangDokter?kode_cabang=' + value + '&nik=' + null
		} 
		
		if (!$next_option || !$cabangDokter) {
			return false;
		}
		
		$spinner = $('<div class="spinner-border spinner-border-md" role="status" style="width: 1.5rem; height: 1.5rem; position:absolute; right: -27px; top:5px"></div>');
		
		$wrapper = $('<div>').css('position', 'relative');
		$wrapper.insertAfter($next_option);
		$wrapper.append($spinner);

		$.getJSON(base_url + urlCabang, function(data) 
		{
			console.log('ff');
			new_options = generate_options(data.nama_dokter); //console.log(data.nama_dokter);
			$cabangDokter.each (function(i, elm) 
			{
				$elm = $(elm);
				teks = '-- Pilih Cabang --';
				if ($elm.hasClass('nik_dokter')) {
					teks = '-- Pilih Dokter --';
				}
				
				if (i == 0) {
					$elm.prop('disabled', false)
				}
				$elm
					.empty()
					.append(new_options)
					.prepend('<option value="">' + teks + '</option>')
					.val('');
				$wrapper.remove();
			});
		});
	}

    function set_jadwal($elm, url) 
	{
		let $next_option = '';
		let $jadwalDokter = '';
		let urlCabang = '';
		const value = $elm.val();
        const valueCabang = $('.cabang').val();

		if ($elm.hasClass('nik_dokter'))
		{
			$jadwalDokter = $('.jadwal_dokter').prop('disabled', true);
			$next_option = $('.jadwal_dokter');
			urlCabang = 'master/dokter/ajaxCabangDokter?kode_cabang=' + valueCabang + '&nik=' + value
		} 
		
		if (!$next_option || !$jadwalDokter) {
			return false;
		}
		
		$spinner = $('<div class="spinner-border spinner-border-md" role="status" style="width: 1.5rem; height: 1.5rem; position:absolute; right: -27px; top:5px"></div>');
		
		$wrapper = $('<div>').css('position', 'relative');
		$wrapper.insertAfter($next_option);
		$wrapper.append($spinner);

		$.getJSON(base_url + urlCabang, function(data) 
		{
			console.log('ff');
			new_options = generate_options(data.jadwal_dokter); //console.log(data.nama_dokter);
			$jadwalDokter.each (function(i, elm) 
			{
				$elm = $(elm);
				teks = '-- Pilih Dokter --';
				if ($elm.hasClass('jadwal_dokter')) {
					teks = '-- Pilih Jadwal --';
				}
				
				if (i == 0) {
					$elm.prop('disabled', false)
				}
				$elm
					.empty()
					.append(new_options)
					.prepend('<option value="">' + teks + '</option>')
					.val('');
				$wrapper.remove();
			});

			// enable kode hari
			$("#kode_hari_mesin").val(data.kode_hari_mesin);
		});
	}

    function set_hiddenKolom($elm, url) 
	{
		const value = $elm.val();

        if (value === 'promil') {
            $('.hamil').hide();
            $(".hpht").val("");
            $(".tp").val("");
            $(".usia_kehamilan").val("");
        }else{
            $('.hamil').show();
        }
	}

    function set_usiaKehamilan($elm, url) 
	{
		const value = $elm.val();
		var parts = value.split("-");
		var d1 = new Date(Number(parts[2]) + 1, Number(parts[1]) - 3, Number(parts[0]) + 7);

		// Format dd-mm-yyyy di Kolom TP
		$(".tp").val(d1.toLocaleDateString("es-CL"));

		var today = new Date();
		var dd = String(today.getDate()).padStart(2, '0');
		var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
		var yyyy = today.getFullYear();

		// Moment Format
		newHpHt = parts[2] + '-' + parts[1] + '-' + parts[0];
		today = yyyy + '-' + mm + '-' + dd ;
		
		var a = moment(newHpHt);
		var b = moment(today);
		days  = b.diff(a, 'week');

		console.log('hpht:', newHpHt, '=> today:', today, ' = usia kehamilan:', days)

		// source: https://stackoverflow.com/a/49423808
		var diff = moment.duration(b.diff(a));
		console.log(diff.months() + " bulan, " + diff.weeks() + " pekan, " + diff.days()%7 + " hari.");
		console.log(Math.floor(diff.asWeeks()) + " pekan, " + diff.days()%7 + " hari.");

		$(".usia_kehamilan").val(days);

	}

	$('.prosedur_masuk').change(function() {
		set_caraMasuk($(this));
	});
	$('.cabang').change(function() {
		set_cabang($(this));
	});
    $('.nik_dokter').change(function() {
		set_jadwal($(this));
	});
    $('.jenis_periksa').change(function() {
		set_hiddenKolom($(this));
	});
    $('.hpht').change(function() {
		set_usiaKehamilan($(this));
	});

	$('body').delegate('.add-tindakan', 'click', function(e) {
        e.preventDefault;
        $this = $(this);
        $bootbox = bootbox.dialog({
            title: 'Tambah Tindakan Oleh Dokter',
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
        var id = $(this).attr('data-id');
        $.get(current_url + '/ajaxFormTindakan?id=' + id, function(html) {
            $button.prop('disabled', false);
            $bootbox.find('.modal-body').empty().append(html);
        });
    });

	$('body').delegate('.add-obat', 'click', function(e) {
        e.preventDefault;
        $this = $(this);
        $bootbox = bootbox.dialog({
            title: 'Tambah Obat',
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
        var id = $(this).attr('data-id');
        $.get(current_url + '/ajaxFormTambahObat?id=' + id, function(html) {
            $button.prop('disabled', false);
            $bootbox.find('.modal-body').empty().append(html);
        });
    });

	// const dayJsDefault = [0,1,2,3,4,5,6];
	// const kodeHariMesin= $("#kode_hari_mesin").val();
	// moment.locale('id');

	// Rencana datang
	$("#rencana_datang").datepicker({
		format: "dd-mm-yyyy",
		weekStart: 1,
		locale: "id",
		language: "id",
		autoclose: true,
		todayHighlight: true
		// daysOfWeekDisabled: "0,1,2,3,4,5",
		// daysOfWeekHighlighted: "6",
	});


});