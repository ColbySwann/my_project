package com.socktical.backend.web;

import java.io.IOException;

import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Lets the bundled React Router SPA (see bootJar in build.gradle, which
 * copies the frontend's dist/ into this jar's static/ folder) handle a hard
 * refresh or direct link on a client-side route like /account or
 * /products/aloha-runner. Spring's static resource handler only knows about
 * real files (index.html, assets/*), so any other GET 404s here first; this
 * forwards those — and only those, /api/** stays a real 404/401 — to
 * index.html so React Router can take over.
 */
@Controller
public class SpaFallbackController implements ErrorController {

  @RequestMapping("/error")
  public void handleError(HttpServletRequest request, HttpServletResponse response)
      throws IOException, ServletException {
    String requestUri = String.valueOf(request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI));

    // The "/index.html".equals guard matters if the frontend was never built
    // (bootJar didn't run) — without it, a missing index.html would forward
    // to itself, 404, re-enter this handler, and forward again, forever.
    if (!requestUri.startsWith("/api") && !"/index.html".equals(requestUri)) {
      // A forward doesn't reset the response status on its own — without
      // this, the browser would get a 200 body on a 404 status line, which
      // is functionally fine for the SPA (React Router still renders it)
      // but wrong HTTP semantics and confusing for monitoring/crawlers.
      response.setStatus(HttpServletResponse.SC_OK);
      request.getRequestDispatcher("/index.html").forward(request, response);
      return;
    }

    response.sendError(HttpServletResponse.SC_NOT_FOUND);
  }
}
