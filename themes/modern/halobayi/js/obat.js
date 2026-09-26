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
        data: function (d) {
          d.csrf_test_name = $("input[name=csrf_test_name]").val() || tokenHash;
        },
        dataSrc: function (json) {
          if (json.csrf && json.csrf.value) {
            tokenHash = json.csrf.value;
            $("input[name=csrf_test_name]").val(tokenHash);
          }
          return json.data ?? [];
        },
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
        /* Kolom Foto Obat (Index 1) */
        if (aoData["foto_obat"]) {
          if (!String(aoData["foto_obat"]).startsWith("<img")) {
            var value = aoData["foto_obat"];
            var html =
              '<img src="' +
              base_url +
              "files/foto-obat/thumbnail/" +
              value +
              '" width="64px" height="64px" class="image" alt="' +
              value +
              '" onerror="this.src=\'' +
              base_url +
              'images/foto/noimage.png\'" />';
            $("td", nRow).eq(1).html(html);
          }
        }

        /* Kolom Stok (Index 8) = total batch_obat.stok - merah bila habis, kuning bila <= stok_minimal */
var stokBerjalan = parseFloat(aoData["stok_berjalan"]) || 0;
        var stokMinimal = parseFloat(aoData["stok_minimal"]) || 0;

        if (stokBerjalan <= 0) {
          $("td", nRow)
            .eq(8)
.html(
              '<span class="badge bg-danger">Habis (' +
                stokBerjalan +
                ")</span>",
            );
        } else if (stokBerjalan <= stokMinimal) {
          $("td", nRow)
            .eq(8)
.html(
              '<span class="badge bg-warning text-dark">Hampir Habis (' +
                stokBerjalan +
                ")</span>",
            );
        }

        /* Kolom Harga Beli (Index 6) - format rupiah */
        if (aoData["harga_beli_satuan"]) {
          var hargaBeli = parseInt(aoData["harga_beli_satuan"]);
          $("td", nRow)
            .eq(6)
            .html("Rp " + hargaBeli.toLocaleString("id-ID"));
        }

        /* Kolom Harga Jual (Index 7) - format rupiah */
        if (aoData["harga_jual_satuan"]) {
          var hargaJual = parseInt(aoData["harga_jual_satuan"]);
          $("td", nRow)
            .eq(7)
            .html("Rp " + hargaJual.toLocaleString("id-ID"));
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

    /* ============================================================
     * DELETE OBAT - Popup Konfirmasi & Soft Delete via AJAX
     * ============================================================ */
    $("#table-result").on("click", ".btn-delete", function (e) {
      e.preventDefault();
      const $btn = $(this);
      const id = $btn.attr("data-id");
      const namaObat = $btn.attr("data-nama") || "obat ini";
      const deleteTitle =
        $btn.attr("data-delete-title") ||
        "Apakah Anda yakin ingin menghapus data obat: <strong>" +
          namaObat +
          "</strong>?";

      function executeDelete() {
        const currentToken =
          $("input[name=csrf_test_name]").val() || tokenHash || "";

        $.ajax({
          type: "POST",
          url: base_url + "master/farmasi/ajaxDeleteData",
          data: {
            id: id,
            csrf_test_name: currentToken,
          },
          dataType: "json",
          beforeSend: function (xhr) {
            xhr.setRequestHeader("X-CSRF-TOKEN", currentToken);
          },
          success: function (data) {
            if (data.csrf && data.csrf.value) {
              tokenHash = data.csrf.value;
              $("input[name=csrf_test_name]").val(tokenHash);
            }

            if (data.status === "ok") {
              if (typeof Swal !== "undefined") {
                const Toast = Swal.mixin({
                  toast: true,
                  position: "top-end",
                  showConfirmButton: false,
                  timer: 2500,
                  timerProgressBar: true,
                  iconColor: "white",
                  customClass: {
                    popup: "bg-success text-light toast p-2",
                  },
                  didOpen: (toast) => {
                    toast.addEventListener("mouseenter", Swal.stopTimer);
                    toast.addEventListener("mouseleave", Swal.resumeTimer);
                  },
                });
                Toast.fire({
                  html:
                    '<div class="toast-content"><i class="far fa-check-circle me-2"></i> ' +
                    (data.message || "Data obat berhasil dihapus") +
                    "</div>",
                });
              } else {
                alert(data.message || "Data obat berhasil dihapus");
              }

              // Update statistik ringkasan di atas tabel jika ada
              if (data.stats) {
                if ($("#total-alkes-obat").length)
                  $("#total-alkes-obat").text(data.stats.totalObatAll);
                if ($("#total-obat").length)
                  $("#total-obat").text(data.stats.totalObat);
                if ($("#stok-minimum").length)
                  $("#stok-minimum").text(data.stats.stokMinimum);
                if ($("#obat-habis").length)
                  $("#obat-habis").text(data.stats.obatHabis);
              }

              // Reload DataTables tanpa berpindah halaman
              table.ajax.reload(null, false);
            } else {
              if (typeof Swal !== "undefined") {
                Swal.fire({
                  icon: "error",
                  title: "Gagal Menghapus",
                  text: data.message || "Data obat gagal dihapus",
                });
              } else {
                alert(data.message || "Data obat gagal dihapus");
              }
            }
          },
          error: function (xhr) {
            if (typeof Swal !== "undefined") {
              Swal.fire({
                icon: "error",
                title: "Terjadi Kesalahan",
                text: "Gagal memproses permintaan ke server. Silakan coba lagi.",
              });
            } else {
              alert("Gagal memproses permintaan ke server.");
            }
            console.error(xhr.responseText);
          },
        });
      }

      // Popup konfirmasi: gunakan Swal.fire jika tersedia, fallback ke bootbox / confirm
      if (typeof Swal !== "undefined") {
        Swal.fire({
          title: "Konfirmasi Hapus",
          html: deleteTitle,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#dc3545",
          cancelButtonColor: "#6c757d",
          confirmButtonText: '<i class="fas fa-trash pe-1"></i> Ya, Hapus',
          cancelButtonText: '<i class="fas fa-times pe-1"></i> Batal',
          reverseButtons: true,
          focusCancel: true,
        }).then((result) => {
          if (result.isConfirmed) {
            executeDelete();
          }
        });
      } else if (typeof bootbox !== "undefined") {
        bootbox.confirm({
          title: "Konfirmasi Hapus",
          message: deleteTitle,
          buttons: {
            confirm: {
              label: '<i class="fas fa-trash pe-1"></i> Hapus',
              className: "btn-danger",
            },
            cancel: {
              label: '<i class="fas fa-times pe-1"></i> Batal',
              className: "btn-secondary",
            },
          },
          callback: function (confirmed) {
            if (confirmed) {
              executeDelete();
            }
          },
        });
      } else {
        if (
          confirm(
            "Apakah Anda yakin ingin menghapus data obat " + namaObat + " ?",
          )
        ) {
          executeDelete();
        }
      }
    });
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
