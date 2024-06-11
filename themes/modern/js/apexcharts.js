$(document).ready( function() {
	
	grid_color_light = '#e9e9e9';
	grid_color_dark = '#3a4358';
	chart_font_color = cookie_jwd_adm_theme == 'dark' ? dark_color : light_color;
	chart_grid_color = cookie_jwd_adm_theme == 'dark' ? grid_color_dark : grid_color_light;
	tooltip_theme = $('html').attr('data-bs-theme');
	chart_theme = $('html').attr('data-bs-theme');
	
	var chartBarOptions = {
		title: {
			text: 'Data Penjualan ' + tahun_current,
			floating: false,
			offsetY: 0,
			align: 'center',
			style: {
				color: chart_font_color,
				fontWeight:  'normal',
				fontSize:  '16px'
			}
		},
		subtitle: {
			text: 'PT. Intertech Corporation',
			align: 'center',
			margin: 10,
			offsetX: 0,
			offsetY: 20,
			floating: false,
			style: {
				fontSize:  '12px',
				fontWeight:  'normal',
				color:  chart_font_color
			},
		},
		series: [{
				name: 'Penjualan',
				data: penjualan_perbulan
			}, {
				name: 'Pembelian',
				data: pembelian_perbulan
			}, {
				name: 'Gross Profit',
				data: profit_perbulan
			}
		],
		chart: {
			type: 'bar',
			height: 350
		},
		theme: {
			mode: chart_theme, 
			palette: 'palette1'
		},
		plotOptions: {
			bar: {
				horizontal: false,
				columnWidth: '55%',
				endingShape: 'rounded',
				offsetY: 20,
			},
		},
		dataLabels: {
			enabled: false
		},
		stroke: {
			show: true,
			width: 2,
			colors: ['transparent']
		},
		xaxis: {
			categories: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
			labels: {
				style: {
					colors: chart_font_color
				}
			}
		},
		yaxis: {
			title: {
				text: 'Dalam Rupiah (Rp.)',
				style: {
					fontWeight: 400,
					color: chart_font_color
				}
			},
			labels: {
				formatter: function (value) {
					return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
				},
				style: {
					colors: chart_font_color
				}
			}
		},
		grid: {
			borderColor: chart_grid_color
		},
		fill: {
			opacity: 1
		},
		tooltip: {
			y: {
				formatter: function (val) {
					return "Rp. " + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
				}
			},
			theme: tooltip_theme
		},
		legend:  {
			labels: {
				colors: chart_font_color,
				useSeriesColors: false
			}
		}
	};
	
	var barChart = new ApexCharts(document.querySelector("#chart-container"), {...chartBarOptions});
	barChart.render();

	/* Pie Chart */
	chart_item_border_color = $('html').attr('data-bs-theme') == 'dark' ? '#969fb1' : '#FFFFFF';
	var pieChartOptions = {
		title: {
			text: 'Data Penjualan ' + tahun_current,
			floating: false,
			offsetY: 0,
			align: 'center',
			margin: 0,
			style: {
				color: chart_font_color,
				fontWeight:  'normal',
				fontSize:  '16px'
			}
		},
		subtitle: {
			text: 'PT. Intertech Corporation',
			align: 'center',
			margin: 10,
			offsetX: 0,
			offsetY: 20,
			floating: false,
			style: {
				fontSize:  '12px',
				fontWeight:  'normal',
				color:  chart_font_color
			},
		},
		colors : [
			'#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#546E7A', '#F86624'
		],
		/*
		colors:[
			<?php
			foreach ($item_terjual as $val) {
				$func[] = 'dynamicColors()';
			}
					
			echo join(',', $func);
			?>
		],*/
		series: item_terjual,
		chart: {
			width: 490,
			type: 'pie'
		},
		stroke:{
			colors:[chart_item_border_color]
        },
		plotOptions: {
			pie: {
				expandOnClick: true,
				 offsetY: 20,
			}
		},
		theme: {
			mode: 'light', 
			palette: 'palette1'
		},
		dataLabels: {
			style: {
				fontSize: '12px',
				fontWeight: 'normal'
			},
			dropShadow: {
				enabled: false,
			}
		},
		labels: item_terjual_label,
		legend: {
			position: 'right',
			offsetY: 50,
			offsetX: 0,
			labels: {
				colors: chart_font_color,
				useSeriesColors: false
			}
		},
		responsive: [{
			breakpoint: 640,
			options: {
				chart: {
					width: '100%'
				},
				legend: {
					position: 'bottom',
					offsetY: 0,
				}
			}
		}]
	};

	var pieChart = new ApexCharts(document.querySelector("#pie-container"), {...pieChartOptions});
	pieChart.render();
	
	$('body').delegate('.nav-theme-option button', 'click', function() 
	{
		theme_value = $(this).attr('data-theme-value');
		chart_font_color = theme_value == 'dark' ? dark_color : light_color;
		chart_grid_color = theme_value == 'dark' ? grid_color_dark : grid_color_light;
		chart_item_border_color = theme_value == 'dark' ? '#b2b7c7' : '#FFFFFF';
		chart_theme = theme_value;
		tooltip_theme = theme_value;
		
		chartBarOptions.title.style.color = chart_font_color
		chartBarOptions.subtitle.style.color = chart_font_color
		chartBarOptions.theme.mode = chart_theme
		chartBarOptions.tooltip.theme = tooltip_theme
		chartBarOptions.xaxis.labels.style.colors = chart_font_color
		chartBarOptions.yaxis.labels.style.colors = chart_font_color
		chartBarOptions.yaxis.title.style.color = chart_font_color
		chartBarOptions.grid.borderColor = chart_grid_color
		chartBarOptions.legend.labels.colors = chart_font_color
		console.log(chartBarOptions);
		
		barChart.updateOptions({...chartBarOptions})
		
		pieChartOptions.subtitle.style.color = chart_font_color
		pieChartOptions.title.style.color = chart_font_color
		pieChartOptions.legend.labels.colors = chart_font_color
		pieChartOptions.stroke.colors = chart_item_border_color
		pieChart.updateOptions( {...pieChartOptions} )
	});
})