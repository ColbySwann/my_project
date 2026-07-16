package com.socktical.backend.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.RequestDispatcher;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.socktical.backend.config.SecurityConfig;

@WebMvcTest(SpaFallbackController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class SpaFallbackControllerTest {

  @Autowired private MockMvc mockMvc;

  @Test
  void forwardsUnmatchedNonApiRoutesToIndexHtml() throws Exception {
    mockMvc
        .perform(get("/error").requestAttr(RequestDispatcher.ERROR_REQUEST_URI, "/account"))
        .andExpect(status().isOk())
        .andExpect(forwardedUrl("/index.html"));
  }

  @Test
  void returns404ForUnmatchedApiRoutes() throws Exception {
    mockMvc
        .perform(get("/error").requestAttr(RequestDispatcher.ERROR_REQUEST_URI, "/api/does-not-exist"))
        .andExpect(status().isNotFound());
  }

  @Test
  void doesNotForwardWhenIndexHtmlItselfIsMissing() throws Exception {
    // Guards against an infinite forward loop if the frontend was never
    // built (bootJar didn't run) — see the comment in the controller.
    mockMvc
        .perform(get("/error").requestAttr(RequestDispatcher.ERROR_REQUEST_URI, "/index.html"))
        .andExpect(status().isNotFound());
  }
}
