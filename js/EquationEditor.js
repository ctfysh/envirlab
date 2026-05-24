"use strict";
/*

Copyright 2010-2015 Scott Fortmann-Roe. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License.

*/

function formatUnitsBut(s) {
	if ((!s) || s.trim() == "") {
		return getText("无单位");
	} else {
		return Ext.util.Format.ellipsis(s, 20);
	}
}

var EquationEditor = Ext.extend(Ext.form.TextField,
	createEditorFieldConfig({
		editorWindowClass: EquationWindow,
		getEditorWindowConfig: function() {
			return {
				parent: this,
				equation: this.getValue(),
				cell: getSelected()[0],
				help: this.help
			};
		},
		_onKeyDown: function(field) {
			field.setEditable(!/\\n/.test(field.getValue()));
		}
	})
);

function EquationWindow(config) {
	var me = this;


	var equation = config.equation.replace(/\\n/g, "\n");

	var cell = config.cell;
	var neighbors = [];
	var hood = neighborhood(cell);
	for (var i = 0; i < hood.length; i++) {
		if (!hood[i].linkHidden) {
			var s = '<i class="fa fa-plus-circle" style="color: green; font-size: 120%"></i> &nbsp;' + clean(hood[i].item.getAttribute("name"));
			if (hood[i].type == "agent") {
				s = "<i class='gray'>&nbsp;&nbsp;" + s + "</i>";
			}
			neighbors.push({
				insert: "[" + hood[i].item.getAttribute("name") + "]",
				display: s,
				group: getText("参考资料"),
				tip: undefined
			});
		}
	}

	if (neighbors.length == 0) {
		neighbors.push({
			insert: undefined,
			group: getText("参考资料"),
			tip: undefined,
			display: "<i class='gray'>" + getText("没有参考资料") + "</i>"
		});
	}

	var availableLinks = new Ext.data.Store({
		autoDestroy: true,
		idIndex: 0,
		fields: [{
			type: "string",
			name: 'insert'
		}, {
			type: "string",
			name: 'display'
		}, {
			type: "string",
			name: "tip"
		}, {
			type: "string",
			name: "group"
		}],
		groupField: 'group',
		data: neighbors
	});


	var equationEditor = new Ext.ux.AceEditor({
		readOnly: !viewConfig.allowEdits,
		annotations: config.annotations,
		enterIsSpecial: true,
		value: equation,
		width: 200,
		margin: '0 0 0 0',
		region: 'center'
	});




	var helpData = [
		["数学函数", [
			[getText("四舍五入"), "Round(##Value$$)", getText("将数字四舍五入到最接近的整数。"), ["Round(3.6)", getText("4")]],
			[getText("向上取整"), "Ceiling(##Value$$)", getText("将数字向上取整到最接近的整数。"), ["Ceiling(3.6)", getText("4")]],
			[getText("向下取整"), "Floor(##Value$$)", getText("将数字向下取整到最接近的整数。"), ["Floor(3.6)", getText("3")]],
			[getText("余弦"), "Cos(##Angle$$)", getText("计算角度的余弦值。"), ["Cos({180 Degrees})", getText("-1")]],
			[getText("反余弦"), "ArcCos(##Value$$)", getText("计算值的反余弦值。结果包含单位。"), ["ArcCos(0)", getText("{90 度}")]],
			[getText("正弦"), "Sin(##Angle$$)", getText("计算角度的正弦值。"), ["Sin({180 Degrees})", getText("0")]],
			[getText("反正弦"), "ArcSin(##Value$$)", getText("计算值的反正弦值。结果包含单位。"), ["ArcSin(1)", getText("{90 度}")]],
			[getText("正切"), "Tan(##Angle$$)", getText("计算角度的正切值。"), ["Tan({Pi/4 Radians})", getText("1")]],
			[getText("反正切"), "ArcTan(##Value$$)", getText("计算值的反正切值。结果包含单位。"), ["ArcTan(1)", getText("{45 度}")]],
			[getText("常用对数"), "Log(##Value$$)", getText("返回数字的以10为底的对数。"), ["Log(1000)", getText("3")]],
			[getText("自然对数"), "Ln(##Value$$)", getText("返回数字的自然对数。"), ["Ln(e^2)", getText("2")]],
			[getText("指数函数"), "Exp(##Value$$)", getText("返回 e 的幂次方。"), ["Exp(1)", getText("e")]],
			[getText("求和"), "Sum(##Values$$)", getText("返回向量或数字列表的总和。"), ["Sum(7, 5, 6)", getText("18")]],
			[getText("乘积"), "Product(##Values$$)", getText("返回向量或数字列表的乘积。"), ["Product(2, 4, -1)", getText("-8")]],
			[getText("最大值"), "Max(##Values$$)", getText("返回向量或数字列表中的最大值。"), ["Max(2, 4, -1)", getText("4")]],
			[getText("最小值"), "Min(##Values$$)", getText("返回向量或数字列表中的最小值。"), ["Min(2, 4, -1, 3)", getText("-1")]],
			[getText("平均值"), "Mean(##Values$$)", getText("返回向量或数字列表的平均值。"), ["Mean(2, 7, 3)", getText("4")]],
			[getText("中位数"), "Median(##Values$$)", getText("返回向量或数字列表的中位数。"), ["Median(2, 7, 3)", getText("3")]],
			[getText("标准差"), "StdDev(##Values$$)", getText("返回向量或数字列表的标准差。"), ["StdDev(1, 2, 3)", getText("1")]],
			[getText("绝对值"), "Abs(##Value$$)", getText("返回数字的绝对值。"), ["Abs(-23)", getText("23")]],
			[getText("取模"), "##(Value One)$$ mod ##(Value Two)$$", getText("返回两个数字相除的余数。"), ["13 mod 5", getText("3")]],
			[getText("平方根"), "Sqrt(##Value$$)", getText("返回数字的平方根。"), ["Sqrt(9)", getText("3")]],
			[getText("符号函数"), "Sign(##Value$$)", getText("如果值大于0返回1，小于0返回-1，等于0返回0。"), ["Sign(-12)", getText("-1")]],
			[getText("圆周率 π"), "pi", getText("值 3.14159265。")],
			[getText("自然常数 e"), "e", getText("值 2.71828183。")],
			[getText("Logit 变换"), "Logit(##Value$$)", getText("返回值的 logit 变换。将 0 到 1 范围内的值转换为负无穷到正无穷范围。"), ["Logit(0.5)", getText("0")]],
			[getText("Expit 变换"), "Expit(##Value$$)", getText("返回值的 expit 变换。将负无穷到正无穷范围内的值转换为 0 到 1 范围。"), ["Expit(0)", getText("0.5")]]
		]],
		["时间函数", [
			[getText("秒"), "Seconds()", getText("当前时间，以秒为单位。"), ["Seconds()*1000", getText("毫秒表示的时间")]],
			[getText("分钟"), "Minutes()", getText("当前时间，以分钟为单位。"), ["Seconds() = Minutes()*60", getText("真")]],
			[getText("小时"), "Hours()", getText("当前时间，以小时为单位。")],
			[getText("天"), "Days()", getText("当前时间，以天为单位。")],
			[getText("周"), "Weeks()", getText("当前时间，以周为单位。")],
			[getText("月"), "Months()", getText("当前时间，以月为单位。")],
			[getText("年"), "Years()", getText("当前时间，以年为单位。"), "IfThenElse(Years() > 10, 15, 0)"],
			[getText("当前时间"), "Time()", getText("当前时间，包含单位。"), "IfThenElse(Time() > {10 Years}, 15, 0)"],
			[getText("开始时间"), "TimeStart()", getText("模拟开始时间，包含单位。")],
			[getText("时间步长"), "TimeStep()", getText("模拟时间步长，包含单位。")],
			[getText("仿真时长"), "TimeLength()", getText("模拟的总时长，包含单位。")],
			[getText("结束时间"), "TimeEnd()", getText("模拟结束的时间，包含单位。"), ["TimeStart() + TimeLength() = TimeEnd()", getText("真")]],
			[getText("季节性"), "Seasonal(Peak=0)", getText("季节性影响模型。周期为一年的正弦波，峰值幅度为1，峰值在指定时间出现。"), ["Seasonal({9 Months})*0.5+1", getText("在0到1之间振荡且在九月份达到峰值的波形")]]
		]],
		["历史函数", [
			[getText("延迟"), "Delay(##[Primitive]$$, ##Delay Length$$, ##Default Value$$)", getText("返回图元在指定时间之前的值。当时间为负时，默认值（Default Value）替代图元值。"), "Delay([Income], {5 Years})"],
			[getText("一阶延迟"), "Delay1(##[Primitive]$$, ##Delay Length$$, ##Initial Value$$)", getText("返回图元值的一阶指数平滑延迟。初始值（Initial Value）可选。"), "Delay1([Income], 5, 10000)"],
			[getText("三阶延迟"), "Delay3(##[Primitive]$$, ##Delay Length$$, ##Initial Value$$)", getText("返回图元值的三阶指数平滑延迟。初始值（Initial Value）可选。"), "Delay3([Income], {20 Months}, 10000)"],
			[getText("平滑"), "Smooth(##[Primitive]$$, ##Length$$, ##Initial Value$$)", getText("返回图元过去值的平滑结果。得到平均曲线拟合。Length 影响过去值的权重。初始值（Initial Value）可选。")],
			[getText("历史值"), "PastValues(##[Primitive]$$, ##Period = All Time$$)", getText("以向量形式返回图元在模拟过程中的历史值。第二个可选参数是限制历史深度的窗口时间。"), ["Sum(PastValues([Income]))", getText("过去总收入")]],
			[getText("历史最大值"), "PastMax(##[Primitive]$$, ##Period = All Time$$)", getText("返回图元在模拟过程中的历史最大值。第二个可选参数是限制计算的时间窗口。"), ["PastMax([Income], {10 Years})", getText("过去10年的最大收入")]],
			[getText("历史最小值"), "PastMin(##[Primitive]$$, ##Period = All Time$$)", getText("返回图元在模拟过程中的历史最小值。第二个可选参数是限制计算的时间窗口。"), ["PastMin([Income], 10)", getText("过去10个时间单位内的最低收入")]],
			[getText("历史中位数"), "PastMedian(##[Primitive]$$, ##Period = All Time$$)", getText("返回图元在模拟过程中的历史中位数。第二个可选参数是限制计算的时间窗口。")],
			[getText("历史平均值"), "PastMean(##[Primitive]$$, ##Period = All Time$$)", getText("返回图元在模拟过程中的历史平均值。第二个可选参数是限制计算的时间窗口。")],
			[getText("历史标准差"), "PastStdDev(##[Primitive]$$, ##Period = All Time$$)", getText("返回图元在模拟过程中的历史标准差。第二个可选参数是限制计算的时间窗口。")],
			[getText("相关性"), "PastCorrelation(##[Primitive]$$, ##[Primitive]$$, ##Period = All Time$$)", getText("返回两个图元在模拟过程中历史值的相关性。第三个可选参数是限制计算的时间窗口。"), ["PastCorrelation([Income], [Expenditures], {10 Years})", getText("过去10年收入与支出的相关性")]],
			[getText("固定值"), "Fix(##Value$$, ##Period=-1$$)", getText("获取动态值并强制其在指定周期内保持不变。如果周期为-1，则在整个模拟过程中保持该值不变。"), ["Fix(Rand(), {5 Years})", getText("每五年选择一个新随机值")]]
		]],
		["随机数函数", [
			[getText("均匀分布"), "Rand(##Minimum$$, ##Maximum$$)", getText("在最小值和最大值之间生成均匀分布的随机数。最小值和最大值可选，默认为0和1。"), ["Rand()", getText("0.7481")]],
			[getText("正态分布"), "RandNormal(##Mean$$, ##Standard Deviation$$)", getText("生成具有指定均值和标准差的正态分布随机数。均值和标准差可选，默认为0和1。"), ["RandNormal(10, 1)", getText("11.23")]],
			[getText("对数正态分布"), "RandLognormal(##Mean$$, ##Standard Deviation$$)", getText("生成具有指定均值和标准差的对数正态分布随机数。")],
			[getText("伯努利分布"), "RandBoolean(##Probability$$)", getText("以指定概率返回1，否则返回0。概率可选，默认为0.5：即抛硬币。"), ["RandBoolean(0.1)", getText("假")]],
			[getText("二项分布"), "RandBinomial(##Count$$, ##Probability$$)", getText("生成二项分布随机数。在 Count 次随机事件中成功次数，每次成功概率为 Probability。")],
			[getText("负二项分布"), "RandNegativeBinomial(##Successes$$, ##Probability$$)", getText("生成负二项分布随机数。生成指定成功次数所需的随机事件数，每个事件的概率为 Probability。")],
			[getText("泊松分布"), "RandPoisson(##Lambda$$)", getText("生成泊松分布随机数。")],
			[getText("三角分布"), "RandTriangular(##Minimum$$, ##Maximum$$, ##Peak$$)", getText("生成三角分布随机数。")],
			[getText("指数分布"), "RandExp(##Lambda$$)", getText("使用指定的速率参数生成指数分布随机数。")],
			[getText("伽马分布"), "RandGamma(##Alpha$$, ##Beta$$)", getText("生成伽马分布随机数。")],
			[getText("贝塔分布"), "RandBeta(##Alpha$$, ##Beta$$)", getText("生成贝塔分布随机数。")],
			[getText("自定义分布"), "RandDist(##X$$, ##Y$$)", getText("根据自定义分布生成随机数。接受两个向量，分别包含定义分布点的 x 和 y 坐标。点之间线性插值。分布不必归一化到面积为1，但点必须按 x 位置从小到大排序。也可以传入包含 {x, y} 坐标对的单一向量（例如 { {1, 0}, {3, 4}, {4, 0} }）。"), ["RandDist({0, 1, 2, 3}, {0, 5, 1, 0})", getText("1.2")]]
		]],
		["主体函数", [
			[getText("查找全部"), "##[Agent Population]$$.FindAll()", getText("返回主体种群中的所有主体向量。")],
			[getText("按状态查找"), "##[Agent Population]$$.FindState(##[State]$$)", getText("返回在指定状态下所有主体的向量。"), ["[University].FindState([Smoker])", getText("大学中所有吸烟者")]],
			[getText("按非状态查找"), "##[Agent Population]$$.FindNotState(##[State]$$)", getText("返回不在指定状态下所有主体的向量。"), ["[University].FindNotState([Smoker])", getText("大学中所有非吸烟者")]],
			[getText("按索引查找"), "##[Agent Population]$$.FindIndex(##Index$$)", getText("返回具有指定索引的主体。主体索引从1开始。"), ["[Population].FindIndex(1)", getText("创建的第一个主体")]],
			[getText("查找附近"), "##[Agent Population]$$.FindNearby(##Target$$, ##Distance$$)", getText("返回在目标主体或位置指定距离内的所有主体向量。"), ["[Population].FindState([Infected]).FindNearby(Self, 25)", getText("所有靠近主体的感染者")]],
			[getText("查找最近"), "##[Agent Population]$$.FindNearest(##Target$$, ##Count=1$$)", getText("返回距离目标主体或位置最近的主体。返回数量由可选的 Count 参数指定。"), ["[Population].FindNearest(Target)", getText("距离目标最近的主体")]],
			[getText("查找最远"), "##[Agent Population]$$.FindFurthest(##Target$$, ##Count=1$$)", getText("返回距离目标主体或位置最远的主体。返回数量由可选的 Count 参数指定。"), ["[Population].FindFurthest(Target, 4)", getText("距离目标最远的四个主体")]],
			[getText("取值"), "##[Agent Population]$$.Value(##[Primitive]$$)", getText("以向量形式返回种群中每个主体指定图元的值。"), ["[University].Value([GPA]).Mean()", getText("大学所有学生的平均绩点")]],
			[getText("设置值"), "##[Agent Population]$$.SetValue(##[Primitive]$$, ##Value$$)", getText("将种群中每个主体指定图元的值设为给定值。也可以直接应用于单个主体。"), ["[University].SetValue([Smoker], false)", getText("让所有吸烟者戒烟")]],
			[getText("位置"), "##[Agent]$$.Location()", getText("返回主体的位置，格式为向量 {x, y}。"), ["Self.Location().x", getText("主体的 x 坐标")]],
			[getText("设置位置"), "##[Agent]$$.SetLocation(##New Location$$)", getText("设置主体的位置。"), ["[Student].SetLocation({x: 60, y: 40})", getText("将学生移动到新位置")]],
			[getText("索引"), "##[Agent]$$.Index()", getText("获取主体在种群中的数值索引。索引在种群内是顺序的，从1开始。")],
			[getText("距离"), "Distance(##Location 1$$, ##Location 2$$)", getText("返回两个主体或位置之间的距离。")],
			[getText("移动"), "##[Agent]$$.Move(##{x, y}$$)", getText("将主体移动指定量。"), ["Self.Move({Rand(), Rand()})", getText("随机漫步")]],
			[getText("移向"), "##[Agent]$$.MoveTowards(##Target$$, ##Distance$$)", getText("将主体向目标主体或位置移动指定距离。"), ["Self.MoveTowards({0, 100}, 10)", getText("向点 {0, 100} 移动")]],
			[getText("已连接"), "##[Agent]$$.Connected()", getText("返回网络中与某主体相连的所有主体。"), ["Self.Connected().Length()", getText("主体拥有的连接数")]],
			[getText("连接"), "##[Agent 1]$$.Connect(##[Agent 2]$$, ##Weight=1$$)", getText("连接网络中的两个主体。第二个主体也可以是主体向量。可选地，可以指定连接权重，该权重将与连接一起存储。"), ["Self.Connect([Population].FindNearest(Self))", getText("将主体连接到种群中距其最近的主体")]],
			[getText("断开连接"), "##[Agent 1]$$.Unconnect(##[Agent 2]$$)", getText("断开网络中的两个主体。第二个主体也可以是主体向量。"), ["Self.Unconnect(Self.Connected())", getText("移除主体的所有连接")]],
			[getText("连接权重"), "##[Agent 1]$$.ConnectionWeight(##[Agent 2]$$)", getText("返回两个主体之间的连接权重。")],
			[getText("设置连接权重"), "##[Agent 1]$$.SetConnectionWeight(##[Agent 2]$$, ##Weight$$)", getText("设置两个主体之间的连接权重。")],
			[getText("种群规模"), "##[Agent Population]$$.PopulationSize()", getText("种群中主体的总数。")],
			[getText("添加"), "##[Agent Population]$$.Add(##Base Agent=Initial Agent$$)", getText("向种群添加新主体。如果设置了 Base 参数，新主体将是 [Base] 的克隆；否则新主体将类似于模拟开始时创建的新主体。"), ["Repeat([University].Add(), 200)", getText("在大学中注册200名新生")]],
			[getText("移除"), "##[Agent]$$.Remove()", getText("从种群中移除主体。该主体将不再被模拟。可用于\"杀死\"主体。"), ["[University].FindState([Smoker]).Map(x.Remove())", getText("开除大学中所有吸烟者")]],
			[getText("宽度"), "Width(##Agent$$)", getText("主体所在地理区域的宽度。")],
			[getText("高度"), "Height(##Agent$$)", getText("主体所在地理区域的高度。")]
		]],
		["向量函数", [
			[getText("范围"), "##Start$$:##End$$", getText("创建一个包含从起始到结束的顺序值范围的向量。要使用非1的步长，将步长放在起始和结束之间，例如 \"0:0.5:10\"。"), ["1:5", getText("{1, 2, 3, 4, 5}")]],
			[getText("长度"), "##Vector$$.Length()", getText("向量中的元素个数。Count() 是长度的同义词。"), ["{1, 1, 2, 3}.Length()", getText("4")]],
			[getText("选择"), "##Vector$${##Selector$$}", getText("从向量中选择一个或多个元素。选择器可以是整数或整数向量、字符串或字符串向量（用于命名向量），或布尔向量。"), ["{1,3,7}{2}", getText("3")]],
			[getText("合并"), "Join(##Item 1$$, ##Item 2$$, ##Item N$$)", getText("将多个项目合并到单个向量中。"), ["Join(0, {1, 1, 2})", getText("{0, 1, 1, 2}")]],
			[getText("展开"), "##Vector$$.Flatten()", getText("展开向量，移除并展开所有嵌套向量。"), ["{ {0}, {1, 1, 2} }.Flatten()", getText("{0, 1, 1, 2}")]],
			[getText("去重"), "##Vector$$.Unique()", getText("返回移除重复项后的向量。"), ["{1, 1, 2, 3}.Unique()", getText("{1, 2, 3}")]],
			[getText("并集"), "##Vector$$.Union(##Vector 2$$)", getText("返回两个向量的合并元素（移除重复项）。"), ["{1, 2}.Union({2, 3})", getText("{1, 2, 3}")]],
			[getText("交集"), "##Vector$$.Intersection(##Vector 2$$)", getText("返回同时存在于两个向量中的元素。"), ["{1, 2}.Intersection({2, 3})", getText("{2}")]],
			[getText("差集"), "##Vector$$.Difference(##Vector 2$$)", getText("返回仅存在于两个向量中之一的元素。"), ["{1, 2}.Difference({2, 3})", getText("{1, 3}")]],
			[getText("排序"), "##Vector$$.Sort()", getText("将向量从小到大排序。"), ["{1, 3, 2}.Sort()", getText("{1, 2, 3}")]],
			[getText("反转"), "##Vector$$.Reverse()", getText("反转向量中的元素顺序。"), ["{1, 2, 3}.Reverse()", getText("{3, 2, 1}")]],
			[getText("采样"), "##Vector$$.Sample(##Sample Size$$, ##Allow Repeats=False$$)", getText("从向量中随机抽样。Allow Repeats 决定是否可以多次采样同一索引，默认为 false。"), ["{1, 4, 9}.Sample(2)", getText("{9, 1}")]],
			[getText("索引位置"), "##Vector$$.IndexOf(##Needle$$)", getText("返回查找值在向量中的位置（从索引1开始）。如果未找到，返回0。"), ["{1, 4, 9}.IndexOf(9)", getText("3")]],
			[getText("包含"), "##Vector$$.Contains(##Needle$$)", getText("如果查找值在向量中则返回 true，否则返回 false。"), ["{1, 4, 9}.Contains(9)", getText("true")]],
			[getText("重复"), "Repeat(##Expression$$, ##Times$$)", getText("通过重复表达式指定次数来创建新向量。表达式中的 'x' 表示当前索引。Times 也可以是字符串向量，此时创建命名向量。"), ["Repeat(x^2, 3)", getText("{1, 4, 9}")]],
			[getText("映射"), "##Vector$$.Map(##Function$$)", getText("对向量的每个元素应用函数并返回结果。函数也可以是一个表达式，其中 'x' 表示当前元素，对于命名向量 'key' 表示当前元素的键名。"), ["{1, 2, 3}.Map(x*2)", getText("{2, 4, 6}")]],
			[getText("过滤"), "##Vector$$.Filter(##Function$$)", getText("使用函数测试向量的每个元素，返回结果为 true 的元素。函数也可以是一个表达式，其中 'x' 表示当前元素。"), ["{1, 2, 3}.Filter(x >= 2)", getText("{2, 3}")]],
			[getText("键名"), "##Vector$$.Keys()", getText("以向量形式返回命名向量的键名。没有键名的元素将被省略。"), ["{a: 1, b: 4, b: 9}.Keys()", getText("{'a', 'b', 'c'}")]],
			[getText("值列表"), "##Vector$$.Values()", getText("返回向量的值（如果是命名向量，则移除键名）。"), ["{a: 1, b: 4, b: 9}.Values()", getText("{1, 4, 9}")]]
		]],
		["一般函数", [
			[getText("条件判断"), "IfThenElse(##Test Condition$$, ##Value if True$$, ##Value if False$$)", getText("测试条件，如果条件为真返回一个值，如果条件为假返回另一个值。"), ["IfThenElse(20 > 10, 7, 5)", getText("7")]],
			[getText("查找"), "Lookup(##Value$$, ##Values Vector$$, ##Results Vector$$)", getText("在 Values Vector 中查找 Value，并返回 Results Vector 中对应的项。如果在 Values Vector 中未找到精确的 Value，将使用附近值的线性插值。"), ["Lookup(6, {5, 7}, {10, 15})", getText("12.5")]],
			[getText("脉冲"), "Pulse(##Time$$, ##Height$$, ##Width=0$$, ##Repeat=-1$$)", getText("在指定时间创建具有指定高度和宽度的脉冲输入。Height 默认为1，Width 默认为0。Repeat 可选，如果为正则创建指定时间的脉冲序列。"), "Pulse({10 Years}, 5, 2)"],
			[getText("阶跃"), "Step(##Start$$, ##Height=1$$)", getText("创建一个初始为0，在 Start 时间后变为 Height 的输入。Height 默认为1。"), "Step({10 Years}, 5)"],
			[getText("斜坡"), "Ramp(##Start$$, ##Finish$$, ##Height=1$$)", getText("创建一个在 Start 和 Finish 之间从0线性增加到 Height 的斜坡输入。Start 之前值为0；Finish 之后值为 Height。Height 默认为1。"), "Ramp({10 Year}, {20 Years}, 5)"],
			[getText("暂停"), "Pause()", getText("暂停模拟，允许调整滑块。通常与 IfThenElse 函数结合使用。"), "IfThenElse(Years() = 20, Pause(), 0)"],
			[getText("停止"), "Stop()", getText("立即终止模拟。通常与 IfThenElse 函数结合使用。"), "IfThenElse(Rand() < 0.01, Stop(), 0)"]
		]],
		["字符串函数", [
			[getText("长度"), "##String$$.Length()", getText("字符串的字符长度。"), ['"abcde".Length()', getText("5")]],
			[getText("子串"), "##String$$.Range(##Characters$$)", getText("获取字符串中的某个或某组字符。"), ['"abcde".Range(2:4)', getText('"bcd"')]],
			[getText("拆分"), "##String$$.Split(##Deliminator$$)", getText("在分隔符位置将字符串拆分为向量。"), ['"abcde".Split("c")', getText('{"ab", "de"}')]],
			[getText("索引位置"), "##String$$.IndexOf(##Needle$$)", getText("查找查找值在字符串中首次出现的位置。"), ['"abcde".IndexOf("c")', getText("3")]],
			[getText("包含"), "##String$$.Contains(##Needle$$)", getText("如果查找值在字符串中则返回 true，否则返回 false。"), ['"abcde".Contains("cd")', getText("true")]],
			[getText("转大写"), "##String$$.UpperCase()", getText("将字符串中的所有字母转换为大写。"), ['"Test".UpperCase()', getText('"TEST"')]],
			[getText("转小写"), "##String$$.LowerCase()", getText("将字符串中的所有字母转换为小写。"), ['"Test".LowerCase()', getText('"test"')]],
			[getText("连接"), "##Vector$$.Join(##String$$)", getText("使用给定字符串连接向量中的字符。"), ['{"a", "bc", "d"}.Join("-")', getText('"a-bc-d"')]],
			[getText("修剪"), "##String$$.Trim()", getText("移除字符串两端的空白字符。"), ['" abc  ".Trim()', getText('"abc"')]],
			[getText("解析"), "##String$$.Parse()", getText("将字符串转换为数字。"), ['"1.2".Parse() + 3.3', getText("4.5")]]
		]],
		["编程函数", [
			[getText("变量"), "##Variable$$ <- ##Value$$", getText("为可复用的变量赋值。"), ['x <- 10\nx^2', getText("100")]],
			[getText("条件分支"), "If ##Condition$$ Then\n  ##Expression$$\nElse If ##Condition$$ Then\n  ##Expression$$\nElse\n  ##Expression$$\nEnd If", getText("测试一个或多个条件，并根据测试结果选择性地执行代码。")],
			[getText("While 循环"), "While ##Condition$$\n  ##Expression$$\nEnd Loop", getText("重复执行操作，直到条件不再为真。"), ['x <- 1\nWhile x < 10\n  x <- x*2\nEnd Loop\nx', getText("16")]],
			[getText("For-In 循环"), "For ##Variable$$ in ##Vector$$\n  ##Expression$$\nEnd Loop", getText("对向量中的每个元素重复执行操作。"), ['sum <- 0\nFor x in {1, 10, 27}\n  sum <- sum + x\nEnd Loop\nsum', getText("38")]],
			[getText("函数"), "Function ##Name$$()\n  ##Expression$$\nEnd Function", getText("创建可复用的函数。"), ['Function Square(x)\n  x^2\nEnd Function\nSquare(5)', getText("25")]],
			[getText("匿名函数"), "##Variable$$ <- Function()\n  ##Expression$$\nEnd Function", getText("创建匿名函数。"), ['square <- Function(x)\n  x^2\nEnd Function\nsquare(5)', getText("25")]],
			[getText("匿名函数(简写)"), "Function() ##Expression$$", getText("创建单行匿名函数。"), ['{1, 2, 3}.Map(Function(value) value^2 - value)', getText("{0, 2, 6}")]],
			[getText("抛出错误"), "throw '##Message$$'", getText("将错误消息传递给最近的 Try-Catch 块，或使用错误消息中止模拟。"), 'throw "Error: Index out of range."'],
			[getText("错误处理"), "Try\n  ##Expression$$\nCatch ##ErrorString$$\n  ##Expression // Handle the error$$\nEnd Try", getText("尝试执行代码。如果发生错误，错误将以字符串变量的形式传递给 catch 块并执行。除非发生错误，否则 catch 块不会被执行。"), 'Try\n  mean(x)\nCatch err\n  alert("Could not calculate the mean of the variable. Error Message: "+err)\nEnd Try']
		]],
		["用户输入函数", [
			[getText("弹出消息"), "Alert(##Message$$)", getText("显示带有消息的弹窗。"), 'Alert("An event has occurred.")'],
			[getText("输入提示"), "Prompt(##Message$$, ##Default=''$$)", getText("提示用户输入并返回输入值。可选参数可以为输入提供默认值。"), 'timeScale <- Prompt("What time scale should we use?.", 10).Parse()'],
			[getText("确认"), "Confirm(##Message$$)", getText("提示用户确认操作，返回布尔值表示是否确认。"), 'advanced <- Confirm("Use advanced mode?")']
		]],
		["统计分布函数", [
			[getText("正态 CDF"), "CDFNormal(##x$$, ##Mean=0$$, ##StandardDeviation=1$$)", getText("返回正态分布累积分布函数（CDF）中 x 的值。"), ["CDFNormal(1.96)", getText("0.975")]],
			[getText("正态 PDF"), "PDFNormal(##x$$, ##Mean=0$$, ##StandardDeviation=1$$)", getText("返回正态分布概率密度函数（PDF）中 x 的值。"), ["PDFNormal(1.5, 0, 1)", getText("0.12")]],
			[getText("正态逆CDF"), "InvNormal(##p$$, ##Mean=0$$, ##StandardDeviation=1$$)", getText("返回正态分布逆累积分布函数中 p 的值。"), ["InvNormal(0.975)", getText("1.96")]],
			[getText("对数正态 CDF"), "CDFLognormal(##x$$, ##Mean=0$$, ##StandardDeviation=1$$)", getText("返回对数正态分布累积分布函数中 x 的值。")],
			[getText("对数正态 PDF"), "PDFLognormal(##x$$, ##Mean=0$$, ##StandardDeviation=1$$)", getText("返回对数正态分布概率密度函数中 x 的值。")],
			[getText("对数正态逆CDF"), "InvLognormal(##p$$, ##Mean=0$$, ##StandardDeviation=1$$)", getText("返回对数正态分布逆累积分布函数中 p 的值。")],
			[getText("t 分布 CDF"), "CDFt(##x$$, ##DegreesOfFreedom$$)", getText("返回 t 分布累积分布函数中 x 的值。")],
			[getText("t 分布 PDF"), "PDFt(##x$$, ##DegreesOfFreedom$$)", getText("返回 t 分布概率密度函数中 x 的值。")],
			[getText("t 分布逆CDF"), "Invt(##p$$, ##DegreesOfFreedom$$)", getText("返回 t 分布逆累积分布函数中 p 的值。")],
			[getText("F 分布 CDF"), "CDFF(##x$$, ##DegreesOfFreedom1$$, ##DegreesOfFreedom2$$)", getText("返回 F 分布累积分布函数中 x 的值。")],
			[getText("F 分布 PDF"), "PDFF(##x$$, ##DegreesOfFreedom1$$, ##DegreesOfFreedom2$$)", getText("返回 F 分布概率密度函数中 x 的值。")],
			[getText("F 分布逆CDF"), "InvF(##p$$, ##DegreesOfFreedom1$$, ##DegreesOfFreedom2$$)", getText("返回 F 分布逆累积分布函数中 p 的值。")],
			[getText("卡方分布 CDF"), "CDFChiSquared(##x$$, ##DegreesOfFreedom$$)", getText("返回卡方分布累积分布函数中 x 的值。")],
			[getText("卡方分布 PDF"), "PDFChiSquared(##x$$, ##DegreesOfFreedom$$)", getText("返回卡方分布概率密度函数中 x 的值。")],
			[getText("卡方分布逆CDF"), "InvChiSquared(##p$$, ##DegreesOfFreedom$$)", getText("返回卡方分布逆累积分布函数中 p 的值。")],
			[getText("指数分布 CDF"), "CDFExponential(##x$$, ##Rate$$)", getText("返回指数分布累积分布函数中 x 的值。")],
			[getText("指数分布 PDF"), "PDFExponential(##x$$, ##Rate$$)", getText("返回指数分布概率密度函数中 x 的值。")],
			[getText("指数分布逆CDF"), "InvExponential(##p$$, ##Rate$$)", getText("返回指数分布逆累积分布函数中 p 的值。")],
			[getText("泊松分布 CDF"), "CDFPoisson(##x$$, ##Lambda$$)", getText("返回泊松分布累积分布函数中 x 的值。")],
			[getText("泊松分布 PMF"), "PMFPoisson(##x$$, ##Lambda$$)", getText("返回泊松分布概率质量函数（PMF）中 x 的值。")]
		]]

	];


	var expandCount = 0;

	function addButton(title, vals) {
		var tip = "<b>" + vals[1].replace(/\$\$/g, "").replace(/##/g, "").replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\n/g, "<br/>").replace(/ /g, " ") + "</b><br/>" + vals[2];
		if (vals[3]) {
			tip = tip + "<br/><br/><b>" + getText("示例") + ":</b><br/>&nbsp;&nbsp;";
			if ((typeof vals[3]) == "string") {
				tip = tip + vals[3].replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\n/g, "<br/>").replace(/ /g, " ");
			} else {
				tip = tip + vals[3][0].replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\n/g, "<br/>").replace(/ /g, " ") + " <b>&rarr;</b> " + vals[3][1].replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\n/g, "<br/>").replace(/ /g, " ");
			}
		}
		expandCount++;
		availableLinks.add({
			display: " <span class='moreExpander' data-id='" + expandCount + "' style='padding: 0px 8px; float:right; cursor: pointer' class='gray'><i class='fa fa-question-circle' style='color: gray'></i></span>" + vals[0] + "<p id='expander" + expandCount + "' style='display:none; font-size: small; white-space: normal' class='gray'>" + tip + "</p>",
			start: vals[1].indexOf("##"),
			end: vals[1].indexOf("$$"),
			insert: vals[1].replace(/\#\#/g, "").replace(/\$\$/g, ""),
			tip: tip,
			group: title
		});
	}

	for (var i = 0; i < helpData.length; i++) {
		for (var j = 0; j < helpData[i][1].length; j++) {
			addButton(helpData[i][0], helpData[i][1][j]);
		}
	}

	var refName = getText("参考资料");
	availableLinks.group({
		property: 'group',
		sortFn: function(a, b) {
			var ga = a.get('group'), gb = b.get('group');
			if (ga === refName) return -1;
			if (gb === refName) return 1;
			return ga < gb ? -1 : (ga > gb ? 1 : 0);
		}
	});

	var referenceItems = new Ext.grid.Panel({
		hidden: !viewConfig.allowEdits,
		store: availableLinks,
		split: true,
		region: 'east',
		hideHeaders: true,
		width: viewConfig.referenceBarWidth,
		margin: '0 0 0 4',
		hideGroupedHeader: true,
		columns: [{
			header: getText('引用'),
			flex: 1,
			dataIndex: 'display',
			sortable: false
		}],
		features: [{
			groupHeaderTpl: "{name}",
			ftype: 'grouping',
			startCollapsed: true,
			hideGroupedHeader: true,
			id: "typeGrouping"
		}]
	});

	referenceItems.view.getFeature("typeGrouping").expand(getText("参考资料"));

	referenceItems.view.on("groupexpand", function(view, node) {
		var items = referenceItems.getEl().query(".moreExpander", false);
		items.forEach(function(x) {
			if (x.getAttribute("data-processed") != 1) {
				x.on("click", function(evt) {
					var a = Ext.get("expander" + x.getAttribute("data-id"));
					a.setVisibilityMode(2);
					a.toggle();
					evt.stopPropagation();
				});
				x.set({
					"data-processed": 1
				})
			}
		});
	});


	if (!mxClient.IS_TOUCH) {
		var left = new Ext.Component({
			html: "<span style='font-size: 280%'>=</span>",
			region: "west",
			margin: '5 0 0 3'
		});
	} else {
		var but = function(text, config) {
			config = config || {};
			return new Ext.Button({
				text: text,
				colspan: config.colspan,
				width: config.width || s,
				height: config.height || s,
				rowspan: config.rowspan,
				style: config.opacity ? ("opacity:" + config.opacity) : 'opacity: .7',
				handler: config.handler || function() {
					insertAtCursor(config.insert || text, config.start, config.end);
				},
				margin: config.margin || m
			});
		}
		
		var s= 40;
		var m = 3;


		var left = new Ext.panel.Panel({
			margin: 0,
			region: "west",
			frame: false,
			border: false,
			layout: {
				type: 'table',
				columns: 5
			},
			items: [
				but("("),
				but(")"),
				but("{"),
				but("}"),
				but(","),

				but("7", {
					opacity: 1
				}),
				but("8", {
					opacity: 1
				}),
				but("9", {
					opacity: 1
				}),
				but("*"),
				but("/"),

				but("4", {
					opacity: 1
				}),
				but("5", {
					opacity: 1
				}),
				but("6", {
					opacity: 1
				}),
				but("+"),
				but("-"),

				but("1", {
					opacity: 1
				}),
				but("2", {
					opacity: 1
				}),
				but("3", {
					opacity: 1
				}),
				but("^"),
				but("="),

				but("0", {
					opacity: 1
				}),
				but(".", {
					opacity: 1
				}),
				but(" ", {
					colspan: 2,
					width: s * 2 + m * 2
				}),
				but("#"),


				but("<small>⬅</small>", {
					handler: sendBackspace
				}),
				but("←", {
					colspan: 2,
					width: s * 2 + m * 2,
					handler: sendBackward
				}),
				but("→", {
					colspan: 2,
					width: s * 2 + m * 2,
					handler: sendForward
				})
			]

		});
	}



	var title = getText('公式编辑器');
	var type = cell.value.nodeName;
	if (type == "Stock") {
		title = getText("初始值方程");
	} else if (type == "Variable") {
		title = getText("变量方程");
	} else if (type == "State") {
		title = getText("初始状态方程");
	} else if (type == "Flow") {
		title = getText("流量方程");
	} else if (type == "Transition") {
		title = getText("转换方程");
	}

	var help = "";

	if (config.help) {
		if (config.help.toLowerCase) {
			help = config.help;
		} else {
			help = config.help(config);
		}
	}

	var genericHelp = {
		State: "该等式确定状态是否开始有效。等式的结果应该是<tt> True </ tt>或<tt> False </ tt>之类的值。通常使用<tt> [Primitive]> 10 </ tt>等逻辑语句。",
		Flow: "物料将以该等式确定的速率从原料库中移出并进入库存料。",
		Stock: "库的初始值将通过该等式计算。流入和流出可以随着时间的推移增加或减少库的值。",
		Variable: "该变量将采用从该等式计算的值。随着模拟的进行，将重新计算该值。",
		Action: "当动作触发时，将执行此代码。您可以使用它来调整模拟中的值或进行其他更改，例如移动主体。",
		Transition: function(config) {
			var cell = config.cell;
			if (cell.getAttribute("Trigger") == "Probability") {
				return "转换当前正在使用<i>概率</ i>触发器。 对于此触发类型，等式的值是每个时间单位发生转换的概率。";
			} else if (cell.getAttribute("Trigger") == "Condition") {
				return "转换当前正在使用<i> Condition </ i>触发器。 对于此触发类型，当等式计算为<tt> True </ tt>时，将发生转换。";
			} else if (cell.getAttribute("Trigger") == "Timeout") {
				return "转换当前正在使用<i> Timeout </ i>触发器。 对于此触发类型，转换将在此等式指定的时间过后发生。";
			}
		}
	};

	if ((!help) && genericHelp[type]) {
		if (genericHelp[type].toLowerCase) {
			help = genericHelp[type];
		} else {
			help = genericHelp[type](config);
		}
	}
	
	var extraBox = {
		xtype: "container",
		hidden: ! config.extra,
		items: [config.extra],
		region: "south",
		padding: 6,
		style: {
			'background-color': '#eee'
		}
	};

	var helpBox = new Ext.Component({
		xtype: "box",
		html: help,
		hidden: (!help) || Ext.state.Manager.get('equationHelpCollapsed', false),
		region: "north",
		padding: 6,
		style: {
			'background-color': '#eee',
			'font-size': 'small'
		}

	});

	var win = editorWindow(title + ': ' + clean(cell.getAttribute("name")), config, [
		equationEditor, referenceItems, left, helpBox, extraBox
	], {
		stateId: "equation_window",
		closable: true,
		maxWidth: mxClient.IS_TOUCH ? 770 : 720,
		maxHeight: 500,
		tools: [
			{
				id: 'upButton',
				type: 'up',
				tooltip: getText('隐藏描述'),
				hidden: (!help) || Ext.state.Manager.get('equationHelpCollapsed', false),
				callback: function(panel, tool, event) {
					helpBox.setVisible(false);
					tool.hide();
					Ext.getCmp('downButton').show();
					Ext.state.Manager.set('equationHelpCollapsed', true);
				}
			}, {
				id: 'downButton',
				type: 'down',
				tooltip: getText('显示描述'),
				hidden: (!help) || (!Ext.state.Manager.get('equationHelpCollapsed', false)),
				callback: function(panel, tool, event) {
					helpBox.setVisible(true);
					tool.hide();
					Ext.getCmp('upButton').show();
					Ext.state.Manager.set('equationHelpCollapsed', false);
				}
			}
		],
		buttons: [{
			hidden: !viewConfig.allowEdits || cell.value.nodeName == "State" || cell.value.nodeName == "Action" || cell.value.nodeName == "Transition" || cell.value.nodeName == "Agents",
			scale: "large",
			id: 'equationUnitsBut',
			text: formatUnitsBut(cell.getAttribute("Units")),
			glyph: 0xf1de,
			tooltip: getText('图元单位'),
			handler: function() {
				var unitsWindow = new UnitsWindow({
					parent: "",
					cell: cell,
					units: cell.getAttribute("Units")
				});
				unitsWindow.show();
			}
		}, '->',
			editorCancelButton(config),
			editorApplyButton(config, {
				getValue: function() {
					return equationEditor.getValue().replace(/\n|\r/g, "\\n");
				},
				saveValue: function(cell, val) { setValue(cell, val); },
				afterApply: function(config, value) {
					if(config.saveExtra) config.saveExtra();
				}
			})
		]
	});


	referenceItems.on('beforeselect', function(view, node, items, options) {
		if (node.data.insert) {
			insertAtCursor(node.data.insert);
		}
		return false;
	});



	me.show = function() {
		showAndFocusEditor(win, equationEditor);
	}

	function insertAtCursor(myValue, start, end) {
		equationEditor.insertText(myValue);
		equationEditor.editor.focus();

	}

	function sendForward() {
		equationEditor.editor.execCommand("gotoright");
	}

	function sendBackward() {
		equationEditor.editor.execCommand("gotoleft");
	}

	function sendBackspace() {
		equationEditor.editor.execCommand("backspace");
	}

}
