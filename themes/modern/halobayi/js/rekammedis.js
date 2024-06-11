$().ready(function(){

    // Field Jasa Dokter
    var rupiahDokter = document.getElementById('field-jasa_dokter');
    var rupiahDokterFormat = document.getElementById('field-jasa_dokter_format');

    rupiahDokter.addEventListener('keyup', function(e)
    {
        rupiahDokter.value = this.value;
        rupiahDokterFormat.value = formatRupiah(this.value, 'Rp. ');
    });

    // Field Jasa Klinik
    var rupiahKlinik = document.getElementById('field-jasa_klinik');
    var rupiahKlinikFormat = document.getElementById('field-jasa_klinik_format');

    rupiahKlinik.addEventListener('keyup', function(e)
    {
        rupiahKlinik.value = this.value;
        rupiahKlinikFormat.value = formatRupiah(this.value, 'Rp. ');
    });

    var rupiahTotal = document.getElementById('field-total');
    $('#field-jasa_klinik').change(function(){
        rupiahTotal.value = parseInt(rupiahDokter.value) + parseInt(rupiahKlinik.value);
    });

});

