/**
 * 	Developed by : Muchamad Desta Fadilah a.ka. topidesta
 *	Website		 : https://topidesta.my.id
 *	Year		 : 2023-2024
 *  Description  : [TODO]
 */

// LIST PASIEN DI MASTER PASIEN
jQuery(document).ready(function() {
    
    // source: https://stackoverflow.com/a/67184094
    var tokenHash=$("input[name=csrf_test_name]").val(); //console.log(tokenHash)

    if ($('.select2').length > 0 ) {
		$(".select2").select2({
            placeholder: 'Select an option',
			theme: "bootstrap-5"
        }).on('select2:opening', function(e){
            $(this).data('select2').$dropdown.find(':input.select2-search__field').attr('placeholder', 'Ketik atau Klik Pilihan').focus()
        });
	}

    const column = (typeof $('#dataTables-column').html() === 'string') ? $.parseJSON($('#dataTables-column').html()) : {};
    const url = $('#dataTables-url').text();

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
                    table.search(this.value).draw();
                }
            });
        },
        "fnRowCallback": function(nRow, aoData, c) {

            console.log('nRow:',nRow, '\naoData:',aoData, '\naoKolom:',c);

            // Kolom "Nama"
            $('td', nRow).eq(1).html('<b>' + aoData['nama_pasien'] + ' </b><i style="color: #28c0e5" class="fa fa-venus"></i><br/><span class="label label-success">RM Lama: ' + aoData['nomor_rm_lama'] + '</span>', nRow).css('color', '#da8d5e').css("font-weight", "Bold");

            // Kolom "Petugas"
            $('td', nRow).eq(6).html('<b>' + aoData['HC_user#nama'] + ' </b><span class="label label-success"><br />Waktu: '+aoData['date_created']+' </span>', nRow).css('color', 'black');

            // Kolom "Nomor RM"
            $('td', nRow).eq(2).html('<b>' + aoData['nomor_rm'] + ' </b><span class="label label-success"></span>', nRow).css('color', 'black');

            // Kolom "Kontak"
            $('td', nRow).eq(7).html('<b><i style="color: #00a65a !important" class="fa fa-phone-square"></i> ' + aoData['nomor_hape'] + ' </b><br /><i style="color: #00a65a !important" class="fa fa-envelope"></i><span class="label label-success"> ' + aoData['email'] + '</span>', nRow);

            // Kolom IHS SatuSehat
            if (aoData['ihs'] === null || aoData['ihs'] === 'offline') {
                $('td', nRow).eq(8).text('🔁 Sinkronisasi Ulang!', nRow).css('color', 'Sienna').css("font-weight","Bold").addClass('cekIhsPasien').on("click", function(){ postIhsPasien(aoData['HC_pasien#nik']); }).css('cursor', 'pointer');
                // $('td', nRow).eq(8).text('Cek IHS', nRow).css('color', 'Sienna').css("font-weight","Bold").addClass('cekIhsPasien').on("click", function(){ cekIhsPasien(aoData['HC_pasien#nik']); }).css('cursor', 'pointer');
            } else {
                $('td', nRow).eq(8).text(aoData['ihs'], nRow).css('color', '#da8d5e').css("font-weight", "Bold");
            }
        }
    }

    const cekIhsPasien = (nik) => { console.log(nik)
        const urlModul = $('#modul-url').text();
        $.ajax({
        url: urlModul+'/'+'cekIhsPasien'+'/'+nik,
        dataType: "json",
        type: "GET",
        success: function(data) { console.log(data)
            if (data.status === 'success') {
                Swal.fire({
                    title: "Berhasil Update Nomor IHS!",
                    text: data.pesan,
                    icon: "success"
                }).then((result) => { console.log(result)
                    location.reload();
                });
            }else{
                console.log('gagal coy')
            }
        }
     });
    }

    const postIhsPasien = (nik) => { console.log(nik)
        const urlModul = $('#modul-url').text();
        $.ajax({
        url: urlModul+'/'+'postIhsPasien'+'/'+nik,
        dataType: "json",
        type: "GET",
        success: function(data) { console.log(data)
            // if (data.status === 'success') {
            //     Swal.fire({
            //         title: "Berhasil Update Nomor IHS!",
            //         text: data.pesan,
            //         icon: "success"
            //     }).then((result) => { console.log(result)
            //         location.reload();
            //     });
            // }else{
            //     console.log('gagal coy')
            // }
        }
     });
    }

    let $add_setting = $('#dataTables-setting');
    if ($add_setting.length > 0) {
        add_setting = $.parseJSON($('#dataTables-setting').html());
        for (k in add_setting) {
            settings[k] = add_setting[k];
        }
    }

    const table = $('#table-result').DataTable(settings);
    table.columns.adjust().draw()

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

});

