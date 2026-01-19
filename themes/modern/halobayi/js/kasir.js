$(document).ready(function() {

    var diskonKlinik = document.getElementById("diskonKlinik");
    var diskonDokter = document.getElementById("diskonDokter");

    // Format To Rupiah
    diskonKlinik.addEventListener("keyup", function(e) {
      diskonKlinik.value = formatRupiah(this.value, "Rp. ");
    });
    diskonDokter.addEventListener("keyup", function(e) {
        diskonDokter.value = formatRupiah(this.value, "Rp. ");
    });

    // Unformat
    diskonKlinik.addEventListener("keyup", function(e) {
        var repl = diskonKlinik.value.replace(/\Rp.|\./g,'');
        $("#diskonKlinikKalkulasi").val(repl);
    });
    diskonDokter.addEventListener("keyup", function(e) {
        var repl = diskonDokter.value.replace(/\Rp.|\./g,''); // source: https://stackoverflow.com/a/28593538
        $("#diskonDokterKalkulasi").val(repl);
    });

    $('.diskonKlinik').on('input',function(){
        var valTotal = parseFloat($("#diskonKlinikKalkulasi").val()) + parseFloat($("#diskonDokterKalkulasi").val());
        $("#totale").text(valTotal);
    });

    // source: https://jsfiddle.net/qjoqmgcm/
    // $(".diskonKlinik").keyup(function(){
    //     var repl1 = diskonKlinik.value.replace(/\Rp.|\./g, '');
    //     var repl2 = diskonDokter.value.replace(/\Rp.|\./g, ''); // source: https://stackoverflow.com/a/28593538
    //     var valTotal = parseFloat($("#diskonKlinikKalkulasi").val(repl1)) + parseFloat($("#diskonDokterKalkulasi").val(repl2));
    //     $("#totale").text(valTotal);
    // });

});

var tTotal = function(){
    var total = parseFloat($("#diskonKlinikKalkulasi").val()) + parseFloat($("#diskonDokterKalkulasi").val());
    $("#totale").text(total);
}

document.getElementById('diskonKlinikKalkulasi').onInput = function(){tTotal()}
document.getElementById('diskonDokterKalkulasi').onInput = function(){tTotal()}


/* Fungsi formatRupiah 
 * source: https://malasngoding.github.io/format-rupiah-javascript/
*/
function formatRupiah(angka, prefix){
	var number_string = angka.replace(/[^,\d]/g, '').toString(),
	split   		= number_string.split(','),
	sisa     		= split[0].length % 3,
	rupiah     		= split[0].substr(0, sisa),
	ribuan     		= split[0].substr(sisa).match(/\d{3}/gi);
 
	// tambahkan titik jika yang di input sudah menjadi angka ribuan
	if(ribuan){
		separator = sisa ? '.' : '';
		rupiah += separator + ribuan.join('.');
	}
 
	rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
	return prefix == undefined ? rupiah : (rupiah ? 'Rp. ' + rupiah : '');
}


function kembali() {
    window.location.href = ("https://sim.halobayi.co.id/admin/penjualan/index");
}

function kembalikasir() {
    window.location.href = ("https://sim.halobayi.co.id/k/home/index");
}

