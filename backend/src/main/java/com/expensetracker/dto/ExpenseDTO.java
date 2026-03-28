package com.expensetracker.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseDTO {
    private Long id;
    private String title;
    private BigDecimal amount; // Converted INR
    private BigDecimal originalAmount;
    private String originalCurrency;
    private BigDecimal convertedAmountINR; // Legacy/Detailed field
    private BigDecimal amountInr; // Requested field
    private String currency; // Legacy field, same as originalCurrency
    private UserDTO paidBy;
    private Long groupId;
    private LocalDate date;
    private List<SplitDTO> splits;
}
