package de.axxepta.argon.webapp;

import ro.sync.exml.plugin.lock.LockHandler;
import ro.sync.exml.plugin.urlstreamhandler.LockHandlerFactoryPluginExtension;
import ro.sync.exml.workspace.api.Platform;
import ro.sync.exml.workspace.api.PluginWorkspaceProvider;

public class ArgonLockHandlerFactory implements LockHandlerFactoryPluginExtension {

    public LockHandler getLockHandler() {
        return new ArgonLockHandler();
    }

    public boolean isLockingSupported(String protocol) {
        boolean isWebapp = Platform.WEBAPP.equals(PluginWorkspaceProvider.getPluginWorkspace().getPlatform());
        return isWebapp && protocol.startsWith(ArgonURLConnection.ARGON_PROTOCOL);
    }
}
