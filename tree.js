var minBoxWidth = 170,
    boxHeight = 20,
    gap = {
        width: 70,
        height: 6
    },
    margin = {
        top: 16,
        right: 16,
        bottom: 16,
        left: 16
    },
    data,   // set after main code comment
    svg,    // set after main code comment
    width,  // set after main code comment
    height; // set after main code comment

// test layout
var Nodes = [];
var links = [];
var numLvls = 0,
    topMarginLvl = [],
    count = [],
    boxWidth = [];

var diagonal = d3.svg.diagonal()
    .projection(function (d) {
        "use strict";
        return [d.y, d.x];
    });

var nodeDescription;
var tip = d3.tip()
    .attr('class', 'd3-tip')
//    .direction('e')
    .offset([-10, 0])
    .html(function(d) {
        var str = "";
        if (d.url){
            str = "<font color=\"red\">Double Click to open course page</font><br/><br/>";
        }
        if(d.dsc)
            str += nodeDescription;
            
        return str;
    })

// Find the node with the specified text as it name
function find(text) {
    "use strict";
    var i;
    for (i = 0; i < Nodes.length; i += 1) {
        if (Nodes[i].name === text) {
            return Nodes[i];
        }
    }
    return null;
}

// Bring the current selection to the front of drawing.
// This is neccessary when there are to many links 
// and the highlighted link is behind all of them.
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

// Reverse function to moveToFront
d3.selection.prototype.moveToBack = function() { 
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    }); 
};

function switch_state (d, stat) {
//    if (stat){
        d3.select("#" + d.id).moveToFront().classed("activelink", stat); // change link color
        d3.select("#" + d.id).moveToFront().classed("link", !stat); // change link color
//    }else{
//        d3.select("#" + d.id).moveToBack().classed("activelink", stat); // change link color
//        d3.select("#" + d.id).moveToBack().classed("link", !stat); // change link color
//    }
}

function mouse_action(val, stat, direction) {
    "use strict";
    d3.select("#" + val.id).classed("active", stat);
//    if(val.url)
//        d3.select("#" + val.id).classed("witurl", !stat);

    links.forEach(function (d) {
        // This is used to reduce the amount of repetition in the code. 
        // For previous implementation see git log.
        var st = [d.source, d.target];
        for (var i = 0; i < 2; i++){
            if (direction == "root") {
                if (st[i].id === val.id) {
                    switch_state(d, stat);
                    if (st[(i+1)%2].lvl < val.lvl)
                        mouse_action(st[(i+1)%2], stat, "left");
                    else if (st[(i+1)%2].lvl > val.lvl)
                        mouse_action(st[(i+1)%2], stat, "right");
                }
            }else if (direction == "left") {
                if (st[i].id === val.id && st[(i+1)%2].lvl < val.lvl) {
                    switch_state(d, stat);
                    mouse_action(st[(i+1)%2], stat, direction);
                }
            }else if (direction == "right") {
                if (st[i].id === val.id && st[(i+1)%2].lvl > val.lvl) {
                    switch_state(d, stat);
                    mouse_action(st[(i+1)%2], stat, direction);
                }
            }
        }
    });
}

function renderRelationshipGraph(data) {
    "use strict";

    // Compute the placement of each node based on its level and the size
    // of previous levels.
    data.Nodes.forEach(function (d, i) {
        var bv = 0;
        for (var j = 0; j < d.lvl; j++)
            bv += boxWidth[j] + gap.width;
        d.x = margin.left + bv;//d.lvl * (boxWidth + gap.width);
        d.y = topMarginLvl[d.lvl] + (boxHeight + gap.height) * count[d.lvl];
        d.id = "n" + i;
        count[d.lvl] += 1;
        Nodes.push(d);
    });

    data.links.forEach(function (d) {
        // If there is no node with the mentioned id, omit the link
        if( find(d.source) && find(d.target)){
            links.push({
                source: find(d.source),
                target: find(d.target),
                id: "l" + find(d.source).id + find(d.target).id
            });
        }else{
            console.warn("One of the IDs \'" +d.source+ "\' or \'" + d.target + "\' do not point to a node");
        }
    });

    svg.append("g")
        .attr("class", "nodes");

    var node = svg.select(".nodes")
        .selectAll("g")
        .data(Nodes)
        .enter()
        .append("g")
        .attr("class", "unit");

    node.append("rect")
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; })
        .attr("id", function (d) { return d.id; })
        .attr("width", function (d) { return boxWidth[d.lvl];})
        .attr("height", boxHeight)
        .attr("class", function (d) { return "node";})
        .attr("rx", 6)
        .attr("ry", 6)
        .on("mouseover", function () {
            var d = d3.select(this).datum();
            mouse_action(d, true, "root");
            // D O N T   R E M O V E   T H I S
            // It is refered to in a comment.
            if(d.url || d.dsc) { 
                nodeDescription = "Click to see a short description";
                tip.show(d)
            }
        })
        .on("mouseout", function () {
            var d = d3.select(this).datum();
            mouse_action(d, false, "root");
            tip.hide();
        })
