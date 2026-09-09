/**
 * 	Developed by : Muchamad Desta Fadilah a.ka. topidesta
 *	Website		 : https://topidesta.my.id
 *	Year		 : 2023-2024
 *  Description  : Module Master Farmasi - Obat & Alkes
 */

jQuery(document).ready(function () {
  console.log("Init Module Obat");

  /* source: https://stackoverflow.com/a/67184094*/
  var tokenHash = $(
    "input[name=csrf_test_name]",
  ).val(); /*console.log(tokenHash)*/

  /* ============================================================
   * DATATABLES - List Obat (digunakan di listObat / getDataObat)
   * ============================================================ */
  if ($("#table-result").length > 0) {
    const column =
      typeof $("#dataTables-column").html() === "string"
        ? $.parseJSON($("#dataTables-column").html())
        : {};
    const url = $("#dataTables-url").text();

    const settings = {
      processing: true,
      serverSide: true,
      scrollX: true,
      ajax: {
        url: url,
        type: "POST",
        data: { csrf_test_name: tokenHash },
      },
      oLanguage: {
        sLengthMenu: "_MENU_ baris per halaman",
        sSearch: "Cari: _INPUT_",
        sInfo: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
        sInfoEmpty: "Tidak ada data",
        sZeroRecords: "Data tidak ditemukan",
        oPaginate: {
          sFirst: "Pertama",
          sPrevious: "Sebelumnya",
          sNext: "Selanjutnya",
          sLast: "Terakhir",
        },
      },
      columns: typeof column === "object" ? column : "",
      fnRowCallback: function (nRow, aoData, c) {
        /* Kolom Stok Berjalan - warna merah bila <= stok_minimal */
        var stokBerjalan = parseFloat(aoData["stok_berjalan"]) || 0;
        var stokMinimal = parseFloat(aoData["stok_minimal"]) || 0;

        if (stokBerjalan <= 0) {
          $("td", nRow)
            .eq(10)
            .html(
              '<span class="badge bg-danger">Habis (' +
                stokBerjalan +
                ")</span>",
            );
        } else if (stokBerjalan <= stokMinimal) {
          $("td", nRow)
            .eq(10)
            .html(
              '<span class="badge bg-warning text-dark">Hampir Habis (' +
                stokBerjalan +
                ")</span>",
            );
        }

        /* Kolom Harga Beli - format rupiah */
        if (aoData["harga_beli_satuan"]) {
          var hargaBeli = parseInt(aoData["harga_beli_satuan"]);
          $("td", nRow)
            .eq(7)
            .html("Rp " + hargaBeli.toLocaleString("id-ID"));
        }

        /* Kolom Harga Jual - format rupiah */
        if (aoData["harga_jual_satuan"]) {
          var hargaJual = parseInt(aoData["harga_jual_satuan"]);
          $("td", nRow)
            .eq(8)
            .html("Rp " + hargaJual.toLocaleString("id-ID"));
        }

        /* Kolom Tipe - badge */
        var tipe = aoData["tipe_barang"];
        if (tipe === "alkes") {
          $("td", nRow)
            .eq(3)
            .html('<span class="badge bg-info">' + tipe + "</span>");
        } else {
          $("td", nRow)
            .eq(3)
            .html('<span class="badge bg-primary">' + tipe + "</span>");
        }
      },
      initComplete: function (settings, json) {
        /* Cari hanya saat tekan Enter */
        $(".dataTables_filter input").unbind();
        $(".dataTables_filter input").bind("keyup", function (e) {
          if (e.keyCode == 13) {
            table.search(this.value).draw();
          }
        });
      },
    };

    let $add_setting = $("#dataTables-setting");
    if ($add_setting.length > 0) {
      var add_setting = $.parseJSON($("#dataTables-setting").html());
      for (var k in add_setting) {
        settings[k] = add_setting[k];
      }
    }

    const table = $("#table-result").DataTable(settings);
  }

  /* ============================================================
   * TYPEAHEAD - Pencarian nama obat di form resep / transaksi
   * ============================================================ */

  /* source: https://stackoverflow.com/a/30340490*/
  $(".nama_obat")
    .typeahead(
      {
        hint: true,
        highlight: true,
        minLength: 1,
      },
      {
        display: function (item) {
          console.log(item);
          return item.nama_obat;
        },
        limit: 12,
        async: true,
        templates: {
          empty: ['<div class="empty">Data Obat Tidak Ada!</div>'].join("\n"),
          suggestion: function (item) {
            return "<div>" + item.value + "</div>";
          },
        },
        source: function (query, processSync, processAsync) {
          console.log(query);
          /* processSync(['This suggestion appears immediately', 'This one too']);*/
          return $.ajax({
            url: base_url + "master/farmasi/obat-typeahead",
            dataType: "json",
            type: "POST",
            data: {
              max_rows: 15,
              q: query,
              csrf_test_name:
                tokenHash /* source: https://stackoverflow.com/a/50541928*/,
            },
            beforeSend: function (xhr) {
              xhr.setRequestHeader("csrf_test_name", tokenHash);
            },
            success: function (data) {
              var return_list = [],
                i = data.length;
              while (i--) {
                return_list[i] = {
                  id: data[i].id_obat,
                  value:
                    data[i].id_obat +
                    " - " +
                    data[i].nama_obat +
                    " - Stok: " +
                    data[i].stok_berjalan,
                  nama_obat: data[i].nama_obat,
                  id_satuan: data[i].id_satuan,
                  nama_satuan: data[i].nama_satuan,
                  harga_jual_obat: data[i].harga_jual_satuan,
                };
              }
              /* in this example, json is simply an array of strings*/
              return processAsync(return_list);
            },
          });
        },
      },
    )
    .on("typeahead:selected", onSelectNamaObat);

  /* source: https://stackoverflow.com/a/19540313*/
  function onSelectNamaObat($e, datum) {
    /*console.log(datum)*/
    $("#nama_obat").val(datum.nama_obat);
    $("#id_obat").val(datum.id);
    $("#id_satuan_obat").val(datum.id_satuan);
    $("#nama_satuan_obat").val(datum.nama_satuan);
    $("#harga_jual_obat").val(datum.harga_jual_obat);
    $("#harga_jual_obat_format").val(
      formatRupiah(datum.harga_jual_obat, "Rp. "),
    );
  }
});
