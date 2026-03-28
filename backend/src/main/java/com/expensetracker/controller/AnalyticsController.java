package com.expensetracker.controller;

import com.expensetracker.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/group/{groupId}/monthly")
    public ResponseEntity<Map<String, BigDecimal>> getMonthlyExpenses(@PathVariable Long groupId) {
        return ResponseEntity.ok(analyticsService.getMonthlyExpenses(groupId));
    }

    @GetMapping("/group/{groupId}/summary")
    public ResponseEntity<Map<String, Object>> getGroupSummary(@PathVariable Long groupId, Authentication authentication) {
        return ResponseEntity.ok(analyticsService.getGroupSummary(groupId, authentication.getName()));
    }
}
