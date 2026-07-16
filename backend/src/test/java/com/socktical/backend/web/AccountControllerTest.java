package com.socktical.backend.web;

import static org.springframework.security.oauth2.core.oidc.StandardClaimNames.EMAIL;
import static org.springframework.security.oauth2.core.oidc.StandardClaimNames.FAMILY_NAME;
import static org.springframework.security.oauth2.core.oidc.StandardClaimNames.GIVEN_NAME;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.socktical.backend.config.SecurityConfig;

@WebMvcTest(AccountController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class AccountControllerTest {

  @Autowired private MockMvc mockMvc;

  @Test
  void returnsAuthenticatedCustomerProfile() throws Exception {
    mockMvc
        .perform(
            get("/api/me")
                .with(
                    oidcLogin()
                        .idToken(
                            token ->
                                token
                                    .subject("gid://shopify/Customer/1")
                                    .claim(EMAIL, "jane@example.com")
                                    .claim(GIVEN_NAME, "Jane")
                                    .claim(FAMILY_NAME, "Doe"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("gid://shopify/Customer/1"))
        .andExpect(jsonPath("$.email").value("jane@example.com"))
        .andExpect(jsonPath("$.firstName").value("Jane"))
        .andExpect(jsonPath("$.lastName").value("Doe"));
  }

  @Test
  void requiresAuthentication() throws Exception {
    mockMvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
  }
}
