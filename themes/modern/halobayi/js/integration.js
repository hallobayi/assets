const getPractioner = (urlToken) => { //console.log(urlToken)
    $.ajax({
    url: urlToken,
    dataType: "json",
    type: "GET",
    success: function(data) { console.log(data)
        if (data.status === 'success') {
            Swal.fire({
                title: "Berhasil Update Nomor IHS!",
                text: data.pesan,
                icon: "success"
            }).then((result) => { console.log(result)
                location.reload();
            });
        }else{
            console.log('gagal coy')
        }
    }
 });
}

const createOrg = (urlToken) => { //console.log(urlToken)
    $.ajax({
    url: urlToken,
    dataType: "json",
    type: "GET",
    success: function(data) { //console.log(data)
        if (data.status === 'success') {
            Swal.fire({
                title: "Berhasil Update Organisasi",
                text: data.pesan,
                icon: "success"
            }).then((result) => { console.log(result)
                location.reload();
            });
        }else{
            console.log('gagal coy')
        }
    }
 });
}

const createLocation = (urlToken) => { //console.log(urlToken)
    $.ajax({
    url: urlToken,
    dataType: "json",
    type: "GET",
    success: function(data) { //console.log(data)
        if (data.status === 'success') {
            Swal.fire({
                title: "Berhasil Update Lokasi",
                text: data.pesan,
                icon: "success"
            }).then((result) => { console.log(result)
                location.reload();
            });
        }else{
            console.log('gagal coy')
        }
    }
 });
}