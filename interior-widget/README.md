# 인테리어 프로젝트 위젯

Notion의 공정관리 DB를 읽어 D-Day, 다음 공정, 진행률, 오늘의 공정을 보여 주는 작은 임베드 위젯입니다. Notion 비밀키는 브라우저에 노출되지 않고 Vercel의 서버 함수에서만 사용됩니다.

## 파일 역할

| 파일 | 역할 |
| --- | --- |
| `index.html` | 위젯의 화면 뼈대 |
| `style.css` | 카드 디자인과 색상 변수 |
| `script.js` | 날짜·다음 공정·진행률 계산 및 화면 표시 |
| `api/project.js` | 프로젝트 설정 DB에서 착공일을 읽는 안전한 서버 API |
| `api/processes.js` | 공정관리 DB에서 공정 목록을 읽는 안전한 서버 API |
| `api/notion.js` | Notion API 연결에 공통으로 쓰는 코드 |
| `.env.example` | 비밀값을 넣을 환경변수 양식 |

## 1. 먼저 화면 보기

가장 쉬운 방법은 `index.html` 파일을 브라우저로 여는 것입니다. API가 없는 로컬 미리보기에서는 `script.js`의 `DEMO_DATA`가 표시됩니다. VS Code를 쓴다면 **Live Server** 확장 프로그램으로 `index.html`을 열어도 됩니다.

색상은 `style.css` 맨 위의 `:root` 안에서 바꿉니다. 예를 들어 `--accent`는 진행 막대와 목록 점의 색입니다. 완료 상태명이 `완료`가 아니라면 `script.js`의 `SETTINGS.completedStatus`를 바꾸세요.

## 2. Notion Integration 만들기

1. [Notion Integrations](https://www.notion.so/profile/integrations)에서 **New integration**을 누릅니다.
2. 이름을 정하고 연결할 워크스페이스를 선택한 뒤 저장합니다.
3. **Internal Integration Secret**을 복사합니다. 이 값은 절대 `script.js`나 GitHub에 넣지 않습니다.
4. Notion에서 `공정관리 DB`와 `프로젝트 설정 DB`를 각각 엽니다. 우측 상단 `···` → **Connections** → 만든 Integration을 찾아 연결합니다.
5. 각 DB의 URL에서 긴 32자리 문자열을 복사합니다. `?v=` 앞의 값이 Database ID입니다.

이 프로젝트는 다음 속성 이름을 정확히 사용합니다.

- 프로젝트 설정 DB: `예상 착공일` (날짜)
- 공정관리 DB: `순서` (숫자), `공정명` (제목 또는 텍스트), `표시태그` (텍스트/선택), `상태` (상태/선택), `시공 기간` (날짜 범위)

속성 이름이 다르면 `api/project.js`와 `api/processes.js` 안의 대괄호 속 이름을 Notion DB에 맞게 수정하세요.

## 3. 로컬에서 Notion 연결하기

Node.js 18 이상과 Vercel CLI가 필요합니다.

```bash
cd interior-widget
npm install
npm install --global vercel
cp .env.example .env.local
```

`.env.local`을 열어 세 값에 실제 비밀값과 DB ID를 입력한 후 실행합니다.

```bash
npm run dev
```

터미널에 표시되는 주소(보통 `http://localhost:3000`)를 브라우저에서 엽니다. 오류가 나면 브라우저 개발자 도구 Console과 터미널 오류를 확인하세요. API는 5분 동안 캐시되어 Notion 호출을 줄입니다.

## 4. GitHub에 올리기

GitHub에서 빈 저장소를 만든 뒤, 이 폴더에서 아래를 실행합니다. `.env.local`은 `.gitignore`에 포함되어 올라가지 않습니다.

```bash
git init
git add .
git commit -m "Add interior project widget"
git branch -M main
git remote add origin https://github.com/사용자이름/저장소이름.git
git push -u origin main
```

## 5. Vercel 배포 및 Notion 임베드

1. [Vercel](https://vercel.com/new)에 로그인하고 GitHub 저장소를 Import합니다.
2. 프로젝트의 Root Directory를 `interior-widget`로 지정합니다.
3. **Environment Variables**에 `NOTION_TOKEN`, `NOTION_PROJECT_DATABASE_ID`, `NOTION_PROCESS_DATABASE_ID` 세 값을 추가합니다.
4. Deploy를 누릅니다. 배포 후 환경변수를 바꿨다면 **Redeploy**합니다.
5. 생성된 `https://...vercel.app` 주소를 복사합니다.
6. Notion 페이지에서 `/embed`를 입력하고 주소를 붙여넣습니다. 카드 폭은 약 340px로 잡고, Notion에서 블록 폭을 조절하면 됩니다.

## 동작 규칙

- 날짜는 `Asia/Seoul` 기준으로 계산하여 자정에 날짜가 바뀌어도 하루가 밀리지 않습니다.
- NEXT는 완료되지 않았고 종료일이 오늘 이후인 공정 중 시작일이 가장 이른 공정입니다.
- TODAY는 오늘이 시작일과 종료일 사이에 있는 모든 공정을 표시합니다.
- 진행률은 `완료` 상태 공정 수 ÷ 전체 공정 수입니다.
