var origin,
    surface,
    color


var mx, my, mouseX, mouseY;


function plot_3d() {

origin = [9*width/10, height/5], 
    j = 16, 
    points = [], 
    alpha = 0, 
    beta = 0, 
    startAngle = Math.PI/4;


surface = d3._3d()
.scale(1)
.x(function(d){ return d.x; })
.y(function(d){ return d.y; })
.z(function(d){ return d.z; })
.origin(origin)
.rotateY(startAngle)
.rotateX(-startAngle)
.shape('SURFACE', j*2);
color = d3.scaleLinear();

svg .call(d3.drag()
    .on('drag', dragged)
    .on('start', dragStart)
    .on('end', dragEnd)).append('g');

}

plot_3d()

d3.selectAll('button').on('click', change);

change();

function processData(data, tt){

    var planes = svg.selectAll('path').data(data, function(d){ return d.plane; });

    planes
    .enter()
    .append('path')
    .attr('class', '_3d')
    .attr('fill', colorize)
    .attr('opacity', 0)
    .attr('stroke-opacity', 0.1)
    .merge(planes)
    .attr('stroke', 'black')
    .transition().duration(tt)
    .attr('opacity', 1)
    .attr('fill', colorize)
    .attr('d', surface.draw);

    planes.exit().remove();

    d3.selectAll('._3d').sort(surface.sort);

}

function colorize(d){
    var _y = (d[0].y + d[1].y + d[2].y + d[3].y)/4;
    return d.ccw ? d3.interpolateSpectral(color(_y)) : d3.color(d3.interpolateSpectral(color(_y))).darker(2.5);
}

function dragStart(){
    mx = d3.event.x;
    my = d3.event.y;
}

function dragged(){
    mouseX = mouseX || 0;
    mouseY = mouseY || 0;
    beta   = (d3.event.x - mx + mouseX) * Math.PI / 230 ;
    alpha  = (d3.event.y - my + mouseY) * Math.PI / 230  * (-1);
    processData(surface.rotateY(beta + startAngle).rotateX(alpha - startAngle)(points), 0);
}

function dragEnd(){
    mouseX = d3.event.x - mx + mouseX;
    mouseY = d3.event.y - my + mouseY;
}

function init(eq){
    points = [];

    for(var z = -j; z < j; z++){
        for(var x = -j; x < j; x++){
            //console.log(parseFloat(math.evaluate(eq, {x:x, y:z})))
            points.push({x: x, y: parseFloat(math.evaluate(eq, {x:x, y:z})), z: z});
        }
    }

    var yMin = d3.min(points, function(d){ return d.y; });
    var yMax = d3.max(points, function(d){ return d.y; });
    color.domain([yMin, yMax]);
    processData(surface(points), 100);
}

function change(){
    var eqa = document.getElementById("func").value.toString()
    init(eqa);
}