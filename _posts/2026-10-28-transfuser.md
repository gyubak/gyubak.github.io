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

> '목차 1 배경'부터 '목차 5 결론과 한계'까지 논문의 설명을 정리한 것으로, 영어에서 한국어로 번역하는 과정에서 발생하는 의역을 제외하고 리뷰어의 생각은 담겨있지 않습니다. 리뷰어의 주관적인 의견은 '목차 6 리뷰'에 담겨 있습니다. 

## 0 TL;DR

한 줄 요약

https://arxiv.org/pdf/2205.15997

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
Deep convolutional network는 싱글 모달리티를 가지고 globaal context를 표현(capture)하는데 사용할 수 있는 반면에 이것을 멀티 모달로 확장하는 것은 쉽지 않다(non-trivial). **우리는 3차원 장면에 대한 global contextual reasoning을 Transformer의 Attention 매커니즘을 이용하여 곧바로 다른 모달리티들의 feature extraction layer 안으로 통합한다.** (이 문장을 풀어서 얘기하자면, feature extraction 단계 중간 중간에 다른 모달리티의 중간 결과물을 가져와서 attention을 수행하면서 global context에 대한 reasoning을 하겠다는 의미이다. 다시 말하자면 Late Fusion을 하지 않고 Intermediate Fusion을 하겠다는 이야기를 하고 있는 것이고 그것을 선택한 이유에 대해서는 뒷 부분에 나온다.)



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
\underset{\pi}{\operatorname*{argmin}} \ \mathbb{E}_{(\mathcal{X}, \mathcal{W}) \sim \mathcal{D} } {[\mathcal{L}(\mathcal{W}, \pi(\mathcal{X}))]}
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
    - 이 이미지를 연결하여 단일 이미지로 만들어 encoder로 입력하게 된다. 단일 이미지는 704 x 160 사이즈의 132◦ FOV를 가지며 이 FOV가 CARLA의 모든 도시에서 단거리 및 근거리 신호등을 관측하기 적절하다(이것에 대한 근거는 논문이나 코드에서 확인되지 않음).

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

각 센서 별로 마지막 레이어가 아닌 경우에 AvgPool을 통해 카메라와 라이다 각각 22 x 5 x c 와 8 x 8 x c 텐서로 다운샘플링 되며 이것을 각각 공간 방향으로 flatten하여 110 x c와 64 x c가 되고 이것을 concat하여 174 x c($ F^{in} $)이 된다. $ F^{in} $ 는 같은 크기의 positional embedding(learnable param)와 element-wise summation된다. (논문에 따르면 velocity embedding도 수행하는 것처럼 읽히지만 최종 TransFuser 모델에서는 속도 임베딩은 없는 것이 기본인 것 같고 논문 뒤편의 결과에서 ablation으로 velocity embedding을 사용한 결과 성능이 더 나빠지는 결과가 나옴. TransFuser는 초기 버전과 후기 버전이 있는 것으로 보이는데 논문은 후기 버전이며 초기 버전에는 속도 임베딩을 기본으로 한 것으로 보임.)

각 센서 브랜치에서 네 번째 CNN과 Transformer 연산까지 수행하였을 때 각각 AvgPool을 수행하고 FC Layer를 거치면서 512차원 벡터 하나가 나온다. 이 벡터는 3D scene의 글로벌 컨텍스트가 인코드된 환경의 compact 한 representation이 된다.

#### Auto-regressive Waypoint Prediction Network

위에서 구한 512차원 벡터는 AR의 연산 효율을 위해 MLP를 통해 64차원으로 압축된다. 이것이 바로 GRU의 hidden state로 들어가고 GRU의 첫 입력은 ego-frame에서 ego의 위치인 (0, 0)이다. GRU에는 Goal Location 에 대한 GPS 데이터도 함께 들어가며 AR 결과는 직전 point 대비의 변화량을 나타낸다.
$$
\{\mathbf{w}_t = \mathbf{w}_{t-1} + \delta \mathbf{w}_t \}_{t=1}^T
$$

#### Controller

steer, throttle, brake 값(저수준 제어 신호)을 얻기 위해 두 개의 PID 컨트롤러를 사용한다.

