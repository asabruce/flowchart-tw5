/*\
title: $:/plugins/gt6796c/flowchart-tw5/wrapper.js
type: application/javascript
module-type: widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
     var uniqueID = 1;

    var Widget = require("$:/core/modules/widgets/widget.js").widget;
    if ($tw.browser && !window.Raphael) {
        window.eve = require("$:/plugins/gt6796c/flowchart-tw5/eve.js");
        window.Raphael = require("$:/plugins/gt6796c/flowchart-tw5/raphael.js");
        window.flowchart = require("$:/plugins/gt6796c/flowchart-tw5/flowchart.js");
        window._ = require("$:/plugins/gt6796c/flowchart-tw5/underscore.js");
        window.Diagram = require("$:/plugins/gt6796c/flowchart-tw5/sequence-diagram.js");
    }
    if ($tw.browser && !window.mermaidAPI) {
        require("$:/plugins/gt6796c/flowchart-tw5/mermaidAPI.js").mermaidAPI;
    }

    var FlowchartWidget = function(parseTreeNode, options) {
        this.initialise(parseTreeNode, options);
    };

    FlowchartWidget.prototype = new Widget();

    function getScriptBody(src,tag)
    {
        var scriptBody= src.getAttribute("text", src.parseTreeNode.text || "");

        if (src.parseTreeNode.text) {
            scriptBody = src.parseTreeNode.text;
        }
        else if (src.parseTreeNode.children)
        {
            var kids = src.parseTreeNode.children;
            for (var k in kids)
            {
                var kk = kids[k];
                switch(kk.type)
                {
                    // no wikiparsing found
                    case "text":
                        scriptBody += kk.text; break;
                    // internal link, make it a permalink reference
                    case "link":
                        scriptBody += "#" + kk.children[0].text; break;
                    // -- gets interpreted as an HTML element, we don't want that
                    case "entity":
                        switch(kk.entity)
                        {
                            case "&ndash;":
                                scriptBody+="--"; break;
                        };
                        break;
                    // just re-write it back out
                    case "element":
                        switch (kk.tag)
                        {
                            case "a":
                                scriptBody+=kk.children[0].text;
                        }
                };
            }
        }
        else {
            scriptBody = "";
        }

        return scriptBody;

    };

    function getCanvas(src,tag)
    {
        var height = src.getAttribute("height");
        var width = src.getAttribute("width");

        var divNode = src.document.createElement("div");
        var style = "";
        if (height) style +=" height:"+height;
        if (width) style +=" width:"+width;
        if (style) divNode.setAttribute("style", style);
        divNode.setAttribute("id", tag+"_" + uniqueID);

        uniqueID++;
        return divNode;
    };

    function getOptions(src, tag, options)
    {
        try {
            // try to set options from fields on tiddler first
            // [tag-xxx]
            var tt = src.getVariable('currentTiddler');
            if (tt) {
                var t = src.wiki.getTiddler(tt);
                if (t)
                {
                    for (var f in t.fields) {
                        var fi = f.indexOf(tag);
                        if (fi != 0) continue;
                        var k = f.substring(tag.length+1);
                        var v = t.fields[f];
                        // try as JSON
                        try {
                            options[k] = JSON.parse(v);
                        }
                            // last attempt is just a string
                        catch (ex) {
                            options[k] = v;
                        }
                    }
                }
            }
            // treat any attributes as JSON representations of options
            // for the object
            for (var att in src.attributes) {
                // we already used these in the div definition
                if (att == "height" || att == "width") continue;

                var attval = src.getAttribute(att);
                // allow for data from named tiddlers
                if ($tw.wiki.tiddlerExists(attval))
                {
                    var data = $tw.wiki.getTiddlerData(attval);
                    options[att] = data;
                }
                else {
                    // try as JSON
                    try { options[att] = JSON.parse(attval); }
                    // last attempt is just a string
                    catch (ex) { options[att] = attval; }
                }
            }
        }
        catch (ex) { console.error(ex); }

        return options;

    };

    /*
     Render this widget into the DOM
     */
    FlowchartWidget.prototype.render = function(parent,nextSibling) {
        this.parentDomNode = parent;
        this.computeAttributes();
        this.execute();

        var tag = 'flowchart';
        var scriptBody = getScriptBody(this,tag);
        var divNode = getCanvas(this,tag);
        parent.insertBefore(divNode, nextSibling);
        try {
            var options = {};
            getOptions(this, tag, options);
            
            var symbolFactory = function (id) {
                switch(id)
                {
                    case "foo":
                        var Foo = function(Symbol, chart, options) {
                            var symbol = chart.paper.rect(0, 0, 0, 0, 20);
                            options = options || {}, options.text = options.text || "Foo", Symbol.call(this, chart, options, symbol);
                        }
                        return Foo;
                }
            }
            var diagram = flowchart.parse(scriptBody, symbolFactory);
            diagram.drawSVG(divNode.id, options);
        }
        catch(ex)
        {
            divNode.innerText = ex;
        }

        this.domNodes.push(divNode);
    };

    FlowchartWidget.prototype.execute = function() {
        // Nothing to do
    };

    /*
     Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
     */
    FlowchartWidget.prototype.refresh = function(changedTiddlers) {
        return false;
    };

    exports.flowchart = FlowchartWidget;

    var SequenceDiagramWidget = function(parseTreeNode, options) {
        this.initialise(parseTreeNode, options);
    };

    SequenceDiagramWidget.prototype = new Widget();
    
    /*
     Render this widget into the DOM
     */
    SequenceDiagramWidget.prototype.render = function(parent,nextSibling) {
        this.parentDomNode = parent;
        this.computeAttributes();
        this.execute();
        
        var tag = 'seqdiag';
        var scriptBody = getScriptBody(this,tag);
        var divNode = getCanvas(this,tag);
        parent.insertBefore(divNode, nextSibling);
        try {
            var options = {'theme' : 'simple'};
            getOptions(this, tag, options);
            var diagram = Diagram.parse(scriptBody);
            diagram.drawSVG(divNode.id, options); 
        }
        catch(ex)
        {
            divNode.innerText = ex;
        }
        
        this.domNodes.push(divNode);
    };

    SequenceDiagramWidget.prototype.execute = function() {
        // Nothing to do
    };
    
    /*
     Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
     */
    SequenceDiagramWidget.prototype.refresh = function(changedTiddlers) {
        return false;
    };

    exports.seqdiag = SequenceDiagramWidget;

    var MermaidWidget = function(parseTreeNode, options) {
        this.initialise(parseTreeNode, options);
    };

    MermaidWidget.prototype = new Widget();

    /*
     Render this widget into the DOM
     */
    MermaidWidget.prototype.render = function(parent,nextSibling) {
        this.parentDomNode = parent;
        this.computeAttributes();
        this.execute();

        var tag = 'mermaid';
        var scriptBody = getScriptBody(this,tag);
        var divNode = getCanvas(this,tag);
        var _insertSVG = function(svgCode, bindFunctions) {
            divNode.innerHTML = svgCode;
        }
        try {
            var options = {'theme' : 'simple'};
            getOptions(this, tag, options);
            mermaidAPI.render(divNode.id, scriptBody, _insertSVG);
        }
        catch(ex)
        {
            divNode.innerText = ex;
        }
        parent.insertBefore(divNode, nextSibling);

        this.domNodes.push(divNode);
    };

    MermaidWidget.prototype.execute = function() {
        // Nothing to do
    };

    /*
     Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
     */
    MermaidWidget.prototype.refresh = function(changedTiddlers) {
        return false;
    };

    exports.mermaid = MermaidWidget;

})();
