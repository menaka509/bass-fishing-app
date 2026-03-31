export const AREAS = [
  { id: 'biwako', name: '琵琶湖（滋賀）' },
  { id: 'kasumigaura', name: '霞ヶ浦（茨城）' },
  { id: 'yodogawa', name: '淀川（大阪）' },
  { id: 'fujigoko', name: '富士五湖（山梨）' },
  { id: 'takayama', name: '高山ダム（京都）' },
];

export const MOCK_WEATHER = {
  biwako: { temp: 18, desc: '曇りのち晴れ', wind: '北西 3m/s', waterTemp: 15.2, icon: 'cloud-sun' },
  kasumigaura: { temp: 22, desc: '晴れ', wind: '南東 5m/s', waterTemp: 18.1, icon: 'sun' },
  yodogawa: { temp: 24, desc: 'くもり', wind: '西 2m/s', waterTemp: 19.5, icon: 'cloud' },
  fujigoko: { temp: 12, desc: '雨', wind: '東 1m/s', waterTemp: 11.0, icon: 'cloud-rain' },
  takayama: { temp: 20, desc: '晴れ', wind: '無風', waterTemp: 16.8, icon: 'sun' },
};

export const MOCK_SPOTS = {
  biwako: { name: '南湖・ディープホール周辺', reason: '水温低下に伴い、バスが深場に落ちるタイミング。北西風をプロテクトできる西岸のブレイクラインが狙い目。' },
  kasumigaura: { name: '古渡エリア', reason: '南東風によるウィンディーサイド。ベイトフィッシュが寄せられ、バスの活性が高いシャローエリア。' },
  yodogawa: { name: '城北ワンド', reason: '手堅く水温が安定しているワンド内。プレッシャーは高いが、くもりで警戒心が少し和らいでいる。' },
  fujigoko: { name: '河口湖・溶岩帯', reason: '雨で水温が下がっているため、少しでも水温変化が少ないディープの溶岩帯やウィードエッジ。' },
  takayama: { name: '中流域・岩盤地帯', reason: '無風でベタ凪のため、カレント（流れ）が少し当たる岩盤や立木に浮くバスを狙う。' }
};

export const MOCK_PATTERNS = {
  biwako: [
    { rank: 1, title: 'ディープクランクによるボトムノック', desc: '水深3〜4mのブレイク沿いを急潜行クランクベイトでスピーディーに探る。リアクションバイト狙い。', tags: ['クランクベイト', '3-4m', 'リアクション'] },
    { rank: 2, title: 'ヘビーダウンショットリグ', desc: 'ブレイクの落ち込みに溜まるバスに対して、底質を感じながらスローに誘う。7g以上のシンカーを使用。', tags: ['ダウンショット', 'ボトム', '食わせ'] },
    { rank: 3, title: 'アラバマリグの中層引き', desc: 'ベイトの群れを演出。ブレイクの少し上を一定のレンジでトレースし、浮いているデカバスを狙う。', tags: ['アラバマ', '中層', 'デカバス'] }
  ],
  kasumigaura: [
    { rank: 1, title: 'スピナーベイトによる広範囲サーチ', desc: '風の当たるシャローのリップラップや葦際をテンポ良く巻く。風による波立ちで騙しやすい。', tags: ['スピナーベイト', 'シャロー', '強気'] },
    { rank: 2, title: 'チャターベイトでウィード狙い', desc: '少し沈んだハードボトムや残りウィードの上をかすめるように引く。濁りが入っているなら特に有効。', tags: ['チャターベイト', '波動', '濁り'] },
    { rank: 3, title: '高比重ワームのノーシンカーズル引き', desc: '風でルアーが流されやすいため、自重のあるワームでボトムを確実にとる。', tags: ['高比重ノーシンカー', 'ボトム', '強風対策'] }
  ],
  default: [
    { rank: 1, title: 'ネコリグでのピンスポット攻略', desc: 'ストラクチャーにタイトについているバスに対して、移動距離を抑えて丁寧にシェイク。', tags: ['ネコリグ', 'フィネス', '食わせ'] },
    { rank: 2, title: 'ジャークベイトでのアピール', desc: '2回のジャークとポーズ（停止）の繰り返し。ポーズ中にバイトが集中する。', tags: ['ジャークベイト', 'リアクション', '中層'] },
    { rank: 3, title: 'スモラバによるカバー撃ち', desc: '目に見えるストラクチャー（杭や矢板）にタイトに落とし込む。', tags: ['スモールラバージグ', 'カバー', '手堅い'] }
  ]
};

export const MOCK_ANALYTICS = [
  { label: 'クランクベイト', value: 32, max: 40 },
  { label: 'ネコリグ', value: 24, max: 40 },
  { label: 'スピナーベイト', value: 18, max: 40 },
  { label: 'ダウンショット', value: 15, max: 40 },
  { label: 'チャターベイト', value: 8, max: 40 },
  { label: 'ノーシンカー', value: 5, max: 40 }
];
