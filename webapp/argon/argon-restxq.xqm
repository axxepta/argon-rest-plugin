module namespace _= "argon/argon";

import module namespace Session = 'http://basex.org/modules/session';
import module namespace config = "argon/config" at "config.xqm";

declare function _:path-strip($path as xs:string) as xs:string {
    if (contains($path, 'Databases'))
        then substring-after($path, 'Databases/')
        else if (contains($path, 'databases/'))
            then substring-after($path, 'databases/')
            else substring-after($path, 'DATABASES/')
};


declare
  %rest:GET
  %perm:allow("create")
  %rest:path("/files")
  %rest:query-param("url", "{$DBPATH}")
function _:get-file($DBPATH as xs:string) {
    let $PATH := _:path-strip($DBPATH)
    let $db := if(contains($PATH, '/')) then substring-before($PATH, '/') else $PATH
    let $path := substring-after($PATH, '/')
    let $metadb := concat('~meta_', $db)
    let $metapath := concat($path, '.xml')
    let $exists := db:exists($db, $path)
    
    let $doctypecomponents := if(db:exists($metadb, $metapath)) then (
        db:open($metadb, $metapath)//doctypecomponent/text()
    ) else ()
    
    return if($exists and db:is-xml($db, $path)) then (
        let $doctype := if(not(empty(($doctypecomponents)))) then (
    		<output:doctype-public value="{substring(subsequence($doctypecomponents,3,1),2,string-length(subsequence($doctypecomponents,3,1))-2)}"/>,
    		<output:doctype-system value="{substring(subsequence($doctypecomponents,4,1),2,string-length(subsequence($doctypecomponents,4,1))-2)}"/>
    	) else ()
        let $params := <output:serialization-parameters>
                        <output:omit-xml-declaration value="no"/>
                        <output:indent value="yes"/>
                        { $doctype }
                    </output:serialization-parameters>
        return serialize(db:open($db, $path), $params)
    ) else if($exists and db:is-raw($db, $path)) then (
        db:retrieve($db, $path)
    ) else (
        (: raise error if database or resource does not exist :)
        '{ "message": "Database resource does not exist: ' || $PATH || '" }'
    )
};


declare
  %rest:PUT("{$body}")
  %perm:allow("create")
  %rest:path("/files")
  %rest:query-param("url", "{$DBPATH}")
  %updating
function _:put-file($DBPATH as xs:string, $body) {
    _:save(_:path-strip($DBPATH), convert:binary-to-string($body))
};

declare
  %rest:POST("{$body}")
  %perm:allow("create")
  %rest:path("/files")
  %rest:query-param("url", "{$DBPATH}")
  %updating
function _:post-file($DBPATH as xs:string, $body) {
    _:save(_:path-strip($DBPATH), convert:binary-to-string($body))
};

declare
  %updating