// LIST KUNJUNGAN PASIEN DI PROFILE
jQuery(document).ready(function() {

    // source: https://stackoverflow.com/a/67184094
    var tokenHash=$("input[name=csrf_test_name]").val(); //console.log(tokenHash)

	let dataTablesRiwayaKunjungan = '';
    const column = (typeof $('#riwayatkunjungan-column').html() === 'string') ? $.parseJSON($('#riwayatkunjungan-column').html()) : {};
    let url = $('#riwayatkunjungan-url').text();

    const settingRiwayat = {
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
        "initComplete": function(settingRiwayat, json) {
            // source: https://stackoverflow.com/a/30937415
            $('.dataTables_filter input').unbind();
            $('.dataTables_filter input').bind('keyup', function(e) {
                if (e.keyCode == 13) {
                    dataTablesRiwayaKunjungan.search(this.value).draw();
                }
            });
        },
        "fnRowCallback": function(nRow, aoData) { //console.log(aoData)
            
            // if (aoData['status_layanan'] === 'daftar') {
            //     // $(nRow).css('color', '#0072c6').css("font-weight", "Bold");
			// 	$('td', nRow).eq(9).text('Registrasi', nRow).css('color', 'Sienna').css("font-weight","Bold").addClass('kantongRelase').on("click", function(){ klikDetail(aoData['no_reg']); }).css('cursor', 'pointer');
            // }

        }
    }

	dataTablesRiwayaKunjungan = $('#tabel-riwayatkunjungan').DataTable(settingRiwayat);
	dataTablesRiwayaKunjungan.columns.adjust().draw()
});

// LIST TTD DOCUMENT DIGITALL
jQuery(document).ready(function() {
    // source: https://stackoverflow.com/a/67184094
    var tokenHash=$("input[name=csrf_test_name]").val(); //console.log(tokenHash)

	let dataTablesRiwayatTtd = '';
    const columnTtd = (typeof $('#riwayatttd-column').html() === 'string') ? $.parseJSON($('#riwayatttd-column').html()) : {};
    let urlTtd = $('#riwayatttd-url').text();

    const settingsTtd = {
        "processing": true,
        "serverSide": true,
        "scrollX": true,
        "ajax": {
            "url": urlTtd,
            "type": "POST",
            "data": { 'csrf_test_name':tokenHash } // source: https://stackoverflow.com/a/50541928
        },
        "oLanguage": {
            "sLengthMenu": "_MENU_ records per page",
            "sSearch": "Cari <span style='color:#F00;'>(Tekan Enter)</span>: _INPUT_"
        },
        "columns": (typeof columnTtd === 'object') ? columnTtd : '',
        "initComplete": function(settingsTtd, json) {
            // source: https://stackoverflow.com/a/30937415
            $('.dataTables_filter input').unbind();
            $('.dataTables_filter input').bind('keyup', function(e) {
                if (e.keyCode == 13) {
                    dataTablesRiwayatTtd.search(this.value).draw();
                }
            });
        },
        "fnRowCallback": function(nRow, aoData) { //console.log(aoData)
            switch (aoData['jenis_ttd']) {
                case 'general':
                    $('td', nRow).eq(2).text('🗎 General Consent', nRow).css('color', '#3ca870').css("font-weight","Bold").addClass('documentRead').on("click", function(){ documentRead(aoData['id_ttd_digital'],'general'); }).css('cursor', 'pointer');
                    break;
                default:
                    $('td', nRow).eq(2).text('🗎 Inform Consent', nRow).css('color', '#3ca870').css("font-weight","Bold").addClass('documentRead').on("click", function(){ documentRead(aoData['id_ttd_digital'],'inform'); }).css('cursor', 'pointer');
                    break;
            }
        }
    }

	dataTablesRiwayatTtd = $('#tabel-riwayatttd').DataTable(settingsTtd);
	dataTablesRiwayatTtd.columns.adjust().draw();

});

