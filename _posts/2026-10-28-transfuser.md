---
title: "TransFuser: Imitation with Transformer-Based Sensor Fusion for Autonomous Driving"
section: review
subject: Paper
tags: [TransFuser, review]
# review guideline
# 1 배경: 산업 동향 → 기존 접근과 한계 → 이 논문의 해결 방향
# 2 방법: 제안 구조, 그렇게 한 이유
# 3 실험 설정: 데이터셋, 지표, 비교 대상
# 4 실험 결과: 핵심 표 1~2개, ablation
# 5 결론과 한계: 결론과 한계
# 6 나의 생각: 결과가 주장을 뒷받침하는지 / 내가 본 한계 / 내 연구와의 관계
---

> '목차 1 배경'부터 '목차 5 결론과 한계'까지 논문의 설명을 정리한 것으로, 영어에서 한국어로 번역하는 과정에서 발생하는 의역을 제외하고 리뷰어의 생각은 담겨있지 않습니다. 리뷰어의 주관적인 의견은 '목차 6 나의 생각'에 담겨 있습니다. 

## 0 TL;DR

한 줄 요약

## 1 배경

### 1.1 산업 동향
최근에(2022년) LiDAR 기반 자율주행 메서드는 인상적인 성능을 보여주고 있다. 하지만 해당 메소드들은 HD map이나 traffic light state와 같이 LiDAR를 통해 획득할 수 없는 정보에 접근(access to priviledged information)할 수 있다고 가정한 상황에서 평가되었다. 실제로는 LiDAR에서 획득할 수 없는 정보는 RGB Camera와 같은 다른 센서로부터 보충되어야 한다(must be recovered).

이 사실을 기반으로 아래와 같은 질문을 할 수 있다.
- 상호 보완적인 장점을 가지고 있는 두 모달리티를 활용하여 표현을 통합(integrate representations)할 수 있을까?
- 우리가 다른 모달리티를 어느 정도까지 독립적으로 처리해야 할까?
- 최대 성능 향상을 위해 어떤 종류의 fusion 매커니즘을 채택해야 할까?

### 1.2 기존 접근과 한계

센서 퓨전 분야의 선행 연구들은 대부분 아래와 같이 인지(perception)에 집중하고 있다.
- 2D and 3D object detection
- motion forecasting
- depth estimation

