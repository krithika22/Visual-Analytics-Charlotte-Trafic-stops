var currentKey = 'count';

var width = 900,
	height = 600;

var template = d3.select('#template').html();

Mustache.parse(template);

//SVG element using width and height
var svg = d3.select('#map')
	.append('svg')
	.attr('width', width)
	.attr('height', height);

var projection = d3.geo.mercator()
	.scale(1);

var zoom = d3.behavior.zoom()
	.scaleExtent([1, 10])
	.on('zoom', doZoom);
svg.call(zoom);

var path = d3.geo.path()
	.projection(projection);

var tooltip = d3.select("#map")
	.append("div")
	.attr("class", "tooltip hidden");

var dataById, countData = new Array(), tempArr = new Array(), results = new Array(), resultsCount = new Array();

var nameCounter = 0, lowest = Number.POSITIVE_INFINITY, highest = Number.NEGATIVE_INFINITY;

var quantize = d3.scale.quantize()
	.range(d3.range(12).map(function (i) { return 'q' + i + '-12'; }));

var mapFeatures = svg.append('g')
	.attr('class', 'features YlGnBu');

var mapData = new Array();
var originalMapCount = new Array();

d3.json('data/traffic_data_CMPD.geojson', function (error, features) {
	var scaleCenter = calculateScaleCenter(features);

	projection.scale(scaleCenter.scale)
		.center(scaleCenter.center)
		.translate([width / 2, height / 2]);

	d3.csv('data/traffic_data_CMPD.csv', function (data) {
		dataById = d3.nest()
			.key(function (d) { return d.CMPD_Division; }).entries(data);
		//console.log(dataById);
		dataById.forEach(element => {
			element.values.forEach(obj => {
				tempArr.push(obj.Result_of_Stop);
			});
			for (i = 0; i < tempArr.length; i++) {
				if (results.includes(tempArr[i])) {
					resultsCount[results.indexOf(tempArr[i])]++;
				}
				else {
					results.push(tempArr[i]);
					resultsCount.push(1);
				}
			}
			tempArr = new Array();
			for (i = 0; i < results.length; i++) {
				tempArr.push({ result: results[i], count: resultsCount[i] });
			}
			countData.push({ id: element.key, count: element.values.length, results: tempArr });
			mapData.push({ id: element.key, count: element.values.length, results: tempArr });
			originalMapCount.push(element.values.length);
			tempArr = new Array();
			results = new Array();
			resultsCount = new Array();
		});

		mapFeatures
			.selectAll('path')
			.data(features.features)
			.enter()
			.append('path')
			.attr('d', path)
			.on('mousemove', showTooltip)
			.on('mouseout', hideTooltip)
			.on('click', showDetails);

			updateMapColors();
		
	});

	mapFeatures
});

d3.select('#noaction').on('change', checkChecked);
d3.select('#verbal').on('change', checkChecked);
d3.select('#written').on('change', checkChecked);
d3.select('#citation').on('change', checkChecked);
d3.select('#arrest').on('change', checkChecked);
d3.select('#low').on('change', checkCheckedDelay);
d3.select('#medium').on('change', checkCheckedDelay);
d3.select('#high').on('change', checkCheckedDelay);

function checkCheckedDelay() {
	setTimeout(checkChecked, 300);
}

