var captcha = sliderCaptcha({
    id: 'captcha',
    loadingText: 'Loading...',
    failedText: 'Coba sekali lagi',
    repeatIcon: 'fa fa-repeat',
    onSuccess: function () {
        setTimeout(function () {
            const capcayValue = `<?= csrf_hash(); ?>`;
            document.getElementById("capcay").value = capcayValue;
        }, 1000);
    },
    // onFail: function () {},
    // onRefresh: function () {},
    setSrc: function () {
    return 'https://picsum.photos/seed/picsum/' + Math.round(Math.random() * 136) + '.jpg';
    }
    // or use local images instead
    // localImages: function () {
    //   return 'images/Pic' + Math.round(Math.random() * 4) + '.jpg';
    // }
})