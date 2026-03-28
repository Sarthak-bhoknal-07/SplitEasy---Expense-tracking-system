package com.expensetracker.controller;

import com.expensetracker.dto.SettlementDTO;
import com.expensetracker.service.SettlementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/settlements")
public class SettlementController {

    @Autowired
    private SettlementService settlementService;

    @PostMapping("/group/{groupId}")
    public ResponseEntity<SettlementDTO> createSettlement(@PathVariable Long groupId, @RequestBody SettlementDTO settlementDTO) {
        return ResponseEntity.ok(settlementService.createSettlement(groupId, settlementDTO));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<SettlementDTO>> getGroupSettlements(@PathVariable Long groupId) {
        return ResponseEntity.ok(settlementService.getGroupSettlements(groupId));
    }
}
