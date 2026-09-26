$().ready(function(){

    console.log('Init Module Farmasi');

    /* Field Harga Beli Satuan*/
    var hargaBeliSatuan = document.getElementById('field-harga_beli_satuan');
    var hargaBeliSatuanFormat = document.getElementById('field-harga_beli_satuan_format');

    hargaBeliSatuan.addEventListener('keyup', function(e)
    {
        hargaBeliSatuan.value = this.value;
        hargaBeliSatuanFormat.value = formatRupiah(this.value, 'Rp. ');
    });

    /* Field Harga Jual Satuan*/
    var hargaJualSatuan = document.getElementById('field-harga_jual_satuan');
    var hargaJualSatuanFormat = document.getElementById('field-harga_jual_satuan_format');

    hargaJualSatuan.addEventListener('keyup', function(e)
    {
        hargaJualSatuan.value = this.value;
        hargaJualSatuanFormat.value = formatRupiah(this.value, 'Rp. ');
    });

$('.expired_date').flatpickr({
        dateFormat: "d-m-Y"
    });
});

