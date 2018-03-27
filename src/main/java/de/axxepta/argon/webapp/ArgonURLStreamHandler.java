package de.axxepta.argon.webapp;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.Proxy;
import java.net.URL;
import java.net.URLConnection;
import java.util.Collections;
import java.util.Map;

import org.apache.log4j.Logger;
import ro.sync.ecss.extensions.api.webapp.access.WebappPluginWorkspace;
import ro.sync.ecss.extensions.api.webapp.plugin.URLStreamHandlerWithContext;
import ro.sync.ecss.extensions.api.webapp.plugin.UserContext;
import ro.sync.exml.workspace.api.PluginResourceBundle;
import ro.sync.exml.workspace.api.PluginWorkspaceProvider;
import ro.sync.exml.workspace.api.options.WSOptionsStorage;
import ro.sync.util.URLUtil;

/**
 * URL stream handler for a rest server.
 * 
 * @author mihai_coanda
 * modified from com.oxygenxml.rest.plugin.RestURLStreamHandler by MarkusWb
 */
public class ArgonURLStreamHandler extends URLStreamHandlerWithContext {

  private static final Logger logger = Logger.getLogger(ArgonURLStreamHandler.class.getName());

  @Override
  protected String getContextId(UserContext context) {
    String contextId = super.getContextId(context);

    StringBuilder cookies = new StringBuilder();
    for (Map.Entry<String, String> cookie: context.getCookies().entrySet()) {
      cookies.append(cookie.getKey()).append('=').append(cookie.getValue()).append("; ");
      logger.warn("COOKIES :" + cookie.getKey()+ "=" + cookie.getValue());
    }
    Map<String, String> headersMap = Collections.singletonMap("Cookie", cookies.toString()); 
    ArgonURLConnection.credentialsMap.put(contextId, headersMap);
    return contextId;
  }

  @Override
  protected URLConnection openConnectionInContext(String contextId, URL url, Proxy proxy) throws IOException {

    URLConnection urlConnection = computeRestUrl(url).openConnection();
    return new ArgonURLConnection(contextId, urlConnection);
  }
  
  /**
   * Computes the new URL to the REST server from the current connection.
   *  
   * @param url the current URL.
   * 
   * @return the URL to the REST server that represents the current URL.
   * 
   * @throws MalformedURLException whether something fails.
   */
  private static URL computeRestUrl(URL url) throws MalformedURLException {
    // remove the "rest-" protocol prefix.
    String encodedDocumentURL = URLUtil.encodeURIComponent(url.toExternalForm().substring(ArgonURLConnection.ARGON_PROTOCOL.length() + 3));
    //String encodedDocumentURL = URLUtil.encodeURIComponent(url.toExternalForm());
    String serverUrl = getServerUrl();
    if(serverUrl != null && !serverUrl.isEmpty()) {
      String restUrl = serverUrl + "files?url=" + encodedDocumentURL;
      return new URL(restUrl);
    }
    PluginResourceBundle rb = ((WebappPluginWorkspace)PluginWorkspaceProvider.getPluginWorkspace()).getResourceBundle();
    throw new MalformedURLException(rb.getMessage(TranslationTags.UNCONFIGURED_REST_SERVER_URL));
  }
  
  /**
   * Getter for the server's base rest url.
   * 
   * @return the server URL.
   */
  public static String getServerUrl() {
    WSOptionsStorage optionsStorage = PluginWorkspaceProvider.getPluginWorkspace().getOptionsStorage();
    String serverUrl = optionsStorage.getOption(ArgonConfigExtension.ARGON_SERVER_URL, "");
    // if the server URL does not end in '/' we add the '/'
    if(serverUrl != null && !serverUrl.isEmpty() && serverUrl.lastIndexOf("/") != serverUrl.length() - 1) {
      serverUrl = serverUrl + "/";
    }
    
    return serverUrl;
  }
}
