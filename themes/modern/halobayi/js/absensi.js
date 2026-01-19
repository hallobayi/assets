const validasiAbsensi = (urlToken) => { console.log(urlToken)
    $.ajax({
    url: urlToken,
    dataType: "json",
    type: "GET",
    success: function(data) { //console.log(data)
        if (data.status === 'ok') {
            Swal.fire({
                title: "Berhasil Diverifikasi!",
                text: data.message,
                icon: "success"
            }).then((result) => {
                location.reload();
            });
        }else{
            console.log('gagal coy')
        }
    }
 });
}