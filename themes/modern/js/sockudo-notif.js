/*
 * sockudo-notif.js
 * -----------------------------------------------------------------------------
 * Client realtime notifikasi untuk SIM Halo Bayi.
 *
 * Menghubungkan browser ke server Sockudo (protokol Pusher, public channel)
 * memakai WebSocket bawaan browser — TANPA library eksternal (pusher-js), jadi
 * tetap jalan meski server internal tidak punya akses internet.
 *
 * Konfigurasi di-inject oleh footer.php (window.SOCKUDO) dan bersifat DINAMIS
 * berbasis "topics" dari Config\Sockudo::$topics:
 *
 *   window.SOCKUDO = {
 *     key, wsHost, wsPort, forceTLS,
 *     topics: [
 *       { channel:'notif-pendaftaran', event:'pendaftaran-baru', title:'Pasien Baru', icon:'info', sound:true },
 *       { channel:'notif-antrian',     event:'antrian-baru',     title:'Antrian Baru', icon:'info', sound:true },
 *       ...
 *     ]
 *   }
 *
 * Menambah jenis notifikasi baru cukup dari sisi PHP (config) — file ini tidak
 * perlu diubah lagi.
 *
 * Untuk bereaksi atas notifikasi tertentu (mis. refresh tabel antrian), pasang:
 *   document.addEventListener('sockudo:antrian-baru', function (e) { ... e.detail ... });
 */
(function () {
    'use strict';

    if (window.__sockudoNotifStarted) return;
    var cfg = window.SOCKUDO;
    if (!cfg || !cfg.key || !cfg.wsHost) return; // Belum dikonfigurasi -> diam.

    // Normalisasi daftar topics. Dukung juga format lama (channel/event tunggal).
    var topics = Array.isArray(cfg.topics) ? cfg.topics.slice() : [];
    if (!topics.length && cfg.channel && cfg.event) {
        topics.push({ channel: cfg.channel, event: cfg.event });
    }
    if (!topics.length) return; // Tidak ada yang perlu didengarkan.

    window.__sockudoNotifStarted = true;

    // Index: event -> topic, dan daftar channel unik untuk di-subscribe.
    var topicByEvent = {};
    var channels = {};
    topics.forEach(function (t) {
        if (!t || !t.channel || !t.event) return;
        topicByEvent[t.event] = t;
        channels[t.channel] = true;
    });
    var channelList = Object.keys(channels);

    var scheme = cfg.forceTLS ? 'wss' : 'ws';
    var url = scheme + '://' + cfg.wsHost + ':' + cfg.wsPort +
        '/app/' + cfg.key + '?protocol=7&client=js&version=8.4.0&flavour=web';

    var ws = null;
    var reconnectDelay = 2000;      // mulai 2 detik
    var reconnectMax = 30000;       // maksimal 30 detik
    var activityTimer = null;

    // Broadcast status koneksi realtime supaya UI (mis. badge di dashboard)
    // bisa menampilkannya. State: connecting | connected | disconnected.
    function setStatus(state) {
        window.SOCKUDO_STATE = state;
        try {
            document.dispatchEvent(new CustomEvent('sockudo:status', { detail: { state: state } }));
        } catch (e) {}
    }

    function connect() {
        setStatus('connecting');
        try {
            ws = new WebSocket(url);
        } catch (e) {
            setStatus('disconnected');
            scheduleReconnect();
            return;
        }

        ws.onopen = function () {
            reconnectDelay = 2000; // reset backoff
        };

        ws.onmessage = function (msg) {
            var payload;
            try {
                payload = JSON.parse(msg.data);
            } catch (e) {
                return;
            }

            // data pada protokol Pusher berupa STRING JSON -> parse lagi.
            var data = payload.data;
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (e) { /* biarkan string */ }
            }

            switch (payload.event) {
                case 'pusher:connection_established':
                    subscribeAll();
                    keepAlive(data);
                    setStatus('connected');
                    break;

                case 'pusher:ping':
                    send({ event: 'pusher:pong', data: {} });
                    break;

                case 'pusher:error':
                    if (window.console) console.warn('[sockudo] error:', data);
                    break;

                default:
                    if (topicByEvent[payload.event]) {
                        handleNotif(topicByEvent[payload.event], data || {});
                    }
                    break;
            }
        };

        ws.onclose = function () {
            setStatus('disconnected');
            scheduleReconnect();
        };

        ws.onerror = function () {
            try { ws.close(); } catch (e) {}
        };
    }

    function send(obj) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(obj));
        }
    }

    function subscribeAll() {
        channelList.forEach(function (ch) {
            send({ event: 'pusher:subscribe', data: { channel: ch } });
        });
    }

    // Kirim ping berkala supaya koneksi tidak di-drop server.
    function keepAlive(established) {
        var interval = 25000;
        if (established && established.activity_timeout) {
            interval = Math.max(10000, (established.activity_timeout - 5) * 1000);
        }
        clearInterval(activityTimer);
        activityTimer = setInterval(function () {
            send({ event: 'pusher:ping', data: {} });
        }, interval);
    }

    function scheduleReconnect() {
        clearInterval(activityTimer);
        setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectMax, reconnectDelay * 1.5);
    }

    // ---- Tampilan notifikasi -------------------------------------------------

    function handleNotif(topic, d) {
        var judul = topic.title || 'Notifikasi';
        // Judul lebih spesifik bila ada nama pasien.
        if (d.nama_pasien) {
            judul = (topic.title || 'Notifikasi') + ': ' + d.nama_pasien;
        }

        var pesan = buildMessage(d);

        if (topic.sound !== false) beep();

        if (window.Swal && typeof window.Swal.fire === 'function') {
            window.Swal.fire({
                toast: true,
                position: 'top-end',
                icon: topic.icon || 'info',
                title: judul,
                text: pesan,
                showConfirmButton: false,
                timer: 6000,
                timerProgressBar: true
            });
        } else if (window.bootbox) {
            window.bootbox.alert(judul + '\n' + pesan);
        } else if (window.console) {
            console.log('[notif] ' + judul + ' — ' + pesan);
        }

        // Event kustom per-topik agar halaman lain bisa bereaksi.
        try {
            document.dispatchEvent(new CustomEvent('sockudo:' + topic.event, { detail: d }));
        } catch (e) {}
    }

    // Susun baris pesan dari field yang tersedia (fleksibel untuk topik apa pun).
    function buildMessage(d) {
        var parts = [];
        if (d.nama_layanan) parts.push(d.nama_layanan);
        if (d.nama_dokter && d.nama_dokter !== '-') parts.push('→ ' + d.nama_dokter);
        if (d.no_antrian) parts.push('No. ' + d.no_antrian);
        if (d.nama_cabang && d.nama_cabang !== '-') parts.push(d.nama_cabang);
        if (d.waktu) parts.push('• ' + d.waktu);
        if (!parts.length && d.pesan) parts.push(d.pesan);
        return parts.join(' ');
    }

    // Bunyi bip singkat via Web Audio (tanpa file audio).
    function beep() {
        try {
            var Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            var ctx = new Ctx();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 880;
            gain.gain.value = 0.08;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            setTimeout(function () {
                osc.stop();
                ctx.close();
            }, 180);
        } catch (e) {}
    }

    connect();
})();
