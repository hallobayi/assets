/**
 *  Developed by : Muchamad Desta Fadilah a.ka. topidesta
 *  Website      : https://topidesta.my.id
 *  Year         : 2026
 *  Description  : Module Master Farmasi - Stok Opname Obat (riwayat mutasi_stok, CRUD AJAX + DataTables)
 */

jQuery(document).ready(function () {
  if ($("#table-opname").length === 0) {
    return;
  }

  var TOAST_TIMER = 3000;

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
    "#stat-total-mutasi": "totalMutasi",
    "#stat-masuk": "masukBulanIni",
    "#stat-keluar": "keluarBulanIni",
    "#stat-opname": "opnameBulanIni",
  };
  function updateStats(stats) {
    FarmasiCrud.updateStats(STAT_MAP, stats);
  }

  /* ============================================================
   * SELECT2 & FLATPICKR
   * ============================================================ */
  var $modal = $("#modal-opname");
  var hasSelect2 = typeof $.fn.select2 === "function";

  /* .content punya position:relative + z-index:2 (site.css): modal di dalamnya tertutup backdrop */
  $modal.appendTo(document.body);

  if (hasSelect2) {
    $("#filter-id-obat").select2({
      theme: "bootstrap-5",
      width: "100%",
      placeholder: "-- Semua Obat --",
      allowClear: true,
    });
    $("#opname-id-obat").select2({
      theme: "bootstrap-5",
      width: "100%",
      placeholder: "-- Pilih Obat --",
      dropdownParent: $modal,
    });
    $("#opname-id-batch").select2({
      theme: "bootstrap-5",
      width: "100%",
      placeholder: "-- Pilih Batch --",
      dropdownParent: $modal,
    });
  }

  var fpDari = null;
  var fpSampai = null;
  if (typeof flatpickr === "function") {
    var fpOpts = {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d-m-Y",
      allowInput: true,
      onChange: function () {
        table.ajax.reload();
      },
    };
    if (flatpickr.l10ns && flatpickr.l10ns.id) {
      fpOpts.locale = flatpickr.l10ns.id;
    }
    fpDari = flatpickr("#filter-tgl-dari", fpOpts);
    fpSampai = flatpickr("#filter-tgl-sampai", fpOpts);
  }

  /* ============================================================
   * DATATABLES
   * ============================================================ */
  var table = $("#table-opname").DataTable(
    FarmasiCrud.tableSettings({
      spanPrefix: "dt-opname",
      zeroRecords: "Riwayat mutasi tidak ditemukan",
      loadErrorMessage: "Gagal memuat riwayat mutasi dari server.",
      filters: function (d) {
        d.filter_id_obat = $("#filter-id-obat").val() || "";
        d.filter_tipe = $("#filter-tipe").val() || "";
        d.filter_referensi = $("#filter-referensi").val() || "";
        d.filter_tgl_dari = $("#filter-tgl-dari").val() || "";
        d.filter_tgl_sampai = $("#filter-tgl-sampai").val() || "";
      },
      rowCallback: function (nRow, aoData) {
        /* Jumlah (index 5): +N hijau untuk masuk, -N merah untuk keluar */
        var jumlah = parseInt(aoData["jumlah"]) || 0;
        var masuk = aoData["tipe_raw"] === "masuk";
        $("td", nRow)
          .eq(5)
          .addClass("text-end fw-bold " + (masuk ? "text-success" : "text-danger"))
          .text((masuk ? "+" : "-") + jumlah);
        $("td", nRow).eq(6).addClass("text-end");
        $("td", nRow).eq(7).addClass("text-end fw-bold");
      },
    }),
  );

  FarmasiCrud.bindEnterSearch("#table-opname", table);

  $("#filter-id-obat, #filter-tipe, #filter-referensi").on("change", function () {
    table.ajax.reload();
  });

  $("#btn-cari-filter").on("click", function () {
    table.ajax.reload();
  });

  $("#btn-reset-filter").on("click", function () {
    $("#filter-id-obat").val("").trigger(hasSelect2 ? "change.select2" : "change");
    $("#filter-tipe, #filter-referensi").val("");
    if (fpDari) fpDari.clear(false);
    else $("#filter-tgl-dari").val("");
    if (fpSampai) fpSampai.clear(false);
    else $("#filter-tgl-sampai").val("");
    table.search("").ajax.reload();
  });

  /* ============================================================
   * FORM MODAL
   * ============================================================ */
  var $form = $("#form-opname");
  var $selObat = $("#opname-id-obat");
  var $selBatch = $("#opname-id-batch");
  var batchXhr = null;

  /* Wrapper: helper bersama menerima $form dan hasSelect2 sebagai argumen. */
  function clearErrors() {
    FarmasiCrud.clearErrors($form);
  }

  function showErrors(errors) {
    FarmasiCrud.showErrors($form, errors, hasSelect2);
  }

  function setSelect($sel, val) {
    $sel.val(val || "");
    if (hasSelect2) $sel.trigger("change.select2");
  }

  function fillBatchOptions(rows, selected) {
    $selBatch.empty();
    if (!rows || rows.length === 0) {
      $selBatch.append('<option value="">-- Obat ini belum punya batch --</option>').prop("disabled", true);
    } else {
      $selBatch.append('<option value="">-- Pilih Batch --</option>');
      $.each(rows, function (i, r) {
        $("<option>", { value: r.id, text: r.label })
          .attr("data-stok", parseInt(r.stok) || 0)
          .appendTo($selBatch);
      });
      $selBatch.prop("disabled", false);
    }
    setSelect($selBatch, selected || "");
    hitungSelisih();
  }

  function loadBatch(idObat, selected) {
    if (batchXhr) batchXhr.abort();
    if (!idObat) {
      fillBatchOptions([], "");
      $selBatch.find("option").first().text("-- Pilih obat terlebih dahulu --");
      return;
    }
    batchXhr = $.ajax({
      type: "POST",
      url: base_url + "master/farmasi/ajaxGetBatchOpname",
      data: { id_obat: idObat, csrf_test_name: csrfToken() },
      dataType: "json",
      success: function (res) {
        syncCsrf(res);
        if (res.status !== "ok") {
          errorPopup("Gagal", res.message || "Daftar batch gagal dimuat");
          fillBatchOptions([], "");
          return;
        }
        fillBatchOptions(res.data, selected);
      },
      error: function (xhr, status) {
        if (status !== "abort") {
          console.error(xhr.responseText);
          errorPopup("Terjadi Kesalahan", "Gagal memuat daftar batch dari server.");
        }
      },
      complete: function () {
        batchXhr = null;
      },
    });
  }

  function hitungSelisih() {
    var $opt = $selBatch.find("option:selected");
    var $out = $("#opname-selisih");
    if (!$opt.val()) {
      $("#opname-stok-sistem").val("");
      $out.html('<span class="text-muted">Pilih batch dan isi stok fisik.</span>');
      return;
    }
    var sistem = parseInt($opt.attr("data-stok")) || 0;
    $("#opname-stok-sistem").val(sistem);

    var fisikRaw = $("#opname-stok-fisik").val();
    if (fisikRaw === "") {
      $out.html('<span class="text-muted">Isi stok fisik untuk melihat selisih.</span>');
      return;
    }
    var selisih = (parseInt(fisikRaw) || 0) - sistem;
    if (selisih === 0) {
      $out.html('<span class="badge bg-secondary">0</span> <span class="text-muted">Stok sesuai, tidak ada penyesuaian.</span>');
    } else if (selisih > 0) {
      $out.html('<span class="badge bg-success">+' + selisih + "</span> dicatat sebagai mutasi <strong>masuk</strong>.");
    } else {
      $out.html('<span class="badge bg-danger">' + selisih + "</span> dicatat sebagai mutasi <strong>keluar</strong>.");
    }
  }

  $selObat.on("change", function () {
    if ($modal.hasClass("show") && !isEditMode()) loadBatch($(this).val(), "");
  });
  $selBatch.on("change", hitungSelisih);
  $("#opname-stok-fisik").on("input", hitungSelisih);

  function isEditMode() {
    return $("#opname-id").val() !== "";
  }

  function resetForm() {
    $form[0].reset();
    clearErrors();
    $("#opname-id").val("");
    setSelect($selObat, "");
    fillBatchOptions([], "");
    $selBatch.find("option").first().text("-- Pilih obat terlebih dahulu --");
    $("#opname-stok-sistem, #opname-stok-fisik").val("");
    $("#row-opname-info").hide();
    $("#opname-info").empty();
    if (hasSelect2) {
      $form.find(".select2-selection").removeClass("is-invalid");
    }
  }

  function openModal(mode) {
    var isEdit = mode === "edit";
    $("#modal-opname-title").text(isEdit ? "Edit Keterangan Mutasi" : "Catat Stok Opname");
    /* Edit: jumlah/tipe adalah jejak audit, hanya keterangan yang boleh diubah */
    $selObat.prop("disabled", isEdit);
    $selBatch.prop("disabled", isEdit || $selBatch.find("option").length <= 1);
    $("#row-opname-stok, #row-opname-selisih, #opname-batch-help").toggle(!isEdit);
    $("#row-opname-info").toggle(isEdit);
    $modal.modal("show");
  }

  $("#btn-add-opname").on("click", function () {
    resetForm();
    var filterObat = $("#filter-id-obat").val();
    openModal("add");
    if (filterObat) {
      setSelect($selObat, filterObat);
      loadBatch(filterObat, "");
    }
  });

  $("#table-opname").on("click", ".btn-edit-opname", function (e) {
    e.preventDefault();
    var id = $(this).attr("data-id");
    var $btn = $(this).prop("disabled", true);

    $.ajax({
      type: "POST",
      url: base_url + "master/farmasi/ajaxGetOpname",
      data: { id: id, csrf_test_name: csrfToken() },
      dataType: "json",
      success: function (res) {
        syncCsrf(res);
        if (res.status !== "ok") {
          errorPopup("Gagal", res.message || "Data mutasi tidak ditemukan");
          return;
        }
        var d = res.data;
        resetForm();
        $("#opname-id").val(d.id);
        setSelect($selObat, d.id_obat);
        fillBatchOptions([{ id: d.id_batch, label: d.no_batch, stok: d.stok_batch }], d.id_batch);
        $("#opname-keterangan").val(d.keterangan || "");
        var tipe = d.tipe === "masuk" ? '<span class="badge bg-success">Masuk</span>' : '<span class="badge bg-danger">Keluar</span>';
        $("#opname-info").html(
          tipe +
            " <strong>" + d.jumlah + "</strong> unit &middot; stok " + d.stok_sebelum + " &rarr; " + d.stok_sesudah +
            " &middot; referensi <strong>" + (d.referensi || "-") + "</strong>" +
            "<br><small class=\"text-muted\">Jumlah dan tipe tidak dapat diubah. Gunakan tombol Batalkan lalu catat ulang bila salah.</small>",
        );
        openModal("edit");
      },
      error: function (xhr) {
        console.error(xhr.responseText);
        errorPopup("Terjadi Kesalahan", "Gagal mengambil data mutasi dari server.");
      },
      complete: function () {
        $btn.prop("disabled", false);
      },
    });
  });

  $form.on("submit", function (e) {
    e.preventDefault();
    clearErrors();

    var $save = $("#btn-save-opname").prop("disabled", true);
    /* serializeArray melewati field disabled; sertakan manual saat edit agar validasi server konsisten */
    var payload = $form.serializeArray();
    if (isEditMode()) {
      payload.push({ name: "id_obat", value: $selObat.val() || "" });
      payload.push({ name: "id_batch", value: $selBatch.val() || "" });
    }
    payload.push({ name: "csrf_test_name", value: csrfToken() });

    $.ajax({
      type: "POST",
      url: base_url + "master/farmasi/ajaxSaveOpname",
      data: $.param(payload),
      dataType: "json",
      beforeSend: function (xhr) {
        xhr.setRequestHeader("X-CSRF-TOKEN", csrfToken());
      },
      success: function (res) {
        syncCsrf(res);
        if (res.status === "ok") {
          $modal.modal("hide");
          toast(res.message || "Data berhasil disimpan", true);
          updateStats(res.stats);
          table.ajax.reload(null, false);
        } else if (res.errors) {
          showErrors(res.errors);
        } else {
          errorPopup("Gagal Menyimpan", res.message || "Data gagal disimpan");
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
   * BATALKAN MUTASI (hapus + kembalikan stok batch)
   * ============================================================ */
  $("#table-opname").on("click", ".btn-batal-opname", function (e) {
    e.preventDefault();
    var $btn = $(this);
    var id = $btn.attr("data-id");
    var nama = $btn.attr("data-nama") || "";
    var noBatch = $btn.attr("data-batch") || "";
    var tipe = $btn.attr("data-tipe") || "";
    var jumlah = parseInt($btn.attr("data-jumlah")) || 0;
    var sebelum = parseInt($btn.attr("data-sebelum")) || 0;

    var html =
      "Batalkan mutasi <strong>" + tipe + " " + jumlah + " unit</strong> pada batch <strong>" + noBatch +
      "</strong> (" + nama + ")?" +
      "<br><small>Data mutasi dihapus dan stok batch dikembalikan ke <strong>" + sebelum + "</strong>.</small>";

    function executeDelete() {
      $.ajax({
        type: "POST",
        url: base_url + "master/farmasi/ajaxDeleteOpname",
        data: { id: id, csrf_test_name: csrfToken() },
        dataType: "json",
        beforeSend: function (xhr) {
          xhr.setRequestHeader("X-CSRF-TOKEN", csrfToken());
        },
        success: function (res) {
          syncCsrf(res);
          if (res.status === "ok") {
            toast(res.message || "Mutasi dibatalkan", true);
            updateStats(res.stats);
            table.ajax.reload(null, false);
          } else {
            errorPopup("Gagal Membatalkan", res.message || "Mutasi gagal dibatalkan");
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
        title: "Konfirmasi Pembatalan",
        html: html,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: '<i class="fas fa-undo pe-1"></i> Ya, Batalkan',
        cancelButtonText: '<i class="fas fa-times pe-1"></i> Tutup',
        reverseButtons: true,
        focusCancel: true,
      }).then(function (result) {
        if (result.isConfirmed) executeDelete();
      });
    } else if (typeof bootbox !== "undefined") {
      bootbox.confirm({
        title: "Konfirmasi Pembatalan",
        message: html,
        buttons: {
          confirm: { label: "Batalkan", className: "btn-danger" },
          cancel: { label: "Tutup", className: "btn-secondary" },
        },
        callback: function (ok) {
          if (ok) executeDelete();
        },
      });
    } else if (confirm("Batalkan mutasi " + tipe + " " + jumlah + " pada batch " + noBatch + "?")) {
      executeDelete();
    }
  });
});
