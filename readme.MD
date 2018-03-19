# Argon oXygen XML Web Author Plugin
BaseX database connector for oXygen XML Web Author

## Components
This plugin has to be deployed in two parts

- An oXygen plugin component with REST connector (Java output artifact of the **Gradle makePlugin** task)
- A BaseX RestXQ webapp component (folder **webapp**, to be deployed along with a BaseX instance)

### oXygen XML Web Author plugin
The oXygen plugin is based mainly on the 
[oXygen XML Web Author REST plugin](https://github.com/oxygenxml/web-author-rest-plugin).

The plugin should also implement locking capabilities, as used in 
[oXygen XML Web Author WebDAV plugin](https://github.com/oxygenxml/web-author-webdav-plugin).

The Web Author plugin accomplishes browsing and loading of files into the oXygen XML Web Author.

### BaseX Webapp
The BaseX webapp mainly consists of a collection of RestXQ endpoints which serve the oXygen plugin
component as REST API.

An additional tree contained in a special view component uses the oXygen JS API to interact
between a database tree and the editor component of the oXygen XML Web Author.

To make sure that the [fancytree](fancytree) can lazy load by Ajax request from BaseX with 
possibly different host/port (Cross-origin resource sharing),
the Jetty config of the BaseX component has to be adjusted and BaseX version >= 8.6
should be used. \[1\]


\[1\]
[Stackoverflow 42932689](https://stackoverflow.com/questions/42932689/basex-rest-api-set-custom-http-response-header)