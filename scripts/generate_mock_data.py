import os
import json
import random
from datetime import datetime, timedelta

AREAS = {
  'biwako': { 'name': '琵琶湖', 'lat': 35.15, 'lon': 135.98 },
  'kasumigaura': { 'name': '霞ヶ浦', 'lat': 35.95, 'lon': 140.35 },
  'yodogawa': { 'name': '淀川', 'lat': 34.75, 'lon': 135.53 },
  'fujigoko': { 'name': '富士五湖', 'lat': 35.48, 'lon': 138.75 },
  'takayama': { 'name': '高山ダム', 'lat': 34.77, 'lon': 136.03 },
  'awaji': { 'name': '淡路島野池群', 'lat': 34.40, 'lon': 134.80 },
  'fuchuko': { 'name': '府中湖', 'lat': 34.25, 'lon': 133.94 }
}

CATEGORIES = [
  'クランクベイト', 'スピナーベイト', 'ミノー・シャッド',
  'バイブレーション', 'トップウォーター', 'テキサスリグ',
  'ラバージグ', 'ダウンショット', 'ネコリグ', 'ノーシンカー', 'その他'
]
LURES = {
  'クランクベイト': ['MKZ60', 'ワイルドハンチ', 'ピーナッツII', 'ブリッツ'],
  'スピナーベイト': ['デラクー', 'D-ZONE', 'クリスタルS', 'ハイピッチャー'],
  'ミノー・シャッド': ['阿修羅', 'ルドラ', 'ソウルシャッド'],
  'バイブレーション': ['ザリバイブ Jr.', 'TN60', 'レベルバイブ'],
  'トップウォーター': ['ポンパドール', 'バズベイト', 'ポップX'],
  'テキサスリグ': ['ベローズギル2.8', 'ドライブビーバー', 'エスケープツイン'],
  'ラバージグ': ['AKジグ', 'キャスティングジグ', 'フットボールジグ'],
  'ダウンショット': ['レッグワーム2.5', 'HPシャッドテール', 'カットテール'],
  'ネコリグ': ['DB UMA FREE 3.8', 'スワンプクローラー', 'レインズスワンプ'],
  'ノーシンカー': ['ヤマセンコー', 'イモグラブ', 'ファットイカ'],
  'その他': ['KDトリッカー', 'アラバマ']
}

WINDS = ['北', '北東', '東', '南東', '南', '南西', '西', '北西', '無風']
CONDITIONS = ['日中', '朝マズメ', '夕マズメ', 'ローライト']

