package com.socktical.backend.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.security.oauth2.client.JdbcOAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientProviderBuilder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.AuthenticatedPrincipalOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;

/**
 * Persists OAuth2 tokens (access + refresh) in Postgres via
 * JdbcOAuth2AuthorizedClientService, instead of Spring Security's default
 * in-memory/HttpSession-only storage, so a customer's login survives backend
 * restarts and the access token can be silently refreshed on later requests.
 *
 * Only active when Shopify's client registration is configured (see
 * application.yml — omitted under the "test" profile), matching the
 * conditional oauth2Login wiring in SecurityConfig.
 */
@Configuration
@ConditionalOnBean(ClientRegistrationRepository.class)
public class OAuth2ClientPersistenceConfig {

  @Bean
  public OAuth2AuthorizedClientService authorizedClientService(
      JdbcOperations jdbcOperations, ClientRegistrationRepository clientRegistrationRepository) {
    return new JdbcOAuth2AuthorizedClientService(jdbcOperations, clientRegistrationRepository);
  }

  @Bean
  public OAuth2AuthorizedClientRepository authorizedClientRepository(
      OAuth2AuthorizedClientService authorizedClientService) {
    return new AuthenticatedPrincipalOAuth2AuthorizedClientRepository(authorizedClientService);
  }

  @Bean
  public OAuth2AuthorizedClientManager authorizedClientManager(
      ClientRegistrationRepository clientRegistrationRepository,
      OAuth2AuthorizedClientRepository authorizedClientRepository) {
    DefaultOAuth2AuthorizedClientManager manager =
        new DefaultOAuth2AuthorizedClientManager(
            clientRegistrationRepository, authorizedClientRepository);

    manager.setAuthorizedClientProvider(
        OAuth2AuthorizedClientProviderBuilder.builder()
            .authorizationCode()
            .refreshToken()
            .build());

    return manager;
  }
}
