$(document).ready(function() {

    // source: https://stackoverflow.com/a/67184094
    var tokenHash=$("input[name=csrf_test_name]").val(); //console.log(tokenHash)

    // ===== GRAFIK KLINIS (Pendaftaran, SOAP, Awal Medis, Obat) =====
    border_color_dark = '#b2b7c7';
    border_color_light = '#FFFFFF';
    grid_color_light = '#e9e9e9';
    grid_color_dark = '#3a4358';
    chart_font_color = cookie_jwd_adm_theme == 'dark' ? dark_color : light_color;
    chart_grid_color = cookie_jwd_adm_theme == 'dark' ? grid_color_dark : grid_color_light;

    const LABEL_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    // Format angka ribuan pakai titik
    function fmtRibuan(value) {
        return (value == null ? 0 : value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Bangun config chart klinis. withNilai=true -> tampilkan 2 dataset (Jumlah + Nilai Rp)
    function buildConfigKlinis(labelJumlah, series, withNilai) {
        let datasets = [{
            label: labelJumlah,
            data: series.count,
            backgroundColor: 'rgb(99 174 206)',
            borderColor: 'rgb(99 174 206)',
            yAxisID: 'y',
            tension: 0.1
        }];

        if (withNilai) {
            datasets.push({
                label: 'Nilai (Rp)',
                data: series.nilai,
                backgroundColor: 'rgb(251 179 66)',
                borderColor: 'rgb(251 179 66)',
                yAxisID: 'y1',
                type: 'line',
                tension: 0.1
            });
        }

        let scales = {
            x: {
                ticks: { color: chart_font_color },
                grid: { color: chart_grid_color }
            },
            y: {
                type: 'linear',
                position: 'left',
                beginAtZero: true,
                title: { display: true, text: 'Jumlah', color: chart_font_color },
                ticks: {
                    color: chart_font_color,
                    callback: function(value) { return fmtRibuan(value); }
                },
                grid: { color: chart_grid_color }
            }
        };

        if (withNilai) {
            scales.y1 = {
                type: 'linear',
                position: 'right',
                beginAtZero: true,
                title: { display: true, text: 'Nilai (Rp)', color: chart_font_color },
                ticks: {
                    color: chart_font_color,
                    callback: function(value) { return fmtRibuan(value); }
                },
                grid: { drawOnChartArea: false }
            };
        }

        return {
            type: 'bar',
            data: { labels: LABEL_BULAN, datasets: datasets },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { padding: 10, boxWidth: 30, color: chart_font_color }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ctx.dataset.label + ': ' + fmtRibuan(ctx.parsed.y);
                            }
                        }
                    }
                },
                scales: scales
            }
        };
    }

    // Registry chart 12-bulan (bar): id canvas, label, apakah pakai nilai rupiah
    const KLINIS_META = {
        pendaftaran: { canvas: 'chart-klinis-pendaftaran', label: 'Jumlah Pendaftaran', withNilai: true },
        obat:        { canvas: 'chart-klinis-obat',        label: 'Jumlah Obat',        withNilai: true }
    };

    let klinisCharts = {};

    Object.keys(KLINIS_META).forEach(function(key) {
        let meta = KLINIS_META[key];
        let el = document.getElementById(meta.canvas);
        if (!el) return;
        let series = (klinisData && klinisData[key]) ? klinisData[key] : { count: [], nilai: [] };
        klinisCharts[key] = new Chart(el.getContext('2d'), buildConfigKlinis(meta.label, series, meta.withNilai));
    });

    // ===== SOAP PIE Chart (Subject/Objective/Assessment/Planning) =====
    const SOAP_LABELS = ['Subject', 'Objective', 'Assessment', 'Planning'];
    const SOAP_KEYS   = ['subject', 'objective', 'assestment', 'planing'];
    const SOAP_COLORS = ['rgb(99 174 206)', 'rgb(251 179 66)', 'rgb(62 185 110)', 'rgb(220 92 92)'];

    function soapValues(src) {
        return SOAP_KEYS.map(function(k) { return (src && src[k]) ? Number(src[k]) : 0; });
    }

    let soapChart = null;
    let soapEl = document.getElementById('chart-klinis-soap');
    if (soapEl) {
        soapChart = new Chart(soapEl.getContext('2d'), {
            type: 'pie',
            data: {
                labels: SOAP_LABELS,
                datasets: [{
                    data: soapValues(typeof soapBreakdown !== 'undefined' ? soapBreakdown : {}),
                    backgroundColor: SOAP_COLORS,
                    borderColor: (cookie_jwd_adm_theme == 'dark' ? border_color_dark : border_color_light),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: { padding: 10, boxWidth: 30, color: chart_font_color }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ctx.label + ': ' + fmtRibuan(ctx.parsed);
                            }
                        }
                    }
                }
            }
        });
    }

    // ===== Gauge Pendapatan per Dokter (half-doughnut) =====
    const GAUGE_COLORS = [
        'rgb(99 174 206)', 'rgb(251 179 66)', 'rgb(62 185 110)', 'rgb(220 92 92)',
        'rgb(153 102 255)', 'rgb(255 159 64)', 'rgb(75 192 192)', 'rgb(201 203 207)'
    ];
    function gaugeLabels(list) { return (list || []).map(function(r) { return r.nama || '-'; }); }
    function gaugeData(list) { return (list || []).map(function(r) { return Number(r.total) || 0; }); }
    function gaugeColors(list) { return (list || []).map(function(_, i) { return GAUGE_COLORS[i % GAUGE_COLORS.length]; }); }

    let dokterChart = null;
    let dokterEl = document.getElementById('chart-klinis-awal');
    if (dokterEl) {
        let dokterList = (typeof pendapatanDokter !== 'undefined') ? pendapatanDokter : [];
        dokterChart = new Chart(dokterEl.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: gaugeLabels(dokterList),
                datasets: [{
                    data: gaugeData(dokterList),
                    backgroundColor: gaugeColors(dokterList),
                    borderColor: (cookie_jwd_adm_theme == 'dark' ? border_color_dark : border_color_light),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                rotation: -90,
                circumference: 180,
                cutout: '65%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: { padding: 10, boxWidth: 20, color: chart_font_color }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) { return ctx.label + ': Rp ' + fmtRibuan(ctx.parsed); }
                        }
                    }
                }
            }
        });
    }

    // Ambil ulang data dari server saat filter berubah, lalu update semua chart
    function reloadKlinis() {
        let tahun = $('#filter-klinis-tahun').val() || klinisTahunAwal;
        let cabang = $('#filter-klinis-cabang').val() || '';

        let $wrap = $('#filter-klinis-cabang').parent();
        let $spinner = $('<div class="spinner-container ms-2" style="display:inline-block">' +
            '<div class="spinner-border spinner-border-sm"></div></div>').appendTo($wrap);

        $.get(klinisEndpoint + '?jenis=all&tahun=' + encodeURIComponent(tahun) + '&cabang=' + encodeURIComponent(cabang), function(resp) {
            $spinner.remove();
            let data = typeof resp === 'string' ? JSON.parse(resp) : resp;
            Object.keys(KLINIS_META).forEach(function(key) {
                if (!klinisCharts[key] || !data[key]) return;
                klinisCharts[key].data.datasets[0].data = data[key].count;
                if (KLINIS_META[key].withNilai && klinisCharts[key].data.datasets[1]) {
                    klinisCharts[key].data.datasets[1].data = data[key].nilai;
                }
                klinisCharts[key].update();
            });
            if (soapChart && data.soap) {
                soapChart.data.datasets[0].data = soapValues(data.soap);
                soapChart.update();
            }
            if (dokterChart && data.awal) {
                dokterChart.data.labels = gaugeLabels(data.awal);
                dokterChart.data.datasets[0].data = gaugeData(data.awal);
                dokterChart.data.datasets[0].backgroundColor = gaugeColors(data.awal);
                dokterChart.update();
            }
        }).fail(function() {
            $spinner.remove();
        });
    }

    $('#filter-klinis-tahun, #filter-klinis-cabang').on('change', reloadKlinis);

    // Update warna chart klinis saat ganti tema
    $('body').delegate('.nav-theme-option button', 'click', function() {
        theme_value = $(this).attr('data-theme-value');
        font_color = theme_value == 'dark' ? dark_color : light_color;
        grid_color = theme_value == 'dark' ? grid_color_dark : grid_color_light;

        Object.keys(klinisCharts).forEach(function(key) {
            let c = klinisCharts[key];
            if (!c) return;
            if (c.options.scales.x) { c.options.scales.x.ticks.color = font_color; c.options.scales.x.grid.color = grid_color; }
            if (c.options.scales.y) { c.options.scales.y.ticks.color = font_color; c.options.scales.y.grid.color = grid_color; c.options.scales.y.title.color = font_color; }
            if (c.options.scales.y1) { c.options.scales.y1.ticks.color = font_color; c.options.scales.y1.title.color = font_color; }
            c.options.plugins.legend.labels.color = font_color;
            c.update();
        });

        if (theme_value == 'dark') {
            $('#tindakan-terbesar_wrapper').find('.buttons-html5').removeClass('btn-light');
        } else {
            $('#tindakan-terbesar_wrapper').find('.buttons-html5').addClass('btn-light');
        }
    });

    // Penjualan Terbesar - Data Tables Ajax
    let dataTablesPenjualanTerbesar = '';
    let column = $.parseJSON($('#penjualan-terbesar-column').html());
    let url = $('#penjualan-terbesar-url').text();

    const settings = {
        "processing": true,
        "serverSide": true,
        "scrollX": true,
        pageLength: 5,
        lengthChange: false,
        "ajax": {
            "url": url,
            "type": "POST",
            // Kirim CSRF via header (CI4 support X-CSRF-TOKEN header)
            "beforeSend": function (xhr) {
                xhr.setRequestHeader("X-CSRF-TOKEN", tokenHash);
            },
            "data": function (d) {
                // tidak perlu kirim csrf_test_name di body, sudah via header
            },
            // Refresh tokenHash dari response header setelah setiap request (termasuk error)
            "xhr": function () {
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
            "dataSrc": function (json) {
                if (json.csrf && json.csrf.value) {
                    tokenHash = json.csrf.value;
                    $('input[name=csrf_test_name]').val(tokenHash);
                }
                return json.data;
            }
        },
        "columns": column
    }

    let $add_setting = $('#penjualan-terbesar-setting');
    if ($add_setting.length > 0) {
        add_setting = $.parseJSON($('#penjualan-terbesar-setting').html());
        for (k in add_setting) {
            settings[k] = add_setting[k];
        }
    }

    dataTablesPenjualanTerbesar = $('#tabel-penjualan-terbesar').DataTable(settings);

    // Update Chart Penjualan
    $('#tahun-penjualan-perbulan').change(function() {
        $this = $(this);
        $spinner = $('<div class="spinner-container me-2" style="margin:auto">' +
            '<div class="spinner-border spinner-border-sm"></div>' +
            '</div>').prependTo($this.parent());

        $.get(base_url + 'dashboard/ajaxGetPenjualan?tahun=' + $(this).val(), function(data) {
            $spinner.remove();
            if (data) {
                data_penjualan = JSON.parse(data);

                randomBackground = [];

                for (i = 0; i < 12; i++) {
                    randomBackground.push(dynamicColors());
                }

                dataChartPenjualan.datasets = [{
                    backgroundColor: randomBackground,
                    borderWidth: 1,
                    data: data_penjualan
                }];
                chartPenjualan.update();
            }
        });
    })

    // Update Kontribusi Penjualan
    $('#tahun-barang-terlaris').change(function() {
        $this = $(this);
        settings.ajax.url = base_url + 'dashboard/getDataDTPenjualanTerbesar?tahun=' + $this.val();
        dataTablesPenjualanTerbesar.destroy();
        len = $('#tabel-penjualan-terbesar').find('thead').find('th').length;
        $('#tabel-penjualan-terbesar').find('tbody').html('<tr>' +
            '<td colspan="' + len + '" class="text-center">Loading data...</td>' +
            '</tr>');
        dataTablesPenjualanTerbesar = $('#tabel-penjualan-terbesar').DataTable(settings);
    })

    // ===== Chart Dokter Favorite (PIE) =====
    let chartDokterFavorite = null;
    let configChartDokterFavorite = null;
    let dokterFavEl = document.getElementById('pie-container');
    if (dokterFavEl) {
        let dokterFavBg = (dokter_favorite || []).map(function() { return dynamicColors(); });
        let borderColorInit = (cookie_jwd_adm_theme == 'dark' ? border_color_dark : border_color_light);
        configChartDokterFavorite = {
            type: 'pie',
            data: {
                labels: dokter_favorite_label,
                datasets: [{
                    data: dokter_favorite,
                    backgroundColor: dokterFavBg,
                    borderColor: borderColorInit
                }]
            },
            options: {
                responsive: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: { padding: 10, boxWidth: 30, color: chart_font_color }
                    }
                }
            }
        };
        chartDokterFavorite = new Chart(dokterFavEl.getContext('2d'), configChartDokterFavorite);
    }

    // Update Chart Dokter Favorite
    $('#tahun-item-terjual').change(function() {
        $this = $(this);
        $spinner = $('<div class="spinner-container me-2" style="margin:auto">' +
            '<div class="spinner-border spinner-border-sm"></div>' +
            '</div>').prependTo($this.parent());

        $.get(base_url + 'dashboard/ajaxGetDokterFavorite?tahun=' + $(this).val(), function(data) {
            $spinner.remove();
            if (data) {
                data = JSON.parse(data);
                dokter_favorite = data.total;
                dokter_favorite_label = data.nama_dokter;

                randomBackground = [];
                dokter_favorite.map(() => {
                    randomBackground.push(dynamicColors());
                })

                theme_value = $('html').attr('data-bs-theme');
                border_color = theme_value == 'dark' ? border_color_dark : border_color_light;
                configChartDokterFavorite.data = {
                    datasets: [{
                        data: dokter_favorite,
                        backgroundColor: randomBackground,
                        borderColor: border_color
                    }],
                    labels: dokter_favorite_label
                }
                chartDokterFavorite.update();
            }
        });
    })

    // Update Kategori Terjual
    $('#tahun-kategori-terjual').change(function() {
        $this = $(this);
        $spinner = $('<div class="spinner-container me-2" style="margin:auto">' +
            '<div class="spinner-border spinner-border-sm"></div>' +
            '</div>').prependTo($this.parent());

        $.get(base_url + 'dashboard/ajaxGetKategoriTerjual?tahun=' + $(this).val(), function(data) {
            $spinner.remove();
            if (data) {
                data = JSON.parse(data);
                data_kategori = data.total;
                data_kategori_label = data.nama_kategori;

                randomBackground = [];
                data_kategori.map(() => {
                    randomBackground.push(dynamicColors());
                })

                theme_value = $('html').attr('data-bs-theme');
                border_color = theme_value == 'dark' ? border_color_dark : border_color_light;
                configChartKategori.data = {
                    labels: data_kategori_label,
                    datasets: [{
                        label: 'Top Kategori',
                        data: data_kategori,
                        backgroundColor: randomBackground,
                        hoverOffset: 4,
                        borderColor: border_color
                    }]
                }

                chartKategori.update();
            }
        });
    })

    // Update Kategori Terjual Detail
    $('#tahun-kategori-terjual-detail').change(function() {
        $this = $(this);
        $spinner = $('<div class="spinner-container me-2" style="margin:auto">' +
            '<div class="spinner-border spinner-border-sm"></div>' +
            '</div>').prependTo($this.parent());

        $.get(base_url + 'dashboard/ajaxGetKategoriTerjual?tahun=' + $(this).val(), function(data) {
            $spinner.remove();
            if (data) {
                data = JSON.parse(data);
                html = '';
                data.item_terjual.map(item => {
                    html += '<tr>' +
                        '<td><span class="text-warning h5"><i class="fas fa-folder"></i></span></td>' +
                        '<td>' + item.nama_kategori + '</td>' +
                        '<td class="text-end">' + item.nilai + '</td>' +

                        '</tr>';
                })
                $this.parents('.card').eq(0).find('tbody').html(html);
            }
        });
    })

    // Update Penjualan Terbaru
    $('#tahun-tindakan-terbesar').change(function() {

        $this = $(this);
        $spinner = $('<div class="spinner-container me-2" style="margin:auto">' +
            '<div class="spinner-border spinner-border-sm"></div>' +
            '</div>').prependTo($this.parent());

        if (dataTablesPenjualanTerbaru) {
            dataTablesPenjualanTerbaru.destroy();
        }

        $tbody = $this.parents('.card').eq(0).find('tbody');
        len = $this.parents('.card').eq(0).find('th').length;
        html = '<tr><td colspan="' + len + '">Loading data...</td></tr>';
        $tbody.html(html);

        $.get(base_url + 'dashboard/ajaxGetTindakanTerbesar?tahun=' + $(this).val(), function(data) {
            $spinner.remove();
            if (data) {
                data = JSON.parse(data);
                html = '';
                data.map((item, index) => {
                    html += '<tr>' +
                        '<td>' + (index + 1) + '</td>' +
                        '<td>' + item.nama_pasien + '</td>' +
                        '<td class="text-end">' + item.jml_barang + '</td>' +
                        '<td class="text-end">' + item.total_harga + '</td>' +
                        '<td>' + item.tgl_transaksi + '</td>' +
                        '<td><span class="badge rounded-pill bg-success">' + item.status + '</span></td>' +
                        '</tr>';
                })

                $tbody.html(html);
                initDataTablesTindakanTerbesar();
            }
        });
    })

    // Update Pelanggan Terbesar
    $('#tahun-pelanggan-terbesar').change(function() {

        $this = $(this);
        $spinner = $('<div class="spinner-container me-2" style="margin:auto">' +
            '<div class="spinner-border spinner-border-sm"></div>' +
            '</div>').prependTo($this.parent());

        $.get(base_url + 'dashboard/ajaxGetPelangganTerbesar?tahun=' + $(this).val(), function(data) {
            $spinner.remove();
            if (data) {
                data = JSON.parse(data);
                html = '';
                data.map(item => {
                    html += '<tr>' +
                        '<td>' + item.foto + '</td>' +
                        '<td>' + item.nama_pelanggan + '</td>' +
                        '<td class="text-end">' + item.total_harga + '</td>' +
                        '</tr>';
                })

                $this.parents('.card').eq(0).find('tbody').html(html);
            }
        });
    })

    let dataTablesPenjualanTerbaru = '';

    function initDataTablesTindakanTerbesar() {
        let settings = {
            "order": [4, "desc"],
            "columnDefs": [{
                "targets": [0],
                "orderable": false
            }],
            pageLength: 5,
            lengthChange: false
        };

        const addSettings = {
            // "dom":"Bfrtip",
            "buttons": [{
                    "extend": "copy",
                    "text": "<i class='far fa-copy'></i> Copy",
                    "className": "btn-light me-1"
                },
                {
                    "extend": "excel",
                    "title": "Data Tindakan Terbesar",
                    "text": "<i class='far fa-file-excel'></i> Excel",
                    "exportOptions": {
                        columns: [0, 1, 2, 3, 4],
                        modifier: {
                            selected: null
                        }
                    },
                    "className": "btn-light me-1"
                },
                {
                    "extend": "pdf",
                    "title": "Data Tindakan Terbesar",
                    "text": "<i class='far fa-file-pdf'></i> PDF",
                    "exportOptions": {
                        columns: [0, 1, 2, 3, 4],
                        modifier: {
                            selected: null
                        }
                    },
                    "className": "btn-light me-1"
                }
            ]
        }

        // Merge settings
        // settings['lengthChange'] = false;
        settings = {
            ...settings,
            ...addSettings
        };

        // settings['buttons'] = [ 'copy', 'excel', 'pdf', 'colvis' ];
        dataTablesPenjualanTerbaru = $('#tindakan-terbesar').DataTable(settings);
        dataTablesPenjualanTerbaru.buttons().container()
            .appendTo('#tindakan-terbesar_wrapper .col-md-6:eq(0)');

        $('#tindakan-terbesar_wrapper').find('.row').eq(1).css('overflow', 'auto');

        if (cookie_jwd_adm_theme == 'dark') {
            $('#tindakan-terbesar_wrapper').find('.buttons-html5').removeClass('btn-light');
        } else {
            $('#tindakan-terbesar_wrapper').find('.buttons-html5').addClass('btn-light');
        }

        // No urut
        dataTablesPenjualanTerbaru.on('order.dt search.dt', function() {
            dataTablesPenjualanTerbaru.column(0, {
                search: 'applied',
                order: 'applied'
            }).nodes().each(function(cell, i) {
                cell.innerHTML = i + 1;
            });
        }).draw();
    }

    $('#tahun-tindakan-terbesar').trigger('change');

    // ===== DataTables Pasien Terbaru =====
    if ($('#tabel-pasien-terbaru').length) {
        let pasienDt = $('#tabel-pasien-terbaru').DataTable({
            "order": [],
            "columnDefs": [{ "targets": [0], "orderable": false }],
            pageLength: 5,
            lengthChange: false,
            searching: false,
            info: false
        });
        // Nomor urut kolom pertama
        pasienDt.on('order.dt search.dt', function() {
            pasienDt.column(0, { search: 'applied', order: 'applied' }).nodes().each(function(cell, i) {
                cell.innerHTML = i + 1;
            });
        }).draw();
    }
});