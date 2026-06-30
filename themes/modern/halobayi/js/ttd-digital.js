// OPEN TTD DIGITAL
jQuery(document).ready(function() {
    var idFrm = $('.openSignature').attr('data-id');
    var frmTtd = $('.openSignature');
    frmTtd.click(function (e) { console.log(idFrm)
        e.preventDefault();

        var $signature = null; // referensi pad jSignature yang aktif (untuk reset)

        var $bootbox = bootbox.dialog({
            title: 'Tambah Tanda Tangan Digital',
            message: '<div class="text-center text-secondary"><div class="spinner-border"></div></div>',
            buttons: {
                cancel: {
                    label: 'Cancel'
                },
                reset: {
                    label: "Reset TTD",
                    className: "btn-danger",
                    callback: function() {
                        if ($signature && $signature.length) {
                            $signature.jSignature('reset');
                            $bootbox.find('#hiddenSigData').val('');
                            $bootbox.find('.submitTtd').prop('disabled', true);
                        }
                        return false;
                    }
                },
                success: {
                    label: 'Submit',
                    className: 'btn-success submitTtd',
                    callback: function() {
                        $bootbox.find('.alert').remove();
                        $button_submit.prepend('<i class="fas fa-circle-notch fa-spin me-2 fa-lg"></i>');
                        $button.prop('disabled', true);

                        // Submit Tanda Tangan Digitall
                        form = $bootbox.find('form')[0];
                        $.ajax({
                            type: 'POST',
                            url: base_url+'signature/ajaxUpdateTtd?unik_id='+idFrm,
                            data: new FormData(form),
                            processData: false,
                            contentType: false,
                            dataType: 'json',
                            success: function(data) {

                                $bootbox.modal('hide');
                                if (data.status == 'ok') {
                                    const Toast = Swal.mixin({
                                        toast: true,
                                        position: 'top-end',
                                        showConfirmButton: false,
                                        timer: 2500,
                                        timerProgressBar: true,
                                        iconColor: 'white',
                                        customClass: {
                                            popup: 'bg-success text-light toast p-2'
                                        },
                                        didOpen: (toast) => {
                                            toast.addEventListener('mouseenter', Swal.stopTimer)
                                            toast.addEventListener('mouseleave', Swal.resumeTimer)
                                        }
                                    })
                                    Toast.fire({
                                        html: '<div class="toast-content"><i class="far fa-check-circle me-2"></i> Data berhasil disimpan</div>'
                                    })

                                    dataTables.draw();

                                } else {
                                    show_alert('Error !!!', data.message, 'error');
                                }
                            },
                            error: function(xhr) {
                                show_alert('Error !!!', xhr.responseText, 'error');
                                console.log(xhr.responseText);
                            }
                        })
                        return false;
                    }
                }
            }
        });

        $bootbox.find('.modal-dialog').css('max-width', '700px');
        var $button = $bootbox.find('button').prop('disabled', true);
        var $button_submit = $bootbox.find('button.submitTtd');

        $.get(base_url+'signature/ajaxFormTambahTtd?unik_id='+idFrm, function(html) {
            $button.prop('disabled', false);
            $bootbox.find('.modal-body').empty().append(html);

            // Submit dikunci sampai user menekan "Lock TTD"
            $bootbox.find('.submitTtd').prop('disabled', true);

            // Inisialisasi pad tanda tangan secara EKSPLISIT di sini.
            // (Root-cause fix: tidak mengandalkan <script> inline pada fragment
            //  AJAX, yang bisa di-strip/ditunda Cloudflare Rocket Loader /
            //  Auto-Minify sehingga TTD tidak aktif di production.)
            initSignaturePad();
        });

        // Inisialisasi jSignature pada modal yang sudah tampil.
        function initSignaturePad() {
            var $sig = $bootbox.find('#signature');
            if (!$sig.length) return;

            if (typeof $.fn.jSignature !== 'function') {
                console.error('TTD: library jSignature belum dimuat. ' +
                    'Cek tab Network apakah jSignature.min.noconflict.js ter-load, ' +
                    'dan pastikan tidak diblokir Cloudflare Rocket Loader / Auto-Minify.');
                show_alert('Error', 'Komponen tanda tangan gagal dimuat. Silakan muat ulang halaman.', 'error');
                return;
            }

            // jSignature butuh container yang sudah tampil dan punya lebar nyata.
            // Jika di-init saat lebar 0px (modal masih beranimasi), canvas tidak
            // bisa digambar. Tunggu sampai container benar-benar terlihat.
            var attempts = 0;
            (function whenVisible() {
                if ($sig.is(':visible') && $sig.outerWidth() > 0) {
                    $sig.empty(); // bersihkan jika ada sisa init sebelumnya

                    // Ukuran canvas mengikuti lebar container yang sebenarnya,
                    // sehingga koordinat gambar akurat (memperbaiki bug "tidak
                    // bisa digambar / meleset" akibat canvas di-stretch via CSS).
                    var w = Math.floor($sig.width()) || 300;
                    $sig.jSignature({ width: w + 'px', height: '220px' });
                    $signature = $sig;

                    // Tombol "#1. Lock TTD": kunci & simpan data TTD ke hidden input
                    $bootbox.find('#btnSave').off('click').on('click', function () {
                        var sigData = $sig.jSignature('getData', 'base30');
                        $bootbox.find('#hiddenSigData').val(sigData);
                        $bootbox.find('.submitTtd').prop('disabled', false);
                        console.log('jSignature: tanda tangan terkunci');
                    });
                } else if (attempts++ < 20) {
                    setTimeout(whenVisible, 50);
                } else {
                    console.error('TTD: container #signature tidak pernah tampil / lebar 0px.');
                }
            })();
        }

    });

    // ON TODO:
    var viewFrmTtd = $('.viewSignature');
    viewFrmTtd.click(function (e) {
        alert('dalam pengembangan');
    })
});
