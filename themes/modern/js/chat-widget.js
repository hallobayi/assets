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
 * Konfigurasi dibaca dari atribut data-* pada #chatWidget yang dirender
 * server (footer.php):
 *   data-key, data-ws-host, data-ws-port, data-force-tls, data-channel,
 *   data-event, data-send-url, data-csrf-header, data-csrf-token, data-me,
 *   data-title, data-welcome
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

    /* --- Buka / tutup ----------------------------------------------------- */
    function isOpen() {
        return root.classList.contains('cw--open');
    }

    function open() {
        root.classList.add('cw--open');
        root.classList.remove('cw--closed');
        unread = 0;
        renderBadge();
        if (!welcomed && cfg.welcome) {
            welcomed = true;
            addSystem(cfg.welcome);
        }
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

    function addMessage(msg) {
        var mine = (msg.username || '') === cfg.me;
        var html = '';
        if (!mine) {
            html += '<div class="cw__name">' + escapeHtml(msg.username || '') + '</div>';
        }
        html += escapeHtml(msg.message || '');
        html += '<span class="cw__time">' + escapeHtml(msg.time || currentTime()) + '</span>';
        appendBubble(html, mine ? 'cw__msg--self' : '');

        if (!isOpen() && !mine) {
            unread += 1;
            renderBadge();
        }
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
                        addMessage(data);
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

    connect();
})();
