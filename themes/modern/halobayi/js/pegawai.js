/**
 * 	Developed by : Muchamad Desta Fadilah a.ka. topidesta
 *	Website		 : https://topidesta.my.id
 *	Year		 : 2023-2024
 *  Description  : [TODO]
 */

// LIST RIWAYAT ABSENSI
jQuery(document).ready(function() {

    // source: https://stackoverflow.com/a/67184094
    var tokenHash=$("input[name=csrf_test_name]").val(); //console.log(tokenHash)

	let dataTablesRiwayaKunjungan = '';
    const column = (typeof $('#riwayatfinger-column').html() === 'string') ? $.parseJSON($('#riwayatfinger-column').html()) : {};
    let url = $('#riwayatfinger-url').text();

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
                    dataTablesRiwayaKunjungan.search(this.value).draw();
                }
            });
        },
        "fnRowCallback": function(nRow, aoData) { console.log(aoData)
            
            // if (aoData['status_layanan'] === 'daftar') {
            //     // $(nRow).css('color', '#0072c6').css("font-weight", "Bold");
			// 	$('td', nRow).eq(9).text('Registrasi', nRow).css('color', 'Sienna').css("font-weight","Bold").addClass('kantongRelase').on("click", function(){ klikDetail(aoData['no_reg']); }).css('cursor', 'pointer');
            // }

        }
    }

	dataTablesRiwayaKunjungan = $('#tabel-riwayatfinger').DataTable(settings);
	dataTablesRiwayaKunjungan.columns.adjust().draw();

    $('#form-riwayatfinger').submit(function(e) {
		e.preventDefault(); // avoid to execute the actual submit of the form.

		let startDate = $("#startDate").val();
		let endDate = $("#endDate").val();
        var idPegawai=$("#idPegawai").val();

        settings.ajax.url = base_url + 'pegawai/getDataAbsensi?idPegawai='+idPegawai+'&startDate=' +startDate+ '&endDate=' +endDate;
        dataTablesRiwayaKunjungan.destroy();
        len = $('#tabel-riwayatfinger').find('thead').find('th').length;
        $('#tabel-riwayatfinger').find('tbody').html('<tr>' + '<td colspan="' + len + '" class="text-center">Loading data...</td>' + '</tr>');
        dataTablesRiwayaKunjungan = $('#tabel-riwayatfinger').DataTable(settings);
    })

    $('body').delegate('.tambah-absensi', 'click', function(e) {
        e.preventDefault();
        showFormAbsensi();
    });

    function showFormAbsensi() {
        let nikPegawai = $("#nikPegawai").val();
        $bootbox = bootbox.dialog({
            title: 'Tambah Lupa Absensi',
            message: '<div class="text-center text-secondary"><div class="spinner-border"></div></div>',
            buttons: {
                cancel: {
                    label: 'Cancel'
                },
                success: {
                    label: 'Submit',
                    className: 'btn-success submitAbsensi',
                    callback: function() {
                        $bootbox.find('.alert').remove();
                        $button_submit.prepend('<i class="fas fa-circle-notch fa-spin me-2 fa-lg"></i>');
                        $button.prop('disabled', true);

                        // Submit Lupa Absen
                        form = $bootbox.find('form')[0];
                        $.ajax({
                            type: 'POST',
                            url: base_url+'absensi/ajaxUpdateDataAbsenLupa?nikPegawai='+nikPegawai,
                            data: new FormData(form),
                            processData: false,
                            contentType: false,
                            dataType: 'json',
                            success: function(data) {

                                $bootbox.modal('hide');
                                if (data.status == 'ok') {
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
                                  
                                    dataTables.draw();
                                    
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

        $bootbox.find('.modal-dialog').css('max-width', '700px');
        var $button = $bootbox.find('button').prop('disabled', true);
        var $button_submit = $bootbox.find('button.submitAbsensi');

        $.get(base_url+'pegawai/ajaxFormLupaAbsen?nikPegawai='+nikPegawai, function(html) {
            $button.prop('disabled', false);
            $bootbox.find('.modal-body').empty().append(html);
            $('.tglLupaAbsen').flatpickr({
                dateFormat: "d-m-Y"
            });
            $('.jamLupaAbsen').flatpickr({
                enableTime: true,
                noCalendar: true,
                dateFormat: "H:i",
                time_24hr: true
            });
        });
    };

});