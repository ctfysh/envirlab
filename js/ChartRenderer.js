"use strict";
/*

Copyright 2010-2020 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

var displayConfigWin;
var displayConfigStore;
var displayConfigStore2;

function createColorManager() {
	var index = 0;
	return function(displayInformation, i) {
		if (!isGray(displayInformation.colors[i])) {
			return displayInformation.colors[i];
		}
		var color = defaultColors[index];
		index = (index + 1) % defaultColors.length;
		return color;
	};
}

function createTooltipRenderer(xfield, xname, yfield, yname) {
	return function (storeItem, item) {
		this.setHtml(clean(xname) + ": " + commaStr(storeItem.get(xfield)) + "<br/>" + clean(yname) + ": " + commaStr(storeItem.get(yfield)));
	}
}

function createAgentTipRenderer(agentName) {
	return function (storeItem, item) {
		var label = item.field;
		label = label.substr(0, label.length - 1);
		this.setTitle(agentName + " " + storeItem.get("agentIndex"));
		this.setHtml((storeItem.get("states") ? ("<p>" + storeItem.get("states") + "</p>") : "") + "<p>(" + commaStr(storeItem.get(label + "x")) + "; " + commaStr(storeItem.get(label + "y")) + ")</p>");
	}
}

function openDisplayConfigure(win) {

	if (true /*!displayConfigWin*/) {
		displayConfigStore = new Ext.data.JsonStore({
			fields: [{
				name: 'pid',
				type: 'string'
			}, {
				name: 'pname',
				type: 'string'
			}],
			data: []
		});
		displayConfigStore2 = new Ext.data.JsonStore({
			fields: [{
				name: 'pid',
				type: 'string'
			}, {
				name: 'pname',
				type: 'string'
			}],
			data: []
		});
		displayConfigWin = new Ext.Window({
			layout: 'fit',
			modal: true,
			autoScroll: true,
			title: getText("图表/表格配置"),
			width: Math.min(Ext.getBody().getViewSize().width, 470),
			height: Math.min(Ext.getBody().getViewSize().height, 580),
			resizable: false,
			closeAction: 'destroy',
			plain: true,
			items: [new Ext.FormPanel({
				fieldDefaults: {
					labelWidth: 80
				},
				frame: true,
				autoScroll: true,
				id: 'displayConfigure',
				bodyStyle: 'padding:5px 5px 0px 12px',
				defaults: {
					width: 425
				},
				items: [{
					xtype: 'fieldset',
					title: getText('一般设置'),
					defaultType: 'textfield',
					defaults: {
						anchor: '100%'
					},

					layout: 'anchor',
					items: [
						{
							name: 'chartType',
							id: 'chartType',
							fieldLabel: getText('类型'),
							xtype: "segmentedbutton",
							style: {
								"margin-bottom": "10px"
							},
							items: [
								{
									text: getText("时间序列"),
									itemId: "Time Series",
									pressed: true,
									tooltip: "时间序列图表显示一个或图元的值如何随时间变化。"
								},
								{	
									text: getText("散点图"),
									itemId: "Scatterplot",
									tooltip: "散点图允许您查看两个图元如何一起变化。 它也被称为相平面图。"
								},
								{
									text: getText("表格"),
									itemId: "Tabular",
									tooltip: "表格为您提供模拟过程中图元的精确值。"
								},
								{
									text: getText("主体地图"),
									itemId: "Map",
									tooltip: "主体映射在主体群图元中绘制主体的地理位置。 还绘制了主体和主体状态之间的连接。"
								}
							],
							listeners: {
								toggle: function (t, button, isPressed) {
									if (isPressed) {
										var newV = button.getItemId();

										if (newV == "Scatterplot") {
											Ext.getCmp("xAxisLabel")
												.setValue("%o");
											Ext.getCmp("yAxisLabel")
												.setValue("%o");
											Ext.getCmp("showMarkers")
												.setValue(true);
											Ext.getCmp("showLines")
												.setValue(false);
										} else if (newV == "Time Series") {
											Ext.getCmp("xAxisLabel")
												.setValue("Time (%u)");
											Ext.getCmp("yAxisLabel")
												.setValue("");
											Ext.getCmp("showMarkers")
												.setValue(false);
											Ext.getCmp("showLines")
												.setValue(true);
										} else if (newV == "Map") {
											Ext.getCmp("xAxisLabel")
												.setValue("%o");
											Ext.getCmp("yAxisLabel")
												.setValue("%o");
											Ext.getCmp("showMarkers")
												.setValue(true);
											Ext.getCmp("showLines")
												.setValue(false);
										}
										/*
										Ext.getCmp("chartSettings")
											.setDisabled(newV == "Tabular");
										*/
										if (newV == "Tabular") {
											Ext.getCmp("chartSettings").setStyle("opacity", 0.4);
										} else {
											Ext.getCmp("chartSettings").setStyle("opacity", 1);
										}
									}

								}
							}
						},

						{
							fieldLabel: getText('标题'),
							id: 'chartTitle',
							name: 'chartTitle',
							allowBlank: false
						}

						, Ext.create('Ext.form.field.Tag', {
							fieldLabel: getText('数据'),
							name: 'chartPrimitives',
							id: 'chartPrimitives',
							displayField: 'pname',
							valueField: 'pid',
							filterPickList: true,
							queryMode: 'local',
							store: displayConfigStore,
							emptyText: getText('选择要显示的数据')
						}), {
							xtype: 'checkboxfield',
							fieldLabel: '',
							name: 'autoAdd',
							id: 'autoAdd',
							boxLabel: getText("将新创建的图元添加到数据中")
						}

					]
				},

				{
					xtype: 'fieldset',
					title: getText('图表设置'),
					defaultType: 'textfield',
					id: "chartSettings",
					defaults: {
						anchor: '100%'
					},
					layout: 'anchor',
					items: [{
						xtype: 'container',
						layout: 'column',
						anchor: '100%',
						margin: 7,
						items: [{
							columnWidth: .33,
							xtype: 'checkboxfield',
							boxLabel: getText('显示标记'),
							name: 'showMarkers',
							inputValue: '1',
							id: 'showMarkers'
						}, {
							columnWidth: .33,
							xtype: 'checkboxfield',
							boxLabel: getText('显示线条'),
							name: 'showLines',
							inputValue: '1',
							id: 'showLines'
						}, {
							columnWidth: .33,
							xtype: 'checkboxfield',
							boxLabel: getText('使用区域'),
							name: 'showArea',
							inputValue: '1',
							id: 'showArea'
						}]
					}, {
						xtype: "combo",
						id: "legendPosition",
						fieldLabel: getText('图例位置'),
						allowBlank: false,
						labelWidth: 140,
						store: [
							["Automatic", getText("自动")],
							["Top", getText("顶部")],
							["Right", getText("靠右")],
							["Bottom", getText("底部")],
							["Left", getText("靠左")],
							["None", getText("无")]
						],
						queryMode: 'local',
						forceSelection: true
					}, {
						xtype: 'fieldset',
						title: getText('X轴'),
						defaultType: 'textfield',
						defaults: {
							anchor: '100%'
						},
						layout: 'anchor',
						items: [{
							xtype: 'fieldcontainer',
							fieldLabel: '',
							layout: 'hbox',
							defaultType: 'textfield',

							fieldDefaults: {
								labelAlign: 'top'
							},

							items: [{
								flex: 1,
								fieldLabel: getText('标签'),
								id: 'xAxisLabel',
								name: 'xAxisLabel'
							}, {
								hidden: false,
								xtype: "numberfield",
								fieldLabel: getText('最小值'),
								width: 110,
								id: 'xAxisMin',
								name: 'xAxisMin',
								margin: '0 0 0 5'
							}, {
								hidden: false,
								xtype: "numberfield",
								fieldLabel: getText('最大值'),
								width: 110,
								id: 'xAxisMax',
								name: 'xAxisMax',
								margin: '0 0 0 5'
							}]
						}]
					}, {
						xtype: 'fieldset',
						title: getText('Y轴'),
						defaultType: 'textfield',
						defaults: {
							anchor: '100%'
						},
						layout: 'anchor',
						items: [{
							xtype: 'fieldcontainer',
							fieldLabel: '',
							layout: 'hbox',
							defaultType: 'textfield',

							fieldDefaults: {
								labelAlign: 'top'
							},

							items: [{
								flex: 1,
								fieldLabel: getText('标签'),
								id: 'yAxisLabel',
								name: 'yAxisLabel'
							}, {
								hidden: false,
								xtype: "numberfield",
								fieldLabel: getText('最小值'),
								width: 110,
								id: 'yAxisMin',
								name: 'yAxisMin',
								margin: '0 0 0 5'
							}, {
								hidden: false,
								xtype: "numberfield",
								fieldLabel: getText('最大值'),
								width: 110,
								id: 'yAxisMax',
								name: 'yAxisMax',
								margin: '0 0 0 5'
							}]
						}]
					}, {
						xtype: 'fieldset',
						title: getText('第二Y轴'),
						defaultType: 'textfield',
						defaults: {
							anchor: '100%'
						},
						layout: 'anchor',
						items: [Ext.create('Ext.form.field.Tag', {
							fieldLabel: getText('数据'),
							name: 'chartPrimitives2',
							id: 'chartPrimitives2',
							displayField: 'pname',
							filterPickList: true,
							valueField: 'pid',
							queryMode: 'local',
							store: displayConfigStore2,
							emptyText: getText('选择要显示的数据')
						}), {
							xtype: 'fieldcontainer',
							layout: 'hbox',
							defaultType: 'textfield',

							fieldDefaults: {
								labelAlign: 'top'
							},

							items: [{
								flex: 1,
								fieldLabel: getText('标签'),
								id: 'yAxisLabel2',
								name: 'yAxisLabel2'
							}, {
								hidden: false,
								xtype: "numberfield",
								fieldLabel: getText('最小值'),
								width: 110,
								id: 'yAxisMin2',
								name: 'yAxisMin2',
								margin: '0 0 0 5'
							}, {
								hidden: false,
								xtype: "numberfield",
								fieldLabel: getText('最大值'),
								width: 110,
								id: 'yAxisMax2',
								name: 'yAxisMax2',
								margin: '0 0 0 5'
							}]
						}
						]
					}]
				}
				]
			})],

			buttons: [{
				scale: "large",
				glyph: 0xf05c,
				text: getText('取消'),
				handler: function () {
					displayConfigWin.close();
				}
			}, {
				glyph: 0xf00c,
				scale: "large",
				text: getText('应用'),
				handler: function () {
					var d = displayConfigWin.myDisplay;
					var w = displayConfigWin.myWin;
					if (Ext.getCmp("chartTitle")
						.validate() && Ext.getCmp("chartPrimitives")
							.validate()) {

						modelTransaction(function() {
							var model = graph.getModel();
							model.execute(new mxCellAttributeChange(d, "name", Ext.getCmp("chartTitle")
								.getValue()));
						w.tabs.getActiveTab()
							.setTitle(Ext.getCmp("chartTitle")
								.getValue());

						var type;
						Ext.getCmp("chartType").items.each(function (x) {
							if (x.pressed) {
								type = x.getItemId();
							}
						});

							model.execute(new mxCellAttributeChange(d, "Type", type));
							model.execute(new mxCellAttributeChange(d, "AutoAddPrimitives", Ext.getCmp("autoAdd")
								.getValue().toString()));

							model.execute(new mxCellAttributeChange(d, "legendPosition", Ext.getCmp("legendPosition")
								.getValue()));

							model.execute(new mxCellAttributeChange(d, "xAxis", Ext.getCmp("xAxisLabel")
								.getValue()));
							model.execute(new mxCellAttributeChange(d, "yAxis", Ext.getCmp("yAxisLabel")
								.getValue()));
							model.execute(new mxCellAttributeChange(d, "yAxis2", Ext.getCmp("yAxisLabel2")
								.getValue()));

							model.execute(new mxCellAttributeChange(d, "xAxisMin", Ext.getCmp("xAxisMin")
								.getValue()));
							model.execute(new mxCellAttributeChange(d, "yAxisMin", Ext.getCmp("yAxisMin")
								.getValue()));
							model.execute(new mxCellAttributeChange(d, "yAxisMin2", Ext.getCmp("yAxisMin2")
								.getValue()));

							model.execute(new mxCellAttributeChange(d, "xAxisMax", Ext.getCmp("xAxisMax")
								.getValue()));
							model.execute(new mxCellAttributeChange(d, "yAxisMax", Ext.getCmp("yAxisMax")
								.getValue()));
							model.execute(new mxCellAttributeChange(d, "yAxisMax2", Ext.getCmp("yAxisMax2")
								.getValue()));

						var items = Ext.getCmp("chartPrimitives")
							.getValue();
						if (type == "Scatterplot") {
							if (items.length > 2) {
								items.length = 2;
								mxUtils.alert(getText("散点图的图元列表已被截断为两个项目。一个用于x轴，一个用于y轴。"));
							} else if (items.length == 1) {
								mxUtils.alert(getText("您需要两个图元来创建散点图。一个用于x轴，一个用于y轴。"));
							}
						} else if (type == "Map") {
							//console.log(items);
							var removed = false;
							for (var i = items.length - 1; i >= 0; i--) {
								//console.log("--")
								//console.log(items[i]);
								//console.log(findID(items[i]));
								if (items[i] && findID(items[i])
									.value.nodeName != "Agents") {
									items.splice(i, 1);
									removed = true;
								} else if (!items[i]) {
									items.splice(i, 1);
								}

							}
							if (removed) {
								mxUtils.alert(getText("地图图表只能显示主体群图元。"));
							}
						}
							model.execute(new mxCellAttributeChange(d, "Primitives", items.join(",")));
							model.execute(new mxCellAttributeChange(d, "Primitives2", Ext.getCmp("chartPrimitives2")
								.getValue()
								.join(",")));

							model.execute(new mxCellAttributeChange(d, "showMarkers", Ext.getCmp("showMarkers")
								.getValue().toString()));
							model.execute(new mxCellAttributeChange(d, "showLines", Ext.getCmp("showLines")
								.getValue().toString()));
							model.execute(new mxCellAttributeChange(d, "showArea", Ext.getCmp("showArea")
								.getValue().toString()));

						w.tabs.getActiveTab()
							.removeAll();
						for (var i = w.displayInformation.maps.length - 1; i >= 0; i--) {
							if (w.displayInformation.maps[i].id == d.id) {
								w.displayInformation.maps.splice(i, 1);
							}
						}
						for (var i = w.displayInformation.histograms.length - 1; i >= 0; i--) {
							if (w.displayInformation.histograms[i].id == d.id) {
								w.displayInformation.histograms.splice(i, 1);
							}
						}
						w.tabs.getActiveTab()
							.add(renderDisplay(d, w.displayInformation));
						displayConfigWin.close();

						});

						win.enableTabs();
					} else {
						mxUtils.alert(getText("在应用之前更正显示配置。"));
					}
				}
			}

			]
		});

	}

	var storeData = [];
	for (var i = 0; i < win.displayInformation.displayedIds.length; i++) {
		storeData.push({
			pid: win.displayInformation.displayedIds[i],
			pname: win.displayInformation.displayedHeaders[i]
		});
	}

	storeData.sort(function (a, b) {
		return a.pname.localeCompare(b.pname);
	});

	displayConfigStore.loadData(storeData);
	displayConfigStore2.loadData(storeData);
	var d = win.tabs.getActiveTab()
		.display;
	Ext.getCmp("chartTitle")
		.setValue(d.getAttribute("name"));
	Ext.getCmp("chartType").items.each(function (x) {
		x.setPressed(x.getItemId() == d.getAttribute("Type"));
	});
	Ext.getCmp("xAxisLabel")
		.setValue(d.getAttribute("xAxis"));
	Ext.getCmp("yAxisLabel")
		.setValue(d.getAttribute("yAxis"));
	Ext.getCmp("yAxisLabel2")
		.setValue(d.getAttribute("yAxis2"));

	Ext.getCmp("xAxisMin")
		.setValue(d.getAttribute("xAxisMin"));
	Ext.getCmp("yAxisMin")
		.setValue(d.getAttribute("yAxisMin"));
	Ext.getCmp("yAxisMin2")
		.setValue(d.getAttribute("yAxisMin2"));
	Ext.getCmp("xAxisMax")
		.setValue(d.getAttribute("xAxisMax"));
	Ext.getCmp("yAxisMax")
		.setValue(d.getAttribute("yAxisMax"));
	Ext.getCmp("yAxisMax2")
		.setValue(d.getAttribute("yAxisMax2"));

	Ext.getCmp("legendPosition")
		.setValue(d.getAttribute("legendPosition"));

	Ext.getCmp("showMarkers")
		.setValue(d.getAttribute("showMarkers"));
	Ext.getCmp("showLines")
		.setValue(d.getAttribute("showLines"));
	Ext.getCmp("showArea")
		.setValue(d.getAttribute("showArea"));


	Ext.getCmp("autoAdd")
		.setValue(d.getAttribute("AutoAddPrimitives"));

	Ext.getCmp("chartPrimitives")
		.setValue([]);
	if (!isUndefined(d.getAttribute("Primitives"))) {

		Ext.getCmp("chartPrimitives")
			.setValue(d.getAttribute("Primitives")
				.split(","));
	}
	Ext.getCmp("chartPrimitives2")
		.setValue([]);
	if (!isUndefined(d.getAttribute("Primitives2"))) {
		Ext.getCmp("chartPrimitives2")
			.setValue(d.getAttribute("Primitives2")
				.split(","));
	}

	displayConfigWin.myDisplay = d;
	displayConfigWin.myWin = win;
	displayConfigWin.show();
	Ext.getCmp("displayConfigure").scrollTo(0, 0, false);
}



