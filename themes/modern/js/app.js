$(function() {

    // source: https://stackoverflow.com/a/67184094
    var tokenHash=$("input[name=csrf_test_name]").val();

    // source: https://stackoverflow.com/a/30340490
    $('#no_rm_header').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        display: function(item){
            return item.no_rm 
        },
        limit: 12,
        async: true,
        templates: {
            empty: [
                '<div class="empty">Data Pasien Tidak Ada!</div>'
            ].join('\n'),
            suggestion: function (item){
                return '<div>' + item.value + '</div>'
            }
        },
        source: function (query, processSync, processAsync) {
        // processSync(['This suggestion appears immediately', 'This one too']);
          return $.ajax({
            url: base_url + 'master/pasien/typeahead',
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
                    return_list[i] = {
                        id: data[i].id_pasien,
                        value: data[i].nomor_rm + " - " + data[i].nama_pasien,
                        no_rm: data[i].nomor_rm,
                        nama: data[i].nama_pasien,
                        tgl_lahir_ibu: data[i].tgl_lahir_ibu
                    };
                }    
              // in this example, json is simply an array of strings
              return processAsync(return_list);
            }
          });
        }
    }).on('typeahead:selected', onSelectedNomorRmHeader);

    // source: https://stackoverflow.com/a/19540313
    function onSelectedNomorRmHeader($e, datum) {
        window.location = base_url+'master/pasien/profile/'+datum.no_rm;
    }

    // source: https://stackoverflow.com/a/30340490
    $('.no_rm').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        display: function(item){
            return item.no_rm 
        },
        limit: 12,
        async: true,
        templates: {
            empty: [
                '<div class="empty">Data Pasien Tidak Ada! ~ <a target="_blank" href="'+base_url+'master/pasien/add">Tambah Pasien</a></div>'
            ].join('\n'),
            suggestion: function (item){
                return '<div>' + item.value + '</div>'
            }
        },
        source: function (query, processSync, processAsync) {
        // processSync(['This suggestion appears immediately', 'This one too']);
          return $.ajax({
            url: base_url + 'master/pasien/typeahead',
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
                    return_list[i] = {
                        id: data[i].id_pasien,
                        value: data[i].nomor_rm + " - " + data[i].nama_pasien,
                        no_rm: data[i].nomor_rm,
                        nama: data[i].nama_pasien,
                        tgl_lahir_ibu: $.date(data[i].tgl_lahir_ibu)
                    };
                }    
              // in this example, json is simply an array of strings
              return processAsync(return_list);
            }
          });
        }
    }).on('typeahead:selected', onSelectedNomorRm);

    // source: https://stackoverflow.com/a/19540313
    function onSelectedNomorRm($e, datum) {
        $('#nama_ibu').val(datum.nama);
        $('#tanggal_lahir_ibu').val(datum.tgl_lahir_ibu);
    }

    // source: https://stackoverflow.com/a/16958005
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

    // source: https://stackoverflow.com/a/30340490
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
        // processSync(['This suggestion appears immediately', 'This one too']);
          return $.ajax({
            url: base_url + 'master/rekammedis/icd10-typeahead',
            dataType: "json",
            type: "POST",
            data: {
                max_rows: 15,
                q:query,
                csrf_test_name:tokenHash // source: https://stackoverflow.com/a/50541928
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
              // in this example, json is simply an array of strings
              return processAsync(return_list);
            }
          });
        }
    }).on('typeahead:selected', onSelectedDiagnosa);

    // source: https://stackoverflow.com/a/19540313
    function onSelectedDiagnosa($e, datum) {
        $('#nama_diagnosa').val(datum.nama_diagnosa);
        $('#diagnosa_utama').val(datum.id);
    }

    // source: https://stackoverflow.com/a/30340490
    $('.tindakan').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        display: function(item){
            return item.id 
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
        // processSync(['This suggestion appears immediately', 'This one too']);
            return $.ajax({
            url: base_url + 'master/rekammedis/icd9-typeahead',
            dataType: "json",
            type: "POST",
            data: {
                max_rows: 15,
                q:query,
                csrf_test_name:tokenHash // source: https://stackoverflow.com/a/50541928
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
                // in this example, json is simply an array of strings
                return processAsync(return_list);
            }
            });
        }
    }).on('typeahead:selected', onSelectedTindakan);

    // source: https://stackoverflow.com/a/19540313
    function onSelectedTindakan($e, datum) {
        $('#nama_tindakan').val(datum.nama_tindakan);
    }

    // source: https://stackoverflow.com/a/30340490
    $('.nama_obat').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        display: function(item){
            return item.nama_obat
        },
        limit: 12,
        async: true,
        templates: {
            empty: [
                '<div class="empty">Data Obat Tidak Ada!</div>'
            ].join('\n'),
            suggestion: function (item){
                return '<div>' + item.value + '</div>'
            }
        },
        source: function (query, processSync, processAsync) { //console.log(tokenHash)
        // processSync(['This suggestion appears immediately', 'This one too']);
            return $.ajax({
                url: base_url + 'master/farmasi/obat-typeahead',
                dataType: "json",
                type: "POST",
                data: {
                    max_rows: 15,
                    q:query,
                    csrf_test_name:tokenHash // source: https://stackoverflow.com/a/50541928
                },
                beforeSend: function (xhr) {       
                    xhr.setRequestHeader('X-CSRF-Token' , tokenHash);    
                },
                success: function (data) {
                    var return_list = [], i = data.length;
                    while (i--) {
                        return_list[i] = {
                            id: data[i].id_obat,
                            value: data[i].id_obat + " - " + data[i].nama_obat,
                            nama_obat: data[i].nama_obat
                        };
                    }    
                    // in this example, json is simply an array of strings
                    return processAsync(return_list);
                }
            });
        }
    }).on('typeahead:selected', onSelectNamaObat);

    // source: https://stackoverflow.com/a/19540313
    function onSelectNamaObat($e, datum) { //console.log(datum)
        $('#nama_obat').val(datum.nama_obat);
        $('#id_obat').val(datum.id);
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
    var MainApp = function() {};

    MainApp.prototype.initLoader = function() {
        // Preloader
        $(window).on("load", function() {
            $("#status").fadeOut();
            $("#preloader").delay(250).fadeOut("slow");
        });
    };
    (MainApp.prototype.init = function() {
        this.initLoader();
    }),
    //init
    ($.MainApp = new MainApp()),
    ($.MainApp.Constructor = MainApp);
})(window.jQuery),
//initializing
(function($) {
    "use strict";
    $.MainApp.init();
})(window.jQuery);