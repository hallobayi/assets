$().ready(function(){
    
    console.log('Init Module Obat');

    // source: https://stackoverflow.com/a/26683984
    // $('#konten_obat').load(urlObat, function( response, status, xhr ) {
    //     var responseAsObject = $.parseJSON(response);
    //     // console.log(responseAsObject);
    //     var table = document.getElementById('konten_obat');
    //     responseAsObject.data.forEach(function(object) {
    //         var tr = document.createElement('tr');
    //         tr.innerHTML = '<td>' + object.id + '</td>' +
    //             '<td>' + object.id_obat + '</td>' +
    //             '<td>' + object.id_satuan_obat + '</td>' +
    //             '<td>' + object.no_reg + '</td>';
    //         table.appendChild(tr);
    //     });
    // });

    // source: https://stackoverflow.com/a/67184094
    var tokenHash=$("input[name=csrf_test_name]").val(); //console.log(tokenHash)

    // source: https://stackoverflow.com/a/30340490
    $('.nama_obat').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        display: function(item){ console.log(item)
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
        source: function (query, processSync, processAsync) { console.log(query)
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
                    xhr.setRequestHeader('csrf_test_name' , tokenHash);    
                },
                success: function (data) {
                    var return_list = [], i = data.length;
                    while (i--) {
                        return_list[i] = {
                            id: data[i].id_obat,
                            value: data[i].id_obat + " - " + data[i].nama_obat + " - Stok: " + data[i].stok_berjalan,
                            nama_obat: data[i].nama_obat,
                            id_satuan: data[i].id_satuan,
                            nama_satuan: data[i].nama_satuan,
                            harga_jual_obat: data[i].harga_jual_satuan
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
        $('#id_satuan_obat').val(datum.id_satuan);
        $('#nama_satuan_obat').val(datum.nama_satuan);
        $('#harga_jual_obat').val(datum.harga_jual_obat);
        $('#harga_jual_obat_format').val(formatRupiah(datum.harga_jual_obat, 'Rp. '));
    }
})