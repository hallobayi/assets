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

  var $btnTampilkanJadwalPegawai = $("#btn-tampilkan-jadwal-pegawai");
  if ($btnTampilkanJadwalPegawai.length) {
    var $jadwalPegawaiTables = $("#jadwal-pegawai-tables");
    var dummyTbodyHtml = $("#jadwal-pegawai-template tbody").html();
    var hariNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu", "Minggu"];

    var getMonthWeeks = function (bulan, tahun) {
      bulan = parseInt(bulan, 10);
      tahun = parseInt(tahun, 10);

      var lastDate = new Date(tahun, bulan, 0);

      var cursor = new Date(tahun, bulan - 1, 1);
      var dow = cursor.getDay(); // 0=Minggu .. 6=Sabtu
      var diffToMonday = dow === 0 ? 6 : dow - 1;
      cursor.setDate(cursor.getDate() - diffToMonday);

      var weeks = [];
      while (cursor <= lastDate) {
        var week = [];
        for (var i = 0; i < 7; i++) {
          week.push({
            tanggal: cursor.getDate(),
            inBulan: cursor.getMonth() === bulan - 1 && cursor.getFullYear() === tahun,
          });
          cursor.setDate(cursor.getDate() + 1);
        }
        weeks.push(week);
      }
      return weeks;
    };

    var renderJadwalPegawaiWeeks = function () {
      var bulan = $('select[name="bulan"]').val();
      var tahun = $('select[name="tahun"]').val();
      var weeks = getMonthWeeks(bulan, tahun);

      var html = "";
      weeks.forEach(function (week, idx) {
        html += '<div class="mb-3">';
        html += '<div class="fw-bold text-secondary mb-1">Minggu ke-' + (idx + 1) + "</div>";
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
        html += "</thead>";
        html += "<tbody>" + dummyTbodyHtml + "</tbody>";
        html += "</table>";
        html += "</div>";
      });

      $jadwalPegawaiTables.html(html);
    };

    $jadwalPegawaiTables.on("change", "select.shift", function () {
      $(this).toggleClass("bg-danger text-white", $(this).val() === "L");
    });

    $btnTampilkanJadwalPegawai.on("click", renderJadwalPegawaiWeeks);
    renderJadwalPegawaiWeeks();
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
