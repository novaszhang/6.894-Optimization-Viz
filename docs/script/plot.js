var width = window.innerWidth,
    height = window.innerHeight,
    nx = parseInt(width / 5), // grid sizes
    ny = parseInt(height / 5),
    h = 1e-7, // step used when approximating gradients
    drawing_time = 30; // max time to run optimization

var svg = d3.select("#descentViz")
            .append("svg")
            .attr("width", width)
            .attr("height", height);


function display_g() {

  var counts = iter_count.map(x => x.value)

  //Set up x, y scale
  var x = d3.scaleBand()
  .rangeRound([0, width/5])
  .padding(0.1)
  .domain(iter_count.map(x => x.key));

  var y = d3.scaleLinear()
  .rangeRound([height/5, 0])
  .domain([0, d3.max(iter_count, d => d.value)])

  svg.selectAll("rect.barchart")
  .data(iter_count)
  .enter()
  .append("rect")
  .attr("class", "barchart")
  .attr("height", function(d) { return height/5 - y(d.value); })
  .attr("width", x.bandwidth())
  .attr("x", function(d) { return x(d.key); })
  .attr("y", function(d) { return y(d.value); })
  .attr("fill", "white")
  .attr("stroke-width", 0.5)
  .attr("stroke", "black")
  .attr("fill", function(d){return colorPicker(d);})
  .attr("fill-opacity", 0.5)
  .attr("transform", 
          "translate(" + 30 + "," + 50 + ")");

  var xAxis = d3.axisBottom(x)

  svg.append("g")
  .attr("class", "barchart")
  .attr("transform", 
          "translate(" + 30 + "," + (50+height/5) + ")")
  .call(xAxis);

  svg.append("g")
  .attr("class", "barchart")
  .attr("transform", 
          "translate(" + 30 + "," + 50 + ")")
  .call(d3.axisLeft(y));
}

function colorPicker(d) {
  if (d.key == "SGD") {return "red"; }
  else if (d.key == "Momentum") {return "orange"; }
  else if (d.key == "RMSProp") {return "blue"; }
  else if (d.key == "Adam") {return "green"; }
}

// Parameters describing where function is defined
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


//function: Quad Bowl
function f(x, y) {
    return -2 * Math.exp(-((x - 1) * (x - 1) + y * y) / .2) + -3 * Math.exp(-((x + 1) * (x + 1) + y * y) / .2) + x * x + y * y;
}

/* Returns gradient of f at (x, y) */
function grad_f(x,y) {
    var grad_x = (f(x + h, y) - f(x, y)) / h
        grad_y = (f(x, y + h) - f(x, y)) / h
    return [grad_x, grad_y];
}


/* Returns values of f(x,y) at each point on grid as 1 dim array. */
function get_f_values(nx, ny) {
    var grid = new Array(nx * ny);
    for (i = 0; i < nx; i++) {
        for (j = 0; j < ny; j++) {
            var x = scale_x( parseFloat(i) / nx * width ),
                y = scale_y( parseFloat(j) / ny * height );
            // Set value at ordering expected by d3.contour
            grid[i + j * nx] = f(x, y);
        }
    }
    return grid;
}

/*
 * Set up the contour plot
 */

var contours = d3.contours()
    .size([nx, ny])
    .thresholds(thresholds);

var f_values = get_f_values(nx, ny);

function_g.selectAll("path")
          .data(contours(f_values))
          .enter().append("path")
          .attr("d", d3.geoPath(d3.geoIdentity().scale(width / nx)))
          .attr("fill", function(d) { return color_scale(d.value); })
          .attr("stroke", "none")
          .style("opacity", 1);

/*
 * Set up buttons
 */
var draw_bool = {"SGD" : true, "Momentum" : true, "RMSProp" : true, "Adam" : true};

var buttons = ["SGD", "Momentum", "RMSProp", "Adam"];

var iter_count = [
      {key:"SGD", value:0},
      {key:"Momentum", value:0},
      {key:"RMSProp", value:0},
      {key:"Adam", value:0},
    ];

menu_g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", 40)
      .attr("fill", "black")
      .attr("opacity", 0.6);


menu_g.selectAll("circle")
      .data(buttons)
      .enter()
      .append("circle")
      .attr("cx", function(d,i) { return width/6 * (i + 1);} )
      .attr("cy", 18)
      .attr("r", 10)
      .attr("stroke-width", 0.5)
      .attr("stroke", "black")
      .attr("class", function(d) { console.log(d); return d;})
      .attr("fill-opacity", 0.5)
      .attr("stroke-opacity", 1)
      .on("mousedown", button_press)
      .on("mouseover", mouseon)
      .on("mouseout", mouseout)
      .on("mousemove", mousemove)
;

