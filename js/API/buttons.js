"use strict";
/*

Group: Buttons

*/

/*
Method: pressButton

Simulates a press of the passed button(s) firing its action. Can be useful for chaining together methods.

Parameter:

button - The button to be pressed. Can also be an array of buttons.

*/



function pressButton(button) {
	"use strict";

	graph.getModel().beginUpdate();

	map(button, function(primitive) {
		runAction(primitive.getAttribute("Function"), '<p>There was an error with the Action for the button <i>' + primitive.getAttribute("name") + '</i>.</p><br/>', primitive);

	});

	graph.getModel().endUpdate();

}

var trusted = false;
function runAction(code, errHeader, button) {
	try {
		var msg = getText('此 Insight 正在请求执行自定义代码的权限。出于安全原因，您只应在受信任的 Insight 中运行自定义代码。\n\n您确定要在此 Insight 中运行代码吗？');
		if (trusted || confirm(msg)) {
			trusted = true;
			eval("\"use strict;\"\n\n" + code);
		}
	} catch (err) {
		errHeader = errHeader || '';
		Ext.Msg.show({
			title: getText('动作错误'),
			msg: errHeader + '<p><tt>' + err + "</tt></p><p><b>Code:</b></p><p><tt><pre>" + code + "</pre></tt></p>",
			buttons: Ext.Msg.OK,
			icon: Ext.Msg.ERROR
		});

		if (button) {
			setTimeout(function() {
				highlight(button);
			}, 100)
		}
	}
}



