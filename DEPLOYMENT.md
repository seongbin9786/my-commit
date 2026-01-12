# My Time - AWS 배포 가이드

이 문서는 My Time 프로젝트의 AWS 배포를 위한 가이드입니다.
도메인과 인증서를 미리 준비하고, 실제 프로덕션 환경(커스텀 도메인 포함)으로 배포하는 절차를 안내합니다.

---

## 1. 사전 준비

### 1단계: 배포용 IAM 사용자 생성

Root 계정 대신 배포 전용 IAM 사용자를 사용해야 합니다.

1. AWS Console > IAM > 사용자 생성 (`my-time-deployer`)
2. 권한 설정 선택: "직접 정책 연결(Attach policies directly)"
3. 다음 권한 정책들을 검색하여 체크:
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`
   - `AmazonAPIGatewayAdministrator`
   - `AWSLambda_FullAccess`
   - `AWSCloudFormationFullAccess`
   - `AmazonDynamoDBFullAccess`
   - `AmazonSSMFullAccess` (Serverless Framwork가 환경 설정 값 관리 시 사용)
   - `IAMFullAccess` (Serverless Framework가 IAM Role을 생성)

### 2단계: AWS CLI 설정

IAM 사용자의 Key, Access Key를 등록

```bash
brew install awscli
aws configure
```

### 3단계: 도메인 및 인증서 준비 (가장 중요)

배포 전에 사용할 도메인을 확보하고, AWS ACM에서 SSL 인증서를 미리 발급받아야 합니다.

필요한 인증서 (총 2개):

1. 백엔드용 (서울 리전)
   - 리전: Asia Pacific (Seoul) `ap-northeast-2`
   - 도메인 이름: `*.yourdomain.com` (와일드카드 권장) 또는 `api.yourdomain.com`
   - 검증: DNS CNAME 레코드를 도메인 관리 사이트(가비아 등)에 등록하여 '발급됨(Issued)' 상태여야 함.

2. 프론트엔드용 (버지니아 리전)
   - 리전: US East (N. Virginia) `us-east-1` (CloudFront 필수 요건)
   - 도메인 이름: `*.yourdomain.com` 또는 `www.yourdomain.com`
   - 검증: 마찬가지로 DNS 검증 완료하여 '발급됨(Issued)' 상태여야 함.

---

### 4단계: 백엔드 설정 (설정 확인)

`apps/api/serverless.example.yml`을 `apps/api/serverless.yml`로 복사하고, 도메인을 설정합니다.

1. 설정 파일 생성:

   ```bash
   cp apps/api/serverless.example.yml apps/api/serverless.yml
   ```

2. `apps/api/serverless.yml` 수정:
   - `customDomain` 섹션의 `domainName`과 `certificateName`을 본인의 도메인(`yourdomain.com`)에 맞게 수정하세요.

   ```yaml
   custom:
     customDomain:
       domainName: api.yourdomain.com # 실제 사용할 API 도메인
       certificateName: "*.yourdomain.com" # ACM에 있는 인증서 도메인명
       # ...
   ```

3. (자동 설정) `serverless-domain-manager` 플러그인이 `package.json`에 포함되어 있습니다.

   ```yaml
   plugins:
     - serverless-domain-manager

   custom:
     customDomain:
       domainName: api.yourdomain.com # 실제 사용할 API 도메인
       certificateName: "*.yourdomain.com" # ACM에 있는 인증서 도메인명
       basePath: ""
       stage: ${self:provider.stage}
       createRoute53Record: false # 외부 DNS 사용 시 false
       endpointType: "regional"
   ```

---

## 2. 백엔드 배포 (Backend Deployment)

### 2-1. 환경 변수 설정

```bash
export JWT_SECRET="your-secure-random-key"
```

### 2-2. 배포 실행

도메인을 먼저 생성하고 배포를 진행합니다.

```bash
# 1. 의존성 설치
pnpm install

# 2. AWS에 도메인 리소스 생성 (최초 1회 필수)
# 설명: API Gateway에 커스텀 도메인(api.yourdomain.com)을 등록하고 ACM 인증서와 연결하는 작업입니다.
# 약 20~40분 소요될 수 있습니다. (이미 생성되어 있다면 안전하게 무시됩니다)
pnpm --filter my-time-api sls:create-domain

# 3. 백엔드 배포
pnpm deploy:api:prod
```

배포가 완료되면 `https://api.yourdomain.com` 주소로 API 접속이 가능해집니다.

---

## 3. 프론트엔드 배포

### 3-1. 환경 변수 설정

이제 백엔드 도메인(`api.yourdomain.com`)을 알고 있으므로 바로 설정합니다.

`apps/web/.env.production`:

```bash
VITE_API_URL=https://api.yourdomain.com
```

### 3-2. 배포 실행

```bash
pnpm deploy:web:prod
```

### 3-3. CloudFront 도메인 연결

배포된 CloudFront에 도메인을 연결합니다.

1. AWS Console > CloudFront > 배포 선택 > [편집]
2. 대체 도메인 이름(CNAMEs): `www.yourdomain.com` 입력
3. 사용자 정의 SSL 인증서: `us-east-1`에서 발급받은 ACM 인증서 선택
4. 저장

---

## 4. 최종 DNS 연결

모든 배포가 끝났습니다. 외부 DNS 관리 페이지(가비아 등)에서 실제 트래픽을 연결해줍니다.

| 타입  | 호스트 | 값 (Target)             | 설명                                 |
| ----- | ------ | ----------------------- | ------------------------------------ |
| CNAME | api    | `d-xxxx.execute-api...` | API Gateway 배포 후 확인된 원본 주소 |
| CNAME | www    | `dxxxx.cloudfront.net`  | CloudFront 배포 후 확인된 원본 주소  |

설정이 전파되면(최대 1시간) `https://www.yourdomain.com`으로 서비스 이용이 가능합니다. 🚀
