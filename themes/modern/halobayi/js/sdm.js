/* source: https://stackoverflow.com/a/42375876*/
$(document).ready(function () {
  var a = document.getElementById("field-start_shift");
  var b = document.getElementById("field-end_shift");
  var c = document.getElementById("field-start_tgl_pekan");
  var d = document.getElementById("field-end_tgl_pekan");
  /* var e = document.getElementById("field-tgl_lahir");*/

  a != null ? (a.type = "time") : "";
  b != null ? (b.type = "time") : "";
  c != null ? (c.type = "date") : "";
  d != null ? (d.type = "date") : "";
  /* (e != null) ? (e.type = "date") : '';*/

  $("#field-tgl_lahir").datepicker({
    format: "dd/mm/yyyy",
  }); /* format to show*/

  $("body").delegate(".btn-view-absensi", "click", function (e) {
    e.preventDefault();
    lihatAbsensi("2147483647");
  });

  const lihatAbsensi = (nik) => {
    $bootbox = bootbox.dialog({
      title: "View Absensi",
      message:
        '<div class="text-center text-secondary"><div class="spinner-border"></div></div>',
      buttons: {
        cancel: {
          label: "Cancel",
        },
      },
    });
    $bootbox.find(".modal-dialog").css("max-width", "700px");
    var $button = $bootbox.find("button").prop("disabled", true);

    $.get(current_url + "/view_absensi?nik=" + nik, function (html) {
      $button.prop("disabled", false);
      $bootbox.find(".modal-body").empty().append(html);
    });
  };

  /* ===================================================================
     Grid Jadwal Pegawai - master/sdm/jadwal-pegawai

     Tombol #btn-tampilkan-jadwal-pegawai mengirim seluruh isi grid lewat
     AJAX ke Sdm::save_jadwal_pegawai(), yang menulis ke tabel
     jadwal_pegawai (1 baris per minggu) + jadwal_pegawai_detail
     (1 baris per pegawai per tanggal). Ganti bulan/tahun/cabang akan
     menarik ulang jadwal yang sudah tersimpan lewat data-jadwal-pegawai.
     =================================================================== */
  var $btnTampilkanJadwalPegawai = $("#btn-tampilkan-jadwal-pegawai");
  if ($btnTampilkanJadwalPegawai.length) {
    var $jadwalPegawaiTables = $("#jadwal-pegawai-tables");
    var $jadwalPegawaiInfo = $("#jadwal-pegawai-info");
    var hariNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu", "Minggu"];

    var jadwalMeta = { pegawai: [], shift: [] };
    try {
      jadwalMeta = JSON.parse($("#jadwal-pegawai-meta").text() || "{}") || jadwalMeta;
    } catch (e) {
      jadwalMeta = { pegawai: [], shift: [] };
    }
    var pegawaiList = jadwalMeta.pegawai || [];
    var jadwalTerbaca = false;
    var shiftList = jadwalMeta.shift || [];

    var urlSdm = current_url.replace(/jadwal-pegawai.*$/, "");
    var urlDataJadwal = urlSdm + "data-jadwal-pegawai";
    var urlSimpanJadwal = urlSdm + "save-jadwal-pegawai";
    var urlSimpanShift = urlSdm + "save-shift-jadwal";

    var pad2 = function (angka) {
      return (angka < 10 ? "0" : "") + angka;
    };

    var isoDate = function (d) {
      return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
    };

    var escHtml = function (teks) {
      return $("<div>").text(teks == null ? "" : teks).html();
    };

    var periodeJadwal = function () {
      return {
        bulan: $('select[name="bulan"]').val(),
        tahun: $('select[name="tahun"]').val(),
        kode_cabang: $('select[name="cabang"]').val(),
      };
    };

    var cabangDipilih = function (periode) {
      return !!periode.kode_cabang && periode.kode_cabang !== "9999";
    };

    /* notie v3: alert(type, message, seconds) */
    var notieAlert = function (tipe, pesan, detik) {
      if (typeof notie === "undefined" || typeof notie.alert !== "function") {
        if (tipe === "error" && typeof Swal !== "undefined") {
          Swal.fire("Error!", pesan, "error");
        }
        return;
      }
      notie.alert(tipe, pesan, detik || 2);
    };

    var infoJadwal = function (pesan, tipe) {
      if (!pesan) {
        $jadwalPegawaiInfo.addClass("d-none").empty();
        return;
      }
      $jadwalPegawaiInfo
        .removeClass("d-none alert-light alert-warning alert-success alert-danger")
        .addClass("alert-" + (tipe || "light"))
        .html(pesan);
    };

    var getMonthWeeks = function (bulan, tahun) {
      bulan = parseInt(bulan, 10);
      tahun = parseInt(tahun, 10);

      var lastDate = new Date(tahun, bulan, 0);

      var cursor = new Date(tahun, bulan - 1, 1);
      var dow = cursor.getDay(); /* 0=Minggu .. 6=Sabtu */
      var diffToMonday = dow === 0 ? 6 : dow - 1;
      cursor.setDate(cursor.getDate() - diffToMonday);

      var weeks = [];
      while (cursor <= lastDate) {
        var week = [];
        for (var i = 0; i < 7; i++) {
          week.push({
            tanggal: cursor.getDate(),
            iso: isoDate(cursor),
            inBulan: cursor.getMonth() === bulan - 1 && cursor.getFullYear() === tahun,
          });
          cursor.setDate(cursor.getDate() + 1);
        }
        weeks.push(week);
      }
      return weeks;
    };

    var tandaiLibur = function ($select) {
      $select.toggleClass("bg-danger text-white", $select.val() === "L");
    };

    var buildSelectShift = function (nik, iso, minggu, terpilih) {
      var html =
        '<select class="form-select form-select-sm shift-jadwal"' +
        ' name="shift_' + minggu + "_" + escHtml(nik) + "_" + iso + '"' +
        ' data-nik="' + escHtml(nik) + '"' +
        ' data-tanggal="' + iso + '"' +
        ' data-minggu="' + minggu + '"' +
        ' data-tersimpan="' + escHtml(terpilih || "") + '">';
      html += '<option value="">-</option>';
      shiftList.forEach(function (shift) {
        html +=
          '<option value="' + escHtml(shift.kode) + '"' +
          (shift.kode === terpilih ? " selected" : "") + ">" +
          escHtml(shift.nama) + "</option>";
      });
      html += "</select>";
      return html;
    };

    var renderJadwalPegawaiWeeks = function (tersimpan) {
      var periode = periodeJadwal();
      var nilai = tersimpan || {};

      if (!pegawaiList.length) {
        $jadwalPegawaiTables.html(
          '<div class="alert alert-warning mb-0">Belum ada pegawai (bidan) aktif untuk dijadwalkan.</div>'
        );
        return;
      }

      /* Tanpa master shift, dropdown hanya berisi "-" dan grid tidak ada gunanya */
      if (!shiftList.length) {
        $jadwalPegawaiTables.html(
          '<div class="alert alert-warning mb-0">Master shift masih kosong, dropdown tidak punya pilihan. ' +
            'Isi dulu di <a href="' + urlSdm + 'shift" class="alert-link">Master Shift</a>.</div>'
        );
        return;
      }

      var weeks = getMonthWeeks(periode.bulan, periode.tahun);
      var html = "";

      weeks.forEach(function (week, idx) {
        var minggu = idx + 1;
        html += '<div class="mb-4" data-minggu="' + minggu + '">';
        html += '<div class="fw-bold text-secondary mb-1">Minggu ke-' + minggu + "</div>";
        html += '<table class="table table-bordered border-dark text-center align-middle fw-bold">';
        html += "<thead>";
        html += '<tr style="background-color: #f2aeb1;"><th>Hari</th>';
        hariNames.forEach(function (hari) {
          html += "<th>" + hari + "</th>";
        });
        html += "</tr>";
        html += '<tr style="background-color: #f2aeb1;"><th>Tanggal</th>';
        week.forEach(function (hari) {
          html += hari.inBulan
            ? "<th>" + hari.tanggal + "</th>"
            : '<th class="text-muted bg-light">-</th>';
        });
        html += "</tr>";
        html += "</thead><tbody>";

        pegawaiList.forEach(function (pegawai) {
          html += '<tr data-nik="' + escHtml(pegawai.nik) + '">';
          html += '<td class="text-start">' + escHtml(pegawai.nama) + "</td>";
          week.forEach(function (hari) {
            if (!hari.inBulan) {
              html += '<td class="bg-light"></td>';
              return;
            }
            html +=
              "<td>" +
              buildSelectShift(pegawai.nik, hari.iso, minggu, nilai[pegawai.nik + "|" + hari.iso] || "") +
              "</td>";
          });
          html += "</tr>";
        });

        html += "</tbody></table></div>";
      });

      $jadwalPegawaiTables.html(html);
      $jadwalPegawaiTables.find("select.shift-jadwal").each(function () {
        tandaiLibur($(this));
      });
    };

    /* Semua minggu ikut dikirim (termasuk yang kosong) supaya shift yang
       dihapus di layar juga terhapus di database. */
    var kumpulkanJadwal = function () {
      var weeks = [];
      var indeks = {};

      $jadwalPegawaiTables.find("select.shift-jadwal").each(function () {
        var $select = $(this);
        var minggu = parseInt($select.attr("data-minggu"), 10);
        if (!minggu) return;

        if (!indeks[minggu]) {
          indeks[minggu] = { minggu_ke: minggu, items: [] };
          weeks.push(indeks[minggu]);
        }

        var kode = $select.val();
        if (!kode) return;

        indeks[minggu].items.push({
          nik: String($select.attr("data-nik")),
          tanggal: String($select.attr("data-tanggal")),
          kode_shift: kode,
        });
      });

      return weeks;
    };

    var muatJadwal = function () {
      var periode = periodeJadwal();

      jadwalTerbaca = false;

      if (!cabangDipilih(periode)) {
        renderJadwalPegawaiWeeks({});
        infoJadwal("Pilih cabang terlebih dulu sebelum menyimpan jadwal.", "warning");
        return;
      }

      infoJadwal("Memuat jadwal tersimpan...", "light");

      $.getJSON(urlDataJadwal, periode)
        .done(function (resp) {
          var nilai = {};
          var jumlah = 0;

          if (resp && resp.status === "ok") {
            jadwalTerbaca = true;
            (resp.data || []).forEach(function (row) {
              if (!row.kode_shift) return;
              nilai[row.nik + "|" + row.tanggal] = row.kode_shift;
              jumlah++;
            });
            infoJadwal(
              jumlah
                ? "Menampilkan " + jumlah + " shift yang sudah tersimpan untuk periode ini."
                : "Belum ada jadwal tersimpan untuk periode ini.",
              "light"
            );
          } else {
            infoJadwal((resp && resp.message) || "Jadwal tersimpan tidak bisa dimuat.", "warning");
          }

          renderJadwalPegawaiWeeks(nilai);
        })
        .fail(function () {
          renderJadwalPegawaiWeeks({});
          infoJadwal("Gagal memuat jadwal tersimpan.", "warning");
        });
    };

    var simpanJadwal = function () {
      var periode = periodeJadwal();

      if (!cabangDipilih(periode)) {
        Swal.fire("Cabang belum dipilih", "Pilih cabang dulu sebelum menyimpan jadwal.", "warning");
        return;
      }

      var payload = {
        bulan: periode.bulan,
        tahun: periode.tahun,
        kode_cabang: periode.kode_cabang,
        weeks: kumpulkanJadwal(),
      };

      if (!payload.weeks.length) {
        Swal.fire("Belum ada grid", "Grid jadwal belum terbentuk.", "warning");
        return;
      }

      if (!jadwalTerbaca) {
        Swal.fire(
          "Jadwal belum termuat",
          "Jadwal tersimpan belum berhasil dibaca dari server. Muat ulang halaman dulu supaya data lama tidak tertimpa.",
          "warning"
        );
        return;
      }

      $btnTampilkanJadwalPegawai.prop("disabled", true);

      $.ajax({
        url: urlSimpanJadwal,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(payload),
      })
        .done(function (resp) {
          if (resp && resp.status === "ok") {
            var dilewati = (resp.data && resp.data.dilewati) || [];
            Swal.fire({
              title: "Berhasil!",
              text: resp.message,
              icon: "success",
            });
            infoJadwal(
              resp.message +
                (dilewati.length ? "<br><small>Dilewati: " + escHtml(dilewati.join("; ")) + "</small>" : ""),
              dilewati.length ? "warning" : "success"
            );
            muatJadwal();
          } else {
            Swal.fire("Gagal!", (resp && resp.message) || "Jadwal tidak tersimpan", "error");
          }
        })
        .fail(function (xhr) {
          var pesan = "Terjadi kesalahan pada server";
          try {
            var json = JSON.parse(xhr.responseText);
            if (json && json.message) pesan = json.message;
          } catch (e) {
            /* response bukan JSON, pakai pesan default */
          }
          Swal.fire("Error!", pesan, "error");
        })
        .always(function () {
          $btnTampilkanJadwalPegawai.prop("disabled", false);
        });
    };

    var simpanShift = function ($select) {
      var periode = periodeJadwal();
      var sebelumnya = $select.attr("data-tersimpan") || "";

      if (!cabangDipilih(periode)) {
        $select.val(sebelumnya);
        tandaiLibur($select);
        notieAlert("warning", "Pilih cabang dulu sebelum mengubah shift.");
        return;
      }

      var kode = $select.val() || "";
      if (kode === sebelumnya) return;

      $select.prop("disabled", true);

      $.ajax({
        url: urlSimpanShift,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({
          bulan: periode.bulan,
          tahun: periode.tahun,
          kode_cabang: periode.kode_cabang,
          minggu_ke: parseInt($select.attr("data-minggu"), 10),
          nik: String($select.attr("data-nik")),
          tanggal: String($select.attr("data-tanggal")),
          kode_shift: kode,
        }),
      })
        .done(function (resp) {
          if (resp && resp.status === "ok") {
            $select.attr("data-tersimpan", kode);
            notieAlert("success", resp.message);
          } else {
            $select.val(sebelumnya);
            tandaiLibur($select);
            notieAlert("error", (resp && resp.message) || "Shift gagal disimpan", 3);
          }
        })
        .fail(function (xhr) {
          var pesan = "Shift gagal disimpan";
          try {
            var json = JSON.parse(xhr.responseText);
            if (json && json.message) pesan = json.message;
          } catch (e) {
            /* response bukan JSON, pakai pesan default */
          }
          $select.val(sebelumnya);
          tandaiLibur($select);
          notieAlert("error", pesan, 3);
        })
        .always(function () {
          $select.prop("disabled", false);
        });
    };

    $jadwalPegawaiTables.on("change", "select.shift-jadwal", function () {
      tandaiLibur($(this));
    });

    $('select[name="bulan"], select[name="tahun"], select[name="cabang"]').on("change", muatJadwal);

    $btnTampilkanJadwalPegawai.on("click", simpanJadwal);

    muatJadwal();
  }

  window.tambahJadwalDetail = function(id_jadwal) {
    let urlForm = current_url.replace(/jadwal-pegawai.*/, 'form_tambah_jadwal_detail');
    let urlSave = current_url.replace(/jadwal-pegawai.*/, 'save_jadwal_detail');
    
    $.get(urlForm + "?id_jadwal=" + id_jadwal, function (html) {
      Swal.fire({
        title: "Tambah Detail Jadwal",
        html: html,
        showCancelButton: true,
        confirmButtonText: "Simpan",
        cancelButtonText: "Batal",
        customClass: {
            confirmButton: 'btn btn-success me-2',
            cancelButton: 'btn btn-secondary'
        },
        buttonsStyling: false,
        preConfirm: () => {
          const form = document.getElementById('formTambahJadwalDetail');
          if (!form.checkValidity()) {
            form.reportValidity();
            return false;
          }
          return $(form).serialize();
        }
      }).then((result) => {
        if (result.isConfirmed) {
          $.post(urlSave, result.value, function(response) {
            if (response.status === 'ok') {
              Swal.fire({
                  title: "Berhasil!", 
                  text: response.message, 
                  icon: "success"
              }).then(() => {
                  if (typeof $('.gc-refresh').trigger === 'function') {
                      $('.gc-refresh').trigger('click');
                  } else {
                      location.reload();
                  }
              });
            } else {
              Swal.fire("Gagal!", response.message, "error");
            }
          }, 'json').fail(function() {
            Swal.fire("Error!", "Terjadi kesalahan pada server", "error");
          });
        }
      });
    });
  };
});
