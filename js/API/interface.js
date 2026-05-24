"use strict";
/*

Group: Insight Maker Interface

*/

/*
Method: topBarShown

Determines whether or not the Insight Maker top toolbar (which contains the Run Simulation button and other tools) is currently shown.

Return:

True if the top toolbar is shown, false otherwise.

See also:

<toggleTopBar>

*/

function topBarShown() {
	var toolbar = ribbonPanel.getDockedItems()[0];
	return toolbar.isVisible();
}

/*
Method: toggleTopBar

Toggles the visibility of the top toolbar. If it is currently shown, it is hidden. If it is currently hidden, it is shown.

See also:

<topBarShown>

*/

function toggleTopBar() {
	var toolbar = ribbonPanel.getDockedItems()[0];
	if (!toolbar.isVisible()) {
		toolbar.show();
		try {
			Ext.get("toolbarToggle").update("&uarr;");
			Ext.get("toplinks-holder").removeCls("collapsed");
		} catch (err) {}
	} else {
		toolbar.hide();
		try {
			Ext.get("toolbarToggle").update("&darr;");
			Ext.get("toplinks-holder").addCls("collapsed");
		} catch (err) {}
	}
}


/*
Method: sideBarShown

Determines whether or not the Insight Maker side panel (which contains parameter sliders and information about the selected primitive) is currently shown.

Return:

True if the side panel is shown, false otherwise.

See also:

<toggleSideBar>

*/

function sideBarShown() {
	return (!configPanel.collapsed);
}

/*
Method: toggleSideBar

Toggles the visibility of the side panel. If it is currently shown, it is hidden. If it is currently hidden, it is shown.

See also:

<sideBarShown>

*/

function toggleSideBar() {
	if (sideBarShown()) {
		configPanel.collapse(Ext.Component.DIRECTION_RIGHT, false);
	} else {
		configPanel.expand(false);
	}
}

/*
Method: updateSideBar

Refreshes the values in the side panel to reflect any changes in the model.

*/

function updateSideBar() {
	selectionChanged(true);
}

