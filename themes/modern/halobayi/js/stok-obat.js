/**
 *  Developed by : Muchamad Desta Fadilah a.ka. topidesta
 *  Website      : https://topidesta.my.id
 *  Year         : 2026
 *  Description  : Module Master Farmasi - Stok Obat per Batch (CRUD AJAX + DataTables)
 */

jQuery(document).ready(function () {
  if ($("#table-stok-obat").length === 0) {
    return;
  }

  var TOAST_TIMER = 2500;

  /* Helper bersama ada di crud-datatables.js; call site di bawah tidak berubah. */
  var csrfToken = FarmasiCrud.csrfToken;
  var syncCsrf = FarmasiCrud.syncCsrf;
  var errorPopup = FarmasiCrud.errorPopup;

  /* Durasi toast berbeda antar modul, jadi dibungkus per modul. */
  function toast(message, ok) {
    FarmasiCrud.toast(message, ok, TOAST_TIMER);
  }

  /* Kartu ringkasan: id elemen -> key di respons stats */
  var STAT_MAP = {
    "#stat-total-batch": "totalBatch",
    "#stat-total-stok": "totalStok",
    "#stat-hampir": "hampirKadaluarsa",
    "#stat-kadaluarsa": "kadaluarsa",
    "#stat-kosong": "kosong",
  };
  function updateStats(stats) {
    FarmasiCrud.updateStats(STAT_MAP, stats);
  }

  /* ============================================================
   * SELECT2 & FLATPICKR
   * ============================================================ */
  var $modal = $("#modal-stok-obat");
  var hasSelect2 = typeof $.fn.select2 === "function";

  /* Pindahkan modal ke <body>: .content punya position:relative + z-index:2 (site.css),
   * sehingga modal di dalamnya tertutup .modal-backdrop (z-index 1050) dan tidak bisa diklik. */
  $modal.appendTo(document.body);

  if (hasSelect2) {
    $("#filter-id-obat").select2({
      theme: "bootstrap-5",
      width: "100%",
      placeholder: "-- Semua Obat --",
      allowClear: true,
    });
    $("#batch-id-obat").select2({
      theme: "bootstrap-5",
      width: "100%",
      placeholder: "-- Pilih Obat --",
      dropdownParent: $modal,
    });
  }

  var fpMasuk = null;
  var fpKadaluarsa = null;
  if (typeof flatpickr === "function") {
    var fpOpts = {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d-m-Y",
      allowInput: true,
    };
    if (flatpickr.l10ns && flatpickr.l10ns.id) {
      fpOpts.locale = flatpickr.l10ns.id;
    }
    fpMasuk = flatpickr("#batch-tgl-masuk", fpOpts);
    fpKadaluarsa = flatpickr("#batch-tgl-kadaluarsa", fpOpts);
  }

  /* ============================================================
   * DATATABLES
   * ============================================================ */
  var table = $("#table-stok-obat").DataTable(
    FarmasiCrud.tableSettings({
      spanPrefix: "dt-stok",
      zeroRecords: "Data batch tidak ditemukan",
      loadErrorMessage: "Gagal memuat data batch dari server.",
      filters: function (d) {
        d.filter_id_obat = $("#filter-id-obat").val() || "";
        d.filter_status = $("#filter-status").val() || "";
      },
      rowCallback: function (nRow, aoData) {
        /* Kolom Stok (index 5): tandai bila kosong */
        var stok = parseInt(aoData["stok"]) || 0;
        if (stok <= 0) {
          $("td", nRow)
            .eq(5)
            .html('<span class="badge bg-secondary">0</span>');
        } else {
          $("td", nRow).eq(5).addClass("text-end fw-bold");
        }
        if (aoData["status_batch_raw"] === "kadaluarsa") {
          $(nRow).addClass("table-danger");
        } else if (aoData["status_batch_raw"] === "hampir") {
          $(nRow).addClass("table-warning");
        }
      },
    }),
  );

  FarmasiCrud.bindEnterSearch("#table-stok-obat", table);

  $("#filter-id-obat, #filter-status").on("change", function () {
    table.ajax.reload();
  });

  $("#btn-cari-filter").on("click", function () {
    table.ajax.reload();
  });

  $("#btn-reset-filter").on("click", function () {
    $("#filter-id-obat").val("").trigger(hasSelect2 ? "change.select2" : "change");
    $("#filter-status").val("");
    table.search("").ajax.reload();
  });

  /* ============================================================
   * FORM MODAL - Tambah / Edit
   * ============================================================ */
  var $form = $("#form-stok-obat");

  /* Wrapper: helper bersama menerima $form dan hasSelect2 sebagai argumen. */
  function clearErrors() {
    FarmasiCrud.clearErrors($form);
  }

  function showErrors(errors) {
    FarmasiCrud.showErrors($form, errors, hasSelect2);
  }

  function setObat(val) {
    var $sel = $("#batch-id-obat");
    $sel.val(val || "");
    if (hasSelect2) {
      $sel.trigger("change.select2");
    }
  }

  function setDate(fp, $input, val) {
    if (fp) {
      if (val) fp.setDate(val, false, "Y-m-d");
      else fp.clear();
    } else {
      $input.val(val || "");
    }
  }

  function resetForm() {
    $form[0].reset();
    clearErrors();
    $("#batch-id").val("");
    setObat("");
    setDate(fpMasuk, $("#batch-tgl-masuk"), "");
    setDate(fpKadaluarsa, $("#batch-tgl-kadaluarsa"), "");
    $("#batch-stok").val(0);
    if (hasSelect2) {
      $("#batch-id-obat").next(".select2").find(".select2-selection").removeClass("is-invalid");
    }
  }

  /* ------------------------------------------------------------
   * NO. BATCH OTOMATIS (helper farmasi: generateNoBatch) - hanya mode tambah
   * ------------------------------------------------------------ */
  var generateXhr = null;
  function isEditMode() {
    return $("#batch-id").val() !== "";
  }

  function generateNoBatch() {
    if (isEditMode()) return;
    if (generateXhr) generateXhr.abort();

    var $input = $("#batch-no-batch");
    var $btn = $("#btn-generate-batch").prop("disabled", true);

    generateXhr = $.ajax({
      type: "POST",
      url: base_url + "master/farmasi/ajaxGenerateNoBatch",
      data: { id_obat: $("#batch-id-obat").val() || "", csrf_test_name: csrfToken() },
      dataType: "json",
      success: function (res) {
        syncCsrf(res);
        if (res.status === "ok" && res.no_batch) {
          $input.val(res.no_batch).removeClass("is-invalid");
          $("#err-no_batch").text("").hide();
        }
      },
      error: function (xhr, status) {
        if (status !== "abort") console.error(xhr.responseText);
      },
      complete: function () {
        generateXhr = null;
        $btn.prop("disabled", false);
      },
    });
  }

  $("#btn-generate-batch").on("click", generateNoBatch);
  $("#batch-id-obat").on("change", function () {
    if (!isEditMode() && $modal.hasClass("show")) generateNoBatch();
  });

  function openModal(mode) {
    var isEdit = mode === "edit";
    $("#modal-stok-obat-title").text(isEdit ? "Edit Batch Obat" : "Tambah Batch Obat");
    $("#btn-generate-batch, #batch-no-batch-help").toggle(!isEdit);
    $("#batch-stok-help").text(
      isEdit
        ? "Perubahan stok saat edit dicatat sebagai mutasi koreksi (masuk/keluar)."
        : "Stok awal akan dicatat sebagai mutasi masuk.",
    );
    $modal.modal("show");
  }

  $("#btn-add-batch").on("click", function () {
    resetForm();
    /* Tanggal masuk default hari ini ("today" dikenali flatpickr) */
    setDate(fpMasuk, $("#batch-tgl-masuk"), "today");
    /* Bila filter obat aktif, pakai sebagai default */
    var filterObat = $("#filter-id-obat").val();
    if (filterObat) setObat(filterObat);
    openModal("add");
    generateNoBatch();
  });

  $("#table-stok-obat").on("click", ".btn-edit-batch", function (e) {
    e.preventDefault();
    var id = $(this).attr("data-id");
    var $btn = $(this).prop("disabled", true);

    $.ajax({
      type: "POST",
      url: base_url + "master/farmasi/ajaxGetStokObat",
      data: { id: id, csrf_test_name: csrfToken() },
      dataType: "json",
      success: function (res) {
        syncCsrf(res);
        if (res.status !== "ok") {
          errorPopup("Gagal", res.message || "Data batch tidak ditemukan");
          return;
        }
        var d = res.data;
        resetForm();
        $("#batch-id").val(d.id);
        setObat(d.id_obat);
        $("#batch-no-batch").val(d.no_batch || "");
        setDate(fpMasuk, $("#batch-tgl-masuk"), d.tgl_masuk || "");
        setDate(fpKadaluarsa, $("#batch-tgl-kadaluarsa"), d.tgl_kadaluarsa || "");
        $("#batch-stok").val(d.stok || 0);
        openModal("edit");
      },
      error: function (xhr) {
        console.error(xhr.responseText);
        errorPopup("Terjadi Kesalahan", "Gagal mengambil data batch dari server.");
      },
      complete: function () {
        $btn.prop("disabled", false);
      },
    });
  });

  $form.on("submit", function (e) {
    e.preventDefault();
    clearErrors();

    var $save = $("#btn-save-batch").prop("disabled", true);
    var payload = $form.serializeArray();
    payload.push({ name: "csrf_test_name", value: csrfToken() });

    $.ajax({
      type: "POST",
      url: base_url + "master/farmasi/ajaxSaveStokObat",
      data: $.param(payload),
      dataType: "json",
      beforeSend: function (xhr) {
        xhr.setRequestHeader("X-CSRF-TOKEN", csrfToken());
      },
      success: function (res) {
        syncCsrf(res);
        if (res.status === "ok") {
          $modal.modal("hide");
          toast(res.message || "Data batch berhasil disimpan", true);
          updateStats(res.stats);
          table.ajax.reload(null, false);
        } else {
          if (res.errors) {
            showErrors(res.errors);
          } else {
            errorPopup("Gagal Menyimpan", res.message || "Data batch gagal disimpan");
          }
        }
      },
      error: function (xhr) {
        console.error(xhr.responseText);
        errorPopup("Terjadi Kesalahan", "Gagal memproses permintaan ke server. Silakan coba lagi.");
      },
      complete: function () {
        $save.prop("disabled", false);
      },
    });
  });

  /* ============================================================
   * HAPUS BATCH
   * ============================================================ */
  $("#table-stok-obat").on("click", ".btn-delete-batch", function (e) {
    e.preventDefault();
    var $btn = $(this);
    var id = $btn.attr("data-id");
    var nama = $btn.attr("data-nama") || "";
    var noBatch = $btn.attr("data-batch") || "";
    var stok = parseInt($btn.attr("data-stok")) || 0;

    var html =
      "Hapus batch <strong>" +
      noBatch +
      "</strong> untuk obat <strong>" +
      nama +
      "</strong>?" +
      (stok > 0
        ? '<br><span class="text-danger">Batch ini masih memiliki stok ' + stok + ' unit.</span>'
        : "") +
      "<br><small>Seluruh riwayat mutasi batch ini ikut terhapus.</small>";

    function executeDelete() {
      $.ajax({
        type: "POST",
        url: base_url + "master/farmasi/ajaxDeleteStokObat",
        data: { id: id, csrf_test_name: csrfToken() },
        dataType: "json",
        beforeSend: function (xhr) {
          xhr.setRequestHeader("X-CSRF-TOKEN", csrfToken());
        },
        success: function (res) {
          syncCsrf(res);
          if (res.status === "ok") {
            toast(res.message || "Data batch berhasil dihapus", true);
            updateStats(res.stats);
            table.ajax.reload(null, false);
          } else {
            errorPopup("Gagal Menghapus", res.message || "Data batch gagal dihapus");
          }
        },
        error: function (xhr) {
          console.error(xhr.responseText);
          errorPopup("Terjadi Kesalahan", "Gagal memproses permintaan ke server. Silakan coba lagi.");
        },
      });
    }

    if (typeof Swal !== "undefined") {
      Swal.fire({
        title: "Konfirmasi Hapus",
        html: html,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: '<i class="fas fa-trash pe-1"></i> Ya, Hapus',
        cancelButtonText: '<i class="fas fa-times pe-1"></i> Batal',
        reverseButtons: true,
        focusCancel: true,
      }).then(function (result) {
        if (result.isConfirmed) executeDelete();
      });
    } else if (typeof bootbox !== "undefined") {
      bootbox.confirm({
        title: "Konfirmasi Hapus",
        message: html,
        buttons: {
          confirm: { label: "Hapus", className: "btn-danger" },
          cancel: { label: "Batal", className: "btn-secondary" },
        },
        callback: function (ok) {
          if (ok) executeDelete();
        },
      });
    } else if (confirm("Hapus batch " + noBatch + " (" + nama + ")?")) {
      executeDelete();
    }
  });
});
