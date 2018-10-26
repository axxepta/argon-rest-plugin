package de.axxepta.argon.webapp;

import ro.sync.ecss.extensions.api.webapp.access.WebappPluginWorkspace;
import ro.sync.ecss.extensions.api.webapp.plugin.PluginConfigExtension;
import ro.sync.exml.workspace.api.PluginResourceBundle;
import ro.sync.exml.workspace.api.PluginWorkspaceProvider;

import javax.servlet.ServletException;
import java.util.HashMap;
import java.util.Map;

/**
 * modified from com.oxygenxml.rest.plugin.RestConfigExtension by MarkusWb
 */
public class ArgonConfigExtension extends PluginConfigExtension {

  /**
   * The Argon server URL option.
   */
  final static String ARGON_SERVER_URL = "argon.server_url";
  
  /**
   * The RexExp string that determines the root url.
   */
  final static String ARGON_ROOT_REGEXP = "argon.root_regexp";


  private static final String USE_INVISIBLE_LOGIN_FORM = "argon.use_invisible_login_form";


  @Override
  public void init() throws ServletException {
    super.init();
    Map<String, String> defaultOptions = new HashMap<String, String>();
    defaultOptions.put(USE_INVISIBLE_LOGIN_FORM, "off");
    defaultOptions.put(ARGON_ROOT_REGEXP, "");
    defaultOptions.put(ARGON_SERVER_URL, "");
    this.setDefaultOptions(defaultOptions);
  }

  /**
   * @see ro.sync.ecss.extensions.api.webapp.plugin.PluginConfigExtension#getOptionsForm()
   */
  @Override
  public String getOptionsForm() {
    String serverURL = getOption(ARGON_SERVER_URL, "");
    boolean useInvisibleLoginForm = "on".equals(getOption(USE_INVISIBLE_LOGIN_FORM, "off"));
    PluginResourceBundle rb = ((WebappPluginWorkspace)PluginWorkspaceProvider.getPluginWorkspace()).getResourceBundle();
    StringBuilder argonServerOptions = new StringBuilder()
      .append("<div style='font-family:robotolight, Arial, Helvetica, sans-serif;font-size:0.85em;font-weight: lighter'>")
      
      .append("<label style='display: block; margin-top: 50px;' >")
      .append("ARGON " + rb.getMessage(TranslationTags.SERVER_URL) + ": <input  name = '").append(ARGON_SERVER_URL).append("' value='").append(serverURL).append("' ")
      .append("style='width: 350px; line-height: 20px; border: 1px solid #777C7F; background-color: #f7f7f7; border-radius: 5px; padding-left: 7px;' ")
      .append("></input></label>")
      // The RegExp used to determine root url
      .append("<label style='display: block; margin-top: 20px;' title='" + rb.getMessage(TranslationTags.ROOT_REGEXP_DESCRIPTION) + "' >")
      .append(rb.getMessage(TranslationTags.ROOT_REGEXP) + ": <input  name = '")
      .append(ARGON_ROOT_REGEXP).append("' value='").append(getOption(ARGON_ROOT_REGEXP, "")).append("' ")
      .append("style='width: 350px; float:right; line-height: 20px; border: 1px solid #777C7F; background-color: #f7f7f7; border-radius: 5px; padding-left: 7px;' ")
      .append("></input></label>")
      // Use invisible login form
      .append("<label style='display:block;margin-top:20px;overflow:hidden'>")
      .append("<input name='" + USE_INVISIBLE_LOGIN_FORM + "' type='checkbox' value='on'")
      .append((useInvisibleLoginForm ? " checked" : "") + "> " + rb.getMessage(TranslationTags.INVISIBLE_LOGIN_LABEL))
      .append("</label>")

      .append("</div>");
    
    return argonServerOptions.toString();
  }

  @Override
  public String getPath() {
    return "argon-config";
  }

  @Override
  public String getOptionsJson() {
    String serverURL = getOption(ARGON_SERVER_URL, "");
    String rootRegExp = getOption(ARGON_ROOT_REGEXP, "");
    boolean useInvisibleLoginForm = "on".equals(getOption(USE_INVISIBLE_LOGIN_FORM, "off"));
    
    return "{ argonServerUrl: '" + serverURL + "'," +
        "argonUseInvisibleLoginForm: '" + useInvisibleLoginForm + "'," +
        "argonRootRegExp: '" + rootRegExp + "'}";
  }
}