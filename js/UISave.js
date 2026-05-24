"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

function setSaveEnabled(e) {
	if (is_editor && (!is_embed)) {
		var b = ribbonPanelItems().getComponent('savebut');
		if (!b) return;
		if (e && unfoldingManager.unfolding == false) {
			b.setDisabled(false);
			b.setText(getText('保存'));
		} else {
			b.setDisabled(true);
			b.setText(getText('已保存'));
		}
	}
}

function updateWindowTitle() {
	if (!is_embed) {
		if (graph_title == "") {
			document.title = "未命名 | 环境虚拟仿真实验平台";
		} else {
			document.title = graph_title + " | 环境虚拟仿真实验平台";
		}
	}
}

function downloadModel() {
	var data = getGraphXml(graph);
	surpressCloseWarning = true;
	document.getElementById('downloader').title.value = encodeURIComponent(graph_title);
	document.getElementById('downloader').code.value = encodeURIComponent(data);
	document.getElementById('downloader').submit()
}

var propertiesWin;

function updateProperties() {
	var model_title;
	if (graph_title == "") {
		model_title = "Untitled Insight";
	} else {
		model_title = graph_title;
	}

	if (!propertiesWin) {
		propertiesWin = new Ext.Window({
			applyTo: 'property-win',
			layout: {
				type: 'vbox',
				align: "stretch"
			},
			modal: true,
			width: 550,
			title: getText('保存 Insight'),
			autoHeight: true,
			minHeight: 300,
			minWidth: 450,
			closable: true,
			resizable: true,
			autoScroll: true,
			closeAction: 'hide',
			defaults: {
				width: 230,
				labelWidth: 150
			},
			items: [new Ext.form.TextField({
				fieldLabel: getText('Insight 标题'),
				name: 'sinsightTitle',
				id: 'sinsightTitle',
				allowBlank: false,
				selectOnFocus: true,
				value: model_title,
				margin: 9
			}), new Ext.form.TextField({
				fieldLabel: getText('标签'),
				name: 'sinsightTags',
				id: 'sinsightTags',
				allowBlank: true,
				emptyText: getText("环境、医疗、金融"),
				value: graph_tags,
				margin: 9
			}), new Ext.form.field.HtmlEditor({
				enableColors: false,
				enableSourceEdit: false,
				enableFont: false,
				enableLists: true,
				enableFontSize: false,
				fieldLabel: getText('描述'),
				name: 'sinsightDescription',
				id: 'sinsightDescription',
				allowBlank: true,
				emptyText: getText("输入Insight的简短描述。"),
				value: graph_description,
				margin: 9,
				minHeight: 100,
				flex: 1
			})],

			buttons: [{
				text: getText('取消'),
				scale: "large",
				glyph: 0xf05c,
				handler: function() {
					propertiesWin.hide();
				}
			}, {
				glyph: 0xf00c,
				scale: "large",
				text: getText('保存'),
				handler: function() {
					if (Ext.getCmp("sinsightTitle").validate()) {
						propertiesWin.hide();
						graph_title = Ext.String.trim(Ext.getCmp('sinsightTitle').getValue());
						graph_description = Ext.String.trim(Ext.getCmp('sinsightDescription').getValue());
						graph_description = graph_description.replace(/^(\u200b|&nbsp;)/g, "");
						graph_description = graph_description.replace(/(\u200b|&nbsp;)$/g, "");
						if (graph_description == "<br>" || graph_description == "<br/>" || graph_description == "\u200b" || graph_description == "&nbsp;") {
							graph_description = "";
						}
						graph_tags = Ext.getCmp('sinsightTags').getValue();
						setSaveEnabled(true);
						sendGraphtoServer(graph);
						selectionChanged(false);
					} else {
						showNotification(getText("你必须指定一个名称"), "error", true);
					}
				}
			}]

		});
	} else {
		if (graph_title != "") {
			Ext.getCmp('sinsightTitle').setValue(graph_title);
			Ext.getCmp('sinsightTags').setValue(graph_tags);
			Ext.getCmp('sinsightDescription').setValue(graph_description);
		}
	}
	propertiesWin.show();
	Ext.getCmp("sinsightTitle").focus(true, 300);
}

var downloadButton = function(name) {
	return {
		xtype: 'button',
		text: getText('下载'),
		glyph: 0xf0ed,
		handler: function() {
			var grid = this.up("gridpanel");
			var store = grid.getStore();
			var columns = grid.columns;

			var res = "";

			res += columns.filter(function(x) {
				return !x.hidden;
			}).map(function(x) {
				return '"' + (x.text || x.name).replace(/"/g, '""') + '"';
			}).join(",");

			store.each(function(record, index) {
				var cells = [];
				columns.forEach(function(col) {
					var name = col.name || col.dataIndex;
					if (name) {
						var value = "" + record.get(name);
						cells.push('"' + value.replace(/"/g, '""') + '"');
					}
				});

				res += "\r\n" + cells.join(",");
			});

			downloadFile(name, res, 'text/csv');
		}
	};
};
