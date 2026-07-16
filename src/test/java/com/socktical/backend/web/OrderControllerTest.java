package com.socktical.backend.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.socktical.backend.config.SecurityConfig;
import com.socktical.backend.shopify.ShopifyCustomerAccountClient;
import com.socktical.backend.web.dto.Money;
import com.socktical.backend.web.dto.OrderLineItem;
import com.socktical.backend.web.dto.OrderSummary;

@WebMvcTest(OrderController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class OrderControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private ShopifyCustomerAccountClient shopifyCustomerAccountClient;
  @MockitoBean private OAuth2AuthorizedClientManager authorizedClientManager;

  @Test
  void returnsOrdersForTheAuthenticatedCustomer() throws Exception {
    OrderSummary order =
        new OrderSummary(
            "gid://shopify/Order/1",
            "#1001",
            "2026-06-01T12:00:00Z",
            new Money("34.00", "USD"),
            List.of(
                new OrderLineItem(
                    "Aloha Runner",
                    1,
                    "gid://shopify/ProductVariant/1",
                    "https://cdn/aloha.jpg",
                    new Money("34.00", "USD"))));

    ClientRegistration clientRegistration =
        ClientRegistration.withRegistrationId("shopify")
            .clientId("test-client-id")
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
            .authorizationUri("https://shopify.com/authorize")
            .tokenUri("https://shopify.com/token")
            .build();

    OAuth2AuthorizedClient authorizedClient =
        new OAuth2AuthorizedClient(
            clientRegistration,
            "jane@example.com",
            new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                "test-access-token",
                Instant.now(),
                Instant.now().plusSeconds(3600)));

    when(authorizedClientManager.authorize(any())).thenReturn(authorizedClient);
    when(shopifyCustomerAccountClient.getOrders("test-access-token", 20)).thenReturn(List.of(order));

    mockMvc
        .perform(get("/api/orders").with(oidcLogin().clientRegistration(clientRegistration)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value("gid://shopify/Order/1"))
        .andExpect(jsonPath("$[0].lineItems[0].variantId").value("gid://shopify/ProductVariant/1"));
  }

  @Test
  void requiresAuthentication() throws Exception {
    mockMvc.perform(get("/api/orders")).andExpect(status().isUnauthorized());
  }
}