menu_g.selectAll("text")
      .data(buttons)
      .enter()
      .append("text")
      .attr("x", function(d,i) { return width/6 * (i + 1) + 18;} )
      .attr("y", 24)
      .text(function(d) { return d; })
      .attr("text-anchor", "start")
      .attr("font-family", "Helvetica Neue")
      .attr("font-size", 15)
      .attr("font-weight", 200)
      .attr("fill", "white")
      .attr("fill-opacity", 0.8);

var itc = ["Iteration counter"]

menu_g.selectAll(".text")
      .data(itc)
      .enter()
      .append("text")
      .attr("x", function(d,i) { return width/6 - 200;} )
      .attr("y", 24)
      .text(function(d) { return d; })
      .attr("text-anchor", "start")
      .style("fill", "orange")
      .attr("font-family", "Helvetica Neue")
      .attr("font-size", 15)
      .attr("font-weight", 200)
      .attr("fill", "white")
      .attr("fill-opacity", 0.8)
      .on("mousedown", display_g)

 var tooltip = d3
    .select("body")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("position", "absolute")

//Update for iteration counter
function update() {
  var data = iter_count.map(x => x.value);

  var text = menu_g.selectAll(".values")
      .data(data)

  text.remove();

  text
      .enter()
      .append("text")
      .attr("class", "values")
      .attr("x", function(d,i) { return width/6 * (i + 1) + 100;} ) 
      .attr("y", 24)
      .text(function(d) { return d; })
      .style("fill", "orange")
      .attr("text-anchor", "start")
      .attr("font-family", "Helvetica Neue")
      .attr("font-size", 15)
      .attr("font-weight", 200)
      .attr("fill", "white")
      .attr("fill-opacity", 0.8);
  
  text.text(function(d) {
    return d;
  });
}

setInterval(function() {
  update()
}, 1000);

function button_press() {
    var type = d3.select(this).attr("class")
    if (draw_bool[type]) {
        d3.select(this).attr("fill-opacity", 0);
        draw_bool[type] = false;
    } else {
        d3.select(this).attr("fill-opacity", 0.5)
        draw_bool[type] = true;
    }
}

function mouseon() {
  var type = d3.select(this).attr("class")
  d3.select(this)
    .attr("r", 14)
}

