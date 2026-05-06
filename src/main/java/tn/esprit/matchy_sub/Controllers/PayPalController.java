package tn.esprit.matchy_sub.Controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/paypal")
@RequiredArgsConstructor
public class PayPalController {

    @Value("${paypal.client.id:your_client_id}")
    private String clientId;

    @Value("${paypal.client.secret:your_client_secret}")
    private String clientSecret;

    @Value("${paypal.mode:sandbox}")
    private String mode;

    @Value("${paypal.success.url:http://localhost:4200/payment-success}")
    private String successUrl;

    @Value("${paypal.cancel.url:http://localhost:4200/payment-cancel}")
    private String cancelUrl;

    private static final String SANDBOX_API = "https://api-m.sandbox.paypal.com";
    private static final String LIVE_API = "https://api-m.paypal.com";

    private String getApiUrl() {
        return "sandbox".equalsIgnoreCase(mode) ? SANDBOX_API : LIVE_API;
    }

    private String getAccessToken() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String auth = clientId + ":" + clientSecret;
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("Authorization", "Basic " + encodedAuth);

            String body = "grant_type=client_credentials";
            HttpEntity<String> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    getApiUrl() + "/v1/oauth2/token", request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (String) response.getBody().get("access_token");
            }
        } catch (Exception e) {
            System.err.println("[PayPal] Error getting access token: " + e.getMessage());
        }
        return null;
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        try {
            String accessToken = getAccessToken();
            if (accessToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Failed to get PayPal access token");
            }

            double amount = Double.parseDouble(body.getOrDefault("amount", 0).toString());
            String currency = body.getOrDefault("currency", "USD").toString();
            String ref = body.getOrDefault("transactionRef", "TXN-REF").toString();

            Map<String, Object> orderPayload = new HashMap<>();
            orderPayload.put("intent", "CAPTURE");

            List<Map<String, Object>> purchaseUnits = new ArrayList<>();
            Map<String, Object> unit = new HashMap<>();
            Map<String, Object> amountObj = new HashMap<>();
            amountObj.put("currency_code", currency);
            amountObj.put("value", String.format("%.2f", amount));
            unit.put("reference_id", ref);
            unit.put("amount", amountObj);
            unit.put("description", "Matchy Subscription - " + ref);
            purchaseUnits.add(unit);
            orderPayload.put("purchase_units", purchaseUnits);

            Map<String, Object> appContext = new HashMap<>();
            appContext.put("return_url", successUrl + "?ref=" + ref);
            appContext.put("cancel_url", cancelUrl + "?ref=" + ref);
            orderPayload.put("application_context", appContext);

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + accessToken);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(orderPayload, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    getApiUrl() + "/v2/checkout/orders", request, Map.class);

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                Map<?, ?> result = response.getBody();
                String orderId = (String) result.get("id");

                String approvalUrl = null;
                List<?> links = (List<?>) result.get("links");
                if (links != null) {
                    for (Object linkObj : links) {
                        Map<?, ?> link = (Map<?, ?>) linkObj;
                        if ("approve".equals(link.get("rel"))) {
                            approvalUrl = (String) link.get("href");
                            break;
                        }
                    }
                }
                Map<String, Object> resp = new HashMap<>();
                resp.put("orderId", orderId);
                resp.put("approvalUrl", approvalUrl);
                resp.put("ref", ref);
                resp.put("status", result.get("status"));
                return ResponseEntity.ok(resp);
            }
            return ResponseEntity.badRequest().body("PayPal order creation failed");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("PayPal error: " + e.getMessage());
        }
    }

    @PostMapping("/capture-order/{orderId}")
    public ResponseEntity<?> captureOrder(@PathVariable String orderId) {
        try {
            String accessToken = getAccessToken();
            if (accessToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Failed to get PayPal access token");
            }
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + accessToken);

            HttpEntity<String> request = new HttpEntity<>("{}", headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    getApiUrl() + "/v2/checkout/orders/" + orderId + "/capture", request, Map.class);

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                Map<?, ?> result = response.getBody();
                Map<String, Object> resp = new HashMap<>();
                resp.put("orderId", orderId);
                resp.put("status", result.get("status"));
                return ResponseEntity.ok(resp);
            }
            return ResponseEntity.badRequest().body("PayPal capture failed");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Capture error: " + e.getMessage());
        }
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getOrderDetails(@PathVariable String orderId) {
        try {
            String accessToken = getAccessToken();
            if (accessToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Failed to get PayPal access token");
            }
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + accessToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    getApiUrl() + "/v2/checkout/orders/" + orderId, HttpMethod.GET, request, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return ResponseEntity.ok(response.getBody());
            }
            return ResponseEntity.badRequest().body("Failed to get order details");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
