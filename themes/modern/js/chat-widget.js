/*
 * chat-widget.js
 * -----------------------------------------------------------------------------
 * Floating chat widget (launcher mengambang di kanan-bawah) untuk SIM Halo Bayi.
 *
 * Tersambung ke server Sockudo (protokol Pusher, public channel) memakai
 * WebSocket bawaan browser — TANPA library eksternal, sama seperti
 * sockudo-notif.js, sehingga tetap jalan meski server internal tanpa internet.
 *
 * Kirim pesan lewat server (POST ke sendUrl) — client Pusher tidak bisa
 * broadcast antar-client tanpa lewat server (SockudoService::trigger()).
 *
 * RIWAYAT: pesan disimpan server ke Redis (App\Libraries\ChatHistory) dengan
 * retensi 24 jam. Saat widget dimuat, riwayat diambil sekali lewat GET
 * historyUrl lalu dirender sebelum pesan realtime — jadi percakapan tidak
 * hilang setelah reload / pindah halaman. Pesan yang masuk lewat WebSocket
 * selagi riwayat masih di-fetch ditahan di buffer, lalu di-flush setelah
 * riwayat tampil, dan didedup memakai field `id` dari server.
 *
 * Konfigurasi dibaca dari atribut data-* pada #chatWidget yang dirender
 * server (footer.php):
 *   data-key, data-ws-host, data-ws-port, data-force-tls, data-channel,
 *   data-event, data-send-url, data-history-url, data-csrf-header,
 *   data-csrf-token, data-me, data-title, data-welcome
 */
