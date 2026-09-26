/**
 *  Developed by : Muchamad Desta Fadilah a.ka. topidesta
 *  Website      : https://topidesta.my.id
 *  Year         : 2026
 *  Description  : Helper bersama modul CRUD Master Farmasi.
 *                 Isinya token CSRF, toast, popup error, error per kolom form,
 *                 konfirmasi hapus, dan konfigurasi dasar DataTables server-side.
 *
 *  Dipakai oleh : stok-obat.js, stok-opname-obat.js
 *  Urutan muat : file ini HARUS dimuat sebelum kedua modul di atas.
 *
 *  Fungsi di sini dipindahkan apa adanya dari kedua modul; yang berbeda antar
 *  modul (kolom, filter, baris, teks kosong, callback baris) dikirim lewat opsi.
 */

window.FarmasiCrud = (function () {
  "use strict";

  var tokenHash = "";

  /* ============================================================
   * CSRF
   * ============================================================ */
  function csrfToken() {
    return $("input[name=csrf_test_name]").val() || tokenHash || "";
  }

  function syncCsrf(json) {
    if (json && json.csrf && json.csrf.value) {
      tokenHash = json.csrf.value;
      $("input[name=csrf_test_name]").val(tokenHash);
    }
  }

  /* ============================================================
   * NOTIFIKASI
   * ============================================================ */
  function toast(message, ok, timer) {
    if (typeof Swal === "undefined") {
      alert(message);
      return;
    }
    Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: timer || 2500,
      timerProgressBar: true,
      iconColor: "white",
      customClass: {
        popup: (ok ? "bg-success" : "bg-danger") + " text-light toast p-2",
      },
      didOpen: function (t) {
        t.addEventListener("mouseenter", Swal.stopTimer);
        t.addEventListener("mouseleave", Swal.resumeTimer);
      },
    }).fire({
      html:
        '<div class="toast-content"><i class="far ' +
        (ok ? "fa-check-circle" : "fa-times-circle") +
        ' me-2"></i> ' +
        message +
        "</div>",
    });
  }

  function errorPopup(title, text) {
    if (typeof Swal !== "undefined") {
      Swal.fire({ icon: "error", title: title, text: text });
    } else {
      alert(text);
    }
  }

  /* ============================================================
   * ERROR PER KOLOM FORM
   * ============================================================ */
  function clearErrors($form) {
    $form.find(".is-invalid").removeClass("is-invalid");
    $form.find(".invalid-feedback").text("").hide();
  }

  function showErrors($form, errors, hasSelect2) {
    clearErrors($form);
    $.each(errors || {}, function (field, msg) {
      var $el = $form.find('[name="' + field + '"]');
      $el.addClass("is-invalid");
      if (hasSelect2 && $el.hasClass("select2-hidden-accessible")) {
        $el.next(".select2").find(".select2-selection").addClass("is-invalid");
      }
      if ($el.next(".flatpickr-input, .form-control").length && $el.attr("type") === "hidden") {
        $el.next().addClass("is-invalid");
      }
      $("#err-" + field).text(msg).show();
    });
  }

  /* ============================================================
   * KARTU RINGKASAN
   * map: { "#stat-x": "keyDiStats", ... }
   * ============================================================ */
  function updateStats(map, stats) {
    if (!stats) return;
    $.each(map, function (selector, key) {
      if (stats[key] !== undefined) {
        $(selector).text(stats[key]);
      }
    });
  }

  /* ============================================================
   * KONFIRMASI HAPUS
   * opts: { html, plainText, onConfirm }
   * ============================================================ */
  function confirmDelete(opts) {
    var run = opts.onConfirm;

    if (typeof Swal !== "undefined") {
      Swal.fire({
        title: "Konfirmasi Hapus",
        html: opts.html,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: '<i class="fas fa-trash pe-1"></i> Ya, Hapus',
        cancelButtonText: '<i class="fas fa-times pe-1"></i> Batal',
        reverseButtons: true,
        focusCancel: true,
      }).then(function (result) {
        if (result.isConfirmed) run();
      });
    } else if (typeof bootbox !== "undefined") {
      bootbox.confirm({
        title: "Konfirmasi Hapus",
        message: opts.html,
        buttons: {
          confirm: { label: "Hapus", className: "btn-danger" },
          cancel: { label: "Batal", className: "btn-secondary" },
        },
        callback: function (ok) {
          if (ok) run();
        },
      });
    } else if (confirm(opts.plainText || "")) {
      run();
    }
  }

  /* ============================================================
   * DATATABLES
   * ============================================================ */

  /* Bahasa tabel; sama untuk kedua modul kecuali sZeroRecords. */
  function language(zeroRecords) {
    return {
      sLengthMenu: "_MENU_ baris per halaman",
      sSearch: "Cari: _INPUT_",
      sInfo: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
      sInfoEmpty: "Tidak ada data",
      sInfoFiltered: "(disaring dari _MAX_ total data)",
      sZeroRecords: zeroRecords,
      sProcessing: "Memuat...",
      oPaginate: {
        sFirst: "Pertama",
        sPrevious: "Sebelumnya",
        sNext: "Selanjutnya",
        sLast: "Terakhir",
      },
    };
  }

  function readJsonSpan(id) {
    var raw = $(id).html();
    return raw ? $.parseJSON(raw) : null;
  }

  /**
   * Konfigurasi DataTables server-side.
   *
   * spanPrefix    : prefix id span konfigurasi, mis. "dt-stok" ->
   *                 #dt-stok-column, #dt-stok-setting, #dt-stok-url
   * zeroRecords   : teks saat tabel kosong
   * loadErrorMessage : pesan saat permintaan gagal
   * filters       : function (d) untuk menambahkan filter ke payload
   * rowCallback   : fnRowCallback opsional
   */
  function tableSettings(opts) {
    var settings = {
      processing: true,
      serverSide: true,
      scrollX: true,
      ajax: {
        url: $("#" + opts.spanPrefix + "-url").text(),
        type: "POST",
        data: function (d) {
          d.csrf_test_name = csrfToken();
          if (typeof opts.filters === "function") {
            opts.filters(d);
          }
        },
        dataSrc: function (json) {
          syncCsrf(json);
          if (json.status === "error" && json.message) {
            errorPopup("Gagal Memuat Data", json.message);
          }
          return json.data || [];
        },
        error: function (xhr) {
          console.error(xhr.responseText);
          errorPopup("Terjadi Kesalahan", opts.loadErrorMessage || "Gagal memuat data dari server.");
        },
      },
      oLanguage: language(opts.zeroRecords),
      columns: readJsonSpan("#" + opts.spanPrefix + "-column") || [],
    };

    if (typeof opts.rowCallback === "function") {
      settings.fnRowCallback = opts.rowCallback;
    }

    /* Konfigurasi tambahan dari server (order default, columnDefs) menimpa di atas */
    var extra = readJsonSpan("#" + opts.spanPrefix + "-setting");
    if (extra) {
      $.each(extra, function (k, v) {
        settings[k] = v;
      });
    }

    return settings;
  }

  /**
   * Cari hanya saat tekan Enter: lepas handler bawaan DataTables pada input
   * pencarian (namespace .DT: keyup.DT search.DT input.DT paste.DT cut.DT),
   * lalu pasang sendiri.
   */
  function bindEnterSearch(tableSelector, api) {
    var $input = $(tableSelector + "_filter input");
    $input.off(".DT");
    $input.on("keyup", function (e) {
      if (e.keyCode === 13) {
        api.search(this.value).draw();
      }
    });
  }

  return {
    csrfToken: csrfToken,
    syncCsrf: syncCsrf,
    toast: toast,
    errorPopup: errorPopup,
    clearErrors: clearErrors,
    showErrors: showErrors,
    updateStats: updateStats,
    confirmDelete: confirmDelete,
    tableSettings: tableSettings,
    bindEnterSearch: bindEnterSearch,
  };
})();