// OPEN KYC
jQuery(document).ready(function() {
    var idDoc = $('.openKYC').attr('data-id');
    var frmKyc = $('.openKYC');
    frmKyc.click(function (e) { console.log(idDoc)
        e.preventDefault();
        alert('sedang dikembangkan');
    });
});

// OPEN DOCUMENT
function documentRead(id,tipe) {
    $bootbox = bootbox.dialog({
        title: 'Liat Document',
        message: '<div class="text-center text-secondary"><div class="spinner-border"></div></div>',
        buttons: {
            cancel: {
                label: 'Cancel'
            }
        }
    });

    $bootbox.find('.modal-dialog').css('max-width', '700px');
    var $button = $bootbox.find('button').prop('disabled', true);

    $.get(base_url+'document/ajaxReadDocument?id_ttd='+id+'&tipeDoc='+tipe+'&noreg=', function(html) {
        $button.prop('disabled', false);
        $bootbox.find('.modal-body').empty().append(html);
    });
}

jQuery(document).ready(function() {
    $(document).on('click', '.openSurat', function (e) {
        var idFrm = $(this).data('id');
        e.preventDefault();

        $bootbox = bootbox.dialog({
            title: 'Surat Keterangan',
            message: '<div class="text-center text-secondary"><div class="spinner-border"></div></div>',
            buttons: {
                cancel: {
                    label: 'Cancel'
                },
                // success: {
                //     label: 'Submit',
                //     className: 'btn-success submitTtd',
                //     callback: function() {
                //         $bootbox.find('.alert').remove();
                //         $button_submit.prepend('<i class="fas fa-circle-notch fa-spin me-2 fa-lg"></i>');
                //         $button.prop('disabled', true);

                //         // Submit Tanda Tangan Digitall
                //         form = $bootbox.find('form')[0];
                //         $.ajax({
                //             type: 'POST',
                //             url: base_url+'signature/ajaxUpdateTtd/'+idFrm,
                //             data: new FormData(form),
                //             processData: false,
                //             contentType: false,
                //             dataType: 'json',
                //             success: function(data) {

                //                 $bootbox.modal('hide');
                //                 if (data.status == 'ok') {
                //                     const Toast = Swal.mixin({
                //                         toast: true,
                //                         position: 'top-end',
                //                         showConfirmButton: false,
                //                         timer: 2500,
                //                         timerProgressBar: true,
                //                         iconColor: 'white',
                //                         customClass: {
                //                             popup: 'bg-success text-light toast p-2'
                //                         },
                //                         didOpen: (toast) => {
                //                             toast.addEventListener('mouseenter', Swal.stopTimer)
                //                             toast.addEventListener('mouseleave', Swal.resumeTimer)
                //                         }
                //                     })
                //                     Toast.fire({
                //                         html: '<div class="toast-content"><i class="far fa-check-circle me-2"></i> Data berhasil disimpan</div>'
                //                     })
                                  
                //                     dataTables.draw();
                                    
                //                 } else {
                //                     show_alert('Error !!!', data.message, 'error');
                //                 }
                //             },
                //             error: function(xhr) {
                //                 show_alert('Error !!!', xhr.responseText, 'error');
                //                 console.log(xhr.responseText);
                //             }
                //         })
                //         return false;
                //     }
                // }
            }
        });

        $bootbox.find('.modal-dialog').css('max-width', '700px');
        var $button = $bootbox.find('button').prop('disabled', true);
        // var $button_submit = $bootbox.find('button.submitAbsensi');

        $.get(base_url+'master/pasien/surat?form='+idFrm, function(html) {
            $button.prop('disabled', false);
            $bootbox.find('.modal-body').empty().append(html);
        });

    });
});