function tampildatatemppenjualan() {
    console.log('ah oh ah');
    // $.ajax({
    //     type: "post",
    //     url: "https://sim.halobayi.co.id/kasir/tampildatatemp",
    //     data: {
    //         jualfaktur: $('#faktur').val(),
    //         diskonmember: $('#diskonmember').val()
    //     },
    //     beforeSend: function() {
    //         $('.viewtampildetailtemp').html('<i class="fa fa-spin fa-spinner"></i> Tunggu').show();
    //     },
    //     success: function(response) {
    //         $('.viewtampildetailtemp').html(response).show();
    //         $('#kode').focus();
    //     },
    //     error: function(xhr, ajaxOptions, thrownError) {
    //         alert(xhr.status + "\n" + xhr.responseText + "\n" +
    //             thrownError);
    //     }
    // });
}
$(document).ready(function() {
    tampildatatemppenjualan();

    $('#kodemember').click(function(e) {
        e.preventDefault();
        $(this).prop('readonly', false);
    });
    $('#kodemember').keydown(function(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            let kodemember = $(this).val();

            console.log('detail member: ', e.keyCode)

            // $.ajax({
            //     type: "post",
            //     url: "https://sim.halobayi.co.id/kasir/detaildatamember",
            //     data: {
            //         kodemember: kodemember
            //     },
            //     dataType: "json",
            //     cache: false,
            //     success: function(response) {
            //         if (response.sukses) {
            //             $('#kodemember').prop('readonly', true);
            //             $('#namamember').val(response.sukses.namamember);
            //             $('#diskonmember').val(response.sukses.diskonmember);
            //             $('#tabunganmember').val(response.sukses.tabunganmember);
            //             tampildatatemppenjualan();
            //         }
            //         if (response.error) {
            //             $.toast({
            //                 heading: 'Maaf',
            //                 text: response.error,
            //                 showHideTransition: 'slide',
            //                 icon: 'error',
            //                 position: 'top-right'
            //             });
            //             $('#kodemember').val('');
            //             $('#namamember').val('');
            //         }
            //     },
            //     error: function(xhr, ajaxOptions, thrownError) {
            //         alert(xhr.status + "\n" + xhr.responseText + "\n" + thrownError);
            //     }
            // });
        }
    });

    $(this).keydown(function(e) {
        if (e.keyCode == 114) { //Press F3 cari Member

            console.log('Cari Member: ', e)
            // e.preventDefault();
            // $.ajax({
            //     url: "https://sim.halobayi.co.id/kasir/carimember",
            //     success: function(response) {
            //         $('.viewmodal').html(response).show();
            //         const element = document.querySelector('#modalcarimember');
            //         element.classList.add('animated', 'zoomIn');
            //         $('#modalcarimember').modal('show');
            //     },
            //     error: function(xhr, ajaxOptions, thrownError) {
            //         alert(xhr.status + "\n" + xhr.responseText + "\n" + thrownError);
            //     }
            // });
        }
    });

    $(this).keydown(function(e) {
        if (e.keyCode == 119) { //Press F8
            e.preventDefault();

            transaksipembayaran();
        }
    });

    $(this).keydown(function(e) {
        if (e.keyCode == 115) { // Press F4
            e.preventDefault();
            Swal.fire({
                title: `Batal Transaksi`,
                text: `Yakin membatalkan transaksi ?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya',
                cancelButtonText: 'Tidak'
            }).then((result) => {
                if (result.value) { console.log('Batal Transaksi: ', result)
                    // $.ajax({
                    //     type: "post",
                    //     url: "https://sim.halobayi.co.id/kasir/bataltransaksi",
                    //     data: {
                    //         faktur: $('#faktur').val()
                    //     },
                    //     dataType: "json",
                    //     success: function(response) {
                    //         if (response.sukses) {
                    //             Swal.fire({
                    //                 position: 'top-center',
                    //                 icon: 'success',
                    //                 title: response.sukses,
                    //                 showConfirmButton: false,
                    //                 timer: 1000,
                    //                 timerProgressBar: true,
                    //             }).then((result) => {
                    //                 window.location.reload();
                    //             })
                    //         } else {
                    //             $.toast({
                    //                 heading: 'Maaf',
                    //                 text: response.error,
                    //                 showHideTransition: 'slide',
                    //                 icon: 'error',
                    //                 position: 'top-right'
                    //             });
                    //         }

                    //     },
                    //     error: function(xhr, ajaxOptions, thrownError) {
                    //         alert(xhr.status + "\n" + xhr.responseText + "\n" +
                    //             thrownError);
                    //     }
                    // });
                }
            })
        }
    });

    //Holding Transaksi Press F9
    $(this).keydown(function(e) {
        if (e.keyCode == 120) {
            e.preventDefault();
            holdingtransaksi();
        }
    });

    // Menampilkan Transaksi di Tanan F10
    $(this).keydown(function(e) {
        if (e.keyCode == 121) { console.log('f10')
            // e.preventDefault();
            // $.ajax({
            //     url: "https://sim.halobayi.co.id/kasir/data-transaksi-ditahan",
            //     dataType: "json",
            //     success: function(response) {
            //         $('.viewmodaltransaksiditahan').html(response.data).show();
            //         $('#modaltransaksiditahan').modal('show');
            //     },
            //     error: function(xhr, ajaxOptions, thrownError) {
            //         alert(xhr.status + "\n" + xhr.responseText + "\n" + thrownError);
            //     }
            // });
        }
    });

    // Pembayaran dengan tabungan member CTRL+F7
    $(this).keydown(function(e) {
        if (e.ctrlKey && e.keyCode == 118) {
            e.preventDefault();
            let kodemember = $('#kodemember').val();
            let pembulatan = $('#pembulatan').autoNumeric('get');
            if (kodemember.length == 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Sorry !',
                    html: 'Maaf, silahkan pilih member terlebih dahulu'
                });
            } else {
                Swal.fire({
                    title: 'Pembayaran Menggunakan Tabungan Point',
                    text: "Yakin dilanjutkan ?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Ya',
                    cancelButtonText: 'Tidak',
                }).then((result) => {
                    if (result.value) { console.log('Pembayaran: ', result)
                        // $.ajax({
                        //     type: "post",
                        //     url: "https://sim.halobayi.co.id/kasir/pembayaranmember",
                        //     data: {
                        //         kodemember: kodemember,
                        //         pembulatan: pembulatan,
                        //         faktur: $('#faktur').val(),
                        //         kodemember: $('#kodemember').val(),
                        //         total_kotor: $('#total_kotor').val(),
                        //         total_bersih_semua: $('#total_bersih_semua').autoNumeric('get'),
                        //         dispersensemua: $('#dispersensemua').autoNumeric('get'),
                        //         disuangsemua: $('#disuangsemua').autoNumeric('get'),
                        //     },
                        //     dataType: "json",
                        //     success: function(response) {
                        //         if (response.sukses) {
                        //             Swal.fire({
                        //                 icon: 'success',
                        //                 title: 'Berhasil',
                        //                 html: response.sukses
                        //             }).then((result) => {
                        //                 if (result.value) {
                        //                     window.location.reload();
                        //                 }
                        //             });
                        //         } else {
                        //             Swal.fire({
                        //                 icon: 'error',
                        //                 title: 'Maaf',
                        //                 html: response.error
                        //             });
                        //         }

                        //     },
                        //     error: function(xhr, ajaxOptions, thrownError) {
                        //         alert(xhr.status + "\n" + xhr.responseText + "\n" +
                        //             thrownError);
                        //     }
                        // });
                    }
                })
            }
        }
    });

    $(this).keydown(function(e) {
        if (e.ctrlKey && e.keyCode == 68) {
            e.preventDefault();
            $('#dispersensemua').focus();
        }
    });
});

// Transaksi Pembayaran 
function transaksipembayaran() { alert('Transaksi Pembayaran')
    // $.ajax({
    //     type: "post",
    //     url: "https://sim.halobayi.co.id/kasir/pembayaran",
    //     data: {
    //         faktur: $('#faktur').val(),
    //         kodemember: $('#kodemember').val(),
    //         namamember: $('#namamember').val(),
    //         total_kotor: $('#total_kotor').val(),
    //         total_bersih_semua: $('#total_bersih_semua').autoNumeric('get'),
    //         pembulatan: $('#pembulatan').autoNumeric('get'),
    //         dispersensemua: $('#dispersensemua').autoNumeric('get'),
    //         disuangsemua: $('#disuangsemua').autoNumeric('get'),
    //     },
    //     dataType: "json",
    //     success: function(response) {
    //         if (response.sukses) {
    //             $('.viewmodalpembayaran').html(response.sukses).show();
    //             $('#modalpembayaran').on('shown.bs.modal', function(e) {
    //                 $('#jumlahuang').focus();
    //             });
    //             $('#modalpembayaran').modal('show');
    //         } else {
    //             $.toast({
    //                 heading: 'Maaf',
    //                 text: response.error,
    //                 showHideTransition: 'slide',
    //                 icon: 'error',
    //                 position: 'top-right'
    //             });
    //         }

    //     },
    //     error: function(xhr, ajaxOptions, thrownError) {
    //         alert(xhr.status + "\n" + xhr.responseText + "\n" + thrownError);
    //     }
    // });
}

// Holding Transaksi
function holdingtransaksi() {
    let faktur = $('#faktur').val();
    let kodemember = $('#kodemember').val();
    Swal.fire({
        title: 'Tahan Transaksi',
        text: `Yakin transaksi faktur ${faktur} di tahan ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya',
        cancelButtonText: 'Tidak'
    }).then((result) => {
        if (result.value) { console.log(result)
            // $.ajax({
            //     type: "post",
            //     url: "https://sim.halobayi.co.id/kasir/holdingtransaksi",
            //     data: {
            //         faktur: faktur,
            //         kodemember: kodemember,
            //         total_subtotal: $('#pembulatan').autoNumeric('get')
            //     },
            //     dataType: "json",
            //     success: function(response) {
            //         if (response.sukses) {
            //             Swal.fire({
            //                 icon: 'success',
            //                 title: 'Transaksi berhasil ditahan',
            //                 // text: 'Something went wrong!',
            //                 // footer: '<a href>Why do I have this issue?</a>'
            //             }).then((result) => {
            //                 window.location.reload();
            //             });
            //         } else {
            //             $.toast({
            //                 heading: 'Maaf',
            //                 text: response.error,
            //                 showHideTransition: 'slide',
            //                 icon: 'error',
            //                 position: 'top-center'
            //             });
            //         }
            //     }
            // });
        }
    })
}

window.setTimeout("waktu()", 1000);

function waktu() {
    var waktu = new Date();
    setTimeout("waktu()", 1000);
    document.getElementById("jam").innerHTML = waktu.getHours() +
        ` : `;
    document.getElementById("menit").innerHTML = waktu.getMinutes() +
        ` : `;
    document.getElementById("detik").innerHTML = waktu.getSeconds();
}