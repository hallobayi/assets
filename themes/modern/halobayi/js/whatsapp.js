const generateToken = (urlToken) => { console.log(urlToken)
    $.ajax({
    url: urlToken,
    dataType: "json",
    type: "GET",
    success: function(data) {
        if (data.status) {
            Swal.fire({
                title: "Good job!",
                text: data.pesan,
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

const startSession = (urlToken) => {
    $.ajax({
        url: urlToken,
        dataType: "json",
        type: "GET",
        success: function(data) { console.log(data.pesan)
            if (data.status && data.pesan.status === 'QRCODE' || data.pesan.status === 'INITIALIZING') {
                Swal.fire({
                    title: "Scan QR Code Diatas",
                    imageUrl: data.pesan.qrcode,
                    imageWidth: 200,
                    imageHeight: 200,
                    imageAlt: 'QR Code',
                    inputAttributes: {
                      autocapitalize: 'off'
                    },
                    showCancelButton: false,
                }).then((result) => { console.log(result)
                    location.reload();
                });
            }else{
                Swal.fire({
                    title: "Tolong Ulangi Kembali!",
                    showCancelButton: false,
                }).then((result) => { console.log(result)
                    location.reload();
                });
            }
        }
     });
}