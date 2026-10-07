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
    var urlDataJadwal    = urlSdm + "data-jadwal-pegawai";
    var urlSimpanJadwal  = urlSdm + "save-jadwal-pegawai";
    var urlSimpanShift   = urlSdm + "save-shift-jadwal";
    var urlSortJadwal    = urlSdm + "sort-jadwal-pegawai";

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

    /* Kode CUTI diambil dari metadata (default C), dipakai penanda cell dan
       varian pola pada dialog simulasi. */
    var kodeCuti = String(
      (jadwalMeta.simulasi && jadwalMeta.simulasi.kode_cuti) || "C"
    ).toUpperCase();

    /* Hari off ditandai warna supaya kebaca sekilas: libur merah, cuti oranye */
    var tandaiLibur = function ($select) {
      var kode = $select.val();
      $select.toggleClass("bg-danger text-white", kode === "L");
      $select.toggleClass("bg-warning", kode === kodeCuti && kode !== "L");
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

    var urutanMingguCache = {};

    var renderJadwalPegawaiWeeks = function (tersimpan, urutanMinggu) {
      var periode = periodeJadwal();
      var nilai = tersimpan || {};
      var urutanData = urutanMinggu || urutanMingguCache || {};

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
        var mapUrutan = urutanData[minggu] || {};

        // Buat salinan pegawaiList lalu urutkan sesuai data urutan tersimpan
        var weekPegawaiList = pegawaiList.slice();
        if (Object.keys(mapUrutan).length > 0) {
          weekPegawaiList.sort(function (a, b) {
            var uA = typeof mapUrutan[a.nik] !== "undefined" ? mapUrutan[a.nik] : 9999;
            var uB = typeof mapUrutan[b.nik] !== "undefined" ? mapUrutan[b.nik] : 9999;
            if (uA !== uB) {
              return uA - uB;
            }
            return 0;
          });
        }

        html += '<div class="mb-4" data-minggu="' + minggu + '">';
        html += '<div class="fw-bold text-secondary mb-1">Minggu ke-' + minggu + "</div>";
        html += '<table class="table table-bordered border-dark text-center align-middle fw-bold">';
        html += "<thead>";
        html += '<tr style="background-color: #f2aeb1;"><th style="width:36px"></th><th>Nama Pegawai</th>';
        hariNames.forEach(function (hari) {
          html += "<th>" + hari + "</th>";
        });
        html += "</tr>";
        html += '<tr style="background-color: #f2aeb1;"><th></th><th>Tanggal</th>';
        week.forEach(function (hari) {
          html += hari.inBulan
            ? "<th>" + hari.tanggal + "</th>"
            : '<th class="tgl-luar-bulan">' + hari.tanggal + "</th>";
        });
        html += "</tr>";
        html += "</thead>";
        html += '<tbody class="sortable-tbody" data-minggu="' + minggu + '">';

        weekPegawaiList.forEach(function (pegawai, urutan) {
          html += '<tr data-nik="' + escHtml(pegawai.nik) + '" data-urutan="' + urutan + '">';
          html += '<td class="text-center p-1"><span class="drag-handle" title="Seret untuk mengubah urutan">&#8942;</span></td>';
          html += '<td class="text-start">' + escHtml(pegawai.nama) + "</td>";
          /* Tanggal sisa bulan tetangga ikut bisa diisi: satu minggu dinas
             dijadwalkan utuh Senin-Minggu seperti jadwal manual. Minggu itu
             tampil di grid dua bulan, server menjaga agar barisnya tidak
             kembar (lihat save_jadwal_pegawai di Sdm.php). */
          week.forEach(function (hari) {
            html +=
              (hari.inBulan ? "<td>" : '<td class="tgl-luar-bulan">') +
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

      /* Inisialisasi SortableJS pada setiap tbody minggu */
      $jadwalPegawaiTables.find("tbody.sortable-tbody").each(function () {
        var tbody = this;
        if (typeof Sortable === "undefined") {
          console.warn("Sortable library is not loaded");
          return;
        }

        Sortable.create(tbody, {
          handle: ".drag-handle",
          animation: 150,
          ghostClass: "sortable-ghost",
          chosenClass: "sortable-chosen",
          dragClass: "sortable-drag",
          onEnd: function (evt) {
            var mingguKe = parseInt($(tbody).attr("data-minggu"), 10);
            var periode  = periodeJadwal();

            if (!cabangDipilih(periode)) {
              notieAlert("warning", "Pilih cabang dulu sebelum mengubah urutan.");
              return;
            }

            /* Kumpulkan urutan baru */
            var urutanBaru = [];
            if (!urutanMingguCache[mingguKe]) {
              urutanMingguCache[mingguKe] = {};
            }

            $(tbody).find("tr[data-nik]").each(function (i) {
              var nik = String($(this).attr("data-nik"));
              urutanBaru.push({ nik: nik, urutan: i });
              $(this).attr("data-urutan", i);
              urutanMingguCache[mingguKe][nik] = i;
            });

            /* Kirim ke server */
            $.ajax({
              url: urlSortJadwal,
              type: "POST",
              contentType: "application/json",
              dataType: "json",
              data: JSON.stringify({
                bulan:      periode.bulan,
                tahun:      periode.tahun,
                kode_cabang: periode.kode_cabang,
                minggu_ke:  mingguKe,
                urutan:     urutanBaru,
              }),
            })
              .done(function (resp) {
                if (resp && (resp.status === "ok" || resp.status === "info")) {
                  notieAlert(resp.status === "ok" ? "success" : "info", resp.message || "Urutan berhasil disimpan");
                } else {
                  notieAlert("error", (resp && resp.message) || "Gagal menyimpan urutan", 3);
                }
              })
              .fail(function () {
                notieAlert("error", "Terjadi kesalahan saat menyimpan urutan", 3);
              });
          },
        });
      });
    };

    /* Semua minggu ikut dikirim (termasuk yang kosong) supaya shift yang
       dihapus di layar juga terhapus di database. */
    var kumpulkanJadwal = function () {
      var weeks = [];
      var indeks = {};

      // Kumpulkan urutan baris per minggu
      $jadwalPegawaiTables.find("tbody.sortable-tbody").each(function () {
        var $tbody = $(this);
        var minggu = parseInt($tbody.attr("data-minggu"), 10);
        if (!minggu) return;

        if (!indeks[minggu]) {
          indeks[minggu] = { minggu_ke: minggu, items: [], urutan: [] };
          weeks.push(indeks[minggu]);
        }

        $tbody.find("tr[data-nik]").each(function (idx) {
          var nik = String($(this).attr("data-nik"));
          indeks[minggu].urutan.push({ nik: nik, urutan: idx });
        });
      });

      // Kumpulkan shift terpilih
      $jadwalPegawaiTables.find("select.shift-jadwal").each(function () {
        var $select = $(this);
        var minggu = parseInt($select.attr("data-minggu"), 10);
        if (!minggu) return;

        if (!indeks[minggu]) {
          indeks[minggu] = { minggu_ke: minggu, items: [], urutan: [] };
          weeks.push(indeks[minggu]);
        }

        var kode = $select.val();
        if (!kode) return;

        indeks[minggu].items.push({
          nik: String($select.attr("data-nik")),
          tanggal: String($select.attr("data-tanggal")),
          kode_shift: kode,
          urutan: parseInt($select.closest("tr").attr("data-urutan") || 0, 10),
        });
      });

      return weeks;
    };

    var muatJadwal = function () {
      var periode = periodeJadwal();

      jadwalTerbaca = false;

      if (!cabangDipilih(periode)) {
        renderJadwalPegawaiWeeks({}, {});
        infoJadwal("Pilih cabang terlebih dulu sebelum menyimpan jadwal.", "warning");
        return;
      }

      infoJadwal("Memuat jadwal tersimpan...", "light");

      $.getJSON(urlDataJadwal, periode)
        .done(function (resp) {
          var nilai = {};
          var urutanMinggu = {};
          var jumlah = 0;

          if (resp && resp.status === "ok") {
            jadwalTerbaca = true;
            (resp.data || []).forEach(function (row) {
              if (row.minggu_ke && row.nik && typeof row.urutan !== "undefined") {
                if (!urutanMinggu[row.minggu_ke]) {
                  urutanMinggu[row.minggu_ke] = {};
                }
                urutanMinggu[row.minggu_ke][row.nik] = parseInt(row.urutan, 10);
              }
              if (!row.kode_shift) return;
              nilai[row.nik + "|" + row.tanggal] = row.kode_shift;
              jumlah++;
            });
            urutanMingguCache = urutanMinggu;
            infoJadwal(
              jumlah
                ? "Menampilkan " + jumlah + " shift yang sudah tersimpan untuk periode ini."
                : "Belum ada jadwal tersimpan untuk periode ini.",
              "light"
            );
          } else {
            infoJadwal((resp && resp.message) || "Jadwal tersimpan tidak bisa dimuat.", "warning");
          }

          renderJadwalPegawaiWeeks(nilai, urutanMinggu);
        })
        .fail(function () {
          renderJadwalPegawaiWeeks({}, {});
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

    /* ===================================================================
       Simulasi pola dinas berotasi (rotating roster)

       Pola dasar satu minggu (Senin s.d. Minggu) = L-M-M-S-S-P-P, lalu tiap
       baris pegawai berikutnya digeser satu hari ke kanan:

         Baris 1 : L  M  M  S  S  P  P
         Baris 2 : P  L  M  M  S  S  P
         Baris 3 : P  P  L  M  M  S  S
         ...      (baris 8 kembali ke Baris 1)

       Rumusnya:
         kode  = pola[ (nomorHariAbsolut - geser) mod jumlahPola ]
         geser = indeksPegawai * geserPegawai + nomorMinggu * geserMinggu

       nomorHariAbsolut dihitung dari Senin 5 Januari 1970, indeksPegawai =
       urutan baris pada tbody (jadi ikut hasil drag-and-drop). Memakai nomor
       hari absolut, bukan indeks hari dalam minggu, supaya pola yang panjangnya
       bukan 7 (varian CUTI = siklus 8 hari) tetap maju antar minggu; untuk pola
       7 hari hasilnya identik karena nomorHariAbsolut mod 7 = indeks hari.

       geserMinggu default 0 supaya deretan hari tiap pegawai bersambung antar
       minggu dan jumlah shift tiap pegawai persis sama; isi 1 kalau libur juga
       ingin berpindah tiap minggu.

       Varian CUTI (checkbox pada dialog) menyisipkan kode CUTI setelah L
       sehingga pegawai dapat dua hari off berurutan. Kode CUTI harus ada di
       master shift, kalau tidak checkbox-nya dimatikan: detail jadwal disimpan
       sebagai id_shift sehingga kode di luar master tidak mungkin tersimpan.

       Blok shift di atas sama persis tiap minggu. Yang berputar adalah URUTAN
       PEGAWAI-nya (checkbox "Putar urutan pegawai"), mengikuti pola jadwal
       Excel: baris 1 dan baris 3 turun ke dua baris paling bawah, sisanya naik
       satu. Lihat rotasiUrutanPegawai().

       Dropdown "Kecualikan pegawai" pada dialog menahan sebagian pegawai dari
       simulasi: cell-nya tidak diisi (walau opsi timpa dicentang), barisnya
       tidak ikut dirotasi dan dipindah ke bawah, dan indeks baris pola hanya
       dihitung dari pegawai yang ikut. Hasil simulasi sebelumnya yang masih
       menempel pada mereka (belum tersimpan) dikosongkan kembali, jadi simulasi
       ulang dengan exclude benar-benar mengeluarkan mereka dari pola. Isi
       dropdown = daftar pegawai grid (id_jabatan = 2) dari meta
       #jadwal-pegawai-meta.

       Hasil simulasi hanya mengisi dropdown di layar, event change TIDAK
       dipicu sehingga tidak ada auto-save per cell. Penyimpanan tetap lewat
       tombol Simpan Jadwal.
       =================================================================== */
    var $btnSimulasiJadwal = $("#btn-simulasi-jadwal-pegawai");
    var POLA_BAWAAN = ["L", "M", "M", "SI", "SO", "P", "P"];
    var POLA_BAWAAN_CUTI = ["L", "C", "M", "M", "SI", "SO", "P", "P"];

    var simulasiConfig = $.extend(
      {
        pola: POLA_BAWAAN,
        pola_cuti: POLA_BAWAAN_CUTI,
        kode_cuti: kodeCuti,
        cuti_tersedia: false,
        url_shift: "",
        geser_pegawai: 1,
        geser_minggu: 0,
        exclude: [],
      },
      jadwalMeta.simulasi || {}
    );

    var polaAtauBawaan = function (pola, bawaan) {
      return $.isArray(pola) && pola.length ? pola.slice() : bawaan.slice();
    };

    /* Preset dibekukan di sini karena simulasiConfig.pola ikut berubah
       mengikuti pola terakhir yang dipakai operator. */
    var POLA_PRESET = {
      biasa: polaAtauBawaan(simulasiConfig.pola, POLA_BAWAAN),
      cuti: polaAtauBawaan(simulasiConfig.pola_cuti, POLA_BAWAAN_CUTI),
    };
    simulasiConfig.pola = POLA_PRESET.biasa.slice();
    simulasiConfig.pakai_cuti = false;
    simulasiConfig.putar_urutan = true;
    simulasiConfig.geser_putaran = 0;

    /* NIK yang dikecualikan operator lewat dropdown pada dialog simulasi.
       Hanya hidup di layar: tidak dikirim ke server dan hilang kalau halaman
       dimuat ulang, persis seperti pola dan geser di atas. */
    simulasiConfig.exclude = $.isArray(simulasiConfig.exclude)
      ? simulasiConfig.exclude.map(String)
      : [];

    /* { nik: true } dari daftar NIK, supaya cek per baris/cell murah */
    var petaExclude = function (daftarNik) {
      var peta = {};
      (daftarNik || []).forEach(function (nik) {
        peta[String(nik)] = true;
      });
      return peta;
    };

    var modPositif = function (n, m) {
      return ((n % m) + m) % m;
    };

    /* Nomor hari dan minggu absolut dihitung dari Senin 5 Januari 1970 supaya
       pola tetap bersambung ketika periode pindah bulan atau tahun. */
    var ANCHOR_SENIN = Date.UTC(1970, 0, 5);
    var nomorHariAbsolut = function (d) {
      var utc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
      return Math.floor((utc - ANCHOR_SENIN) / 86400000);
    };
    var nomorMingguAbsolut = function (d) {
      return Math.floor(nomorHariAbsolut(d) / 7);
    };

    var parseIsoDate = function (iso) {
      var bagian = String(iso || "").split("-");
      if (bagian.length < 3) return null;
      var d = new Date(
        parseInt(bagian[0], 10),
        parseInt(bagian[1], 10) - 1,
        parseInt(bagian[2], 10)
      );
      return isNaN(d.getTime()) ? null : d;
    };

    /* "L-M-M-SI-SO-P-P" atau "L, M, M, ..." menjadi ["L","M","M",...] */
    var parsePola = function (teks) {
      return String(teks || "")
        .toUpperCase()
        .split(/[^A-Z0-9]+/)
        .filter(function (kode) {
          return kode !== "";
        });
    };

    /* Rotasi urutan pegawai antar minggu, persis pola jadwal Excel operator:
       baris 1 dan baris 3 (indeks 0 dan 2) turun ke dua baris paling bawah,
       sisanya naik satu.

         urutanBaru = [ lama1, lama3, lama4, lama5, lama6, lama2, lama0 ]

       Dua baris terakhir adalah jatah libur Sabtu dan Minggu, jadi aturan ini
       yang membuat "semua kebagian libur weekend". Permutasinya satu siklus
       penuh 7 minggu (0 -> 6 -> 4 -> 2 -> 5 -> 3 -> 1 -> 0), jadi tiap pegawai
       melewati seluruh baris pola tepat sekali per 7 minggu. */
    var rotasiUrutanPegawai = function (baris) {
      if (baris.length < 3) return baris.slice();
      var sisa = baris.filter(function (_, i) {
        return i !== 0 && i !== 2;
      });
      return sisa.concat([baris[2], baris[0]]);
    };

    /* Berapa kali rotasi sampai urutan kembali seperti semula. Untuk 7 pegawai
       hasilnya 7; jumlah lain bisa berbeda (6 pegawai -> 4, 8 pegawai -> 15). */
    var ordoRotasiCache = {};
    var ordoRotasiPegawai = function (jumlah) {
      if (ordoRotasiCache[jumlah]) return ordoRotasiCache[jumlah];

      var awal = [];
      for (var i = 0; i < jumlah; i++) awal.push(i);

      var kini = awal.slice();
      var ordo = 1;
      for (; ordo < 5000; ordo++) {
        kini = rotasiUrutanPegawai(kini);
        if (kini.join(",") === awal.join(",")) break;
      }

      ordoRotasiCache[jumlah] = ordo;
      return ordo;
    };

    /* Urutan pegawai untuk satu minggu kalender.

       Diikat ke nomor minggu absolut, bukan ke minggu ke-1 periode yang sedang
       dibuka. Satu minggu kalender dipakai bersama dua bulan (28 Sep - 4 Okt
       tampil sebagai minggu 5 di grid September dan minggu 1 di grid Oktober),
       jadi pengikatan ini yang membuat urutannya sama persis di kedua grid,
       tidak terotasi dua kali.

       geserPutaran memindahkan fase seluruh rantai, dipakai kalau operator
       ingin baris pertama jatuh pada pegawai tertentu. */
    var urutanMingguKalender = function (dasar, senin, geserPutaran) {
      var ordo = ordoRotasiPegawai(dasar.length);
      var putaran = modPositif(nomorMingguAbsolut(senin) + (geserPutaran || 0), ordo);

      var hasil = dasar.slice();
      for (var i = 0; i < putaran; i++) hasil = rotasiUrutanPegawai(hasil);
      return hasil;
    };

    /* Tanggal Senin sebuah tbody minggu, dibaca dari cell paling kiri */
    var seninMingguTbody = function ($tbody) {
      return parseIsoDate(
        $tbody.find("tr[data-nik] select.shift-jadwal").first().attr("data-tanggal")
      );
    };

    /* Susun ulang <tr> satu tbody mengikuti daftar NIK, sekalian sinkronkan
       data-urutan yang dibaca kumpulkanJadwal() saat Simpan Jadwal. */
    var susunUlangBaris = function ($tbody, urutanNik) {
      var perNik = {};
      $tbody.find("tr[data-nik]").each(function () {
        perNik[String($(this).attr("data-nik"))] = this;
      });

      var mingguKe = parseInt($tbody.attr("data-minggu"), 10);
      if (mingguKe) urutanMingguCache[mingguKe] = {};

      urutanNik.forEach(function (nik, idx) {
        var tr = perNik[nik];
        if (!tr) return;
        $tbody.append(tr);
        $(tr).attr("data-urutan", idx);
        if (mingguKe) urutanMingguCache[mingguKe][nik] = idx;
      });
    };

    var kodeShiftTersedia = function () {
      var set = {};
      shiftList.forEach(function (shift) {
        set[shift.kode] = true;
      });
      return set;
    };

    /* Urutan baris per minggu sebelum simulasi memutarnya, supaya tombol
       Batalkan simulasi bisa mengembalikan grid sepenuhnya. */
    var urutanSebelumSimulasi = null;

    var batalkanSimulasi = function () {
      $jadwalPegawaiTables.find("select.shift-simulasi").each(function () {
        var $select = $(this);
        $select.val($select.attr("data-tersimpan") || "").removeClass("shift-simulasi");
        tandaiLibur($select);
      });

      if (urutanSebelumSimulasi) {
        $jadwalPegawaiTables.find("tbody.sortable-tbody").each(function () {
          var $tbody = $(this);
          var minggu = parseInt($tbody.attr("data-minggu"), 10);
          if (minggu && urutanSebelumSimulasi[minggu]) {
            susunUlangBaris($tbody, urutanSebelumSimulasi[minggu]);
          }
        });
        urutanSebelumSimulasi = null;
      }

      infoJadwal("Simulasi dibatalkan, grid kembali ke jadwal tersimpan.", "light");
    };

    var terapkanSimulasi = function (opsi) {
      var diisi = 0;
      var dilewati = 0;
      var diputar = 0;

      /* Pegawai yang dikecualikan dilewati sepenuhnya: cell-nya tidak diisi
         (walau opsi timpa dicentang) dan barisnya tidak ikut dirotasi, jadi
         jadwal dinas mereka tetap diisi manual. */
      var dikecualikan = petaExclude(opsi.exclude);
      var jmlDikecualikan = (opsi.exclude || []).length;

      /* Pegawai yang baru dikecualikan bisa masih memegang hasil simulasi
         sebelumnya (cell bertanda .shift-simulasi, belum tersimpan). Cell itu
         dikembalikan ke nilai tersimpan, kalau tidak exclude-nya tidak kelihatan
         bekerja: cell lama cuma "dilewati karena sudah terisi" sehingga pegawai
         itu tampak masih ikut pola. Cell yang diubah manual (sudah tersimpan,
         tanpa kelas .shift-simulasi) tidak disentuh. */
      var dibersihkan = 0;
      if (jmlDikecualikan) {
        $jadwalPegawaiTables.find("tr[data-nik]").each(function () {
          var $baris = $(this);
          if (!dikecualikan[String($baris.attr("data-nik"))]) return;

          $baris.find("select.shift-simulasi").each(function () {
            var $select = $(this);
            $select.val($select.attr("data-tersimpan") || "").removeClass("shift-simulasi");
            tandaiLibur($select);
            dibersihkan++;
          });
        });
      }

      /* Urutan pegawai diputar lebih dulu karena pengisian shift memakai
         indeks baris. Tiap minggu dihitung dari nomor minggu absolutnya, jadi
         hasilnya sama walau periode yang dibuka berganti bulan. */
      if (opsi.putarUrutan) {
        var $tbodyMinggu = $jadwalPegawaiTables.find("tbody.sortable-tbody");

        /* Snapshot hanya diambil sekali, jadi simulasi berulang tetap bisa
           dikembalikan ke urutan asli sebelum simulasi pertama. */
        if (!urutanSebelumSimulasi) {
          urutanSebelumSimulasi = {};
          $tbodyMinggu.each(function () {
            var minggu = parseInt($(this).attr("data-minggu"), 10);
            if (!minggu) return;
            var daftar = [];
            $(this).find("tr[data-nik]").each(function () {
              daftar.push(String($(this).attr("data-nik")));
            });
            urutanSebelumSimulasi[minggu] = daftar;
          });
        }

        var dasarNik = pegawaiList
          .map(function (pegawai) {
            return String(pegawai.nik);
          })
          .filter(function (nik) {
            return !dikecualikan[nik];
          });

        $tbodyMinggu.each(function () {
          var $tbody = $(this);
          var senin = seninMingguTbody($tbody);
          if (!senin) return;

          /* Baris pegawai yang dikecualikan ditaruh paling bawah, urutan DOM-nya
             dipertahankan. Semua baris tetap kebagian data-urutan 0..n sehingga
             kumpulkanJadwal() pada Simpan Jadwal tidak menemukan urutan kembar. */
          var nikDikecualikan = [];
          $tbody.find("tr[data-nik]").each(function () {
            var nik = String($(this).attr("data-nik"));
            if (dikecualikan[nik]) nikDikecualikan.push(nik);
          });

          susunUlangBaris(
            $tbody,
            urutanMingguKalender(dasarNik, senin, opsi.geserPutaran).concat(nikDikecualikan)
          );
          diputar++;
        });
      }

      $jadwalPegawaiTables.find("tbody.sortable-tbody").each(function () {
        /* Indeks baris pola dihitung hanya dari pegawai yang ikut simulasi,
           jadi mengecualikan seseorang tidak menggeser pola pegawai lain. */
        var indeksPegawai = -1;

        $(this)
          .find("tr[data-nik]")
          .each(function () {
            var $baris = $(this);
            if (dikecualikan[String($baris.attr("data-nik"))]) {
              return;
            }
            indeksPegawai++;

            $baris
              .find("select.shift-jadwal")
              .each(function () {
                var $select = $(this);
                var tanggal = parseIsoDate($select.attr("data-tanggal"));
                if (!tanggal) return;

                /* Tanpa opsi timpa, shift yang sudah terisi dibiarkan */
                if (!opsi.timpa && ($select.val() || "") !== "") {
                  dilewati++;
                  return;
                }

                var geser =
                  indeksPegawai * opsi.geserPegawai +
                  nomorMingguAbsolut(tanggal) * opsi.geserMinggu;
                var kode =
                  opsi.pola[modPositif(nomorHariAbsolut(tanggal) - geser, opsi.pola.length)];

                /* Kode di luar master shift tidak ada di dropdown, lewati saja */
                if (!$select.find('option[value="' + kode + '"]').length) {
                  dilewati++;
                  return;
                }

                $select.val(kode).addClass("shift-simulasi");
                tandaiLibur($select);
                diisi++;
              });
          });
      });

      var pesanPutar = diputar ? " Urutan pegawai disusun ulang pada " + diputar + " minggu." : "";
      var pesanExclude = jmlDikecualikan
        ? " <b>" + jmlDikecualikan + "</b> pegawai dikecualikan dari simulasi" +
          (dibersihkan
            ? " (" + dibersihkan + " cell hasil simulasi sebelumnya dikosongkan kembali)"
            : "") +
          "."
        : "";

      if (!diisi) {
        infoJadwal(
          "Simulasi tidak mengisi cell apa pun" +
            (dilewati ? " (" + dilewati + " cell dilewati karena sudah terisi)" : "") +
            ". Centang <b>Timpa shift yang sudah terisi</b> kalau jadwal lama memang mau ditindas." +
            pesanExclude +
            (dibersihkan || diputar
              ? ' <button type="button" class="btn btn-sm btn-outline-secondary ms-2" id="btn-batal-simulasi">Batalkan simulasi</button>'
              : ""),
          "warning"
        );
        notieAlert(
          dibersihkan ? "success" : "warning",
          dibersihkan
            ? dibersihkan + " cell pegawai yang dikecualikan dikosongkan"
            : "Tidak ada cell yang diisi simulasi",
          3
        );
        return;
      }

      infoJadwal(
        "Simulasi mengisi <b>" + diisi + "</b> shift" +
          (dilewati ? ", " + dilewati + " cell dilewati" : "") +
          "." + pesanPutar + pesanExclude +
          " Hasil ini <b>belum tersimpan</b>, klik <b>Simpan Jadwal</b> untuk menulis ke database. " +
          '<button type="button" class="btn btn-sm btn-outline-secondary ms-2" id="btn-batal-simulasi">Batalkan simulasi</button>',
        "warning"
      );
      notieAlert("success", diisi + " shift terisi dari simulasi (belum tersimpan)", 3);
    };

    var dialogSimulasi = function () {
      if (!$jadwalPegawaiTables.find("select.shift-jadwal").length) {
        Swal.fire(
          "Grid belum siap",
          "Grid jadwal belum terbentuk, pastikan master pegawai dan master shift sudah terisi.",
          "warning"
        );
        return;
      }

      var periode = periodeJadwal();
      var daftarKode = shiftList
        .map(function (shift) {
          return shift.kode;
        })
        .join(", ");

      /* Opsi dropdown "kecualikan pegawai" diambil dari pegawaiList, yaitu
         pegawai id_jabatan = 2 (bidan) yang memang punya baris di grid, jadi
         tidak mungkin mengecualikan orang yang tidak dijadwalkan. Pilihan
         terakhir operator ikut ter-select ulang lewat simulasiConfig.exclude. */
      var excludeTerpilih = petaExclude(simulasiConfig.exclude);
      var opsiExclude = pegawaiList
        .map(function (pegawai) {
          var nik = String(pegawai.nik);
          return (
            '<option value="' + escHtml(nik) + '"' +
            (excludeTerpilih[nik] ? " selected" : "") + ">" +
            escHtml(pegawai.nama) + "</option>"
          );
        })
        .join("");

      var html =
        '<div class="text-start" style="font-size:14px;">' +
        "<p>Grid diisi dengan pola dinas berotasi: baris pegawai pertama memakai pola dasar, " +
        "baris berikutnya digeser ke kanan sebanyak <i>geser per pegawai</i> hari.</p>" +
        '<div class="mb-2">' +
        '<label class="form-label fw-bold mb-1" for="sim-pola">Pola dasar (Senin s.d. Minggu)</label>' +
        '<input type="text" class="form-control form-control-sm" id="sim-pola" value="' +
        escHtml(simulasiConfig.pola.join("-")) +
        '">' +
        '<div class="form-text">Kode shift tersedia: ' +
        escHtml(daftarKode) +
        "</div>" +
        "</div>" +
        '<div class="row g-2 mb-2">' +
        '<div class="col-6">' +
        '<label class="form-label fw-bold mb-1" for="sim-geser-pegawai">Geser per pegawai</label>' +
        '<input type="number" class="form-control form-control-sm" id="sim-geser-pegawai" value="' +
        escHtml(simulasiConfig.geser_pegawai) +
        '">' +
        "</div>" +
        '<div class="col-6">' +
        '<label class="form-label fw-bold mb-1" for="sim-geser-minggu">Geser per minggu</label>' +
        '<input type="number" class="form-control form-control-sm" id="sim-geser-minggu" value="' +
        escHtml(simulasiConfig.geser_minggu) +
        '">' +
        '<div class="form-text">0 = pola bersambung antar minggu</div>' +
        "</div>" +
        "</div>" +
        '<div class="mb-2">' +
        '<label class="form-label fw-bold mb-1" for="sim-exclude">Kecualikan pegawai</label>' +
        '<select class="form-select form-select-sm" id="sim-exclude" multiple size="5">' +
        opsiExclude +
        "</select>" +
        '<div class="form-text">Pegawai yang dipilih tidak diisi shift oleh simulasi dan ' +
        "urutan barisnya tidak ikut diputar (barisnya dipindah ke paling bawah), " +
        "jadi jadwal dinasnya tetap diisi manual. Kosongkan kalau semua pegawai ikut.</div>" +
        "</div>" +
        '<div class="form-check">' +
        '<input class="form-check-input" type="checkbox" id="sim-cuti"' +
        (simulasiConfig.cuti_tersedia ? "" : " disabled") +
        (simulasiConfig.pakai_cuti && simulasiConfig.cuti_tersedia ? " checked" : "") +
        ">" +
        '<label class="form-check-label" for="sim-cuti">Sertakan CUTI (' +
        escHtml(simulasiConfig.kode_cuti) +
        ") pada pola dasar" +
        "</label>" +
        '<div class="form-text">' +
        (simulasiConfig.cuti_tersedia
          ? "CUTI disisipkan setelah L, siklus jadi " +
            POLA_PRESET.cuti.length +
            " hari sehingga pola ikut bergeser tiap minggu."
          : "Kode <b>" +
            escHtml(simulasiConfig.kode_cuti) +
            "</b> belum ada di Master Shift" +
            (simulasiConfig.url_shift
              ? ', tambahkan dulu di <a href="' +
                escHtml(simulasiConfig.url_shift) +
                '" target="_blank">Master Shift</a>.'
              : ".")) +
        "</div>" +
        "</div>" +
        '<div class="form-check">' +
        '<input class="form-check-input" type="checkbox" id="sim-putar"' +
        (simulasiConfig.putar_urutan ? " checked" : "") +
        ">" +
        '<label class="form-check-label" for="sim-putar">Putar urutan pegawai tiap minggu</label>' +
        '<div class="form-text">Baris 1 dan 3 turun ke dua baris terakhir (jatah libur ' +
        "Sabtu dan Minggu), sisanya naik satu. Urutan dihitung dari nomor minggu " +
        "kalender, jadi minggu yang dipakai bersama dua bulan tidak terputar dua kali." +
        "</div>" +
        '<div class="mt-2">' +
        '<label class="form-label fw-bold mb-1" for="sim-geser-putaran">Geser putaran urutan</label>' +
        '<input type="number" class="form-control form-control-sm" id="sim-geser-putaran" value="' +
        escHtml(simulasiConfig.geser_putaran) +
        '">' +
        '<div class="form-text">Naikkan satu per satu sampai baris pertama jatuh ' +
        "pada pegawai yang diinginkan.</div>" +
        "</div>" +
        "</div>" +
        '<div class="form-check mb-2">' +
        '<input class="form-check-input" type="checkbox" id="sim-timpa">' +
        '<label class="form-check-label" for="sim-timpa">Timpa shift yang sudah terisi</label>' +
        "</div>" +
        '<div class="alert alert-warning py-2 mb-0" style="font-size:13px;">' +
        "Simulasi hanya mengisi grid di layar. Klik <b>Simpan Jadwal</b> untuk menyimpannya." +
        (cabangDipilih(periode)
          ? ""
          : "<br>Cabang belum dipilih, hasil simulasi belum bisa disimpan.") +
        "</div>" +
        "</div>";

      Swal.fire({
        title: "Simulasi Pola Dinas",
        html: html,
        width: 580,
        showCancelButton: true,
        confirmButtonText: "Terapkan",
        cancelButtonText: "Batal",
        focusConfirm: false,
        customClass: {
          confirmButton: "btn btn-warning me-2",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
        didOpen: function () {
          /* select2 dipakai supaya daftar pegawai bisa dicari. dropdownParent
             harus popup Swal: di luar popup, kotak pencarian select2 tidak bisa
             diklik karena focus trap Swal menahan fokus di dalam popup. Kalau
             select2 belum termuat, dropdown tetap jalan sebagai select multiple. */
          if (typeof $.fn.select2 === "function") {
            $("#sim-exclude").select2({
              theme: "bootstrap-5",
              width: "100%",
              placeholder: "Semua pegawai ikut simulasi",
              closeOnSelect: false,
              dropdownParent: $(Swal.getPopup()),
            });
          }

          /* Centang CUTI menukar isi field pola dasar ke preset yang sesuai,
             jadi pola hasil editan manual memang ikut tertimpa. */
          $("#sim-cuti").on("change", function () {
            var preset = $(this).is(":checked") ? POLA_PRESET.cuti : POLA_PRESET.biasa;
            $("#sim-pola").val(preset.join("-"));
          });
        },
        preConfirm: function () {
          var pola = parsePola($("#sim-pola").val());
          if (!pola.length) {
            Swal.showValidationMessage("Pola dasar tidak boleh kosong");
            return false;
          }

          var tersedia = kodeShiftTersedia();
          var asing = pola.filter(function (kode) {
            return !tersedia[kode];
          });
          if (asing.length) {
            Swal.showValidationMessage("Kode tidak ada di master shift: " + asing.join(", "));
            return false;
          }

          /* Semua pegawai dikecualikan berarti tidak ada yang bisa diisi pola,
             dan daftar rotasi jadi kosong. Tahan di sini supaya tidak terlihat
             seperti simulasi yang gagal tanpa sebab. */
          var exclude = ($("#sim-exclude").val() || []).map(String);
          if (pegawaiList.length && exclude.length >= pegawaiList.length) {
            Swal.showValidationMessage("Minimal satu pegawai harus ikut simulasi");
            return false;
          }

          return {
            pola: pola,
            exclude: exclude,
            geserPegawai: parseInt($("#sim-geser-pegawai").val(), 10) || 0,
            geserMinggu: parseInt($("#sim-geser-minggu").val(), 10) || 0,
            timpa: $("#sim-timpa").is(":checked"),
            pakaiCuti: $("#sim-cuti").is(":checked"),
            putarUrutan: $("#sim-putar").is(":checked"),
            geserPutaran: parseInt($("#sim-geser-putaran").val(), 10) || 0,
          };
        },
      }).then(function (hasil) {
        if (hasil.isConfirmed && hasil.value) {
          simulasiConfig.pola = hasil.value.pola;
          simulasiConfig.pakai_cuti = hasil.value.pakaiCuti;
          simulasiConfig.putar_urutan = hasil.value.putarUrutan;
          simulasiConfig.geser_putaran = hasil.value.geserPutaran;
          simulasiConfig.geser_pegawai = hasil.value.geserPegawai;
          simulasiConfig.geser_minggu = hasil.value.geserMinggu;
          simulasiConfig.exclude = hasil.value.exclude;
          terapkanSimulasi(hasil.value);
        }
      });
    };

    $jadwalPegawaiTables.on("change", "select.shift-jadwal", function () {
      /* Diubah manual berarti bukan hasil simulasi lagi, dan langsung disimpan */
      $(this).removeClass("shift-simulasi");
      tandaiLibur($(this));
      simpanShift($(this));
    });

    $jadwalPegawaiInfo.on("click", "#btn-batal-simulasi", batalkanSimulasi);

    /* Ganti periode menarik ulang grid dari server, jadi hasil simulasi yang
       belum disimpan ikut hilang. Beri tahu supaya tidak terasa seperti bug. */
    $('select[name="bulan"], select[name="tahun"], select[name="cabang"]').on("change", function () {
      if ($jadwalPegawaiTables.find("select.shift-simulasi").length) {
        notieAlert("warning", "Periode berubah, hasil simulasi yang belum disimpan dibuang", 4);
      }
      muatJadwal();
    });

    $btnSimulasiJadwal.on("click", dialogSimulasi);

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
