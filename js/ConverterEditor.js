"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

var ConverterEditor = Ext.extend(Ext.form.TextField,
	createEditorFieldConfig({
		editorWindowClass: ConverterWindow,
		stripCharsRe: /[^0-9\;\,\. \-]/g,
		getEditorWindowConfig: function() {
			return {
				parent: this,
				oldKeys: this.getValue(),
				interpolation: graph.getSelectionCell().getAttribute("Interpolation")
			};
		}
	})
);

function ConverterWindow(config) {
	var me = this;


	var data = [];
	if (!isUndefined(config.oldKeys)) {
		var items = config.oldKeys.split(";");
		for (var i = 0; i < items.length; i++) {
			var xy = items[i].split(",")
			data.push({
				xVal: parseFloat(xy[0]),
				yVal: parseFloat(xy[1])
			});
		}
	}

	var dataFields = [{
		name: 'xVal',
		type: 'float'
	}, {
		name: 'yVal',
		type: 'float'
	}];
	var store = new Ext.data.Store({
		fields: dataFields,
		data: data,
		sorters: ['xVal']
	});

	var editor = new Ext.grid.plugin.CellEditing({
		clicksToEdit: 1
	});

	var gridPan = new Ext.grid.GridPanel({
		store: store,
		width: 600,
		region: 'center',
		plugins: [editor],
		viewConfig: {
			headersDisabled: true,
			markDirty: false
		},
		tbar: ['点击图表增加点.<br/>按Shift键点击可以移除。 按Alt键点击可以移动。 ', '->', {
			hidden: !viewConfig.allowEdits,
			text: getText('导入'),
			glyph: 0xf0ce,
			tooltip: getText('从CSV或其他文本格式文件输入数据'),
			handler: function() {
				importData(store);
			}
		}, {
			glyph: 0xf055,
			iconCls: 'green-icon',
			text: getText('增加点'),
			handler: function() {
				var e = {
					xVal: 0,
					yVal: 0
				};
				editor.completeEdit();
				store.insert(0, e);
				store.sort('xVal', 'ASC');
				gridPan.getView().refresh();

				var index = store.findBy(function(record) {
					return record.get("xVal") == 0 && record.get("yVal") == 0;
				});
				gridPan.getSelectionModel().selectRange(index, index);
				editor.startEdit(index, index);
			}
		}],

		columns: [{
			id: 'xVal',
			header: getText('输入数值'),
			dataIndex: 'xVal',
			flex: 1,
			sortable: false,
			menuDisabled: true,
			editor: {
				xtype: 'numberfield',
				allowBlank: false,
				decimalPrecision: 10,
				selectOnFocus: true
			}
		}, {
			header: getText('输出数值'),
			dataIndex: 'yVal',
			flex: 1,
			sortable: false,
			menuDisabled: true,
			editor: {
				xtype: 'numberfield',
				allowBlank: false,
				decimalPrecision: 10,
				selectOnFocus: true
			}
		}, {
			xtype: "actioncolumn",
			width: 40,
			items: [{
				iconCls: "units-remove-icon",
				tooltip: getText("删除"),
				handler: function(grid, rowIndex, columnIndex) {
					store.remove(store.getAt(rowIndex));

					store.sort('xVal', 'ASC');

					gridPan.getView().refresh();
				}
			}]
		}]
	});

	var chartStore = store;

	var sourceName = "";

	var cell;
	if (config.parent != "") {
		cell = graph.getSelectionCell();
	} else {
		cell = config.cell;
	}
	if (cell.getAttribute("Source") == "Time") {
		sourceName = "Time";
	} else {
		sourceName = findID(cell.getAttribute("Source")).getAttribute("name");
	}

	var chart = new Ext.chart.CartesianChart({
		store: chartStore,
		animate: false,
		shadow: false,
		//interactions: 'itemhighlight',
		axes: [{
			type: 'numeric',
			position: 'left',
			fields: ["yVal"],
			title: {
				text: getText("输出"),
				fontSize: 14
			},
			titleMargin: 20,
			grid: true
		}, {
			type: 'numeric',
			position: 'bottom',
			fields: ["xVal"],
			title: {
				text: getText("输入") + " (" + clean(sourceName) + ")",
				fontSize: 14
			},
			titleMargin: 16,
			grid: true
		}],

		series: [{
			type: 'line',
			axis: 'left',
			showMarkers: true,
			smooth: false,
			step: config.interpolation != "Linear",
			style: {
				'stroke-width': 3
			},
			marker: {
				radius: 4
			},
			xField: 'xVal',
			yField: "yVal"

			/*highlight: true,
				highlightCfg: {
					radius: 6
				},
				tooltip: {
					trackMouse: true,
					style: 'background-color: #fff',
					renderer: function(){
						
						this.setHtml("hi")
					}
				}*/
		}]
	});




	var chartPanel = new Ext.Panel({

		height: 180,
		layout: 'fit',
		region: 'north',
		split: true,
		minHeight: 100,
		maxHeight: 500,

		items: chart
	});


	var win = editorWindow(getText('转换器数据确定'), config, [chartPanel, gridPan], {
		stateId: "converter_window",
		maxWidth: 560,
		maxHeight: 530,
		listeners: {
			'afterrender': function() {
				chart.getEl().on({
					click: function(e) {


						var xy = chart.getEventXY(e);
						var x = xy[0]
						var y = xy[1]

						var box = chart.getInnerRect();

						y = box[3] - y;

						var outY = chart.getAxes()[0].getRange();
						var outX = chart.getAxes()[1].getRange();


						x = outX[0] + x / box[2] * (outX[1] - outX[0]);

						y = outY[0] + y / box[3] * (outY[1] - outY[0]);

						var dx = 1 / box[2] * (outX[1] - outX[0]);
						var dy = 1 / box[3] * (outY[1] - outY[0]);



						var nx, ny;

						var diff = dx.toExponential().split("e")[1];
						if (diff[1] == "-") {
							nx = (Math.round(x / Math.pow(10, diff + 1)) * Math.pow(10, diff + 1)).toPrecision(9);
						} else {
							nx = (Math.round(x / Math.pow(10, diff - 1)) * Math.pow(10, diff - 1)).toPrecision(9);
						}
						var diff = dy.toExponential().split("e")[1];
						if (diff[1] == "-") {
							ny = (Math.round(y / Math.pow(10, diff + 1)) * Math.pow(10, diff + 1)).toPrecision(9);
						} else {
							ny = (Math.round(y / Math.pow(10, diff - 1)) * Math.pow(10, diff - 1)).toPrecision(9);
						}

						if (e.shiftKey) {
							var pt = store.findBy(function(record) {
								return (record.get("xVal") > x - dx * 4 && record.get("xVal") < x + dx * 4 && record.get("yVal") > y - dy * 4 && record.get("yVal") < y + dy * 4)
							});
							if (pt > -1) {
								store.remove(store.getAt(pt));
							}
						} else if (e.altKey) {
							if (store.count() > 0) {
								var pt = store.getAt(0);
								for (var i = 1; i < store.count(); i++) {
									if (Math.abs(pt.get("xVal") - x) > Math.abs(store.getAt(i).get("xVal") - x)) {
										pt = store.getAt(i);
									}
								}

								pt.set("xVal", nx);
								pt.set("yVal", ny);

							}
						} else {
							var pt = store.findBy(function(record) {
								return (record.get("xVal") > x - dx * 5 && record.get("xVal") < x + dx * 5)
							});
							if (pt > -1) {
								pt = store.getAt(pt)
							} else {
								pt = null;
							}

							if (!pt) {
								var e = {
									xVal: nx,
									yVal: ny
								};
								editor.completeEdit();
								store.insert(0, e);

							} else {
								//pt.set("xVal", nx);
								pt.set("yVal", ny);
							}
						}
						store.sort('xVal', 'ASC');

						if (!e.shiftKey) {
							var index = store.findBy(function(record) {
								return record.get("xVal") == nx && record.get("yVal") == ny;
							});
							if (index >= 0) {
								gridPan.getSelectionModel().selectRange(index, index);
							}
						}

						gridPan.getView().refresh();
					}
				});
			}
		},
		buttons: [{
				hidden: !viewConfig.allowEdits,
				scale: "large",
				id: 'equationUnitsBut',
				text: formatUnitsBut(cell.getAttribute("Units")),
				glyph: 0xf1de,
				tooltip: getText('图元单位'),
				handler: function() {
					var unitsWindow = new UnitsWindow({
						parent: "",
						cell: config.cell,
						units: config.cell.getAttribute("Units")
					});
					unitsWindow.show();
				}
			},
			'->',
			editorCancelButton(config),
			editorApplyButton(config, {
				getValue: function() {
					editor.completeEdit();
					return getKeys();
				},
				saveValue: function(cell, val) { setValue(cell, val); },
				afterApply: function(config) {
					if (config.parent != "") {
						config.parent.resumeEvents();
						grid.plugins[0].completeEdit();
					}
				}
			})
		]
	});

	window.chart = chart;


	function getKeys() {
		var s = "";
		for (var i = 0; i < store.getCount(); i++) {
			if (i > 0) {
				s = s + "; ";
			}
			s = s + store.getAt(i).data.xVal + "," + store.getAt(i).data.yVal;
		}
		return s;
	}

	function getXRange() {
		if (store.getCount() == 0) {
			return [0, 1];
		} else {
			return [store.getAt(0).data.xVal, store.getAt(store.getCount() - 1).data.xVal];
		}
	}




	store.on('update',
		function() {
			store.sort('xVal', 'ASC');
		});


	me.show = function() {
		win.show();

		/*chart.on({
		  click: function(e) {
			  
		    console.log(e);
			console.log(chart.getEventXY(e));
			console.log(e.getXY());
			console.log(e.getPoint());
		  }
		});*/
	}
}

