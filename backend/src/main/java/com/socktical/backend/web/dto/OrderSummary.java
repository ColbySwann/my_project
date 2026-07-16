package com.socktical.backend.web.dto;

import java.util.List;

import lombok.Value;

@Value
public class OrderSummary {
  String id;
  String name;
  String processedAt;
  Money totalPrice;
  List<OrderLineItem> lineItems;
}