IL에서 발생하는 차량이 움직이지 않는 현상을 방지하고자 creeping 동작을 추가했으며 이것은 safety heuristic에 의해 traffic에 stuck된 경우와 같이 안전 문제로 creeping을 할 수 없는 상황인지 체크하여 creeping 동작을 수행한다.

### 2.4 Loss Functions

모델이 예측한 waypoint와 GT waypoint는 L1 loss를 사용했다.

#### Auxiliary Tasks

 Aux. task는 더 해석가능하고 강건한 모델로 이어진다는 선행 연구를 바탕으로 aux. task를 설정한다.

Aux. task로 (image branch feature를 가지고)depth prediction, semantic segmentation, (LiDAR branch feature를 가지고)HD map prediction, vehicle detection을 수행한다. depth prediction과 semantic segmentation은 AIM-MT의 디코더 구조를 차용했고, vehicle detection은 CenterNet 구조를 일부 차용했다. HD map prediction으로는 conv. decoder를 사용했다.

### 2.5 Latent Transfuser

CIRLS는 CARLA 구버전에서 널리 사용되는 image-only baseline이나 (follow lane, change lane left/right, turn left/right)와 같이 discrete한 nav 커맨드는 challenging CARLA 리더보드에서 좋지 않은 성적을 나타낸다. 최근 연구들은 IL에서 보다 복잡한 RL 기반 학습을 쓰면서 베이스라인으로 CIRLS를 사용하고 있다. 미래의 연구에서 보다 의미있는 베이스라인을 제공하기 위해 Latent Transfuser을 소개한다.

2채널 LiDAR BEV 히스토그램은 2채널 positional encoding으로 대체된다. 원래는 LiDAR point cloud가 입력되어야 하지만 LTF는 camera-only이기 때문에 LiDAR 데이터를 넣을 수 없다. 그에 따라 라이다 브랜치를 없애는 것이 아니라 좌표 격자 데이터를 집어넣는다. 마찬가지의 2채널 BEV 맵인데 한 채널은 좌우 방향에 대해, 나머지 한 채널은 연징 상하방향을 나타내기 위해 예를 들어 아래와 같이 -1부터 1까지 등간격의 좌표 격자를 LiDAR 대신 입력한다.

채널 1 (좌우 측)에 대한 예시
$$
\begin{bmatrix}
-1 & -0.5 & 0 & 0.5 & 1 \\
-1 & -0.5 & 0 & 0.5 & 1 \\
-1 & -0.5 & 0 & 0.5 & 1 \\
-1 & -0.5 & 0 & 0.5 & 1 \\
-1 & -0.5 & 0 & 0.5 & 1
\end{bmatrix}
$$

반면 기존에 LiDAR branch로부터 HD map이나 vehicle detection과 같은 Aux. task를 수행하였는데, 당장 라이다 데이터를 대신하는 저 좌표 격자만 보았을 때는 Aux. task를 수행할 수 없을 것처럼 보인다. 하지만 TransFuser 내부에 image 정보와 attention하는 과정을 거쳐서 영상 정보에 대한 데이터가 섞이기 때문에 똑같이 HD Map과 vehicle detection을 수행할 수 있다. (기존에는 멀티 모달로 aux. task를 수행했다면 LTF에서는 카메라에 완전히 의존해서 aux. task를 수행한다고 보면 된다.)

## 3 실험 설정

experimental setup 소개, baseline들과의 주행 퍼포먼스 비교, 어텐션 맵 비주얼화, ablation study

#### Task
freeways, urban areas, residentail districts 등 다양한 지역에서 predefined된 경로 셋을 따라 주행하는 태스크. 장애물 회피, 비보호 turns, 빨간 불에 교차로 통과, 가려진 구역에서 나타나는 보행자 등 적대적인 상황들에 대해 ego의 대처 능력을 테스트. ego는 정해진 시간 내에 교통 규칙을 준수하고 높은 밀도의 dynamic agent들에 대처하면서 경로를 완주하여야 한다.

#### Dataset
공개적으로 사용가능한 8개의 도시로 이루어진 CARLA 0.9.10로 training 및 testing의 시뮬레이션으로 사용한다.
우리의 데이터셋은 1) 교차로를 통과하는 평균 길이 약 100m의 루트 2500개, 2) 평균 길이 400m의 굽은 고속도로 경로 1000개로 collected 되었다.

