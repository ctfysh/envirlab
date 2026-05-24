"use strict";
/*

Group: Dialogues and User Input

*/


/*
Method: showMessage

Shows a message in a dialogue window.

Parameters:

message - The string to show as the message.

See also:

<showPrompt>, <showChoice>
*/


function showMessage(message) {
	alert(message);
	//Ext.Msg.alert('', message);
}

/*
Method: showPrompt

Shows a prompt in a dialogue window and provides a text input for the user to enter a value.

Parameters:

message - The string to show as the prompt.
defaultValue - The default value for the prompt. This parameter is optional.

Returns:

The value entered by the user.

See also:

<showMessage>, <showChoice>
*/

function showPrompt(message, defaultValue) {
	return prompt(message, defaultValue)
}

/*
Method: showChoice

Shows a prompt in a dialogue window and provides the user the option to click "OK" or "Cancel". Returns the value the user clicked as a boolean.

Parameters:

message - The string to show as the prompt.

Returns:

The value of the button clicked by the user as a boolean. "OK" is true, "Cancel" is false.

See also:

<showMessage>, <showPrompt>
*/


function showChoice(message) {
	return confirm(message);
}

/*
Method: showURL

Creates a new web browser window and sets the URL.

Parameters:

url - The URL to show.

*/

function showURL(url) {
	var win = window.open(url, '', 'scrollbars=yes,menubar=yes,height=500,width=700,resizable=yes,toolbar=yes,location=yes,status=yes');
	if (open == win || typeof(win)=='undefined'){
		Ext.Msg.alert('', "<big><big><center><a href='"+url+"' target='_blank'><i class='fa fa-external-link-square'></i> "+getText('打开链接')+"</a></center></big></big>")
	}
}

/*
Method: downloadFile

Downloads a file.

Parameters:

fileName - The name of the file to download
data - The data to download
type - The type of file

*/

function downloadFile(fileName, data, type) {
    var a = document.createElement("a");
    document.body.appendChild(a);
	
	var blob = new Blob([data], {type: type || "octet/stream"}),
	    url = window.URL.createObjectURL(blob);
	a.href = url;
	a.download = fileName;
	a.click();
	window.URL.revokeObjectURL(url);
	a.remove();
};

/*
Method: showData

Creates a display to showcase data. Multiple tabs of data may be shown. This function is passed an array of objects each representing an individual tab.

Parameters:

title - The title for the data window
tabs - An array of tab objects
size - The dimensions of the window in the form [width, height] (optional)

Tab Objects:

Each tab object contains several properties.

name - The name of the tab
type - The tab type. E.g. "text", "HTML", "table" or "chart"
data - The data for the tab

The different types of tabs are as follows.

Text Tab:

A text tab displays a large amount of text. For a text tab, the data property should be the text string that will be displayed.

HTML Tab:

An HTML tab displays HTML content. For an HTML tab, the data property should be the HTML content that will be displayed.

Table Tab:

A table tab displays a grid of data. For a table tab, the data object should be an array of arrays. Each inner array represents a column in the resulting table. The following property is also supported for tables.

header - For a table, an array containing containing the titles of the columns (optional)

Chart Tab:

A chart creates a graphical display of your data. In this case the data should be an array of series objects.

The following properties are also supported.

xData - The x coordinates for the series (each series must have the same number of points with the same x-coordinates). In the form [x1, x2, ..., xn]
xType - The data type for the x-axis can be "numeric" or "category" (for use with categorical data such as column charts). By default, "numeric" data is assumed. (optional)
xLabel - A string for the x-Axis label (optional)
yLabel - A string for the y-Axis label (optional)
legend - A string controlling the position of the legend. Can be "left", "right", "bottom", "top", or "none" (optional)
verticalGrid - True/false value whether or not to plot a vertical grid (optional)
horizontalGird - True/false value whether or not to plot a horizontal grid (optional)
xMin - The minimum value of the x-Axis (optional)
xMax - The maximum value of the x-Axis (optional)
yMin - The minimum value of the y-Axis (optional)
yMax - The maximum value of the y-Axis (optional)

Each series object has the following the properties:

data - An array containing the data for the series of the form [y1, y2, ..., yn]
type - The display type for the series. Can be "line" or "bar"
name - The series name as a string (for display in the legend)
color - The color of the series. A string such as "green" or "#00ff00" (optional)
hideLegend - Prevents the series from being displayed in the legend (optional)
fill - If the series is a line series, creates a solid filled area between the line and  the x-axis (optional)
hideMarkers - Hides the markers for individual data points (optional)

Returns:

The window object that was created.

Example:

> showData("Sample Data",
>  [
>  {name: "A Chart",
>	type: "chart",
>	xLabel: "Chart x-Axis",
>	yLabel: "Chart y-Axis",
>	legend: "top",
>	horizontalGrid: true,
>	verticalGrid: true,
>	xType: "numeric",
>	xData: [1,2,3,4,5],
>	data: [{
>		data: [1,4,9,16,25],
>		type: "line",
>		name: "Energy"
>	},{
>		data: [1,2,3,4,5],
>		type: "line",
>		name: "Cost"
>	}]
>	},
>  {name: "I'm a Text Tab",
>	type: "text",
>	data: "This is a long data string..."
>	},
>  {name: "I'm an HTML Tab",
>	type: "html",
>	data: "<center><p>This is <b>HTML</b> content.</p></center>"
>	},
>  {name: "Here's a Grid",
>	type: "table",
>	data: [[1,2,3,4],[1,4,9,16]],
>	header: ["Value", "Value^2"]
>	}
>  ]
> )


*/

