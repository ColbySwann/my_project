package com.socktical.backend.shopify;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.restclient.test.autoconfigure.RestClientTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.client.MockRestServiceServer;

import com.socktical.backend.web.dto.OrderSummary;

@RestClientTest(ShopifyCustomerAccountClient.class)
@ActiveProfiles("test")
@TestPropertySource(
    properties = "app.shopify.customer-account-api-url=https://shopify.com/1/account/customer/api/2025-01/graphql")
class ShopifyCustomerAccountClientTest {

  @Autowired private ShopifyCustomerAccountClient client;
  @Autowired private MockRestServiceServer server;

  @Test
  void sendsBearerTokenAndNormalizesOrders() {
    String responseBody =
        """
        {
          "data": {
            "customer": {
              "orders": {
                "edges": [
                  {
                    "node": {
                      "id": "gid://shopify/Order/1",
                      "name": "#1001",
                      "processedAt": "2026-06-01T12:00:00Z",
                      "totalPrice": { "amount": "34.00", "currencyCode": "USD" },
                      "lineItems": {
                        "edges": [
                          {
                            "node": {
                              "title": "Aloha Runner",
                              "quantity": 1,
                              "variant": { "id": "gid://shopify/ProductVariant/1" },
                              "image": { "url": "https://cdn/aloha.jpg", "altText": null },
                              "price": { "amount": "34.00", "currencyCode": "USD" }
                            }
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        }
        """;

    server
        .expect(requestTo("https://shopify.com/1/account/customer/api/2025-01/graphql"))
        .andExpect(method(HttpMethod.POST))
        .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer test-token"))
        .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

    List<OrderSummary> orders = client.getOrders("test-token", 20);

    assertThat(orders).hasSize(1);
    OrderSummary order = orders.get(0);
    assertThat(order.getId()).isEqualTo("gid://shopify/Order/1");
    assertThat(order.getName()).isEqualTo("#1001");
    assertThat(order.getTotalPrice().getAmount()).isEqualTo("34.00");
    assertThat(order.getLineItems()).hasSize(1);
    assertThat(order.getLineItems().get(0).getVariantId()).isEqualTo("gid://shopify/ProductVariant/1");
    assertThat(order.getLineItems().get(0).getImageUrl()).isEqualTo("https://cdn/aloha.jpg");
  }

  @Test
  void returnsEmptyListWhenCustomerIsMissing() {
    server
        .expect(requestTo("https://shopify.com/1/account/customer/api/2025-01/graphql"))
        .andRespond(withSuccess("{\"data\": {\"customer\": null}}", MediaType.APPLICATION_JSON));

    List<OrderSummary> orders = client.getOrders("test-token", 20);

    assertThat(orders).isEmpty();
  }
}
