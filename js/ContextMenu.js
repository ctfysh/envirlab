"use strict";
/*

Copyright 2010-2018 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

var surpressCloseWarning = false;

function confirmClose() {
	if (!surpressCloseWarning) {
		var saveBut = ribbonPanelItems().down('#savebut');
		var saveDisabled = saveBut ? saveBut.disabled : true;
		if ((!saved_enabled) || saveDisabled || (!undoHistory.canUndo())) {

		} else {
			return getText("您已对此模型进行了未保存的更改。 如果您在保存之前离开，他们将会丢失。");
		}
	} else {
		surpressCloseWarning = false;
	}
}


window.onbeforeunload = function() {
	return confirmClose();
};



function showContextMenu(node, e) {
	var selectedItems = getSelected();
	var folder = false;
	if (selectedItems.length > 0) {
		folder = selectedItems[0].value.nodeName == "Folder" && (!getCollapsed(selectedItems[0]));
	}
	var selected = selectedItems.length > 0 && (!folder);


	var paste = {
		hidden: is_ebook,
		text: getText('粘贴'),
		glyph: 0xf0ea,
		disabled: mxClipboard.isEmpty(),
		handler: function() {
			graph.getModel().beginUpdate();
			try
			{
				var cells = mxClipboard.paste(graph);
				var pt = graph.getPointForEvent(e);
				if (cells != null)
				{
					var bb = graph.getBoundingBoxFromGeometry(cells);

					if (bb != null)
					{
						var t = graph.view.translate;
						var s = graph.view.scale;
						var dx = t.x;
						var dy = t.y;

						var x = Math.round(graph.snap(pt.x / s - dx));
						var y = Math.round(graph.snap(pt.y / s - dy));

						graph.cellsMoved(cells, x - bb.x, y - bb.y);
					}
				}
			}
			finally
			{
				graph.getModel().endUpdate();
			}

			clipboardListener();

		},
		scope: this
	};

	var menuItems = [];
	if(viewConfig.allowEdits){


	if (!selected) {
		var menuItems = [
			/*editActions.paste,
		'-',*/
			{
				text: getText("创建库"),
				glyph: 0xf1b2,
				handler: function() {
					graph.model.beginUpdate();
					var pt = graph.getPointForEvent(e);
					var cell = createPrimitive(getText("新库"), "Stock", [pt.x, pt.y], [100, 40]);
					graph.model.endUpdate();
					if (folder) {
						setParent(cell, selectedItems[0]);
					}
					setSelected(cell);

					setTimeout(function() {
						graph.cellEditor.startEditing(cell)
					}, 20);
				}
			}, {
				text: getText("创建变量"),
				glyph: 0xf0e4,
				handler: function() {
					graph.model.beginUpdate();
					var pt = graph.getPointForEvent(e);
					var cell = createPrimitive(getText("新变量"), "Variable", [pt.x, pt.y], [120, 50]);
					graph.model.endUpdate();
					if (folder) {
						setParent(cell, selectedItems[0]);
					}
					setSelected(cell);

					setTimeout(function() {
						graph.cellEditor.startEditing(cell)
					}, 20);
				}
			}, {
				text: getText("创建转换器"),
				glyph: 0xf1fe,
				handler: function() {
					graph.model.beginUpdate();
					var pt = graph.getPointForEvent(e);
					var cell = createPrimitive(getText("新转换器"), "Converter", [pt.x, pt.y], [120, 50]);
					graph.model.endUpdate();
					if (folder) {
						setParent(cell, selectedItems[0]);
					}
					setSelected(cell);

					setTimeout(function() {
						graph.cellEditor.startEditing(cell)
					}, 20);
				}
			}, '-', {
				text: getText("创建主体群"),
				glyph: 0xf0c0,
				handler: function() {
					graph.model.beginUpdate();
					var pt = graph.getPointForEvent(e);
					var cell = createPrimitive(getText("主体群"), "Agents", [pt.x, pt.y], [170, 80]);
					graph.model.endUpdate();
					if (folder) {
						setParent(cell, selectedItems[0]);
					}
					setSelected(cell);

					setTimeout(function() {
						graph.cellEditor.startEditing(cell)
					}, 20);
				}
			}, {
				text: getText("创建状态"),
				glyph: 0xf046,
				handler: function() {
					graph.model.beginUpdate();
					var pt = graph.getPointForEvent(e);
					var cell = createPrimitive(getText("新状态"), "State", [pt.x, pt.y], [100, 40]);
					graph.model.endUpdate();
					if (folder) {
						setParent(cell, selectedItems[0]);
					}
					setSelected(cell);

					setTimeout(function() {
						graph.cellEditor.startEditing(cell)
					}, 20);

				}
			}, {
				text: getText("创建动作"),
				glyph: 0xf0e7,
				handler: function() {
					graph.model.beginUpdate();
					var pt = graph.getPointForEvent(e);
					var cell = createPrimitive(getText("新动作"), "Action", [pt.x, pt.y], [120, 50]);
					graph.model.endUpdate();
					if (folder) {
						setParent(cell, selectedItems[0]);
					}
					setSelected(cell);

					setTimeout(function() {
						graph.cellEditor.startEditing(cell)
					}, 20);
				}
			}, , '-', {
				text: getText("创建文本框"),
				glyph: 0xf035,
				handler: function() {
					graph.model.beginUpdate();
					var pt = graph.getPointForEvent(e);
					var cell = createPrimitive(getText("新文本框"), "Text", [pt.x, pt.y], [200, 50]);
					graph.model.endUpdate();
					if (folder) {
						setParent(cell, selectedItems[0]);
					}
					setSelected(cell);

					setTimeout(function() {
						graph.cellEditor.startEditing(cell)
					}, 20);
				}
			}, {
				text: getText("创建图片"),
				glyph: 0xf03e,
				handler: function() {
					graph.model.beginUpdate();
					var pt = graph.getPointForEvent(e);
					var cell = createPrimitive("", "Picture", [pt.x, pt.y], [64, 64]);
					graph.model.endUpdate();
					if (folder) {
						setParent(cell, selectedItems[0]);
					}
					setPicture(cell);
					setSelected(cell);

					setTimeout(function() {
						graph.cellEditor.startEditing(cell)
					}, 20);
				}

			}, {
				text: getText("创建按钮"),
				glyph: 0xf196,
				handler: function() {
					graph.model.beginUpdate();
					var pt = graph.getPointForEvent(e);
					var cell = createPrimitive(getText("新按钮"), "Button", [pt.x, pt.y], [120, 40]);
					graph.model.endUpdate();
					if (folder) {
						setParent(cell, selectedItems[0]);
					}
					setSelected(cell);

					setTimeout(function() {
						graph.cellEditor.startEditing(cell)
					}, 20);
				}
			}
		];
		if (!is_ebook) {


			menuItems = menuItems.concat([
				'-', {
					glyph: 0xf0ed,
					text: getText("插入模型"),
					handler: function() {
						showInsertModelWindow(graph.getPointForEvent(e));
					}
				},
				'-', {
					glyph: 0xf1c5,
					text: getText("导出SVG"),
					handler: function() {
						exportSvg();
					}
				},
				{
					itemId: "zoomMenuButton",
					text: getText('缩放'),
					glyph: 0xf002,
					menu: zoomMenu
				}

			]);


		}

		if(!mxClipboard.isEmpty()){
			menuItems.unshift("-");
			menuItems.unshift(paste);
		}

	} else {
		menuItems = [
			editActions.copy,
			editActions.cut,
			paste,
			'-',
			editActions["delete"],
			'-', {
				text: getText("影子图元"),
				glyph: 0xf0c5,
				disabled: graph.getSelectionCount() != 1 || ((!isValued(graph.getSelectionCell()) && graph.getSelectionCell().value.nodeName != "Picture")) || graph.getSelectionCell().value.nodeName == "Flow" || graph.getSelectionCell().value.nodeName == "Ghost",
				handler: makeGhost
			}, {
				text: getText("创建文件夹"),
				glyph: 0xf114,
				disabled: !selected,
				handler: makeFolder
			},
			'-'/*, {
				text: getText("样式"),
				glyph: 0xf0d0,
				menu: styleMenu
			}*/
		].concat(styleMenu.filter(function(x){return ! x.excludeFromContext}));
		if(selectedItems.length == 1 && (selectedItems[0].value.nodeName == "Flow" || selectedItems[0].value.nodeName == "Link")){
			menuItems = menuItems.concat([
				'-',
				{
					text: getText("反转箭头方向"),
					glyph: 0xf0ec,
					handler: reverseDirection
				}
				])
		}
	}
	}else{
		menuItems.push({
					itemId: "zoomMenuButton",
					text: getText('缩放'),
					glyph: 0xf002,
					menu: zoomMenu
				});
	}


	var menu = new Ext.menu.Menu({
		items: menuItems
	});

	if (selected) {
		menu.down('#bold').setChecked(currentStyleIs(mxConstants.FONT_BOLD));
		menu.down('#italic').setChecked(currentStyleIs(mxConstants.FONT_ITALIC));
		menu.down('#underline').setChecked(currentStyleIs(mxConstants.FONT_UNDERLINE));

        menu.down("#sizeCombo").setValue(graph.getCellStyle(selectedItems[0])[mxConstants.STYLE_FONTSIZE]);
        menu.down("#fontCombo").setValue(graph.getCellStyle(selectedItems[0])[mxConstants.STYLE_FONTFAMILY]);
	} else {
		//	menu.down('#paste').setDisabled(ribbonPanelItems().down('#paste').isDisabled());
	}

	// Adds a small offset to make sure the mouse released event
	// is routed via the shape which was initially clicked. This
	// is required to avoid a reset of the selection in Safari.
	menu.showAt([mxEvent.getClientX(e) + 1, mxEvent.getClientY(e) + 1]);
	menu.focus();
}
