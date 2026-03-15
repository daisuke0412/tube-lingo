---
name: dev_api
description: FastAPI バックエンド実装スキル。API設計書・プロンプト設計書に基づき、routers・services を実装する。「APIを実装して」「バックエンドを作って」「FastAPIを実装して」と言われた場合に使用する。
---

# FastAPI バックエンド実装スキル

## 概要
API設計書（`docs/designs/apis/`）とプロンプト設計書（`docs/designs/prompts/`）に基づき、
FastAPI の routers・services を実装する。

---

## Step 1: 設計書の確認
1. 対応する API 設計書（`docs/designs/apis/a{XX}-*.md`）を読み、以下を把握する：
   - エンドポイント・HTTPメソッド・パス
   - リクエスト（パラメータ / ヘッダー / ボディ）の型定義
   - レスポンスの型定義（通常 JSON または SSE）
   - エラーレスポンスの一覧（HTTPステータス・エラーコード・発生条件）
   - 処理フロー（router → service の流れ）
2. AI 呼び出しを含む API の場合はプロンプト設計書（`docs/designs/prompts/p{XX}-*.md`）を読み、以下を把握する：
   - システムプロンプトのテンプレートと埋め込みパラメータ
   - messages 配列の構築方法（初回 / 追加質問の分岐）
3. `docs/guides/guides.md` のバックエンドディレクトリ構成・コーディング規約を確認する

---

## Step 2: Pydantic モデル定義
1. リクエスト / レスポンスの型を Pydantic v2 モデルで定義する
2. 配置場所は `backend/app/routers/<name>.py` 内、またはモデルが複数ファイルで共用される場合は `backend/app/models.py` に切り出す
3. フィールドには型ヒントと必要に応じて `Field(description=...)` を付与する

---

## Step 3: service 実装
1. `backend/app/services/<name>.py` にビジネスロジックを実装する
2. プロンプトを使う場合は `backend/app/prompts/*.txt` からファイルを読み込み、パラメータを埋め込む
3. 処理フローに従い、外部 API 呼び出し（youtube-transcript-api / Anthropic SDK）を実装する
4. **セキュリティ原則を厳守する：**
   - `x-api-key` はリクエスト処理中のみ使用し、ログ・変数キャッシュに残さない
   - Anthropic SDK 呼び出し後にキーがスコープを外れることを確認する
5. SSE ストリーミングの場合は `AsyncGenerator` で `yield` する形式で実装する
6. エラーハンドリングは API 設計書のエラーレスポンス表に従い、`HTTPException` を raise する

---

## Step 4: router 実装
1. `backend/app/routers/<name>.py` にエンドポイントを定義する
2. router は薄いラッパーとし、バリデーション後に service を呼び出すだけにする
3. SSE の場合は `StreamingResponse(media_type="text/event-stream")` を返す
4. `backend/app/main.py` に router を登録する

---

## Step 5: 動作確認
1. `uvicorn app.main:app --reload --port 8000` でバックエンドサーバーを起動する
2. curl または httpie で各エンドポイントを叩いて動作確認する：

```bash
# A-01: 字幕取得
curl "http://localhost:8000/api/transcript?url=https://www.youtube.com/watch?v=xxxx"

# A-02: AI解説（SSE）
curl -X POST "http://localhost:8000/api/explain" \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ant-..." \
  -d '{"selected_text":"...", "context_lines":[...], "user_message":"...", "chat_history":[]}'
```

3. 正常系・異常系（不正URL / APIキーなし / 字幕なし等）をそれぞれ確認する

---

## 完了条件
- [ ] API 設計書の処理フロー通りに router → service が実装されている
- [ ] Pydantic モデルでリクエスト / レスポンスの型が定義されている
- [ ] エラーレスポンスが設計書の表と一致している（HTTPステータス・エラーコード）
- [ ] APIキーがログ・キャッシュに残らないことを確認している
- [ ] SSE ストリーミングが `data: [DONE]` で正しく終了する
- [ ] `backend/app/main.py` に router が登録されている
- [ ] 正常系・異常系の動作確認が完了している
