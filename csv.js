const { Parser } = require("json2csv");

function exportCsv() {
    const data = Array.from(this.tableData, (item) => {
      return {
        测点名称: this.name,
        时间: item.data_time,
        温度: item.data + " ℃",
      };
    });

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);
    var link = document.createElement("a");
    var csvContent = "data:text/csv;charset=GBK,\uFEFF" + csv;
    var encodedUri = encodeURI(csvContent);
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", this.name + "监测数据.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }