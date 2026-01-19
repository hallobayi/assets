/**
 * 	Developed by : Muchamad Desta Fadilah a.ka. topidesta
 *	Website		 : https://topidesta.my.id
 *	Year		 : 2024
 *  Description  : Function Javascript (Vanilla, jQuery or Other Style Plugins Added) to Support Tindakan Module.
 */

// LIST PASIEN DI MASTER PASIEN
jQuery(document).ready(function () {
  console.log("Init Tindakan Dokter");

  // source: https://stackoverflow.com/a/67184094
  var tokenHash = $("input[name=csrf_test_name]").val(); //console.log(tokenHash)

  tinymce
    .init({
      selector: ".tinymce",
      plugins: "imagepick advlist lists link wordcount codesample",
      toolbar:
        "styleselect | bold italic underline strikethrough | forecolor | numlist bullist | image codesample",
      branding: false,
      image_title: true,
      image_description: true,
      statusbar: false,
      image_caption: true,

      file_picker_types: "image",
      file_picker_callback: function (callback, value, meta) {
        tinymce.activeEditor.windowManager.openUrl({
          title: "File Picker",
          url: filepicker_server_url + "tinymce",
          height: filepicker_height,
          width: filepicker_width,
          resizable: true,
          maximizable: true,
          inline: 1,
          onMessage: function (instance, data) {
            if (data.mceAction == "setFileUrl") {
              callback(data.meta.url, {
                alt: data.meta.alt_text,
                title: data.meta.title,
              });
            }
          },
        });
        // .then(function () {
        /* console.log('oke');
				theme_color = $('html').attr('data-bs-theme');
				$iframe = $('.card-body').find('iframe');
				$iframe_content = $iframe.contents();
				$iframe_content.find('html').attr('data-bs-theme', theme_color); */

        // })
      },

      codesample_content_css: base_url + "vendors/prism/themes/prism-dark.css",
    })
    .then(function (editors) {
      if ($("html").attr("data-bs-theme") == "dark") {
        $iframe = $(".card-body").find("iframe");
        $iframe_content = $iframe.contents();
        $iframe_content.find("#theme-style").remove();
        $iframe_content
          .find("head")
          .append('<style id="theme-style">body{color: #adb5bd}</style>');
        $iframe_content
          .find("head")
          .append(
            '<style id="theme-style">::-webkit-scrollbar { width: 15px; height: 3px;}::-webkit-scrollbar-button {  background-color: #141925;height: 0; }::-webkit-scrollbar-track {  background-color: #646464;}::-webkit-scrollbar-track-piece { background-color: #202632;}::-webkit-scrollbar-thumb { height: 35px; background-color: #181c26;border-radius: 0;}::-webkit-scrollbar-corner { background-color: #646464;}}::-webkit-resizer { background-color: #666;}</style>'
          );
      }
    });

  // SOAP DATATABLES
  let dataTablesRiwayatSoap = "";
  const column =
    typeof $("#riwayatsoap-column").html() === "string"
      ? $.parseJSON($("#riwayatsoap-column").html())
      : {};
  let url = $("#riwayatsoap-url").text();

  const settings = {
    processing: true,
    serverSide: true,
    scrollX: true,
    order: [1, "desc"],
    ajax: {
      url: url,
      type: "POST",
      data: { csrf_test_name: tokenHash }, // source: https://stackoverflow.com/a/50541928
    },
    oLanguage: {
      sLengthMenu: "_MENU_ records per page",
      sSearch: "Cari <span style='color:#F00;'>(Tekan Enter)</span>: _INPUT_",
    },
    columns: typeof column === "object" ? column : "",
    initComplete: function (settings, json) {
      // source: https://stackoverflow.com/a/30937415
      $(".dataTables_filter input").unbind();
      $(".dataTables_filter input").bind("keyup", function (e) {
        if (e.keyCode == 13) {
          dataTablesRiwayaSoap.search(this.value).draw();
        }
      });
    },
    fnRowCallback: function (nRow, aoData) {
      console.log(aoData);

      switch (aoData["kolom_soap"]) {
        case "s":
          // $('td', nRow).eq(9).text('Registrasi', nRow).css('color', 'Sienna').css("font-weight","Bold").addClass('ObstetriRelase').on("click", function(){ klikDetail(aoData['no_reg']); }).css('cursor', 'pointer');
          $("td", nRow)
            .eq(3)
            .text("Subject (S)", nRow)
            .css("color", "#0072c6")
            .css("font-weight", "Bold");
          break;
        case "o":
          $("td", nRow)
            .eq(3)
            .text("Objective (O)", nRow)
            .css("color", "#0072c6")
            .css("font-weight", "Bold");
          break;
        case "a":
          $("td", nRow)
            .eq(3)
            .text("Assesstment (A)", nRow)
            .css("color", "#0072c6")
            .css("font-weight", "Bold");
          break;
        case "p":
          $("td", nRow)
            .eq(3)
            .text("Plan (P)", nRow)
            .css("color", "#0072c6")
            .css("font-weight", "Bold");
          break;
      }
    },
  };

  dataTablesRiwayatSoap = $("#tabel-riwayatsoap").DataTable(settings);
  dataTablesRiwayatSoap.columns.adjust().draw();

  // EVALUASI DATATABLES
  let dataTablesRiwayatEvaluasi = "";
  const columnEvaluasi =
    typeof $("#riwayatevaluasi-column").html() === "string"
      ? $.parseJSON($("#riwayatevaluasi-column").html())
      : {};
  let urlEvaluasi = $("#riwayatevaluasi-url").text();

  const settingsEvaluasi = {
    processing: true,
    serverSide: true,
    scrollX: true,
    order: [1, "desc"],
    ajax: {
      url: urlEvaluasi,
      type: "POST",
      data: { csrf_test_name: tokenHash }, // source: https://stackoverflow.com/a/50541928
    },
    oLanguage: {
      sLengthMenu: "_MENU_ records per page",
      sSearch: "Cari <span style='color:#F00;'>(Tekan Enter)</span>: _INPUT_",
    },
    columns: typeof columnEvaluasi === "object" ? columnEvaluasi : "",
    initComplete: function (settingsEvaluasi, json) {
      // source: https://stackoverflow.com/a/30937415
      $(".dataTables_filter input").unbind();
      $(".dataTables_filter input").bind("keyup", function (e) {
        if (e.keyCode == 13) {
          dataTablesRiwayatEvaluasi.search(this.value).draw();
        }
      });
    },
    fnRowCallback: function (nRow, aoData) {
      console.log(aoData);

      switch (aoData["kolom_soap"]) {
        case "s":
          // $('td', nRow).eq(9).text('Registrasi', nRow).css('color', 'Sienna').css("font-weight","Bold").addClass('ObstetriRelase').on("click", function(){ klikDetail(aoData['no_reg']); }).css('cursor', 'pointer');
          $("td", nRow)
            .eq(3)
            .text("Subject (S)", nRow)
            .css("color", "#0072c6")
            .css("font-weight", "Bold");
          break;
        case "o":
          $("td", nRow)
            .eq(3)
            .text("Objective (O)", nRow)
            .css("color", "#0072c6")
            .css("font-weight", "Bold");
          break;
        case "a":
          $("td", nRow)
            .eq(3)
            .text("Assesstment (A)", nRow)
            .css("color", "#0072c6")
            .css("font-weight", "Bold");
          break;
        case "p":
          $("td", nRow)
            .eq(3)
            .text("Plan (P)", nRow)
            .css("color", "#0072c6")
            .css("font-weight", "Bold");
          break;
      }
    },
  };

  dataTablesRiwayatEvaluasi = $("#tabel-riwayatevaluasi").DataTable(
    settingsEvaluasi
  );
  dataTablesRiwayatEvaluasi.columns.adjust().draw();

  // OBAT DATATABLES
  let dataTablesRiwayatObat = "";
  const columnObat =
    typeof $("#riwayatobat-column").html() === "string"
      ? $.parseJSON($("#riwayatobat-column").html())
      : {};
  let urlObat = $("#riwayatobat-url").text();

  const settingsObat = {
    processing: true,
    serverSide: true,
    scrollX: true,
    order: [1, "desc"],
    ajax: {
      url: urlObat,
      type: "POST",
      data: { csrf_test_name: tokenHash }, // source: https://stackoverflow.com/a/50541928
    },
    oLanguage: {
      sLengthMenu: "_MENU_ records per page",
      sSearch: "Cari <span style='color:#F00;'>(Tekan Enter)</span>: _INPUT_",
    },
    columns: typeof columnObat === "object" ? columnObat : "",
    initComplete: function (settingsObat, json) {
      // source: https://stackoverflow.com/a/30937415
      $(".dataTables_filter input").unbind();
      $(".dataTables_filter input").bind("keyup", function (e) {
        if (e.keyCode == 13) {
          dataTablesRiwayatObat.search(this.value).draw();
        }
      });
    },
    fnRowCallback: function (nRow, aoData) {
      console.log(aoData);

      switch (aoData["kolom_soap"]) {
        case "s":
          // $('td', nRow).eq(9).text('Registrasi', nRow).css('color', 'Sienna').css("font-weight","Bold").addClass('ObstetriRelase').on("click", function(){ klikDetail(aoData['no_reg']); }).css('cursor', 'pointer');
          $("td", nRow)
            .eq(3)
            .text("Subject (S)", nRow)
            .css("color", "#0072c6")
            .css("font-weight", "Bold");
          break;
        case "o":
          $("td", nRow)
            .eq(3)
            .text("Objective (O)", nRow)
            .css("color", "#0072c6")
            .css("font-weight", "Bold");
          break;
        case "a":
          $("td", nRow)
            .eq(3)
            .text("Assesstment (A)", nRow)
            .css("color", "#0072c6")
            .css("font-weight", "Bold");
          break;
        case "p":
          $("td", nRow)
            .eq(3)
            .text("Plan (P)", nRow)
            .css("color", "#0072c6")
            .css("font-weight", "Bold");
          break;
      }
    },
  };

  dataTablesRiwayatObat = $("#tabel-riwayatobat").DataTable(settingsObat);
  dataTablesRiwayatObat.columns.adjust().draw();

  // Ada Bugs di CSRF Token
  $("#riwayat-soap-tab").click(function () {
    let urlSoap = $("#riwayatsoap-url").html();
    $.ajax({
      url: urlSoap,
      dataType: "json",
      type: "POST",
      // data: {
      //     'csrf_test_name': tokenHash
      // },
      success: function (data) {
        console.log(data);
      },
    });
  });

  // Detail SOAP
  var dataTablesSoap = $("#riwayat-soap");
  dataTablesSoap.on("click", "button", function (ev) {
    ev.preventDefault();
    ev.stopPropagation();

    let idSoap = $(this).data("id");
    $.ajax({
      url: base_url + "tindakandokter/ajaxDetailSoap/" + idSoap,
      dataType: "json",
      type: "GET",
      success: function (v) {
        // source: https://stackoverflow.com/a/36460527
        var table =
          '<table class="table display table-striped table-hover dataTable no-footer"> ';
        var vv = $.parseJSON(v.detail_soap);
        console.log(vv);

        switch (v.kolom_soap) {
          case "s":
            console.log(vv);
            var tr = "<tr> ";
            tr +=
              "<td>No. Reg</td><td>Kolom</td><td>BB</td><td>TB</td><td>Kesadaran</td><td>Status</td>";
            tr += "</tr>";
            tr += "<tr>";
            tr += "<td>";
            tr += "<label> " + vv.no_reg;
            tr += "</label>" + "</td> ";
            tr += "<td>";
            tr += "Subjective";
            tr += "</td>";
            tr += "<td>";
            tr += "" + vv.berat_badan + "";
            tr += "</td> ";
            tr += "<td> ";
            tr += "" + vv.tinggi_badan + "";
            tr += "</td> ";
            tr += "<td> ";
            tr += "" + vv.kesadaran + "";
            tr += "</td> ";
            tr += "<td> ";
            tr += "" + vv.status_pulang + "";
            tr += "</td> ";
            tr += "</tr> ";
            table += tr;
            table += "</table>";
            break;
          case "o":
            var tr = "<tr> ";
            tr +=
              "<td>No. Reg</td><td>Kolom</td><td>BB</td><td>TB</td><td>Freq. Nafas</td><td>Status</td>";
            tr += "</tr>";
            tr += "<tr>";
            tr += "<td>";
            tr += "<label> " + vv.no_reg;
            tr += "</label>" + "</td> ";
            tr += "<td>";
            tr += "Objective";
            tr += "</td>";
            tr += "<td>";
            tr += "" + vv.berat_badan + "";
            tr += "</td> ";
            tr += "<td> ";
            tr += "" + vv.tinggi_badan + "";
            tr += "</td> ";
            tr += "<td> ";
            tr += "" + vv.frekuensi_napas + "";
            tr += "</td> ";
            tr += "<td> ";
            tr += "" + vv.status_pulang + "";
            tr += "</td> ";
            tr += "</tr> ";
            table += tr;
            table += "</table>";
            break;
          case "a":
            var tr = "<tr> ";
            tr +=
              "<td>No. Reg</td><td>Kolom</td><td>Diagnosa</td><td>Tindakan</td><td>Perokok</td><td>Status</td>";
            tr += "</tr>";
            tr += "<tr>";
            tr += "<td>";
            tr += "<label> " + vv.no_reg;
            tr += "</label>" + "</td> ";
            tr += "<td>";
            tr += "Assesstment";
            tr += "</td>";
            tr += "<td>";
            tr += "" + vv.nama_diagnosa + "";
            tr += "</td> ";
            tr += "<td> ";
            tr += "" + vv.nama_tindakan + "";
            tr += "</td> ";
            tr += "<td> ";
            tr += "" + vv.status_perokok + "";
            tr += "</td> ";
            tr += "<td> ";
            tr += "" + vv.status_pulang + "";
            tr += "</td> ";
            tr += "</tr> ";
            table += tr;
            table += "</table>";
            break;
          case "p":
            var tr = "<tr> ";
            tr +=
              "<td>No. Reg</td><td>Kolom</td><td>Status Pulang</td><td>Tgl Datang Kembali</td><td>Keterangan</td>";
            tr += "</tr>";
            tr += "<tr>";
            tr += "<td>";
            tr += "<label> " + vv.no_reg;
            tr += "</label>" + "</td> ";
            tr += "<td>";
            tr += "Planning";
            tr += "</td>";
            tr += "<td>";
            tr += "" + vv.status_pulang + "";
            tr += "</td> ";
            tr += "<td> ";
            tr += "" + vv.tgl_datang_kembali + "";
            tr += "</td> ";
            tr += "<td> ";
            tr += "" + vv.keterangan_lain + "";
            tr += "</td> ";
            tr += "</tr> ";
            table += tr;
            table += "</table>";
            break;
          default:
            break;
        }

        bootbox.dialog({
          title: "Detail S.O.A.P",
          message: table,
          buttons: {
            cancel: {
              label: "Close",
              className: "btn-secondary",
            },
          },
        });
      },
    });
  });

  var frmSoap = $(".simpan-tindakan-soap");
  frmSoap.on("click", "button", function (ev) {
    // source: https://stackoverflow.com/a/70750965
    ev.preventDefault();
    let kolomSoap = $(this).data("id");

    var postData = $(".simpan-tindakan-soap").serializeArray();
    postData.push({ name: "csrf_test_name", value: tokenHash });

    switch (kolomSoap) {
      case "s":
        postData.push({
          name: "status_perokok",
          value: $("input[name=status_perokok]").val(),
        });
        postData.push({
          name: "keluhan_utama",
          value: $("input[name=keluhan_utama]").val(),
        });
        postData.push({
          name: "riwayat_penyakit",
          value: $("input[name=riwayat_penyakit]").val(),
        });
        postData.push({
          name: "riwayat_alergi_obat",
          value: $("input[name=riwayat_alergi_obat]").val(),
        });
        postData.push({
          name: "riwayat_alergi_lainnya",
          value: $("input[name=riwayat_alergi_lainnya]").val(),
        });
        break;

      case "o":
        postData.push({
          name: "suhu_tubuh",
          value: $("input[name=suhu_tubuh]").val(),
        });
        postData.push({ name: "nadi", value: $("input[name=nadi]").val() });
        postData.push({
          name: "sistole",
          value: $("input[name=sistole]").val(),
        });
        postData.push({
          name: "diastole",
          value: $("input[name=diastole]").val(),
        });
        postData.push({
          name: "kesadaran",
          value: $("input[name=kesadaran]").val(),
        });
        postData.push({
          name: "tinggi_badan",
          value: $("input[name=tinggi_badan]").val(),
        });
        postData.push({
          name: "berat_badan",
          value: $("input[name=berat_badan]").val(),
        });
        postData.push({
          name: "frekuensi_napas",
          value: $("input[name=frekuensi_napas]").val(),
        });
        break;

      case "a":
        postData.push({
          name: "diagnosa_sekunder",
          value: $("input[name=diagnosa_sekunder]").val(),
        });
        postData.push({
          name: "kode_tindakan",
          value: $("input[name=kode_tindakan]").val(),
        });
        break;

      case "p":
        postData.push({
          name: "status_pulang",
          value: $("input[name=status_pulang]").val(),
        });
        postData.push({
          name: "keterangan_lain",
          value: $("input[name=keterangan_lain]").val(),
        });
        break;

      default:
        console.log("Undefined Function");
        break;
    }

    $.ajax({
      url: module_url + "/ajaxSubmitTindakanSoap" + "/" + kolomSoap,
      type: "POST",
      cache: false,
      dataType: "json",
      data: $.param(postData),
      success: function (data, textStatus, jqXHR) {
        console.log(textStatus, jqXHR);

        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 5500,
          timerProgressBar: true,
          iconColor: "white",
          customClass: {
            popup: data.backcol + " text-light toast p-2",
          },
          didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
          },
        });

        if (data.status === "error") {
          Toast.fire({
            html: '<div class="toast-content"></i>' + data.message + "</div>",
          });
        } else {
          settings.ajax.url = data.urlAjax;
          dataTablesRiwayatSoap.destroy();
          len = $("#tabel-riwayatsoap").find("thead").find("th").length;
          $("#tabel-riwayatsoap")
            .find("tbody")
            .html(
              "<tr>" +
                '<td colspan="' +
                len +
                '" class="text-center">Loading data...</td>' +
                "</tr>"
            );
          dataTablesRiwayatSoap = $("#tabel-riwayatsoap").DataTable(settings);

          // Alert
          Toast.fire({
            html: '<div class="toast-content"></i>' + data.message + "</div>",
          });
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        // Handle errors here
        console.log("ERRORS: " + textStatus + " - " + errorThrown);
      },
    });
  });

  var frmEvaluasi = $(".simpan-tindakan-evaluasi");
  frmEvaluasi.submit(function (e) {
    e.preventDefault();

    var postData = $(".simpan-tindakan-evaluasi").serializeArray();
    postData.push({ name: "csrf_test_name", value: tokenHash });
    postData.push({
      name: "tgl_periksa_pasien",
      value: $("input[name=tgl_periksa_pasien]").val(),
    });
    postData.push({
      name: "jam_periksa_pasien",
      value: $("input[name=jam_periksa_pasien]").val(),
    });
    postData.push({
      name: "berat_badan_pasien",
      value: $("input[name=berat_badan_pasien]").val(),
    });
    postData.push({
      name: "tinggi_badan_pasien",
      value: $("input[name=tinggi_badan_pasien]").val(),
    });
    postData.push({
      name: "evaluasi_awal_pasien",
      value: $("textarea#evaluasi_awal_pasien").val(),
    });
    postData.push({
      name: "waktu_periksa_vital",
      value: $("input[name=waktu_periksa_vital]").val(),
    });
    postData.push({
      name: "pernafasan_vital",
      value: $("input[name=pernafasan_vital]").val(),
    });
    postData.push({
      name: "nadi_vital",
      value: $("input[name=nadi_vital]").val(),
    });
    postData.push({
      name: "tekanan_darah_vital",
      value: $("input[name=tekanan_darah_vital]").val(),
    });
    postData.push({
      name: "suhu_vital",
      value: $("input[name=suhu_vital]").val(),
    });
    postData.push({
      name: "nyeri_vital",
      value: $("input[name=nyeri_vital]").val(),
    });
    postData.push({ name: "no_reg", value: $("input[name=no_reg]").val() });

    $.ajax({
      url: module_url + "/ajaxSubmitTindakanEvaluasi",
      type: "POST",
      cache: false,
      dataType: "json",
      data: $.param(postData),
      success: function (data, textStatus, jqXHR) {
        console.log(data, textStatus, jqXHR, "status:", data.status);

        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 5500,
          timerProgressBar: true,
          iconColor: "white",
          customClass: {
            popup: data.backcol + " text-light toast p-2",
          },
          didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
          },
        });

        if (data.status === "error") {
          Toast.fire({
            html: '<div class="toast-content"></i>' + data.message + "</div>",
          });
        } else {
          // Load Ajax Datatables
          settings.ajax.url = data.urlAjax;
          dataTablesRiwayatEvaluasi.destroy();
          len = $("#tabel-riwayatevaluasi").find("thead").find("th").length;
          $("#tabel-riwayatevaluasi")
            .find("tbody")
            .html(
              "<tr>" +
                '<td colspan="' +
                len +
                '" class="text-center">Loading data...</td>' +
                "</tr>"
            );
          dataTablesRiwayatEvaluasi = $("#tabel-riwayatevaluasi").DataTable(
            settingsEvaluasi
          );
          // Alert
          Toast.fire({
            html: '<div class="toast-content"></i>' + data.message + "</div>",
          });
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        // Handle errors here
        console.log("ERRORS: " + textStatus + " - " + errorThrown);
      },
    });
    // $.ajax({
    //     type: frm.attr('method'),
    //     url: frm.attr('action'),
    //     data: frm.serialize(),
    //     success: function (data) {
    //         console.log('Submission was successful.');
    //         console.log(data);
    //     },
    //     error: function (data) {
    //         console.log('An error occurred.');
    //         console.log(data);
    //     },
    // });
  });

  var frmObat = $(".simpan-tindakan-obat");
  frmObat.submit(function (e) {
    e.preventDefault();

    var postData = $(".simpan-tindakan-obat").serializeArray();
    postData.push({ name: "csrf_test_name", value: tokenHash });
    postData.push({
      name: "id_satuan_obat",
      value: $("input[name=id_satuan_obat]").val(),
    });
    postData.push({ name: "id_obat", value: $("input[name=id_obat]").val() });
    postData.push({
      name: "harga_jual_obat",
      value: $("input[name=harga_jual_obat]").val(),
    });
    postData.push({
      name: "qty_jual_obat",
      value: $("input[name=qty_jual_obat]").val(),
    });

    $.ajax({
      url: module_url + "/ajaxSubmitTindakanObat",
      type: "POST",
      cache: false,
      dataType: "json",
      data: $.param(postData),
      success: function (data, textStatus, jqXHR) {
        console.log(textStatus, jqXHR);

        // Load Ajax Datatables
        settingsObat.ajax.url = data.urlAjax;
        dataTablesRiwayatObat.destroy();
        len = $("#tabel-riwayatobat").find("thead").find("th").length;
        $("#tabel-riwayatobat")
          .find("tbody")
          .html(
            "<tr>" +
              '<td colspan="' +
              len +
              '" class="text-center">Loading data...</td>' +
              "</tr>"
          );
        dataTablesRiwayatObat = $("#tabel-riwayatobat").DataTable(settingsObat);

        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3500,
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
          html: '<div class="toast-content"><i class="far fa-check-circle me-2"></i> Data berhasil disimpan</div>',
        });
      },
      error: function (jqXHR, textStatus, errorThrown) {
        // Handle errors here
        console.log("ERRORS: " + textStatus + " - " + errorThrown);
      },
    });
  });

  $(".tglPeriksa").flatpickr({
    dateFormat: "d-m-Y",
  });
  $(".jamPeriksa").flatpickr({
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
  });
  $(".jamVital").flatpickr({
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
  });

  // SOAP Tindakan Assessment
  $(".objstetri").on("change", function () {
    var data = $(".objstetri option:selected").val();
    // $("#test").val(data);
    if (data === "1") {
      $(".object_1").show();
      $(".object_23").hide();
    } else if (data === "2-3") {
      $(".object_23").show();
      $(".object_1").hide();
    } else {
      $(".object_23").hide();
      $(".object_1").hide();
    }
  });

  // Clone Obstetri
  // Source: https://jsbin.com/xadedigapi/edit?html,output
  $("#tambahCloneObstetri").click(function () {
    var r = (Math.random() + 1).toString(36).substring(2);

    var thing = $("#originalObstetri")
      .clone(true)
      .find(".objstetri")
      .attr({
        class: "objstetriClone_" + r,
      })
      .end();

    // 2. Generate a random ID
    var randomId = "clonedDiv_" + r;

    // 3. Assign the new ID to the cloned div
    thing.attr("id", randomId);

    // Optional: Add a class to distinguish cloned divs
    thing.addClass("cloned-div");

    thing.find(".object_1").attr({
      class: "object_1_" + r,
    });

    thing.find(".object_23").attr({
      class: "object_23_" + r,
    });

    thing.find(".object_23_" + r).hide();
    thing.find(".object_1_" + r).hide();

    thing.find(".tombolDeleteObstetri").attr({
      class: "btn btn-danger remove",
      value: "Hapus Obstetri",
      name: r,
    });
    $(".clonedObstetri").append(thing);

    $(document).on("change", ".objstetriClone_" + r, function () {
      var data = $(".objstetriClone_" + r + " option:selected").val(); //console.log(data);
      // $("#test").val(data);
      if (data === "1") {
        $(".object_1_" + r).show();
        $(".object_23_" + r).hide();
      } else if (data === "2-3") {
        $(".object_23_" + r).show();
        $(".object_1_" + r).hide();
      } else {
        $(".object_23_" + r).hide();
        $(".object_1_" + r).hide();
      }
    });
  });

  $(document).on("click", ".btn.remove", function () {
    id = $(this).attr("name");
    $(".clonedDiv_" + id).remove();
  });

  // Evaluasi Gizi - Minum Obat
  $("#sedang_minum_obat_gizi")
    .on("change select2:select", function () {
      $("#nama_obat_ya").prop("disabled", $(this).val() !== "ya");
    })
    .trigger("change");
});