(function () {
    'use strict';

    if (window.__chatWidgetStarted) return;

    var root = document.getElementById('chatWidget');
    if (!root) return;

    var d = root.dataset;
    var cfg = {
        key: d.key,
        wsHost: d.wsHost,
        wsPort: d.wsPort,
        forceTLS: d.forceTls === 'true',
        channel: d.channel,
        event: d.event,
        sendUrl: d.sendUrl,
        historyUrl: d.historyUrl,
        csrfHeader: d.csrfHeader,
        me: d.me,
        title: d.title,
        welcome: d.welcome
    };
    if (!cfg.key || !cfg.wsHost) return; /* Belum dikonfigurasi -> diam. */

    window.__chatWidgetStarted = true;

    var csrfToken = d.csrfToken;

    /* --- Elemen ----------------------------------------------------------- */
    var launcher = document.getElementById('cwLauncher');
    var closeBtn = document.getElementById('cwClose');
    var body     = document.getElementById('cwBody');
    var form     = document.getElementById('cwForm');
    var input    = document.getElementById('cwInput');
    var badge    = document.getElementById('cwBadge');
    var statusEl = document.getElementById('cwStatus');

    var unread = 0;
    var welcomed = false;

    /* Dedup: id pesan yang sudah tampil (dari riwayat Redis maupun realtime). */
    var seenIds = Object.create(null);
    /* Pesan realtime yang datang sebelum riwayat selesai dimuat. */
    var pendingMsgs = [];
    var historyReady = false;

    /* --- Buka / tutup ----------------------------------------------------- */
    function isOpen() {
        return root.classList.contains('cw--open');
    }

    function open() {
        root.classList.add('cw--open');
        root.classList.remove('cw--closed');
        unread = 0;
        renderBadge();
        showWelcome();
        body.scrollTop = body.scrollHeight;
        input.focus();
    }

    function close() {
        root.classList.remove('cw--open');
        root.classList.add('cw--closed');
    }

    launcher.addEventListener('click', open);
    closeBtn.addEventListener('click', close);

    /* --- Render pesan ----------------------------------------------------- */
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function appendBubble(html, cls) {
        var wrap = document.createElement('div');
        wrap.className = 'cw__msg' + (cls ? ' ' + cls : '');
        wrap.innerHTML = '<div class="cw__bubble">' + html + '</div>';
        body.appendChild(wrap);
        body.scrollTop = body.scrollHeight;
    }

    function addSystem(text) {
        var time = currentTime();
        appendBubble(escapeHtml(text) +
            '<span class="cw__time">' + escapeHtml(time) + '</span>', 'cw__msg--sys');
    }

    function showWelcome() {
        if (welcomed || !cfg.welcome) return;
        welcomed = true;
        addSystem(cfg.welcome);
    }

    /*
     * Render satu pesan.
     * opts.silent -> jangan menaikkan badge unread (dipakai saat memuat
     * riwayat lama dari Redis, supaya tidak terlihat sebagai pesan baru).
     */
    function addMessage(msg, opts) {
        if (!msg) return;
        opts = opts || {};

        /* Dedup: pesan yang sama bisa datang dua kali (riwayat Redis +
           broadcast WebSocket) bila keduanya beririsan waktu. */
        if (msg.id) {
            if (seenIds[msg.id]) return;
            seenIds[msg.id] = true;
        }

        var mine = (msg.username || '') === cfg.me;
        var html = '';
        if (!mine) {
            html += '<div class="cw__name">' + escapeHtml(msg.username || '') + '</div>';
        }
        html += escapeHtml(msg.message || '');
        html += '<span class="cw__time">' + escapeHtml(formatStamp(msg)) + '</span>';
        appendBubble(html, mine ? 'cw__msg--self' : '');

        if (!opts.silent && !isOpen() && !mine) {
            unread += 1;
            renderBadge();
        }
    }

    /*
     * Label waktu pesan. Riwayat bisa berisi pesan kemarin (retensi 24 jam),
     * jadi tanggal ikut ditampilkan bila bukan hari ini. `ts` berupa unix
     * timestamp detik (float) dari server; bila tidak ada, pakai msg.time.
     */
    function formatStamp(msg) {
        var ts = parseFloat(msg.ts);
        if (!isFinite(ts) || ts <= 0) {
            return msg.time || currentTime();
        }

        var when = new Date(ts * 1000);
        var now = new Date();
        function pad(n) { return (n < 10 ? '0' : '') + n; }

        var clock = pad(when.getHours()) + ':' + pad(when.getMinutes());
        if (when.toDateString() === now.toDateString()) {
            return clock;
        }

        return pad(when.getDate()) + '/' + pad(when.getMonth() + 1) + ' ' + clock;
    }

    function renderBadge() {
        if (!badge) return;
        if (unread > 0) {
            badge.textContent = unread > 99 ? '99+' : String(unread);
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    function currentTime() {
        var d = new Date();
        function pad(n) { return (n < 10 ? '0' : '') + n; }
        return pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    /* --- Koneksi realtime (protokol Pusher) ------------------------------- */
    var ws = null;
    var reconnectDelay = 2000;
    var reconnectMax = 30000;
    var activityTimer = null;

    function setStatus(text, ok) {
        if (!statusEl) return;
        statusEl.textContent = text;
        statusEl.className = 'cw__status ' + (ok ? 'is-on' : 'is-off');
    }

    function wsUrl() {
        var scheme = cfg.forceTLS ? 'wss' : 'ws';
        return scheme + '://' + cfg.wsHost + ':' + cfg.wsPort +
            '/app/' + cfg.key + '?protocol=7&client=js&version=8.4.0&flavour=web';
    }

    function wsSend(obj) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(obj));
        }
    }

    function keepAlive(established) {
        var interval = 25000;
        if (established && established.activity_timeout) {
            interval = Math.max(10000, (established.activity_timeout - 5) * 1000);
        }
        clearInterval(activityTimer);
        activityTimer = setInterval(function () {
            wsSend({ event: 'pusher:ping', data: {} });
        }, interval);
    }

    function scheduleReconnect() {
        clearInterval(activityTimer);
        setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectMax, reconnectDelay * 1.5);
    }

    function connect() {
        setStatus('Menghubungkan...', false);
        try {
            ws = new WebSocket(wsUrl());
        } catch (e) {
            setStatus('Terputus', false);
            scheduleReconnect();
            return;
        }

        ws.onopen = function () {
            reconnectDelay = 2000;
        };

        ws.onmessage = function (evt) {
            var payload;
            try {
                payload = JSON.parse(evt.data);
            } catch (e) {
                return;
            }

            var data = payload.data;
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (e) { data = {}; }
            }

            switch (payload.event) {
                case 'pusher:connection_established':
                    wsSend({ event: 'pusher:subscribe', data: { channel: cfg.channel } });
                    keepAlive(data);
                    setStatus('Terhubung', true);
                    break;
                case 'pusher:ping':
                    wsSend({ event: 'pusher:pong', data: {} });
                    break;
                case 'pusher:error':
                    if (window.console) console.warn('[chat-widget] error:', data);
                    break;
                default:
                    if (payload.event === cfg.event && data) {
                        receiveLive(data);
                    }
                    break;
            }
        };

        ws.onclose = function () {
            setStatus('Terputus', false);
            scheduleReconnect();
        };

        ws.onerror = function () {
            try { ws.close(); } catch (e) {}
        };
    }

    /* --- Riwayat 24 jam (Redis, lewat GET historyUrl) --------------------- */
    /*
     * Pesan realtime yang tiba sebelum riwayat selesai dimuat ditahan dulu,
     * supaya urutannya tidak terbalik (pesan baru muncul di atas pesan lama).
     */
    function receiveLive(msg) {
        if (!historyReady) {
            pendingMsgs.push(msg);
            /* Badge tetap jalan meski render-nya ditunda. */
            if (!isOpen() && (msg.username || '') !== cfg.me) {
                unread += 1;
                renderBadge();
            }
            return;
        }
        addMessage(msg);
    }

    function flushPending() {
        historyReady = true;
        var queued = pendingMsgs;
        pendingMsgs = [];
        for (var i = 0; i < queued.length; i++) {
            /* silent: badge sudah dihitung saat pesan masuk ke buffer. */
            addMessage(queued[i], { silent: true });
        }
    }

    function loadHistory() {
        if (!cfg.historyUrl) {
            flushPending();
            return;
        }

        fetch(cfg.historyUrl, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin'
        }).then(function (res) {
            return res.json();
        }).then(function (json) {
            if (json && json.status === 'success' && json.data && json.data.length) {
                for (var i = 0; i < json.data.length; i++) {
                    addMessage(json.data[i], { silent: true });
                }
            }
        }).catch(function () {
            /* Riwayat gagal dimuat (Redis mati / offline) -> chat realtime
               tetap jalan, cukup diam supaya tidak mengganggu. */
        }).then(function () {
            flushPending();
            body.scrollTop = body.scrollHeight;
        });
    }

    /* --- Kirim pesan (lewat server) --------------------------------------- */
    function sendMessage() {
        var message = input.value.trim();
        if (!message) return;

        var params = new URLSearchParams();
        params.append('message', message);

        var headers = { 'X-Requested-With': 'XMLHttpRequest' };
        headers[cfg.csrfHeader] = csrfToken;

        input.value = '';

        fetch(cfg.sendUrl, {
            method: 'POST',
            headers: headers,
            body: params
        }).then(function (res) {
            return res.json();
        }).then(function (json) {
            if (json && json.csrf) {
                csrfToken = json.csrf;
            }
            if (!json || json.status !== 'success') {
                addSystem((json && json.message) || 'Gagal mengirim pesan.');
            }
            /* Pesan muncul dari broadcast server (onmessage), tidak di-append
               lokal supaya konsisten dengan client lain. */
        }).catch(function () {
            addSystem('Gagal terhubung ke server.');
        });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        sendMessage();
    });

    /* Sapaan dulu (paling atas), lalu riwayat, baru koneksi realtime. */
    showWelcome();
    loadHistory();
    connect();
})();
