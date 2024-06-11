/**
 *	Developed by: Agus Prawoto Hadi
 * 	Modified by : Muchamad Desta Fadilah a.ka. topidesta
 *	Website		: https://topidesta.my.id
 *	Year		: 2023-2024
 */

jQuery(document).ready(function() {

    const column = (typeof $('#dataTables-column').html() === 'string') ? $.parseJSON($('#dataTables-column').html()) : {};
    const url = $('#dataTables-url').text();

    const settings = {
        "processing": true,
        "serverSide": true,
        "scrollX": true,
        "ajax": {
            "url": url,
            "type": "POST"
        },
        "columns": column,
        "initComplete": function(settings, json) {
            table.rows().every(function(rowIdx, tableLoop, rowLoop) {
                $row = $(this.node());
                /* this
                	.child(
                		$(
                			'<tr>'+
                				'<td>'+rowIdx+'.1</td>'+
                				'<td>'+rowIdx+'.2</td>'+
                				'<td>'+rowIdx+'.3</td>'+
                				'<td>'+rowIdx+'.4</td>'+
                			'</tr>'
                		)
                	)
                	.show(); */
            });
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
});