function showData(title, tabs, size) {
	if (!size) {
		size = [Math.min(Ext.getBody().getViewSize().width, 640), Math.min(Ext.getBody().getViewSize().height, 480)];
	}

	var tabItems = [];
	for (var i = 0; i < tabs.length; i++) {
		var tab = {
			layout: "fit"
		};
		tab.title = tabs[i].name;
		if (tabs[i].type.toLowerCase() == "text") {
			var textData = {
				xtype: "textareafield",
				value: tabs[i].data,
				readOnly: true
			};
			tab.items = [textData];
		} else if (tabs[i].type.toLowerCase() == "html") {
			var htmlData = {
				title: getText('Insight 方程'),
				xtype: "box",
				html: tabs[i].data,
				style: "background-color: white",
				autoScroll: true
			};
			tab.items = [htmlData];
		} else if (tabs[i].type.toLowerCase() == "table") {
			var gridData = {
				xtype: "grid"
			};
			var gridColumns = [];
			var storeFields = [];
			var data = []
			for (var j = 0; j < tabs[i].data.length; j++) {
				gridColumns.push({
					dataIndex: "a" + j,
					text: tabs[i].header ? tabs[i].header[j] : ""
				});
				var columnType = "float";
				for (var k = 0; k < tabs[i].data[j].length; k++) {
					if ((typeof tabs[i].data[j][i]) == "string") {
						columnType = "string";
					}
				}
				storeFields.push({
					name: "a" + j,
					type: columnType
				})

			}
			for (var k = 0; k < tabs[i].data[0].length; k++) {
				data.push({});
			}
			for (var j = 0; j < tabs[i].data.length; j++) {
				for (var k = 0; k < tabs[i].data[0].length; k++) {
					data[k]["a" + j] = tabs[i].data[j][k];
				}
			}

			gridData.columns = gridColumns;
			gridData.store = new Ext.data.JsonStore({
				fields: storeFields,
				data: data
			});
			if (!tabs[i].header) {
				gridData.hideHeaders = true;
			}

			gridData.dockedItems = [{
				xtype: 'toolbar',
				dock: 'bottom',
				items: ["->", downloadButton(tabs[i].name)]
			}];
			tab.items = [gridData];

		} else if (tabs[i].type.toLowerCase() == "chart") {
			var defaultColors = ["#94ae0a", "#115fa6", "#a61120", "#ff8809", "#ffd13e", "#a61187", "#24ad9a", "#7c7474", "#a66111"];
			var defaultColorIndex = 0;
			var colors = [];
			for (var j = 0; j < tabs[i].data.length; j++) {
				if (tabs[i].data[j].color) {
					colors.push(tabs[i].data[j].color);
				} else {
					colors.push(defaultColors[defaultColorIndex]);
					defaultColorIndex++;
					defaultColorIndex = defaultColorIndex % defaultColors.length;
				}
			}

			var dataSeries = [];
			var storeFields = [{
				name: "x",
				type: tabs[i].xType.toLowerCase() == "numeric" ? "float" : "string"
			}];
			var yFields = [];
			var data = [];
			for (var j = 0; j < tabs[i].xData.length; j++) {
				data.push({
					x: tabs[i].xData[j]
				});
			}

			for (var j = 0; j < tabs[i].data.length; j++) {
				storeFields.push({
					name: "a" + j,
					type: "float"
				});

				dataSeries.push({
					shadow: false,
					type: tabs[i].data[j].fill ? "area" : tabs[i].data[j].type.toLowerCase(),
					title: tabs[i].data[j].name,
					colors: [colors[j]],
					axis: 'left',
					xField: 'x',
					yField: "a" + j,
					showInLegend: tabs[i].data[j].hideLegend ? false : true,
					showMarkers: tabs[i].data[j].hideMarkers ? false : true,
					style: {
						opacity: 1,
						"stroke-width": 3
					},
					marker: {
						radius: 3
					},
					animation: false
				});
				if (tabs[i].data[j].fill) {
					dataSeries[dataSeries.length - 1].style["stroke-width"] = 0;
				}

				yFields.push("a" + j);

				for (var k = 0; k < tabs[i].data[j].data.length; k++) {
					data[k]["a" + j] = tabs[i].data[j].data[k];
				}
			}



			var chartData = {
				xtype: "cartesian",

				animation: false,
				shadow: false,
				interactions: 'crosszoom',

				store: new Ext.data.JsonStore({
					fields: storeFields,
					data: data
				}),
				axes: [{
					position: "bottom",
					type: tabs[i].xType ? tabs[i].xType.toLowerCase() : "numeric",
					grid: tabs[i].verticalGrid ? tabs[i].verticalGrid : false,
					title: {
						text: tabs[i].xLabel ? tabs[i].xLabel : "",
						fontSize: 14
					},
					fields: ["x"],
					minimum: tabs[i].xMin,
					maximum: tabs[i].xMax
				}, {
					position: "left",
					type: "numeric",
					grid: tabs[i].horizontalGrid ? tabs[i].horizontalGrid : false,

					title: {
						text: tabs[i].yLabel ? tabs[i].yLabel : "",
						fontSize: 14
					},
					titleMargin: 20,
					fields: yFields,
					minimum: tabs[i].yMin,
					maximum: tabs[i].yMax
				}],
				series: dataSeries
			};

			if (tabs[i].legend && tabs[i].legend != 'none') {
				chartData.legend = {};
				chartData.legend.docked = tabs[i].legend;
				chartData.legend.toggleable = !tabs[i].legendStatic;
			}


			tab.items = [chartData];



		} else {
			alert(getText("未知标签类型：") + tabs[i].type);
		}
		tabItems.push(tab);
	}

	var win = new Ext.Window({
		title: title,
		layout: 'fit',
		closeAction: 'destroy',
		border: false,
		modal: false,
		resizable: true,
		closable: true,
		maximizable: true,
		minimizable: true,
		shadow: true,
		width: size[0],
		height: size[1],
		items: [{
			xtype: "tabpanel",
			layout: "fit",
			items: tabItems
		}]
	});

	win.on('minimize', function(w) {
		if (w.expandedState) {
			w.expandedState = false;
			w.collapse();
		} else {
			w.expandedState = true;
			win.expand();
		}
	});


	win.show();

	return win;
}

