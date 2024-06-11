$(document).ready( function() {
	
	grid_color_light = '#e9e9e9';
	grid_color_dark = '#3a4358';
	tooltip_background_color_dark = '#202634';
	tooltip_background_color_light = '#FFFFFF';
	tooltip_border_color_dark = '#4a505f';
	tooltip_border_color_light = '#CCCCCC';
	chart_font_color = cookie_jwd_adm_theme == 'dark' ? dark_color : light_color;
	chart_grid_color = cookie_jwd_adm_theme == 'dark' ? grid_color_dark : grid_color_light;
	tooltip_background_color = cookie_jwd_adm_theme == 'dark' ? tooltip_background_color_dark : tooltip_background_color_light;
	tooltip_border_color = cookie_jwd_adm_theme == 'dark' ? tooltip_border_color_dark : tooltip_border_color_light;
	
	var barChart = echarts.init(document.getElementById('bar-container'));
	var barChartOptions = {
		grid: {
			containLabel: true
		},
		title: {
			text: 'Data Penjualan ' + tahun_current,
			subtext: 'PT. Intertech Corporation',
			left: 'center',
			padding: 0,
			textStyle: {
				fontWeight: 'normal',
				color: chart_font_color
			},
			subtextStyle: {
				color: chart_font_color
			}
		},
		toolbox: {
			feature: {
				dataZoom: {
					yAxisIndex: 'none'
				},
				restore: {
					onclick: function () {
						alert();
					}
				},
				saveAsImage: {}
			},
			iconStyle: {
				borderColor: chart_font_color
			}
		},
		tooltip: {
			formatter: function(a) {  return a.name + '<hr style="margin:5px 0;padding:0;border: 0; height: 1px; background: #CCCCCC"/>' + a.marker + a.seriesName + ' <strong>Rp. ' + a.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '</strong>' },
			backgroundColor: tooltip_background_color,
			borderColor: tooltip_border_color,
			textStyle: {
				color: chart_font_color
			}
		},
		legend: {
			bottom: 30,
			data:['Penjualan', 'Pembelian'],
			textStyle: {
				color: chart_font_color
			}
		},
		 xAxis: {
			type: 'category',
			data: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
			axisLabel: {
				textStyle: {
					color: chart_font_color
				}
			}
		},
		yAxis: {
			type: 'value',
			name: 'Dalam Rupiah (Rp.)',
			nameRotate: 90,
			nameLocation: 'center',
			nameGap: 90,
			axisLabel : {
				formatter: function (value, index) {
					return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
				}, textStyle: {
					color: chart_font_color
				}
			},
			nameTextStyle: {
				color: chart_font_color
			},
			splitLine: {
				lineStyle: {
					color: chart_grid_color
				}
			}
		},
		series: [{
				name: 'Penjualan',
				data: penjualan_perbulan,
				type: 'bar'
			},
			{
				name: 'Pembelian',
				data: pembelian_perbulan,
				type: 'bar'
			}
		
		]
	};

	barChart.setOption(barChartOptions, true);
	
	/* PIE Chart */
	var pieChart = echarts.init(document.getElementById('pie-container'));
	var pieChartOptions = {
		title: {
			text: 'Barang Terjual ' + tahun_current,
			subtext: 'PT. Intertech Corporation',
			left: 'center',
			top: 0,
			textStyle: {
				fontWeight: 'normal',
				color: chart_font_color
			},
			subtextStyle: {
				color: chart_font_color
			}
		},
		toolbox: {
			feature: {
				dataZoom: {
					yAxisIndex: 'none'
				},
				restore: {
					onclick: function () {
						alert();
					}
				},
				saveAsImage: {}
			},
			iconStyle: {
				borderColor: chart_font_color
			}
		},
		tooltip: {
			trigger: 'item',
			backgroundColor: tooltip_background_color,
			borderColor: tooltip_border_color,
			textStyle: {
				color: chart_font_color
			}
		},
		legend: {
			orient: 'horizontal',
			top: 'bottom',
			left: 'center',
			textStyle: {
				color: chart_font_color
			}
		},
		series: [
			{
				name: 'Barang Terjual',
				type: 'pie',
				selectedMode: 'single',
				radius: '50%',
				center: ['50%', '45%'],
				label : {
					formatter: function (data) {
						return data.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ' (' + data.percent.toFixed(1) + '%)'
					},
					overflow: 'break',
					position: 'outside',
					textStyle: {
						color: chart_font_color
					}
				},
				data: item_terjual,
				emphasis: {
					itemStyle: {
						shadowBlur: 10,
						shadowOffsetX: 0,
						shadowColor: 'rgba(0, 0, 0, 0.5)'
					}
				}
			}
		]
	};
	
	pieChart.setOption(pieChartOptions, true);
	
	$('body').delegate('.nav-theme-option button', 'click', function() 
	{
		theme_value = $(this).attr('data-theme-value');
		chart_font_color = theme_value == 'dark' ? dark_color : light_color;
		chart_grid_color = theme_value == 'dark' ? grid_color_dark : grid_color_light;
		tooltip_background_color = theme_value == 'dark' ? tooltip_background_color_dark : tooltip_background_color_light;
		tooltip_border_color = theme_value == 'dark' ? tooltip_border_color_dark : tooltip_border_color_light;
				
		barChartOptions.title.textStyle.color = chart_font_color
		barChartOptions.title.subtextStyle.color = chart_font_color
		barChartOptions.legend.textStyle.color = chart_font_color
		barChartOptions.toolbox.iconStyle.borderColor = chart_font_color
		barChartOptions.tooltip.backgroundColor = tooltip_background_color
		barChartOptions.tooltip.borderColor = tooltip_border_color
		barChartOptions.xAxis.axisLabel.textStyle.color = chart_font_color
		barChartOptions.yAxis.axisLabel.textStyle.color = chart_font_color
		barChartOptions.yAxis.nameTextStyle.color = chart_font_color
		barChartOptions.yAxis.splitLine.lineStyle.color = chart_grid_color
		
		barChart.setOption(barChartOptions, true)
		
		pieChartOptions.title.textStyle.color = chart_font_color
		pieChartOptions.title.subtextStyle.color = chart_font_color
		pieChartOptions.tooltip.backgroundColor = tooltip_background_color
		pieChartOptions.tooltip.borderColor = tooltip_border_color
		pieChartOptions.tooltip.textStyle.color = chart_font_color
		pieChartOptions.toolbox.iconStyle.borderColor = chart_font_color
		pieChartOptions.legend.textStyle.color = chart_font_color
		pieChartOptions.series[0].label.textStyle.color = chart_font_color
		
		pieChart.setOption( pieChartOptions, true );
	});
})