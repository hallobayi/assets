jQuery(document).ready(function () 
{
	console.log(tabel);
	$('#nama-tabel').change(function(){
		$this = $(this);
		
		$a = $this.parents('form').eq(0).find('a');
		url = tabel[$this.val()].file_excel.url;
		display = tabel[$this.val()].file_excel.display;
		$a.attr('href', url).html(display);
		
	});
});