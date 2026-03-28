package com.expensetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtDTO {
    private UserDTO from;
    private UserDTO to;
    private BigDecimal amount; // INR
    private BigDecimal originalAmount;
    private String originalCurrency;
}