function checkChecked() {
	for(i = 0; i < mapData.length; i++) {
		mapData[i].count = 0;
	}
	if(d3.select('#noaction').property("checked")){
		var tem;
		for (i = 0; i < mapData.length; i++) {
			tem = mapData[i].results.filter(obj => {
				return obj.result === "No Action Taken";
			});
			mapData[i].count = mapData[i].count + tem[0].count;
		}
	}
	if(d3.select('#verbal').property("checked")){
		var tem;
		for (i = 0; i < mapData.length; i++) {
			tem = mapData[i].results.filter(obj => {
				return obj.result === "Verbal Warning";
			});
			mapData[i].count = mapData[i].count + tem[0].count;
		}
	}
	if(d3.select('#written').property("checked")){
		var tem;
		for (i = 0; i < mapData.length; i++) {
			tem = mapData[i].results.filter(obj => {
				return obj.result === "Written Warning";
			});
			mapData[i].count = mapData[i].count + tem[0].count;
		}
	}
	if(d3.select('#citation').property("checked")){
		var tem;
		for (i = 0; i < mapData.length; i++) {
			tem = mapData[i].results.filter(obj => {
				return obj.result === "Citation Issued";
			});
			mapData[i].count = mapData[i].count + tem[0].count;
		}
	}
	if(d3.select('#arrest').property("checked")){
		var tem;
		for (i = 0; i < mapData.length; i++) {
			tem = mapData[i].results.filter(obj => {
				return obj.result === "Arrest";
			});
			mapData[i].count = mapData[i].count + tem[0].count;
		}
	}
	var isEmpty = 0;
	for(i = 0; i < mapData.length; i++){
		isEmpty = isEmpty + mapData[i].count;
	}
	console.log("Empty", isEmpty);
	if(isEmpty == 0){
		for(i = 0; i < mapData.length; i++){
			mapData[i].count = mapData[i].count + originalMapCount[i];
		}
	}
	updateMapColors();
}

function updateMapColors() {

	mapFeatures.selectAll('path').attr('class', function (f) {
		//console.log(d.properties.dname, nameCounter);
		for (i = 0; i < mapData.length; i++) {
				var temp = mapData[i].count;
				if (temp < lowest) {
					lowest = temp;
				}
				if (temp > highest) {
					highest = temp;
				}
		}

		quantize.domain([
			lowest, highest
		]);
		lowest = Number.POSITIVE_INFINITY, highest = Number.NEGATIVE_INFINITY;
		for (i = 0; i < mapData.length; i++) {
			if (mapData[i].id == getIdOfFeature(f)) {
				console.log(mapData[i]);
				return quantize(getValueOfData(mapData[i]));
			}
		}
	});
	updateLegend();
  }
  

function getValueOfData(d) {
	return +d[currentKey];
}

function calculateScaleCenter(features) {
	// Get the bounding box of the paths (in pixels!) and calculate a
	// scale factor based on the size of the bounding box and the map
	// size.
	var bbox_path = path.bounds(features),
		scale = 0.95 / Math.max(
			(bbox_path[1][0] - bbox_path[0][0]) / width,
			(bbox_path[1][1] - bbox_path[0][1]) / height
		);

	// Get the bounding box of the features (in map units!) and use it
	// to calculate the center of the features.
	var bbox_feature = d3.geo.bounds(features),
		center = [
			(bbox_feature[1][0] + bbox_feature[0][0]) / 2,
			(bbox_feature[1][1] + bbox_feature[0][1]) / 2];

	return {
		'scale': scale,
		'center': center
	};
}

function doZoom() {
	mapFeatures.attr("transform",
		"translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")")
		// Keep the stroke width proportional. The initial stroke width
		// (0.5) must match the one set in the CSS.
		.style("stroke-width", 0.5 / d3.event.scale + "px");
}

function getIdOfFeature(f) {
	return f.properties.dname;
}

function showTooltip(f) {
	// Get the ID of the feature.
	var id = getIdOfFeature(f);
	var d = dataById[id];
	var mouse = d3.mouse(d3.select('#map').node()).map(
		function (d) { return parseInt(d); }
	);

	var left = Math.min(width - 4 * id.length, mouse[0] + 5);

	var top = mouse[1] + 25;
	console.log(id);
	// Use the ID to get the data entry.
	// Show the tooltip (unhide it) and set the name of the data entry.
	tooltip.classed('hidden', false)
		.attr("style", "left:" + left + "px; top:" + top + "px")
		.html(id);
}

function hideTooltip() {
	tooltip.classed('hidden', true);
}