#### Expert
IL의 대상으로 privileged info를 알고 주행하는 expert policy를 도입했고 데이터는 2fps로 수집된다. 이 expert는 CARLA의 traffic manager autopilot와 유사한 rule-based algorithm이다.

policy는 2개의 PID 제어기가 있는(각각 lat., long.) A* planner로 구성되어 있다.
- Lateral
    - next waypoint 방향과 차량의 heading angle을 minimize하며 lateral control을 수행한다.
- Longitudinal
    - 3가지의 target speed가 있으며 기본값은 4.0m/s이다. 차량이 교차로 내에 있다면 목표 속도는 3.0m/s으로 세팅된다. infraction이 예상되는 경우 목표 속도는 0.0m/s으로 세팅된다.

차량 모델로 kinematic bicycle model을 사용한다. pedestrian은 질점으로 본다.

#### Longest6 Benchmark
CARLA의 evaluation leaderboard는 팀 당 한 달에 200시간으로 제한되나, 한 번의 eval만으로 100시간이 소요되기 때문에 ablation study나 디테일한 통계를 여러 번 내는 것은 불가능하다. 따라서 우리는 Longest6 benchmark를 도입한다.

Longest6 Benchmark는 2019 CARLA Challenge에서 공개된 맵을 바탕으로 부족한 부분을 보완하여 구성된다. 여기에는 6개의 날씨 조건과 6개의 daylight 조건이 포함된다.

#### Metrics
agent의 주행 특성에 대한 포괄적인 이해를 위해 몇 가지의 metrics를 보고한다.

- Route Completion (RC): route별로 전체 route에서 얼마나 complete하게 주행했는지의 퍼센트를 평균한 것. 예를 들어 1.5km경로에서 0.75km만 주행하고 끝났다면 R은 0.5(50%)이고 완주했다면 R은 1(100%)이다. 뿐만 아니라 루트 주행 중 agent가 route lane의 바깥쪽으로 주행하는 경우 RC에 (1- route를 벗어난 상태로 주행한 거리 %)를 곱한다.

$$
RC=\frac{1}{N}\sum_{i}^{N}R_i
$$

