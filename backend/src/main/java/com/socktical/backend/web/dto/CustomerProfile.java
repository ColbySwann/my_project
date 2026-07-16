package com.socktical.backend.web.dto;

import lombok.Value;

@Value
public class CustomerProfile {
  String id;
  String email;
  String firstName;
  String lastName;
}
