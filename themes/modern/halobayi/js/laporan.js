/**
 * 	Developed by : Muchamad Desta Fadilah a.ka. topidesta
 * 	Website		 : https://topidesta.my.id
 *	   Year		    : 2023-2024
 *    Description  : Javascript Laporan
 */

jQuery(document).ready(function () {
  console.log("Init Module Laporan");

  $(document).ready(function () {

    // Format: XLS
    // $("#btnExport").click(function () {
    //     $("#tblExport").btechco_excelexport({
    //         containerid: "tblExport"
    //     , datatype: $datatype.Table
    //     });
    // });

    // Format: XLSX
    // Source: https://github.com/hhurz/tableExport.jquery.plugin.git
    var namaFile = 'file-laporan-absensi';
    $("#btnExport").click(function () {
      $('#tblExport').tableExport({
         fileName: namaFile,
         type: 'xlsx'
      });
   });

  });

});
