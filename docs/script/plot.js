var width = 960,
    height = 500,
    x = parseInt(width / 5), // grid sizes
    y = parseInt(height / 5),
    h = 1e-7, // step used when approximating gradients
    drawing_time = 30; // max time to run optimization

var svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height);


// Parameters describing where function is defined
// User-set 
var domain_x = [-2, 2],
    domain_y = [-2, 2],
    domain_f = [-2, 8],
    contour_step = 0.5; // Step size of contour plot

var scale_x = d3.scaleLinear()
                .domain([0, width])
                .range(domain_x);

var scale_y = d3.scaleLinear()
                .domain([0, height])
                .range(domain_y);

var thresholds = d3.range(domain_f[0], domain_f[1], contour_step);

var color_scale = d3.scaleLinear()
    .domain(d3.extent(thresholds))
    .interpolate(function() { return d3.interpolateYlGnBu; });

var function_g = svg.append("g").on("mousedown", mousedown),
    gradient_path_g = svg.append("g"),
    menu_g = svg.append("g");


/* Contour plot */

var contour_plot = d3.contours()
    .size([x, y])
    .thresholds(thresholds);

var z = get_z(x, y);

function_g.selectAll("path")
          .data(contours(z))
          .enter().append("path")
          .attr("d", d3.geoPath(d3.geoIdentity().scale(width / x)))
          .attr("fill", function(d) { return color_scale(d.value); })
          .attr("stroke", "none");
