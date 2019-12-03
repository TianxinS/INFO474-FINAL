"use-strict";
(function() {

    var svgContainer = ""; // we want svgContainer to be global
    var regressionConstants = ""; // we want context to be global
    var Pvalue = "";
    var Rsquared = "";

  // wait until window loads to execute code
  window.onload = function() {
    svgContainer = d3.select('body')
        .append('svg')
        .attr('width', 700)
        .attr('height', 800);
        // d3.csv is basically fetch but it can be be passed a csv file as a parameter
        d3.csv("./listings-2.csv")
        .then((data) => makeScatterPlot(data));
  }

    // make scatter plot with trend line
    function makeScatterPlot(csvData) {
        data = csvData // assign data as global variable

        // get arrays of fertility rate data and life Expectancy data
        let minimum_nights_data = data.map((row) => parseFloat(row["minimum_nights"]));
        let availability_365_data = data.map((row) => parseFloat(row["availability_365"]));
        
        // find data limits
        let axesLimits = findMinMax(minimum_nights_data, availability_365_data);

        // draw axes and return scaling + mapping functions
        let mapFunctions = drawAxes(axesLimits, "minimum_nights", "availability_365");

        // plot data as points and add tooltip functionality
        plotData(mapFunctions);

        // draw title and axes labels
        makeLabels();

}

// make title and axes labels
function makeLabels() {
    
    svgContainer.append('text')
    .attr('x', 200)
    .attr('y', 640)
    .style('font-size', '12pt')
    .text('Minimum Nights That Customers Can Book');

    svgContainer.append('text')
    .attr('transform', 'translate(15, 400)rotate(-90)')
    .style('font-size', '12pt')
    .text('The Availability in 365 Days');
}

// plot all the data points on the SVG
// and add tooltip functionality
function plotData(map) {

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    drawRegressionLine(data,"All");

    // plot new title
    d3.select('#title').remove()
    svgContainer.append('text')
    .attr('x', 80)
    .attr('y', 40)
    .attr('id', "title")
    .style('font-size', '13pt')
    .text("Neighborhood Group by Minimum Nights and Availability (All Neighborhood Groups)");

    // append data to SVG and plot as points
    svgContainer.selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', '4')
        .attr('stroke', "royalblue")
        .style("fill-opacity", "0")
            // add tooltips
            .on("mouseover", function(d){
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html("Availability in 365: " + d.availability_365 + "<br/>" + "Minimum Nights: " + d.minimum_nights )
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px")
            })
            .on("mouseout", function(d){
                div.transition()
                    .duration(500)
                    .style("opacity", 0)
            });

    var dropDown1 = d3.select("#filter1").append("select")
            .attr("name", "neighborhood_group-list");

    var defaultOption = dropDown1.append("option")
    .data(data)
    .text("All")
    .attr("value", "select")
    .classed("default",true)
    .enter();

    var options1 = dropDown1.selectAll("option")
        .data(d3.map(data, function(d){return d.neighbourhood_group;}).keys())
        .enter()
        .append("option")
        .text(function (d) { return d; })
        .attr("value", function (d) { return d; });

    // make tooltip
    let div = d3.select("body").append("div")
    .attr("class", "tooltip1")
    .style("opacity", 0);

    dropDown1.on("change", function() {
        var selected = d3.select(this).property("value");

        let displayOthers = this.checked ? "inline" : "none";
        let display = this.checked ? "none" : "inline";

        if (selected === "select"){
            drawRegressionLine(data,"All");

        // plot new title
        d3.select('#title').remove()
        svgContainer.append('text')
        .attr('x', 80)
        .attr('y', 40)
        .attr('id', "title")
        .style('font-size', '13pt')
        .text("Neighborhood Group by Minimum Nights and Availability (All Neighborhood Groups)");

        svgContainer.selectAll("circle")
          .attr("display", display);

        }

        else{

            svgContainer.selectAll("circle")
                .filter(function(d) {return selected != d.neighbourhood_group;})
                .attr("display", displayOthers);

            svgContainer.selectAll("circle")
                .filter(function(d) {return selected == d.neighbourhood_group;})
                .attr("display", display);


            console.log(selected)
            regressionData = data.filter(function(d) {return selected == d.neighbourhood_group;})
            
            drawRegressionLine(regressionData,selected);

            // plot new title
            d3.select('#title').remove()
                svgContainer.append('text')
                .attr('x', 80)
                .attr('y', 40)
                .attr('id', "title")
                .style('font-size', '13pt')
                .text("Neighborhood Group by Minimum Nights and Availability (" + selected + ")")
            
        }

    });

    // append data to SVG and plot as points
    svgContainer.selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', '4')
        .attr('stroke', "royalblue")
        .style("fill-opacity", "0")
            // add tooltips
            .on("mouseover", function(d){
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html("Availability in 365: " + d.availability_365 + "<br/>" + "Minimum Nights: " + d.minimum_nights )
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px")
            })
            .on("mouseout", function(d){
                div.transition()
                    .duration(500)
                    .style("opacity", 0)
            })
        .attr({
            id: function(d) { return d.neighbourhood_group; }
        });

}

// draw the axes and ticks
function toCanvasPoint(limits,point) {
    // return x value from a row of data
    // let xValue = function(d) { return +d[point.x]; }
    let xValue = point.x

    // function to scale x value
    let xScale = d3.scaleLinear()
    .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
    .range([50, 600]);

    // xMap returns a scaled x value from a row of data
    // let xMap = function(d) { return xScale(xValue(d)); };
    let xMap = xScale(xValue)

    // return y value from a row of data
    // let yValue = function(d) { return +d[point.y]}
    let yValue = point.y

    // function to scale y
    let yScale = d3.scaleLinear()
        .domain([limits.yMax + 5, limits.yMin - 0]) // give domain buffer
        .range([50, 600]);

    // yMap returns a scaled y value from a row of data
    // let yMap = function (d) { return yScale(yValue(d)); };
    let yMap = yScale(yValue)

    // return mapping and scaling functions
    return {
        x: xMap,
        y: yMap
    };
}

// draw the axes and ticks
function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
    .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
    .range([50, 600]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
    .attr('transform', 'translate(0, 600)')
    .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
        .domain([limits.yMax + 5, limits.yMin - 0]) // give domain buffer
        .range([50, 600]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
        .attr('transform', 'translate(50, 0)')
        .call(yAxis);

    // return mapping and scaling functions
    return {
        x: xMap,
        y: yMap,
        xScale: xScale,
        yScale: yScale
    };
}

// find min and max for arrays of x and y
function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
    xMin : xMin,
    xMax : xMax,
    yMin : yMin,
    yMax : yMax
    }
}

// format numbers
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


    /*********************************************************
                            Regression Functions
    *********************************************************/

    function linearRegression(independent, dependent)
    {
        let lr = {};

        let independent_mean = arithmeticMean(independent);
        let dependent_mean = arithmeticMean(dependent);
        let products_mean = meanOfProducts(independent, dependent);
        let independent_variance = variance(independent);

        lr.a = (products_mean - (independent_mean * dependent_mean) ) / independent_variance;

        lr.b = dependent_mean - (lr.a * independent_mean);

        return lr;
    }

    function arithmeticMean(data)
    {
        let total = 0;

        // note that incrementing total is done within the for loop
        for(let i = 0, l = data.length; i < l; total += data[i], i++);

        return total / data.length;
    }

    function meanOfProducts(data1, data2)
    {
        let total = 0;

        // note that incrementing total is done within the for loop
        for(let i = 0, l = data1.length; i < l; total += (data1[i] * data2[i]), i++);

        return total / data1.length;
    }

    function variance(data)
    {
        let squares = [];

        for(let i = 0, l = data.length; i < l; i++)
        {
            squares[i] = Math.pow(data[i], 2);
        }

        let mean_of_squares = arithmeticMean(squares);
        let mean = arithmeticMean(data);
        let square_of_mean = Math.pow(mean, 2);
        let variance = mean_of_squares - square_of_mean;

        return variance;
    }

    // Draw the regression line
    function drawRegressionLine(regressionData,neighborGroup) {

        // get arrays of fertility rate data and life Expectancy data
        let minimum_nights_data = regressionData.map((row) => parseFloat(row["minimum_nights"]));
        let availability_365_data = regressionData.map((row) => parseFloat(row["availability_365"]));
        regressionConstants = linearRegression(minimum_nights_data, availability_365_data);

        // find data limits
        let axesLimits = findMinMax(minimum_nights_data, availability_365_data);

        let startPoint = regressionLine(-10); // Use 0 as line start point
        let endPoint = regressionLine(400); // Use 450 as line end point

        // convert points to Canvas points
        startPoint = toCanvasPoint(axesLimits,startPoint);
        endPoint = toCanvasPoint(axesLimits,endPoint);

        const regressionValues = [
            {Neighborhood: "All", PValue: "< 2.2e-16 ***", RSquared: "0.008739"},
            {Neighborhood: "Ballard", PValue: "0.03243 *", RSquared: "0.007607"},
            {Neighborhood: "Beacon Hill", PValue: "0.708", RSquared: "-0.002735"},
            {Neighborhood: "Capitol Hill", PValue: "7.03e-06 ***", RSquared: "0.02047"},
            {Neighborhood: "Cascade", PValue: "<2e-16 ***", RSquared: "0.1412"},
            {Neighborhood: "Central Area", PValue: "0.0991", RSquared: "0.002133"},
            {Neighborhood: "Delridge", PValue: "0.000165 ***", RSquared: "0.04886"},
            {Neighborhood: "Downtown", PValue: "0.0293 *", RSquared: "0.002259"},
            {Neighborhood: "Interbay", PValue: "6.88e-13 ***", RSquared: "0.7494"},
            {Neighborhood: "Lake City", PValue: "0.556", RSquared: "-0.004363"},
            {Neighborhood: "Magnolia", PValue: "0.409", RSquared: "-0.001917"},
            {Neighborhood: "Northgate", PValue: "0.917", RSquared: "-0.004622"},
            {Neighborhood: "Other neighborhoods", PValue: "0.0225 *", RSquared: "0.002502"},
            {Neighborhood: "Queen Anne", PValue: "5.51e-05 ***", RSquared: "0.02348"},
            {Neighborhood: "Rainier Valley", PValue: "0.00156 **", RSquared: "0.0209"},
            {Neighborhood: "Seward Park", PValue: "0.984", RSquared: "-0.01162"},
            {Neighborhood: "University District", PValue: "0.986", RSquared: "-0.004131"},
            {Neighborhood: "West Seattle", PValue: "0.935", RSquared: "-0.002074"}
        ]

        
        var i;
        for (i = 0; i < regressionValues.length; i++){
            if ( regressionValues[i]["Neighborhood"] === neighborGroup){
                Pvalue = regressionValues[i]["PValue"];
                Rsquared = regressionValues[i]["RSquared"];
            }
        }

        // make tooltip
        let div = d3.select("body").append("div")
        .attr("class", "tooltip2")
        .style("opacity", 0);

        d3.select("line.trendline").remove()
        svgContainer.append("line")
        .attr("class", "trendline")
        .attr("x1", startPoint.x)
        .attr("y1", startPoint.y)
        .attr("x2", endPoint.x)
        .attr("y2", endPoint.y)
        .attr("stroke", "dimgrey")
        .attr("stroke-width", 2)
            // add tooltips
            .on("mouseover", function(d){
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html("Availability in 365= " + Math.round(regressionConstants.a*1000)/1000 + "*Minimum Nights+" + Math.round(regressionConstants.b*1000)/1000 + "<br/>" + "Slope: " + Math.round(regressionConstants.a*1000)/1000 + "<br/>" + "Intercept: " + Math.round(regressionConstants.b*1000)/1000 + "<br/>" + "P-Value: " + Pvalue + "<br/>" + "R-Squared: " + Rsquared  )
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px")
            })
            .on("mouseout", function(d){
                div.transition()
                    .duration(500)
                    .style("opacity", 0)
            });
        
    }

    // return a new point with availability in 365 using Linear Regression Equation
    function regressionLine(min_ns) {
                
        return {
            // calculate availability in 365
            y: Math.round((min_ns*regressionConstants.a + regressionConstants.b)*100)/100,
            x: min_ns
        }
    }

})();