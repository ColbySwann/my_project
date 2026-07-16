package com.socktical.backend.shopify;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.socktical.backend.shopify.dto.GraphQLRequest;
import com.socktical.backend.shopify.dto.OrdersQueryResponse;
import com.socktical.backend.web.dto.Money;
import com.socktical.backend.web.dto.OrderLineItem;
import com.socktical.backend.web.dto.OrderSummary;

import lombok.RequiredArgsConstructor;

/**
 * Talks to Shopify's Customer Account GraphQL API on behalf of the
 * authenticated customer, using the OAuth2 access token Spring Security
 * obtained during login (and silently refreshes via
 * OAuth2ClientPersistenceConfig's authorizedClientManager).
 */
@Component
@RequiredArgsConstructor
public class ShopifyCustomerAccountClient {

  // See the class-level note on OrdersQueryResponse — verify this query
  // against the live Customer Account API schema explorer before relying on
  // it in production.
  private static final String ORDERS_QUERY =
      """
      query GetOrders($first: Int!) {
        customer {
          orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
            edges {
              node {
                id
                name
                processedAt
                totalPrice {
                  amount
                  currencyCode
                }
                lineItems(first: 50) {
                  edges {
                    node {
                      title
                      quantity
                      variant {
                        id
                      }
                      image {
                        url
                        altText
                      }
                      price {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      """;

  private final RestClient.Builder restClientBuilder;

  @Value("${app.shopify.customer-account-api-url}")
  private String customerAccountApiUrl;

  public List<OrderSummary> getOrders(String accessToken, int first) {
    OrdersQueryResponse response =
        restClientBuilder
            .build()
            .post()
            .uri(customerAccountApiUrl)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .body(new GraphQLRequest(ORDERS_QUERY, Map.of("first", first)))
            .retrieve()
            .body(OrdersQueryResponse.class);

    if (response == null || response.getData() == null || response.getData().getCustomer() == null) {
      return List.of();
    }

    return response.getData().getCustomer().getOrders().getEdges().stream()
        .map(edge -> toOrderSummary(edge.getNode()))
        .toList();
  }

  private OrderSummary toOrderSummary(OrdersQueryResponse.OrderNode node) {
    List<OrderLineItem> lineItems =
        node.getLineItems().getEdges().stream()
            .map(edge -> toOrderLineItem(edge.getNode()))
            .toList();

    return new OrderSummary(
        node.getId(), node.getName(), node.getProcessedAt(), toMoney(node.getTotalPrice()), lineItems);
  }

  private OrderLineItem toOrderLineItem(OrdersQueryResponse.LineItemNode node) {
    String variantId = Optional.ofNullable(node.getVariant()).map(OrdersQueryResponse.Variant::getId).orElse(null);
    String imageUrl = Optional.ofNullable(node.getImage()).map(OrdersQueryResponse.Image::getUrl).orElse(null);

    return new OrderLineItem(node.getTitle(), node.getQuantity(), variantId, imageUrl, toMoney(node.getPrice()));
  }

  private Money toMoney(OrdersQueryResponse.Money money) {
    return new Money(money.getAmount(), money.getCurrencyCode());
  }
}
