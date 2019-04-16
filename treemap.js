var officerData, keys = new Array();
		var officerSave = new Array();
		var visualization;
		var selection = 5;
		fullTree(selection);
		function fullTree(a) {
			d3.csv('data/formatted.csv', function (data) {
				officerData = d3.nest().key(function (d) { return d.Officer_Race; }).entries(data);
				for (i = 0; i < officerData.length; i++) {
					officerSave.push([{ "name": "1 to 5", "value": +officerData[i].values[0]._1to5 }, { "name": "6 to 10", "value": +officerData[i].values[0]._6to10 }, { "name": "11 to 15", "value": +officerData[i].values[0]._11to15 }, { "name": "16 to 20", "value": +officerData[i].values[0]._16to20 }, { "name": "21 to 25", "value": +officerData[i].values[0]._21to25 }, { "name": "26 to 30", "value": +officerData[i].values[0]._26to30 }, { "name": "31 to 35", "value": +officerData[i].values[0]._31to35 }]);
				}
				sample_data = officerSave[0];
				console.log(sample_data, 'Hello');
				treeMap(officerSave[a]);
			});
		}

		d3.select('#select-key').on('change', function (a) {
			// Change the current key and call the function to update the colors.
			console.log(this.value);
			$( "#viz" ).empty();
			if(this.value.localeCompare("ai") == 0){
				fullTree(0);
			}else if(this.value.localeCompare("api") == 0){
				fullTree(1);
			}else if(this.value.localeCompare("baa") == 0){
				fullTree(2);
			}else if(this.value.localeCompare("hl") == 0){
				fullTree(3);
			}else if(this.value.localeCompare("w") == 0){
				fullTree(4);
			}else if(this.value.localeCompare("total") == 0){
				fullTree(5);
			}
		});

		function treeMap(data) {
			visualization = d3plus.viz()
				.container("#viz")  // container DIV to hold the visualization
				.data(data)  // data to use with the visualization
				.type("tree_map")   // visualization type
				.id("name")         // key for which our data is unique on
				.size("value")      // sizing of blocks
				.draw();
		}