/*
Method: frontWindow

Gets the frontmost window (if one exists).

Returns:

A window object.

*/

function frontWindow() {
	return Ext.WindowMgr.getActive();
}

/*
Method: closeAllWindows

Closes all open windows.

*/

function closeAllWindows() {
	var w;
	while (w = Ext.WindowMgr.getActive()) {
		w.close();
	}
}


/*
Method: openFile

Prompts the user to select one or more files on their computer. Information about the selected files are made available and the contents of the files are optionally read into memory.

Note that this function needs to be called as a direct result of user actions (such as the user clicking on a button). Browser security restrictions will prevent the function from operating if it is not called in response a user actions. Note also that this function is not supported on Internet Explorer 9.

Parameters:

config - A configuraiton object with the following optional properties:
multiple - If false, only a single file may be selected; if true, one or more files may be selected at a time.
accept - A string containing a MIME file type to filter file selection. If defined, only files matching the specified type may be selected. For example, "image/*" may be used to only accept image files.
read - If defined the selected files will be opened and their contents loaded. Read may either be "binary" in which case the contents is loaded as a binary string, "text" in which case the contents is loaded as a regular text string, or "xlsx" in which case an Excel file is loaded as an object.
onCompleted - A function to handle results. The openFile function is asynchronous. Once it completes, the callback function is called with the resulting data as a parameter.
onError - A function to handle the occurence of an error.
onSelected - A function fired once files have been selected but before data has been read.

Returns:

The openFile function is asynchronous and returns nothing directly. On the successful selection of files, the callback is called with the results. 

If config.multiple is false, these results are a single file object. If config.multiple is true, then these results are an array of file objects. Each file object has the following properties:

file - The orginal file object.
name - The name of the selected file.
type - The type of the selected file.
size - The size of the selected file.
contents - If config.read is true, the contents in the file is loaded with the specified type.

Examples:

>// Select a single text file and display its contents
>openFile({
>	read: "text",
>	multiple: false,
>	onCompleted: function(result){
>		alert(result.contents);
>	}
>});

*/

