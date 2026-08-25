/* Escape teks sebelum disuntikkan ke HTML (tabel & modal rencana datang) */
function escHtmlDk(val) {
	return $('<div>').text(val == null ? '' : val).html();
}

/* Warna irisan doughnut Sebaran Rencana Kembali */
var RENCANA_COLORS_DK = [
	'#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948',
	'#b07aa1', '#ff9da7', '#9c755f', '#bab0ac', '#86bcb6', '#f1ce63',
	'#d37295', '#a0cbe8', '#ffbe7d', '#8cd17d', '#b6992d', '#499894',
	'#fabfd2', '#79706e', '#d7b5a6', '#6b6ecf', '#b5cf6b', '#e7969c'
];

function fmtRibuan(val) {
	return (val == null ? 0 : val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

$(document).ready(function() {
	/* 1. Grafik Pie Pasien Lama & Baru */
	var ctxPie = document.getElementById('chart-pasien-lama-baru');
	if (ctxPie) {
		var pieChart = new Chart(ctxPie.getContext('2d'), {
			type: 'pie',
			data: {
				labels: ['Pasien Baru', 'Pasien Lama'],
				datasets: [{
					data: [dataPasienLamaBaru.baru || 0, dataPasienLamaBaru.lama || 0],
					backgroundColor: ['#36A2EB', '#FF6384'],
					hoverBackgroundColor: ['#288cd4', '#e6496b'],
					borderColor: '#FFFFFF',
					borderWidth: 2
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							padding: 15,
							usePointStyle: true,
							font: { size: 12 }
						}
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								var label = context.label || '';
								var value = context.parsed || 0;
								var total = context.dataset.data.reduce(function(a, b) { return a + b; }, 0);
								var percentage = total > 0 ? Math.round((value / total) * 100) : 0;
								return label + ': ' + fmtRibuan(value) + ' (' + percentage + '%)';
							}
						}
					}
				}
			}
		});

		function reloadPieChart() {
			var tahun  = $('#filter-pie-tahun').val();
			var cabang = $('#filter-pie-cabang').val();

			$.get(piePasienEndpoint + '?tahun=' + encodeURIComponent(tahun) + '&cabang=' + encodeURIComponent(cabang), function(resp) {
				var data = typeof resp === 'string' ? JSON.parse(resp) : resp;
				if (data) {
					pieChart.data.datasets[0].data = [data.baru || 0, data.lama || 0];
					pieChart.update();
					$('#total-pasien-baru').text(fmtRibuan(data.baru || 0));
					$('#total-pasien-lama').text(fmtRibuan(data.lama || 0));
				}
			});
		}

		$('#filter-pie-tahun, #filter-pie-cabang').on('change', function() {
			reloadPieChart();
		});
	}

	/* 2. Grafik Pendapatan Harian (Total Pendaftaran & Total Jasa Dokter) */
	var ctxBar = document.getElementById('chart-bar-perbandingan');
	if (ctxBar) {
		var barChart = new Chart(ctxBar.getContext('2d'), {
			type: 'bar',
			data: {
				labels: dataPendapatanHarian.labels || [],
				datasets: [
					{
						label: 'Total Pendaftaran',
						data: dataPendapatanHarian.count || [],
						backgroundColor: 'rgba(54, 162, 235, 0.65)',
						borderColor: 'rgb(54, 162, 235)',
						borderWidth: 1,
						borderRadius: 4,
						yAxisID: 'y',
						type: 'bar',
						order: 2
					},
					{
						label: 'Total Jasa Dokter (Rp)',
						data: dataPendapatanHarian.nilai || [],
						backgroundColor: 'rgba(255, 159, 64, 0.15)',
						borderColor: 'rgb(255, 159, 64)',
						borderWidth: 2,
						pointBackgroundColor: 'rgb(255, 159, 64)',
						pointRadius: 3,
						pointHoverRadius: 5,
						tension: 0.2,
						yAxisID: 'y1',
						type: 'line',
						order: 1
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index',
					intersect: false
				},
				scales: {
					x: {
						title: {
							display: true,
							text: 'Tanggal'
						},
						grid: {
							display: false
						}
					},
					y: {
						type: 'linear',
						display: true,
						position: 'left',
						beginAtZero: true,
						title: {
							display: true,
							text: 'Total Pendaftaran'
						},
						ticks: {
							precision: 0,
							callback: function(value) {
								return fmtRibuan(value);
							}
						}
					},
					y1: {
						type: 'linear',
						display: true,
						position: 'right',
						beginAtZero: true,
						title: {
							display: true,
							text: 'Total Jasa Dokter (Rp)'
						},
						grid: {
							drawOnChartArea: false
						},
						ticks: {
							callback: function(value) {
								return 'Rp ' + fmtRibuan(value);
							}
						}
					}
				},
				plugins: {
					legend: {
						position: 'top',
						labels: {
							usePointStyle: true,
							padding: 15
						}
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								var label = context.dataset.label || '';
								var value = context.parsed.y || 0;
								if (context.datasetIndex === 1) {
									return label + ': Rp ' + fmtRibuan(value);
								}
								return label + ': ' + fmtRibuan(value) + ' Pasien';
							}
						}
					}
				}
			}
		});

		function reloadBarChart() {
			var tahun  = $('#filter-bar-tahun').val();
			var bulan  = $('#filter-bar-bulan').val();
			var cabang = $('#filter-bar-cabang').val();

			$.get(harianEndpoint + '?tahun=' + encodeURIComponent(tahun) + '&bulan=' + encodeURIComponent(bulan) + '&cabang=' + encodeURIComponent(cabang), function(resp) {
				var data = typeof resp === 'string' ? JSON.parse(resp) : resp;
				if (data) {
					barChart.data.labels = data.labels || [];
					barChart.data.datasets[0].data = data.count || [];
					barChart.data.datasets[1].data = data.nilai || [];
					barChart.update();
				}
			});
		}

		$('#filter-bar-tahun, #filter-bar-bulan, #filter-bar-cabang').on('change', function() {
			reloadBarChart();
		});
	}

	/* 3. Tabel Rencana Datang (DataTables)
	      Isi tabel: rencana kontrol dari rme_soap.json_plan (plan|tgl_datang_kembali),
	      sudah dibatasi pada pendaftaran dokter yang sedang login oleh controller.
	      Tanggal tampil dd-mm-yyyy, jadi urutannya perlu tipe sendiri supaya tidak
	      diurutkan sebagai teks biasa. */
	$.fn.dataTable.ext.type.order['tgl-dk-pre'] = function(d) {
		var m = String(d).match(/^(\d{2})-(\d{2})-(\d{4})$/);
		return m ? Number(m[3] + m[2] + m[1]) : 0;
	};

	var rencanaDt = null;
	if ($('#tabel-rencana-datang').length) {
		rencanaDt = $('#tabel-rencana-datang').DataTable({
			order: [],
			columnDefs: [
				{ targets: [0], orderable: false },
				{ targets: [3], type: 'tgl-dk' }
			],
			pageLength: 5,
			lengthChange: false,
			searching: true,
			info: false,
			language: {
				search: '',
				searchPlaceholder: 'Cari pasien...',
				emptyTable: 'Belum ada rencana datang kembali',
				zeroRecords: 'Data tidak ditemukan',
				paginate: { previous: '&laquo;', next: '&raquo;' }
			}
		});

		/* Nomor urut kolom pertama, ikut urutan & pencarian yang sedang aktif */
		rencanaDt.on('order.dt search.dt', function() {
			rencanaDt.column(0, { search: 'applied', order: 'applied' })
				.nodes()
				.each(function(cell, i) {
					cell.innerHTML = i + 1;
				});
		}).draw();

		function reloadRencanaDatang() {
			var tahun  = $('#filter-rencana-tahun').val();
			var cabang = $('#filter-rencana-cabang').val();

			$.get(rencanaDatangEndpoint + '?jenis=list&tahun=' + encodeURIComponent(tahun) + '&cabang=' + encodeURIComponent(cabang), function(resp) {
				var data = typeof resp === 'string' ? JSON.parse(resp) : resp;
				rencanaDt.clear();
				(data || []).forEach(function(item) {
					rencanaDt.row.add([
						'',
						escHtmlDk(item.nama_pasien),
						escHtmlDk(item.nomor_rm),
						escHtmlDk(item.tgl_kembali_label)
					]);
				});
				rencanaDt.draw();
			});
		}

		$('#filter-rencana-tahun, #filter-rencana-cabang').on('change', function() {
			reloadRencanaDatang();
		});
	}

	/* 4. Grafik Doughnut Sebaran Rencana Kembali (per bulan & minggu).
	      Klik satu irisan -> daftar pasien pada periode tersebut. */
	var ctxSebaran = document.getElementById('chart-sebaran-rencana');
	if (ctxSebaran) {
		var sebaranItems = Array.isArray(dataRencanaBulan) ? dataRencanaBulan : [];

		function sebaranLabels(list) {
			return list.map(function(r) { return r.label || '-'; });
		}
		function sebaranData(list) {
			return list.map(function(r) { return Number(r.total) || 0; });
		}
		function sebaranColors(list) {
			return list.map(function(_, i) {
				return RENCANA_COLORS_DK[i % RENCANA_COLORS_DK.length];
			});
		}

		function tampilkanDetailRencana(item) {
			if (!item) return;

			var tahun  = $('#filter-sebaran-tahun').val();
			var cabang = $('#filter-sebaran-cabang').val();
			var $dialog = bootbox.dialog({
				title: 'Rencana Datang Kembali - ' + escHtmlDk(item.label),
				message: '<div class="text-center py-3"><div class="spinner-border spinner-border-sm"></div></div>',
				size: 'large',
				buttons: {
					cancel: { label: 'Tutup', className: 'btn-secondary' }
				}
			});

			$.get(rencanaDatangEndpoint + '?jenis=periode&periode=' + encodeURIComponent(item.periode) +
				'&tahun=' + encodeURIComponent(tahun) + '&cabang=' + encodeURIComponent(cabang), function(resp) {
				var data = typeof resp === 'string' ? JSON.parse(resp) : resp;
				var list = Array.isArray(data) ? data : [];
				var html = '';

				if (!list.length) {
					html = '<div class="alert alert-warning mb-0">Data tidak ditemukan</div>';
				} else {
					html = '<div class="table-responsive"><table class="table table-sm table-hover mb-0">' +
						'<thead><tr><th>No</th><th>Tgl. Kembali</th><th>Nama Pasien</th>' +
						'<th>No. RM</th><th>No. Reg</th></tr></thead><tbody>';
					list.forEach(function(r, i) {
						html += '<tr><td>' + (i + 1) + '</td>' +
							'<td>' + escHtmlDk(r.tgl_kembali_label) + '</td>' +
							'<td>' + escHtmlDk(r.nama_pasien) + '</td>' +
							'<td>' + escHtmlDk(r.nomor_rm) + '</td>' +
							'<td>' + escHtmlDk(r.no_reg) + '</td></tr>';
					});
					html += '</tbody></table></div>' +
						'<p class="text-muted mt-2 mb-0">Total ' + fmtRibuan(list.length) + ' rencana kontrol.</p>';
				}

				$dialog.find('.bootbox-body').html(html);
			}).fail(function() {
				$dialog.find('.bootbox-body').html('<div class="alert alert-danger mb-0">Gagal mengambil data</div>');
			});
		}

		var sebaranChart = new Chart(ctxSebaran.getContext('2d'), {
			type: 'doughnut',
			data: {
				labels: sebaranLabels(sebaranItems),
				datasets: [{
					data: sebaranData(sebaranItems),
					backgroundColor: sebaranColors(sebaranItems),
					borderColor: '#FFFFFF',
					borderWidth: 1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: '55%',
				onClick: function(evt, elements) {
					if (!elements.length) return;
					tampilkanDetailRencana(sebaranItems[elements[0].index]);
				},
				onHover: function(evt, elements) {
					if (!evt.native || !evt.native.target) return;
					evt.native.target.style.cursor = elements.length ? 'pointer' : 'default';
				},
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							padding: 8,
							boxWidth: 12,
							font: { size: 11 }
						}
					},
					tooltip: {
						callbacks: {
							label: function(ctx) {
								var total = ctx.dataset.data.reduce(function(a, b) { return a + b; }, 0);
								var persen = total ? Math.round((ctx.parsed / total) * 100) : 0;
								return ctx.label + ': ' + fmtRibuan(ctx.parsed) + ' (' + persen + '%)';
							}
						}
					}
				}
			}
		});

		function reloadSebaranRencana() {
			var tahun  = $('#filter-sebaran-tahun').val();
			var cabang = $('#filter-sebaran-cabang').val();

			$.get(rencanaDatangEndpoint + '?jenis=bulan&tahun=' + encodeURIComponent(tahun) + '&cabang=' + encodeURIComponent(cabang), function(resp) {
				var data = typeof resp === 'string' ? JSON.parse(resp) : resp;
				sebaranItems = Array.isArray(data) ? data : [];
				sebaranChart.data.labels = sebaranLabels(sebaranItems);
				sebaranChart.data.datasets[0].data = sebaranData(sebaranItems);
				sebaranChart.data.datasets[0].backgroundColor = sebaranColors(sebaranItems);
				sebaranChart.update();
			});
		}

		$('#filter-sebaran-tahun, #filter-sebaran-cabang').on('change', function() {
			reloadSebaranRencana();
		});
	}
});
