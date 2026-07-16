package com.socktical.backend.web.dto;

import lombok.Value;

@Value
public class Money {
  String amount;
  String currencyCode;
}
