package com.expensetracker.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SplitDTO {
    private Long id;
    private UserDTO user;
    private BigDecimal amount; // INR amount
    private BigDecimal originalAmount; // Original currency amount
}
