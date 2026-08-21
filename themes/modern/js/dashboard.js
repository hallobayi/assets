$(document).ready(function () {
  // source: https://stackoverflow.com/a/67184094
  var tokenHash = $("input[name=csrf_test_name]").val(); //console.log(tokenHash)

  // ===== GRAFIK KLINIS (Pendaftaran, SOAP, Awal Medis, Obat) =====
  border_color_dark = "#b2b7c7";
  border_color_light = "#FFFFFF";
  grid_color_light = "#e9e9e9";
  grid_color_dark = "#3a4358";
  chart_font_color = cookie_jwd_adm_theme == "dark" ? dark_color : light_color;
  chart_grid_color =
    cookie_jwd_adm_theme == "dark" ? grid_color_dark : grid_color_light;

  const LABEL_BULAN = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  // Format angka ribuan pakai titik
  function fmtRibuan(value) {
    return (value == null ? 0 : value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Bangun config chart klinis. withNilai=true -> tampilkan 2 dataset (Jumlah + Nilai Rp)
  function buildConfigKlinis(labelJumlah, series, withNilai) {
    let datasets = [
      {
        label: labelJumlah,
        data: series.count,
        backgroundColor: "rgb(99 174 206)",
        borderColor: "rgb(99 174 206)",
        yAxisID: "y",
        tension: 0.1,
      },
    ];

    if (withNilai) {
      datasets.push({
        label: "Nilai (Rp)",
        data: series.nilai,
        backgroundColor: "rgb(251 179 66)",
        borderColor: "rgb(251 179 66)",
        yAxisID: "y1",
        type: "line",
        tension: 0.1,
      });
    }

    let scales = {
      x: {
        ticks: { color: chart_font_color },
        grid: { color: chart_grid_color },
      },
      y: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        title: { display: true, text: "Jumlah", color: chart_font_color },
        ticks: {
          color: chart_font_color,
          callback: function (value) {
            return fmtRibuan(value);
          },
        },
        grid: { color: chart_grid_color },
      },
    };

    if (withNilai) {
      scales.y1 = {
        type: "linear",
        position: "right",
        beginAtZero: true,
        title: { display: true, text: "Nilai (Rp)", color: chart_font_color },
        ticks: {
          color: chart_font_color,
          callback: function (value) {
            return fmtRibuan(value);
          },
        },
        grid: { drawOnChartArea: false },
      };
    }

    return {
      type: "bar",
      data: { labels: LABEL_BULAN, datasets: datasets },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: { padding: 10, boxWidth: 30, color: chart_font_color },
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.dataset.label + ": " + fmtRibuan(ctx.parsed.y);
              },
            },
          },
        },
        scales: scales,
      },
    };
  }

  // Registry chart 12-bulan (bar): id canvas, label, apakah pakai nilai rupiah
  const KLINIS_META = {
    pendaftaran: {
      canvas: "chart-klinis-pendaftaran",
      label: "Jumlah Pendaftaran",
      withNilai: true,
    },
  };

  let klinisCharts = {};

  Object.keys(KLINIS_META).forEach(function (key) {
    let meta = KLINIS_META[key];
    let el = document.getElementById(meta.canvas);
    if (!el) return;
    let series =
      klinisData && klinisData[key]
        ? klinisData[key]
        : { count: [], nilai: [] };
    klinisCharts[key] = new Chart(
      el.getContext("2d"),
      buildConfigKlinis(meta.label, series, meta.withNilai),
    );
  });

  /* ===== BAR Diagnosa & Tindakan terbanyak (isi panel Assessment) =====
       Sumber: rme_soap.json_assestment. Server mengirim peringkat isi inputan:
       [{label, kode, jenis: 'tindakan'|'diagnosa'|'dokter', total}, ...].
       Tiap jenis jadi dataset tersendiri (stacked) supaya legend-nya jelas;
       satu label hanya terisi pada satu dataset. */
  const ICD_JENIS = [
    { key: "tindakan", label: "Tindakan (ICD 9)", color: "rgb(251 179 66)" },
    { key: "diagnosa", label: "Diagnosa (ICD 10)", color: "rgb(99 174 206)" },
    { key: "dokter", label: "Diagnosa Dokter", color: "rgb(62 185 110)" },
  ];

  function icdList(src) {
    return Array.isArray(src) ? src : [];
  }

  /* Label sumbu dipotong agar tidak menggeser area chart; teks utuh tetap
       tampil di tooltip lewat icdFullLabels. */
  function icdShort(item) {
    let teks = item.label || item.kode || "-";
    return teks.length > 32 ? teks.substr(0, 31) + "..." : teks;
  }

  function icdFullLabels(list) {
    return list.map(function (it) {
      return (it.kode ? it.kode + " - " : "") + (it.label || "-");
    });
  }

  function icdDatasets(list) {
    return ICD_JENIS.map(function (j) {
      return {
        label: j.label,
        data: list.map(function (it) {
          return it.jenis === j.key ? Number(it.total) || 0 : 0;
        }),
        backgroundColor: j.color,
        borderColor:
          cookie_jwd_adm_theme == "dark"
            ? border_color_dark
            : border_color_light,
        borderWidth: 1,
      };
    });
  }

  let icdChart = null;
  let icdEl = document.getElementById("chart-klinis-soap");
  if (icdEl) {
    let icdList0 = icdList(typeof icdItems !== "undefined" ? icdItems : []);
    icdChart = new Chart(icdEl.getContext("2d"), {
      type: "bar",
      data: {
        labels: icdList0.map(icdShort),
        datasets: icdDatasets(icdList0),
      },
      options: {
        indexAxis: "y",
        responsive: false,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
            ticks: { precision: 0, color: chart_font_color },
            grid: { color: chart_grid_color },
          },
          y: {
            stacked: true,
            ticks: { color: chart_font_color },
            grid: { color: chart_grid_color },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: { padding: 10, boxWidth: 20, color: chart_font_color },
          },
          tooltip: {
            callbacks: {
              title: function (ctx) {
                let full = icdChart ? icdChart.fullLabels || [] : [];
                return full[ctx[0].dataIndex] || ctx[0].label;
              },
              label: function (ctx) {
                return ctx.dataset.label + ": " + fmtRibuan(ctx.parsed.x);
              },
            },
            filter: function (ctx) {
              return ctx.parsed.x > 0;
            },
          },
        },
      },
    });
    icdChart.fullLabels = icdFullLabels(icdList0);
  }

  // ===== Gauge Pendapatan per Dokter (half-doughnut) =====
  const GAUGE_COLORS = [
    "rgb(99 174 206)",
    "rgb(251 179 66)",
    "rgb(62 185 110)",
    "rgb(220 92 92)",
    "rgb(153 102 255)",
    "rgb(255 159 64)",
    "rgb(75 192 192)",
    "rgb(201 203 207)",
  ];
  function gaugeLabels(list) {
    return (list || []).map(function (r) {
      return r.nama || "-";
    });
  }
  function gaugeData(list) {
    return (list || []).map(function (r) {
      return Number(r.total) || 0;
    });
  }
  function gaugeColors(list) {
    return (list || []).map(function (_, i) {
      return GAUGE_COLORS[i % GAUGE_COLORS.length];
    });
  }

  let dokterChart = null;
  let dokterEl = document.getElementById("chart-total-pendapatan");
  if (dokterEl) {
    let dokterList =
      typeof pendapatanDokter !== "undefined" ? pendapatanDokter : [];
    dokterChart = new Chart(dokterEl.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: gaugeLabels(dokterList),
        datasets: [
          {
            data: gaugeData(dokterList),
            backgroundColor: gaugeColors(dokterList),
            borderColor:
              cookie_jwd_adm_theme == "dark"
                ? border_color_dark
                : border_color_light,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        rotation: -90,
        circumference: 180,
        cutout: "65%",
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: { padding: 10, boxWidth: 20, color: chart_font_color },
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.label + ": Rp " + fmtRibuan(ctx.parsed);
              },
            },
          },
        },
      },
    });
  }

  // ===== POLAR AREA CHART Total Tindakan per Layanan =====
  const TINDAKAN_COLORS = [
    "rgba(99, 174, 206, 0.75)",
    "rgba(251, 179, 66, 0.75)",
    "rgba(62, 185, 110, 0.75)",
    "rgba(220, 92, 92, 0.75)",
    "rgba(153, 102, 255, 0.75)",
    "rgba(255, 159, 64, 0.75)",
    "rgba(75, 192, 192, 0.75)",
    "rgba(201, 203, 207, 0.75)",
    "rgba(240, 98, 146, 0.75)",
    "rgba(77, 182, 172, 0.75)",
    "rgba(174, 213, 129, 0.75)",
    "rgba(255, 213, 79, 0.75)",
  ];

  function tindakanList(src) {
    return Array.isArray(src) ? src : [];
  }
  function tindakanLabels(list) {
    return list.map(function (r) {
      return r.nama_tindakan || r.kode_tindakan || "-";
    });
  }
  function tindakanData(list) {
    return list.map(function (r) {
      return Number(r.total) || 0;
    });
  }
  function tindakanColors(list) {
    return list.map(function (_, i) {
      return TINDAKAN_COLORS[i % TINDAKAN_COLORS.length];
    });
  }

  let tindakanChart = null;
  let tindakanEl = document.getElementById("chart-klinis-tindakan");
  if (tindakanEl) {
    let tindakanList0 = tindakanList(
      typeof tindakanItems !== "undefined" ? tindakanItems : [],
    );
    tindakanChart = new Chart(tindakanEl.getContext("2d"), {
      type: "polarArea",
      data: {
        labels: tindakanLabels(tindakanList0),
        datasets: [
          {
            data: tindakanData(tindakanList0),
            backgroundColor: tindakanColors(tindakanList0),
            borderColor:
              cookie_jwd_adm_theme == "dark"
                ? border_color_dark
                : border_color_light,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        scales: {
          r: {
            ticks: {
              color: chart_font_color,
              backdropColor: "transparent",
              precision: 0,
              callback: function (value) {
                return fmtRibuan(value);
              },
            },
            grid: {
              color: chart_grid_color,
            },
            angleLines: {
              color: chart_grid_color,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "right",
            labels: { padding: 10, boxWidth: 15, color: chart_font_color },
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return (
                  ctx.label +
                  ": " +
                  fmtRibuan(
                    ctx.parsed.r !== undefined ? ctx.parsed.r : ctx.raw,
                  ) +
                  " tindakan"
                );
              },
            },
          },
        },
      },
    });
  }

  // ===== Filter per-kartu (Tahun + Cabang) =====
  // Tiap kartu punya <div class="card-filter" data-filter="<key>"> berisi
  // select #filter-<key>-tahun dan #filter-<key>-cabang.
  const KLINIS_KEYS = ["pendaftaran", "soap", "awal", "tindakan", "obat"];

  function filterVal(key, jenis) {
    let $el = $("#filter-" + key + "-" + jenis);
    return $el.length ? $el.val() || "" : "";
  }

  function filterSpinner(key) {
    return $(
      '<div class="spinner-container ms-2" style="display:inline-block">' +
        '<div class="spinner-border spinner-border-sm"></div></div>',
    ).appendTo($('.card-filter[data-filter="' + key + '"]'));
  }

  function escHtml(val) {
    return $("<div>")
      .text(val == null ? "" : val)
      .html();
  }

  // Ambil ulang data satu kartu grafik klinis saat filternya berubah
  function reloadKlinis(key) {
    let tahun = filterVal(key, "tahun") || klinisTahunAwal;
    let cabang = filterVal(key, "cabang");
    let $spinner = filterSpinner(key);

    $.get(
      klinisEndpoint +
        "?jenis=" +
        key +
        "&tahun=" +
        encodeURIComponent(tahun) +
        "&cabang=" +
        encodeURIComponent(cabang),
      function (resp) {
        $spinner.remove();
        let data = typeof resp === "string" ? JSON.parse(resp) : resp;
        if (!data) return;

        if (key === "soap") {
          if (icdChart) {
            let list = icdList(data);
            icdChart.data.labels = list.map(icdShort);
            icdChart.data.datasets = icdDatasets(list);
            icdChart.fullLabels = icdFullLabels(list);
            icdChart.update();
          }
          return;
        }

        if (key === "awal") {
          if (dokterChart) {
            dokterChart.data.labels = gaugeLabels(data);
            dokterChart.data.datasets[0].data = gaugeData(data);
            dokterChart.data.datasets[0].backgroundColor = gaugeColors(data);
            dokterChart.update();
          }
          return;
        }

        if (key === "tindakan" || key === "obat") {
          if (tindakanChart) {
            let list = tindakanList(data);
            tindakanChart.data.labels = tindakanLabels(list);
            tindakanChart.data.datasets[0].data = tindakanData(list);
            tindakanChart.data.datasets[0].backgroundColor =
              tindakanColors(list);
            tindakanChart.update();
          }
          return;
        }

        if (klinisCharts[key]) {
          klinisCharts[key].data.datasets[0].data = data.count;
          if (
            KLINIS_META[key].withNilai &&
            klinisCharts[key].data.datasets[1]
          ) {
            klinisCharts[key].data.datasets[1].data = data.nilai;
          }
          klinisCharts[key].update();
        }
      },
    ).fail(function () {
      $spinner.remove();
    });
  }

  // Dispatcher: perubahan filter hanya me-reload kartunya sendiri
  $(".card-filter").on("change", "select", function () {
    let key = $(this).closest(".card-filter").data("filter");

    if (KLINIS_KEYS.indexOf(key) >= 0) {
      reloadKlinis(key);
    } else if (key === "kunjungan") {
      reloadKunjungan();
    } else if (key === "dokter-favorite") {
      reloadDokterFavorite();
    } else if (key === "pasien-terbaru") {
      reloadPasienTerbaru();
    } else if (key === "datang-kembali") {
      reloadDatangKembali();
    } else if (key === "rencana-bulan") {
      reloadRencanaBulan();
    }
  });

  // Update warna chart klinis saat ganti tema
  $("body").delegate(".nav-theme-option button", "click", function () {
    theme_value = $(this).attr("data-theme-value");
    font_color = theme_value == "dark" ? dark_color : light_color;
    grid_color = theme_value == "dark" ? grid_color_dark : grid_color_light;

    Object.keys(klinisCharts).forEach(function (key) {
      let c = klinisCharts[key];
      if (!c) return;
      if (c.options.scales.x) {
        c.options.scales.x.ticks.color = font_color;
        c.options.scales.x.grid.color = grid_color;
      }
      if (c.options.scales.y) {
        c.options.scales.y.ticks.color = font_color;
        c.options.scales.y.grid.color = grid_color;
        c.options.scales.y.title.color = font_color;
      }
      if (c.options.scales.y1) {
        c.options.scales.y1.ticks.color = font_color;
        c.options.scales.y1.title.color = font_color;
      }
      c.options.plugins.legend.labels.color = font_color;
      c.update();
    });

    if (icdChart) {
      icdChart.options.scales.x.ticks.color = font_color;
      icdChart.options.scales.x.grid.color = grid_color;
      icdChart.options.scales.y.ticks.color = font_color;
      icdChart.options.scales.y.grid.color = grid_color;
      icdChart.options.plugins.legend.labels.color = font_color;
      icdChart.data.datasets.forEach(function (ds) {
        ds.borderColor =
          theme_value == "dark" ? border_color_dark : border_color_light;
      });
      icdChart.update();
    }

    if (tindakanChart) {
      if (tindakanChart.options.scales && tindakanChart.options.scales.r) {
        tindakanChart.options.scales.r.ticks.color = font_color;
        tindakanChart.options.scales.r.grid.color = grid_color;
        tindakanChart.options.scales.r.angleLines.color = grid_color;
      }
      tindakanChart.options.plugins.legend.labels.color = font_color;
      tindakanChart.data.datasets.forEach(function (ds) {
        ds.borderColor =
          theme_value == "dark" ? border_color_dark : border_color_light;
      });
      tindakanChart.update();
    }
    if (rencanaChart) {
      rencanaChart.options.plugins.legend.labels.color = font_color;
      rencanaChart.data.datasets.forEach(function (ds) {
        ds.borderColor =
          theme_value == "dark" ? border_color_dark : border_color_light;
      });
      rencanaChart.update();
    }
  });

  // Penjualan Terbesar - Data Tables Ajax
  let dataTablesPenjualanTerbesar = "";
  let column = $.parseJSON($("#penjualan-terbesar-column").html());
  let url = $("#penjualan-terbesar-url").text();

  const settings = {
    processing: true,
    serverSide: true,
    scrollX: true,
    pageLength: 5,
    lengthChange: false,
    ajax: {
      url: url,
      type: "POST",
      // Kirim CSRF via header (CI4 support X-CSRF-TOKEN header)
      beforeSend: function (xhr) {
        xhr.setRequestHeader("X-CSRF-TOKEN", tokenHash);
      },
      data: function (d) {
        // tidak perlu kirim csrf_test_name di body, sudah via header
      },
      // Refresh tokenHash dari response header setelah setiap request (termasuk error)
      xhr: function () {
        var xhr = $.ajaxSettings.xhr();
        xhr.addEventListener("readystatechange", function () {
          if (this.readyState === 4) {
            var newToken = this.getResponseHeader("X-CSRF-TOKEN");
            if (newToken) {
              tokenHash = newToken;
              $("input[name=csrf_test_name]").val(tokenHash);
            }
          }
        });
        return xhr;
      },
      // Perbarui token dari response body jika ada (fallback)
      dataSrc: function (json) {
        if (json.csrf && json.csrf.value) {
          tokenHash = json.csrf.value;
          $("input[name=csrf_test_name]").val(tokenHash);
        }
        return json.data;
      },
    },
    columns: column,
  };

  let $add_setting = $("#penjualan-terbesar-setting");
  if ($add_setting.length > 0) {
    add_setting = $.parseJSON($("#penjualan-terbesar-setting").html());
    for (k in add_setting) {
      settings[k] = add_setting[k];
    }
  }

  dataTablesPenjualanTerbesar = $("#tabel-penjualan-terbesar").DataTable(
    settings,
  );

  // Update Chart Penjualan
  $("#tahun-penjualan-perbulan").change(function () {
    $this = $(this);
    $spinner = $(
      '<div class="spinner-container me-2" style="margin:auto">' +
        '<div class="spinner-border spinner-border-sm"></div>' +
        "</div>",
    ).prependTo($this.parent());

    $.get(
      base_url + "dashboard/ajaxGetPenjualan?tahun=" + $(this).val(),
      function (data) {
        $spinner.remove();
        if (data) {
          data_penjualan = JSON.parse(data);

          randomBackground = [];

          for (i = 0; i < 12; i++) {
            randomBackground.push(dynamicColors());
          }

          dataChartPenjualan.datasets = [
            {
              backgroundColor: randomBackground,
              borderWidth: 1,
              data: data_penjualan,
            },
          ];
          chartPenjualan.update();
        }
      },
    );
  });

  // Update Total Kunjungan Pasien per Layanan (DataTables) sesuai filter kartu
  function reloadKunjungan() {
    let tahun = filterVal("kunjungan", "tahun");
    let cabang = filterVal("kunjungan", "cabang");

    settings.ajax.url =
      base_url +
      "dashboard/getDataDTKunjunganPasien?tahun=" +
      encodeURIComponent(tahun) +
      "&cabang=" +
      encodeURIComponent(cabang);
    dataTablesPenjualanTerbesar.destroy();
    let len = $("#tabel-penjualan-terbesar").find("thead").find("th").length;
    $("#tabel-penjualan-terbesar")
      .find("tbody")
      .html(
        "<tr>" +
          '<td colspan="' +
          len +
          '" class="text-center">Loading data...</td>' +
          "</tr>",
      );
    dataTablesPenjualanTerbesar = $("#tabel-penjualan-terbesar").DataTable(
      settings,
    );
  }

  // ===== Chart Dokter Favorite (PIE) =====
  let chartDokterFavorite = null;
  let configChartDokterFavorite = null;
  let dokterFavEl = document.getElementById("pie-container");
  if (dokterFavEl) {
    let dokterFavBg = [];
    (dokter_favorite || []).map(() => {
      dokterFavBg.push(dynamicColors());
    });

    let theme_value_init = $("html").attr("data-bs-theme");
    let borderColorInit =
      theme_value_init == "dark" ? border_color_dark : border_color_light;

    configChartDokterFavorite = {
      type: "pie",
      data: {
        labels: dokter_favorite_label,
        datasets: [
          {
            data: dokter_favorite,
            backgroundColor: dokterFavBg,
            borderColor: borderColorInit,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: { padding: 10, boxWidth: 30, color: chart_font_color },
          },
        },
      },
    };
    chartDokterFavorite = new Chart(
      dokterFavEl.getContext("2d"),
      configChartDokterFavorite,
    );
  }

  // Update Chart Dokter Favorite sesuai filter kartu
  function reloadDokterFavorite() {
    if (!chartDokterFavorite) return;

    let tahun = filterVal("dokter-favorite", "tahun");
    let cabang = filterVal("dokter-favorite", "cabang");
    let $spinner = filterSpinner("dokter-favorite");

    $.get(
      base_url +
        "dashboard/ajaxGetDokterFavorite?tahun=" +
        encodeURIComponent(tahun) +
        "&cabang=" +
        encodeURIComponent(cabang),
      function (data) {
        $spinner.remove();
        if (!data) return;

        data = typeof data === "string" ? JSON.parse(data) : data;
        dokter_favorite = data.total || [];
        dokter_favorite_label = data.nama_dokter || [];

        let randomBackground = [];
        dokter_favorite.map(() => {
          randomBackground.push(dynamicColors());
        });

        let theme_value = $("html").attr("data-bs-theme");
        let border_color =
          theme_value == "dark" ? border_color_dark : border_color_light;
        configChartDokterFavorite.data = {
          datasets: [
            {
              data: dokter_favorite,
              backgroundColor: randomBackground,
              borderColor: border_color,
            },
          ],
          labels: dokter_favorite_label,
        };
        chartDokterFavorite.update();
      },
    ).fail(function () {
      $spinner.remove();
    });
  }

  // Update Total Kunjungan Pasien per Layanan
  $("#tahun-kunjungan-pasien").change(function () {
    $this = $(this);
    $spinner = $(
      '<div class="spinner-container me-2" style="margin:auto">' +
        '<div class="spinner-border spinner-border-sm"></div>' +
        "</div>",
    ).prependTo($this.parent());

    $.get(
      base_url + "dashboard/ajaxGetKunjunganPasien?tahun=" + $(this).val(),
      function (data) {
        $spinner.remove();
        if (data) {
          data = JSON.parse(data);
          html = "";
          data.map((item) => {
            html +=
              "<tr>" +
              "<td>" +
              item.nama_pasien +
              "</td>" +
              '<td class="text-end">' +
              item.jml_kunjungan +
              "</td>" +
              "</tr>";
          });
          $this.parents(".card").eq(0).find("tbody").html(html);
        }
      },
    );
  });

  // Update Pasien Terbaru sesuai filter kartu
  let pasienDt = null;

  function reloadPasienTerbaru() {
    if (!pasienDt) return;

    let tahun = filterVal("pasien-terbaru", "tahun");
    let cabang = filterVal("pasien-terbaru", "cabang");
    let $spinner = filterSpinner("pasien-terbaru");

    $.get(
      base_url +
        "dashboard/ajaxGetPasienTerbaru?tahun=" +
        encodeURIComponent(tahun) +
        "&cabang=" +
        encodeURIComponent(cabang),
      function (data) {
        $spinner.remove();
        data = typeof data === "string" ? JSON.parse(data) : data;

        pasienDt.clear();
        (data || []).map((item) => {
          pasienDt.row.add([
            "",
            escHtml(item.nama_pasien),
            escHtml(item.nomor_rm),
          ]);
        });
        pasienDt.draw();
      },
    ).fail(function () {
      $spinner.remove();
    });
  }

  /* ===== DOUGHNUT CHART Sebaran Rencana Kembali =====
     Sumber: rme_soap.json_plan (plan|tgl_datang_kembali),
     dikelompokkan per bulan & minggu tgl_datang_kembali: [{periode,label,total}, ...]. */
  const RENCANA_COLORS = [
    "rgb(99 174 206)",
    "rgb(251 179 66)",
    "rgb(62 185 110)",
    "rgb(220 92 92)",
    "rgb(153 102 255)",
    "rgb(255 159 64)",
    "rgb(75 192 192)",
    "rgb(201 203 207)",
    "rgb(120 144 224)",
    "rgb(233 129 179)",
    "rgb(158 199 92)",
    "rgb(240 210 90)",
    "rgb(240 98 146)",
    "rgb(77 182 172)",
    "rgb(174 213 129)",
    "rgb(255 213 79)",
    "rgb(149 117 205)",
    "rgb(79 195 247)",
    "rgb(255 138 101)",
    "rgb(161 136 127)",
    "rgb(100 181 246)",
    "rgb(129 199 132)",
    "rgb(255 183 77)",
    "rgb(229 115 115)",
  ];

  function rencanaList(src) {
    return Array.isArray(src) ? src : [];
  }
  function rencanaLabels(list) {
    return list.map(function (r) {
      return r.label || "-";
    });
  }
  function rencanaData(list) {
    return list.map(function (r) {
      return Number(r.total) || 0;
    });
  }
  function rencanaColors(list) {
    return list.map(function (_, i) {
      return RENCANA_COLORS[i % RENCANA_COLORS.length];
    });
  }

  let rencanaItems = [];

  // Klik satu irisan doughnut -> tampilkan daftar tanggal + pasien pada periode tsb.
  function tampilkanDetailRencana(item) {
    if (!item) return;

    let tahun = filterVal("rencana-bulan", "tahun") || klinisTahunAwal;
    let cabang = filterVal("rencana-bulan", "cabang");
    let $dialog = bootbox.dialog({
      title: "Rencana Datang Kembali - " + escHtml(item.label),
      message:
        '<div class="text-center py-3"><div class="spinner-border spinner-border-sm"></div></div>',
      size: "large",
      buttons: {
        cancel: { label: "Tutup", className: "btn-secondary" },
      },
    });

    $.get(
      base_url +
        "dashboard/ajaxGetDatangKembali?jenis=periode" +
        "&periode=" +
        encodeURIComponent(item.periode) +
        "&tahun=" +
        encodeURIComponent(tahun) +
        "&cabang=" +
        encodeURIComponent(cabang),
      function (data) {
        data = typeof data === "string" ? JSON.parse(data) : data;
        let list = rencanaList(data);
        let html = "";

        if (!list.length) {
          html =
            '<div class="alert alert-warning mb-0">Data tidak ditemukan</div>';
        } else {
          html =
            '<div class="table-responsive"><table class="table table-sm table-hover mb-0">' +
            "<thead><tr><th>No</th><th>Tgl. Kembali</th><th>Nama Pasien</th>" +
            "<th>No. RM</th><th>No. Reg</th></tr></thead><tbody>";
          list.map(function (r, i) {
            html +=
              "<tr>" +
              "<td>" +
              (i + 1) +
              "</td>" +
              "<td>" +
              escHtml(r.tgl_kembali_label) +
              "</td>" +
              "<td>" +
              escHtml(r.nama_pasien) +
              "</td>" +
              "<td>" +
              escHtml(r.nomor_rm) +
              "</td>" +
              "<td>" +
              escHtml(r.no_reg) +
              "</td>" +
              "</tr>";
          });
          html +=
            "</tbody></table></div>" +
            '<p class="text-muted mt-2 mb-0">Total ' +
            fmtRibuan(list.length) +
            " rencana kontrol.</p>";
        }

        $dialog.find(".bootbox-body").html(html);
      },
    ).fail(function () {
      $dialog
        .find(".bootbox-body")
        .html(
          '<div class="alert alert-danger mb-0">Gagal mengambil data</div>',
        );
    });
  }

  let rencanaChart = null;
  let rencanaEl = document.getElementById("chart-rencana-bulan");
  if (rencanaEl) {
    rencanaItems = rencanaList(
      typeof rencanaBulan !== "undefined" ? rencanaBulan : [],
    );
    rencanaChart = new Chart(rencanaEl.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: rencanaLabels(rencanaItems),
        datasets: [
          {
            data: rencanaData(rencanaItems),
            backgroundColor: rencanaColors(rencanaItems),
            borderColor:
              cookie_jwd_adm_theme == "dark"
                ? border_color_dark
                : border_color_light,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        cutout: "55%",
        layout: {
          padding: {
            top: 2,
            bottom: 4,
          },
        },
        onClick: function (evt, elements) {
          if (!elements.length) return;
          tampilkanDetailRencana(rencanaItems[elements[0].index]);
        },
        onHover: function (evt, elements) {
          if (!evt.native || !evt.native.target) return;
          evt.native.target.style.cursor = elements.length
            ? "pointer"
            : "default";
        },
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: {
              padding: 6,
              boxWidth: 12,
              font: { size: 11 },
              color: chart_font_color,
            },
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                let total = ctx.dataset.data.reduce(function (a, b) {
                  return a + b;
                }, 0);
                let persen = total ? Math.round((ctx.parsed / total) * 100) : 0;
                return (
                  ctx.label +
                  ": " +
                  fmtRibuan(ctx.parsed) +
                  " (" +
                  persen +
                  "%)"
                );
              },
            },
          },
        },
      },
    });
  }

  function reloadRencanaBulan() {
    if (!rencanaChart) return;

    let tahun = filterVal("rencana-bulan", "tahun") || klinisTahunAwal;
    let cabang = filterVal("rencana-bulan", "cabang");
    let $spinner = filterSpinner("rencana-bulan");

    $.get(
      base_url +
        "dashboard/ajaxGetDatangKembali?jenis=bulan&tahun=" +
        encodeURIComponent(tahun) +
        "&cabang=" +
        encodeURIComponent(cabang),
      function (data) {
        $spinner.remove();
        data = typeof data === "string" ? JSON.parse(data) : data;

        rencanaItems = rencanaList(data);
        rencanaChart.data.labels = rencanaLabels(rencanaItems);
        rencanaChart.data.datasets[0].data = rencanaData(rencanaItems);
        rencanaChart.data.datasets[0].backgroundColor =
          rencanaColors(rencanaItems);
        rencanaChart.update();
      },
    ).fail(function () {
      $spinner.remove();
    });
  }

  /* ===== DataTables Tgl. Datang Kembali =====
       Isi tabel: rencana kontrol dari rme_soap.json_plan (plan|tgl_datang_kembali).
       Tanggal tampil dd-mm-yyyy, jadi urutannya perlu tipe sendiri supaya tidak
       diurutkan sebagai teks biasa. */
  $.fn.dataTable.ext.type.order["tgl-id-pre"] = function (d) {
    let m = String(d).match(/^(\d{2})-(\d{2})-(\d{4})$/);
    return m ? Number(m[3] + m[2] + m[1]) : 0;
  };

  let datangDt = null;

  function reloadDatangKembali() {
    if (!datangDt) return;

    let tahun = filterVal("datang-kembali", "tahun") || klinisTahunAwal;
    let cabang = filterVal("datang-kembali", "cabang");
    let $spinner = filterSpinner("datang-kembali");

    $.get(
      base_url +
        "dashboard/ajaxGetDatangKembali?tahun=" +
        encodeURIComponent(tahun) +
        "&cabang=" +
        encodeURIComponent(cabang),
      function (data) {
        $spinner.remove();
        data = typeof data === "string" ? JSON.parse(data) : data;

        datangDt.clear();
        (data || []).map((item) => {
          datangDt.row.add([
            "",
            escHtml(item.nama_pasien),
            escHtml(item.nomor_rm),
            escHtml(item.tgl_kembali_label),
          ]);
        });
        datangDt.draw();
      },
    ).fail(function () {
      $spinner.remove();
    });
  }

  if ($("#tabel-datang-kembali").length) {
    datangDt = $("#tabel-datang-kembali").DataTable({
      order: [],
      columnDefs: [
        { targets: [0], orderable: false },
        { targets: [3], type: "tgl-id" },
      ],
      pageLength: 5,
      lengthChange: false,
      searching: true,
      info: false,
      language: {
        search: "",
        searchPlaceholder: "Cari pasien...",
        emptyTable: "Belum ada rencana datang kembali",
        zeroRecords: "Data tidak ditemukan",
        paginate: { previous: "&laquo;", next: "&raquo;" },
      },
    });
    // Nomor urut kolom pertama
    datangDt
      .on("order.dt search.dt", function () {
        datangDt
          .column(0, { search: "applied", order: "applied" })
          .nodes()
          .each(function (cell, i) {
            cell.innerHTML = i + 1;
          });
      })
      .draw();
  }

  // ===== DataTables Pasien Terbaru =====
  if ($("#tabel-pasien-terbaru").length) {
    pasienDt = $("#tabel-pasien-terbaru").DataTable({
      order: [],
      columnDefs: [{ targets: [0], orderable: false }],
      pageLength: 5,
      lengthChange: false,
      searching: false,
      info: false,
    });
    // Nomor urut kolom pertama
    pasienDt
      .on("order.dt search.dt", function () {
        pasienDt
          .column(0, { search: "applied", order: "applied" })
          .nodes()
          .each(function (cell, i) {
            cell.innerHTML = i + 1;
          });
      })
      .draw();
  }

  // ===== Dropdown tahun pada footer kartu statistik =====
  // Ganti tahun -> ambil ulang angka + growth kartunya saja.
  // Jenis kartu dibaca dari atribut data-kartu pada select-nya.
  $(".card-year-select").on("change", function () {
    let jenis = $(this).data("kartu");
    let tahun = $(this).val();
    let $card = $(this).closest(".card");
    let $nilai = $card.find(".card-title");
    let $growth = $card.find(".card-footer-left p");
    let $icon = $card.find(".card-footer-left .icon");
    let teksLama = $nilai.text();

    $nilai.text("...");

    $.get(
      kartuStatistikEndpoint +
        "?jenis=" +
        encodeURIComponent(jenis) +
        "&tahun=" +
        encodeURIComponent(tahun),
      function (resp) {
        let data = typeof resp === "string" ? JSON.parse(resp) : resp;
        if (!data) {
          $nilai.text(teksLama);
          return;
        }

        $nilai.text(data.jml);
        $growth.text(data.growth ? data.growth + "%" : "-");
        $icon.html(
          data.growth
            ? '<i class="fas ' +
                (data.growth > 0
                  ? "fa-arrow-trend-up"
                  : "fa-arrow-trend-down") +
                '"></i>'
            : "",
        );
      },
    ).fail(function () {
      $nilai.text(teksLama);
    });
  });
});
