    var CodePageType = 'PT210'; // 'GENERAL'

    // ***************************************************
    //  LIBs
    // ***************************************************

    function RawBtTransport() {
        this.send = function(prn){
            S = "#Intent;scheme=rawbt;";
            P = "package=ru.a402d.rawbtprinter;end;";
            textEncoded = "base64," + btoa(unescape(prn));
            window.location.href = "intent:" + textEncoded + S + P;
        };

        return this;
    }


    function EscPosDriver() {
        this.defaultCodePages = {
            'CP437': 0,
            'CP932': 1,
            'CP850': 2,
            'CP860': 3,
            'CP863': 4,
            'CP865': 5,
            'CP857': 13,
            'CP737': 14,
            'ISO_8859-7': 15,
            'CP1252': 16,
            'CP866': 17,
            'CP852': 18,
            'CP858': 19,
            'ISO88596': 22,
            'WINDOWS1257': 25,
            'CP864': 28,
            'WINDOWS1255': 32,
            'CP861': 56,
            'CP855': 60,
            'CP862': 62,
            'CP869': 66,
            'WINDOWS1250': 72,
            'WINDOWS1251': 73,
            'WINDOWS1253': 90,
            'WINDOWS1254': 91,
            'WINDOWS1256': 92,
            'WINDOWS1258': 94,
            'CP775': 95,
            'CP874': 255,
            'GBK': -1
        };

        this.goojprtCodePages = {
            "CP437":"0",
            "CP932":"1",
            "CP850":"2",
            "CP860":"3",
            "CP863":"4",
            "CP865":"5",
            "CP1251":"6",
            "CP866":"7",
            "CP775":"9",
            "CP862":"15",
            "CP1252":"16",
            "WINDOWS1253":"17",
            "CP852":"18",
            "CP858":"19",
            "CP864":"22",
            "CP737":"24",
            "WINDOWS1257":"25",
            "CP85":"29",
            "WINDOWS1256":"34",
            "CP874":"47",
            'GBK': "-1"
        };


        function intval (mixedVar, base) {
            var tmp, match

            var type = typeof mixedVar

            if (type === 'boolean') {
                return +mixedVar
            } else if (type === 'string') {
                if (base === 0) {
                    match = mixedVar.match(/^\s*0(x?)/i)
                    base = match ? (match[1] ? 16 : 8) : 10
                }
                tmp = parseInt(mixedVar, base || 10)
                return (isNaN(tmp) || !isFinite(tmp)) ? 0 : tmp
            } else if (type === 'number' && isFinite(mixedVar)) {
                return mixedVar < 0 ? Math.ceil(mixedVar) : Math.floor(mixedVar)
            } else {
                return 0
            }
        }

        function chr(x) {
            x = intval(x);
            hexString = x.toString(16);
            if (hexString.length % 2) {
                hexString = '0' + hexString;
            }
            return "%" + hexString;
        }

        this.encodeByte = function(b){
            return chr(b);
        };

        const LF = chr(10);
        const CR = chr(13);
        const ESC = chr(27);
        const FS = chr(28);
        const GS = chr(29);
        const ON = '1';
        const OFF = '0';

        this.lf = function (lines) {
            if (lines === undefined || lines < 2) {
                return LF + CR;
            } else {
                return ESC + "d" + chr(lines);
            }
        };

        this.alignment = function (aligment) {
            return ESC + "a" + chr(aligment);
        };

        this.cut = function (mode, lines) {
            return GS + "V" + chr(mode) + chr(lines);
        };

        this.feedForm = function () {
            return chr(12);
        };

        /**
         * Some slip printers require `ESC q` sequence to release the paper.
         */
        this.release = function () {
            return ESC + chr(113);
        };


        this.feedReverse = function (lines) {
            return ESC + 'e' + chr(1 * lines);
        };

        this.setPrintMode = function (mode) {
            return ESC + "!" + chr(1 * mode);
        };

        this.barcode = function (content, type) {
            return GS + "k" + chr(1 * type) + chr(content.length) + content;
        };

        this.setBarcodeHeight = function (height) {
            return GS + "h" + chr(1 * height);
        };

        this.setBarcodeWidth = function (width) {
            return GS + "w" + chr(1 * width);
        };

        this.setBarcodeTextPosition = function (position) {
            return GS + "H" + chr(1 * position);
        };

        this.emphasis = function (mode) {
            return ESC + "E" + (mode ? ON : OFF);
        };

        this.underline = function (mode) {
            return ESC + "-" + chr(1 * mode);
        };

        this.initialize = function () {
            return ESC + '@';
        };

        this.setCharacterTable = function (number) {
            if(number<0){
              return FS+ '&';
            }
            return FS+ '.'+ ESC + "t" + chr(1 * number);

        };

        this.setDefaultCharacterTable = function (cpname) {
            if(CodePageType=='PT210'){
             return this.setCharacterTable(this.goojprtCodePages[cpname]);
            }
            return this.setCharacterTable(this.defaultCodePages[cpname]);
        };


        this.wrapperSend2dCodeData = function(fn, cn, data, m ){
            if(data===undefined){
                data='';
            }
            if(m===undefined){
                m='';
            }
            n=data.length+m.length+2;
            header = chr(n%256)+chr(n/256);
            return GS+"(k"+header+cn+fn+m+data;
        };

        this.qrCode = function(code,ec,size,model){
            r = '';
            cn = '1'; // Code type for QR code
            // Select model: 1, 2 or micro.
            r +=  this.wrapperSend2dCodeData(String.fromCharCode(65), cn, String.fromCharCode(48 + 1*model) + String.fromCharCode(0));
            // Set dot size.
            r += this.wrapperSend2dCodeData(String.fromCharCode(67), cn, String.fromCharCode(1*size));
            // Set error correction level: L, M, Q, or H
            r += this.wrapperSend2dCodeData(String.fromCharCode(69), cn, String.fromCharCode(48 + 1*ec));
            // Send content & print
            r += this.wrapperSend2dCodeData(String.fromCharCode(80), cn, code, '0');
            r += this.wrapperSend2dCodeData(String.fromCharCode(81), cn, '', '0');

            return r;
        };

        return this;
    }

    function PosPrinterJob(driver, transport) {
        /**
         * @type EscPosDriver
         */
        this.driver = driver;

        /**
         * @type RawBtTransport
         */
        this.transport = transport;


        this.buffer = [];


        // ----------------------------------
        //  CONFIGURE
        // ----------------------------------
        this.encoding = 'CP437';
        this.characterTable = 0;

        this.setEncoding = function (encoding) {
            this.encoding = encoding;
            this.buffer.push(this.driver.setDefaultCharacterTable(encoding.toUpperCase()));
            return this;
        };
        this.setCharacterTable = function (number) {
            this.characterTable = number;
            this.buffer.push(this.driver.setCharacterTable(number));
            return this;
        };


        // ----------------------------------
        //  SEND TO PRINT
        // ----------------------------------

        this.execute = function () {
            this.transport.send(this.buffer.join(''));
            return this;
        };

        // ----------------------------------
        //  HIGH LEVEL FUNCTION
        // ----------------------------------

        this.initialize = function () {
            this.buffer.push(this.driver.initialize());
            return this;
        };


        /**
         *
         * @param {string} string
         */
        this.print = function (string, encoding) {
            bytes = iconv.encode(string, encoding || this.encoding);
            s = '';
            self = this;
            for(i = 0; i< bytes.length; i++ ){
                s = s + self.driver.encodeByte(bytes[i]);
            }
            this.buffer.push(s);
            return this;
        };

        /**
         *
         * @param {string} string
         */
        this.printLine = function (string, encoding) {
            this.print(string, encoding);
            this.buffer.push(this.driver.lf());
            return this;
        };


        this.printText = function (text, aligment, size) {
            if (aligment === undefined) {
                aligment = this.ALIGNMENT_LEFT;
            }
            if (size === undefined) {
                size = this.FONT_SIZE_NORMAL;
            }
            this.setAlignment(aligment);
            this.setPrintMode(size);
            this.printLine(text);
            return this;
        };


        // ----------------------------------
        //  FONTS
        // ----------------------------------

        // user friendly names
        this.FONT_SIZE_SMALL = 1;
        this.FONT_SIZE_NORMAL = 0;
        this.FONT_SIZE_MEDIUM1 = 33;
        this.FONT_SIZE_MEDIUM2 = 16;
        this.FONT_SIZE_MEDIUM3 = 49;
        this.FONT_SIZE_BIG = 48; // BIG

        // bits for ESC !
        this.FONT_A = 0; // A
        this.FONT_B = 1; // B
        this.FONT_EMPHASIZED = 8;
        this.FONT_DOUBLE_HEIGHT = 16;
        this.FONT_DOUBLE_WIDTH = 32;
        this.FONT_ITALIC = 64;
        this.FONT_UNDERLINE = 128;

        this.setPrintMode = function (mode) {
            this.buffer.push(this.driver.setPrintMode(mode));
            return this;
        };


        this.setEmphasis = this.emphasis = function (mode) {
            this.buffer.push(this.driver.emphasis(mode));
            return this;
        };

        this.bold = function (on) {
            if (on === undefined) {
                on = true;
            }
            this.buffer.push(this.driver.emphasis(on));
            return this;
        };

        this.UNDERLINE_NONE = 0;
        this.UNDERLINE_SINGLE = 1;
        this.UNDERLINE_DOUBLE = 2;

        this.underline = function (mode) {
            if (mode === true || mode === undefined) {
                mode = this.UNDERLINE_SINGLE;
            } else if (mode === false) {
                mode = this.UNDERLINE_NONE;
            }
            this.buffer.push(this.driver.underline(mode));
            return this;
        };


        // ----------------------------------
        //  ALIGNMENT
        // ----------------------------------

        this.ALIGNMENT_LEFT = 0;
        this.ALIGNMENT_CENTER = 1;
        this.ALIGNMENT_RIGHT = 2;

        this.setAlignment = function (aligment) {
            if (aligment === undefined) {
                aligment = this.ALIGNMENT_LEFT;
            }

            this.buffer.push(this.driver.alignment(aligment));
            return this;
        };


        // ----------------------------------
        //  BARCODE
        // ----------------------------------

        this.BARCODE_UPCA = 65;
        this.BARCODE_UPCE = 66;
        this.BARCODE_JAN13 = 67;
        this.BARCODE_JAN8 = 68;
        this.BARCODE_CODE39 = 69;
        this.BARCODE_ITF = 70;
        this.BARCODE_CODABAR = 71;
        this.BARCODE_CODE93 = 72;
        this.BARCODE_CODE128 = 73;

        this.printBarCode = function (content, type) {
            if (type === undefined) {
                type = this.BARCODE_CODE39;
            }
            this.buffer.push(this.driver.barcode(content, type));
            return this;
        };

        /**
         * Set barcode height.
         *
         * height Height in dots. If not specified, 8 will be used.
         */
        this.setBarcodeHeight = function (height) {
            if (height === undefined) {
                height = 30;
            }
            this.buffer.push(this.driver.setBarcodeHeight(height));
            return this;
        };

        /**
         * Set barcode bar width.
         *
         * width Bar width in dots. If not specified, 3 will be used.
         *  Values above 6 appear to have no effect.
         */
        this.setBarcodeWidth = function (width) {
            if (width === undefined) {
                width = 3;
            }
            this.buffer.push(this.driver.setBarcodeWidth(width));
            return this;
        };


        /**
         * Indicates that HRI (human-readable interpretation) text should not be
         * printed, when used with Printer::setBarcodeTextPosition
         */
        this.BARCODE_TEXT_NONE = 0;
        /**
         * Indicates that HRI (human-readable interpretation) text should be printed
         * above a barcode, when used with Printer::setBarcodeTextPosition
         */
        this.BARCODE_TEXT_ABOVE = 1;
        /**
         * Indicates that HRI (human-readable interpretation) text should be printed
         * below a barcode, when used with Printer::setBarcodeTextPosition
         */
        this.BARCODE_TEXT_BELOW = 2;


        /**
         * Set the position for the Human Readable Interpretation (HRI) of barcode characters.
         *
         * position. Use Printer::BARCODE_TEXT_NONE to hide the text (default),
         *  or any combination of Printer::BARCODE_TEXT_ABOVE and Printer::BARCODE_TEXT_BELOW
         *  flags to display the text.
         */
        this.setBarcodeTextPosition = function (position) {
            if (position === undefined) {
                position = this.BARCODE_TEXT_NONE;
            }
            this.buffer.push(this.driver.setBarcodeTextPosition(position));
            return this;
        };

        // ----------------------------------
        //  QRCODE
        // ----------------------------------

        this.QR_ECLEVEL_L = 0;
        this.QR_ECLEVEL_M = 1;
        this.QR_ECLEVEL_Q = 2;
        this.QR_ECLEVEL_H = 3;

        this.QR_SIZES_1 = 1;
        this.QR_SIZES_2 = 2;
        this.QR_SIZES_3 = 3;
        this.QR_SIZES_4 = 4;
        this.QR_SIZES_5 = 5;
        this.QR_SIZES_6 = 6;
        this.QR_SIZES_7 = 7;
        this.QR_SIZES_8 = 8;

        this.QR_MODEL_1 = 1;
        this.QR_MODEL_2 = 2;
        this.QR_MICRO = 3;

        this.printQrCode = function (code, ec, size, model) {
            if(ec === undefined){
                ec = this.QR_ECLEVEL_L;
            }
            if(size === undefined){
                size = this.QR_SIZES_3;
            }
            if(model === undefined){
                model = this.QR_MODEL_2;
            }

            this.buffer.push(this.driver.qrCode(code,ec, size, model));
            return this;
        };


        /**
         * Make a full cut, when used with Printer::cut
         */
        this.CUT_FULL = 65;
        /**
         * Make a partial cut, when used with Printer::cut
         */
        this.CUT_PARTIAL = 66;

        this.cut = function(mode,lines){
            if (mode === undefined) {
                mode = this.CUT_FULL;
            }
            if (lines === undefined) {
                lines = 3;
            }
            this.buffer.push(this.driver.cut(mode, lines));
            return this;
        };

        /**
         * Print and feed line / Print and feed n lines.
         *
         */
        this.feed = this.lf = function (lines) {
            this.buffer.push(this.driver.lf(lines));
            return this;
        };

        /**
         * Some printers require a form feed to release the paper. On most printers, this
         * command is only useful in page mode, which is not implemented in this driver.
         */
        this.feedForm = function () {
            this.buffer.push(this.driver.feedForm());
            return this;
        };


        /**
         * Some slip printers require `ESC q` sequence to release the paper.
         */
        this.release = function () {
            this.buffer.push(this.driver.relese());
            return this;
        };

        /**
         * Print and reverse feed n lines.
         */
        this.feedReverse = function (lines) {
            if (lines === undefined) {
                lines = 1;
            }
            this.buffer.push(this.driver.feedReverse(lines));
            return this;
        };

        // ---------------------------------
        //  SHORT SYNTAX
        // ---------------------------------

        // alignment

        this.left = function () {
            this.buffer.push(this.driver.alignment(this.ALIGNMENT_LEFT));
            return this;
        };

        this.right = function () {
            this.buffer.push(this.driver.alignment(this.ALIGNMENT_RIGHT));
            return this;
        };

        this.center = function () {
            this.buffer.push(this.driver.alignment(this.ALIGNMENT_CENTER));
            return this;
        };


        return this;
    }


    // ==================================================
    // MAIN
    // ===================================================


    function getCurrentTransport() {
       return new RawBtTransport();
    }

    function getCurrentDriver() {
        return new EscPosDriver();
    }




    const countryNames = {
        // 'hy': 'Армянский',
        'sq': 'Albanian',
//        'ar': 'Arabic',
//        'bn': 'Bengali',
        'bg': 'Bulgarian',
        'ca': 'Catalan',
        'zh': 'Chinese',
        'hr': 'Croatian',
        'cs': 'Czech',
        'da': 'Danish',
        'nl': 'Dutch',
        'en': 'English',
        'et': 'Estonian',
        'fi': 'Finnish (Suomi)',
        'fr': 'French',
        'de': 'Deutsch',
        'el': 'Greek',
//        'hi': 'Hindi',
        'hu': 'Hungarian',
        'it': 'Italian',
        'id': 'Indonesian',
        'lt': 'Lithuanian',
        'ms': 'Malay',
        'no': 'Norwegian',
        'pl': 'Polish',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'sk': 'Slovak',
        'sl': 'Slovenian',
        'es': 'Spanish',
        'sv': 'Swedish',
        'th': 'Thai',
        'tr': 'Turkish',
        'uk': 'Ukrainian'
    };

    const defaultCP = {
           // 'hy': 'ArmSCII8',
            'zh': 'GBK',
            'sq': 'cp858',
            'bg': 'cp866',
            'ca': 'cp437',
            'hr': 'cp1252',
            'cs': 'cp1252',
            'da': 'cp858',
            'nl': 'cp858',
            'et': 'cp858',
            'fi': 'cp858',
            'fr': 'cp858',
            'de': 'cp858',
            'el': 'windows1253',
            'hu': 'cp852',
            'id': 'cp437',
            'it': 'cp858',
            'lt': 'cp852',
            'ms': 'cp437',
            'no': 'cp858',
            'pl': 'cp852',
            'pt': 'cp858',
            'ru': 'cp866',
            'sk': 'cp852',
            'sl': 'cp852',
            'es': 'cp858',
            'sv': 'cp858',
            'th': 'cp874',
            'tr': 'cp857',
            'uk': 'cp866',
            'en': 'cp437'
    };

    // ------------------------------------------------------
    // DEMO
    // ------------------------------------------------------

    function alignDemo() {

        var c = new PosPrinterJob(getCurrentDriver(), getCurrentTransport());
        c.initialize();

        c.printText("Text align:", c.ALIGNMENT_LEFT, c.FONT_SIZE_BIG);
        c.printText("Left aligned", c.ALIGNMENT_LEFT);
        c.printText("Center aligned", c.ALIGNMENT_CENTER);
        c.printText("Right aligned", c.ALIGNMENT_RIGHT);
        c.center().print('center()').lf().right().print('right()').lf().left().print('left()').lf();

        c.feed(2);
        c.execute();
    }

    function decorDemo() {
        var c = new PosPrinterJob(getCurrentDriver(), getCurrentTransport());
        c.initialize();

        c.printText("Font decoration:", c.ALIGNMENT_LEFT, c.FONT_SIZE_BIG);
        c.printText("underline text as ESC !", c.ALIGNMENT_LEFT, c.FONT_UNDERLINE);
        c.underline(c.UNDERLINE_SINGLE).print(' one dot underline ').underline(c.UNDERLINE_DOUBLE).lf().print(' double dots underline ').underline(c.UNDERLINE_NONE).lf();
        c.printText("emphasized text as ESC !", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED);
        c.emphasis(true).print('Emphasis TEXT').emphasis(false).printLine(' and bold off text');
        c.feed(2);
        c.execute();
    }

    function fontDemo() {
        var c = new PosPrinterJob(getCurrentDriver(), getCurrentTransport());
        c.initialize();

        c.printText("Font sizes:", c.ALIGNMENT_LEFT, c.FONT_SIZE_BIG);
        c.printText("small FONT", c.ALIGNMENT_LEFT, c.FONT_SIZE_SMALL);
        c.printText("medium 1 FONT", c.ALIGNMENT_LEFT, c.FONT_SIZE_MEDIUM1);
        c.printText("medium 2 FONT", c.ALIGNMENT_LEFT, c.FONT_SIZE_MEDIUM2);
        c.printText("medium 3 FONT", c.ALIGNMENT_LEFT, c.FONT_SIZE_MEDIUM3);
        c.printText("big FONT", c.ALIGNMENT_LEFT, c.FONT_SIZE_BIG);
        c.printText("double WIDTH", c.ALIGNMENT_LEFT, c.FONT_DOUBLE_WIDTH);
        c.printText("double HEIGHT", c.ALIGNMENT_LEFT, c.FONT_DOUBLE_HEIGHT);
        c.setPrintMode(c.FONT_SIZE_BIG + c.FONT_UNDERLINE).printLine("Example");
        c.feed(3);

        c.execute();
    }

    function encodingDemo() {
        var c = new PosPrinterJob(getCurrentDriver(), getCurrentTransport());
        c.initialize();

        c.setEncoding(defaultCP['en']);
        c.printText("Chines", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED).bold(false);
        c.setEncoding(defaultCP['zh']).printLine("恭喜您!\n您已经成功的连接上了我们的便携式蓝牙打印机！", "GBK");

        c.setEncoding(defaultCP['en']);
        c.printText("Indonesian", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED).bold(false);
        c.setEncoding(defaultCP['id']).printLine("Kamu gimana kabarnya? Terima kasih", "cp437");

        c.setEncoding(defaultCP['en']);
        c.printText("Portugal", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED).bold(false);
        c.setEncoding(defaultCP['pt']).printLine("Luís argüia à Júlia que «brações, fé, chá, óxido, pôr, zângão» eram palavras do português", "cp860");

        c.setEncoding(defaultCP['en']);
        c.printText("Spanish", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED).bold(false);
        c.setEncoding(defaultCP['es']).printLine("El pingüino Wenceslao hizo kilómetros bajo exhaustiva lluvia y frío, añoraba a su querido cachorro.", "cp437");


        c.setEncoding(defaultCP['en']);
        c.printText("Danish", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED).bold(false);
        c.setEncoding(defaultCP['da']).printLine("Quizdeltagerne spiste jordbær med fløde, mens cirkusklovnen Wolther spillede på xylofon.", "cp850");

        c.setEncoding(defaultCP['en']);
        c.printText("German", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED).bold(false);
        c.setEncoding(defaultCP['de']).printLine("Falsches Üben von Xylophonmusik quält jeden größeren Zwerg.", "cp850");

        c.setEncoding(defaultCP['en']);
        c.printText("Greek", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED).bold(false);
        c.setEncoding(defaultCP['el']).printLine("Ξεσκεπάζω την ψυχοφθόρα βδελυγμία", "cp737");


        c.setEncoding(defaultCP['en']);
        c.printText("French", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED).bold(false);
        c.setEncoding(defaultCP['fr']).printLine("Le cœur déçu mais l'âme plutôt naïve, Louÿs rêva de crapaüter en canoë au delà des îles, près du mälström où brûlent les novæ.", "cp1252");

//        c.printText("Irish Gaelic", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED).bold(false);
//        c.setCharacterTable(16).printLine("D'fhuascail Íosa, Úrmhac na hÓighe Beannaithe, pór Éava agus Ádhaimh.", "cp1252");

        c.setEncoding(defaultCP['en']);
        c.printText("Hungarian", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED).bold(false);
        c.setEncoding(defaultCP['hu']).printLine("Árvíztűrő tükörfúrógép.", "cp852");

//        c.printText("Icelandic", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED).bold(false);
//        c.setCharacterTable(2).printLine("Kæmi ný öxi hér ykist þjófum nú bæði víl og ádrepa.", "cp850");

        c.setEncoding(defaultCP['en']);
        c.printText("Latvian", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED).bold(false);
        c.setEncoding(defaultCP['lt']).printLine("Glāžšķūņa rūķīši dzērumā čiepj Baha koncertflīģeļu vākus.", "cp1257");

        c.setEncoding(defaultCP['en']);
        c.printText("Polish", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED).bold(false);
        c.setEncoding(defaultCP['pl']).printLine("Pchnąć w tę łódź jeża lub ośm skrzyń fig.", "cp1257");

        c.setEncoding(defaultCP['en']);
        c.printText("Russian", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED).bold(false);
        c.setEncoding(defaultCP['ru']).printLine("В чащах юга жил бы цитрус? Да, но фальшивый экземпляр!", "cp866");

        c.setEncoding(defaultCP['en']);
        c.printText("Turkish", c.ALIGNMENT_LEFT, c.FONT_EMPHASIZED).bold(false);
        c.setEncoding(defaultCP['tr']).printLine("Pijamalı hasta, yağız şoföre çabucak güvendi.", "cp857");

        c.feed(3);
        c.execute();
    }

    function pangrams(lang) {
        switch (lang) {
            // case 'hy': return 'Կրնամ ապակի ուտել և ինծի անհանգիստ չըներ։';
            case 'sq':
                return 'Unë mund të ha qelq dhe nuk më gjen gjë.';
            case 'bg':
                return 'Мога да ям стъкло, то не ми вреди.';
            case 'ca':
                return 'Puc menjar vidre, que no em fa mal.';
            case 'hr':
                return 'Ja mogu jesti staklo, i to mi ne šteti.';
            case 'cs':
                return 'Mohu jíst sklo, neublíží mi.';
            case 'da':
                return 'Jeg kan spise glas, det gør ikke ondt på mig.';
            case 'nl':
                return 'Ik kan glas eten, het doet mĳ geen kwaad.';
            case 'et':
                return 'Ma võin klaasi süüa, see ei tee mulle midagi.';
            case 'ph':
                return '-unknown-';
            case 'fi':
                return 'Voin syödä lasia, se ei vahingoita minua.';
            case 'fr':
                return 'Je peux manger du verre, ça ne me fait pas mal.';
            case 'ka':
                return 'მინას ვჭამ და არა მტკივა.';
            case 'de':
                return 'Ich kann Glas essen, ohne mir zu schaden.';
            case 'el':
                return 'Μπορώ να φάω σπασμένα γυαλιά χωρίς να πάθω τίποτα.';
            case 'hi':
                return 'मैं काँच खा सकता हूँ, मुझे उस से कोई पीडा नहीं होती.';
            case 'hu':
                return 'Árvíztűrő tükörfúrógép.';
            case 'id':
                return 'Cwm fjordbank glyphs vext quiz.';
            case 'it':
                return 'Posso mangiare il vetro e non mi fa male.';
            case 'lv':
                return 'Es varu ēst stiklu, tas man nekaitē.';
            case 'lt':
                return 'Aš galiu valgyti stiklą ir jis manęs nežeidžia';
            case 'mk':
                return 'Можам да јадам стакло, а не ме штета.';
            case 'ms':
                return 'Saya boleh makan kaca dan ia tidak mencederakan saya.';
            case 'no':
                return 'Eg kan eta glas utan å skada meg. Jeg kan spise glass uten å skade meg.';
            case 'pl':
                return 'Pchnąć w tę łódź jeża lub ośm skrzyń fig.';
            case 'pt':
                return 'O próximo vôo à noite sobre o Atlântico, põe freqüentemente o único médico.';
            case 'ro':
                return 'Pot să mănânc sticlă și ea nu mă rănește.';
            case 'ru':
                return 'В чащах юга жил бы цитрус? Да, но фальшивый экземпляр!';
            case 'sr':
                return 'Ја могу јести стакло, и то ми не штети. Ja mogu jesti staklo, i to mi ne šteti.';
            case 'sk':
                return 'Starý kôň na hŕbe kníh žuje tíško povädnuté ruže, na stĺpe sa ďateľ učí kvákať novú ódu o živote.';
            case 'sl':
                return 'Lahko jem steklo, ne da bi mi škodovalo.';
            case 'es':
                return 'Puedo comer vidrio, no me hace daño.';
            case 'sv':
                return 'Jag kan äta glas utan att skada mig.';
            case 'th':
                return 'ฉันกินกระจกได้ แต่มันไม่ทำให้ฉันเจ็บ';
            case 'tr':
                return 'Pijamalı hasta, yağız şoföre çabucak güvendi.';
            case 'uk':
                return 'Чуєш їх, доцю, га? Кумедна ж ти, прощайся без ґольфів!';
            case 'vi':
                return 'Tôi có thể ăn thủy tinh mà không hại gì.';

            case 'en':
            default:
                return 'A quick brown fox jumps over the lazy dog';

        }
    }
    function loremIpsum(lang) {
        switch (lang) {
            // case 'hy':  return 'Lorem Ipsum-ը տպագրության և տպագրական արդյունաբերության համար նախատեսված մոդելային տեքստ է: Սկսած 1500-ականներից` Lorem Ipsum-ը հանդիսացել է տպագրական արդյունաբերության ստանդարտ մոդելային տեքստ, ինչը մի անհայտ տպագրիչի կողմից տարբեր տառատեսակների օրինակների գիրք ստեղծելու ջանքերի արդյունք է: Այս տեքստը ոչ միայն կարողացել է գոյատևել հինգ դարաշրջան, այլև ներառվել է էլեկտրոնային տպագրության մեջ` մնալով էապես անփոփոխ: Այն հայտնի է դարձել 1960-ականներին Lorem Ipsum բովանդակող Letraset էջերի թողարկման արդյունքում, իսկ ավելի ուշ համակարգչային տպագրության այնպիսի ծրագրերի թողարկման հետևանքով, ինչպիսին է Aldus PageMaker-ը, որը ներառում է Lorem Ipsum-ի տարատեսակներ:';
            case 'sq':
                return 'Lorem Ipsum është një tekst shabllon i industrisë së printimit dhe shtypshkronjave. Lorem Ipsum ka qenë teksti shabllon i industrisë që nga vitet 1500, kur një shtypës i panjohur morri një galeri shkrimesh dhe i ngatërroi për të krijuar një libër mostër. Teksti i ka mbijetuar jo vetëm pesë shekujve, por edhe kalimit në shtypshkrimin elektronik, duke ndenjur në thelb i pandryshuar. U bë i njohur në vitet 1960 me lëshimin e letrave \'Letraset\' që përmbanin tekstin Lorem Ipsum, e në kohët e fundit me aplikacione publikimi si Aldus PageMaker që përmbajnë versione të Lorem Ipsum.';
            case 'bg':
                return 'Lorem Ipsum е елементарен примерен текст, използван в печатарската и типографската индустрия. Lorem Ipsum е индустриален стандарт от около 1500 година, когато неизвестен печатар взема няколко печатарски букви и ги разбърква, за да напечата с тях книга с примерни шрифтове. Този начин не само е оцелял повече от 5 века, но е навлязъл и в публикуването на електронни издания като е запазен почти без промяна. Популяризиран е през 60те години на 20ти век със издаването на Letraset листи, съдържащи Lorem Ipsum пасажи, популярен е и в наши дни във софтуер за печатни издания като Aldus PageMaker, който включва различни версии на Lorem Ipsum.';
            case 'ca':
                return 'Lorem Ipsum és un text de farciment usat per la indústria de la tipografia i la impremta. Lorem Ipsum ha estat el text estàndard de la indústria des de l\'any 1500, quan un impressor desconegut va fer servir una galerada de text i la va mesclar per crear un llibre de mostres tipogràfiques. No només ha sobreviscut cinc segles, sinó que ha fet el salt cap a la creació de tipus de lletra electrònics, romanent essencialment sense canvis. Es va popularitzar l\'any 1960 amb el llançament de fulls Letraset que contenien passatges de Lorem Ipsum, i més recentment amb programari d\'autoedició com Aldus Pagemaker que inclou versions de Lorem Ipsum.';
            case 'hr':
                return 'Lorem Ipsum je jednostavno probni tekst koji se koristi u tiskarskoj i slovoslagarskoj industriji. Lorem Ipsum postoji kao industrijski standard još od 16-og stoljeća, kada je nepoznati tiskar uzeo tiskarsku galiju slova i posložio ih da bi napravio knjigu s uzorkom tiska. Taj je tekst ne samo preživio pet stoljeća, već se i vinuo u svijet elektronskog slovoslagarstva, ostajući u suštini nepromijenjen. Postao je popularan tijekom 1960-ih s pojavom Letraset listova s odlomcima Lorem Ipsum-a, a u skorije vrijeme sa software-om za stolno izdavaštvo kao što je Aldus PageMaker koji također sadrži varijante Lorem Ipsum-a.';
            case 'cs':
                return 'Lorem Ipsum je demonstrativní výplňový text používaný v tiskařském a knihařském průmyslu. Lorem Ipsum je považováno za standard v této oblasti už od začátku 16. století, kdy dnes neznámý tiskař vzal kusy textu a na jejich základě vytvořil speciální vzorovou knihu. Jeho odkaz nevydržel pouze pět století, on přežil i nástup elektronické sazby v podstatě beze změny. Nejvíce popularizováno bylo Lorem Ipsum v šedesátých letech 20. století, kdy byly vydávány speciální vzorníky s jeho pasážemi a později pak díky počítačovým DTP programům jako Aldus PageMaker.';
            case 'da':
                return 'Lorem Ipsum er ganske enkelt fyldtekst fra print- og typografiindustrien. Lorem Ipsum har været standard fyldtekst siden 1500-tallet, hvor en ukendt trykker sammensatte en tilfældig spalte for at trykke en bog til sammenligning af forskellige skrifttyper. Lorem Ipsum har ikke alene overlevet fem århundreder, men har også vundet indpas i elektronisk typografi uden væsentlige ændringer. Sætningen blev gjordt kendt i 1960\'erne med lanceringen af Letraset-ark, som indeholdt afsnit med Lorem Ipsum, og senere med layoutprogrammer som Aldus PageMaker, som også indeholdt en udgave af Lorem Ipsum.';
            case 'nl':
                return 'Lorem Ipsum is slechts een proeftekst uit het drukkerij- en zetterijwezen. Lorem Ipsum is de standaard proeftekst in deze bedrijfstak sinds de 16e eeuw, toen een onbekende drukker een zethaak met letters nam en ze door elkaar husselde om een font-catalogus te maken. Het heeft niet alleen vijf eeuwen overleefd maar is ook, vrijwel onveranderd, overgenomen in elektronische letterzetting. Het is in de jaren \'60 populair geworden met de introductie van Letraset vellen met Lorem Ipsum passages en meer recentelijk door desktop publishing software zoals Aldus PageMaker die versies van Lorem Ipsum bevatten.';
            case 'et':
                return 'Lorem Ipsum on lihtsalt proovitekst, mida kasutatakse printimis- ja ladumistööstuses. See on olnud tööstuse põhiline proovitekst juba alates 1500. aastatest, mil tundmatu printija võttis hulga suvalist teksti, et teha trükinäidist. Lorem Ipsum ei ole ainult viis sajandit säilinud, vaid on ka edasi kandunud elektroonilisse trükiladumisse, jäädes sealjuures peaaegu muutumatuks. See sai tuntuks 1960. aastatel Letraset\'i lehtede väljalaskmisega, ja hiljuti tekstiredaktoritega nagu Aldus PageMaker, mis sisaldavad erinevaid Lorem Ipsumi versioone.';
            case 'ph':
                return 'Ang Lorem Ipsum ay ginagamit na modelo ng industriya ng pagpriprint at pagtytypeset. Ang Lorem Ipsum ang naging regular na modelo simula pa noong 1500s, noong may isang di kilalang manlilimbag and kumuha ng galley ng type at ginulo ang pagkaka-ayos nito upang makagawa ng libro ng mga type specimen. Nalagpasan nito hindi lang limang siglo, kundi nalagpasan din nito ang paglaganap ng electronic typesetting at nanatiling parehas. Sumikat ito noong 1960s kasabay ng pag labas ng Letraset sheets na mayroong mga talata ng Lorem Ipsum, at kamakailan lang sa mga desktop publishing software tulad ng Aldus Pagemaker ginamit ang mga bersyon ng Lorem Ipsum.';
            case 'fi':
                return 'Lorem Ipsum on yksinkertaisesti testausteksti, jota tulostus- ja ladontateollisuudet käyttävät. Lorem Ipsum on ollut teollisuuden normaali testausteksti jo 1500-luvulta asti, jolloin tuntematon tulostaja otti kaljuunan ja sekoitti sen tehdäkseen esimerkkikirjan. Se ei ole selvinnyt vain viittä vuosisataa, mutta myös loikan elektroniseen kirjoitukseen, jääden suurinpiirtein muuntamattomana. Se tuli kuuluisuuteen 1960-luvulla kun Letraset-paperiarkit, joissa oli Lorem Ipsum pätkiä, julkaistiin ja vielä myöhemmin tietokoneen julkistusohjelmissa, kuten Aldus PageMaker joissa oli versioita Lorem Ipsumista.';
            case 'fr':
                return 'Le Lorem Ipsum est simplement du faux texte employé dans la composition et la mise en page avant impression. Le Lorem Ipsum est le faux texte standard de l\'imprimerie depuis les années 1500, quand un imprimeur anonyme assembla ensemble des morceaux de texte pour réaliser un livre spécimen de polices de texte. Il n\'a pas fait que survivre cinq siècles, mais s\'est aussi adapté à la bureautique informatique, sans que son contenu n\'en soit modifié. Il a été popularisé dans les années 1960 grâce à la vente de feuilles Letraset contenant des passages du Lorem Ipsum, et, plus récemment, par son inclusion dans des applications de mise en page de texte, comme Aldus PageMaker.';
            case 'ka':
                return 'Lorem Ipsum საბეჭდი და ტიპოგრაფიული ინდუსტრიის უშინაარსო ტექსტია. იგი სტანდარტად 1500-იანი წლებიდან იქცა, როდესაც უცნობმა მბეჭდავმა ამწყობ დაზგაზე წიგნის საცდელი ეგზემპლარი დაბეჭდა. მისი ტექსტი არამარტო 5 საუკუნის მანძილზე შემორჩა, არამედ მან დღემდე, ელექტრონული ტიპოგრაფიის დრომდეც უცვლელად მოაღწია. განსაკუთრებული პოპულარობა მას 1960-იან წლებში გამოსულმა Letraset-ის ცნობილმა ტრაფარეტებმა მოუტანა, უფრო მოგვიანებით კი — Aldus PageMaker-ის ტიპის საგამომცემლო პროგრამებმა, რომლებშიც Lorem Ipsum-ის სხვადასხვა ვერსიები იყო ჩაშენებული.';
            case 'de':
                return 'Lorem Ipsum ist ein einfacher Demo-Text für die Print- und Schriftindustrie. Lorem Ipsum ist in der Industrie bereits der Standard Demo-Text seit 1500, als ein unbekannter Schriftsteller eine Hand voll Wörter nahm und diese durcheinander warf um ein Musterbuch zu erstellen. Es hat nicht nur 5 Jahrhunderte überlebt, sondern auch in Spruch in die elektronische Schriftbearbeitung geschafft (bemerke, nahezu unverändert). Bekannt wurde es 1960, mit dem erscheinen von "Letraset", welches Passagen von Lorem Ipsum enhielt, so wie Desktop Software wie "Aldus PageMaker" - ebenfalls mit Lorem Ipsum.';
            case 'el':
                return 'Το Lorem Ipsum είναι απλά ένα κείμενο χωρίς νόημα για τους επαγγελματίες της τυπογραφίας και στοιχειοθεσίας. Το Lorem Ipsum είναι το επαγγελματικό πρότυπο όσον αφορά το κείμενο χωρίς νόημα, από τον 15ο αιώνα, όταν ένας ανώνυμος τυπογράφος πήρε ένα δοκίμιο και ανακάτεψε τις λέξεις για να δημιουργήσει ένα δείγμα βιβλίου. Όχι μόνο επιβίωσε πέντε αιώνες, αλλά κυριάρχησε στην ηλεκτρονική στοιχειοθεσία, παραμένοντας με κάθε τρόπο αναλλοίωτο. Έγινε δημοφιλές τη δεκαετία του \'60 με την έκδοση των δειγμάτων της Letraset όπου περιελάμβαναν αποσπάσματα του Lorem Ipsum, και πιο πρόσφατα με το λογισμικό ηλεκτρονικής σελιδοποίησης όπως το Aldus PageMaker που περιείχαν εκδοχές του Lorem Ipsum.';
            case 'hi':
                return 'Lorem Ipsum छपाई और अक्षर योजन उद्योग का एक साधारण डमी पाठ है. Lorem Ipsum सन १५०० के बाद से अभी तक इस उद्योग का मानक डमी पाठ मन गया, जब एक अज्ञात मुद्रक ने नमूना लेकर एक नमूना किताब बनाई. यह न केवल पाँच सदियों से जीवित रहा बल्कि इसने इलेक्ट्रॉनिक मीडिया में छलांग लगाने के बाद भी मूलतः अपरिवर्तित रहा. यह 1960 के दशक में Letraset Lorem Ipsum अंश युक्त पत्र के रिलीज के साथ लोकप्रिय हुआ, और हाल ही में Aldus PageMaker Lorem Ipsum के संस्करणों सहित तरह डेस्कटॉप प्रकाशन सॉफ्टवेयर के साथ अधिक प्रचलित हुआ.';
            case 'hu':
                return 'A Lorem Ipsum egy egyszerû szövegrészlete, szövegutánzata a betûszedõ és nyomdaiparnak. A Lorem Ipsum az 1500-as évek óta standard szövegrészletként szolgált az iparban; mikor egy ismeretlen nyomdász összeállította a betûkészletét és egy példa-könyvet vagy szöveget nyomott papírra, ezt használta. Nem csak 5 évszázadot élt túl, de az elektronikus betûkészleteknél is változatlanul megmaradt. Az 1960-as években népszerûsítették a Lorem Ipsum részleteket magukbafoglaló Letraset lapokkal, és legutóbb softwarekkel mint például az Aldus Pagemaker.';
            case 'id':
                return 'Lorem Ipsum adalah contoh teks atau dummy dalam industri percetakan dan penataan huruf atau typesetting. Lorem Ipsum telah menjadi standar contoh teks sejak tahun 1500an, saat seorang tukang cetak yang tidak dikenal mengambil sebuah kumpulan teks dan mengacaknya untuk menjadi sebuah buku contoh huruf. Ia tidak hanya bertahan selama 5 abad, tapi juga telah beralih ke penataan huruf elektronik, tanpa ada perubahan apapun. Ia mulai dipopulerkan pada tahun 1960 dengan diluncurkannya lembaran-lembaran Letraset yang menggunakan kalimat-kalimat dari Lorem Ipsum, dan seiring munculnya perangkat lunak Desktop Publishing seperti Aldus PageMaker juga memiliki versi Lorem Ipsum.';
            case 'it':
                return 'Lorem Ipsum è un testo segnaposto utilizzato nel settore della tipografia e della stampa. Lorem Ipsum è considerato il testo segnaposto standard sin dal sedicesimo secolo, quando un anonimo tipografo prese una cassetta di caratteri e li assemblò per preparare un testo campione. È sopravvissuto non solo a più di cinque secoli, ma anche al passaggio alla videoimpaginazione, pervenendoci sostanzialmente inalterato. Fu reso popolare, negli anni ’60, con la diffusione dei fogli di caratteri trasferibili “Letraset”, che contenevano passaggi del Lorem Ipsum, e più recentemente da software di impaginazione come Aldus PageMaker, che includeva versioni del Lorem Ipsum.';
            case 'lv':
                return 'Lorem Ipsum – tas ir teksta salikums, kuru izmanto poligrāfijā un maketēšanas darbos. Lorem Ipsum ir kļuvis par vispārpieņemtu teksta aizvietotāju kopš 16. gadsimta sākuma. Tajā laikā kāds nezināms iespiedējs izveidoja teksta fragmentu, lai nodrukātu grāmatu ar burtu paraugiem. Tas ir ne tikai pārdzīvojis piecus gadsimtus, bet bez ievērojamām izmaiņām saglabājies arī mūsdienās, pārejot uz datorizētu teksta apstrādi. Tā popularizēšanai 60-tajos gados kalpoja Letraset burtu paraugu publicēšana ar Lorem Ipsum teksta fragmentiem un, nesenā pagātnē, tādas maketēšanas programmas kā Aldus PageMaker, kuras šablonu paraugos ir izmantots Lorem Ipsum teksts.';
            case 'lt':
                return 'Lorem ipsum - tai fiktyvus tekstas naudojamas spaudos ir grafinio dizaino pasaulyje jau nuo XVI a. pradžios. Lorem Ipsum tapo standartiniu fiktyviu tekstu, kai nežinomas spaustuvininkas atsitiktine tvarka išdėliojo raides atspaudų prese ir tokiu būdu sukūrė raidžių egzempliorių. Šis tekstas išliko beveik nepasikeitęs ne tik penkis amžius, bet ir įžengė i kopiuterinio grafinio dizaino laikus. Jis išpopuliarėjo XX a. šeštajame dešimtmetyje, kai buvo išleisti Letraset lapai su Lorem Ipsum ištraukomis, o vėliau -leidybinė sistema AldusPageMaker, kurioje buvo ir Lorem Ipsum versija.';
            case 'mk':
                return 'Lorem Ipsum е едноставен модел на текст кој се користел во печатарската индустрија. Lorem ipsum бил индустриски стандард кој се користел како модел уште пред 1500 години, кога непознат печатар зел кутија со букви и ги сложил на таков начин за да направи примерок на книга. И не само што овој модел опстанал пет векови туку почнал да се користи и во електронските медиуми, кој се уште не е променет. Се популаризирал во 60-тите години на дваесеттиот век со издавањето на збирка од страни во кои се наоѓале Lorem Ipsum пасуси, а денес во софтверскиот пакет како што е Aldus PageMaker во кој се наоѓа верзија на Lorem Ipsum.';
            case 'ms':
                return 'Lorem Ipsum adalah text contoh digunakan didalam industri pencetakan dan typesetting. Lorem Ipsum telah menjadi text contoh semenjak tahun ke 1500an, apabila pencetak yang kurang terkenal mengambil sebuah galeri cetak dan merobakanya menjadi satu buku spesimen. Ia telah bertahan bukan hanya selama lima kurun, tetapi telah melonjak ke era typesetting elektronik, dengan tiada perubahan ketara. Ia telah dipopularkan pada tahun 1960an dengan penerbitan Letraset yang mebawa kangungan Lorem Ipsum, dan lebih terkini dengan sofwer pencetakan desktop seperti Aldus PageMaker yang telah menyertakan satu versi Lorem Ipsum.';
            case 'no':
                return 'Lorem Ipsum er rett og slett dummytekst fra og for trykkeindustrien. Lorem Ipsum har vært bransjens standard for dummytekst helt siden 1500-tallet, da en ukjent boktrykker stokket en mengde bokstaver for å lage et prøveeksemplar av en bok. Lorem Ipsum har tålt tidens tann usedvanlig godt, og har i tillegg til å bestå gjennom fem århundrer også tålt spranget over til elektronisk typografi uten vesentlige endringer. Lorem Ipsum ble gjort allment kjent i 1960-årene ved lanseringen av Letraset-ark med avsnitt fra Lorem Ipsum, og senere med sideombrekkingsprogrammet Aldus PageMaker som tok i bruk nettopp Lorem Ipsum for dummytekst.';
            case 'pl':
                return 'Lorem Ipsum jest tekstem stosowanym jako przykładowy wypełniacz w przemyśle poligraficznym. Został po raz pierwszy użyty w XV w. przez nieznanego drukarza do wypełnienia tekstem próbnej książki. Pięć wieków później zaczął być używany przemyśle elektronicznym, pozostając praktycznie niezmienionym. Spopularyzował się w latach 60. XX w. wraz z publikacją arkuszy Letrasetu, zawierających fragmenty Lorem Ipsum, a ostatnio z zawierającym różne wersje Lorem Ipsum oprogramowaniem przeznaczonym do realizacji druków na komputerach osobistych, jak Aldus PageMaker';
            case 'pt':
                return 'O Lorem Ipsum é um texto modelo da indústria tipográfica e de impressão. O Lorem Ipsum tem vindo a ser o texto padrão usado por estas indústrias desde o ano de 1500, quando uma misturou os caracteres de um texto para criar um espécime de livro. Este texto não só sobreviveu 5 séculos, mas também o salto para a tipografia electrónica, mantendo-se essencialmente inalterada. Foi popularizada nos anos 60 com a disponibilização das folhas de Letraset, que continham passagens com Lorem Ipsum, e mais recentemente com os programas de publicação como o Aldus PageMaker que incluem versões do Lorem Ipsum.';
            case 'ro':
                return 'Lorem Ipsum este pur şi simplu o machetă pentru text a industriei tipografice. Lorem Ipsum a fost macheta standard a industriei încă din secolul al XVI-lea, când un tipograf anonim a luat o planşetă de litere şi le-a amestecat pentru a crea o carte demonstrativă pentru literele respective. Nu doar că a supravieţuit timp de cinci secole, dar şi a facut saltul în tipografia electronică practic neschimbată. A fost popularizată în anii \'60 odată cu ieşirea colilor Letraset care conţineau pasaje Lorem Ipsum, iar mai recent, prin programele de publicare pentru calculator, ca Aldus PageMaker care includeau versiuni de Lorem Ipsum.';
            case 'ru':
                return 'Lorem Ipsum - это текст-"рыба", часто используемый в печати и вэб-дизайне. Lorem Ipsum является стандартной "рыбой" для текстов на латинице с начала XVI века. В то время некий безымянный печатник создал большую коллекцию размеров и форм шрифтов, используя Lorem Ipsum для распечатки образцов. Lorem Ipsum не только успешно пережил без заметных изменений пять веков, но и перешагнул в электронный дизайн. Его популяризации в новое время послужили публикация листов Letraset с образцами Lorem Ipsum в 60-х годах и, в более недавнее время, программы электронной вёрстки типа Aldus PageMaker, в шаблонах которых используется Lorem Ipsum.';
            case 'sr':
                return 'Lorem Ipsum је једноставно модел текста који се користи у штампарској и словослагачкој индустрији. Lorem ipsum је био стандард за модел текста још од 1500. године, када је непознати штампар узео кутију са словима и сложио их како би направио узорак књиге. Не само што је овај модел опстао пет векова, него је чак почео да се користи и у електронским медијима, непроменивши се. Популаризован је шездесетих година двадесетог века заједно са листовима летерсета који су садржали Lorem Ipsum пасусе, а данас са софтверским пакетом за прелом као што је Aldus PageMaker који је садржао Lorem Ipsum верзије.';
            case 'sk':
                return 'Lorem Ipsum je fiktívny text, používaný pri návrhu tlačovín a typografie. Lorem Ipsum je štandardným výplňovým textom už od 16. storočia, keď neznámy tlačiar zobral sadzobnicu plnú tlačových znakov a pomiešal ich, aby tak vytvoril vzorkovú knihu. Prežil nielen päť storočí, ale aj skok do elektronickej sadzby, a pritom zostal v podstate nezmenený. Spopularizovaný bol v 60-tych rokoch 20.storočia, vydaním hárkov Letraset, ktoré obsahovali pasáže Lorem Ipsum, a neskôr aj publikačným softvérom ako Aldus PageMaker, ktorý obsahoval verzie Lorem Ipsum.';
            case 'sl':
                return 'Lorem Ipsum je slepi tekst, ki se uporablja pri razvoju tipografij in pri pripravi za tisk. Lorem Ipsum je v uporabi že več kot petsto let saj je to kombinacijo znakov neznani tiskar združil v vzorčno knjigo že v začetku 16. stoletja. To besedilo pa ni zgolj preživelo pet stoletij, temveč se je z malenkostnimi spremembami uspešno uveljavilo tudi v elektronskem namiznem založništvu. Na priljubljenosti je Lorem Ipsum pridobil v sedemdesetih letih prejšnjega stoletja, ko so na trg lansirali Letraset folije z Lorem Ipsum odstavki. V zadnjem času se Lorem Ipsum pojavlja tudi v priljubljenih programih za namizno založništvo kot je na primer Aldus PageMaker.';
            case 'es':
                return 'Lorem Ipsum es simplemente el texto de relleno de las imprentas y archivos de texto. Lorem Ipsum ha sido el texto de relleno estándar de las industrias desde el año 1500, cuando un impresor (N. del T. persona que se dedica a la imprenta) desconocido usó una galería de textos y los mezcló de tal manera que logró hacer un libro de textos especimen. No sólo sobrevivió 500 años, sino que tambien ingresó como texto de relleno en documentos electrónicos, quedando esencialmente igual al original. Fue popularizado en los 60s con la creación de las hojas "Letraset", las cuales contenian pasajes de Lorem Ipsum, y más recientemente con software de autoedición, como por ejemplo Aldus PageMaker, el cual incluye versiones de Lorem Ipsum.';
            case 'sv':
                return 'Lorem Ipsum är en utfyllnadstext från tryck- och förlagsindustrin. Lorem ipsum har varit standard ända sedan 1500-talet, när en okänd boksättare tog att antal bokstäver och blandade dem för att göra ett provexemplar av en bok. Lorem ipsum har inte bara överlevt fem århundraden, utan även övergången till elektronisk typografi utan större förändringar. Det blev allmänt känt på 1960-talet i samband med lanseringen av Letraset-ark med avsnitt av Lorem Ipsum, och senare med mjukvaror som Aldus PageMaker.';
            case 'th':
                return 'Lorem Ipsum คือ เนื้อหาจำลองแบบเรียบๆ ที่ใช้กันในธุรกิจงานพิมพ์หรืองานเรียงพิมพ์ มันได้กลายมาเป็นเนื้อหาจำลองมาตรฐานของธุรกิจดังกล่าวมาตั้งแต่ศตวรรษที่ 16 เมื่อเครื่องพิมพ์โนเนมเครื่องหนึ่งนำรางตัวพิมพ์มาสลับสับตำแหน่งตัวอักษรเพื่อทำหนังสือตัวอย่าง Lorem Ipsum อยู่ยงคงกระพันมาไม่ใช่แค่เพียงห้าศตวรรษ แต่อยู่มาจนถึงยุคที่พลิกโฉมเข้าสู่งานเรียงพิมพ์ด้วยวิธีทางอิเล็กทรอนิกส์ และยังคงสภาพเดิมไว้อย่างไม่มีการเปลี่ยนแปลง มันได้รับความนิยมมากขึ้นในยุค ค.ศ. 1960 เมื่อแผ่น Letraset วางจำหน่ายโดยมีข้อความบนนั้นเป็น Lorem Ipsum และล่าสุดกว่านั้น คือเมื่อซอฟท์แวร์การทำสื่อสิ่งพิมพ์ (Desktop Publishing) อย่าง Aldus PageMaker ได้รวมเอา Lorem Ipsum เวอร์ชั่นต่างๆ เข้าไว้ในซอฟท์แวร์ด้วย';
            case 'tr':
                return 'Lorem Ipsum, dizgi ve baskı endüstrisinde kullanılan mıgır metinlerdir. Lorem Ipsum, adı bilinmeyen bir matbaacının bir hurufat numune kitabı oluşturmak üzere bir yazı galerisini alarak karıştırdığı 1500\'lerden beri endüstri standardı sahte metinler olarak kullanılmıştır. Beşyüz yıl boyunca varlığını sürdürmekle kalmamış, aynı zamanda pek değişmeden elektronik dizgiye de sıçramıştır. 1960\'larda Lorem Ipsum pasajları da içeren Letraset yapraklarının yayınlanması ile ve yakın zamanda Aldus PageMaker gibi Lorem Ipsum sürümleri içeren masaüstü yayıncılık yazılımları ile popüler olmuştur.';
            case 'uk':
                return 'Lorem Ipsum - це текст-"риба", що використовується в друкарстві та дизайні. Lorem Ipsum є, фактично, стандартною "рибою" аж з XVI сторіччя, коли невідомий друкар взяв шрифтову гранку та склав на ній підбірку зразків шрифтів. "Риба" не тільки успішно пережила п\'ять століть, але й прижилася в електронному верстуванні, залишаючись по суті незмінною. Вона популяризувалась в 60-их роках минулого сторіччя завдяки виданню зразків шрифтів Letraset, які містили уривки з Lorem Ipsum, і вдруге - нещодавно завдяки програмам комп\'ютерного верстування на кшталт Aldus Pagemaker, які використовували різні версії Lorem Ipsum.';
            case 'vi':
                return 'Lorem Ipsum chỉ đơn giản là một đoạn văn bản giả, được dùng vào việc trình bày và dàn trang phục vụ cho in ấn. Lorem Ipsum đã được sử dụng như một văn bản chuẩn cho ngành công nghiệp in ấn từ những năm 1500, khi một họa sĩ vô danh ghép nhiều đoạn văn bản với nhau để tạo thành một bản mẫu văn bản. Đoạn văn bản này không những đã tồn tại năm thế kỉ, mà khi được áp dụng vào tin học văn phòng, nội dung của nó vẫn không hề bị thay đổi. Nó đã được phổ biến trong những năm 1960 nhờ việc bán những bản giấy Letraset in những đoạn Lorem Ipsum, và gần đây hơn, được sử dụng trong các ứng dụng dàn trang, như Aldus PageMaker.';

            case 'en':
            default:
                return 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.';

        }
    }



    // ----------------------------------------------------------------------
    // INIT DEMO
    // ----------------------------------------------------------------------

    userLangFull = (navigator.language || navigator.userLanguage).split('-', 2);
    userLang = userLangFull[0];

    function prepareDemo() {
        sel_lang = document.getElementById('lang');
        for(entry in countryNames) {
            sel_lang.options[sel_lang.options.length] = new Option(countryNames[entry], entry);
        }
        sel_lang.value = userLang;
    }


        // ----------------------------------------------------------------------
        // DEMO TEXT
        // ----------------------------------------------------------------------
        function printDemoText() {
            text = document.getElementById('demotext').value;
            var c = new PosPrinterJob(getCurrentDriver(), getCurrentTransport());
            c.initialize();
            c.setEncoding(defaultCP[userLang]);

            align = document.querySelector('input[name="align"]:checked').value;
            c.setAlignment(align);
            font_flags  = document.querySelectorAll('input[name="font"]');


            font = 0;
            for (i = 0; i < font_flags.length; i++) {
                if (font_flags[i].checked) {
                    font = font + 1*font_flags[i].value;
                }
            }
            c.setPrintMode(font);

            c.printLine(text);
            c.feed(2);
            c.execute();
        }

        // ----------------------------------------------------------------------
        // DEMO BARCODE
        // ----------------------------------------------------------------------
        function printDemoBarCode() {
            tip = document.getElementById('bartype').value;
            text = document.getElementById('demobarcode').value;
            hri = document.querySelector('input[name="hri"]:checked').value;
            h = document.getElementById('barcode_h').value;


            c = new PosPrinterJob(getCurrentDriver(), getCurrentTransport());
            c.initialize();
            c.setBarcodeTextPosition(hri).setBarcodeHeight(h);
            c.printBarCode(text,tip).lf();
            c.feed(2);
            c.execute();
        }

    function democode(s) {
        o = s.options;
        for(i=0;i<o.length;i++){
            if(o[i].value == s.value){
                document.getElementById("demobarcode").value = o[i].attributes['data-example'].value;
            }
        }
    }

        // ----------------------------------------------------------------------
        // DEMO QRCODE
        // ----------------------------------------------------------------------
        function printQrCode() {
            var code = document.getElementById('demoqrcode').value;
            e = document.getElementById('QR_EC').value;
            s = document.getElementById('QR_SIZE').value;
            m = document.getElementById('QR_MODEL').value;

            c = new PosPrinterJob(getCurrentDriver(), getCurrentTransport());
            c.initialize();
            c.center();
            c.printQrCode(code,e,s,m).lf();
//            c.left().setPrintMode(c.FONT_SIZE_SMALL).printLine(code);
            c.feed(2);
            c.execute();
        }


prepareDemo();
document.getElementById("demo").style.display="block";