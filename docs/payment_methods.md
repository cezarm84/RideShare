# Payment Methods

This document provides detailed examples for managing payment methods in the RideShare API.

## Available Payment Methods

The RideShare API supports the following payment methods:

- **Credit Card**: Standard credit card payments
- **Debit Card**: Standard debit card payments
- **Swish**: Mobile payment system popular in Sweden
- **PayPal**: Online payment system
- **Apple Pay**: Mobile payment and digital wallet service by Apple
- **Google Pay**: Mobile payment and digital wallet service by Google
- **Klarna**: Buy now, pay later service
- **Bank Transfer**: Direct bank transfers

## Managing Payment Methods

### Creating a Payment Method

To save a payment method for future use:

```
POST /api/v1/payment-methods
```

#### Request Body:

```json
{
  "method_type": "credit_card",
  "provider": "stripe",
  "account_number": "1234",
  "expiry_date": "12/25",
  "card_holder_name": "John Doe",
  "billing_address": "123 Main St, Stockholm",
  "is_default": true
}
```

### Payment Method Examples

Below are examples for each supported payment method type. Note that `method_type` and `provider` must match the exact values shown here (case-sensitive).

#### Credit Card Example

```json
{
  "method_type": "credit_card",
  "provider": "stripe",
  "account_number": "1234",
  "expiry_date": "12/25",
  "card_holder_name": "John Doe",
  "billing_address": "123 Main St, Stockholm",
  "is_default": true
}
```

#### Debit Card Example

```json
{
  "method_type": "debit_card",
  "provider": "stripe",
  "account_number": "5678",
  "expiry_date": "10/26",
  "card_holder_name": "Jane Smith",
  "is_default": false
}
```

#### Swish Example

```json
{
  "method_type": "mobile_payment",
  "provider": "swish",
  "phone_number": "1234567890",
  "is_default": false
}
```

#### PayPal Example

```json
{
  "method_type": "digital_wallet",
  "provider": "paypal",
  "paypal_email": "user@example.com",
  "is_default": false
}
```

#### Apple Pay Example

```json
{
  "method_type": "digital_wallet",
  "provider": "apple_pay",
  "is_default": false
}
```

#### Google Pay Example

```json
{
  "method_type": "digital_wallet",
  "provider": "google_pay",
  "is_default": false
}
```

#### Klarna Example

```json
{
  "method_type": "invoice",
  "provider": "klarna",
  "is_default": false
}
```

#### Bank Transfer Example

```json
{
  "method_type": "bank_account",
  "provider": "bank_transfer",
  "account_number": "XXXX1234",
  "is_default": false
}
```

#### Required Fields:

- `method_type`: Type of payment method (e.g., 'credit_card', 'mobile_payment')
- `provider`: Payment provider (e.g., 'stripe', 'swish', 'paypal')

#### Optional Fields:

- `account_number`: Last 4 digits for cards, masked account for bank accounts
- `expiry_date`: Expiry date for cards (MM/YY)
- `card_holder_name`: Card holder name for cards
- `billing_address`: Billing address
- `is_default`: Whether this is the default payment method

#### Response:

```json
{
  "id": 1,
  "user_id": 123,
  "method_type": "credit_card",
  "provider": "stripe",
  "account_number": "1234",
  "expiry_date": "12/25",
  "card_holder_name": "John Doe",
  "is_verified": false,
  "is_default": true,
  "created_at": "2025-04-15T14:30:00"
}
```

### Getting User Payment Methods

To get all payment methods for the current user:

```
GET /api/v1/payment-methods
```

#### Response:

```json
[
  {
    "id": 1,
    "user_id": 123,
    "method_type": "credit_card",
    "provider": "stripe",
    "account_number": "1234",
    "expiry_date": "12/25",
    "card_holder_name": "John Doe",
    "is_verified": true,
    "is_default": true,
    "created_at": "2025-04-15T14:30:00"
  },
  {
    "id": 2,
    "user_id": 123,
    "method_type": "mobile_payment",
    "provider": "swish",
    "account_number": null,
    "expiry_date": null,
    "card_holder_name": null,
    "is_verified": true,
    "is_default": false,
    "created_at": "2025-04-15T14:35:00"
  }
]
```

### Getting a Specific Payment Method

To get a specific payment method by ID:

```
GET /api/v1/payment-methods/{payment_method_id}
```

#### Response:

```json
{
  "id": 1,
  "user_id": 123,
  "method_type": "credit_card",
  "provider": "stripe",
  "account_number": "1234",
  "expiry_date": "12/25",
  "card_holder_name": "John Doe",
  "is_verified": true,
  "is_default": true,
  "created_at": "2025-04-15T14:30:00"
}
```

### Updating a Payment Method

To update a payment method:

```
PUT /api/v1/payment-methods/{payment_method_id}
```

#### Request Body:

```json
{
  "expiry_date": "12/26",
  "is_default": true
}
```

#### Response:

```json
{
  "id": 1,
  "user_id": 123,
  "method_type": "credit_card",
  "provider": "stripe",
  "account_number": "1234",
  "expiry_date": "12/26",
  "card_holder_name": "John Doe",
  "is_verified": true,
  "is_default": true,
  "created_at": "2025-04-15T14:30:00"
}
```

