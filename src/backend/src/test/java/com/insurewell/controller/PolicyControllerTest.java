package com.insurewell.controller;

import com.insurewell.model.Policy;
import com.insurewell.repository.PolicyRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PolicyController.class)
class PolicyControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private PolicyRepository policyRepository;

  @Test
  void getPoliciesExpiringSoonReturnsPoliciesWithin30Days() throws Exception {
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    String startDate = today.toString();
    String endDate = today.plusDays(30).toString();

    Policy expiringPolicy = Policy.builder()
      .id("POL-SOON-001")
      .holderName("Renewal Test")
      .planName("Silver Plan")
      .coverageAmount(120000.0)
      .status("active")
      .startDate("2026-01-01")
      .endDate(today.plusDays(10).toString())
      .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0))
      .build();

    when(policyRepository.findByEndDateBetweenOrderByEndDateAsc(startDate, endDate))
      .thenReturn(List.of(expiringPolicy));

    mockMvc.perform(get("/api/policies/expiring-soon"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$", hasSize(1)))
      .andExpect(jsonPath("$[0].id").value("POL-SOON-001"))
      .andExpect(jsonPath("$[0].holderName").value("Renewal Test"))
      .andExpect(jsonPath("$[0].endDate").value(today.plusDays(10).toString()));

    verify(policyRepository).findByEndDateBetweenOrderByEndDateAsc(startDate, endDate);
  }

  @Test
  void getPoliciesExpiringSoonReturnsEmptyWhenNoMatches() throws Exception {
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    String startDate = today.toString();
    String endDate = today.plusDays(30).toString();

    when(policyRepository.findByEndDateBetweenOrderByEndDateAsc(startDate, endDate))
      .thenReturn(List.of());

    mockMvc.perform(get("/api/policies/expiring-soon"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$", hasSize(0)));

    verify(policyRepository).findByEndDateBetweenOrderByEndDateAsc(startDate, endDate);
  }
}
