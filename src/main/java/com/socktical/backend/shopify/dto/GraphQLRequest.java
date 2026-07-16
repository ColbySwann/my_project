package com.socktical.backend.shopify.dto;

import java.util.Map;

import lombok.Value;

@Value
public class GraphQLRequest {
  String query;
  Map<String, Object> variables;
}
