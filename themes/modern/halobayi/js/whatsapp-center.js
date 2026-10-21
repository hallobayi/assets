/**
 * WhatsApp Center — JS modul master/whatsapp.
 *
 * Satu berkas untuk tiga halaman; setiap blok hanya aktif kalau elemen
 * penandanya ada di halaman.
 *
 *   - dashboard : #wa-dash-sesi
 *   - kirim     : #wa-kirim-form
 *   - sesi      : #wa-sesi-page
 *
 * Token CSRF diambil dari window.SIMHAI_SESSION yang disiapkan footer.php.
 * Setiap respons JSON dari controller menyertakan `csrf` terbaru (lihat
 * AjaxResponseTrait::jsonOut), jadi hash lokal ikut disegarkan.
 */
(function ($) {
  "use strict";

  var SESSION = window.SIMHAI_SESSION || {};

  // ------------------------------------------------------------------
  // Dasar
  // ------------------------------------------------------------------

  function csrfName() {
    return SESSION.csrfName || "csrf_test_name";
  }

  function csrfHash() {
    return SESSION.csrfHash || "";
  }

  function syncCsrf(res) {
    if (!res || !res.csrf || !res.csrf.value) {
      return;
    }

    SESSION.csrfHash = res.csrf.value;
    window.SIMHAI_SESSION = SESSION;

    $('input[name="' + (res.csrf.name || csrfName()) + '"]').val(res.csrf.value);
  }

  function esc(nilai) {
    return $("<div>").text(nilai === null || nilai === undefined ? "" : String(nilai)).html();
  }

  function popup(icon, title, html) {
    if (typeof Swal === "undefined") {
      window.alert(title + "\n\n" + $("<div>").html(html).text());
      return;
    }

    Swal.fire({ icon: icon, title: title, html: html });
  }

  function toast(ok, pesan) {
    if (typeof Swal === "undefined") {
      return;
    }

    Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2600,
      timerProgressBar: true,
      didOpen: function (t) {
        t.addEventListener("mouseenter", Swal.stopTimer);
        t.addEventListener("mouseleave", Swal.resumeTimer);
      },
    }).fire({
      icon: ok ? "success" : "error",
      title: pesan,
    });
  }

  function withCsrf(payload) {
    var token = encodeURIComponent(csrfName()) + "=" + encodeURIComponent(csrfHash());

    return payload ? payload + "&" + token : token;
  }

  function ajaxPost(url, payload) {
    return $.ajax({
      url: url,
      type: "POST",
      data: withCsrf(payload || ""),
      dataType: "json",
      headers: { "X-CSRF-TOKEN": csrfHash() },
    }).then(function (res) {
      syncCsrf(res);
      return res;
    });
  }

  function ajaxGet(url) {
    return $.ajax({
      url: url,
      type: "GET",
      dataType: "json",
      cache: false,
    }).then(function (res) {
      syncCsrf(res);
      return res;
    });
  }

  function ajaxError(xhr) {
    var pesan = "Permintaan gagal diproses.";

    if (xhr && xhr.responseJSON && xhr.responseJSON.message) {
      pesan = xhr.responseJSON.message;
    } else if (xhr && xhr.status === 0) {
      pesan = "Tidak bisa menghubungi server. Periksa koneksi.";
    } else if (xhr && (xhr.status === 403 || xhr.status === 419)) {
      pesan = "Token keamanan kedaluwarsa. Muat ulang halaman lalu coba lagi.";
    } else if (xhr && xhr.status === 200) {
      pesan = "Server membalas halaman, bukan JSON — kemungkinan sesi login habis. Muat ulang halaman.";
    }

    popup("error", "Gagal", esc(pesan));
  }

  function sibuk($btn, teks) {
    $btn.data("asli", $btn.html());
    $btn.prop("disabled", true).html(
      '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>' +
        (teks || "Memproses…")
    );
  }

  function selesai($btn) {
    var asli = $btn.data("asli");

    if (asli) {
      $btn.html(asli);
    }

    $btn.prop("disabled", false);
  }

  function badgeSesi(connected, status) {
    if (connected) {
      return '<span class="badge bg-success">Tersambung</span>';
    }

    if (status) {
      return '<span class="badge bg-warning text-dark">' + esc(status) + "</span>";
    }

    return '<span class="badge bg-secondary">Belum tersambung</span>';
  }

  // ------------------------------------------------------------------
  // Dashboard
  // ------------------------------------------------------------------

  function muatStatusSesi(url, $badge, $info) {
    $badge.removeClass().addClass("badge bg-secondary").text("Memeriksa…");

    return ajaxGet(url)
      .done(function (res) {
        if (res.status !== "ok") {
          $badge.removeClass().addClass("badge bg-danger").text("Gagal");
          $info.text(res.message || "Gateway tidak menjawab.");
          return;
        }

        var d = res.data || {};

        $badge
          .removeClass()
          .addClass("badge " + (d.connected ? "bg-success" : "bg-warning text-dark"))
          .text(d.connected ? "Tersambung" : d.status || "Belum tersambung");

        var bagian = [];

        if (d.provider) {
          bagian.push("Gateway: " + d.provider);
        }
        if (d.id) {
          bagian.push("Sesi: " + d.id);
        }
        if (d.phoneNumber) {
          bagian.push("Nomor: " + d.phoneNumber);
        }
        if (d.profileName) {
          bagian.push("Profil: " + d.profileName);
        }

        $info.text(bagian.join(" · ") || "Gateway tidak menyebutkan rincian sesi.");
      })
      .fail(function (xhr) {
        $badge.removeClass().addClass("badge bg-danger").text("Gagal");
        $info.text("Tidak bisa memeriksa status sesi.");
        ajaxError(xhr);
      });
  }

  var $dash = $("#wa-dash-sesi");

  if ($dash.length) {
    var urlStatus = $dash.data("status-url");

    muatStatusSesi(urlStatus, $("#wa-dash-sesi-badge"), $("#wa-dash-sesi-info"));

    $("#wa-dash-sesi-refresh").on("click", function () {
      var $btn = $(this);

      sibuk($btn, "Memeriksa…");
      muatStatusSesi(urlStatus, $("#wa-dash-sesi-badge"), $("#wa-dash-sesi-info")).always(function () {
        selesai($btn);
      });
    });
  }

  // ------------------------------------------------------------------
  // Kirim pesan
  // ------------------------------------------------------------------

  function badgeHasil(h) {
    if (h.ok) {
      return '<span class="badge bg-success">Terkirim</span>';
    }

    if (h.status === "dilewati") {
      return '<span class="badge bg-secondary">Dilewati</span>';
    }

    return '<span class="badge bg-danger">Gagal</span>';
  }

  function renderBarisHasil(hasil) {
    var $tbody = $("#wa-kirim-hasil").empty();

    if (!hasil.length) {
      $tbody.append('<tr><td colspan="3" class="text-center text-muted py-3">Belum ada hasil.</td></tr>');
    } else {
      hasil.forEach(function (h) {
        $tbody.append(
          '<tr><td class="ps-3 text-nowrap">' +
            esc(h.nomor) +
            "</td><td>" +
            badgeHasil(h) +
            '</td><td class="pe-3 small">' +
            esc(h.keterangan || "") +
            "</td></tr>"
        );
      });
    }

    $("#wa-kirim-hasil-card").removeClass("d-none");
  }

  function renderCek(res) {
    var hasil = res.hasil || [];
    var $tbody = $("#wa-kirim-hasil").empty();

    $("#wa-kirim-gateway").text(res.gateway ? "Gateway: " + res.gateway : "");

    if (!hasil.length) {
      $tbody.append('<tr><td colspan="3" class="text-center text-muted py-3">Tidak ada hasil.</td></tr>');
    } else {
      hasil.forEach(function (h) {
        var badge;

        if (h.terdaftar === true) {
          badge = '<span class="badge bg-success">Terdaftar</span>';
        } else if (h.terdaftar === false) {
          badge = '<span class="badge bg-danger">Tidak terdaftar</span>';
        } else {
          badge = '<span class="badge bg-secondary">Tidak diketahui</span>';
        }

        $tbody.append(
          '<tr><td class="ps-3 text-nowrap">' +
            esc(h.nomor) +
            "</td><td>" +
            badge +
            '</td><td class="pe-3 small text-muted">Gateway tidak menyebutkan nomor ini.</td></tr>'
        );
      });
    }

    $("#wa-kirim-hasil-card").removeClass("d-none");
  }

  var $formKirim = $("#wa-kirim-form");

  if ($formKirim.length) {
    (function ($form) {
      var $pesan = $("#wa-pesan");
      var $counter = $("#wa-pesan-counter");
      var $btnKirim = $("#wa-kirim-submit");
      var $btnCek = $("#wa-cek-submit");
      var $progress = $("#wa-kirim-progress");
      var $progressText = $("#wa-kirim-progress-text");
      var maxTujuan = parseInt($form.data("max-tujuan"), 10) || 50;

      function hitungKarakter() {
        $counter.text($pesan.val().length + " karakter");
      }

      $pesan.on("input", hitungKarakter);
      hitungKarakter();

      $("#wa-template").on("change", function () {
        var isi = $(this).find("option:selected").data("konten");

        if (typeof isi === "string" && isi !== "") {
          $pesan.val(isi).trigger("input");
          toast(true, "Template dimuat ke kolom pesan");
        }
      });

      function daftarTujuan() {
        var mentah = $("#wa-tujuan").val() || "";
        var bagian = mentah.split(/[\r\n,;]+/);
        var unik = [];
        var sudah = {};

        bagian.forEach(function (satu) {
          satu = satu.trim();

          if (satu === "" || sudah[satu]) {
            return;
          }

          sudah[satu] = true;
          unik.push(satu);
        });

        return unik;
      }

      function setProgress(selesai, total, gateway) {
        var persen = total > 0 ? Math.round((selesai / total) * 100) : 0;

        $progress.css("width", persen + "%").attr("aria-valuenow", persen);
        $progressText.text(
          total > 0
            ? selesai + " / " + total + " nomor" + (gateway ? " · " + gateway : "")
            : ""
        );
      }

      /*
       * Satu nomor per request.
       *
       * Pengiriman beruntun dalam satu request akan menabrak
       * max_execution_time begitu typing (2–7 detik per nomor) menyala —
       * 20 nomor saja sudah lebih dari satu menit. Antrean di browser membuat
       * tiap request pendek, sekaligus memberi progres per nomor.
       */
      function kirimSatuPerSatu(daftar, gateway) {
        var hasil = [];
        var sukses = 0;
        var gagal = 0;
        var i = 0;
        var d = $.Deferred();

        function gagalkanSisa(mulai, alasan) {
          for (var sisa = mulai; sisa < daftar.length; sisa++) {
            hasil.push({
              nomor: daftar[sisa],
              ok: false,
              status: "gagal",
              keterangan: alasan,
            });
            gagal++;
          }

          i = daftar.length;
          renderBarisHasil(hasil);
        }

        function lanjut() {
          if (i >= daftar.length) {
            d.resolve({ hasil: hasil, sukses: sukses, gagal: gagal, gateway: gateway });
            return;
          }

          var nomor = daftar[i];

          setProgress(i, daftar.length, gateway);
          $btnKirim.html(
            '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>' +
              "Mengirim " + (i + 1) + "/" + daftar.length + "…"
          );

          ajaxPost(
            $form.data("url"),
            $.param({
              tujuan: nomor,
              pesan: $pesan.val(),
              provider: gateway,
              footer: $("#wa-footer").is(":checked") ? "1" : "0",
              typing: $("#wa-typing").is(":checked") ? "1" : "0",
              cek_nomor: $("#wa-cek-nomor").is(":checked") ? "1" : "0",
              delay: $("#wa-delay").val() || "",
            })
          )
            .done(function (res) {
              var diterima = res.hasil || [];

              if (res.status === "error" && !diterima.length) {
                // Penolakan tingkat konfigurasi (mis. WA_NOTIFICATION mati)
                // berlaku untuk semua nomor — hentikan antrean.
                hasil.push({
                  nomor: nomor,
                  ok: false,
                  status: "gagal",
                  keterangan: res.message || "Ditolak.",
                });
                gagal++;
                renderBarisHasil(hasil);
                gagalkanSisa(i + 1, "Tidak dicoba: " + (res.message || "pengiriman dihentikan."));
                return;
              }

              diterima.forEach(function (h) {
                hasil.push(h);
                h.ok ? sukses++ : gagal++;
              });

              renderBarisHasil(hasil);
            })
            .fail(function (xhr) {
              var pesanGagal =
                xhr && xhr.responseJSON && xhr.responseJSON.message
                  ? xhr.responseJSON.message
                  : "Permintaan gagal (HTTP " + (xhr ? xhr.status : "?") + ").";

              hasil.push({ nomor: nomor, ok: false, status: "gagal", keterangan: pesanGagal });
              gagal++;
              renderBarisHasil(hasil);

              // CSRF/sesi kedaluwarsa: sisa nomor pasti ikut gagal.
              if (xhr && (xhr.status === 403 || xhr.status === 419 || xhr.status === 200)) {
                gagalkanSisa(i + 1, "Tidak dicoba: " + pesanGagal);
              }
            })
            .always(function () {
              i++;
              lanjut();
            });
        }

        lanjut();

        return d.promise();
      }

      $form.on("submit", function (e) {
        e.preventDefault();

        var daftar = daftarTujuan();

        if (!daftar.length) {
          popup("warning", "Tujuan kosong", "Isi minimal satu nomor tujuan.");
          return;
        }

        if (daftar.length > maxTujuan) {
          popup(
            "warning",
            "Terlalu banyak nomor",
            "Maksimal " + maxTujuan + " nomor per sekali kirim. Daftar Anda berisi " + daftar.length + " nomor."
          );
          return;
        }

        if (!$pesan.val().trim()) {
          popup("warning", "Pesan kosong", "Isi pesan terlebih dahulu.");
          return;
        }

        $("#wa-kirim-hasil").empty();
        $("#wa-kirim-hasil-card").addClass("d-none");
        setProgress(0, daftar.length, "");

        sibuk($btnKirim, "Menyiapkan…");
        $btnCek.prop("disabled", true);

        // Kunci gateway sekali. Tanpa ini, pilihan Auto akan mengundi ulang
        // pada tiap nomor dan batch terpecah ke beberapa gateway.
        ajaxPost($form.data("gateway-url"), $.param({ provider: $("#wa-provider").val() || "auto" }))
          .done(function (res) {
            if (res.status !== "ok") {
              popup("error", "Gateway tidak siap", esc(res.message || ""));
              selesai($btnKirim);
              $btnCek.prop("disabled", false);
              return;
            }

            $("#wa-kirim-gateway").text("Gateway: " + res.gateway);

            kirimSatuPerSatu(daftar, res.gateway)
              .done(function (ringkas) {
                setProgress(ringkas.hasil.length, daftar.length, ringkas.gateway);

                var ikon =
                  ringkas.gagal === 0 ? "success" : ringkas.sukses === 0 ? "error" : "warning";

                popup(
                  ikon,
                  "Hasil pengiriman",
                  esc(
                    ringkas.sukses +
                      " terkirim, " +
                      ringkas.gagal +
                      " gagal dari " +
                      daftar.length +
                      " nomor."
                  )
                );
              })
              .always(function () {
                selesai($btnKirim);
                $btnCek.prop("disabled", false);
              });
          })
          .fail(function (xhr) {
            selesai($btnKirim);
            $btnCek.prop("disabled", false);
            ajaxError(xhr);
          });
      });

      $btnCek.on("click", function () {
        if (!$("#wa-tujuan").val().trim()) {
          popup("warning", "Tujuan kosong", "Isi minimal satu nomor untuk diperiksa.");
          return;
        }

        sibuk($btnCek, "Memeriksa…");

        ajaxPost($form.data("cek-url"), $form.serialize())
          .done(function (res) {
            if (res.status !== "ok") {
              popup("error", "Pemeriksaan gagal", esc(res.message || ""));
              return;
            }

            renderCek(res);
            toast(true, res.message || "Pemeriksaan selesai");
          })
          .fail(ajaxError)
          .always(function () {
            selesai($btnCek);
          });
      });
    })($formKirim);
  }

  // ------------------------------------------------------------------
  // Sesi & gateway
  // ------------------------------------------------------------------

  var $sesi = $("#wa-sesi-page");

  if ($sesi.length) {
    (function ($page) {
      var $badge = $("#wa-sesi-badge");
      var $info = $("#wa-sesi-info");

      function setBadge(teks, kelas) {
        $badge.removeClass().addClass("badge " + kelas).text(teks);
      }

      // Operasi sesi dikirim bersama provider terpilih. Tanpa ini, provider
      // Auto mengundi gateway di tiap panggilan sehingga status/QR yang
      // diperiksa bisa berasal dari gateway yang berbeda dengan pengirim.
      function urlSesi(base) {
        var provider = $("#wa-sesi-provider").val() || "auto";

        return base + (base.indexOf("?") === -1 ? "?" : "&") + $.param({ provider: provider });
      }

      function providerTerpilih() {
        return $("#wa-sesi-provider").val() || "auto";
      }

      $("#wa-sesi-cek").on("click", function () {
        var $btn = $(this);

        sibuk($btn, "Memeriksa…");

        ajaxGet(urlSesi($page.data("status-url")))
          .done(function (res) {
            if (res.status !== "ok") {
              setBadge("Gagal", "bg-danger");
              $info.text(res.message || "Gateway tidak menjawab.");
              return;
            }

            var d = res.data || {};

            setBadge(
              d.connected ? "Tersambung" : d.status || "Belum tersambung",
              d.connected ? "bg-success" : "bg-warning text-dark"
            );

            var baris = [
              "<div><strong>Provider:</strong> " + esc(d.provider || "-") + "</div>",
              "<div><strong>ID sesi:</strong> " + esc(d.id || "-") + "</div>",
              "<div><strong>Status dari gateway:</strong> " + esc(d.status || "-") + "</div>",
            ];

            if (d.phoneNumber) {
              baris.push("<div><strong>Nomor:</strong> " + esc(d.phoneNumber) + "</div>");
            }
            if (d.profileName) {
              baris.push("<div><strong>Profil:</strong> " + esc(d.profileName) + "</div>");
            }

            $info.html(baris.join(""));
          })
          .fail(function (xhr) {
            setBadge("Gagal", "bg-danger");
            $info.text("Tidak bisa memeriksa status sesi.");
            ajaxError(xhr);
          })
          .always(function () {
            selesai($btn);
          });
      });

      $("#wa-sesi-qr").on("click", function () {
        var $btn = $(this);

        sibuk($btn, "Mengambil QR…");

        ajaxGet(urlSesi($page.data("qr-url")))
          .done(function (res) {
            if (res.status !== "ok") {
              popup("info", "QR belum tersedia", esc(res.message || ""));
              return;
            }

            if (res.connected) {
              popup("success", "Sudah tersambung", esc(res.message || "Sesi sudah aktif."));
              return;
            }

            $("#wa-sesi-qr-img").attr("src", res.qr);
            $("#wa-sesi-qr-note").html(
              "QR diambil pukul " +
                esc(new Date().toLocaleTimeString()) +
                ". Buka WhatsApp &rarr; Perangkat tertaut &rarr; Tautkan perangkat, lalu pindai."
            );
            $("#wa-sesi-qr-card").removeClass("d-none");
          })
          .fail(ajaxError)
          .always(function () {
            selesai($btn);
          });
      });

      $("#wa-sesi-buat").on("click", function () {
        var $btn = $(this);

        sibuk($btn, "Membuat…");

        ajaxPost(
          $page.data("buat-url"),
          $.param({ nama: $("#wa-sesi-nama").val() || "", provider: providerTerpilih() })
        )
          .done(function (res) {
            if (res.status !== "ok") {
              popup("error", "Gagal membuat sesi", esc(res.message || ""));
              return;
            }

            popup(
              "success",
              "Sesi dibuat",
              esc(res.message || "") +
                (res.punya_token
                  ? "<br><small>Gateway menerbitkan token baru. Salin dari dashboard gateway ke <code>.env</code> sebelum mengirim.</small>"
                  : "")
            );
          })
          .fail(ajaxError)
          .always(function () {
            selesai($btn);
          });
      });

      $("#wa-sesi-daftar").on("click", function () {
        var $btn = $(this);

        sibuk($btn, "Memuat…");

        ajaxGet(urlSesi($page.data("daftar-url")))
          .done(function (res) {
            if (res.status !== "ok") {
              popup("error", "Gagal memuat daftar sesi", esc(res.message || ""));
              return;
            }

            var rows = res.hasil || [];
            var $tbody = $("#wa-sesi-daftar-body").empty();

            if (!rows.length) {
              $tbody.append(
                '<tr><td colspan="5" class="text-center text-muted py-3">Gateway tidak melaporkan sesi apa pun.</td></tr>'
              );
            } else {
              rows.forEach(function (s) {
                $tbody.append(
                  '<tr><td class="ps-3">' +
                    esc(s.provider || "-") +
                    "</td><td>" +
                    esc(s.id || "-") +
                    "</td><td>" +
                    badgeSesi(s.connected, s.status) +
                    "</td><td>" +
                    esc(s.phoneNumber || "-") +
                    '</td><td class="pe-3">' +
                    esc(s.profileName || "-") +
                    "</td></tr>"
                );
              });
            }

            $("#wa-sesi-daftar-count").text(rows.length + " sesi");
            $("#wa-sesi-daftar-card").removeClass("d-none");
          })
          .fail(ajaxError)
          .always(function () {
            selesai($btn);
          });
      });
    })($sesi);
  }
})(jQuery);