function _:save($PATH as xs:string, $RESOURCE as xs:string) {

    (:~ Binary storage? :)
    let $BINARY := 'false'
    (:~ Original encoding for XML. :)
    let $ENCODING := "UTF-8"
    (:~ Owner of resource. :)
    let $OWNER := ""
    (:~ Put copy in history and increase revision? :)
    let $VERSIONIZE := false()
    (: increase version? :)
    let $VERSION-UP := false()
    
    let $metatemplate := 'MetaTemplate.xml'
    let $argon_db := '~argon'
    let $historyfile := 'historyfile'
    let $historyentry := 'historyentry'
    let $DOCTYPE := '!DOCTYPE'
    
    let $db := if(contains($PATH, '/')) then substring-before($PATH, '/') else $PATH
    let $path := substring-after($PATH, '/')
    let $metapath := concat($path, '.xml')
    
    let $histdb := concat('~history_', $db)
    let $metadb := concat('~meta_', $db)
    let $meta := if(db:exists($metadb, $metapath)) then (
        db:open($metadb, $metapath)/*
    ) else (
        db:open($argon_db, $metatemplate)
    )
    (: obtain and increase revision:)
    let $revision := if(not(empty($meta//revision/text()))) then (
        ($meta//revision/text()) + 1
    ) else (
        1
    )
    (: obtain and increase version:)
    let $version := if(not(empty($meta//version/text()))) then (
        ($meta//version/text()) + (if ($VERSION-UP) then (1) else (0))
    ) else (
        1
    )
    
    (: get doctype definition :)
    let $doctypetokens := if(contains($RESOURCE, $DOCTYPE)) then (
        <doctype>
        {
        let $tokenized := tokenize($RESOURCE, '[<>]')
        let $n_firstTokens := min((15, count($tokenized)))
    	let $firstelements := subsequence($tokenized, 1, $n_firstTokens)
    	let $doctypeseq := for $j in (1 to $n_firstTokens)
    		return if (contains(subsequence($firstelements, $j, 1), $DOCTYPE)) then (
    			subsequence(analyze-string(subsequence($firstelements, $j, 1), '( )|".*?"')//text()[if (compare(., ' ') = 0) then () else .], 2, 5)
    		) else ()
    	for $doctypecomponent in $doctypeseq return <doctypecomponent>{$doctypecomponent}</doctypecomponent>
    	}
    	</doctype>
    ) else ()
    
    (: build path for history file :)
    let $timestamp := format-dateTime(current-dateTime(), "[Y0001]-[M01]-[D01]_[H01]-[m01]")
    let $hist-ext := concat('_', $timestamp, '_', 'v', $version, 'r', $revision)
    
    let $pathtokens := tokenize($path, '/')
    let $filename := head(reverse($pathtokens))
    let $histpath := if(contains($filename, '.')) then (
        let $ntokens := count($pathtokens) - 1
        let $tokenlengths := for $i in (1 to $ntokens) return string-length(subsequence($pathtokens, $i, 1))
        let $pointPos := sum($tokenlengths) + $ntokens + string-length(head(tokenize($filename, '\.'))) + 1
        return concat(substring($path, 1, $pointPos - 1), $hist-ext, substring($path, $pointPos))
    ) else (
        concat($path, $hist-ext)
    )
    
    let $isXML := ($BINARY eq 'false')
    
    let $histuser := <historyuser>{user:current()}</historyuser>
    let $histfile := <historyfile>{$histpath}</historyfile>
    
    (: update metadata  :)
    let $metaupdated := (
        $meta
    ) update (
        if ($VERSIONIZE) then (
            replace value of node .//version with $version,
            replace value of node .//revision with $revision,
            insert node element { $historyentry } { $histfile, $histuser } into .//history
        ) else (),
        if(not(empty($doctypetokens))) then (
            replace node .//doctype with $doctypetokens
        ) else (),
        if (empty(.//creationdate/text())) then (
            replace value of node .//creationdate with $timestamp
        ) else (),
        if (empty(.//initialencoding/text()) and $isXML) then (
            replace value of node .//initialencoding with $ENCODING
        ) else (),
        if (empty(.//owner/text())) then (
            replace value of node .//owner with $OWNER
        ) else (),
        replace value of node .//lastchange with $timestamp
    )
    
    let $xml := if($isXML) then (
        try {
            parse-xml($RESOURCE)
        } catch * {
        (: raise error if input is not well-formed :)
            '{ "message": "Resource is not well-formed" }'
        }
    ) else ('')
    
    return if($isXML) then (
        db:replace($db, $path, $RESOURCE),
        db:replace($metadb, $metapath, $metaupdated),
        if($VERSIONIZE) then (db:replace($histdb, $histpath, $RESOURCE)) else ()
    ) else (
        db:store($db, $path, xs:base64Binary($RESOURCE)),
        db:replace($metadb, $metapath, $metaupdated),
        if($VERSIONIZE) then (db:store($histdb, $histpath, xs:base64Binary($RESOURCE))) else ()
    )
};

declare
  %rest:GET
  %perm:allow("create")
  %rest:path("/folders")
  %rest:query-param("url", "{$DBPATH}")
  %rest:query-param("tree", "{$TREE}")
  %output:method("json")
function _:list($DBPATH as xs:string, $TREE as xs:boolean?) {
    let $PATH := _:path-strip($DBPATH)
    return if(string-length($PATH) = 0) then (
        let $json := <json arrays="json" objects="_" booleans="folder lazy">{
            (: skip locking databases :)
            for $db in db:list()[not(starts-with(., '~'))]
            return if (empty($TREE) or not($TREE))
                then <_><name>{$db}</name><folder>true</folder></_>
                else <_><title>{$db}</title><folder>true</folder><lazy>true</lazy><key>{concat($DBPATH, $db)}</key></_>
        }</json>
        return $json
    ) else (
        (: name of database :)
        let $db := if(contains($PATH, '/')) then substring-before($PATH, '/') else $PATH
        (: path: ensure existence trailing slash :)
        let $path := replace(substring-after($PATH, '/'), '([^/])$', '$1/')
        (: retrieve all entries on this and lower levels :)
        let $resources := db:list-details($db, $path)
        let $json := <json arrays="json" objects="_" booleans="folder lazy">{
            (: retrieve entries of current level :)
            for $entry in distinct-values(
                    for $resource in $resources
                    let $without-root := substring($resource, string-length($path) + 1)
                    let $name := substring-before($without-root, '/')
                    return if($name) then (
                        $name
                    ) else (
                        $without-root
                    )
            )
            let $full-path := $path || $entry
            let $resource := $resources[. = $full-path]
            let $dir := empty($resource)
            (: show directories first, case-insensitive order :)
            order by $dir descending, lower-case($entry)
            return if (empty($TREE) or not($TREE)) then (
                <_><name>{$entry}</name><folder>{if($dir) then 'true' else 'false'}</folder></_>
            ) else (
                <_>
                    <title>{$entry}</title>
                    <folder>{if($dir) then 'true' else 'false'}</folder>
                    <lazy>{if($dir) then 'true' else 'false'}</lazy>
                    <key>{concat($DBPATH, $entry)}</key>
                </_>
            )
        }</json>
        return $json
    )
};

declare %perm:check('/files', '{$perm}') function _:check-files($perm) {
    _:check($perm)
};

declare %perm:check('/folders', '{$perm}') function _:check-folder($perm) {
    _:check($perm)
};

declare function _:error-response($NO) {
  <rest:response>
    <http:response status="{$NO}" message="User not logged in.">
      <http:header name="Content-Language" value="en"/>
      <http:header name="Content-Type" value="text/html; charset=utf-8"/>
    </http:response>
  </rest:response>
};

declare function _:check($perm) {
  let $user := Session:get('id')
  where empty($user) or not(user:list-details($user)/@permission = $perm?allow)
  return _:error-response('401')
};

declare %perm:check('/check-login', '{$perm}') function _:tree-check($perm) {
  let $user := Session:get('id')
  where empty($user) or not(user:list-details($user)/@permission = $perm?allow)
  return _:error-response('403')
};

declare
  %rest:path("/check-login")
  %perm:allow("create")
function _:check-login() {
  ()
};

declare
  %rest:path("/login-check")
  %rest:query-param("name", "{$name}")
  %rest:query-param("pass", "{$pass}")
  %rest:query-param("path", "{$path}", '')
  %output:method("json")
function _:login-check($name, $pass, $path) {
  try {
    user:check($name, $pass),
    Session:set('id', $name),
    if ($path != '')
        then web:redirect($path)
        else web:redirect("/static/closeLoginFrame.html")
  } catch user:* {
    web:redirect("/")
  }
};

declare
  %rest:path("/login")
  %rest:query-param("path", "{$path}", '')
  %output:method("html")
function _:login($path) {
  <html>
    Please log in:
    <form action="/login-check{if ($path != '') then ('?path=' || $path) else ()}" method="post">
      <input name="name"/>
      <input type="password" name="pass"/>
      <input type="submit"/>
    </form>
  </html>
};