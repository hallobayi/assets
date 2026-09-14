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
  console.log("Init Module Stok Obat (Batch)");

  var tokenHash = $("input[name=csrf_test_name]").val();

  function csrfToken() {
    return $("input[name=csrf_test_name]").val() || tokenHash || "";
  }

  function syncCsrf(json) {
    if (json && json.csrf && json.csrf.value) {
      tokenHash = json.csrf.value;
      $("input[name=csrf_test_name]").val(tokenHash);
    }
  }

  function toast(message, ok) {
    if (typeof Swal === "undefined") {
      alert(message);
      return;
    }
    Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2500,
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

  function updateStats(stats) {
    if (!stats) return;
    $("#stat-total-batch").text(stats.totalBatch);
    $("#stat-total-stok").text(stats.totalStok);
    $("#stat-hampir").text(stats.hampirKadaluarsa);
    $("#stat-kadaluarsa").text(stats.kadaluarsa);
    $("#stat-kosong").text(stats.kosong);
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
      width: "style",
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
  var column = $.parseJSON($("#dt-stok-column").html() || "[]");
  var url = $("#dt-stok-url").text();

  var settings = {
    processing: true,
    serverSide: true,
    scrollX: true,
    ajax: {
      url: url,
      type: "POST",
      data: function (d) {
        d.csrf_test_name = csrfToken();
        d.filter_id_obat = $("#filter-id-obat").val() || "";
        d.filter_status = $("#filter-status").val() || "";
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
        errorPopup("Terjadi Kesalahan", "Gagal memuat data batch dari server.");
      },
    },
    oLanguage: {
      sLengthMenu: "_MENU_ baris per halaman",
      sSearch: "Cari: _INPUT_",
      sInfo: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
      sInfoEmpty: "Tidak ada data",
      sInfoFiltered: "(disaring dari _MAX_ total data)",
      sZeroRecords: "Data batch tidak ditemukan",
      sProcessing: "Memuat...",
      oPaginate: {
        sFirst: "Pertama",
        sPrevious: "Sebelumnya",
        sNext: "Selanjutnya",
        sLast: "Terakhir",
      },
    },
    columns: column,
    fnRowCallback: function (nRow, aoData) {
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
    initComplete: function () {
      /* Cari hanya saat tekan Enter */
      var $input = $("#table-stok-obat_filter input");
      $input.unbind();
      $input.bind("keyup", function (e) {
        if (e.keyCode == 13) {
          table.search(this.value).draw();
        }
      });
    },
  };

  var addSetting = $("#dt-stok-setting").html();
  if (addSetting) {
    addSetting = $.parseJSON(addSetting);
    for (var k in addSetting) {
      settings[k] = addSetting[k];
    }
  }

  var table = $("#table-stok-obat").DataTable(settings);

  $("#filter-id-obat, #filter-status").on("change", function () {
    table.ajax.reload();
  });

  /* ============================================================
   * FORM MODAL - Tambah / Edit
   * ============================================================ */
  var $form = $("#form-stok-obat");

  function clearErrors() {
    $form.find(".is-invalid").removeClass("is-invalid");
    $form.find(".invalid-feedback").text("").hide();
  }

  function showErrors(errors) {
    clearErrors();
    var first = null;
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
      if (!first) first = $el;
    });
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
    /* Tanggal masuk default hari ini */
    var today = new Date();
    var ymd =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");
    setDate(fpMasuk, $("#batch-tgl-masuk"), ymd);
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
