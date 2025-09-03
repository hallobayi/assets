$(document).ready(function() {
	
	function generate_options(json) {
		options = '';
		$.each(json, function(i, v) {
			options += '<option value="' + i + '">' + v + '</option>';
		})
		
		return options;
	}
	
	function set_options($elm, url) 
	{
		let $next_option = '';
		let $wilayah = '';
		let url_wilayah = '';
		const value = $elm.val();

		if ($elm.hasClass('propinsi'))
		{
			$wilayah = $('.kabupaten, .kecamatan, .kelurahan').prop('disabled', true);
			$next_option = $('.kabupaten');
			url_wilayah = 'wilayah/ajaxgetkabupatenbyidpropinsi?id=' + value
		} 
		else if ($elm.hasClass('kabupaten')) {
			$wilayah = $('.kecamatan, .kelurahan').prop('disabled', true);
			$next_option = $('.kecamatan');
			url_wilayah = 'wilayah/ajaxgetkecamatanbyidkabupaten?id=' + value
		}
		else if ($elm.hasClass('kecamatan')) {
			$wilayah = $('.kelurahan').prop('disabled', true);
			$next_option = $('.kelurahan');
			url_wilayah = 'wilayah/ajaxgetkelurahanbyidkecamatan?id=' + value
		}
		
		if (!$next_option || ! $wilayah) {
			return false;
		}
		
		$spinner = $('<div class="spinner-border spinner-border-md" role="status" style="width: 1.5rem; height: 1.5rem; position:absolute; right: -27px; top:5px"></div>');
		
		$wrapper = $('<div>').css('position', 'relative');
		$wrapper.insertAfter($next_option);
		$wrapper.append($spinner);

		$.getJSON(base_url + url_wilayah, function(data) 
		{
			console.log('ff');
			new_options = generate_options(data);
			$wilayah.each (function(i, elm) 
			{
				$elm = $(elm);
				teks = '-- Pilih Kelurahan --';
				if ($elm.hasClass('kabupaten')) {
					teks = '-- Pilih Kabupaten --';
				} else if ($elm.hasClass('kecamatan')) {
					teks = '-- Pilih Kecamatan --';
				}
				
				if (i == 0) {
					$elm.prop('disabled', false)
				}
				$elm
					.empty()
					.append(new_options)
					.prepend('<option value="">' + teks + '</option>')
					.val('');
				$wrapper.remove();
			});
		});
	}

	$('.propinsi, .kabupaten, .kecamatan').change(function() {
		set_options($(this));
	});

    var tokenHash=$("input[name=csrf_test_name]").val(); //console.log(tokenHash)

	// Pencarian Kelurahan
    // source: https://stackoverflow.com/a/30340490
    $('.kelurahanTypeahead').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        display: function(item){
            return item.kelurahan 
        },
        limit: 12,
        async: true,
        templates: {
            empty: [
                '<div class="d-flex justify-content-center">Data Kelurahan Tidak Ada! </div>'
            ].join('\n'),
            suggestion: function (item){
                return '<div>' + item.value + '</div>'
            }
        },
        source: function (query, processSync, processAsync) {
        // processSync(['This suggestion appears immediately', 'This one too']);
            return $.ajax({
                url: base_url + 'wilayah/typeahead',
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
                            id: data[i].kd_prop,
                            value: data[i].nm_prop + ' - ' + data[i].nm_kab + ' - ' + data[i].nm_kec + ' - ' + data[i].nm_kel,
                            nama_propinsi: data[i].nm_prop,
                            nama_kabupaten: data[i].nm_kab,
                            nama_kecamatan: data[i].nm_kec,
                            nama_kelurahan: data[i].nm_kel,
                            kd_propinsi: data[i].kd_prop,
                            kd_kabupaten: data[i].kd_kab,
                            kd_kecamatan: data[i].kd_kec,
                            kd_kelurahan: data[i].kd_kel
                        };
                    }    
                    // in this example, json is simply an array of strings
                    return processAsync(return_list);
                }
            });
        }
    }).on('typeahead:selected', onSelectedKelurahan).on('typeahead:asyncrequest', function(e) {
        $(e.target).addClass('sLoading');
    }).on('typeahead:asynccancel typeahead:asyncreceive', function(e) {
        $(e.target).removeClass('sLoading');
    });

    // source: https://stackoverflow.com/a/19540313
    function onSelectedKelurahan($e, datum) { console.log(datum)

        // $('#id').val(datum.id);
    	$('#propinsiTypeahead').val(datum.nama_propinsi);
        $('#kabupatenTypeahead').val(datum.nama_kabupaten);
        $('#kecamatanTypeahead').val(datum.nama_kecamatan);

		// source: https://github.com/twitter/typeahead.js/issues/860#issuecomment-48430835
		$('#kelurahanTypeahead').typeahead('val', datum.nama_kelurahan)

		$('#id_wilayah_propinsi').val(datum.kd_propinsi);
        $('#id_wilayah_kabupaten').val(datum.kd_kabupaten);
        $('#id_wilayah_kecamatan').val(datum.kd_kecamatan);
        $('#id_wilayah_kelurahan').val(datum.kd_kelurahan);

        return $.ajax({
            url: base_url + 'wilayah/getDataWilayahSelected/'+datum.id,
            dataType: "json",
            type: "GET",
            success: function (data) {
                console.log(data)
            }
        });
    }
})