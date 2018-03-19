package de.axxepta.argon.webapp;

import java.net.URLStreamHandler;

import ro.sync.exml.plugin.urlstreamhandler.URLStreamHandlerPluginExtension;
import ro.sync.exml.workspace.api.Platform;
import ro.sync.exml.workspace.api.PluginWorkspaceProvider;

/**
 * URL Stream Handler plugin extension.
 * 
 * @author mihai_coanda
 */
public class ArgonURLHandlerPluginExtension implements URLStreamHandlerPluginExtension {

  /**
   * @see ro.sync.exml.plugin.urlstreamhandler.URLStreamHandlerPluginExtension#getURLStreamHandler(java.lang.String)
   */
  public URLStreamHandler getURLStreamHandler(String protocol) {
    boolean isWebapp = Platform.WEBAPP.equals(PluginWorkspaceProvider.getPluginWorkspace().getPlatform());
    if (isWebapp && ArgonURLConnection.ARGON_PROTOCOL.equals(protocol)) {
      return new ArgonURLStreamHandler();
    }
    return null;
  }

}