- Infraction Score (IS): penalty coeff.의 product로 계산됨. coeff.는 논문에서 predefined하고 있는데, 예를 들어 ped와 충돌에 대한 coeff.는 0.5인데 이것을 3회 반복하면 ped에 대한 infraction score는 0.5^3 = 0.125점이 된다. 반면 아무런 infraction이 없으면 1이 된다.
$$
IS=\prod_{j}^{Ped,Veh,Stat,Red}(p^j)^{\#infractions^j}
$$
여기에서 $p^{Ped}=0.50,\ p^{Veh}=0.60,\ p^{Stat}=0.65,\ p^{Red}=0.70$이며 $\#infractions^j$는 해당 infraction이 발생한 횟수이다.

- Driving Score (DS): 경로 i에서 RC의 $R_i$와 IS의 $P_i$의 곱을 모든 경로에 대해 평균을 낸 것

$$
DS = \frac{1}{N} \sum_i^{N}R_iP_i
$$

- Infractions per km: 1km 주행 당 infraction 발생 횟수

$$
\text{Infractions per km}=\frac{\sum_i^N\#infractions_i}{\sum_i^Nk_i}
$$

#### Baseline
- WOR: dynamic programming을 사용하여 획득한 Q function으로 driving task를 수행. author-provided pretrained model을 사용.
- Latent Transfuser
- LAV: PointPainting으로 센서 퓨전하는 모델. 공개 릴리즈된 checkpoint를 사용하나 릴리즈된 checkpoint는 leaderboard에 올라온 LAV와 같은 가중치는 아님.
- Late Fusion: 우리 아키텍처의 변형된 버전. image와 LiDAR은 같은 encoder를 사용하여 feature를 추출하나 Transformer 없이 element-wise summation으로 융합됨.
- Geometric Fusion: 우리 아키텍처의 변형된 버전. 기존 학계에의 geometry-based fusion 방식의 모델로 변형함. LiDAR ptd 자체를 0.125m x 0.125m 크기의 3D cell 칸으로 나누고, 이 cell에 있는 ptd를 랜덤으로 5개를 선택해 image space로 투영함. 그리고 나서 element-wise summation하여 image feature와 합쳐짐. project-based fusion 방식임.

#### Implementation Details
- 인코더: RegNetY-3.2GF를 인코더로 사용하였고 image 인코딩에는 pre-trained model을 사용했고 LiDAR 인코딩에는 처음부터 학슴함.
- 증강: angular viewpoint augmentation으로 sensor input과 그에 따른 waypoint label을 ±20◦ 회전시킴.
- 학습: 4개의 RTX 2080It로 41 epochs 학습시킴. lr은 $10^{-4}$이고 batch_size는 12로 설정함. 30에폭과 40에폭에서 lr를 10배 감소시킴. 어떤 시드에서 31/33/35/37/39/41 에폭을 평가하여 DS가 가장 높은 에폭을 선택함. 옵티마이저로 AdamW를 사용하였고 weight decay는 0.01, Adam betas는 PyTorch 기본값인 0.9와 0.999를 씀.

## 4 실험 결과

#### Longest6 Benchmark Results
| Method | DS ↑ | RC ↑ | IS ↑ | Ped ↓ | Veh ↓ | Stat ↓ | Red ↓ | OR ↓ | Dev ↓ | TO ↓ | Block ↓ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | 
| WOR | 20.53±3.12 | 48.47±3.86 | **0.56**±0.03 | 0.18 | 1.05 | 0.37 | 1.28 | 0.47 | 0.88 | 0.08 | 0.20 |
| Latent TransFuser (Ours)| 37.31±5.35 | **95.18**±0.45 | 0.38±0.05 | **0.03** | 3.66 | 0.18 | 0.13 | **0.04** | **0.00** | 0.12 | **0.05** |
| LAV | 32.74±1.45 | 70.36±3.14 | 0.51±0.02 | 0.16 | **0.83** | 0.15 | 0.96 | 0.42 | 0.06 | 0.12 | 0.45 |
| Late Fusion (LF) | 22.47±3.71 | 83.30±3.04 | 0.27±0.04 | 0.05 | 4.63 | 0.28 | **0.11** | 0.48 | 0.02 | 0.11 | 0.21 |
| Geometric Fusion (GF) | 27.32±0.80 | 91.13±0.95 | 0.30±0.01 | 0.06 | 4.64 | 0.17 | 0.13 | 0.48 | **0.00** | **0.05** | 0.11 |
| TransFuser (Ours) | **47.30**±5.72 | 93.38±1.20 | 0.50±0.06 | **0.03** | 2.45 | **0.07** | 0.16 | **0.04** | **0.00** | 0.06 | 0.10 | 
| Expert | 76.91±2.23 | 88.67±0.56 | 0.86±0.03 | 0.02 | 0.28 | 0.01 | 0.03 | 0.00 | 0.00 | 0.08 | 0.13 |

Latent TransFuser는 RC에서 최고 성능을 보였고 이것은 저수준 제어 명령을 위한 inverse dynamics model(PID Controller) 덕분인 것 같다. 반면 WOR 제어기는 follow lane, turn left/right, change lane left/right와 같은course navigational command를 가지고 discrete action space로부터 output action을 선택한다. 이 결과로 TransFuser의 아키텍처는 LiDAR가 없는 상황에서도 좋은 성능을 보이며 강력한 베이스라인이 된다는 것을 의미한다. 심지어 LTF는 LiDAR가 없음에도 LF와 GF보다 더 좋은 주행 점수를 보여준다.

TransFuser는 주행 점수에서 가장 좋은 성능을 보였고 LF, GF 대비 큰 차이를 보였다. Veh에서의 TF 성능이 LAV보다 낮은데, lane merging 상황에서 많은 vehicle collision이 발생했다. GF는 LF 대비 성능이 더 나았으나 여전히 IS에서는 저조한 성적을 보였다. 이것에 대한 가설로 이런 결과를 보이는 이유는 global contextual reasoning의 부재일 것으로 추측한다.

- 한계: 높은 RC를 가지는 모델들은 하나같이 Veh에서 부진하다. 이런 충돌은 주로 비보호 턴과 차선 변경에서 발생했다.

#### Runtime
| Method | Single Model [ms/frame] | Ensemble (3) [ms/frame] |
| --- | --- | --- |
| Latent Fusion (LF) | 23.5 | 46.7 |
| Geometric Fusion (GF) | 43.5 | 69.1 |
| TransFuser(Ours) | 27.6 | 59.6 |

Runtime 평가는 RTX 3090 한 장으로 평가 루트의 모든 타임 스텝을 평균하여 측정함. 이 runtime에는 data-preprocessing, model inference와 PID Control을 포함하며 LF 대비 17%-28% 낮은 성능을 보이나 단일 모델은 여전히 이 HW에서 real-time으로 동작할 수 있다. GF는 image 토큰과 LiDAR 토큰 간의 상관관계를 찾는데 추가적인 시간이 소요되므로 더 간단한 매커니즘에도 불구하고 runtime 성능에서 GF가 불리하였다.

#### Leaderboard Results
| Method | LiDAR? | DS ↑ | RC ↑ | IS ↑ |
| --- | --- | --- | --- | --- |
| NEAT | - | 21.83 | 41.71 | 0.65 |
| MaRLn | - | 24.98 | 46.97 | 0.52 |
| WOR | - | 31.37 | 57.65 | 0.56 |
| GRIAD | - | 36.79 | 61.86 | 0.60 |
| Latent TransFuser (Ours) | - | 45.20 | 66.31 | **0.72** |
| Late Fusion (LF) | ✓ | 26.07 | 64.67 | 0.47 |
| Geometric Fusion (GF) | ✓ | 41.70 | 87.85 | 0.47 |
| TransFuser (Ours) | ✓ | 61.18 | 86.69 | 0.71 |
| LAV | ✓ | **61.85** | **94.46** | 0.64 |

- Non-LiDAR Methods: CARLA의 100개의 secret route를 기준으로 성능을 평가한 결과 모델 별로 위와 같은 성능이 나왔다. LiDAR를 사용하지 않는 모델 중에서 Ours가 가장 높은 성능을 보였으며 DS 기준 그 다음으로 좋은 성능을 보인 모델보다 거의 10포인트 넘게 차이났다. 심지어 그 모델(GRIAD)은 강화학습 기반으로 복잡한 과정을 거쳐 200배 더 많은 학습 데이터로 학습된 모델의 결과지만 우리의 Latent TransFuser는 상대적으로 간단하고 적은 데이터로 IL을 기반으로 학습된 모델이다.

- LiDAR-based Methods: global attention을 수행한 Ours는 IS에서 가장 높은 점수를 얻었다. LAV가 Ours보다 DS에서 0.67만큼의 점수를 더 얻었지만 이것은 evaluation variance(같은 모델을 반복 평가할 때마다 점수가 달라지는 정도)안에 들어오는 것처럼 보인다. LAV는 그 근소한 점수를 얻기 위해 복잡한 학습 과정과 몇 개의 pretrained modular component에 knowledge distillation까지 수행된 반면 Ours는 straightforward한 single-stage IL 학습 절차로 SOTA 수준의 결과를 달성했다.

#### Attention Statistics and Visualizations
전역적으로 어텐션을 모달리티를 넘어가며 수행하는 것을 표와 그림으로 제시한다. 초기 레이어 1, 2에서는 LiDAR는 image를 참조하지 않고 3, 4레이어에서 이미지를 참조하기 시작한다.

#### Global Safety Heuristic
creeping과 safety heuristic 같은 규칙이 성능에 크게 영향을 주고, 특히 Longest6에서 조정한 규칙은 leaderboard에서 역효과를 냈다. 다만 비교 모델들도 같은 규칙을 써서 구조 간 비교는 유효하다.

Seed Variance에 대해서 강력히 주장하는 바가 있는데, 시드에 따라 성능이 천차만별로 변하며 심지어 LTF가 TF를 이기는 결과를 만들기도 한다. 이것의 이유는 학습 분산과 평가 분산이 있으며 평가 분산이 주된 원인으로 보지만 두 가지의 요인 다 무시할 수 없는(considerable) 수준이다. 따라서 앞으로의 연구는 학습 시드를 바꿔가며 결과를 보고해야 하고 최고 시드나 앙상블 결과는 그것에 더해 보고해야 한다.

#### Ablation Studies
Ablation Studies에서 많은 것들을 이야기하고 있지만, 그 중에 눈에 띄는 부분은 아래와 같다.
- Attention layer를 깊게 쌓으면 더 복잡한 관계를 표현할 수 있을 것으로 기대할 수 있지만 2, 6, 8 layer 모두 default config(4 layer)의 시드 범위 안에 들어와 주행 점수에서 유의미한 차이가 없었다. 즉, 2 layer 정도로 얕게 쌓아도 충분한 성능을 보인다.
- CNN 백본으로 무엇을 선택하냐에 따라서 성능이 극명하게 갈린다.
- Rasterized Goal과 Rotation Augmentation은 모델 성능에 영향을 거의 주지 않는다.
- 우리 모델은 속도를 모델에 input하지 않았지만 여전히 inertia problem이 발생했다. 이것은 속도 이면에 데이터 뷸균형과 같은 다른 요인들로 인해서 inertia problem이 발생하는 것으로 보인다. 왜냐하면 creeping을 주었을 때 ours의 주행 점수가 크게 올랐기 때문에 속도 입력을 주지 않았음에도 여전히 멈추어 있을 때는 계속 멈춰있으려고 하는 경향을 보이기 때문이다.
- 모델에 속도 입력을 주면 모델의 성능이 급격하게 떨어진다.
- Camera의 FOV에 따라 주행 성능이 크게 차이가 난다. 시야각이 좁을 수록 주행 성능이 크게 떨어진다.
- Aux. task 중 하나를 없애는 것은 모델에 큰 영향을 미치지 않는다. 

## 5 결론과 한계
#### 결론
- ### Conclusion
기존 센서 퓨전 방식에 기반한 IL 정책이 교통이 복잡한 상황에서 위반이 많다는 점을 보이고, 이를 해결하기 위해 attention으로 3D 장면의 전역적 맥락을 포착하는 TransFuser를 제안했다. TransFuser는 주변 차량과 신호등에 주목하며 위반을 크게 줄였고 벤치마크에서 높은 성능을 보여주었다. 방법이 단순하고 범용적이므로 레이더 같은 다른 센서나 다른 embodied AI 과제로도 확장할 수 있을 것이라 기대한다. 또한 긴 경로와 밀집 교통으로 구성된 Longest6 벤치마크가 평가 시간이 제한된 CARLA leaderboard 대신 ablation과 상세 분석에 활용되기를 바란다고 밝힌다.

#### 한계
- 우리는 간단한 inertia problem 솔루션(creeping)을 보여줬지만 이것에 더 많은 연구가 필요하다.
- 차량 후방 데이터 부재로 차선 변경에 불리하다.
- single time step input만 사용. 교차로에서 차량 충돌을 막기 위해 temporal input을 통해 다른 트래픽들의 가속도와 속도를 추정하는 것이 불가피해 보인다.
- driving performance에 latency에 대한 것이 고려되지 않았다.
- 연구는 simulation에서만 수행되었고 real world 데이터나 주행에 대해서는 수행되지 않았다.

## 6 리뷰

#### 느낀점
TABLE 1과 3에서 single-stage IL 학습만으로 TransFuser가 SOTA급의 성능을 보인 것이 놀라웠다. 특히 Longest6 대비 Leaderboard에서 LTF의 IS 성능이 TF와 동일한 수준을 보이는 것이 인상깊었는데, 

#### 주장의 타당성
저자가 supplementary에서 암시하듯 LAV와의 직접적인 비교를 통해 TransFuser의 attention fusion이 효과적인 방법이라고 주장하는 것은 어려우나 학습 절차가 비교적으로 단순했다는 점을 고려했을 때 TransFuser 시스템 자체는 학습 난이도 대비 강력한 성능을 보인다고 주장할 수 있다.

시스템 단위가 아니라 attention fusion 자체가 효과적인 방법인지 알기 위해서는 LF와 GF의 성능과 비교하면 알 수 있을 것이다. 실제로 TF는 LF, GF 대비 큰 성능의 차이를 보여주었다. 뿐만 아니라 저자의 supplementary의 LTF ablation에서 transformer fusion을 MLP로 구조를 바꾸었을 때 DS가 10%p 이상 하락했다고 보고한 것도 attention fusion이 효과적인 방법이라는 것을 뒷받침한다. 다만 LF와 GF의 하이퍼파라미터가 TF에 최적화된 하이퍼파라미터를 물려받았다면 해당 baseline에 대한 벤치마크 점수들은 과소평가 되어 성능 향상 폭이 과대평가 되었을 수도 있다. 또한 Safety Heuristic을 바꾸는 것만으로도 주행 점수에서 최대 약 9%p까지 차이가 발생하기 때문에 TransFuser의 성능 향상에 attention fusion이 **얼마나 크게 기여했는지 파악하기 어려운** 부분이 있다.

또한 Table 1에서 LF, GF 대비 Veh, Stat, OR에 TF의 큰 성능 향상이 있었는데, infraction 별로 어떤 상황에서 사고가 발생하였는지, 그리고 그 사고가 왜 발생하였는지에 대한 분석이 이루어졌더라면 주장을 더 공고히 할 수 있을 것 같다. 만약 예를 들어 Veh 안에서도 차선 변경 중에는 LF, GF 대비 눈에 띄는 성능 향상은 보이지 않았으나 비보호 좌회전 중 사고가 눈에 띄게 줄었고, **attention fusion을 통해 서로 멀리 떨어진 물체를 attention했기 때문에 사고가 줄었다는 결과까지 보여줬더라면** attention fusion의 기여를 더 직접적으로 체감할 수 있을 것이다.

결론에서 저자들은 모델이 dynamic agent와 traffic light에 주목한 것이 infraction 감소와 높은 성능으로 이어졌다고 설명하지만, traffic light에 주목한 덕분이라는 근거는 데이터에서 확인하기 어려웠다. Longest6에서 TransFuser의 신호 위반(Red)은 0.16으로 LF(0.11), GF(0.13)보다 오히려 약간 많았고, infraction 감소는 차량 충돌에서 큰 비중을 차지한다. 따라서 벤치마크를 기반으로 보았을 때 신호등에 대한 주목이 성능 향상의 원인이라고 주장하기는 어려워 보인다.

#### 한계
- TABLE 5와 10에 따르면 Inertia Problem 설정과 Safety Heuristic 방식에 따라 성능이 크게 바뀌므로 저자도 언급햇듯이 시스템 단위의 안전성을 끌어올리기 위해서 이것들에 대한 연구가 필수적이다.

- 저자가 밝혔듯이 temporal input을 통해 dynamic agent들의 가속도와 속도를 추정하여 unprotected turn 같은 상황에서 vehicle collision을 낮출 수 있는 여지가 있어 보인다. 실제로 가장 두드러지는 infraction은 vehicle collision에서 두각을 나타냈고 그것의 원인으로 차선 변경과 unprotected turn에 대해 지목했기 때문이다. 반면 historical observation에서 ego 자신의 과거 움직임까지 함께 들어가 shortcut learning이 발생하는 것을 막기 위한 조치는 필수적일 것으로 보인다. 실제로 ego 속도를 입력에 넣은 ablation에서 성능이 크게 떨어졌다. 결국 다른 차량의 움직임 정보는 살리면서 ego의 과거 행동 정보는 배제하는 방법이 필요해 보인다.

#### 내 연구와의 관계
VLA: VLA는 Vision 토큰과 Language 토큰을 한 시퀀스에 넣고 VLM으로 섞는다는 점에서 TransFuser와 유사한 메커니즘으로 동작한다는 것을 깨달았다. TransFuser 공저자인 Katrin Renz는 이후 VLA 연구를 이끌었다. CarLLaVA(2024)에서 LLaVA VLM의 비전 인코더와 LLaMA 구조를 백본으로 썼고, camera-only로 CARLA에서 최고 수준의 closed-loop 주행 성능을 냈다.

Forecasting & Control: forecasting & safety heuristic을 잘 짜면 camera-only 자율주행에서 많이 걱정하는 LiDAR 부재에서 오는 안전 문제를 상당 부분 해소할 수 있는지 검증하는 것도 흥미로운 연구가 될 것 같다.

#### 해결되지 않은 질문
- FOV 132°(704 × 160)를 선택한 이유.
- FOV ablation으로 더 좁은 쪽(120°, 90°)만 실험했고, 더 넓은 FOV(실험 조건 상 최대 180°)는 검증하지 않은 이유.
- 백본으로 RegNet 계열을 후보에 두게 된 이유.