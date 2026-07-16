package com.socktical.backend.web;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.socktical.backend.web.dto.CustomerProfile;

@RestController
public class AccountController {

  @GetMapping("/api/me")
  public CustomerProfile me(@AuthenticationPrincipal OidcUser oidcUser) {
    return new CustomerProfile(
        oidcUser.getSubject(), oidcUser.getEmail(), oidcUser.getGivenName(), oidcUser.getFamilyName());
  }
}
