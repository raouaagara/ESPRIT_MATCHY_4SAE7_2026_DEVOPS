package com.matchy.controller;

import com.matchy.entity.Transaction;
import com.matchy.entity.User;
import com.matchy.entity.Wallet;
import com.matchy.repository.TransactionRepository;
import com.matchy.repository.UserRepository;
import com.matchy.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    @Autowired private WalletRepository      walletRepository;
    @Autowired private UserRepository        userRepository;
    @Autowired private TransactionRepository transactionRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getWalletByUser(@PathVariable Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return null;
            return walletRepository.save(new Wallet(user));
        });

        if (wallet == null) return ResponseEntity.notFound().build();

        // ✅ Transactions reçues par le freelancer
        List<Transaction> transactions = transactionRepository
                .findByReceiverIdOrderByCreatedAtDesc(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("id",           wallet.getId());
        response.put("solde",        wallet.getSolde());
        response.put("soldeBloque",  wallet.getSoldeBloque());
        response.put("devise",       wallet.getDevise());
        response.put("transactions", transactions);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}/solde")
    public ResponseEntity<?> getSolde(@PathVariable Long userId) {
        return walletRepository.findByUserId(userId)
                .map(w -> ResponseEntity.ok(w.getSolde()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/user/{userId}/recharge")
    public ResponseEntity<?> rechargerWallet(@PathVariable Long userId,
                                              @RequestParam Double montant) {
        return walletRepository.findByUserId(userId)
                .map(wallet -> {
                    wallet.setSolde(wallet.getSolde() + montant);
                    walletRepository.save(wallet);
                    return ResponseEntity.ok(wallet);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}