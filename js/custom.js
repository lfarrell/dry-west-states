d3.csv('data/all_2000.csv', function(datas) {
    var margins = {top: 20, right: 105, bottom: 25, left: 95},
        parse_date = d3.time.format("%m/%Y").parse,
        year_parse = d3.time.format("%Y").parse,
        height = 600 - margins.top - margins.bottom;

    var precip_colors = ['#543005','#8c510a','#bf812d','#dfc27d','#f6e8c3','#f5f5f5','#c7eae5','#80cdc1','#35978f','#01665e','#003c30'];
    var temp_colors = ['#a50026','#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695'].reverse();
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    datas.forEach(function(d) {
        d.date = parse_date(d.month + '/' + d.year);
        d.value = +d.value;
        d.anomaly = +d.anomaly;
        d.string_year = d.year;
        d.year = year_parse(d.year);
    });

    var selectors = {
        drought: '#drought_div',
        precip: '#precip_div',
        temp: '#temp_div'
    };

    localStorage.setItem('state', 'CA');

    var svg_drought = d3.select(selectors.drought).append('svg');
    var svg_precip = d3.select(selectors.precip).append('svg');
    var svg_temp = d3.select(selectors.temp).append('svg');

    var render = _.debounce(function() {
        var width = window.innerWidth - margins.right - margins.left;
        var selected_state = localStorage.getItem('state', 'CA');

        var data_drought = datas.filter(function(d) {
            return d.type === 'drought' && d.state === selected_state;
        });

        var data_precip = datas.filter(function(d) {
            return d.type === 'precip' && d.state === selected_state;
        });

        var data_temp = datas.filter(function(d) {
            return d.type === 'temp' && d.state === selected_state;
        });

        var radius, ticks, shape_width, orientation, legend_height, text_format;

        d3.select('#state').on('change', function() {
            var selected_state_name = this.options[this.selectedIndex].innerHTML;
            var state = d3.select(this);
            var state_val = state.prop("value");

            var data_drought = datas.filter(function(d) {
                return d.type === 'drought' && d.state === state_val;
            });

            var data_precip = datas.filter(function(d) {
                return d.type === 'precip' && d.state === state_val;
            });

            var data_temp = datas.filter(function(d) {
                return d.type === 'temp' && d.state === state_val;
            });

            d3.selectAll(".selected_state").text(selected_state_name);
            state.prop("value", "");

            localStorage.setItem('state', state_val);

            build(data_drought, svg_drought, selectors.drought);
            build(data_precip, svg_precip, selectors.precip);
            build(data_temp, svg_temp, selectors.temp);
        });

        if(width < 150) {
            radius = 3;
            ticks = 3;
            shape_width = 10;
            orientation = 'vertical';
        } else if(width < 350) {
            radius = 6;
            ticks = 9;
            shape_width = 20;
            orientation = 'vertical';
        } else if(width < 500) {
            radius = 9;
            ticks = 9;
            shape_width = 40;
            orientation = 'vertical';
        } else if(width < 700) {
            radius = 11;
            ticks = 9;
            shape_width = 50;
            orientation = 'horizontal';
        } else if(width < 1000) {
            radius = 16;
            ticks = 17;
            shape_width = 65;
            orientation = 'horizontal';
        } else {
            radius = 20;
            ticks = 17;
            shape_width = 70;
            orientation = 'horizontal';
        }

        if(width >= 800) {
            legend_height = 150;
        } else {
            legend_height = 275;
        }

        if(width < 900 && orientation === 'horizontal') {
            text_format = "0f";
        } else {
            text_format = ".02f";
        }

        function build(data, svg, selector) {
            var p_colors = stripColors(precip_colors, data, 'value');
            var t_colors = stripColors(temp_colors, data, 'anomaly');
            var color_type = /temp/.test(selector);
            var words;

            svg.attr("width", width + margins.left + margins.right)
                .attr("height", height + margins.top + margins.bottom);

            // Axis
            var xScale =  d3.time.scale()
                .range([0, width]);

            xScale.domain(d3.extent(data, ƒ('year')));

            var months = _.pluck(_.uniq(data, function(d) { return d.month }), 'month');

            var yScale = d3.scale.ordinal()
                .rangeRoundBands([0, height], .05);

            yScale.domain(months);

            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("top")
                .ticks(ticks)
                .tickFormat(function(d) {
                    var regx =  /\d{4}/;
                    var year = regx.exec(d.toString());
                    if(ticks >= 15) {
                        return year[0];
                    } else if(ticks >= 3) {
                        return year[0].substr(2, 4);
                    } else {
                        return year[0];
                    }
                });

            var xAxisBottom = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .ticks(ticks);

            var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient("left");

            svg.append("g")
                .attr("class", "x axis")
                .translate([margins.left, margins.top]);

            d3.select(selector + " g.x").call(xAxis);

            svg.append("g")
                .attr("class", "x bottom axis")
                .translate([margins.left, height + margins.top]);

            d3.select(selector + " g.bottom").call(xAxisBottom);

            svg.append("g")
                .attr("class", "y axis")
                .translate([margins.left - 25, margins.top]);

            d3.select(selector + " g.y").call(yAxis);

            d3.selectAll(selector + " g.y text").text(function(d) {
                return monthWord(d3.select(this).text());
            });

            // Add circles
            if(/precip/.test(selector)) {
                words = ' inches';
            } else if(/temp/.test(selector)) {
                words = ' degrees';
            } else {
                words = '';
            }

            var circles = svg.selectAll('circle').data(data);

            circles.enter().append('circle');

            circles.attr('cx', function(d) { return xScale(d.year); })
                .attr('cy', function(d) { return yScale(d.month); })
                .attr('r', radius)
                .translate([margins.left, margins.top + 25])
                .style('fill', function(d) {
                    return color_type ? t_colors(d.anomaly) : p_colors(d.value);
                })
                .on('mouseover touchstart', function(d) {
                    div.transition()
                        .duration(100)
                        .style("opacity", .9);

                    div.html(
                            '<h4 class="text-center">' + monthWord(d.month) + ' ' + d.string_year + '</h4>' +
                            '<ul class="list-unstyled"' +
                            '<li>State: ' + d.state + '</li>' +
                            '<li>Value: ' + d.value + words + '</li>' +
                            '<li>Departure from Avg: ' + d.anomaly + words + '</li>' +
                            '</ul>'
                        )
                        .style("top", (d3.event.pageY-108)+"px")
                        .style("left", (d3.event.pageX-28)+"px");
                })
                .on('mouseout touchend', function(d) {
                    div.transition()
                        .duration(250)
                        .style("opacity", 0);
                });

            circles.exit().remove();

            /**
             * Draw a legend
             * @param selector
             * @param color_values
             * @param values
             * @param type
             * @returns {*}
             */
            function drawLegend(selector, color_values, values, width) {
                d3.select(selector + " .legend").remove();
                var type = (/temp/.test(selector)) ? 'anomaly' : 'value';
                var colors = stripColors(color_values, values, type);
                var class_name = selector.substr(1);
                var svg = d3.select(selector).append("svg")
                        .classed("svg", true)
                        .classed("legend", true);

                svg.attr("width", width + 100)
                    .attr("height", legend_height);

                svg.append("g")
                        .attr("class", "legend-" + class_name)
                        .attr("width", width)
                        .translate([margins.left, margins.top]);

                var legend = d3.legend.color()
                    .shapeWidth(shape_width)
                    .orient(orientation)
                    .labelFormat(d3.format(text_format))
                    .scale(colors);

                svg.select(".legend-" + class_name)
                    .call(legend);

                return svg;
            }

            var legend_colors = color_type ? temp_colors : precip_colors;

            drawLegend(selector, legend_colors, data, width);
        }

        build(data_drought, svg_drought, selectors.drought);
        build(data_precip, svg_precip, selectors.precip);
        build(data_temp, svg_temp, selectors.temp);

        var rows = d3.selectAll('.row');
        rows.classed('opaque', false);
        rows.classed('hide', false);
        d3.selectAll('#load').classed('hide', true);

    }, 200);

    /**
     * Color codes for strip charts
     * @param values
     * @param data
     * @param type
     * @returns {*}
     */
    function stripColors(values, data, type) {
        return d3.scale.quantize()
            .domain(d3.extent(data, ƒ(type)))
            .range(values);
    }

    function monthWord(m) {
        switch(m) {
            case "01":
                return "January";
                break;
            case "02":
                return "February";
                break;
            case "03":
                return "March";
                break;
            case "04":
                return "April";
                break;
            case "05":
                return "May";
                break;
            case "06":
                return "June";
                break;
            case "07":
                return "July";
                break;
            case "08":
                return "August";
                break;
            case "09":
                return "September";
                break;
            case "10":
                return "October";
                break;
            case "11":
                return "November";
                break;
            case "12":
                return "December";
                break;
            default:
                return "unknown";
        }
    }

    render();
    window.addEventListener('resize', render);
});