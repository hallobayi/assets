/**
 * bintang.js
 * Menangani animasi star rating dan submit rating pasien via AJAX.
 * Nilai dinamis (URL, CSRF) dibaca dari data-attributes pada #btn-submit-rating.
 */

// Animasi klik bintang (existing behavior)
document
  .querySelectorAll(".star-rating:not(.readonly) label")
  .forEach((star) => {
    star.addEventListener("click", function () {
      this.style.transform = "scale(1.2)";
      setTimeout(() => {
        this.style.transform = "scale(1)";
      }, 200);
    });
  });

// Submit rating pasien
(function () {
  var selectedRating = 0;
  var labels = ["Sangat Buruk", "Buruk", "Cukup", "Baik", "Sangat Baik"];

  var inputs = document.querySelectorAll('input[name="rating"]');
  var hint = document.getElementById("rating-hint");
  var formExtra = document.getElementById("rating-form-extra");
  var alertBox = document.getElementById("rating-alert");
  var btnSubmit = document.getElementById("btn-submit-rating");

  if (!inputs.length || !btnSubmit) return;

  inputs.forEach(function (input) {
    input.addEventListener("change", function () {
      selectedRating = parseInt(this.value);
      if (hint) hint.textContent = labels[selectedRating - 1];
      if (formExtra) formExtra.style.display = "block";
      if (alertBox) alertBox.style.display = "none";
    });
  });

  btnSubmit.addEventListener("click", function () {
    if (!selectedRating) {
      showAlert("warning", "Silakan pilih bintang terlebih dahulu.");
      return;
    }

    var btn = this;
    var postUrl = btn.dataset.url;
    var csrfName = btn.dataset.csrfName;
    var csrfHash = btn.dataset.csrfHash;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin me-1"></i> Menyimpan...';

    var formData = new FormData();
    formData.append("rating", selectedRating);
    formData.append("nik", document.getElementById("nik_pasien_rating").value);
    formData.append(
      "keterangan",
      document.getElementById("keterangan_rating").value,
    );
    if (csrfName && csrfHash) {
      formData.append(csrfName, csrfHash);
    }

    fetch(postUrl, {
      method: "POST",
      body: formData,
      headers: { "X-Requested-With": "XMLHttpRequest" },
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.status === "success") {
          showAlert("success", data.message);
          if (formExtra) formExtra.style.display = "none";
          inputs.forEach(function (i) {
            i.disabled = true;
          });
        } else {
          showAlert("danger", data.message || "Terjadi kesalahan.");
          btn.disabled = false;
          btn.innerHTML = '<i class="fa fa-paper-plane me-1"></i> Kirim Rating';
        }
      })
      .catch(function () {
        showAlert("danger", "Gagal menghubungi server.");
        btn.disabled = false;
        btn.innerHTML = '<i class="fa fa-paper-plane me-1"></i> Kirim Rating';
      });
  });

  function showAlert(type, msg) {
    if (!alertBox) return;
    alertBox.className = "alert alert-" + type + " py-1 px-2 small mt-2";
    alertBox.textContent = msg;
    alertBox.style.display = "block";
  }
})();
