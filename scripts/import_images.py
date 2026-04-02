import os
import json

# =========================================================================
# 【釣れルンです】 釣果スクリーンショット一括移行スクリプト
# 
# 1200件の画像をGemini API (Vision)等に投げて一括解析し、
# アプリの CATCH_HISTORY にそのまま貼り付け可能な JSON を出力するスクリプトです。
#
# 前提環境: pip install google-generativeai
# =========================================================================

import hashlib

# 1. 画像の入っているフォルダを指定（相対パス）
INPUT_DIR = "./screenshots"
OUTPUT_FILE = "./catch_history_1200.json"

# APIキーの設定（環境変数から取得推奨、または直接記述）
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_API_KEY_HERE")

def get_file_hash(filepath):
    """重複排除のため、画像のバイナリデータからハッシュを計算します"""
    with open(filepath, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()

def setup_gemini():
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_API_KEY)
    # Vision機能を持つモデル（1.5 Pro等）を指定
    return genai.GenerativeModel('gemini-1.5-pro')

def analyze_image(model, image_path):
    print(f"解析中: {image_path}")
    """
    ここにGemini 1.5 Proなどを利用した画像解析ロジックが入ります。
    プロンプト例：
    「添付の釣果スクリーンショットから以下のJSONを出力してください。
    【重要】ルアーの分類（category）は、ルアー名を推測した上で以下のいずれかに厳格に分類してください：
    [クランクベイト, スピナーベイト, バイブレーション, チャターベイト, ダウンショット, ネコリグ, テキサスリグ, ミドスト, トップウォーター, その他]
    
    フォーマット:
    { "date": "YYYY-MM-DD", "area": "場所名", "lureName": "ルアー名", "category": "ルアー種類", "size": 数値, "weather": "天候", "windDir": "風向", "temp": 気温, "waterTemp": 水温, "condition": "風や季節" }」
    """
    # 疑似的なレスポンス（実際にはAPIからの返り値をパースします）
    # response = model.generate_content([prompt, image_blob])
    # return json.loads(response.text)
    
    return {
        "date": "2025-09-01",
        "area": "fuchuko",
        "lureName": "解析されたルアー名",
        "category": "クランクベイト",
        "size": 40,
        "weather": "晴れ",
        "condition": "秋"
    }

def main():
    if not os.path.exists(INPUT_DIR):
        print(f"エラー: {INPUT_DIR} フォルダが見つかりません。")
        return

    print("Gemini APIの初期化中...")
    # model = setup_gemini()
    model = None # モックのためNone

    results = []
    processed_hashes = set()
    
    # フォルダ内の画像を順番に処理
    for filename in os.listdir(INPUT_DIR):
        if filename.lower().endswith((".jpg", ".jpeg", ".png")):
            filepath = os.path.join(INPUT_DIR, filename)
            
            # 重複チェック（中身が全く同じ画像はスキップ）
            file_hash = get_file_hash(filepath)
            if file_hash in processed_hashes:
                print(f"[{filename}] は既に処理済みの重複画像のためスキップしました。")
                continue
            
            try:
                data = analyze_image(model, filepath)
                # deduplicationのためにハッシュを付与
                data["_hash"] = file_hash 
                processed_hashes.add(file_hash)
                results.append(data)
            except Exception as e:
                print(f"[{filename}] の解析中にエラーが発生しました: {e}")

    # 結果をJSONとして保存
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n完了！ {len(results)} 件の釣果データを {OUTPUT_FILE} に書き出しました。")
    print("このファイルの中身を app.js (または bundle.js) の CATCH_HISTORY に直接コピー＆ペーストしてください。")

if __name__ == "__main__":
    main()
