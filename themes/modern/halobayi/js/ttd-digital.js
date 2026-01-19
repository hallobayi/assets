// OPEN TTD DIGITAL
jQuery(document).ready(function() {
    var idFrm = $('.openSignature').attr('data-id');
    var frmTtd = $('.openSignature');
    frmTtd.click(function (e) { console.log(idFrm)
        e.preventDefault();

        $bootbox = bootbox.dialog({
            title: 'Tambah Tanda Tangan Digital',
            message: '<div class="text-center text-secondary"><div class="spinner-border"></div></div>',
            buttons: {
                cancel: {
                    label: 'Cancel'
                },
                reset: {
                    label: "Reset TTD",
                    className: "btn-danger",
                    callback: function() {
                        resetSignature();
                        return false;
                    }
                },
                success: {
                    label: 'Submit',
                    className: 'btn-success submitTtd',
                    callback: function() {
                        $bootbox.find('.alert').remove();
                        $button_submit.prepend('<i class="fas fa-circle-notch fa-spin me-2 fa-lg"></i>');
                        $button.prop('disabled', true);

                        // Submit Tanda Tangan Digitall
                        form = $bootbox.find('form')[0];
                        $.ajax({
                            type: 'POST',
                            url: base_url+'signature/ajaxUpdateTtd?unik_id='+idFrm,
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

        $.get(base_url+'signature/ajaxFormTambahTtd?unik_id='+idFrm, function(html) {
            $button.prop('disabled', false);
            $bootbox.find('.modal-body').empty().append(html);

            // $('.tglLupaAbsen').flatpickr({
            //     dateFormat: "d-m-Y"
            // });
            // $('.jamLupaAbsen').flatpickr({
            //     enableTime: true,
            //     noCalendar: true,
            //     dateFormat: "H:i",
            //     time_24hr: true
            // });
        });
    
    });

    // ON TODO: 
    var viewFrmTtd = $('.viewSignature');
    viewFrmTtd.click(function (e) {
        alert('dalam pengembangan');
    })
});