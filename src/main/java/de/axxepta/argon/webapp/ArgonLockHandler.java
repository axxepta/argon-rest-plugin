package de.axxepta.argon.webapp;

import org.apache.log4j.Logger;
import ro.sync.ecss.extensions.api.webapp.plugin.LockHandlerWithContext;
import ro.sync.exml.plugin.lock.LockException;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.util.Scanner;

public class ArgonLockHandler extends LockHandlerWithContext {


    private static final Logger logger = Logger.getLogger(ArgonURLConnection.class.getName());

    @Override
    public boolean isSaveAllowed(String sessionId, URL url, int i) {
        url = ArgonURLStreamHandler.getLockUrl(url, "locks", true);
        return !locked(sessionId, url);
    }

    static boolean resourceLocked(String sessionId, URL url) {
        url = ArgonURLStreamHandler.getLockUrl(url, "locks", false);
        return locked(sessionId, url);
    }

    private static boolean locked(String sessionId, URL url) {
        try {
            URLConnection connection = url.openConnection();
            ArgonURLConnection.addHeaders(connection, sessionId);
            connection.connect();
            byte[] jsonBytes;
            jsonBytes = ArgonURLConnection.readConnectionBytes(connection);
            String locked = new String(jsonBytes);
            return locked.contains("true");
        } catch (IOException ie) {
            logger.error("ARGON LOCKHANDLER.LOCKED: " + ie.getMessage());
            logger.error("ARGON LOCKHANDLER.LOCKED: " + url.toExternalForm());
        }
        return false;
    }

    @Override
    public void unlock(String sessionId, URL url) throws LockException {
        url = ArgonURLStreamHandler.getLockUrl(url, "unlock", true);
        emptyGET(url, sessionId);
    }

    @Override
    public void updateLock(String sessionId, URL url, int i) throws LockException {
        url = ArgonURLStreamHandler.getLockUrl(url, "lock", true);
        URL locksUrl;
        try {
            locksUrl = new URL(url.toExternalForm().replace("/lock", "/locks"));
            if (!locked(sessionId, locksUrl)) {
                emptyGET(url, sessionId);
            }
        } catch (MalformedURLException me) {
            logger.error("MALFORMED LOCK URL: " + me.getMessage());
        }
    }

    private static void emptyGET(URL url, String sessionId) {
        try {
            URLConnection connection = url.openConnection();
            ArgonURLConnection.addHeaders(connection, sessionId);
            connection.setDoOutput(true);
            connection.connect();
            String result;
            try (InputStream inputStream = connection.getInputStream()) {
                Scanner s = new Scanner(inputStream).useDelimiter("\\A");
                result = s.hasNext() ? s.next() : "";
            }
            logger.info("ARGON " + result);
        } catch (IOException ie) {
            logger.error("ARGON LOCK/UNLOCK: " + ie.getMessage());
        }
    }

    @Override
    public boolean isLockEnabled() {
        return true;
    }
}
