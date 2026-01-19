// source: https://stackoverflow.com/a/42375876
$( document ).ready(function() {
    var a = document.getElementById("field-start_shift");
    var b = document.getElementById("field-end_shift");
    var c = document.getElementById("field-start_tgl_pekan");
    var d = document.getElementById("field-end_tgl_pekan");
    // var e = document.getElementById("field-tgl_lahir");

    (a != null) ? (a.type = "time") : '';
    (b != null) ? (b.type = "time") : '';  
    (c != null) ? (c.type = "date") : '';          
    (d != null) ? (d.type = "date") : '';         
    // (e != null) ? (e.type = "date") : '';
    
    $('#field-tgl_lahir').datepicker({ format: 'dd/mm/yyyy' }); // format to show

    $('body').delegate('.btn-view-absensi', 'click', function(e) {
        e.preventDefault();
        lihatAbsensi('2147483647');
    })

    const lihatAbsensi = (nik) => {
        $bootbox = bootbox.dialog({
            title: 'View Absensi',
            message: '<div class="text-center text-secondary"><div class="spinner-border"></div></div>',
            buttons: {
                cancel: {
                    label: 'Cancel'
                }
            }
        });
        $bootbox.find('.modal-dialog').css('max-width', '700px');
        var $button = $bootbox.find('button').prop('disabled', true);
    
        $.get(current_url + '/view_absensi?nik=' + nik, function(html) {
            $button.prop('disabled', false);
            $bootbox.find('.modal-body').empty().append(html);
        });
    }

});