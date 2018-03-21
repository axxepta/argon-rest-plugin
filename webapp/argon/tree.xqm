module namespace _= "argon/tree";



declare
  %rest:GET
  %rest:path("/argon.html")
  %rest:query-param("url", "{$OXY-URL}", '')
  %output:method("xhtml")
  %output:html-version("5.0")
function _:argon($OXY-URL as xs:string) as item() {
<html>
    <head>
        <script src="http://localhost:8080/oxygen-xml-web-author/app/v19.1.0-bower_components/jquery/jquery.min.js"></script>
        <link href="/static/js/fancytree/skin-win8/ui.fancytree.min.css" rel="stylesheet"/>
        <link href="/static/AdminLTE.min.css" rel="stylesheet"/>
        <script src="/static/js/fancytree/jquery.fancytree-all-deps.min.js"></script>
        <script src="/static/js/tree.js"></script>
    </head>
    <body>
        <iframe src="http://localhost:8282/oxygen-xml-web-author/app/oxygen.html{if (empty($OXY-URL)) then '' else concat('?url=', $OXY-URL)}"
            width="85%" onload="this.height=window.innerHeight;" align="right" id="oxygenFrame" name="oxygen" title="oXygen Web Author"></iframe>
        <div>
            <div>
                <h2 style="display: inline-block">Argon Connector</h2>
            </div>
            <div>
                <div id="argon-tree" style="overflow: scroll"></div>
            </div>
        </div>
    </body>
</html>
};