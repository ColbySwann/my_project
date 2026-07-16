package com.socktical.backend.web;

import java.util.List;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.socktical.backend.shopify.ShopifyCustomerAccountClient;
import com.socktical.backend.web.dto.OrderSummary;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class OrderController {

  private final ShopifyCustomerAccountClient shopifyCustomerAccountClient;

  // ObjectProvider rather than a direct dependency: the OAuth2AuthorizedClientManager
  // bean only exists when Shopify's OAuth2 client is configured (see
  // OAuth2ClientPersistenceConfig), which this backend deliberately allows to be
  // absent (e.g. under the "test" profile) without failing the whole app to boot.
  private final ObjectProvider<OAuth2AuthorizedClientManager> authorizedClientManager;

  @GetMapping("/api/orders")
  public List<OrderSummary> orders(OAuth2AuthenticationToken authentication) {
    OAuth2AuthorizeRequest authorizeRequest =
        OAuth2AuthorizeRequest.withClientRegistrationId("shopify").principal(authentication).build();

    OAuth2AuthorizedClient authorizedClient =
        authorizedClientManager.getObject().authorize(authorizeRequest);

    return shopifyCustomerAccountClient.getOrders(authorizedClient.getAccessToken().getTokenValue(), 20);
  }
}
