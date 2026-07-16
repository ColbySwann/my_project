package com.socktical.backend.config;

import java.util.List;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Only /api/** requires authentication — everything else is the bundled
 * storefront (see bootJar in build.gradle and SpaFallbackController), which
 * is public, same as a real storefront's product pages.
 *
 * This is written as a BFF (backend-for-frontend): session cookie auth +
 * CORS with credentials, rather than tokens handed to the browser. That
 * only matters for local dev, where the Vite dev server (port 5173) and
 * this backend (port 8080) are different origins — in the bundled
 * single-jar deployment they're the same origin, so CORS is moot there but
 * harmless to leave configured.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Value("${app.frontend-base-url}")
  private String frontendBaseUrl;

  @Bean
  public SecurityFilterChain securityFilterChain(
      HttpSecurity http, ObjectProvider<ClientRegistrationRepository> clientRegistrations)
      throws Exception {
    http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(PathPatternRequestMatcher.pathPattern("/api/**"))
                    .authenticated()
                    .anyRequest()
                    .permitAll())
        .exceptionHandling(
            ex ->
                ex.defaultAuthenticationEntryPointFor(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                    PathPatternRequestMatcher.pathPattern("/api/**")))
        .logout(logout -> logout.logoutSuccessUrl(frontendBaseUrl + "/"));

    // Only wire up oauth2Login when Shopify's client registration is actually configured
    // (see application.yml — it's omitted under the "test" profile). Without it, every
    // /api/** request still correctly 401s; there just isn't a login flow to reach.
    if (clientRegistrations.getIfAvailable() != null) {
      http.oauth2Login(
          oauth2 -> oauth2.defaultSuccessUrl(frontendBaseUrl + "/account", true));
    }

    return http.build();
  }

  private CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of(frontendBaseUrl));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}
