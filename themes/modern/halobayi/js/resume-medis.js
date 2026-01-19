/**
 * 	Developed by : Muchamad Desta Fadilah a.ka. topidesta
 *	Website		 : https://topidesta.my.id
 *	Year		 : 2025
 *  Description  : Function Javascript (Vanilla, jQuery or Other Style Plugins Added) to Support Resume Module.
 */

jQuery(document).ready(function() {
    console.log('Init Resume Medis');

    $(document).ready(function () {
        // Format: PDF
        // // Source: https://github.com/hhurz/tableExport.jquery.plugin.git
        // var namaFile = 'resume-medis';
        //     $("#btnExport").click(function () {
        //         $('#tblExport').tableExport({
        //         fileName: namaFile,
        //         type: 'pdf',
        //         // jspdf: {
        //         //     orientation: 'p',
        //         //     margins: {left:20, top:10},
        //         //     autotable: false
        //         // }
        //     });
        // });

        $("#printableAreaClick").click(function () {
            printDiv('printableArea');
            console.log('Print Preview');
        });
    });

    // source: https://stackoverflow.com/a/7532581
    function printDiv(divId) {
        var printContents = document.getElementById(divId).innerHTML;
        var originalContents = document.body.innerHTML;
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
    }
    
});