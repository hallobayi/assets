$(document).ready(function() {	
	
	$('body').delegate('.kirim-email', 'click', function(e){
		e.preventDefault();
		$this = $(this)
		email = $this.attr('data-email');
		id = $this.attr('data-id');

		$swal =  Swal.fire({
			title: 'Memproses kartu',
			text: 'Mohon sabar menunggu...',
			showConfirmButton: false,
			allowOutsideClick: false,
			didOpen: function () {
			  	Swal.showLoading();
			},
			didClose () {
				Swal.hideLoading()
			},
		});

		url = module_url + "/pdf?id=" + id;

		$.ajax({
			type: "POST",
			url: url,
			data: 'email=' + email,
			dataType: "JSON",
			success: function(data) {
				className = data.status == 'ok' ? 'success' : 'error';
				title = data.status == 'ok' ? 'Sukses !!!' : 'Error !!!';
				$swal.close();
				console.log(className);
				Swal.fire({
					text: data.message,
					title: title,
					icon: className,
					showCloseButton: true,
					confirmButtonText: 'OK'
				})
			}, error: function (xhr) {
				console.log(xhr);
			}
			
		});


	})
})