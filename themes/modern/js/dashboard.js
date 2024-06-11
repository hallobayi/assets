$(document).ready(function() {

    // source: https://stackoverflow.com/a/67184094
    var tokenHash=$("input[name=csrf_test_name]").val(); //console.log(tokenHash)

    // Chart Penjualan Perbulan
    let randomBackground = [];

    for (i = 0; i < 12; i++) {
        randomBackground.push(dynamicColors());
    }

    dataset_penjualan = [];
    colors = ['rgb(99 174 206)', 'rgb(251 179 66)', 'rgb(62 185 110)'];
    // colors = ['rgb(76 162 199)', 'rgb(250 168 38)', 'rgb(37 176 91)'];
    border_color_dark = '#b2b7c7';
    border_color_light = '#FFFFFF';
    grid_color_light = '#e9e9e9';
    grid_color_dark = '#3a4358';
    chart_font_color = cookie_jwd_adm_theme == 'dark' ? dark_color : light_color;
    chart_grid_color = cookie_jwd_adm_theme == 'dark' ? grid_color_dark : grid_color_light;

    num = 0;
    Object.keys(data_penjualan).map(tahun => {
        color = colors[num];
        dataset_penjualan.push({
            label: tahun,
            backgroundColor: color,
            data: data_penjualan[tahun],
            fill: false,
            borderColor: color,
            tension: 0.1
        });
        num++;
    });

    let dataChartPenjualan = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        datasets: dataset_penjualan
    };

    configChartPenjualan = {
        type: 'line',
        data: dataChartPenjualan,
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    fullWidth: false,
                    labels: {
                        padding: 10,
                        boxWidth: 30,
                        color: chart_font_color
                    }
                }
            },

            tooltips: {
                callbacks: {
                    label: function(tooltipItems, data) {
                        // return data.labels[tooltipItems.index] + ": " + data.datasets[0].data[tooltipItems.index].toLocaleString();
                        // return "Total : " + data.datasets[0].data[tooltipItems.index].toLocaleString();
                        return "Total : " + data.datasets[0].data[tooltipItems.index].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: chart_font_color
                    },
                    grid: {
                        color: chart_grid_color
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: chart_font_color,
                        callback: function(value, index, values) {
                            // return value.toLocaleString();
                            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                        }
                    },
                    grid: {
                        color: chart_grid_color
                    }
                }
            }
        }
    }

    // Chart Total Penjualan
    label_total_penjualan = [];
    // colors = ['rgb(99 174 206)', 'rgb(251 179 66)', 'rgb(62 185 110)'];
    colors = [dynamicColors(), dynamicColors(), dynamicColors()];
    // colors = ['rgb(76 162 199)', 'rgb(250 168 38)', 'rgb(37 176 91)'];

    num = 0;
    Object.keys(total_penjualan).map(tahun => {
        label_total_penjualan.push(tahun);
    });

    let dataChartTotalPenjualan = {
        labels: label_total_penjualan,
        datasets: [{
            data: total_penjualan,
            backgroundColor: colors,
            borderWidth: 1
        }]
    };

    configChartTotalPenjualan = {
        type: 'bar',
        data: dataChartTotalPenjualan,
        options: {
            responsive: false,
            maintainAspectRatio: false,
            aspectRatio: 1,
            plugins: {
                legend: {
                    display: false,
                    position: 'top',
                    fullWidth: false,
                    labels: {
                        padding: 10,
                        boxWidth: 30,
                        color: chart_font_color
                    }
                },
                display: false,
                text: '',
                fontSize: 14,
                lineHeight: 3
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItems, data) {
                        // return data.labels[tooltipItems.index] + ": " + data.datasets[0].data[tooltipItems.index].toLocaleString();
                        // return "Total : " + data.datasets[0].data[tooltipItems.index].toLocaleString();
                        return "Total : " + data.datasets[0].data[tooltipItems.index].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: chart_font_color
                    },
                    grid: {
                        color: chart_grid_color
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: chart_font_color,
                        // stepSize: 500000000,
                        callback: function(value, index, values) {
                            // return value.toLocaleString();
                            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                        }
                    },
                    grid: {
                        color: chart_grid_color
                    }
                }
            }
        }
    }

    // Chart Item Terjual
    let item_terjual_bg = [];
    item_terjual.map(() => {
        item_terjual_bg.push(dynamicColors());
    })

    theme_value = $('html').attr('data-bs-theme');
    border_color = theme_value == 'dark' ? border_color_dark : border_color_light;
    var configChartItemTerjual = {
        type: 'pie',
        data: {
            datasets: [{
                data: item_terjual,
                backgroundColor: item_terjual_bg,
                borderColor: border_color
            }],
            labels: item_terjual_label
        },
        options: {
            responsive: false,
            // maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    fullWidth: false,
                    labels: {
                        padding: 10,
                        boxWidth: 30,
                        color: chart_font_color
                    }
                },
                title: {
                    display: false,
                    text: 'Item Terjual'
                }
            },
            elements: {
                arc: {
                    borderWidth: 1
                }
            }
        }
    };

    data_kategori = JSON.parse(jumlah_item_kategori)

    let background_kategori = [];
    item_terjual.map(() => {
        background_kategori.push(dynamicColors());
    })

    const dataChartKategori = {
        labels: JSON.parse(label_kategori),
        datasets: [{
            label: 'Top Kategori',
            data: data_kategori,
            backgroundColor: background_kategori,
            borderColor: border_color,
            hoverOffset: 4
        }]
    };

    const configChartKategori = {
        type: 'doughnut',
        data: dataChartKategori,
        options: {
            responsive: false,
            // maintainAspectRatio: false,
            title: {
                display: false,
                text: '',
                fontSize: 14,
                lineHeight: 3
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    fullWidth: false,
                    labels: {
                        padding: 10,
                        boxWidth: 30,
                        color: chart_font_color
                    }
                },
                title: {
                    display: false,
                    text: 'Kategori'
                }
            },
            elements: {
                arc: {
                    borderWidth: 1
                }
            }
        }
    };

    /* Penjualan perbulan */
    var ctx = document.getElementById('bar-container').getContext('2d');
    chartPenjualan = new Chart(ctx, configChartPenjualan);

    /* Penjualan total */
    var ctx = document.getElementById('chart-total-penjualan').getContext('2d');
    chartTotalPenjualan = new Chart(ctx, configChartTotalPenjualan);

    /* Item Terjual */
    var ctx = document.getElementById('pie-container').getContext('2d');
    chartItemTerjual = new Chart(ctx, configChartItemTerjual);

    /* Kategori */
    var ctx = document.getElementById('chart-kategori').getContext('2d');
    chartKategori = new Chart(ctx, configChartKategori);

    $('body').delegate('.nav-theme-option button', 'click', function() {
        theme_value = $(this).attr('data-theme-value');
        font_color = theme_value == 'dark' ? dark_color : light_color;
        grid_color = theme_value == 'dark' ? grid_color_dark : grid_color_light;
        border_color = theme_value == 'dark' ? border_color_dark : border_color_light;

        chartPenjualan.options.scales.x.ticks.color = font_color;
        chartPenjualan.options.scales.y.ticks.color = font_color;
        chartPenjualan.options.scales.x.grid.color = grid_color;
        chartPenjualan.options.scales.y.grid.color = grid_color;
        chartPenjualan.options.plugins.legend.labels.color = font_color;
        chartPenjualan.update();

        chartTotalPenjualan.options.scales.x.ticks.color = font_color;
        chartTotalPenjualan.options.scales.y.ticks.color = font_color;
        chartTotalPenjualan.options.scales.x.grid.color = grid_color;
        chartTotalPenjualan.options.scales.y.grid.color = grid_color;
        chartTotalPenjualan.options.plugins.legend.labels.color = font_color;
        chartTotalPenjualan.update();

        chartItemTerjual.options.plugins.legend.labels.color = font_color;
        chartItemTerjual.data.datasets.map(function(v) {
            v.borderColor = border_color
        })
        chartItemTerjual.update();

        chartKategori.options.plugins.legend.labels.color = font_color;
        chartKategori.data.datasets.map(function(v) {
            v.borderColor = border_color
        })
        chartKategori.update();

        if (theme_value == 'dark') {
            $('#penjualan-terbaru_wrapper').find('.buttons-html5').removeClass('btn-light');
        } else {
            $('#penjualan-terbaru_wrapper').find('.buttons-html5').addClass('btn-light');
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
            "data": { 'csrf_test_name':tokenHash } // source: https://stackoverflow.com/a/50541928
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

    // Update Chart Item Terjual
    $('#tahun-item-terjual').change(function() {
        $this = $(this);
        $spinner = $('<div class="spinner-container me-2" style="margin:auto">' +
            '<div class="spinner-border spinner-border-sm"></div>' +
            '</div>').prependTo($this.parent());

        $.get(base_url + 'dashboard/ajaxGetItemTerjual?tahun=' + $(this).val(), function(data) {
            $spinner.remove();
            if (data) {
                data = JSON.parse(data);
                data_item_terjual = data.total;
                item_terjual_label = data.nama_item;

                randomBackground = [];
                data_item_terjual.map(() => {
                    randomBackground.push(dynamicColors());
                })

                theme_value = $('html').attr('data-bs-theme');
                border_color = theme_value == 'dark' ? border_color_dark : border_color_light;
                configChartItemTerjual.data = {
                    datasets: [{
                        data: item_terjual,
                        backgroundColor: randomBackground,
                        borderColor: border_color
                    }],
                    labels: item_terjual_label
                }
                chartItemTerjual.update();
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
    $('#tahun-penjualan-terbaru').change(function() {

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

        $.get(base_url + 'dashboard/ajaxGetPenjualanTerbaru?tahun=' + $(this).val(), function(data) {
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
                initDataTablesPenjualanTerbaru();
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

    function initDataTablesPenjualanTerbaru() {
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
                    "title": "Data Penjualan Terbaru",
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
                    "title": "Data Penjualan Terbaru",
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
        dataTablesPenjualanTerbaru = $('#penjualan-terbaru').DataTable(settings);
        dataTablesPenjualanTerbaru.buttons().container()
            .appendTo('#penjualan-terbaru_wrapper .col-md-6:eq(0)');

        $('#penjualan-terbaru_wrapper').find('.row').eq(1).css('overflow', 'auto');

        if (cookie_jwd_adm_theme == 'dark') {
            $('#penjualan-terbaru_wrapper').find('.buttons-html5').removeClass('btn-light');
        } else {
            $('#penjualan-terbaru_wrapper').find('.buttons-html5').addClass('btn-light');
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

    $('#tahun-penjualan-terbaru').trigger('change');
});