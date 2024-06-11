$(document).ready(function() {
	
	grid_light_color = '#e9e9e9';
	grid_dark_color = '#3a4358';
	chart_font_color = cookie_jwd_adm_theme == 'dark' ? dark_color : light_color;
	chart_grid_color = cookie_jwd_adm_theme == 'dark' ? grid_dark_color : grid_light_color;
	
	// Chart Penjualan Perbulan
	let randomBackground = [];		
	for (i = 0; i < 12; i++){
		randomBackground.push(dynamicColors());
	}
		
	let barChartData = {
		labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
		datasets: [{
			data: penjualan_perbulan,
			label: 'Grafik Penjualan ',
			backgroundColor: randomBackground, 
			borderWidth: 1,
		}]
	};
	
	configBarChart = {
		type: 'bar',
		data: barChartData,
		options: {
			responsive: false,
			maintainAspectRatio: false,
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
				title: {
					display: true,
					text: 'Grafik Penjualan ' + tahun_current,
					font : {
						size: 16,
						weight: 'normal',
						family: 'Helvetica, Arial, sans-serif'
					},
					padding: {
						bottom: 3
					},
					color: chart_font_color
				},
				subtitle: {
					display: true,
					text: 'PT. Intertech Corporation',
					color: '#a3a6ae',
					font: {
						size: 12,
						family: 'Helvetica, Arial, sans-serif',
						weight: 'normal'
					},
					padding: {
						bottom: 15
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
				x : {
					ticks: {
						color: chart_font_color
					},
					grid: {
						color: chart_grid_color
					}
				}, 
				y: {
					beginAtZero: true,
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


	// Pie Chart
	let item_terjual_bg = [];
	item_terjual.map( () => {
		item_terjual_bg.push(dynamicColors());
	})
	
	theme_value = $('html').attr('data-bs-theme');
	chart_item_border_color = theme_value == 'dark' ? '#b2b7c7' : '#FFFFFF';
	var configPieChart = {
		type: 'pie',
		data: {
			datasets: [{
				data: item_terjual,
				backgroundColor: item_terjual_bg,
				borderColor: chart_item_border_color
			}],
			labels: item_terjual_label
		},
		options: {
			responsive: false,
			maintainAspectRatio: false,
			plugins: {
			  legend: {
				display: true,
				position: 'right',
				fullWidth: false,
				labels: {
					padding: 10,
					boxWidth: 30,
					color: chart_font_color
				},
				align: 'right'
			  },
			  title: {
					display: true,
					text: 'Barang Terjual ' + tahun_current,
					font : {
						size: 16,
						weight: 'normal',
						family: 'Helvetica, Arial, sans-serif'
					},
					padding: {
						bottom: 3
					},
					color: chart_font_color
				},
				subtitle: {
					display: true,
					text: 'PT. Intertech Corporation',
					color: '#a3a6ae',
					font: {
						size: 12,
						family: 'Helvetica, Arial, sans-serif',
						weight: 'normal'
					},
					padding: {
						bottom: 0
					}
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
	window.chartPenjualan = new Chart(ctx, configBarChart);
	
	/* Item Terjual */
	var ctx = document.getElementById('pie-container').getContext('2d');
	window.chartItemTerjual = new Chart(ctx, configPieChart);
	
	$('body').delegate('.nav-theme-option button', 'click', function() 
	{
		theme_value = $(this).attr('data-theme-value');
		chart_font_color = theme_value == 'dark' ? dark_color : light_color;
		chart_grid_color = theme_value == 'dark' ? grid_dark_color : grid_light_color;
		chart_item_border_color = theme_value == 'dark' ? '#b2b7c7' : '#FFFFFF';
		
		chartPenjualan.options.plugins.title.color = chart_font_color;
		chartPenjualan.options.scales.x.ticks.color = chart_font_color;
		chartPenjualan.options.scales.y.ticks.color = chart_font_color;
		chartPenjualan.options.scales.x.grid.color = chart_grid_color;
		chartPenjualan.options.scales.y.grid.color = chart_grid_color;
		chartPenjualan.options.plugins.legend.labels.color = chart_font_color;
		chartPenjualan.update();
		
		chartItemTerjual.options.plugins.legend.labels.color = chart_font_color;
		chartItemTerjual.options.plugins.title.color = chart_font_color;
		chartItemTerjual.data.datasets.map(function(v) {
			v.borderColor = chart_item_border_color
		})
		chartItemTerjual.update();
	});
});