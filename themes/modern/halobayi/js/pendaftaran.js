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

		$('.cabang').attr("required", "required" );
		$('.nik_dokter').attr("required", "required" );


        $('.jadwal_dokter, .nik_dokter').prop('disabled', true);

		$(".select2, .cabang").select2({
            placeholder: 'Select an option',
			theme: "bootstrap-5",
			allowClear: false
        }).on('select2:opening', function(e){
            $(this).data('select2').$dropdown.find(':input.select2-search__field').attr('placeholder', 'Ketik atau Klik Pilihan').focus()
        });
	}

	let dataTablesPendaftaran = '';
    const column = (typeof $('#pendaftaran-column').html() === 'string') ? $.parseJSON($('#pendaftaran-column').html()) : {};
    let url = $('#pendaftaran-url').text();

    var cabang = document.getElementById("cabang");

    const settings = {
        "processing": true,
        "serverSide": true,
        "scrollX": true,
        "ajax": {
            "url": url,
            "type": "POST",
            // "data": { 'csrf_test_name':tokenHash } // source: https://stackoverflow.com/a/50541928
            "data" : function(d){
                d.lokasi = cabang.value;
                d.csrf_test_name = tokenHash;
                d.startDate = $('input[name=startDate]').val();
                d.endDate   = $('input[name=endDate]').val();
            }
        },
		"order": [4, "desc"],
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
        "fnRowCallback": function(nRow, aoData, c) {

            console.log('nRow:',nRow, '\naoData:',aoData, '\naoKolom:',c);

            // Kolom "Pasien"
            $('td', nRow).eq(1).html('<b>' + aoData['nama_pasien'] + ' </b><i style="color: #28c0e5" class="fa fa-venus"></i><br/><span class="label label-success">NIK: ' + aoData['HC_pasien#nik'] + '</span><br/><span class="label label-success">WA: ' + aoData['nomorhp'] + '</span>', nRow).css('color', '#da8d5e').css("font-weight", "Bold");

            // Kolom RM
            $('td', nRow).eq(2).html('<b><i style="color: rgba(235, 75, 176, 1) !important" class="fa-solid fa-server"></i> ' + aoData['HC_pasien#nomor_rm'] + '</b><br /><i style="color: rgba(235, 75, 176, 1) !important" class="fa-solid fa-user-pen"></i><span class="label label-success"> ' + aoData['HC_pasien#nomor_rm_lama'] + '</span><br /><i style="color: rgba(235, 75, 176, 1) !important" class="fa-solid fa-bars"></i><span class="label label-success"> ' + aoData['HC_pasien#nomor_rm_mesin'] + '</span>', nRow);

            // Kolom Petugas
            $('td', nRow).eq(3).html('<b>' + aoData['no_reg'] + ' </b><br /> Petugas: ' + aoData['user_input'], nRow).css('color', '#da8d5e').css("font-weight", "Bold");
            
            // Kolom "Dokter"
            $('td', nRow).eq(5).html('<b><i style="color: #00a65a !important" class="fa-solid fa-user-doctor"></i> ' + aoData['HC_pegawai#nama_pegawai'] + '</b><br /><i style="color: #00a65a !important" class="fa-solid fa-building"></i><span class="label label-success"> ' + aoData['nama_cabang'] + '</span><br /><i style="color: #00a65a !important" class="fa-solid fa-dollar"></i><span class="label label-success"> ' + aoData['nama_carabayar'] + '</span>', nRow);

            if (aoData['status_layanan'] === 'daftar') {
                // $(nRow).css('color', '#0072c6').css("font-weight", "Bold");
				$('td', nRow).eq(6).text('Registrasi', nRow).css('color', 'Sienna').css("font-weight","Bold").addClass('kantongRelase').on("click", function(){ klikDetail(aoData['no_reg']); }).css('cursor', 'pointer');
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
		$bootbox = bootbox.dialog({
            title: 'Konfirmasi Kehadiran',
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

                        // Submit Form Janjian
                        form = $bootbox.find('form')[0];
                        $.ajax({
                            type: 'POST',
                            url: base_url+'pendaftaran/updateKehadiran',
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
                                        html: '<div class="toast-content"><i class="far fa-check-circle me-2"></i> Data berhasil diupdate!</div>'
                                    })
                                  
                                    // Load Ajax Datatables 
                                    // TODO: Masih ada Bugs CSRF Nyangkut
                                    // settingsPerjanjian.ajax.url = data.message.urlAjax;
                                    // dataTablesPerjanjian.destroy();
                                    // len = $('#tabel-perjanjian').find('thead').find('th').length;
                                    // $('#tabel-perjanjian').find('tbody').html('<tr>' + '<td colspan="' + len + '" class="text-center">Loading data...</td>' + '</tr>');
                                    // dataTablesPerjanjian = $('#tabel-perjanjian').DataTable(settingsPerjanjian);
                                    // dataTablesPerjanjian.draw();

                                    location.reload();
                                    
                                } else {
                                    show_alert('Error !!!', data.message.message, 'error');
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

        $bootbox.find('.modal-dialog').css('max-width', '500px');
        var $button = $bootbox.find('button').prop('disabled', true);
        var $button_submit = $bootbox.find('button.submitJanjian');

        $.get(base_url+'pendaftaran/ajaxKlikDetailKonfirmasiKehadiran?no_reg='+id, function(html) {
            $button.prop('disabled', false);
            $bootbox.find('.modal-body').empty().append(html);
        });
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

        if (value === 'promil' || value === 'konsultasi') {
            $('.hamil').hide();
            $(".hpht").val("");
            $(".tp").val("");
            $(".usia_kehamilan").val("");
			$(".tp").prop('required',false);
        }else{
            $('.hamil').show();
			$('.tp').attr("required", "required" );
        }
	}

    function set_usiaKehamilan($elm) 
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

	function set_usiaHpHt($elm) 
	{
		const value = $elm.val();
		var parts = value.split("-");
		var d1 = new Date(Number(parts[2]) - 1, Number(parts[1]) + 3, Number(parts[0]) - 7);
        // console.log('value: ',value, 'parts: ', parts, 'd1: ', d1);

		// Format dd-mm-yyyy di Kolom HPHT
		$(".hpht").val(d1.toLocaleDateString("es-CL"));

		var todayTp = new Date();
		var dd = String(todayTp.getDate()).padStart(2, '0');
		var mm = String(todayTp.getMonth() + 1).padStart(2, '0'); //January is 0!
		var yyyy = todayTp.getFullYear();

		// Moment Format
		newTp = parts[2] + '-' + parts[1] + '-' + parts[0];
		todayTp = yyyy + '-' + mm + '-' + dd ;
		
		var a = moment(newTp);
		var b = moment(todayTp);
		daysTp  = b.diff(a, 'week');

		console.log('TP:', newTp, '=> today:', todayTp, ' = usia kehamilan:', daysTp)

		// source: https://stackoverflow.com/a/49423808
		var diff = moment.duration(b.diff(a));
		console.log(diff.months() + " bulan, " + diff.weeks() + " pekan, " + diff.days()%7 + " hari.");
		console.log(40 + Math.floor(diff.asWeeks()) + " pekan, " + diff.days()%7 + " hari.");

		$(".usia_kehamilan").val(40 + daysTp);
		document.getElementById("nilaiKalkulasi").innerHTML = 40+Math.floor(diff.asWeeks()) + " pekan, " + Math.abs(diff.days()%7) + " hari.";
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
	$('.tp').change(function() {
		set_usiaHpHt($(this));
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
	$("#rencana_datang, #tp, #hpht").datepicker({
		format: "dd-mm-yyyy",
		weekStart: 1,
		locale: "id",
		language: "id",
		autoclose: true,
		todayHighlight: true
		// daysOfWeekDisabled: "0,1,2,3,4,5",
		// daysOfWeekHighlighted: "6",
	});

	$('#collapseOne').collapse({
		toggle: true
	});

    $('form#daftarOnsite').submit(function(e) {
        e.preventDefault();

        // const formData = $(this).serialize();
        const formData = new FormData(this); // Get form data

        fetch(base_url + 'pendaftaran/create', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Harap Refresh Halaman Ini Kembali!');
            }
            return response.json(); // or response.text() if not JSON
        })
        .then(response => {
            console.log(response);
            if (response.status === 'success') {
                Swal.fire({
                    title: "Pasien Berhasil Disimpan!",
                    text: "Pilih Langkah Selanjutnya..",
                    icon: "success",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "Ya, Input Lagi!",
                    cancelButtonText: 'Kembali Ke List!'
                }).then((result) => {
                    console.log(result);
                    if (result.isConfirmed) { //console.log(result.isConfirmed);
                        location.reload(); // Reload the page after successful deletion and alert
                    }else if (result.dismiss === Swal.DismissReason.cancel) { //console.log(result.isConfirmed);
                        window.location.href = base_url + 'pendaftaran'; // Redirect to desired page
                    }
                });
            } else {
                const formattedErrors = response.message.join('<br>');
                Swal.fire({
                    icon: 'error',
                    title: 'Validation Errors',
                    html: formattedErrors, // Use 'html' to render the line breaks
                    confirmButtonText: 'Baiklah!'
                });
            }
        })
        .catch(error => {
            // Handle AJAX errors
            Swal.fire(
                'Error!',
                error.message,
                'error'
            );
        });

    });

    $('.clikDetailNomor').on('click', function(e) {
        e.preventDefault();

        const loadingIndicator = document.getElementById('loading-spinner');
        loadingIndicator.style.display = 'block'; // Show the loading indicator

        var dataIdValue = $(this).data('id');
        console.log("Data ID:", dataIdValue);
        
        fetch(base_url + 'pendaftaran/cekNomorByName?searchValue='+dataIdValue, {
            method: 'GET'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Harap Refresh Halaman Ini Kembali!');
            }
            return response.json(); // or response.text() if not JSON
        })
        .then(response => {
            console.log(response);
            if (response.status === 'success') {
                $('#no_wa').val(response.message.wa_phone);
            } else {
                Swal.fire(
                    'Error!',
                    response.message,
                    'error'
                );
                $('#no_wa').val('');
            }
        })
        .catch(error => {
            // Handle AJAX errors
            Swal.fire(
                'Error!',
                error.message,
                'error'
            );
        })
        .finally(() => {
            loadingIndicator.style.display = 'none'; // Hide the loading indicator
        });

    });

});