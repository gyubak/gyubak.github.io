---
title: "VLM의 잘못된 결정을 거부하고 대체 경로 생성"
description: "잘못된 경로를 지시할 때 그것을 거부하고 영상 기반 주행할 수 있다."
stack: [VLM, Latent Transfuser, DiT]
placeholder: cloud
featured: true
post_no: 2
period: "2026.09. – 2026.10."
# thumbnail: /assets/img/trajectory-thumb.mp4
---

## 1 Introduction

기존 rule-based 자율주행 시스템에서 learning-based e2e ai 모델이 도입되면서 <장점> 할 수 있었다. 반면 e2e 모델은 real world의 일반적인 지식을 담고 있지 않으며 설명 가능성이 부족하다. 

## 2 Related work

관련

## 3 Methodology

내 모델 

## 4 Experiments

#### 4.1 Dataset

데이터셋은 nuPlan을 사용했으며 데이터셋 내의 데이터 유형은 아래와 같다.

#### 4.2 Experimental Settings

dim은 얼마를 썼고 lr은 얼마를 썼다. 이 값은 ...에 의해 가장 좋은 것을 보이는 것으로 선택했다.
랜덤 시드는 0과 1을 사용하였으며 아래 결과들은 두 시드의 평균으로 성능을 나타냈다.

#### 4.3 Results and Discussion

| 모델 | 결정–경로 일치율 | 안전율: 규칙 기반 CF⁻ | 안전율: 실제 VLM 오답 | 주행 점수 |
| --- | ---: | ---: | ---: | ---: |
| B0 (결정 무시) | 3.1% | 96.9% | 97.5% | 0.938 |
| B1 (결정 입력) | 34.6% | 16.2% | 25.4% | 0.946 |
| B2 (+CF⁺) | **80.5%** | 32.3% | 28.5% | 0.939 |
| B3 (+CF⁻) | 76.5% | 91.8% | 70.9% | 0.939 |
| **Ours** (+판단) | 73.3% | 93.0% | 72.7% | 0.937 |

## 5 Conclusion

[주요 결과 요약.]

## 6 Limitations and Future work

이 문제는 이 부분에 대한 것을 보장하지 않는다.

## References
[1] 