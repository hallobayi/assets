jQuery(document).ready(function() {

    var tokenHash=$("input[name=csrf_test_name]").val(); //console.log(tokenHash)

    let dataTables = '';
    $('body').delegate('#check-all', 'click', function() {
        var prop = $(this).prop('checked');
        $('#check-all-wrapper').find('input[type="checkbox"]').prop('checked', prop);
    });

    $('body').delegate('.check-role', 'click', function() {
        $form = $(this).parents('form').eq(0);
        num_not_checked = $form.find('input:not(:checked)').length;
        num_checked = $form.find('input:checked').length;
        num_input = $form.find('input').length;

        if (num_not_checked) {
            $('#check-all').prop('checked', false);
        }

        if (num_input == num_checked) {
            $('#check-all').prop('checked', true);
        }
    });

    $('#table-result').delegate('a[data-action="remove-role"]', 'click', function() {
        $this = $(this);
        // Module - User id
        id_menu = $this.attr('data-id-menu');
        id_role = $this.attr('data-role-id');
        $.ajax({
            type: 'POST',
            url: base_url + 'builtin/menu-role/delete',
            data: 'id_menu=' + id_menu + '&id_role=' + id_role,
            dataType: 'text',
            success: function(data) {
                // console.log(url_delete);
                data = $.parseJSON(data);
                if (data.status == 'ok') {
                    $this.parent().remove();
                } else {
                    Swal.fire({
                        title: 'Error !!!',
                        html: data.message,
                        icon: 'error',
                        showCloseButton: true,
                        confirmButtonText: 'OK'
                    })
                }
            },
            error: function(xhr) {
                console.log(xhr.responseText);
            }
        })
    });

    if ($('#table-result').length) {
        column = (typeof $('#dataTables-column').html() === 'string') ? $.parseJSON($('#dataTables-column').html()) : {};

        url = $('#dataTables-url').text();

        var settings = {
            "processing": true,
            "serverSide": true,
            "scrollX": true,
            "ajax": {
                "url": url,
                "type": "POST",
                "data": { 'csrf_test_name':tokenHash } // source: https://stackoverflow.com/a/50541928
                /* "dataSrc": function (json) {
                	console.log(json)
                } */
            },
            "columns": column
        }

        $add_setting = $('#dataTables-setting');
        if ($add_setting.length > 0) {
            add_setting = $.parseJSON($('#dataTables-setting').html());
            for (k in add_setting) {
                settings[k] = add_setting[k];
            }
        }

        dataTables = $('#table-result').DataTable(settings);
    }

    $('#table-result').delegate('.btn-edit', 'click', function(e) {

        e.preventDefault();
        $this = $(this);
        $td = $this.parent().prev();

        message = '<div class="loader-ring loader"></div>';
        $bootbox = bootbox.dialog({
            title: 'Edit Role',
            message: message,
            buttons: {
                cancel: {
                    label: 'Cancel'
                },
                success: {
                    label: 'Submit',
                    className: 'btn-success submit',
                    callback: function() {
                        $bootbox.find('.alert').remove();
                        $spinner = $('<span class="spinner-border spinner-border-sm me-2"></span>');
                        $spinner.prependTo($button_submit);
                        $button.prop('disabled', true);
                        id_menu = $this.attr('data-id-menu');

                        $checkbox_wrapper = $('#check-all-wrapper');
                        $.ajax({
                            type: 'POST',
                            url: current_url + '/edit',
                            data: $checkbox_wrapper.serialize() + '&id_menu=' + id_menu,
                            dataType: 'text',
                            success: function(data) {
                                data = $.parseJSON(data);
                                data_parent = $.parseJSON(data.data_parent);
                                if (data.status == 'ok') {
                                    new_badge = '';
                                    label = '';
                                    id_role = '';

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
                                    dataTables.draw(false);
                                } else {
                                    $spinner.remove();
                                    $button.prop('disabled', false);
                                    Swal.fire({
                                        title: 'Error !!!',
                                        html: data.message,
                                        icon: 'error',
                                        showCloseButton: true,
                                        confirmButtonText: 'OK'
                                    })
                                }
                            },
                            error: function(xhr) {
                                console.log(xhr.responseText);
                                $spinner.remove();
                                $button.prop('disabled', false);
                                Swal.fire({
                                    title: 'Error !!!',
                                    html: 'Ajax error, cek console browser',
                                    icon: 'error',
                                    showCloseButton: true,
                                    confirmButtonText: 'OK'
                                })
                            }
                        })
                        return false;
                    }
                }
            }
        });
        var $button = $bootbox.find('button').prop('disabled', true);
        var $button_submit = $bootbox.find('button.submit');
        var id = $(this).attr('data-id-menu');
        $.get(current_url + '/checkbox?id=' + id, function(html) {
            $button.prop('disabled', false);
            $bootbox.find('.modal-body').empty().append(html);
        });
    });
});