function showDetails(f) {
	// Get the ID of the feature.
	var id = getIdOfFeature(f);
	var e = {};
	// Use the ID to get the data entry.
	for (i = 0; i < countData.length; i++) {
		if (countData[i].id == id) {
			var d = countData[i];
			console.log(d);
		}
	}
	e["Name"] = d.id;
	for (i = 0; i < d.results.length; i++){
	  	e[d.results[i].result] = d.results[i].count;
	}
	e["Total"] = d.count;
	//d = {total: d.count, results: d.results};
	// The details HTML output is just the name
	console.log(e);
	var detailsHtml = Mustache.render(template, e);

	d3.select('#initial').classed("hidden", true);
	// Put the HTML output in the details container and show (unhide) it.
	d3.select('#details').html(detailsHtml);
	d3.select('#details').classed("hidden", false);
}

var formatNumber = d3.format('.2f');

// For the legend, we prepare a very simple linear scale. Domain and
// range will be set later as they depend on the data currently shown.
var legendX = d3.scale.linear();

// We use the scale to define an axis. The tickvalues will be set later
// as they also depend on the data.
var legendXAxis = d3.svg.axis()
  .scale(legendX)
  .orient("bottom")
  .tickSize(13)
  .tickFormat(function(d) {
    return formatNumber(d);
  });

// We create an SVG element in the legend container and give it some
// dimensions.
var legendSvg = d3.select('#legend').append('svg')
  .attr('width', '100%')
  .attr('height', '60');

// To this SVG element, we add a <g> element which will hold all of our
// legend entries.
var g = legendSvg.append('g')
    .attr("class", "legend-key YlGnBu")
    .attr("transform", "translate(" + 20 + "," + 20 + ")");

// We add a <rect> element for each quantize category. The width and
// color of the rectangles will be set later.
g.selectAll("rect")
    .data(quantize.range().map(function(d) {
      return quantize.invertExtent(d);
    }))
  .enter().append("rect");

// We add a <text> element acting as the caption of the legend. The text
// will be set later.
g.append("text")
    .attr("class", "caption")
    .attr("y", -6)

/**
 * Function to update the legend.
 * Somewhat based on http://bl.ocks.org/mbostock/4573883
 */
function updateLegend() {

  // We determine the width of the legend. It is based on the width of
  // the map minus some spacing left and right.
  var legendWidth = d3.select('#map').node().getBoundingClientRect().width - 50;

  // We determine the domain of the quantize scale which will be used as
  // tick values. We cannot directly use the scale via quantize.scale()
  // as this returns only the minimum and maximum values but we need all
  // the steps of the scale. The range() function returns all categories
  // and we need to map the category values (q0-9, ..., q8-9) to the
  // number values. To do this, we can use invertExtent().
  var legendDomain = quantize.range().map(function(d) {
    var r = quantize.invertExtent(d);
    return r[1];
  });
  // Since we always only took the upper limit of the category, we also
  // need to add the lower limit of the very first category to the top
  // of the domain.
  legendDomain.unshift(quantize.domain()[0]);

  // On smaller screens, there is not enough room to show all 10
  // category values. In this case, we add a filter leaving only every
  // third value of the domain.
  if (legendWidth < 400) {
    legendDomain = legendDomain.filter(function(d, i) {
      return i % 3 == 0;
    });
  }

  // We set the domain and range for the x scale of the legend. The
  // domain is the same as for the quantize scale and the range takes up
  // all the space available to draw the legend.
  legendX
    .domain(quantize.domain())
    .range([0, legendWidth]);

  // We update the rectangles by (re)defining their position and width
  // (both based on the legend scale) and setting the correct class.
  g.selectAll("rect")
    .data(quantize.range().map(function(d) {
      return quantize.invertExtent(d);
    }))
    .attr("height", 8)
    .attr("x", function(d) { return legendX(d[0]); })
    .attr("width", function(d) { return legendX(d[1]) - legendX(d[0]); })
    .attr('class', function(d, i) {
      return quantize.range()[i];
    });

  // We set the calculated domain as tickValues for the legend axis.
  legendXAxis
    .tickValues(legendDomain)

  // We call the axis to draw the axis.
  g.call(legendXAxis);
}