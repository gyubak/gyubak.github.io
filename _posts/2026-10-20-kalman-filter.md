---
title: "[예시] 베이즈 필터에서 칼만 필터 유도하기"
section: basic
subject: 확률·통계
tags: [state-estimation, tracking]
---

자율주행의 추적 모듈은 결국 보이지 않는 상태를 관측으로 추정하는 문제다. 이 글에서는 일반적인 베이즈 필터에서 출발해 선형·가우시안 가정을 더했을 때 칼만 필터가 어떻게 나오는지 정리한다.

## 예측 단계

상태 전이 모델이 선형이라고 가정하면 예측된 평균과 공분산은 다음과 같다.

$$
\hat{x}_k^- = F \hat{x}_{k-1} + B u_k, \qquad P_k^- = F P_{k-1} F^\top + Q
$$

> Q가 너무 작으면 필터가 관측을 무시하고, 너무 크면 노이즈를 그대로 따라간다.

## 코드로 확인하기

```python
def predict(x, P, F, Q):
    x = F @ x
    P = F @ P @ F.T + Q
    return x, P
```

## 갱신 단계

[본문 계속]
