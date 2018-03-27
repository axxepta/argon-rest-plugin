$(function(){  // on page load
   $.ajax("/check-login",
   {
     //type: "HEAD",
     statusCode: {
     403: function() {
        //console.log("401");
        window.location = "/login?path=argon.html";
     }
   }}).done(function(msg){console.log("OK");});
  
  $("#argon-tree").fancytree({
    source: [ {title: "BaseX Server", key: "databases", folder: true, lazy: true} ],
    lazyLoad: function(event, data) {
        var node = data.node;
        data.result = {
            url: "/folders",
            data: {url: node.key + '/', tree: true}
        };
    },
    activate: function(event, data){
        var node = data.node;
        if (!node.folder) {
            var fileLink = encodeURIComponent("argon://" + node.key);
            document.getElementById("oxygenFrame").src="http://" + location.hostname + ":8282/oxygen-xml-web-author/app/oxygen.html?url=" + fileLink;
        }
    },
    extensions: ["dnd5"],
    dnd5: {
        autoExpandMS: 1500,      // Expand nodes after n milliseconds of hovering.
        dropMarkerOffsetX: -24,  // absolute position offset for .fancytree-drop-marker
                         // relatively to ..fancytree-title (icon/img near a node accepting drop)
        dropMarkerInsertOffsetX: -16, // additional offset for drop-marker with hitMode = "before"/"after"
        preventForeignNodes: true,   // Prevent dropping nodes from different Fancytrees
        // Events (drag support)
        dragStart: null,       // Callback(sourceNode, data), return true, to enable dnd drag
        dragDrag: null,      // Callback(sourceNode, data)
        dragEnd: null,       // Callback(sourceNode, data)
        // Events (drop support)
        dragEnter: function(node, data) {
            data.dataTransfer.dropEffect = "copy";
            return true;
        },
        dragOver: function(node, data) { return true; },
        dragExpand: function(node, data) { return true; },
        dragDrop: function(node, data) {
            node.setExpanded(true).always(function(){
                var transfer = data.dataTransfer;
                var files = data.dataTransfer.files, nFiles = files.length;
                for (i = 0; i < nFiles; i++) {
                    console.log(files[i].name);
                }
            });
        },
        dragLeave: function(node, data) { return true; }      // Callback(targetNode, data)
    }
  });
});