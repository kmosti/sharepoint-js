function search(webUrl,queryText,rowLimit,startRow,allResults)
{
    var allResults = allResults || [];
    var url = webUrl
            + "/_api/search/query?querytext="
            + queryText
            + "&trimduplicates=false"
            + "&rowlimit="
            + rowLimit
            + "&startrow="
            + startRow
            + "&sortlist='LastModifiedTime:descending'"
            + "&selectproperties='FileExtension,ModifiedBy,Filename,CreatedBy,LastModifiedTime,path,ServerRedirectedEmbedURL'";
    return $.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            headers: {
                Accept: "application/json;odata=verbose"
            }
            }).then(function(data) {
                        var relevantResults = data.d.query.PrimaryQueryResult.RelevantResults;
                        var perComplete = ((rowLimit + startRow) / relevantResults.TotalRows * 100).toFixed(0);
                        if (perComplete >= 100) {perComplete = 100};
                        var perStyle = "width:" + perComplete + "%";
                        $("#counter").attr("aria-valuenow", perComplete);
                        $("#counter").attr("style", perStyle);
                        $("#counter").text((perComplete + "%"));
                        allResults = allResults.concat(relevantResults.Table.Rows);
                        if (relevantResults.TotalRows > startRow + relevantResults.RowCount) {
                            return search(webUrl,queryText,rowLimit,startRow+relevantResults.RowCount,allResults);
                        }
                        return allResults;
                       
                });
}

function allRecentDocuments(results) {
        $(results).each(function() {
            $(this.results).each(function() {
                //create the result object to be parsed into datatables table
                //To debug, try using https://sp2013searchtool.codeplex.com/
                //To check the output, the Chrome App "Advanced Rest Client" is also a great tool
                var itemObject = {};
                itemObject.extension = this.Cells.results[2].Value || "";
                itemObject.path = this.Cells.results[7].Value;
                itemObject.LastModifiedTime = this.Cells.results[6].Value || "";
                itemObject.Title = this.Cells.results[4].Value;
                itemObject.LastModifiedBy = this.Cells.results[3].Value || "";
                itemObject.ServerRedirectedEmbedURL = this.Cells.results[8].Value || "";
                if (itemObject.extension == "xlsx" || itemObject.extension == "docx" || itemObject.extension == "pptx") { //rewrite action to default if office document (default is view)
                    var defaultURL = itemObject.ServerRedirectedEmbedURL.split("&action=interactivepreview")[0];
                    defaultURL += "&action=default";
                    itemObject.URL = defaultURL;
                }
                else if (itemObject.extension == "pdf") { //keep interactivepreview if pdf
                    itemObject.URL = itemObject.ServerRedirectedEmbedURL;
                }
                else { //return path for all else
                    itemObject.URL = itemObject.path;
                }
                var trHtml = "<tr>"
                            + "<td><a href='"
                            + itemObject.URL
                            + "'>"
                            + itemObject.Title
                            + "</a></td>"
                            + "<td>"
                            + moment(itemObject.LastModifiedTime).format("DD/MM/YY HH:mm")
                            + "</td><td>"
                            + itemObject.LastModifiedBy
                            + "</td><td>"
                            + moment(itemObject.LastModifiedTime).format("YYYYMMDDHHmm")
                            + "</td></tr>";

                $("#alldocs").append(trHtml);

            })
        });
        
        /*
        Render datatables
        The column definitions are set to hide the date column that displays dates in ascending order
        It will then use the hidden date column to sort the nicely formatted date column
        Be sure to set the correct column index here (the column number counted from 0)
        */
        $('.progress').hide();
        $('#tablealldocs').show().DataTable({
            "columnDefs": [
                { "visible": false, "targets": [ 3 ]}
            ],
            "order": [[ 1, "desc" ]],
            "columns": [
            { "title": "Title"},
            {
                "title": "Modified",
                "iDataSort": 3
            },
            { "title": "Modified by"},
            { "title": "sortdate"},
            ]
        });
}