function renderDisplay(display, displayInformation) {
	var type = display.getAttribute("Type");
	var primitives = isDefined(display.getAttribute("Primitives")) ? display.getAttribute("Primitives")
		.split(",") : [];
	for (var i = primitives.length - 1; i >= 0; i--) {
		if (inAgent(findID(primitives[i]))) {
			primitives.splice(i, 1);
		}
	}
	var primitives2 = isDefined(display.getAttribute("Primitives2")) ? display.getAttribute("Primitives2")
		.split(",") : [];
	for (var i = primitives2.length - 1; i >= 0; i--) {
		if (inAgent(findID(primitives2[i]))) {
			primitives2.splice(i, 1);
		}
	}

	if (primitives.length == 0 || (type == "Scatterplot" && primitives.length < 2)) {
		return {
			xtype: "box",
			html: "<br/><br/><br/><b><big><center><span style='color:darkgray'>" + getText("没有数据显示") + "<br/><br/>" + getText("按\u201C配置\u201D以选择数据") + "</span></center></big></b>"
		};
	}

	var chart;
	var histograms = [];
	if (type == "Tabular") {
		var cols = [{
			header: getText("时间"),
			sortable: true,
			flex: 1,
			dataIndex: "Time",
			renderer: function (x) {
				return round(x, 9);
			}
		}];
		for (var j = 0; j < primitives.length; j++) {
			for (var i = 0; i < displayInformation.ids.length; i++) {
				if (primitives[j] == displayInformation.ids[i]) {
					cols.push({
						header: displayInformation.headers[i],
						sortable: true,
						flex: 1,
						dataIndex: displayInformation.elementIds[i],
						renderer: dataRenderer
					});
				}
			}
		}

		var grid = new Ext.grid.GridPanel({
			store: displayInformation.store,
			columns: cols,
			layout: 'fit',
			scrollable: true,
			stripeRows: true,
			bufferedRenderer: false,
			border: false,
			frame: false,
			header: false,
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'bottom',
				items: ["->", downloadButton(display.getAttribute("name"))]
			}]
		});

		return grid;
	} else if (type == "Time Series") {
		primitives = primitives.concat(primitives2);
		var displayIds1 = [];
		var displayIds2 = [];
		var displayNames1 = [];
		var displayNames2 = [];
		var displaySeries = [];


		var colors = [];
		var getColor = createColorManager();

		if (isTrue(display.getAttribute('showArea'))) {

			var fields = [];
			var titles = [];
			for (var j = 0; j < primitives.length; j++) {
				for (var i = 0; i < displayInformation.ids.length; i++) {
					if (primitives[j] == displayInformation.ids[i]) {
						if (displayInformation.renderers[i]) {
							var left = primitives2.indexOf(primitives[j]) == -1
							if (left) {
								colors.push(getColor(displayInformation, i));

								fields.push(displayInformation.elementIds[i]);
								titles.push(displayInformation.headers[i]);
							}
						} else {
							histograms.push(createHistogramChart(displayInformation, i));
						}
					}
				}
			}

			displaySeries.push({
				highlight: false,
				type: 'area',
				axis: "left",
				xField: "Time",
				yField: fields,
				title: titles,
				smooth: false,
				colors: colors
			});




		} else {

			for (var j = 0; j < primitives.length; j++) {

				for (var i = 0; i < displayInformation.ids.length; i++) {
					if (primitives[j] == displayInformation.ids[i]) {
						//console.log(displayInformation.ids[i])
						//console.log(displayInformation.renderers[i])
						if (displayInformation.renderers[i]) {

							var left = primitives2.indexOf(primitives[j]) == -1
							var x = displayInformation.elementIds[i];

							var c = getColor(displayInformation, i);
							colors.push(c);

							var strokeStyle = {
								'stroke-width': 4
								/*,
								stroke: c*/
							};
							if (!isTrue(display.getAttribute("showLines"))) {
								//strokeStyle.opacity = 0
								strokeStyle.stroke = "none";
							}

							if (left) {
								displayNames1.push(displayInformation.headers[i])
								displayIds1.push(x);
							} else {
								displayNames2.push(displayInformation.headers[i])
								displayIds2.push(x);
							};

							displaySeries.push({
								type: 'line',
								axis: left ? "left" : "right",
								xField: "Time",
								yField: left ? displayIds1[displayIds1.length - 1] : displayIds2[displayIds2.length - 1],
								title: left ? displayNames1[displayNames1.length - 1] : displayNames2[displayNames2.length - 1],
								showMarkers: isTrue(display.getAttribute("showMarkers")),
								marker: {
									radius: 4
								},
								colors: [c],
								smooth: false,
								style: strokeStyle,
								highlight: true,
								highlightCfg: {
									radius: 5
								},
								tooltip: {
									trackMouse: true,
									width: 160,
									style: 'background-color: #fff',
									renderer: function (storeItem, item) {
										this.setHtml("Time: " + storeItem.get("Time") + "<br/>" + clean(item.series.getTitle()) + ": " + commaStr(storeItem.get(item.field)));
									}
								}

							})
						} else {
							histograms.push(createHistogramChart(displayInformation, i));
						}
					}
				}
			}
		}


		var axes = [{
			type: 'numeric',
			position: 'bottom',
			fields: "Time",
			minimum: isUndefined(display.getAttribute("xAxisMin")) ? displayInformation.store.min("Time") : parseFloat(display.getAttribute("xAxisMin")),
			maximum: isUndefined(display.getAttribute("xAxisMax")) ? displayInformation.times[displayInformation.times.length - 1] : parseFloat(display.getAttribute("xAxisMax")),
			title: {
				text: quickLabel(display.getAttribute("xAxis"), display.getAttribute("name"), stringArray(displayNames1, ", ", " and ")),
				fontSize: 14
			},
			grid: true,
			titleMargin: 16,
			renderer: function (x) {
				return round(x, 9);
			}
		}];

		if (primitives.length > primitives2.length) {
			axes.push({
				type: 'numeric',
				position: 'left',

				minimum: numericBound(display.getAttribute("yAxisMin")),
				maximum: numericBound(display.getAttribute("yAxisMax")),
				fields: displayIds1,
				grid: true,
				title: {
					text: quickLabel(display.getAttribute("yAxis"), display.getAttribute("name"), stringArray(displayNames1, ", ", " and ")),
					fontSize: 14
				},
				titleMargin: 20,
				renderer: commaStr
			});
		}

		// A blank item may be added to the primitive
		primitives2 = primitives2.filter(p => !!p);
		
		if (primitives2.length > 0) {
			axes.push({
				minimum: numericBound(display.getAttribute("yAxisMin2")),
				maximum: numericBound(display.getAttribute("yAxisMax2")),
				type: 'numeric',
				position: 'right',
				fields: displayIds2,
				grid: primitives.length == primitives2.length,
				title: {
					text: quickLabel(display.getAttribute("yAxis2"), display.getAttribute("name"), stringArray(displayNames2, ", ", " and ")),
					fontSize: 14
				},
				titleMargin: 20,
				renderer: commaStr
			});
		}


		chart = {
			flex: 1,
			interactions: ['crosszoom', 'itemhighlight'],


			animation: false,
			shadow: false,
			store: displayInformation.store,
			axes: axes,
			series: displaySeries
		};

		if (display.getAttribute('legendPosition') != "None") {

			chart.legend = {
				docked: display.getAttribute('legendPosition') == "Automatic" ? (primitives.length > 4 ? 'right' : 'top') : display.getAttribute('legendPosition').toLowerCase()
			};
		}


		chart = Ext.create("Ext.chart.CartesianChart", chart);





	} else if (type == "Scatterplot") {
		var displayIds = [];
		var displayNames = [];
		for (var j = 0; j < primitives.length; j++) {

			for (var i = 0; i < displayInformation.ids.length; i++) {
				if (primitives[j] == displayInformation.ids[i]) {
					if (displayInformation.renderers[i]) {
						displayIds.push(displayInformation.elementIds[i]);
						displayNames.push(displayInformation.headers[i]);
					} else {
						histograms.push(createHistogramChart(displayInformation, i));
					}
				}
			}
		}

		var strokeStyle = {
			'stroke-width': 4
		};
		if (!isTrue(display.getAttribute("showLines"))) {
			//strokeStyle.opacity = 0
			strokeStyle.stroke = "none";
		}



		chart = Ext.create("Ext.chart.CartesianChart", {
			flex: 1,
			interactions: ['crosszoom', 'itemhighlight'],
			xtype: 'chart',
			animation: false,

			shadow: false,
			store: displayInformation.store,
			axes: [{
				minimum: numericBound(display.getAttribute("xAxisMin")),
				maximum: numericBound(display.getAttribute("xAxisMax")),
				type: 'numeric',
				position: 'bottom',
				fields: displayIds[0],
				titleMargin: 16,
				grid: true,
				title: {
					text: quickLabel(display.getAttribute("xAxis"), display.getAttribute("name"), displayNames[0]),
					fontSize: 14
				},
				renderer: commaStr
			}, {

				minimum: numericBound(display.getAttribute("yAxisMin")),
				maximum: numericBound(display.getAttribute("yAxisMax")),
				type: 'numeric',
				position: 'left',
				fields: displayIds[1],
				grid: true,
				title: {
					text: quickLabel(display.getAttribute("yAxis"), display.getAttribute("name"), displayNames[1]),
					fontSize: 14
				},
				titleMargin: 20,
				renderer: commaStr
			}],
			series: [{
				type: 'scatter', // 'line' type can result in some strange rendering issues
				axis: "left",
				xField: displayIds[0],
				yField: displayIds[1],
				showMarkers: isTrue(display.getAttribute("showMarkers")),
				marker: {
					radius: 4
				},
				style: strokeStyle,
				smooth: false,
				highlight: true,
				highlightCfg: {
					radius: 5
				},
				tooltip: {
					trackMouse: true,
					width: 160,
					style: 'background-color: #fff',
					renderer: createTooltipRenderer(displayIds[0], displayNames[0], displayIds[1], displayNames[1])
				}

			}]
		});

	} else if (type == "Map") {

		var colors = [];
		var getColor = createColorManager();

		var storeFields = [{
			type: "float",
			name: "agentIndex"
		}, {
			type: "string",
			name: "states"
		}];
		var storeData = [];
		var displaySeries = []
		var seriesBase = [];
		var xfields = [];
		var yfields = [];
		var agents = [];



		for (var j = 0; j < primitives.length; j++) {
			var id = primitives[j];
			var a = displayInformation.agents[id];
			if (isUndefined(a)) {
				alert(getText("图元不是主体群！"));
				return;
			}
			agents.push(a);
			var agentName = getName(findID(a.item.getAttribute("Agent")));
			addSeries("series_" + id + "__", agentName);
			for (var s = 0; s < a.data.states.length; s++) {
				var base = "series_" + id + "_" + a.data.states[s] + "_";
				var name = getName(findID(a.data.states[s]));
				addSeries(base, name);
			}

		}

		var store = new Ext.data.Store({
			fields: storeFields
		});


		chart = Ext.create("Ext.chart.CartesianChart", {

			flex: 1,
			interactions: ['crosszoom', 'itemhighlight'],
			legend: display.getAttribute('legendPosition') == "None" ? false : {
				docked: display.getAttribute('legendPosition') == "Automatic" ? (seriesBase.length > 4 ? 'right' : 'top') : display.getAttribute('legendPosition').toLowerCase()
			},
			animation: false,
			animate: false,

			shadow: false,
			store: store,
			axes: [{
				type: 'numeric',
				position: 'left',
				fields: yfields,
				grid: false,
				title: {
					text: quickLabel(display.getAttribute("yAxis"), display.getAttribute("name"), "Position (" + a.item.getAttribute("GeoDimUnits") + ")"),
					fontSize: 14
				},
				titleMargin: 20,
				renderer: commaStr,
				minimum: 0,
				maximum: parseFloat(simpleNum(a.data.height, a.data.units))
			}, {
				type: 'numeric',
				position: 'bottom',
				fields: xfields,
				grid: false,
				titleMargin: 16,
				title: {
					text: quickLabel(display.getAttribute("xAxis"), display.getAttribute("name"), "Position (" + a.item.getAttribute("GeoDimUnits") + ")"),
					fontSize: 14
				},
				renderer: commaStr,
				minimum: 0,
				maximum: parseFloat(simpleNum(a.data.width, a.data.units))
			}],
			series: displaySeries,
			listeners: {
				'redraw': function (chart) {

					if (this.oldLinks) {
						for (var i = 0; i < this.oldLinks.length; i++) {
							this.oldLinks[i].destroy();
						}
						this.oldLinks = [];
					}
					if (this.links) {
						var scaleX = function (v) {
							var box = chart.getInnerRect();
							var outX = chart.getAxes()[1].getRange();

							return (v - outX[0]) / (outX[1] - outX[0]) * box[2];
						}
						var scaleY = function (v) {
							var box = chart.getInnerRect();
							var outY = chart.getAxes()[0].getRange();

							return box[3] - (v - outY[0]) / (outY[1] - outY[0]) * box[3];
						}

						this.oldLinks = [];

						var color = "#aaa";
						var opacity = 0.5;
						var strokeWidth = 1;

						var defs = [];

						for (var link in this.links) {

							var start = this.links[link][0];
							var end = this.links[link][1];
							//console.log(start)
							//console.log(end)
							var points = [[scaleX(start.items[0]), scaleY(start.items[1])], [scaleX(end.items[0]), scaleY(end.items[1])]];
							//	console.log(points)

							var path = "M" + points[0][0] + " " + points[0][1] + " "; // start svg path parameters with given array
							for (i = 1; i < points.length; i++) {
								path = path + "L" + points[i][0] + " " + points[i][1] + " ";
							}
							path = path + "Z"; // end svg path params
							//console.log(path)

							defs.push({
								type: 'path',
								opacity: opacity,
								fill: color,
								path: path,
								stroke: color,
								'stroke-width': strokeWidth
							});

						}

						this.oldLinks = chart.getSurface("main").add.apply(chart.getSurface("main"), defs);
					}

				}
			}
		});

		displayInformation.maps.push({
			id: display.id,
			store: store,
			agents: agents,
			bases: seriesBase,
			chart: chart
		});
		buildMapStore(displayInformation.maps[displayInformation.maps.length - 1], displayInformation.scripter.time);

	}



	if (type != "Tabular") {
		var items = [];
		if (chart.series.length > 0) {
			items.push(chart);
		}
		items = items.concat(histograms);
		var p = {
			xtype: "panel",
			items: items,
			layout: items.length == 1 ? "fit" : {
				type: 'vbox',
				align: 'stretch'
			},

			html: "<div id='scratchpad" + analysisCount + "_" + display.id + "' style='z-index:1000;position:absolute; left:0px;bottom:0px;top:0px;right:0px;display:none;'></div>"
		};
		return p;
	}

	function addSeries(base, name) {
		seriesBase.push(base);

		xfields.push(base + "x");
		yfields.push(base + "y");

		storeFields.push({
			type: "float",
			name: base + "x"
		});
		storeFields.push({
			type: "float",
			name: base + "y"
		});

		var i = 0;
		for (i = 0; i < displayInformation.colors.length; i++) {
			if (displayInformation.ids[i] == id && displayInformation.headers[i] == name) {
				break;
			}
		}
		//console.log(i);
		var color = getColor(displayInformation, i);
		//console.log(color);

		var markers = [{
			type: "circle",
			radius: 5
		}, {
			type: "rect",
			width: 9,
			height: 9
		}, {
			type: 'path',
			path: [
				['M', 0, 1],
				['L', 1, 0],
				['L', 0, -1],
				['L', -1, 0],
				['Z']
			],
			scale: 6
		},

		{
			type: 'path',
			path: [
				['M', 0, -145],
				['L', 48, -50],
				['L', 153, -36],
				['L', 76, 39],
				['L', 93, 143],
				['L', 0, 95],
				['L', -93, 143],
				['L', -76, 39],
				['L', -153, -36],
				['L', -48, -50],
				['Z'
				]
			],
			scalingX: 0.05,
			scalingY: -0.05
		}

		];

		displaySeries.push({
			title: name,
			animation: false,
			type: 'scatter',
			axis: "left",
			colors: [color],
			xField: base + "x",
			yField: base + "y",
			marker: markers[j % 5],
			highlight: true,
			highlightCfg: {
				radius: 5
			},
			tooltip: {
				trackMouse: true,
				width: 160,
				style: 'background-color: #fff',
				renderer: createAgentTipRenderer(agentName)
			}
		});
	}
}
