package com.socktical.backend.shopify.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

/**
 * Mirrors the JSON shape returned by ORDERS_QUERY (see
 * ShopifyCustomerAccountClient) against Shopify's Customer Account GraphQL
 * API. Field names here are a best-effort match against Shopify's public
 * docs for that API — verify against the live schema (GraphiQL explorer in
 * your store's Headless channel setup) if orders come back empty/malformed,
 * since this couldn't be tested against a real store from this environment.
 *
 * Plain mutable @Data classes rather than Lombok's @Value/@Builder/@Jacksonized
 * combo: Jacksonized generates references to the old Jackson 2
 * com.fasterxml.jackson.databind package, which no longer exists now that
 * Spring Boot 4 defaults to Jackson 3 (tools.jackson.databind). Jackson
 * deserializes plain no-arg-constructor-plus-setters POJOs like these
 * without needing any Lombok/Jackson integration at all.
 *
 * @JsonIgnoreProperties(ignoreUnknown = true) on every level so an
 * unanticipated extra field never breaks deserialization.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrdersQueryResponse {
  private Payload data;
  private List<GraphQLError> errors;

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Payload {
    private Customer customer;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Customer {
    private OrderConnection orders;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class OrderConnection {
    private List<OrderEdge> edges;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class OrderEdge {
    private OrderNode node;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class OrderNode {
    private String id;
    private String name;
    private String processedAt;
    private Money totalPrice;
    private LineItemConnection lineItems;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class LineItemConnection {
    private List<LineItemEdge> edges;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class LineItemEdge {
    private LineItemNode node;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class LineItemNode {
    private String title;
    private int quantity;
    private Variant variant;
    private Image image;
    private Money price;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Variant {
    private String id;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Image {
    private String url;
    private String altText;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Money {
    private String amount;
    private String currencyCode;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class GraphQLError {
    private String message;
  }
}
