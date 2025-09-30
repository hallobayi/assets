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
        return 'https://cdn.jsdelivr.net/gh/hallobayi/assets@0.1.11/images/capcay/bg' + getRandomInt(1,5) + '.jpg';
    }
    // or use local images instead
    // localImages: function () {
    //   return 'images/Pic' + Math.round(Math.random() * 4) + '.jpg';
    // }
});

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}