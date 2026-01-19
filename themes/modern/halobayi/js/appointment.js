/**
 * 	Developed by : Muchamad Desta Fadilah a.ka. topidesta
 *	Website		 : https://topidesta.my.id
 *	Year		 : 2024
 *  Description  : [TODO]
 */

jQuery(document).ready(function() {

    // source: https://stackoverflow.com/a/67184094
    var tokenHash=$("input[name=csrf_test_name]").val(); //console.log(tokenHash)

    let dataTablesPerjanjian = '';
    const column = (typeof $('#perjanjian-column').html() === 'string') ? $.parseJSON($('#perjanjian-column').html()) : {};
    let url = $('#perjanjian-url').text();

    const settingsPerjanjian = {
        "processing": true,
        "serverSide": true,
        "scrollX": true,
        "ajax": {
            "url": url,
            "type": "POST",
            "data": { 'csrf_test_name':tokenHash } // source: https://stackoverflow.com/a/50541928
        },
		// "order": [4, "desc"],
        "oLanguage": {
            "sLengthMenu": "_MENU_ records per page",
            "sSearch": "Cari <span style='color:#F00;'>(Tekan Enter)</span>: _INPUT_"
        },
        "columns": (typeof column === 'object') ? column : '',
        "initComplete": function(settingsPerjanjian, json) {
            // source: https://stackoverflow.com/a/30937415
            $('.dataTables_filter input').unbind();
            $('.dataTables_filter input').bind('keyup', function(e) {
                if (e.keyCode == 13) {
                    dataTablesPerjanjian.search(this.value).draw();
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

	dataTablesPerjanjian = $('#tabel-perjanjian').DataTable(settingsPerjanjian);
	dataTablesPerjanjian.columns.adjust().draw()

    $('body').delegate('.tambah-janji', 'click', function(e) {
        e.preventDefault();
		showFormJanji();
    });

    $('#form-perjanjian').submit(function(e) {

		e.preventDefault(); // avoid to execute the actual submit of the form.

		let startDate = $("#startDate").val();
		let endDate = $("#endDate").val();
		let lokasi = $("#cabang :selected").val();

        settingsPerjanjian.ajax.url = base_url + 'appointment/getDataPerjanjian?startDate=' + startDate + '&endDate=' + endDate + '&lokasi=' + lokasi;
        dataTablesPerjanjian.destroy();
        len = $('#tabel-perjanjian').find('thead').find('th').length;
        $('#tabel-perjanjian').find('tbody').html('<tr>' + '<td colspan="' + len + '" class="text-center">Loading data...</td>' + '</tr>');
        dataTablesPerjanjian = $('#tabel-perjanjian').DataTable(settingsPerjanjian);
    })

	function showFormJanji() {
        $bootbox = bootbox.dialog({
            title: 'Tambah Form Perjanjian',
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
                            url: base_url+'appointment/ajaxUpdateDataJanjian',
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

        $bootbox.find('.modal-dialog').css('max-width', '950px');
        var $button = $bootbox.find('button').prop('disabled', true);
        var $button_submit = $bootbox.find('button.submitJanjian');

        $.get(base_url+'appointment/ajaxFormJanjian', function(html) {
            $button.prop('disabled', false);
            $bootbox.find('.modal-body').empty().append(html);
            $('.tglJanjiDatang').flatpickr({
                dateFormat: "d-m-Y",
                minDate: new Date()
            });
            $('.jamJanjiDatang').flatpickr({
                enableTime: true,
                noCalendar: true,
                dateFormat: "H:i",
                time_24hr: true
            });
        });
    };

    $('#collapseOne').collapse({
		toggle: true
	})
});