# ======================================================================
# ジャンルごとの特徴をリアルなバス釣りの感覚に合わせて定義
# weathers/winds/conds: 重複させることで出現確率に重み付けする
# temp_range/water_range: そのルアーが効く季節の気温・水温帯
# ======================================================================
GENRE_TRAITS = {
  'ダウンショット': {
    'weathers': ['晴れ', '曇り', '雨', '晴れ', '曇り'],  # オールウェザー、雪なし
    'winds': WINDS,
    'conds': CONDITIONS,
    'temp_range': (10, 30), 'water_range': (10, 26)
  },
  'クランクベイト': {
    'weathers': ['曇り', '雨', '曇り', '雨', '曇り'],
    'winds': ['西', '北西', '南東', '東', '西'],
    'conds': ['朝マズメ', 'ローライト', '日中', '夕マズメ'],
    'temp_range': (14, 25), 'water_range': (14, 22)
  },
  'スピナーベイト': {
    'weathers': ['曇り', '雨', '曇り', '雨'],
    'winds': ['西', '北西', '南西', '西', '北西'],
    'conds': ['朝マズメ', '夕マズメ', 'ローライト'],
    'temp_range': (12, 24), 'water_range': (13, 22)
  },
  'トップウォーター': {
    'weathers': ['晴れ', '曇り', '晴れ'],
    'winds': ['無風', '南', '無風', '無風'],
    'conds': ['朝マズメ', '夕マズメ', '朝マズメ'],
    'temp_range': (22, 33), 'water_range': (22, 28)
  },
  'バイブレーション': {
    'weathers': ['晴れ', '曇り', '晴れ'],
    'winds': ['北', '北西', '北', '北西'],
    'conds': ['日中', '朝マズメ', '日中'],
    'temp_range': (5, 15), 'water_range': (6, 14)
  },
  'テキサスリグ': {
    'weathers': ['晴れ', '曇り', '晴れ', '晴れ'],
    'winds': WINDS,
    'conds': ['日中', '日中', '日中', '夕マズメ'],
    'temp_range': (18, 30), 'water_range': (18, 26)
  },
  'ラバージグ': {
    'weathers': ['曇り', '晴れ', '曇り'],
    'winds': ['南西', '西', '北西', '南', '東'],
    'conds': ['日中', '夕マズメ', '日中'],
    'temp_range': (12, 25), 'water_range': (12, 22)
  },
  'ミノー・シャッド': {
    'weathers': ['曇り', '晴れ', '曇り'],
    'winds': ['北', '北西', '北', '北西'],
    'conds': ['朝マズメ', '日中', '夕マズメ'],
    'temp_range': (5, 16), 'water_range': (6, 15)
  },
  'ネコリグ': {
    'weathers': ['晴れ', '曇り', '晴れ', '曇り', '雨'],
    'winds': WINDS,
    'conds': CONDITIONS,
    'temp_range': (10, 28), 'water_range': (10, 24)
  },
  'ノーシンカー': {
    'weathers': ['晴れ', '曇り', '晴れ'],
    'winds': ['無風', '無風', '無風', '南'],
    'conds': ['日中', '夕マズメ', '日中'],
    'temp_range': (20, 30), 'water_range': (18, 26)
  },
  'その他': {
    'weathers': ['晴れ', '曇り', '雨'],
    'winds': WINDS,
    'conds': CONDITIONS,
    'temp_range': (10, 28), 'water_range': (10, 24)
  }
}

screenshots_dir = "./screenshots"
image_files = [f for f in os.listdir(screenshots_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]

new_entries = []
for filename in image_files:
    area_id = random.choice(list(AREAS.keys()))
    
    # ダウンショットを全体の約30〜35%に
    if random.random() < 0.33:
        cat = 'ダウンショット'
    else:
        cat = random.choice(CATEGORIES)
        
    lure = random.choice(LURES[cat])
    traits = GENRE_TRAITS.get(cat, GENRE_TRAITS['その他'])
    
    random_days = random.randint(0, 700)
    d = datetime(2023, 1, 1) + timedelta(days=random_days)
    
    # トレイトに95%準拠（特徴がはっきり出る）
    w = random.choice(traits['weathers']) if random.random() < 0.95 else random.choice(['晴れ', '曇り', '雨'])
    wind = random.choice(traits['winds']) if random.random() < 0.95 else random.choice(WINDS)
    cond = random.choice(traits['conds']) if random.random() < 0.95 else random.choice(CONDITIONS)
    
    t_lo, t_hi = traits['temp_range']
    w_lo, w_hi = traits['water_range']
    temp = random.randint(t_lo, t_hi)
    waterTemp = random.randint(w_lo, w_hi)
        
    lat_offset = random.uniform(-0.05, 0.05)
    lng_offset = random.uniform(-0.05, 0.05)
    
    entry = {
        "date": d.strftime("%Y-%m-%d"),
        "area": area_id,
        "lureName": lure,
        "category": cat,
        "size": random.randint(20, 55),
        "weather": w,
        "windDir": wind,
        "temp": temp,
        "waterTemp": waterTemp,
        "condition": cond,
        "lat": round(AREAS[area_id]['lat'] + lat_offset, 5),
        "lng": round(AREAS[area_id]['lon'] + lng_offset, 5),
        "image": filename
    }
    new_entries.append(entry)

new_entries.sort(key=lambda x: x['date'], reverse=True)

with open('./catch_history_1200.json', 'w', encoding='utf-8') as f:
    json.dump(new_entries, f, ensure_ascii=False, indent=2)

print(f"Generated {len(new_entries)} records. Total: {len(new_entries)}.")