### Setting a Default Payment Method

To set a payment method as the default:

```
POST /api/v1/payment-methods/{payment_method_id}/set-default
```

#### Response:

```json
{
  "id": 1,
  "user_id": 123,
  "method_type": "credit_card",
  "provider": "stripe",
  "account_number": "1234",
  "expiry_date": "12/25",
  "card_holder_name": "John Doe",
  "is_verified": true,
  "is_default": true,
  "created_at": "2025-04-15T14:30:00"
}
```

### Deleting a Payment Method

To delete a payment method:

```
DELETE /api/v1/payment-methods/{payment_method_id}
```

#### Response:

```
204 No Content
```

## Using Payment Methods for Bookings

When processing a payment for a booking, you can either use a saved payment method or provide new payment details:

### Using a Saved Payment Method

```
POST /api/v1/bookings/{booking_id}/payment
```

#### Request Body:

```json
{
  "payment_method": "credit_card",
  "payment_method_id": 1
}
```

### Using a New Payment Method

```
POST /api/v1/bookings/{booking_id}/payment
```

#### Request Body:

```json
{
  "payment_method": "credit_card",
  "payment_provider": "stripe",
  "card_number": "4111111111111111",
  "expiry_date": "12/25",
  "cvv": "123",
  "card_holder_name": "John Doe",
  "save_payment_method": true,
  "make_default": false
}
```

#### Response:

```json
{
  "id": 456,
  "booking_id": 123,
  "user_id": 456,
  "amount": 100.0,
  "payment_method": "credit_card",
  "payment_provider": "stripe",
  "payment_type": "credit_card",
  "transaction_id": "txn_123_1681567845",
  "payment_time": "2025-04-15T14:30:45",
  "status": "completed",
  "payment_method_id": 1,
  "saved_method": {
    "id": 1,
    "method_type": "credit_card",
    "provider": "stripe",
    "account_number": "1111"
  }
}
```

## Payment Method Types and Providers

### Valid Values

The API enforces strict validation on `method_type` and `provider` values. You must use the exact values listed below (case-sensitive).

### Method Types

These are the only valid values for the `method_type` field:

| Value            | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `credit_card`    | Credit card payments                                    |
| `debit_card`     | Debit card payments                                     |
| `bank_account`   | Bank account payments                                   |
| `digital_wallet` | Digital wallet payments (PayPal, Apple Pay, Google Pay) |
| `mobile_payment` | Mobile payment systems (Swish)                          |
| `invoice`        | Invoice-based payments (Klarna)                         |

### Providers

These are the only valid values for the `provider` field:

| Value           | Description               |
| --------------- | ------------------------- |
| `stripe`        | Stripe payment processor  |
| `paypal`        | PayPal payment processor  |
| `swish`         | Swish payment system      |
| `apple_pay`     | Apple Pay payment system  |
| `google_pay`    | Google Pay payment system |
| `klarna`        | Klarna payment system     |
| `bank_transfer` | Direct bank transfer      |

### Valid Combinations

Not all combinations of `method_type` and `provider` are valid. Here are the recommended combinations:

| Payment Method | method_type      | provider        |
| -------------- | ---------------- | --------------- |
| Credit Card    | `credit_card`    | `stripe`        |
| Debit Card     | `debit_card`     | `stripe`        |
| PayPal         | `digital_wallet` | `paypal`        |
| Swish          | `mobile_payment` | `swish`         |
| Apple Pay      | `digital_wallet` | `apple_pay`     |
| Google Pay     | `digital_wallet` | `google_pay`    |
| Klarna         | `invoice`        | `klarna`        |
| Bank Transfer  | `bank_account`   | `bank_transfer` |

## Common Errors and Troubleshooting

### Validation Errors

If you receive a validation error like this:

```json
{
  "detail": [
    {
      "loc": ["body", "method_type"],
      "msg": "Invalid method type. Must be one of: credit_card, debit_card, bank_account, digital_wallet, mobile_payment, invoice",
      "type": "value_error"
    },
    {
      "loc": ["body", "provider"],
      "msg": "Invalid provider. Must be one of: stripe, paypal, swish, apple_pay, google_pay, klarna, bank_transfer",
      "type": "value_error"
    }
  ]
}
```

This means the values you provided for `method_type` and/or `provider` don't match the allowed values.

### Common Mistakes

1. **Case sensitivity**: All values are case-sensitive. Use `"swish"` not `"Swish"`.

2. **Incorrect method type**: For Swish payments, use `"mobile_payment"` as the method type, not `"swish"` (which is the provider).

3. **Invalid combinations**: Make sure you're using a valid combination of method type and provider as shown in the table above.

4. **Missing required fields**: Different payment methods require different fields. For example, Swish requires a phone number, while credit cards require an account number and expiry date.

### Example Fixes

**Incorrect Swish Request:**

```json
{
  "method_type": "swish",
  "provider": "Swish",
  "phone_number": "1234567890"
}
```

**Corrected Swish Request:**

```json
{
  "method_type": "mobile_payment",
  "provider": "swish",
  "phone_number": "1234567890"
}
```