function openFile(config) {
	config = config || {
		multiple: false,
		accept: null,
		onCompleted: null,
		onSelected: null,
		onError: null,
		read: false
	};
	if (config.read) {
		config.read = config.read.toLowerCase();
	}
	if (config.read == "xlsx" && (!config.accept)) {
		config.accept = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
	}

	var opener = document.createElement("input");
	opener.setAttribute("type", "file");
	if (config.multiple) {
		opener.setAttribute("multiple", true);
	}
	if (config.accept) {
		opener.setAttribute("accept", config.accept);
	}

	var res = null;

	var loadCount = 0;
	var handleLoad = function() {
		$(opener).remove();

		if (!res.length) {
			config.onCompleted(res);
		} else {
			loadCount++;
			if (loadCount == res.length) {
				config.onCompleted(res);
			}
		}

	}

	var processFile = function(file) {
		var data = {};
		data.file = file;
		data.size = file.size;
		data.name = file.name;
		data.type = file.type;

		var reader = new FileReader();
		reader.onloadend = function(evt) {
			if (config.read == "xlsx") {
				require(['jszip'], function() {
					require(['xlsx'], function() {
						data.contents = XLSX.read(reader.result, {
							type: "binary"
						});
						handleLoad();
					});
				});
			} else {
				data.contents = reader.result;
				handleLoad();
			}
		};
		reader.onerror = function() {
			if (config.onError) {
				config.onError(reader.error)
			} else {
				alert(getText("文件读取器错误。"));
				console.log("FileReader Error");
				console.log(reader.error);
			}
		};

		reader.onabort = function() {
			if (config.onError) {
				config.onError(reader.error)
			} else {
				alert(getText("文件读取器已中止。"));
				console.log("FileReader Error");
				console.log(reader.error);
			}

		}

		if (config.read == "binary") {
			reader.readAsBinaryString(file);
		} else if (config.read == "text") {
			reader.readAsText(file);
		} else if (config.read == "xlsx") {
			reader.readAsBinaryString(file);
		} else if (!config.read) {
			// leaving empty means don't load
			setTimeout(handleLoad, 1);
		} else {
			throw "Unknown data read type: " + config.type;
		}
		return data;
	}

	var callback = function() {

		var files = opener.files;

		if (config.onSelected) {
			config.onSelected(files);
		}

		if (config.onCompleted) {

			if (typeof files[0] == "undefined") {
				config.onCompleted(null);
			}

			if (!config.multiple) {
				res = processFile(files[0]);
			} else {
				res = Array.prototype.slice.call(files).map(function(x) {
					return processFile(x);
				});
			}
		}
	}

	opener.onchange = callback;
	document.body.appendChild(opener);
	opener.click();
}


