(function() {

  var regExpOption = sync.options.PluginsOptions.getClientOption('argonRootRegExp');
  var ROOT_REGEXP = regExpOption ? new RegExp(regExpOption) : null;

  //workspace.getViewManager().addView('argon-view');

  goog.events.listen(workspace, sync.api.Workspace.EventType.BEFORE_EDITOR_LOADED, function(e) {
    var url = e.options.url;
    // If the URL has 'argon' protocol we use the argon protocol handler.
    if (url.match('argon:\/\/')) {
      // set the workspace UrlChooser
      workspace.setUrlChooser(fileBrowser);

      // Listen for messages sent from the server-side code.
      goog.events.listen(e.editor, sync.api.Editor.EventTypes.CUSTOM_MESSAGE_RECEIVED, function(e) {
        var context = e.context;
        var url = e.message.message;
        // pop-up an authentication window,
        fileBrowser.loginUser(function() {
          // After the user was logged in, retry the operation that failed.
          if (context == sync.api.Editor.WebappMessageReceived.Context.LOAD) {
            // If the document was loading, we try to reload the whole webapp.
            window.location.reload();
          } else if (context == sync.api.Editor.WebappMessageReceived.Context.EDITING) {
            // During editing, only references can trigger re-authentication. Refresh them.
            editor.getActionsManager().invokeAction('Author/Refresh_references');
          } else if (context == sync.api.Editor.WebappMessageReceived.Context.SAVE) {
            // Currently there is no API to re-try saving, but it will be.
            editor.getActionsManager().getActionById('Author/Save').actionPerformed(function() {
            });
          } else if (context == sync.api.Editor.WebappMessageReceived.Context.IMAGE) {
            // The browser failed to retrieve an image - reload it.
            var images = document.querySelectorAll('img[data-src]');
            for (var i = 0; i < images.length; i ++) {
              images[i].src = goog.dom.dataset.get(images[i], 'src');
            }
          }
        });
      });
    }
	
	var ArgonTreeAction = function(editor) {
	  this.editor = editor;
	};

	ArgonTreeAction.prototype = new sync.actions.AbstractAction('');

	ArgonTreeAction.prototype.getDisplayName = function() {
	  return 'Argon Connector';
	};

	ArgonTreeAction.prototype.actionPerformed = function(callback) {
		var editorURL = new URL(location.href).searchParams.get('url');
		window.open('http://' + location.hostname +':8984/argon.html?url=' + encodeURIComponent(editorURL),'_top')
	};
	
    ArgonTreeAction.prototype.getLargeIcon = function () {
      return sync.util.computeHdpiIcon('../plugin-resources/argon-resources/AA24.png');
    };
	
	ArgonTreeAction.prototype.isEnabled = function() {
		try {
			return window.self == window.top;
		} catch (e) {
			return false;
		}
	}; 

	var editor = e.editor;
    // Register Argon Tree action.
	var wrapTree = new ArgonTreeAction(editor);
    editor.getActionsManager().registerAction('argonapp.wrap', wrapTree);
	var addActionOnce = 0;
    addToToolbar(editor, 'argonapp.wrap');
	
	function addToToolbar(editor, actionId) {
		goog.events.listen(editor, sync.api.Editor.EventTypes.ACTIONS_LOADED, function(e) {
		var actionsConfig = e.actionsConfiguration;

		var theToolbar = null;
		if (actionsConfig.toolbars) {
		  for (var i = 0; i < actionsConfig.toolbars.length; i++) {
			var toolbar = actionsConfig.toolbars[i];
			if (toolbar.name == "Builtin") {
			  theToolbar = toolbar;
			}
		  }
		}
		if (theToolbar && addActionOnce === 0) {
			addActionOnce++;
			theToolbar.children.push({
				id: actionId,
				type: "action"
			});
			setTimeout(function () {
            document.querySelector("[name='argonapp.wrap']")
              .setAttribute("title", 'Argon-Baum anzeigen');
          }, 0);
		}
		});
	}
  
  
    var translations = {
      SERVER_URL_: {
        "en_US":"Server URL",
        "de_DE":"Server-URL",
        "fr_FR":"URL du serveur",
        "ja_JP":"サーバー URL",
        "nl_NL":"Server URL"
      },
      INVALID_URL_:{
        "en_US":"Invalid URL",
        "de_DE":"Ungültige URL",
        "fr_FR":"URL invalide",
        "ja_JP":"不正なURL",
        "nl_NL":"Ongeldige URL"
      }
    };
    sync.Translation.addTranslations(translations);
  });
  
  
  /**
   * Argon url chooser.
   *
   * @constructor
   */
  var ArgonFileBrowser = function() {
    var latestUrl = this.getLatestUrl();
    var latestRootUrl = this.getLatestRootUrl();

    sync.api.FileBrowsingDialog.call(this, {
      initialUrl: 'argon://Databases/',	//latestUrl,
      root: latestRootUrl
    });
	
	// Listen for messages from the login-finished iframe
    window.addEventListener('message', function(msg) {
        if(msg.data == 'login-finished') {			
          this.loginDialog && this.loginDialog.hide();

          var iframe = document.getElementById('argon-login-iframe');
          iframe.parentNode.removeChild(iframe);

          this.latestCallback && this.latestCallback();
        }
      }.bind(this));
  };
  goog.inherits(ArgonFileBrowser, sync.api.FileBrowsingDialog);

  /** @override */
  ArgonFileBrowser.prototype.renderRepoPreview = function(element) {
    var url = this.getCurrentFolderUrl();
    if (url) {
      element.style.paddingLeft = '5px';
      element.title = tr(msgs.SERVER_URL_);
      var content = '<div class="rest-repo-preview">' +
        '<div class="domain-icon" style="' +
        'background-image: url(' + sync.util.getImageUrl('/images/SharePointWeb16.png', sync.util.getHdpiFactor()) +
        ');vertical-align: middle"></div>' +
        new sync.util.Url(url).getDomain();
      // add an edit button only of there are no enforced servers
      // or there are more than one enforced server.
      content += '</div>'
      element.innerHTML = content;
    }
    this.dialog.setPreferredSize(null, 700);
  };

  /** @override */
  ArgonFileBrowser.prototype.renderRepoEditing = function(element) {
    var url = this.getCurrentFolderUrl();
    var latestUrl = this.getLatestUrl();
    // if none was set we let it empty.
    var editUrl = latestUrl || url || '';

    element.title = "";

    element.style.paddingLeft = '5px';
    // the webdavServerPlugin additional content.
    element.innerHTML = '';

    var inputElement = goog.dom.createDom(
      'input',
      {
        'id': 'argon-browse-url',
        'type': 'text',
        'autocapitalize': 'none'
      }
    );
    // google closure does not add everything as it should
    inputElement.setAttribute('autocorrect', 'off');
    inputElement.setAttribute('autofocus', '');

    goog.dom.appendChild(
      element,
      goog.dom.createDom(
        'div', 'argon-config-dialog',
        goog.dom.createDom(
          'label', '',
          tr(msgs.SERVER_URL_) + ': ',
          inputElement
        )
      )
    );
    inputElement.value = editUrl;

    var prefferedHeight = 190;
    this.dialog.setPreferredSize(null, prefferedHeight);
  };

  /** @override */
  ArgonFileBrowser.prototype.handleOpenRepo = function(element, e) {
    var input = document.getElementById('argon-browse-url');
    var url = input.value.trim();

    // if an url was provided we instantiate the file browsing dialog.
    if(url) {
      if(url.match('argon:\/\/')) {
        this.requestUrlInfo_(url);
      } else {
        this.showErrorMessage(tr(msgs.INVALID_URL_));
        // hide the error element on input refocus.
        goog.events.listenOnce(input, goog.events.EventType.FOCUS,
          goog.bind(function(e) {this.hideErrorElement();}, this));
      }
    }
    e.preventDefault();
  };

  /**
   * Request the URL info from the server.
   *
   * @param {string} url The URL about which we ask for information.
   * @param {function} opt_callback callback method to replace the openUrlInfo method.
   *
   * @private
   */
  ArgonFileBrowser.prototype.requestUrlInfo_ = function (url, opt_callback) {
    var callback = opt_callback || this.openUrlInfo;
    var type = url.endsWith('/') ? 'FOLDER' : 'FILE';
    var matches = ROOT_REGEXP && ROOT_REGEXP.exec(url);
    var rootUrl = matches ? matches[0] : null;

    callback.bind(this)(
      url,
      {
      rootUrl: rootUrl,
      type: type
    });
  };

  /**
   * Opens the url and sets it's url info.
   *
   * @param url the url to open.
   * @param info the available url information.
   *
   */
  ArgonFileBrowser.prototype.openUrlInfo = function(url, info) {
    var isFile = info.type === 'FILE';
    // Make sure folder urls end with '/'.
    if (!isFile && url.lastIndexOf('/') !== url.length - 1) {
      url = url + '/';
    }
    this.setUrlInfo(url, info);
    this.openUrl(url, isFile, null);
  };

  /**
   * Sets the information received about the url.
   *
   * @param url the url whose info to set.
   * @param info the available url information.
   *
   */
  ArgonFileBrowser.prototype.setUrlInfo = function(url, info) {
    if(info.rootUrl) {
      var rootUrl = info.rootUrl;
      this.setRootUrl(rootUrl);
    }
    var urlObj = new sync.util.Url(url);
    this.setInitialUrl_(url);
  };

  /**
   *
   * @return {string} the latest root url.
   */
  ArgonFileBrowser.prototype.getLatestRootUrl = function() {
    var newRoot = null;
    var urlParam = decodeURIComponent(sync.util.getURLParameter('url'));
    if(urlParam && urlParam.match('argon:\/\/')) {
      var matches = ROOT_REGEXP && ROOT_REGEXP.exec(decodeURIComponent(urlParam));
      newRoot = matches ? matches[0] : null;
    }
    return newRoot;
  };

  /**
   * Getter of the last usedUrl.
   *
   * @return {String} the last set url.
   */
  ArgonFileBrowser.prototype.getLatestUrl = function() {
    var urlParam = sync.util.getURLParameter('url');
    if(urlParam) {
      return decodeURIComponent(urlParam);
    }
  };

  /**
   * The user needs to authenticate.
   *
   * @param {function} callback the callback method that should be called after login.
   */
  ArgonFileBrowser.prototype.loginUser = function(callback) {
    if(!this.loginDialog) {
      this.loginDialog = this.createLoginDialog();
    }

    this.latestCallback = callback;
    this.loginDialog.getElement().innerHTML =
      '<iframe id="argon-login-iframe" style="width:100%; height:100%;border:none;" src="' +
      sync.options.PluginsOptions.getClientOption('argonServerUrl') + 'login"></iframe>'

    this.loginDialog.show();
    this.loginDialog.onSelect(function(e) {
      this.dialog.hide();
	  //callback();
    }.bind(this));
  };


  /**
   * Creates the Argon connector login dialog.
   *
   * @return {*}
   */
  ArgonFileBrowser.prototype.createLoginDialog = function() {
    // Listen for messages from the login iframe
    window.addEventListener('message',
      function(msg) {
        if(msg.data.action == 'login') {
          this.loginDialog.hide();
          this.loginDialog.getElement().innerHTML = '';

          this.latestCallback && this.latestCallback();
        }
      }.bind(this));

    var loginDialog = workspace.createDialog();
    loginDialog.setButtonConfiguration(sync.api.Dialog.ButtonConfiguration.CANCEL);
    var dialogElem = loginDialog.getElement();
    dialogElem.style.overflow = 'hidden';

    loginDialog.setPreferredSize(800, 600);
    loginDialog.setResizable(true);
    return loginDialog;
  };

  /**
   * Register all the needed listeners on the file browser.
   *
   * @param {sync.api.FileBrowsingDialog} fileBrowser
   *  the file browser on which to listen.
   */
  var registerFileBrowserListeners = function(fileBrowser) {
    // handle the user action required event.
    var eventTarget = fileBrowser.getEventTarget();
    goog.events.listen(eventTarget,
      sync.api.FileBrowsingDialog.EventTypes.USER_ACTION_REQUIRED,
      function() {
        this.loginUser(function() {
          this.refresh();
        });
      }.bind(fileBrowser));
  };
  /**
   * We do not register the file browser if the base BaseX Server URL is not set.
   */
  var argonServerURL = sync.options.PluginsOptions.getClientOption('argonServerUrl');
  if(!argonServerURL) {
    return;
  }

  var fileBrowser = new ArgonFileBrowser();
  // register all the listeners on the file browser.
  registerFileBrowserListeners(fileBrowser);
  
  var iconUrl = sync.util.computeHdpiIcon('../plugin-resources/argon-resources/AA.png');
  var webdavOpenAction = new sync.actions.OpenAction(fileBrowser);
  webdavOpenAction.setLargeIcon(iconUrl);
  webdavOpenAction.setDescription('Open document from BaseX server');
  webdavOpenAction.setActionId('argon-open-action');
  webdavOpenAction.setActionName('Argon');

  var webdavCreateAction = new sync.api.CreateDocumentAction(fileBrowser);
  webdavCreateAction.setLargeIcon(iconUrl);
  webdavCreateAction.setDescription('Create a new document on a BaseX server');
  webdavCreateAction.setActionId('argon-create-action');
  webdavCreateAction.setActionName('Argon');

  var actionsManager = workspace.getActionsManager();
  actionsManager.registerOpenAction(webdavOpenAction);
  actionsManager.registerCreateAction(webdavCreateAction);

  sync.util.loadCSSFile("../plugin-resources/argon-resources/rest.css");

  /**
   * Argon View Renderer
   */
/*  var ArgonViewRenderer = function() {
  };
  var ArgonViewRenderer.prototype = new sync.view.ViewRenderer();

  ArgonViewRenderer.prototype.getTitle = function() {
    return 'Argon Database Connection';
  };

  ArgonViewRenderer.prototype.install = function(element) {
      element.innerHTML = 'Welcome to my view';
  };
*/
  // workspace.getViewManager().installView('argon-view', new ArgonViewRenderer());
})();
