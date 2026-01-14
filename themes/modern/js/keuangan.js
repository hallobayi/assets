/**
 * 	Developed by : Muchamad Desta Fadilah a.ka. topidesta
 *	Website		 : https://topidesta.my.id
 *	Year		 : 2026
 *  Description  : [TODO]
 */

jQuery(document).ready(function () {
  flatpickr(".flatpickr", {
    dateFormat: "Y-m-d",
  });

  // Handle form submission with AJAX using jQuery
  $("form").on("submit", function (e) {
    e.preventDefault();

    const $form = $(this);
    const $submitBtn = $form.find('button[type="submit"]');
    const originalText = $submitBtn.text();

    $submitBtn.prop("disabled", true).text("Menyimpan...");

    $.ajax({
      url: $form.attr("action"),
      type: "POST",
      data: $form.serialize(),
      dataType: "json",
      success: function (data) {
        $submitBtn.prop("disabled", false).text(originalText);

        if (data.status === "success") {
          Swal.fire({
            icon: "success",
            title: "Berhasil!",
            text: data.message,
            showConfirmButton: true,
            confirmButtonText: "OK",
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = base_url + "keuangan/kas";
            }
          });
        } else {
          let errorMessage = "";
          if (Array.isArray(data.message)) {
            errorMessage = data.message.join("<br>");
          } else {
            errorMessage = data.message;
          }

          Swal.fire({
            icon: "error",
            title: "Gagal!",
            html: errorMessage,
            showConfirmButton: true,
            confirmButtonText: "OK",
          });
        }
      },
      error: function () {
        $submitBtn.prop("disabled", false).text(originalText);

        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Terjadi kesalahan saat menghubungi server",
          showConfirmButton: true,
          confirmButtonText: "OK",
        });
      },
    });
  });

  if ($(".select2").length > 0) {
    $(".cabang").attr("required", "required").prop("disabled", true);

    $(".select2, .cabang")
      .select2({
        placeholder: "Select an option",
        theme: "bootstrap-5",
        allowClear: false,
      })
      .on("select2:opening", function (e) {
        $(this)
          .data("select2")
          .$dropdown.find(":input.select2-search__field")
          .attr("placeholder", "Ketik atau Klik Pilihan")
          .focus();
      });
  }

  const priceInputs = [{ input: "saldoTampilan", hidden: "saldo" }];

  priceInputs.forEach((item) => {
    const inputEl = document.getElementById(item.input);
    const hiddenEl = document.getElementById(item.hidden);

    if (inputEl && hiddenEl) {
      // Set initial value only if hiddenEl has a value
      const initialValue = hiddenEl.value || "0";
      $("#" + item.input).val("Rp. " + initialValue);

      inputEl.addEventListener("keyup", function (e) {
        // Format To Rupiah
        this.value = formatRupiah(this.value, "Rp. ");
        // Unformat Rupiah to hidden input
        hiddenEl.value = unFormatRupiah(this.value);
        inputEl.value = formatRupiah(this.value, "Rp. ");
      });
    }
  });

  /* Fungsi formatRupiah
   * source: https://malasngoding.github.io/format-rupiah-javascript/
   */
  function formatRupiah(angka, prefix) {
    var number_string = angka.replace(/[^,\d]/g, "").toString(),
      split = number_string.split(","),
      sisa = split[0].length % 3,
      rupiah = split[0].substr(0, sisa),
      ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    // tambahkan titik jika yang di input sudah menjadi angka ribuan
    if (ribuan) {
      separator = sisa ? "." : "";
      rupiah += separator + ribuan.join(".");
    }

    rupiah = split[1] != undefined ? rupiah + "," + split[1] : rupiah;
    return prefix == undefined ? rupiah : rupiah ? "Rp. " + rupiah : "";
  }

  /*
   * source: https://chatgpt.com/s/t_6935dddff0888191a42631eaa5d4eea2
   */
  function unFormatRupiah(rupiah) {
    return rupiah.replace(/Rp\.?\s?/g, "").replace(/\./g, "");
  }

  $(".kelompok_kas").change(function () {
    set_cabang($(this));
  });

  function set_cabang($elm, url) {
    const value = $elm.val();
    let $next_option = $elm.next(".select2-container");
    if ($next_option.length === 0) {
      $next_option = $elm;
    }

    $spinner = $(
      '<div class="spinner-border spinner-border-md" role="status" style="width: 1.5rem; height: 1.5rem; position:absolute; right: -27px; top:5px"></div>'
    );

    if (!$next_option) {
      return false;
    }

    $wrapper = $("<div>").css("position", "relative");
    $wrapper.insertAfter($next_option);
    $wrapper.append($spinner);

    setTimeout(function () {
      if (value === "klinik") {
        $(".cabang").prop("disabled", false);
      } else {
        $(".cabang").prop("disabled", true).val("pt");
        $(".cabang").trigger("change");
      }
      $wrapper.remove();
    }, 500);
  }
});