// DATATABLES ICD 9 & 10
jQuery(document).ready(function() {

    // source: https://stackoverflow.com/a/67184094
    var tokenHash=$("input[name=csrf_test_name]").val(); //console.log(tokenHash)

    // LIST ICD9
	let datatablesIcdSembilan = '';
    const column = (typeof $('#icd9-column').html() === 'string') ? $.parseJSON($('#icd9-column').html()) : {};
    let url = $('#icd9-url').text();

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
                    datatablesIcdSembilan.search(this.value).draw();
                }
            });
        },
        "fnRowCallback": function(nRow, aoData) { //console.log(aoData)
        }
    }

	datatablesIcdSembilan = $('#tabel-icd9').DataTable(settings);
	datatablesIcdSembilan.columns.adjust().draw();

    // LIST ICD10
	let datatablesIcdSepuluh = '';
    const columnSepuluh = (typeof $('#icd10-column').html() === 'string') ? $.parseJSON($('#icd10-column').html()) : {};
    let urlSepuluh = $('#icd10-url').text();

    const settingsSepuluh = {
        "processing": true,
        "serverSide": true,
        "scrollX": true,
        "ajax": {
            "url": urlSepuluh,
            "type": "POST",
            "data": { 'csrf_test_name':tokenHash } // source: https://stackoverflow.com/a/50541928
        },
        "oLanguage": {
            "sLengthMenu": "_MENU_ records per page",
            "sSearch": "Cari <span style='color:#F00;'>(Tekan Enter)</span>: _INPUT_"
        },
        "columns": (typeof columnSepuluh === 'object') ? columnSepuluh : '',
        "initComplete": function(settings, json) {
            // source: https://stackoverflow.com/a/30937415
            $('.dataTables_filter input').unbind();
            $('.dataTables_filter input').bind('keyup', function(e) {
                if (e.keyCode == 13) {
                    datatablesIcdSepuluh.search(this.value).draw();
                }
            });
        },
        "fnRowCallback": function(nRow, aoData) {//console.log(aoData)
        }
    }

	datatablesIcdSepuluh = $('#tabel-icd10').DataTable(settingsSepuluh);
	datatablesIcdSepuluh.columns.adjust().draw();

    var idFrm = $('.sinkronUlang').attr('data-id');
    var frmTtd = $('.sinkronUlang');
    frmTtd.click(function (e) { console.log(idFrm)
        e.preventDefault();

        $bootbox = bootbox.dialog({
            title: 'Sinkronisasi Ulang Satusehat Pasien',
            message: '<div class="text-center text-secondary"><div class="spinner-border"></div></div>',
        });

        $bootbox.find('.modal-dialog').css('max-width', '700px');
        var $button = $bootbox.find('button').prop('disabled', true);

        $.get(base_url+'master/pasien/sinkronUlang/'+idFrm, function(html) {
            $button.prop('disabled', false);
            $bootbox.find('.modal-body').empty().append(html);
        });
    });

    var frmSinkronAwal = $('.sinkronAwal');
    frmSinkronAwal.click(function (e) { 
        e.preventDefault();

        var idNikPasien = $('#nik').val();  //console.log(idNikPasien);      
        $bootbox = bootbox.dialog({
            title: 'Sinkronisasi Satusehat Pasien',
            message: '<div class="text-center text-secondary"><div class="spinner-border"></div></div>',
        });

        $bootbox.find('.modal-dialog').css('max-width', '700px');
        var $button = $bootbox.find('button').prop('disabled', true);

        $.get(base_url+'tanpalogin/cekSatusehatPasien?nikPasien='+idNikPasien, function(html) {
            $button.prop('disabled', false);
            $bootbox.find('.modal-body').empty().append(html);
        });
    });

    $('#nik').keyup(function() {
        var jenDis = document.getElementById("jenis_identitas");
        var jenDisValue = jenDis.options[jenDis.selectedIndex].value;

        // Pastikan Nomor KTP!
        if ($(this).val().length == 16 && jenDisValue === 'ktp') {
            console.log('do delay with ajax here');
            $.ajax({
                type: "GET",
                dataType: "json",
                url: base_url+'tanpalogin/cekSatusehatPasien?nikPasien='+ $(this).val(),
                // data: 'order=' + $(this).val(),
                cache: false,
                success: function(json) { console.log(json);
                    if (json.status === 'success') {
                        $("#status_satset").css("display", "block");
                        $("#isi_status_satset").text(json.desc +' Nomor IHS: '+json.data);
                        $("#ihs_number").val(json.data);
                    }else{
                        $("#status_satset").css("display", "none");
                        $("#isi_status_satset").text('');
                        $("#ihs_number").val('');
                    }
                }
            });
        }
    });
});