function mousemove() {
  var type = d3.select(this).attr("class")
  var typetext;
  if (type == "SGD") {
    typetext = "Stochastic approximation of gradient"

    } else if (type == "Momentum") {
    typetext = "Exponentially moving average of current & past gradients"

    } else if (type == "RMSProp") {
    typetext = "Variation of Momentum"


    } else if (type == "Adam") {
    typetext = "Combines RMSProp & Momentum"
    }
  tooltip
    .style("opacity", 1)
    .html(typetext)
    .style("left", (d3.mouse(this)[0]+90) + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
    .style("top", (d3.mouse(this)[1]) + "px")
}

function mouseout() {
  var type = d3.select(this).attr("class")
  d3.select(this)
    .attr("r", 10)
  tooltip
    .transition()
    .duration(200)
    .style("opacity", 0)
}

/*
 * Set up optimization/gradient descent functions.
 * SGD, Momentum, RMSProp, Adam.
 */

function get_sgd_path(x0, y0, learning_rate) {
    var sgd_history = [{"x": scale_x.invert(x0), "y": scale_y.invert(y0)}];
    var x1, y1;
    var gradient = [1,1];
    while (math.norm(gradient) > 1e-6) {
    //for (i = 0; i < num_steps; i++) {
        gradient = grad_f(x0, y0);
        x1 = x0 - learning_rate * gradient[0]
        y1 = y0 - learning_rate * gradient[1]
        sgd_history.push({"x" : scale_x.invert(x1), "y" : scale_y.invert(y1)})
        x0 = x1
        y0 = y1
        iter_count[0].value++
    }
    return sgd_history;
}

function get_momentum_path(x0, y0, learning_rate, momentum) {
    var v_x = 0,
        v_y = 0;
    var momentum_history = [{"x": scale_x.invert(x0), "y": scale_y.invert(y0)}];
    var x1, y1;
    var gradient = [1,1];
    while (math.norm(gradient) > 1e-6) {
        gradient = grad_f(x0, y0)
        v_x = momentum * v_x - learning_rate * gradient[0]
        v_y = momentum * v_y - learning_rate * gradient[1]
        x1 = x0 + v_x
        y1 = y0 + v_y
        momentum_history.push({"x" : scale_x.invert(x1), "y" : scale_y.invert(y1)})
        x0 = x1
        y0 = y1
        iter_count[1].value++
    }
    return momentum_history
}

function get_rmsprop_path(x0, y0, learning_rate, decay_rate, eps) {
    var cache_x = 0,
        cache_y = 0;
    var rmsprop_history = [{"x": scale_x.invert(x0), "y": scale_y.invert(y0)}];
    var x1, y1;
    var gradient = [1,1];
    while (math.norm(gradient) > 1e-6) {
        gradient = grad_f(x0, y0)
        cache_x = decay_rate * cache_x + (1 - decay_rate) * gradient[0] * gradient[0]
        cache_y = decay_rate * cache_y + (1 - decay_rate) * gradient[1] * gradient[1]
        x1 = x0 - learning_rate * gradient[0] / (Math.sqrt(cache_x) + eps)
        y1 = y0 - learning_rate * gradient[1] / (Math.sqrt(cache_y) + eps)
        rmsprop_history.push({"x" : scale_x.invert(x1), "y" : scale_y.invert(y1)})
        x0 = x1
        y0 = y1
        iter_count[2].value++
    }
    return rmsprop_history;
}

function get_adam_path(x0, y0, learning_rate, beta_1, beta_2, eps) {
    var m_x = 0,
        m_y = 0,
        v_x = 0,
        v_y = 0;
    var adam_history = [{"x": scale_x.invert(x0), "y": scale_y.invert(y0)}];
    var x1, y1;
    var gradient = [1,1];
    while (math.norm(gradient) > 1e-6) {
        gradient = grad_f(x0, y0)
        m_x = beta_1 * m_x + (1 - beta_1) * gradient[0]
        m_y = beta_1 * m_y + (1 - beta_1) * gradient[1]
        v_x = beta_2 * v_x + (1 - beta_2) * gradient[0] * gradient[0]
        v_y = beta_2 * v_y + (1 - beta_2) * gradient[1] * gradient[1]
        x1 = x0 - learning_rate * m_x / (Math.sqrt(v_x) + eps)
        y1 = y0 - learning_rate * m_y / (Math.sqrt(v_y) + eps)
        adam_history.push({"x" : scale_x.invert(x1), "y" : scale_y.invert(y1)})
        x0 = x1
        y0 = y1
        iter_count[3].value++
    }
    return adam_history;
}


/*
 * Functions necessary for path visualizations
 */

var line_function = d3.line()
                      .x(function(d) { return d.x; })
                      .y(function(d) { return d.y; });

function draw_path(path_data, type) {
    var gradient_path = gradient_path_g.selectAll(type)
                        .data(path_data)
                        .enter()
                        .append("path")
                        .attr("d", line_function(path_data.slice(0,1)))
                        .attr("class", type)
                        .attr("stroke-width", 3)
                        .attr("fill", "none")
                        .attr("stroke-opacity", 0.5)
                        .transition()
                        .duration(drawing_time)
                        .delay(function(d,i) { return drawing_time * i; })
                        .attr("d", function(d,i) { return line_function(path_data.slice(0,i+1));})
                        .remove();

    gradient_path_g.append("path")
                   .attr("d", line_function(path_data))
                   .attr("class", type)
                   .attr("stroke-width", 3)
                   .attr("fill", "none")
                   .attr("stroke-opacity", 0.5)
                   .attr("stroke-opacity", 0)
                   .transition()
                   .duration(path_data.length * drawing_time)
                   .attr("stroke-opacity", 0.5);
}

/*
 * Start minimization from click on contour map
 */

function mousedown() {
    /* Get initial point */
    var point = d3.mouse(this);
    /* Minimize and draw paths */
    var sgd_lr = document.getElementById("SGD_lr").value;
    var mom_lr = document.getElementById("moment_lr").value;
    var rms_lr = document.getElementById("rms_lr").value;
    var adam_lr = document.getElementById("adam_lr").value;
    minimize(
      scale_x(point[0]),
       scale_y(point[1]),
       sgd_lr,
       mom_lr,
       rms_lr,
       adam_lr);
}

function refresh () {
  gradient_path_g.selectAll("path").remove();
  svg.selectAll(".barchart").remove();
  iter_count = [
      {key:"SGD", value:0},
      {key:"Momentum", value:0},
      {key:"RMSProp", value:0},
      {key:"Adam", value:0},
    ];
}
function minimize(
      x0,
      y0, 
      sgd_lr,
       mom_lr,
       rms_lr,
       adam_lr) {
    refresh()

    if (draw_bool.SGD) {
        var sgd_data = get_sgd_path(x0, y0, sgd_lr);
        draw_path(sgd_data, "sgd");
    }
    if (draw_bool.Momentum) {
        var momentum_data = get_momentum_path(x0, y0, mom_lr, 0.8);
        draw_path(momentum_data, "momentum");
    }
    if (draw_bool.RMSProp) {
        var rmsprop_data = get_rmsprop_path(x0, y0, rms_lr, 0.99, 1e-6);
        draw_path(rmsprop_data, "rmsprop");
    }
    if (draw_bool.Adam) {
        var adam_data = get_adam_path(x0, y0, adam_lr, 0.7, 0.999, 1e-6);
        draw_path(adam_data, "adam");
    }
}