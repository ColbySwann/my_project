package com.socktical.backend.web.dto;

import lombok.Value;

/**
 * variantId is the Shopify ProductVariant GID (e.g.
 * "gid://shopify/ProductVariant/123") — it's null if the variant has since
 * been deleted, in which case the frontend can't reorder that specific line.
 * This is exactly the id the frontend's existing Storefront API cart mutations
 * (cartLinesAdd) expect as merchandiseId, so reordering never needs this
 * backend to touch the cart itself.
 */
@Value
public class OrderLineItem {
  String title;
  int quantity;
  String variantId;
  String imageUrl;
  Money price;
}
