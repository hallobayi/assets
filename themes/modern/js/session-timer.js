/**
 * SIMHAI Session 24-Hour Expiration & Swal2 Re-Login Monitor
 * Memantau durasi sesi login 24 jam dan menampilkan popup Swal2 login ulang saat kedaluwarsa.
 */
(function () {
    'use strict';

    if (!window.SIMHAI_SESSION || !window.SIMHAI_SESSION.isLoggedIn) {
        return;
    }

    var config = window.SIMHAI_SESSION;
    var isPopupOpen = false;
    var checkInterval = null;

    /**
     * Tampilkan popup login Swal2 ketika sesi 24 jam habis
     */
    function showSessionExpiredModal(customMessage) {
        if (isPopupOpen) {
            return;
        }

        // Pastikan Swal sudah dimuat
        if (typeof Swal === 'undefined') {
            window.location.href = config.loginUrl + '?expired=1';
            return;
        }

        isPopupOpen = true;

        var messageText = customMessage || 'Sesi login Anda telah habis karena telah melewati <strong>24 jam</strong>. Silakan masukkan password untuk melanjutkan tanpa kehilangan pekerjaan Anda:';

        Swal.fire({
            title: '<span style="font-size: 1.25rem; font-weight: 700; color: #b02a37;"><i class="bi bi-clock-history me-2"></i>Sesi Login Berakhir (24 Jam)</span>',
            html: `
                <div class="text-start" style="font-size: 0.92rem;">
                    <div class="alert alert-warning py-2 px-3 mb-3" style="font-size: 0.88rem;">
                        ${messageText}
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small text-secondary mb-1">Username / NIK</label>
                        <div class="input-group">
                            <span class="input-group-text bg-light"><i class="bi bi-person text-muted"></i></span>
                            <input type="text" id="swal_username" class="form-control" value="${config.username || ''}" readonly style="background-color: #f8f9fa;">
                        </div>
                    </div>
                    <div class="mb-2">
                        <label class="form-label fw-semibold small text-secondary mb-1">Password</label>
                        <div class="input-group">
                            <span class="input-group-text bg-light"><i class="bi bi-lock text-muted"></i></span>
                            <input type="password" id="swal_password" class="form-control" placeholder="Masukkan password Anda" autocomplete="current-password">
                        </div>
                    </div>
                </div>
            `,
            icon: 'warning',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-box-arrow-in-right me-1"></i> Login Ulang',
            cancelButtonText: '<i class="bi bi-box-arrow-left me-1"></i> Ke Halaman Login',
            confirmButtonColor: '#0d6efd',
            cancelButtonColor: '#6c757d',
            focusConfirm: false,
            didOpen: function () {
                var pwd = document.getElementById('swal_password');
                if (pwd) {
                    pwd.focus();
                    pwd.addEventListener('keyup', function (e) {
                        if (e.key === 'Enter') {
                            Swal.clickConfirm();
                        }
                    });
                }
            },
            preConfirm: function () {
                var username = (document.getElementById('swal_username').value || '').trim();
                var password = document.getElementById('swal_password').value;

                if (!username) {
                    Swal.showValidationMessage('Username tidak ditemukan. Silakan ke halaman login.');
                    return false;
                }
                if (!password) {
                    Swal.showValidationMessage('Password wajib diisi!');
                    return false;
                }

                var params = new URLSearchParams();
                params.append('username', username);
                params.append('password', password);
                if (config.csrfName && config.csrfHash) {
                    params.append(config.csrfName, config.csrfHash);
                }

                return fetch(config.ajaxLoginUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: params.toString()
                })
                .then(function (response) {
                    return response.json();
                })
                .then(function (res) {
                    if (!res || res.status !== 'ok') {
                        throw new Error((res && res.message) ? res.message : 'Login gagal. Periksa kembali password Anda.');
                    }
                    return res;
                })
                .catch(function (error) {
                    Swal.showValidationMessage(error.message || 'Terjadi kesalahan koneksi saat login ulang.');
                });
            }
        }).then(function (result) {
            isPopupOpen = false;

            if (result.isConfirmed && result.value && result.value.status === 'ok') {
                // Perbarui data sesi di JS client
                config.expiresAt = result.value.expires_at;
                config.remainingSeconds = result.value.remaining_seconds;
                if (result.value.csrf_hash) {
                    config.csrfHash = result.value.csrf_hash;
                    // Perbarui form hidden token jika ada
                    var csrfInputs = document.querySelectorAll('input[name="' + config.csrfName + '"]');
                    csrfInputs.forEach(function (inp) {
                        inp.value = result.value.csrf_hash;
                    });
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Login Berhasil!',
                    text: 'Sesi login diperpanjang untuk 24 jam ke depan.',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                window.location.href = config.loginUrl + '?expired=1';
            }
        });
    }

    // Expose ke global agar bisa dipanggil secara manual jika dibutuhkan
    window.simhaiShowSessionExpiredPopup = showSessionExpiredModal;

    /**
     * Cek waktu kedaluwarsa sesi secara periodik
     */
    function checkExpiration() {
        var now = Math.floor(Date.now() / 1000);
        if (now >= config.expiresAt) {
            showSessionExpiredModal();
        }
    }

    // Jalankan pengecekan setiap 10 detik
    checkInterval = setInterval(checkExpiration, 10000);

    // Cek saat tab browser aktif kembali setelah diminimalkan / sleep
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
            checkExpiration();
        }
    });

    // Intercept AJAX Error 401 (Unauthorized / Session Expired) via jQuery
    if (window.jQuery) {
        window.jQuery(document).ajaxError(function (event, jqXHR) {
            if (jqXHR && jqXHR.status === 401) {
                var message = '';
                try {
                    var data = JSON.parse(jqXHR.responseText);
                    if (data && data.status === 'session_expired') {
                        message = data.message;
                    }
                } catch (e) {}
                showSessionExpiredModal(message);
            }
        });
    }
})();