//        .on("click", function(d) { if(d.url) window.open(d.url); }); // If a url is available, put a click event
        // Use this if you wish the tooltip to show when the box is clicked 
        // and open the url when the box is double clicked.
        // Otherwise comment them and uncomment the line above this comment and the line in "mouseover" event.
        .on("click", function(d) { if(d.url || d.dsc) { nodeDescription = d.dsc; tip.show(d);} }) // If a url is available, put a click event
        .on("dblclick", function(d) { if(d.url) window.open(d.url); }); // If a url is available, put a click event

    node.append("text")
        .attr("class", "label")
        .attr("x", function (d) { return d.x + 14; })
        .attr("y", function (d) { return d.y + 15; })
        .text(function (d) { return d.text; });

    // Create the links between the boxes
    links.forEach(function (li) {
        svg.append("path", "g")
            .attr("class", "link")
            .attr("id", li.id)
            .attr("d", function () {
                var oTarget = {
                    x: li.target.y + 0.5 * boxHeight,
                    y: li.target.x
                };
                var oSource = {
                    x: li.source.y + 0.5 * boxHeight,
                    y: li.source.x
                };
                
                if (oSource.y < oTarget.y) {
                    oSource.y += boxWidth[li.source.lvl];
                } else {
                    oTarget.y += boxWidth[li.target.lvl];
                }
                return diagonal({
                    source: oSource,
                    target: oTarget
                });
            });
    });
}

// This function computes the size of the box needed to fit the node text.
window.getWidthOfText = function(txt){
  var classes = document.styleSheets[0].rules || document.styleSheets[0].cssRules;
    for (var x = 0; x < classes.length; x++) {
        if (classes[x].selectorText === ".label") {
            // Create dummy span
            this.e = document.createElement('span');
            // Set font-size
            this.e.className = "label";
            // Set text
            this.e.innerHTML = txt;
            document.body.appendChild(this.e);
            // Get width NOW, since the dummy span is about to be removed from the document
            var w = this.e.offsetWidth + 20;
            // Cleanup
            document.body.removeChild(this.e);
            // All right, we're done
            return w;
        }
    }
}

// M A I N   C O D E

d3.json("flare.json", function (json) {
    "use strict";
    data = json;
    
    // Initialize the array variables
    data.Nodes.forEach(function (d) {
        count[d.lvl] = 0;
        topMarginLvl[d.lvl] = 0;
        boxWidth[d.lvl] = minBoxWidth;
    });
    numLvls = count.length;
    
    // Find the number of items in each level and the width of each level.
    data.Nodes.forEach(function (d) {
        topMarginLvl[d.lvl] += 1;
        if(getWidthOfText(d.text) > boxWidth[d.lvl])
            boxWidth[d.lvl] = getWidthOfText(d.text);
    });
    
    // Compute the total width of the page.
    width = 0;
    for(var i = 0; i < boxWidth.length-1; i++){
        width += boxWidth[i] + gap.width;
    }
    
    width += margin.left + margin.right + boxWidth[boxWidth.length-1];
    
    // Which level is has the most elements. Used to compute the height of the page
    var largest = Math.max.apply(Math, topMarginLvl);
    
    // Update height and width to have all the nodes in the image and also have 
    // the smallest image possible.
    height = margin.top + margin.bottom + largest*boxHeight + (largest - 1) * gap.height;
//    width  = margin.left + margin.right + topMarginLvl.length*boxWidth + (topMarginLvl.length - 1)*gap.width;
    
    // Find the top margin of each column(Level).
    for (var i = 0; i < topMarginLvl.length; i++){
        topMarginLvl[i] = (height - topMarginLvl[i]*boxHeight - (topMarginLvl[i]-1)*gap.height)/2;
    }
    
    svg = d3.select("#tree").append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g");
    
    svg.call(tip);
    
    renderRelationshipGraph(data);
});