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

      // Sesi pengirim dipilih di #wa-sesi; 0 berarti "sesi aktif / .env".
      // Nilainya dikirim apa adanya supaya server memakai sesi yang sama untuk
      // seluruh antrean, bukan mengundi ulang gateway tiap nomor.
      function sesiTerpilih() {
        return $("#wa-sesi").val() || "0";
      }

      // Modul pengirim menentukan dua hal di server: kolom `module` di log dan
      // sesi mana yang dipakai (modul yang terikat membawa sesinya sendiri).
      function modulTerpilih() {
        return $("#wa-modul").val() || "";
      }

      // Memilih modul yang sudah punya sesi langsung memindahkan pilihan sesi,
      // supaya operator tidak perlu mencari perangkatnya sendiri.
      $("#wa-modul").on("change", function () {
        var sesi = parseInt($(this).find("option:selected").data("sesi"), 10) || 0;

        if (sesi > 0 && $("#wa-sesi option[value='" + sesi + "']").length) {
          $("#wa-sesi").val(String(sesi));
        }
      });

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
              sesi: sesiTerpilih(),
              modul: modulTerpilih(),
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

        // Kunci sesi sekali. Tanpa ini, pilihan Auto akan mengundi ulang
        // gateway pada tiap nomor dan batch terpecah ke beberapa perangkat.
        // Modul ikut dikirim supaya server memakai sesi yang terikat ke modul
        // itu, bukan sesi aktif.
        ajaxPost(
          $form.data("gateway-url"),
          $.param({ sesi: sesiTerpilih(), modul: modulTerpilih() })
        )
          .done(function (res) {
            if (res.status !== "ok") {
              popup("error", "Gateway tidak siap", esc(res.message || ""));
              selesai($btnKirim);
              $btnCek.prop("disabled", false);
              return;
            }

            var label = res.label || res.gateway;

            $("#wa-kirim-gateway").text("Pengirim: " + label);

            kirimSatuPerSatu(daftar, label)
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
  // Sesi & gateway (tabel whatsapp_session)
  // ------------------------------------------------------------------
  //
  // Berbeda dari versi sebelumnya, daftar sesi berasal dari database. Halaman
  // karena itu tetap terbuka walau gateway mati, dan tombol "periksa" hanya
  // menyegarkan satu baris — tidak perlu memuat ulang seluruh halaman.

  var $sesi = $("#wa-sesi-page");

  if ($sesi.length) {
    (function ($page) {
      var modalEdit = null;

      function denganParam(url, params) {
        return url + (url.indexOf("?") === -1 ? "?" : "&") + $.param(params || {});
      }

      function setBadge(id, teks, kelas) {
        $("#wa-sesi-badge-" + id).removeClass().addClass("badge " + kelas).text(teks);
      }

      function muatUlang(pesan) {
        if (pesan) {
          toast(true, pesan);
        }

        window.setTimeout(function () {
          window.location.reload();
        }, 700);
      }

      function konfirmasi(judul, teks) {
        var d = $.Deferred();

        if (typeof Swal === "undefined") {
          d.resolve(window.confirm(judul + "\n\n" + teks));
          return d.promise();
        }

        Swal.fire({
          icon: "question",
          title: judul,
          text: teks,
          showCancelButton: true,
          confirmButtonText: "Ya",
          cancelButtonText: "Batal",
        }).then(function (r) {
          d.resolve(!!r.isConfirmed);
        });

        return d.promise();
      }

      function ambilModal() {
        if (modalEdit === null && typeof bootstrap !== "undefined") {
          var el = document.getElementById("wa-sesi-edit-modal");

          if (!el) {
            return null;
          }

          // `.content` di tema ini memakai `position:relative; z-index:2`,
          // sehingga modal yang dirender di dalamnya terkurung pada stacking
          // context itu. Backdrop Bootstrap (z-index 1050) ditempel ke <body>,
          // jadi ia menutupi modal: layar hanya menggelap dan formulir tidak
          // bisa diisi. Memindahkan modal ke <body> membuat z-index-nya (1055)
          // berlaku terhadap backdrop, bukan terhadap `.content`.
          if (el.parentNode !== document.body) {
            document.body.appendChild(el);
          }

          modalEdit = new bootstrap.Modal(el);
        }

        return modalEdit;
      }

      // Satu handler untuk semua tombol baris. Delegasi dipakai karena baris
      // bisa berubah setelah halaman dimuat ulang sebagian.
      $page.on("click", ".wa-sesi-aksi", function () {
        var $btn = $(this);
        var aksi = String($btn.data("aksi") || "");
        var id = parseInt($btn.data("id"), 10) || 0;

        if (aksi === "status") {
          sibuk($btn, "");

          ajaxGet(denganParam($page.data("status-url"), { id: id }))
            .done(function (res) {
              if (res.status !== "ok") {
                setBadge(id, "Gagal", "bg-danger");
                popup("error", "Pemeriksaan gagal", esc(res.message || ""));
                return;
              }

              var d = res.data || {};

              setBadge(
                id,
                d.connected ? "Tersambung" : d.status || "belum tersambung",
                d.connected ? "bg-success" : "bg-warning text-dark"
              );

              toast(true, d.connected ? "Sesi tersambung" : "Status: " + (d.status || "belum tersambung"));
            })
            .fail(ajaxError)
            .always(function () {
              selesai($btn);
            });

          return;
        }

        if (aksi === "qr") {
          sibuk($btn, "Mengambil QR…");

          ajaxGet(denganParam($page.data("qr-url"), { id: id }))
            .done(function (res) {
              if (res.status !== "ok") {
                popup("info", "QR belum tersedia", esc(res.message || ""));
                return;
              }

              if (res.connected) {
                popup("success", "Sudah tersambung", esc(res.message || "Sesi sudah aktif."));
                return;
              }

              $("#wa-sesi-qr-judul").text($btn.closest("tr").find(".fw-semibold").first().text().trim());
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

          return;
        }

        if (aksi === "aktifkan") {
          konfirmasi("Jadikan sesi aktif?", "Seluruh pengiriman otomatis akan lewat sesi ini.").done(function (ya) {
            if (!ya) {
              return;
            }

            sibuk($btn, "");

            ajaxPost($page.data("aktif-url"), $.param({ id: id }))
              .done(function (res) {
                if (res.status !== "ok") {
                  popup("error", "Gagal", esc(res.message || ""));
                  return;
                }

                muatUlang(res.message || "Sesi aktif dipindahkan.");
              })
              .fail(ajaxError)
              .always(function () {
                selesai($btn);
              });
          });

          return;
        }

        if (aksi === "hapus") {
          var nama = String($btn.data("nama") || "sesi ini");

          konfirmasi(
            "Hapus sesi?",
            "Baris " + nama + " dihapus dari daftar. Sesi di gateway tidak di-logout, jadi masih bisa dimunculkan lagi lewat Sinkron."
          ).done(function (ya) {
            if (!ya) {
              return;
            }

            sibuk($btn, "");

            ajaxPost($page.data("hapus-url"), $.param({ id: id }))
              .done(function (res) {
                if (res.status !== "ok") {
                  popup("error", "Gagal", esc(res.message || ""));
                  return;
                }

                muatUlang(res.message || "Sesi dihapus.");
              })
              .fail(ajaxError)
              .always(function () {
                selesai($btn);
              });
          });

          return;
        }

        if (aksi === "edit") {
          $("#wa-sesi-edit-id").val(id);
          $("#wa-sesi-edit-nama").val(String($btn.data("nama") || ""));
          $("#wa-sesi-edit-token").val("");
          $("#wa-sesi-edit-url").val("");
          $("#wa-sesi-edit-info").text(
            String($btn.data("provider") || "") + " · " + String($btn.data("sesi") || "")
          );

          // Centang ulang modul yang sudah terikat ke sesi ini. Nilainya
          // datang dari atribut data-modul (daftar id dipisah koma).
          var dipilih = String($btn.data("modul") || "")
            .split(",")
            .map(function (v) {
              return parseInt(v, 10) || 0;
            });

          $("#wa-sesi-edit-modul input[type=checkbox]").each(function () {
            $(this).prop("checked", dipilih.indexOf(parseInt(this.value, 10)) > -1);
          });

          var modal = ambilModal();

          if (modal) {
            modal.show();
          }
        }
      });

      // --- buat sesi -----------------------------------------------------
      $("#wa-sesi-buat").on("click", function () {
        var $btn = $(this);

        sibuk($btn, "Membuat…");

        ajaxPost(
          $page.data("buat-url"),
          $.param({
            nama: $("#wa-sesi-nama").val() || "",
            provider: $("#wa-sesi-provider-baru").val() || "",
          })
        )
          .done(function (res) {
            if (res.status !== "ok") {
              popup("error", "Gagal membuat sesi", esc(res.message || ""));
              return;
            }

            muatUlang(res.message || "Sesi dibuat.");
          })
          .fail(ajaxError)
          .always(function () {
            selesai($btn);
          });
      });

      // --- sinkron & impor ----------------------------------------------
      $("#wa-sesi-sinkron").on("click", function () {
        var $btn = $(this);

        sibuk($btn, "Menyinkronkan…");

        ajaxPost($page.data("sinkron-url"), $.param({ provider: $("#wa-sesi-provider-baru").val() || "" }))
          .done(function (res) {
            if (res.status !== "ok") {
              popup("error", "Sinkron gagal", esc(res.message || ""));
              return;
            }

            muatUlang(res.message || "Sinkron selesai.");
          })
          .fail(ajaxError)
          .always(function () {
            selesai($btn);
          });
      });

      $("#wa-sesi-impor").on("click", function () {
        var $btn = $(this);

        sibuk($btn, "Mengimpor…");

        ajaxPost($page.data("impor-url"), "")
          .done(function (res) {
            if (res.status !== "ok") {
              popup("error", "Impor gagal", esc(res.message || ""));
              return;
            }

            muatUlang(res.message || "Sesi diimpor dari .env.");
          })
          .fail(ajaxError)
          .always(function () {
            selesai($btn);
          });
      });

      // --- simpan modal ---------------------------------------------------
      $("#wa-sesi-edit-simpan").on("click", function () {
        var $btn = $(this);

        sibuk($btn, "Menyimpan…");

        var payload = {
          id: $("#wa-sesi-edit-id").val(),
          nama: $("#wa-sesi-edit-nama").val() || "",
          token: $("#wa-sesi-edit-token").val() || "",
          url: $("#wa-sesi-edit-url").val() || "",
        };

        var $modulBox = $("#wa-sesi-edit-modul");

        // Modul hanya dikirim bila daftarnya memang dirender. Penanda
        // `modul_kirim` diperlukan karena $.param() membuang array kosong —
        // tanpa penanda itu, "lepas semua modul" tidak bisa dibedakan dari
        // "formulir tidak punya daftar modul".
        if ($modulBox.length) {
          var modul = [];

          $modulBox.find("input[type=checkbox]:checked").each(function () {
            modul.push(parseInt(this.value, 10) || 0);
          });

          payload.modul_kirim = "1";
          payload.modul = modul;
        }

        ajaxPost($page.data("simpan-url"), $.param(payload))
          .done(function (res) {
            if (res.status !== "ok") {
              popup("error", "Gagal menyimpan", esc(res.message || ""));
              return;
            }

            var modal = ambilModal();

            if (modal) {
              modal.hide();
            }

            muatUlang(res.message || "Sesi diperbarui.");
          })
          .fail(ajaxError)
          .always(function () {
            selesai($btn);
          });
      });

      // --- QR: tutup ------------------------------------------------------
      $("#wa-sesi-qr-tutup").on("click", function () {
        $("#wa-sesi-qr-card").addClass("d-none");
      });
    })($sesi);
  }
})(jQuery);
