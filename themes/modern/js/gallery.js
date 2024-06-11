 $(document).ready(function() {
	 	 
	 if ($('.tinymce').length > 0) {
		 tinymce.init({
			selector: '.tinymce',
			plugins: 'advlist lists link',
			toolbar: 'styleselect | bold italic underline strikethrough | forecolor | numlist bullist',
			branding: false,
			statusbar: false,
			menubar: false
		}).then(function(editors) {
			if ($('html').attr('data-bs-theme') == 'dark') {
				 $iframe = $('.card-body').find('iframe');
				$iframe_content = $iframe.contents();
				$iframe_content.find('#theme-style').remove();
				$iframe_content.find("head").append('<style id="theme-style">body{color: #adb5bd}</style>');  
			}
		});
	 }
	 
	 $('.btn-delete-kategori').click(function() {
		var $this = $(this);
		bootbox.confirm({
			title: 'Hapus Kategori',
			message: $this.attr('data-delete-title'),
			callback: function(confirmed) {
				if (confirmed) {
					$this.attr('disabled', 'disabled');
					$kategori_container = $this.parents('.kategori-container').eq(0);
					dragKategori.destroy();
					$.ajax({
						type : 'post',
						url : base_url + '/gallery/ajaxKategoriDelete',
						data : 'submit=submit&delete=delete&id=' + $this.parents('.kategori-container').eq(0).attr('id').split('-')[1],
						dataType : 'JSON',
						success : function(data) 
						{
							$this.removeAttr('disabled');
							initDragKategori();
							if (data.status == 'error') {
								show_alert('Error !!!', data.message, 'error');
							} else {
								$kategori_container.fadeOut('fast', function() { $(this).remove() });
							}
						}, error : function (xhr) {
							$this.removeAttr('disabled');
							show_alert('Ajax Error !!!', xhr.responseJSON.message + '<br/><strong>Note</strong>: Detail error ada di console browser', 'error');
							console.log(xhr);
						}
					})
				}
			}
		});
		return;
	 });
	 
	 $('.gallery-container').delegate('.thumbnail-item', 'click', function() {
		 id_image = $(this).attr('data-id-file-picker');

		 jwdfilepicker.init({
			title : 'Edit Image',
			id_file : id_image,
			onSelect: function ($elm) {
				$this.find('.text').hide();
				$this.find('img').remove();
				
				$clone = $ul.find('li').eq(0).clone();
				$clone.find('img').replaceWith($elm.find('img'));
				$ul.append($clone);
			}
		});
	 });
	 
	 $('#add-image').click(function() 
	 {
		var $this = $(this);
		var $ul = $('.gallery-container').find('ul').eq(0);
		var $gallery_container = $('.gallery-container');
		jwdfilepicker.init({
			title : 'Gallery Image',
			filter_file : 'image',
			onSelect: function ($elm) {
				$this.find('.text').hide();
				$this.find('img').remove();
				meta_file = JSON.parse($elm.find('.meta-file').html());
												
				$.ajax({
					type : 'post',
					url	: base_url + 'gallery/ajaxGalleryAddImage',
					data : 'submit=submit&id_gallery_kategori=' + $('#list-kategori').val() + '&id_file_picker=' + meta_file.id_file_picker,
					dataType : 'JSON',
					success : function(data) {
						if (data.status == 'error') {
							show_alert('Error !!!', data.message, 'error');
						} else {
							
							// File Browser
							var $ul = $('.list-image-container');
							var $li_first = $ul.find('li').eq(0);
							var $li = $li_first.clone().hide();
								$li.removeAttr('data-initial-item');
							// var $img_cont = $li.find('.img-container');
							
							if ($li_first.attr('data-initial-item') == 'true') {
								$li_first.remove();
							}
							
							$gallery_container.find('.alert-danger').remove();
							
							$li.attr('id', 'gallery-' + data['id_gallery']);
							// $li.find('input[name="urut[]"]').val(data['id_gallery']);
							
							$new_img = $elm.find('img');
							// $img_cont.find('img').attr('src', parsedResponse.file_info['thumbnail']['url']);
							$li.find('img').replaceWith($new_img);
							// $img_cont.find('.meta-file').html(JSON.stringify(parsedResponse.file_info));
							$ul.prepend($li);
							$li.fadeIn('fast');
							
						/* 	$new_img = $elm.find('img').attr('data-id-file-picker', meta_file.id_file_picker)
							$clone = $ul.find('li').eq(0).clone().hide();
							$clone.find('img').replaceWith($new_img);
							$ul.append($clone);
							$clone.fadeIn('fast'); */
						}
					}, error : function (xhr) {
						show_alert('Ajax Error !!!', xhr.responseJSON.message + '<br/><strong>Note</strong>: Detail error ada di console browser', 'error');
						console.log(xhr);
					}
				});
			}
		});
	});
	
	function show_message(type, content) {
		return '<div class="alert alert-danger">' + content + '</div>'; 
	}
	
	$('.gallery-container').delegate('.change-category', 'click', function(e) {
		e.stopPropagation();
		$select = $('#list-kategori').clone();
		$select.attr('id', 'new-category');
		id = $(this).parents('.thumbnail-item').eq(0).attr('id').split('-')[1];
		bootbox.dialog({
			title: 'Ganti Kategori',
			message: 'Pindahkan image ke kategori berikut: ' + $select[0].outerHTML + '<input type="hidden" name="id" value="' + id + '">',
			buttons: {
				cancel: {
					label: 'Close',
					className: 'btn-secondary'
				}
			}
		});
		
	})
	
	$('body').delegate('#new-category', 'change', function() {
		
		var $this = $(this);
		$loader = $('<div class="spinner-border spinner-border-sm" style="position: absolute;right: 30px;bottom: 25px;"></div>').insertAfter($this);
		
		$.ajax({
			type : 'post',
			url	: base_url + 'gallery/ajaxGalleryChangeImageCategory',
			data : 'submit=submit&id_gallery_kategori=' + $this.val() + '&id=' + $this.parent().find('input[name="id"]').val(),
			dataType : 'JSON',
			success : function(data) {
				$loader.remove();
				
				if (data.status == 'error') {
					show_alert('Error !!!', data.message, 'error');
				} else {
					id_gallery = $this.next().val();
					$('#gallery-' + id_gallery).fadeIn('fast', function() {
						$(this).remove();
					});
				}
			}, error : function (xhr) {
				$loader.remove();
				show_alert('Ajax Error !!!', xhr.responseJSON.message + '<br/><strong>Note</strong>: Detail error ada di console browser', 'error');
				console.log(xhr);
			}
		});
	});
	
	$('.gallery-container').delegate('.delete-image', 'click', function(e) {
		e.stopPropagation();
		$this = $(this);
		$.ajax({
			type : 'post',
			url : base_url + 'gallery/ajaxGalleryDeleteImage',
			data : 'submit=submit&id=' + $this.parents('.thumbnail-item').eq(0).attr('id').split('-')[1],
			dataType : 'JSON',
			success : function(data) {
				if (data.status == 'error') {
					show_alert('Error !!!', data.message, 'error');
				} else {
					$this.parents('.thumbnail-item').eq(0).fadeOut('fast', function(){
						if ($(this).parent().children().length == 1) {
							$(this).attr('data-initial-item', 'true');
							$('.gallery-container').prepend(show_message('error', 'Gallery tidak ditemukan'));
						} else {
							$(this).remove();
						}
					});
				}
			}, error : function (xhr) {
				show_alert('Ajax Error !!!', xhr.responseJSON.message + '<br/><strong>Note</strong>: Detail error ada di console browser', 'error');
				console.log(xhr);
			}
			
		})
		
	})
	 
	 $('#list-kategori').change(function(){
		$(this).parents('form').eq(0).submit(); 
	 })
	 
	drag_image_gallery = dragula([document.getElementById('list-image-container')], {
		moves: function (el, container, handle) {
			return handle.classList.contains('grip') || handle.parentNode.classList.contains('grip');
		}
	});
	
	drag_image_gallery.on('dragend', function(el)
	{	
		$li = $('.gallery-container').find('li.thumbnail-item');
		
		list_id = [];
		$li.each(function(i, elm){
			list_id.push( $(elm).attr('id').split('-')[1] );
		});
		
		urut = JSON.stringify(list_id);		
		$.ajax({
			type : 'post',
			url : base_url + 'gallery/ajaxGalleryChangeImageOrder',
			data : 'submit=submit&urut=' + urut,
			dataType : 'JSON',
			success : function(data) {
				if (data.status == 'error') {
					show_alert('Error !!!', data.message, 'error');
				}
			}, error : function (xhr) {
				show_alert('Ajax Error !!!', xhr.responseJSON.message + '<br/><strong>Note</strong>: Detail error ada di console browser', 'error');
				console.log(xhr);
			}
		})
	});
	
	/* drake = dragula([document.getElementById('accordion-left'), document.getElementById('accordion-right')], {
		moves: function (el, container, handle) {
			return handle.classList.contains('grip-handler') || handle.parentNode.classList.contains('grip-handler');
		}
	});
	 */
	 dragKategori = null;
	 
	 function initDragKategori() {
		dragKategori = dragula([document.getElementById('active-panel'), document.getElementById('inactive-panel')], {
			moves: function (el, container, handle) {
				return handle.classList.contains('grip-handler') || handle.parentNode.classList.contains('grip-handler');
			}
		});
		
		dragKategori.on('dragend', function(el)
		{		
			var $el = $(el);
			var aktif = 'Y';
			
			if ($el.parents('.inactive-panel').length > 0) {
				aktif = 'N';
			}
			
			id = $el.attr('id').split('-')[1];
			$input_urut = $('.container-panel').find('input[name="urut[]"]');
			
			list_id = [];
			$input_urut.each(function(i, elm){
				list_id.push( $(elm).val() );
			});
			
			urut = JSON.stringify(list_id);
			$.ajax({
				type : 'post',
				url : base_url + '/gallery/ajaxUpdateKategoriSort',
				data : 'submit=submit&id=' + id + '&param[aktif]=' + aktif + '&urut=' + urut,
				dataType : 'JSON',
				success : function(data) {
					if (data.status == 'error') {
						show_alert('Error !!!', data.message, 'error');
					}
				}, error : function (xhr) {
					show_alert('Ajax Error !!!', xhr.responseJSON.message + '<br/><strong>Note</strong>: Detail error ada di console browser', 'error');
					console.log(xhr);
				}
				
			})
		});
	 }
	
	initDragKategori();
	
 });