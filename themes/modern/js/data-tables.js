/**
*	Developed by: Agus Prawoto Hadi
* 	Modified by : Muchamad Desta Fadilah a.ka. topidesta
*	Website		: https://topidesta.my.id
*	Year		: 2023-2024
*/

jQuery(document).ready(function () {
		
	if ( $('#data-tables').length) {
		const $setting = $('#dataTables-setting');
		let settings = {};
		if ($setting.length > 0) {
			settings = $.parseJSON($('#dataTables-setting').html());
		}
		
		const addSettings = 
		{
			// "dom":"Bfrtip",
			"buttons":[
				{"extend":"copy"
					,"text":"<i class='far fa-copy'></i> Copy"
					,"className":"btn-light me-1"
				},
				{"extend":"excel"
					, "title":"Data Mahasisa"
					, "text":"<i class='far fa-file-excel'></i> Excel"
					, "exportOptions": {
					  columns: [2, 3, 4, 5, 6, 7],
					  modifier: {selected: null}
					}
					, "className":"btn-light me-1"
				},
				{"extend":"pdf"
					,"title":"Data Mahasisa"
					,"text":"<i class='far fa-file-pdf'></i> PDF"
					, "exportOptions": {
					  columns: [2, 3, 4, 5, 6, 7],
					  modifier: {selected: null}
					}
					,"className":"btn-light me-1"
				},
				{"extend":"csv"
					,"title":"Data Mahasisa"
					,"text":"<i class='far fa-file-alt'></i> CSV"
					, "exportOptions": {
					  columns: [2, 3, 4, 5, 6, 7],
					  modifier: {selected: null}
					}
					,"className":"btn-light me-1"
				},
				{"extend":"print"
					,"title":"Data Mahasisa"
					,"text":"<i class='fas fa-print'></i> Print"
					, "exportOptions": {
					  columns: [2, 3, 4, 5, 6, 7],
					  modifier: {selected: null}
					}
					,"className":"btn-light"
				}
				
			]
		}
		
		// Merge settings
		// settings['lengthChange'] = false;
		settings = {...settings, ...addSettings};
		
		// settings['buttons'] = [ 'copy', 'excel', 'pdf', 'colvis' ];
		var table = $('#data-tables').DataTable(settings);
		table.buttons().container()
			.appendTo( '#data-tables_wrapper .col-md-6:eq(0)' );
		
		// No urut
		table.on( 'order.dt search.dt', function () {
			table.column(0, {search:'applied', order:'applied'}).nodes().each( function (cell, i) {
				cell.innerHTML = i+1;
			} );
		} ).draw();
			
	}
});