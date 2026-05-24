"use strict";

var headless = require('../js/SimulationEngine/headless.js');

// Minimal model: one Stock "Population" with a Flow "Growth" = 0.1*[Population]
var testModel = {
	setting: {
		TimeStart: '0',
		TimeLength: '10',
		TimeStep: '1',
		TimeUnits: 'Day',
		Algorithm: 'Euler',
		PauseInterval: '0'
	},
	elements: [
		{
			id: '1',
			type: 'Stock',
			name: 'Population',
			value: '100',
			InitialValue: '100',
			geometry: { x: 200, y: 200, width: 100, height: 40 }
		},
		{
			id: '2',
			type: 'Flow',
			name: 'Growth',
			value: '0.1*[Population]',
			sourceId: '1',
			targetId: '1',
			geometry: {
				sourcePoint: { x: 300, y: 220 },
				targetPoint: { x: 400, y: 220 }
			}
		}
	]
};

try {
	var results = headless.runSimulationHeadless(testModel);
	console.log('=== SIMULATION COMPLETED SUCCESSFULLY ===');
	console.log('MaxTime:', results.maxTime);
	console.log('FinalTime:', results.finalTime);
	console.log('DataNames:', JSON.stringify(results.dataNames));
	console.log('DataSeries count:', results.dataSeries ? results.dataSeries.length : 0);
	if (results.dataSeries && results.dataSeries[0]) {
		console.log('First series head:', JSON.stringify(results.dataSeries[0].slice(0, 5)));
		console.log('First series tail:', JSON.stringify(results.dataSeries[0].slice(-3)));
	}
	console.log('=== EXPECTED: Population grows from 100 at t=0 to ~259 at t=10 with 10% growth ===');
	process.exit(0);
} catch (e) {
	console.error('=== SIMULATION FAILED ===');
	console.error('Error:', e.message);
	console.error(e.stack);
	process.exit(1);
}