이러한 메소드들은 3차원 장면의 기하학적이고 세맨틱한 정보를 담는(capture) 상태 표현(state representation)을 학습하는 것에 집중한다. 그것들은 주로 이미지 공간과 BEV(Bird's Eye View)나 RV(Range View)로 표현되는 LiDAR 투영 공간 간에 기하학적 특징 투영을 기반으로 동작한다. 일반적으로 2D/3D 투영 공간에 있는 각 특징들은 주변 데이터와 합쳐져서 정보를 이루는데 **이것이 복잡한 도시(urban) 시나리오에서 모델의 성능을 저하시키는 것을 확인했다(상단 표 참고).** 

예를 들어 위 그림과 같이 LiDAR에는 Traffic에 대한 정보가 있고, Camera에는 Traffic Light에 대한 정보가 있다. 두 정보는 각각 서로 다른 센서 데이터로 별개로 존재하며 공간 상 멀리 떨어져있다. 우리는 직관적으로 traffic light가 초록색이라면 traffic은 속도를 가지고 있을 확률이 높다고 생각할 수 있으며, 반대로 빨간색인 경우 traffic은 감속하거나 정지해있을 것이라고 생각할 수 있기 때문에 두 정보는 연관이 있는 정보이다. 반면 앞 문단에서 말했던 방식대로라면 두 정보는 공간 상 멀리 떨어져있기 때문에 상호 간의 연관성을 이해할 수 없다.

### 1.3 이 논문의 해결 방향
Deep convolutional network는 싱글 모달리티를 가지고 globaal context를 표현(capture)하는데 사용할 수 있는 반면에 이것을 멀티 모달로 확장하는 것은 쉽지 않다(non-trivial). **우리는 Transformer의 Attention 매커니즘을 사용하며 3차원 장면에 대한 global contextual reasoning을 곧바로 다른 모달리티들의 feature extraction layer 안으로 통합한다.** (이 문장을 풀어서 얘기하자면, feature extraction 단계 중간 중간에 다른 모달리티의 중간 결과물을 가져와서 attention을 수행하면서 global context에 대한 reasoning을 하겠다는 의미이다. 다시 말하자면 Late Fusion을 하지 않고 Intermediate Fusion을 하겠다는 이야기를 하고 있는 것이고 그것을 선택한 이유에 대해서는 뒷 부분에 나온다.)



## 2 방법

이 연구는 e2e 드라이빙에서 새로운 아키텍처를 제안하며, 이 아키텍처의 핵심 요소는 아래와 같다.
- multi-modal fusion transformer
- auto-regressive waypoint prediction network

### 2.1 Problem Setting

#### Task
동적 에이전트들에 안전하게 반응하고 교통 법규를 준수하면서 주어진 경로를 완수하는 도시 환경에서 point-to-point 주행 태스크를 채택한다.

#### Learning
학습은 Imitation Learning(IL) 중에 Behavior Cloning(BC)을 채택한다.

Policy는 input으로부터 waypoint로의 매핑이다.

$$
\argmin_{\pi} \mathbb{E}_{(\mathcal{X}, \mathcal{W}) \sim \mathcal{D} } {[\mathcal{L}(\mathcal{W}, \pi(\mathcal{X}))]}
$$

여기에서 데이터셋 $\mathcal{D}$는 $\mathcal{D}=\{(\mathcal{X}^i, \mathcal{W}^i)\}_{i=1}^Z$로 Z개의 샘플 중 $i$번째 샘플에 해당하는 장면의 센서 데이터 $\mathcal{X}^i$와 전문가의 미래 waypoint $\mathcal{W}^i$를 묶어서 데이터셋으로 구성한다.

데이터는 single time-step 데이터만 사용하며 그 이유는 IL에 대한 선행 연구들에서 관측 히스토리를 쓰는 것은 성능 향상으로 이어지지 않을 수 있다고 보였기 때문이다.

#### Global Planner
high level goal location은 GPS 좌표로 하고 이 좌표는 waypoint와 달리 듬성듬성하고 좌표 간 수백 미터 떨어져있을 수 있다.

### 2.2 I/O

#### Input Representation
- LiDAR
    - BEV range는 차량 전방 32m, 좌우 각각 16m 영역(32m x 32m)을 커버한다.
    - BEV grid는 0.125m x 0.125m이며, 최종 BEV Map의 resolution은 256 x 256이다.
    - Point Cloud Data 그룹을 나누는데, 각 ptd마다 높이 데이터가 지면보다 높은 그룹과 지면 또는 지면보다 낮은 그룹으로 분류한다. 그러고 나서 각 그룹마다 BEV 격자로 이산화를 하여 2-bin BEV histogram을 만든다. 이 과정에서 정확한 높이 정보가 사라진다.
    - 뿐만 아니라 2D goal location을 같은 차원의 BEV 공간으로 rasterize하며 BEV histogram들과 함께 채널 축으로 concatenate하여 3채널 BEV Map을 완성한다.
- Camera
    - RGB 3 camera를 사용하며 각각 전방, 좌측 60도 전방, 우측 60도 전방을 바라본다. 각 카메라의 horizontal FOV는 120도이다.
    - 우리는 이미지 해상도를 960 x 480으로 획득하며 카메라 특유의 가장자리 왜곡을 방지하기 위해 320 x 160 으로 영상을 크롭한다.
    - 이 이미지를 연결하여 단일 이미지로 만들어 encoder로 입력하게 된다. 단일 이미지는 704 x 160 사이즈의 132 FOV를 가지며 이 FOV가 CARLA의 모든 도시에서 단거리 및 근거리 신호등을 관측하기 적절하다(이것에 대한 근거는 논문이나 코드에서 확인되지 않음).

#### Output Representation
BEV space에서 ego vehicle의 미래 경로 $\mathcal{W}$ 를 예측한다.
$$
\{ \textbf{w}_t=(x_t,y_t) \}_{t=1}^T
$$
여기에서 $T=4$ 를 사용하며 우리의 inverse dynamics model에서 기본적으로 요구하는 숫자기 때문이다.

### 2.3 Transfuser

(사진 첨부)

#### Multi-modal Fusion Transformer
cam과 lid의 상호 보완적인 특징을 바탕으로 self-attention 매커니즘과 접목하는 것이 우리의 핵심 아이디어이다. Transformer로 feature vector로 표현된 토큰 sequence가 들어가고 이 토큰에는 positional embedding이 포함된다.

각 센서 데이터는 독립적으로 CNN을 통해 차원이 축소되며 TransFuser에서는 4번의 CNN 연산을 수행한다. CNN으로 차원 축소가 일어날 때마다 Transformer에 상호 어텐션을 수행하며, 마지막 4번째 CNN 연산이 아닌 경우 해상도로 인한 과도한 연산 부하를 막기 위해 다운샘플링-어텐션-업샘플링 과정을 수행한다.

각 센서 별로 마지막 레이어가 아닌 경우에 AvgPool을 통해 카메라와 라이다 각각 22 x 5 x c 와 8 x 8 x c 텐서로 다운샘플링 되며 이것을 각각 공간 방향으로 flatten하여 110 x c와 64 x c가 되고 이것을 concat하여 174 x c($ F^{in} $)이 된다. $ F^{in} $ 는 같은 크기의 positional embedding(learnable param)와 element-wise summation된다. (velocity embedding도 수행되나 방식은 논문에서 확인할 수 없음)

각 센서 브랜치에서 네 번째 CNN과 Transformer 연산까지 수행하였을 때 각각 AvgPool을 수행하고 FC Layer를 거치면서 512차원 벡터 하나가 나온다. 이 벡터는느 3D scene의 글로벌 컨텍스트가 인코드된 환경의 compact 한 representation이 된다.

#### Auto-regressive Waypoint Prediction Network


#### Controller

### 2.4 Loss Functions

### 2.5 Latent Transfuser

## 3 실험 설정

데이터셋, 지표, 비교 대상

## 4 실험 결과

핵심 표 1~2개, ablation

## 5 결론과 한계

결론과 한계

## 6 나의 생각

결과가 주장을 뒷받침하는지 / 내가 본 한계 / 내 연구와의 관계

참고: 리뷰의 핵심은 3.3이랑 실험에서 late fusion, geometric fusion 대비 얼마나 나아졌는지임.