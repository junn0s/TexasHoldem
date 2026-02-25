(() => {
  const ITEM_DB = Object.freeze({
    suit_magnet: Object.freeze({
      id: "suit_magnet",
      name: "수트 자석",
      desc: "커뮤니티 카드가 스페이드 쪽으로 기웁니다.",
      icon: "S",
      symbol: "♠",
      rarity: "normal",
      type: "passive",
      price: 170,
      effect_logic: "보드 스페이드 가중치 +30%"
    }),
    blind_refund: Object.freeze({
      id: "blind_refund",
      name: "블라인드 리베이트",
      desc: "SB/BB를 낼 때마다 블라인드의 일부를 즉시 환급받습니다.",
      icon: "R",
      symbol: "↺",
      rarity: "normal",
      type: "passive",
      price: 190,
      effect_logic: "블라인드 납부 시 20% 환급"
    }),
    pair_hunter: Object.freeze({
      id: "pair_hunter",
      name: "페어 헌터",
      desc: "프리플랍 두 번째 홀카드가 페어가 될 확률을 크게 올립니다.",
      icon: "P",
      symbol: "⊹",
      rarity: "normal",
      type: "passive",
      price: 210,
      effect_logic: "두 번째 홀카드 페어 가중치 증가"
    }),
    suit_tailor: Object.freeze({
      id: "suit_tailor",
      name: "수트 테일러",
      desc: "프리플랍 두 번째 홀카드가 같은 무늬로 붙을 확률을 올립니다.",
      icon: "T",
      symbol: "✶",
      rarity: "normal",
      type: "passive",
      price: 205,
      effect_logic: "두 번째 홀카드 수티드 가중치 증가"
    }),
    heavy_dice: Object.freeze({
      id: "heavy_dice",
      name: "무게 주사위",
      desc: "턴/리버에서 낮은 숫자 카드를 제외합니다.",
      icon: "D",
      symbol: "⚄",
      rarity: "rare",
      type: "passive",
      price: 280,
      effect_logic: "턴/리버 드로우에서 2~5 제외"
    }),
    turn_hunter: Object.freeze({
      id: "turn_hunter",
      name: "턴 헌터",
      desc: "턴/리버 보드에서 10 이상 하이카드 출현 확률을 끌어올립니다.",
      icon: "H",
      symbol: "▲",
      rarity: "rare",
      type: "passive",
      price: 330,
      effect_logic: "턴/리버 10~A 가중치 증가"
    }),
    sleight_of_hand: Object.freeze({
      id: "sleight_of_hand",
      name: "밑장빼기",
      desc: "프리플랍에서 런당 1회, 홀카드 1장을 교체합니다.",
      icon: "H",
      symbol: "✦",
      rarity: "rare",
      type: "active",
      price: 300,
      effect_logic: "런당 홀카드 멀리건 1회"
    }),
    marked_lenses: Object.freeze({
      id: "marked_lenses",
      name: "마킹 렌즈",
      desc: "3핸드마다 상대 홀카드 1장을 확인할 수 있습니다.",
      icon: "L",
      symbol: "◉",
      rarity: "normal",
      type: "passive",
      price: 220,
      effect_logic: "선택된 상대 홀카드 1장 공개"
    }),
    royal_taste: Object.freeze({
      id: "royal_taste",
      name: "귀족의 취향",
      desc: "브로드웨이 스타팅 카드 확률을 높입니다.",
      icon: "R",
      symbol: "♛",
      rarity: "epic",
      type: "passive",
      price: 460,
      effect_logic: "A,K,Q,J 홀카드 가중치 증가"
    }),
    underdog_emblem: Object.freeze({
      id: "underdog_emblem",
      name: "언더독 엠블럼",
      desc: "핸드 시작 스택이 평균보다 낮을 때 승리 보상을 증폭합니다.",
      icon: "U",
      symbol: "⮝",
      rarity: "rare",
      type: "passive",
      price: 360,
      effect_logic: "언더독 상태 승리 시 배당 x1.25"
    }),
    river_surfer: Object.freeze({
      id: "river_surfer",
      name: "리버 서퍼",
      desc: "리버까지 생존 후 승리하면 추가 칩을 획득합니다.",
      icon: "W",
      symbol: "≈",
      rarity: "rare",
      type: "passive",
      price: 320,
      effect_logic: "리버 생존 승리 시 +140칩"
    }),
    split_guard: Object.freeze({
      id: "split_guard",
      name: "스플릿 가드",
      desc: "스플릿 팟 상황에서 추가 보너스를 챙깁니다.",
      icon: "G",
      symbol: "⇄",
      rarity: "rare",
      type: "passive",
      price: 300,
      effect_logic: "스플릿 승리 시 +90칩"
    }),
    allin_multiplier: Object.freeze({
      id: "allin_multiplier",
      name: "올인 배수",
      desc: "올인 승리 시 보상을 증폭합니다.",
      icon: "A",
      symbol: "x2",
      rarity: "epic",
      type: "passive",
      price: 500,
      effect_logic: "올인 승리 시 배당 보너스"
    }),
    triple_barrel: Object.freeze({
      id: "triple_barrel",
      name: "트리플 배럴",
      desc: "핸드 중 공격적 액션(베팅/레이즈/올인) 횟수에 따라 보상이 증가합니다.",
      icon: "3",
      symbol: "☰",
      rarity: "epic",
      type: "passive",
      price: 520,
      effect_logic: "공격 액션 2회+ 승리 시 최대 x1.24"
    }),
    river_foresight: Object.freeze({
      id: "river_foresight",
      name: "리버 예지",
      desc: "핸드당 1회, 다음 보드 카드를 미리 보고 고정합니다.",
      icon: "F",
      symbol: "◎",
      rarity: "rare",
      type: "active",
      price: 340,
      effect_logic: "다음 스트리트 첫 커뮤니티 카드 선확정"
    }),
    insurance_contract: Object.freeze({
      id: "insurance_contract",
      name: "보험 계약",
      desc: "올인 패배 시, 투자금이 200 이상일 때 일부를 환급합니다.",
      icon: "I",
      symbol: "⌁",
      rarity: "rare",
      type: "passive",
      price: 360,
      effect_logic: "올인 패배 시 (투자금 200+) 35% 환급"
    }),
    bounty_hunter: Object.freeze({
      id: "bounty_hunter",
      name: "바운티 헌터",
      desc: "상대를 파산시키면 현상금 칩을 획득합니다.",
      icon: "B",
      symbol: "⛃",
      rarity: "rare",
      type: "passive",
      price: 330,
      effect_logic: "파산 1명당 현상금 +220 (영웅 Blood Coin +1)"
    })
  });

  const itemConfig = Object.freeze({
    ITEM_DB,
    HERO_STARTER_ITEMS: Object.freeze(["sleight_of_hand", "marked_lenses"]),
    ITEM_RARITY_ORDER: Object.freeze(["normal", "rare", "epic", "legendary"]),
    BOT_ARCHETYPE_PROFILE: Object.freeze({
      mad_dog: Object.freeze({
        id: "mad_dog",
        aggroBase: 1.22,
        weights: Object.freeze({
          allin_multiplier: 8,
          triple_barrel: 7,
          turn_hunter: 5,
          heavy_dice: 5,
          pair_hunter: 3,
          suit_magnet: 3,
          suit_tailor: 2,
          blind_refund: 2,
          underdog_emblem: 3,
          river_surfer: 2,
          split_guard: 1,
          bounty_hunter: 4,
          insurance_contract: 3,
          sleight_of_hand: 2,
          river_foresight: 2,
          marked_lenses: 1,
          royal_taste: 1
        })
      }),
      stone_monk: Object.freeze({
        id: "stone_monk",
        aggroBase: 0.74,
        weights: Object.freeze({
          split_guard: 6,
          blind_refund: 5,
          underdog_emblem: 5,
          river_surfer: 4,
          pair_hunter: 4,
          suit_tailor: 4,
          royal_taste: 8,
          insurance_contract: 6,
          marked_lenses: 5,
          river_foresight: 4,
          turn_hunter: 3,
          suit_magnet: 3,
          heavy_dice: 2,
          bounty_hunter: 2,
          sleight_of_hand: 2,
          allin_multiplier: 1,
          triple_barrel: 1
        })
      }),
      trickster: Object.freeze({
        id: "trickster",
        aggroBase: 1.0,
        weights: Object.freeze({
          pair_hunter: 5,
          suit_tailor: 5,
          suit_magnet: 5,
          marked_lenses: 5,
          river_foresight: 5,
          blind_refund: 4,
          turn_hunter: 4,
          underdog_emblem: 4,
          river_surfer: 4,
          split_guard: 3,
          sleight_of_hand: 4,
          heavy_dice: 3,
          insurance_contract: 3,
          royal_taste: 3,
          bounty_hunter: 3,
          allin_multiplier: 2,
          triple_barrel: 3
        })
      })
    }),
    NPC_ARCHETYPE_BY_NAME: Object.freeze({
      Viper: "mad_dog",
      Rook: "stone_monk",
      Jade: "trickster"
    }),
    HERO_STARTER_DECK_MODS: Object.freeze([
      Object.freeze({ type: "hand_multiplier", handRank: 4, multiplier: 1.5, label: "스트레이트 강화권" }),
      Object.freeze({ type: "gold_card", rank: 13, suit: "H", bonus: 500, label: "골드 K하트" }),
      Object.freeze({ type: "joker_wild", count: 1, label: "조커 와일드" })
    ])
  });

  window.HoldemItemConfig = itemConfig;
})();
