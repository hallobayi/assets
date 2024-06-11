/**
 * 	Developed by : Muchamad Desta Fadilah a.ka. topidesta
 *	Website		: https://topidesta.my.id
 *	Year		: 2023-2024
 */

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
        "fnRowCallback": function(nRow, aoData) {
            // if (aoData[11] === '~~TIDAK TERSEDIA~~') {
            //     $(nRow).css('color', '#0072c6').css("font-weight", "Bold");
            // } else {
            //     $('td', nRow).eq(11).text(aoData[11], nRow).css('color', '#0072c6').css("font-weight", "Bold");
            // }

            // // if (aoData[12] === '~~TIDAK TERSEDIA~~') {
            // //     $(nRow).css('color', '#da8d5e').css("font-weight", "Bold");
            // // } else {
            // //     $('td', nRow).eq(12).text(aoData[12], nRow).css('color', '#da8d5e').css("font-weight", "Bold");
            // // }
        }
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