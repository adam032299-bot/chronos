export interface CrisisChoice {
  id: "A" | "B" | "C";
  title: string;
  description: string;
  feedback: string;
  effects: {
    economy?: number;
    military?: number;
    diplomacy?: number;
    publicOpinion?: number;
    industry?: number;
    market?: number;
  };
}

export interface Crisis {
  id: string;
  title: string;
  category: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  choices: CrisisChoice[];
}

export const CRISES_DATABASE: Crisis[] = [
  // 1. 金融危機 (Financial Crisis)
  {
    id: "fc-1",
    title: "聯準會突發緊急降息引發主權信用恐慌",
    category: "金融危機",
    severity: "HIGH",
    description: "面對隱密債務違約潮，聯準會於凌晨無預警宣布緊急降息3碼。市場非但沒有慶祝，反而解讀為系統性金融崩盤的前兆，美債遭到瘋狂拋售，全球流動性瞬間凍結！",
    choices: [
      {
        id: "A",
        title: "實施行政干預，點名痛斥聯準會",
        description: "發表白宮緊急聲明，強烈指責聯準會「操之過急、製造恐慌」，並承諾美國政府將提供無限額流動性保障。",
        feedback: "批評聯準會成功點燃了民粹支持，民意上揚；但對央行獨立性的侵蝕使國外投資者信心受挫，股市持續動盪。",
        effects: { publicOpinion: 15, diplomacy: -10, market: -15, economy: -5 }
      },
      {
        id: "B",
        title: "召集美股巨頭與華爾街大佬進白宮",
        description: "緊急在橢圓辦公室召開金融巨擘閉門會議，要求大型銀行承諾提供市場流動性支持，聯手穩定主權債務利差。",
        feedback: "華爾街大佬們妥協，美債利率回穩，股市與關市大盤微幅回升，但部分民粹輿論質疑白宮對財閥輸送利益。",
        effects: { market: 15, economy: 10, publicOpinion: -10, industry: 5 }
      },
      {
        id: "C",
        title: "向海外同盟與主權基金實施定向遊說",
        description: "指派財政部長與亞洲及中東主權基金通話，尋求其在關鍵美債拍賣中「戰略性承接」，確保美國主權信用不動搖。",
        feedback: "中東與盟邦主權基金進場護盤，外交合作強化，美債流動性警報暫告解除，經濟大局平穩保全。",
        effects: { diplomacy: 15, economy: 8, market: 10, publicOpinion: 5 }
      }
    ]
  },
  {
    id: "fc-2",
    title: "美債意外被國際信評調降展望至負面",
    category: "金融危機",
    severity: "HIGH",
    description: "因聯邦債務赤字持續擴張，國際知名評級機構惠譽突然宣佈調降美國主權信用展望至「負面」。美元指數瞬間跳水，全球主權資產面臨重組壓力。",
    choices: [
      {
        id: "A",
        title: "強硬回應：揚言審查該信評機構資質",
        description: "直指信評機構被極左派滲透，屬於政治操弄，揚言要由聯邦司法部徹查其有無市場干預的違規行為。",
        feedback: "川普式的強硬作風獲得保守派極度好評，民意飆升；但金融界普遍認為此舉缺乏法治精神，股市出現恐慌波動。",
        effects: { publicOpinion: 15, market: -12, economy: -8, diplomacy: -5 }
      },
      {
        id: "B",
        title: "發布白宮減赤法案，力主大幅度削減預算",
        description: "宣布將在短期內提交超常規法案，凍結非必要對外援助與氣候預算，以強硬的縮減開支承諾取信於華爾街評級機構。",
        feedback: "財政紀律重塑讓華爾街叫好，股市與產業指標迎來顯著上揚，唯獨大砍補助引發部分中產民意下滑。",
        effects: { economy: 15, market: 12, industry: 10, publicOpinion: -12 }
      },
      {
        id: "C",
        title: "推出「美元帝國」捍衛計畫，吸納全球資本",
        description: "通過財政與外交管道放寬全球高端高淨值資本離岸定居與綠色通道，促使離岸資金加速回流美國本土。",
        feedback: "國際盟友情誼深化，流動性外國資本全力買盤，經濟、股市、產業全面復甦增長，外交信任感有所提升。",
        effects: { economy: 12, market: 10, industry: 8, diplomacy: 10, publicOpinion: 5 }
      }
    ]
  },
  {
    id: "fc-3",
    title: "歐盟宣布推行數位歐元繞開美元結算",
    category: "金融危機",
    severity: "MEDIUM",
    description: "為防範美國潛在的制裁與關稅壁壘，歐盟多名財政核心達成一致，突發宣佈「數位自主計畫」，意圖在多邊貿易中部分繞開美元結算體系。",
    choices: [
      {
        id: "A",
        title: "祭出對等反制：加徵全歐盟電子商品關稅",
        description: "直接在社群平台開火，宣布如果歐盟推動該结算，美國將對所有歐盟科技與進口商品特別加徵 25% 的懲罰性關稅。",
        feedback: "歐洲在關稅重拳下被迫推遲強推時程。美國本土產業受到保護，民意大幅拍手叫好；但美歐外交與金融夥伴關係受重創。",
        effects: { publicOpinion: 12, industry: 10, diplomacy: -15, market: -5 }
      },
      {
        id: "B",
        title: "啟動密商：由美東金融界進行游說瓦解",
        description: "唆使華爾街投資大佬與歐洲個別親美銀行高層，共同暗中向歐盟決策層施壓，以資本撤離要挾拖延該政策。",
        feedback: "歐盟內部利益分裂，決策進程陷入扯皮停滯，美方金融地位安全過關。金融市況維持強勢。",
        effects: { market: 15, economy: 10, diplomacy: 5, industry: -5 }
      },
      {
        id: "C",
        title: "加速與亞太非盟邦建構多邊数字美元網",
        description: "結合財政與外交資源，宣布與東亞及美洲多個同盟體，先行試點「數位美元環球清算網絡」，化被動為主動。",
        feedback: "成功拓展了新世界秩序下美元的金融版圖，外交與經濟取得結構性利多，重創了歐盟的脫鉤狂想。",
        effects: { diplomacy: 15, economy: 12, market: 8, publicOpinion: 5 }
      }
    ]
  },

  // 2. 股市暴跌 (Stock Market Crash)
  {
    id: "sm-1",
    title: "NASDAQ 七大科技巨頭萬億市值閃崩",
    category: "股市暴跌",
    severity: "CRITICAL",
    description: "受某關鍵半導體供應鏈秘密限制令流言影響，納斯達克開盤20分鐘內，科技七巨頭暴跌均超9%，引發算法多米諾骨牌式拋售，指數慘遭熔斷休市！",
    choices: [
      {
        id: "A",
        title: "發文怒斥科技巨頭壟斷：支持美股重分配",
        description: "聲稱這是矽谷科技大鱷過度投機的報應，宣布白宮正積極評估提供更溫和的減稅或反壟斷方案，讓財富回歸民生實體。",
        feedback: "底層藍領选民熱情高漲；但矽谷及華爾街資本爆發激烈恐慌，股市進一步受挫，產業指標震盪走低。",
        effects: { publicOpinion: 15, market: -20, industry: -15, economy: -8 }
      },
      {
        id: "B",
        title: "白宮特急協調國家隊「養老基金」進場",
        description: "財政部出面與幾大巨頭基金和國家養老安全信託協商，於盤中熔斷重啟之際注入海量買盤資金入市護盤。",
        feedback: "成功扭轉美股暴跌之勢，三大指數收盤收復失地，華爾街市場驚險迎來信心，但外交或實體產業短期無關聯。",
        effects: { market: 22, economy: 12, industry: 5, publicOpinion: -5 }
      },
      {
        id: "C",
        title: "召開記者會放寬高端半導體限制許可",
        description: "由商務部召開緊急吹風會，澄清除國防科技外，美國將最大化發放民用晶片出口許可證，藉此消弭市場恐慌傳聞。",
        feedback: "科技產業與半導體供應鏈大受激勵，股市、產業、經濟迅速同步反彈，外交摩擦也有所降溫。",
        effects: { industry: 18, market: 15, economy: 10, diplomacy: 10 }
      }
    ]
  },
  {
    id: "sm-2",
    title: "華爾街恐怖傳聞引爆對沖基金流動性擠兌",
    category: "股市暴跌",
    severity: "HIGH",
    description: "傳聞一家資產規模達千億美元的主流對沖基金因美債空頭部位爆倉，面臨災難性爆倉清算，直接威脅多家華爾街一級交易商。市場爆發集體惡意放空潮！",
    choices: [
      {
        id: "A",
        title: "放任其破產，宣示不拿納稅人的錢紓困",
        description: "重申絕不進行大政府包底，要求市場自行清理門戶，違約對沖基金必須按照破產法走向重整程序規避救市。",
        feedback: "「拒絕不公義救市」贏得公眾普遍讚賞，民心凝聚；但市場流動性嚴重惡化，股市遭遇廣泛重創，經濟受波及。",
        effects: { publicOpinion: 18, market: -18, economy: -10, industry: -8 }
      },
      {
        id: "B",
        title: "特急降準並指導一級清算銀行提供救助",
        description: "協調財經核心機構在短時間內，宣布臨時融資通道，允許優質證券抵押品獲取 100% 帳面價值融資度過關卡。",
        feedback: "成功隔離風險外溢，華爾街流動性恐慌終結，股市與外匯關市全面止血上揚，金融大局保全。",
        effects: { market: 20, economy: 10, industry: 5, publicOpinion: -8 }
      },
      {
        id: "C",
        title: "與全球主要央行啟動隔夜美元互換協議",
        description: "聯手歐日等全球主要盟友央行迅速釋放高額度隔夜本幣互換，防範離岸美債遭不理智清倉拋盤砸市。",
        feedback: "盟國對美國承諾再度肯定，跨國資本流動平穩，美國金融體系與盟友防線共同收穫良好市場反應。",
        effects: { diplomacy: 15, market: 12, economy: 8, industry: 5 }
      }
    ]
  },
  {
    id: "sm-3",
    title: "AI 算力泡沫突發破裂重創美股產業柱石",
    category: "股市暴跌",
    severity: "HIGH",
    description: "数家科技巨頭透露AI大模型商業化獲利大幅低於預期，開始大砍上游算力芯片訂單。美股的核心上漲引擎——高科技及算力板塊全面重挫 20%！",
    choices: [
      {
        id: "A",
        title: "撥付緊急專設資金：白宮收購主權存儲",
        description: "簽署行政命令撥款 50 億美元，直接委託國防、能源部門採購美產芯片與算力主機，建設政府專用先進戰略計算群落。",
        feedback: "為產業本土龍頭提供了關鍵急救訂單，產業與軍事威脅指標有所加固，但經濟與民意付出了一定代價。",
        effects: { industry: 15, military: 10, economy: -8, publicOpinion: -5 }
      },
      {
        id: "B",
        title: "由聯邦提供超額研發減稅與資本退貼",
        description: "向國會提交緊急稅法修訂案，允許所有投資於生成式基建、機器人、芯片及電網的民營資本享受雙倍稅額抵免。",
        feedback: "此項強烈利多激勵了科技巨頭與新創公司，推動資本回歸，股市和產業雙雙迎來超跌反彈。",
        effects: { industry: 18, market: 12, economy: 10, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "對國外關鍵競爭對手施加科技限制禁令",
        description: "順水推舟，將算力震盪歸咎於國外非對等廉價算力與存儲洩密，宣布對境外特定伺服器與科技群組實施嚴格准入黑名單。",
        feedback: "外交爭端和科技對抗加劇，但有效保護了本土高技術供應鏈，獲得美國國內製造業讚譽。",
        effects: { industry: 12, publicOpinion: 10, diplomacy: -12, market: 5 }
      }
    ]
  },

  // 3. 銀行倒閉 (Bank Insolvency)
  {
    id: "bi-1",
    title: "加州一間大型區域銀行突爆流性危機",
    category: "銀行倒閉",
    severity: "HIGH",
    description: "加州一間資產近 3000 億美元的地區性商業銀行，因未實現債務虧損超限被爆料，數位儲戶開始瘋狂提款，擠兌潮迅速在網路蔓延並向其他銀行擴散！",
    choices: [
      {
        id: "A",
        title: "不予救市，但提供 FDIC 帳戶完全兜底擔保",
        description: "堅決不拿政府預算注資銀行股東，但由聯邦存款保險公司(FDIC)宣布全力擔保本行所有儲戶存款（不設限額）。",
        feedback: "大眾存款安然無恙，恐慌成功被壓制在合理範圍，民意回彈，但多個地區型銀行估值受損限制了股市。",
        effects: { publicOpinion: 14, market: -5, economy: 8, industry: 5 }
      },
      {
        id: "B",
        title: "緊急促成華爾街投行對其進行收購併購",
        description: "由白宮和財政部強硬牽線，協同摩根大通、摩根士丹利等四大行在週日完成秘密競標，將該行資產和負債兼併。",
        feedback: "华爾街頂級大行成功收割，市場流動性完全回歸正常，股市行情大幅逆轉大張，但民意被指責偏袒權貴。",
        effects: { market: 18, economy: 10, publicOpinion: -12, industry: 5 }
      },
      {
        id: "C",
        title: "聯手歐盟、英國等盟友清算夥伴加強託管",
        description: "鑑於該銀行在倫敦和法蘭克福設有高淨值美元分行，立刻與歐洲央行及英格蘭銀行聯手實行跨境流動性清算保障。",
        feedback: "跨國外交協商效率獲得國際高度讚賞，雙方金融關係融洽，海外對美資本安全感顯著回升。",
        effects: { diplomacy: 15, market: 10, economy: 8, publicOpinion: 5 }
      }
    ]
  },
  {
    id: "bi-2",
    title: "中西部一間大型農業信貸銀行宣告破產",
    category: "銀行倒閉",
    severity: "MEDIUM",
    description: "由於跨國關稅反制导致大宗農民借貸無力償還，美國中西部一間服務數百萬農戶的支柱性信貸機構突發宣布無法兌付存儲負債，面臨被迫破產！",
    choices: [
      {
        id: "A",
        title: "成立國家農業特別信託基金，直接注資接管",
        description: "動用儲備資金對信貸銀行實施100%全權接管，暫緩所有受累農民的土地和農具清算起訴，保護底層農民。",
        feedback: "川普在鐵桿選民、農民群體中的聲望達到全新頂峰，民意暴漲，然而這增加了政府高額財政赤字負擔。",
        effects: { publicOpinion: 20, economy: -10, industry: 5, market: -5 }
      },
      {
        id: "B",
        title: "實施市場化債轉股，引入外來先進農業資本",
        description: "推動農產品跨國投資集团溢價收購該信貸機構部分股權，將部分不良壞帳打包出售或證券化，用市場機制自我消解。",
        feedback: "華爾街對不良資產處理高度滿意，美股、經濟大盤應聲上升，但農會及本土農民對資本介入多有疑慮。",
        effects: { market: 15, economy: 12, industry: 8, publicOpinion: -10 }
      },
      {
        id: "C",
        title: "以外交政策掛鉤，與盟友簽訂高額農產合同",
        description: "向亞洲主要國家及歐洲盟友施壓，要求其在2週內履行數百億美元的大豆與豬肉採購，獲取救市流動現金流。",
        feedback: "盟國無奈妥協履行承諾，不僅使外交戰略威懾維持，也順利為農業灌注救命美元，經濟、民意和外交共享紅利。",
        effects: { diplomacy: 15, publicOpinion: 10, economy: 10, market: 8 }
      }
    ]
  },
  {
    id: "bi-3",
    title: "大型區塊鏈跨境影子銀行在巴哈馬意外失聯",
    category: "銀行倒閉",
    severity: "MEDIUM",
    description: "一家在海外註冊、與美東多家二線銀行有高達500億美元美元穩定幣擔保關係的影子清算網突發暫停提款、總部人去樓空。美東多個基層儲蓄體系爆發連鎖恐慌！",
    choices: [
      {
        id: "A",
        title: "宣布禁止穩定幣與正規銀行體系掛鉤",
        description: "由聯邦財經及證券交易監管會宣示：在全美嚴禁一切離岸不記名加密代幣、非法跨境清算代幣進入傳統零售金融。",
        feedback: "有力整肅了洗錢與非法流動性，在安全與民心領域大獲信譽，唯獨新興科技板塊與數位投資市場遭到巨額重砸。",
        effects: { economy: 10, publicOpinion: 10, market: -15, industry: -8 }
      },
      {
        id: "B",
        title: "由美東商業銀行進行部分壞帳認列與整併",
        description: "允許大型合約銀行與司法部門合作，折價收購遭波及的基礎二線信貸資產，並在美債市場發行同等債券予以置換。",
        feedback: "金融防線迅速築起，市場行情由跌轉為穩定，產業與經濟復甦指標持續，股市關市維持中性。",
        effects: { market: 14, economy: 8, industry: 10, diplomacy: 5 }
      },
      {
        id: "C",
        title: "展開全球秘密司法追緝，扣押不法影子帳戶",
        description: "發揮國家情報高壓與特工情報局網絡，對失蹤的管理層全球施壓拘留，扣留其託管在各海外金融島上的美債與美金。",
        feedback: "追回大部分非法隱藏資產，向全球展示了美國主權金融長臂管轄的厲害，外交、軍事與股市支持全線大升。",
        effects: { diplomacy: 12, military: 10, market: 10, economy: 5, publicOpinion: 5 }
      }
    ]
  },

  // 4. 伊朗危機 (Iran Crisis)
  {
    id: "ic-1",
    title: "伊朗革命衛隊突擊扣押好望角附近的超大型美資油輪",
    category: "伊朗危機",
    severity: "CRITICAL",
    description: "伊朗海軍以「汙染領海與涉嫌非法情報收集」為由，突然在庫德、波斯灣核心海域出擊扣留一艘懸掛美旗的 20 萬噸原油輪。紅海與波斯灣局勢危在旦夕！",
    choices: [
      {
        id: "A",
        title: "白宮特急下令海軍航空母艦打擊群進行威懾",
        description: "命令美海軍「林肯號」及「艾森豪號」航母群即刻駛入波斯灣附近，進行警告性演訓並封鎖伊朗多個原油出口港。",
        feedback: "美國全球軍事霸主實力再度得到證明，軍事威懾空前高漲，民意與盟友好口碑大增；但國際商船與產油線恐慌，油價暴漲導致股市回落。",
        effects: { military: 22, publicOpinion: 12, diplomacy: 8, market: -15, economy: -8 }
      },
      {
        id: "B",
        title: "啟動外交第三方通道進行間接和緩磋商",
        description: "委託卡達、阿曼等中東中立外交主體代推秘密談判，考慮以部分解凍其部分人道民生物資資金為條件，換取船員安全釋放。",
        feedback: "船員安全釋放，美歐主要股票市場、債市和油價迅速平息，經濟恢復良好；但國內強硬派痛批此舉為「向勒索者低頭」，民意指標重挫。",
        effects: { market: 18, economy: 12, publicOpinion: -15, military: -10 }
      },
      {
        id: "C",
        title: "拉攏北約與以色列發動聯合不對稱特種反制",
        description: "不直接開火，但組織與以色列及區域防衛盟國，共同對伊朗數個關鍵雷達基地與沿岸快艇指揮系統執行電子干擾與特種兩棲穿透。",
        feedback: "展示了多邊與前鋒特種部隊的高度配合。外交成果豐碩，軍事防衛體系完美，本土股市也為捍衛自由航行感到振奮。",
        effects: { diplomacy: 15, military: 15, market: 10, publicOpinion: 8, economy: 5 }
      }
    ]
  },
  {
    id: "ic-2",
    title: "伊朗突發宣佈其濃縮鈾豐度已極為接近武器級",
    category: "伊朗危機",
    severity: "HIGH",
    description: "聯合國原子能署秘密報告外洩，顯示伊朗離心機核心基群已被大幅升級，其濃縮鈾儲量與豐度突飛猛進，估計最快在 1 個月內可組裝首枚核彈頭！",
    choices: [
      {
        id: "A",
        title: "不排除動武：對其核設施發出 72小時特急最後通牒",
        description: "在推特與白宮發佈強烈最後通牒，限令立刻拆除非法離心機並接受無死角核查，否則美國與盟友將發動外科手術式空中打擊。",
        feedback: "向世界彰顯絕對意志，軍事強度空前震懾，民意也為「美國第一，消滅惡勢力」熱情激動；但避險資產高企，股市與經濟大盤出現恐慌波動。",
        effects: { military: 20, publicOpinion: 15, market: -15, economy: -8, diplomacy: -5 }
      },
      {
        id: "B",
        title: "與沙特、阿聯等遜尼派王國結成特急戰略經濟防衛圈",
        description: "在波斯灣舉行聯合反核高峰會，簽訂全新不對稱軍購與油產共同包底條約，大幅強化沙烏地一線導彈防禦系統。",
        feedback: "透過地緣制衡取得平衡，多邊盟盟防線更見穩固，外交和實體產業與經濟指標，都獲得良好的防衛利多支持。",
        effects: { diplomacy: 18, military: 12, industry: 10, economy: 8, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "對伊朗實施全面的金融長臂割裂封鎖",
        description: "簽署行政令，凡與伊朗石油、航運、基建有過 1 美元往來的非美金融實體，皆完全禁止使用 SWIFT 與聯邦清算網。",
        feedback: "將其逼入窒息境地，美國金融武器力量展示，國內市場和實體產業也隨之強化了其在北美市場的安全感。",
        effects: { economy: 10, market: 10, industry: 8, diplomacy: 8, military: 5 }
      }
    ]
  },
  {
    id: "ic-3",
    title: "伊朗秘密支援的葉門真主武裝向紅海大批發射高精度反艦無人機",
    category: "伊朗危機",
    severity: "HIGH",
    description: "紅海主要貿易通道突遭大批巡弋彈藥與集體無人機突襲，數艘多國籍貨輪被擊中起火。蘇伊士運河實質上面臨無限期停運，全球海運價格在一夜之間暴漲三倍！",
    choices: [
      {
        id: "A",
        title: "啟動「繁榮衛士2.0」：採取毀滅式陸地精準摧毀",
        description: "派遣美海軍驅逐艦編隊，並聯合英國海空軍向葉門與該發射基地發射海基戰斧導彈與艦載機轟炸，執行地毯式雷達摧毀。",
        feedback: "軍事制止打擊獲得全球多國點頭喝采，軍事防禦與外交安全大幅躍昇。然而紅海中長線交火引發航運保費高漲，中短期股市、經濟承壓。",
        effects: { military: 18, diplomacy: 12, market: -10, economy: -5, publicOpinion: 5 }
      },
      {
        id: "B",
        title: "開啟好望角全球大物流空運與北美路網補貼",
        description: "承認紅海暫時不安全，白宮聯合波音、聯邦快遞和多家跨國海運龍頭，宣布推出戰略北美港口與特快鐵路路網補貼方案。",
        feedback: "北美基礎運力大幅提升，本國物流業與交運產業指數迎來巨大行情，股市也對此感到安心與上漲。",
        effects: { industry: 15, market: 12, economy: 10, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "實施對外援理切斷與聯合國譴責並尋求中國協同",
        description: "向北京提出緊急談判：紅海如果中斷，中國赴歐貿易利益受損最大，要求其聯手對德黑蘭施加根本性的原油禁運警告。",
        feedback: "極其務實的地緣博弈。通過經濟和外交施壓完成了多邊合圍，中東局勢迎來轉圜，外交和經濟一箭雙雕。",
        effects: { diplomacy: 18, economy: 10, market: 8, military: 5 }
      }
    ]
  },

  // 5. 北韓飛彈 (North Korea Missile)
  {
    id: "nk-1",
    title: "北韓試射洲際長程彈道飛彈飛越日本領空",
    category: "北韓飛彈",
    severity: "HIGH",
    description: "平壤突然發射一枚新型「火星-18」固體燃料洲際導彈。該導彈飛行高度與彈道直接飛越日本青森縣上空，最後落入太平洋美屬關島不遠處，引發東北亞特急警報！",
    choices: [
      {
        id: "A",
        title: "在南韓与日本部署最新薩德及進程核潛艇",
        description: "命令美軍戰略「俄亥俄級」戰術核潛艇即刻高調駛入釜山港，並在日本部署更多高敏感反導監視雷達，全面武裝盟邦。",
        feedback: "東北亞盟邦信心倍增，軍事主導權和防衛強度達到二戰後頂端。不過該舉動引來中俄強烈不滿，外交局勢再度繃緊。",
        effects: { military: 20, diplomacy: 5, publicOpinion: 10, market: -8 }
      },
      {
        id: "B",
        title: "向安理會提交全面對朝能源封鎖禁令",
        description: "召開聯合國安全大會，強硬提案對北韓封鎖全部精煉油出口，並勒令多個地區國家徹底遣返其全部海外IT創收黑客與外勞。",
        feedback: "外交包抄大獲進展，重塑了美國在全球的領導責任。東北亞與多國的協作使得金融局勢與股市也避免了暴跌。",
        effects: { diplomacy: 18, market: 10, economy: 8, military: 5 }
      },
      {
        id: "C",
        title: "重拾「大宗交易交易」：直接密信金正恩",
        description: "不帶官僚色彩，直接由白宮發送秘密函件，表示願意在特定非核無害化的前提下，考慮恢復昔日新加坡框架的放鬆制裁談判。",
        feedback: "極具話題性。局勢迅速降溫，股市、經濟和市場在避險情緒退潮後大幅反彈。但美日韓同盟關係感到驚愕、受傷。",
        effects: { market: 15, economy: 10, diplomacy: -12, publicOpinion: 8 }
      }
    ]
  },
  {
    id: "nk-2",
    title: "北韓動員多個秘密黑客組織入侵美東主要核能電網",
    category: "北韓飛彈",
    severity: "CRITICAL",
    description: "國土安全部傳出特急警情：北韓軍事網絡總局旗下「拉撒路」(Lazarus)等影子組織被監控到正入侵美東一個多州聯網的大型水電站控制核心，意圖製造大停電！",
    choices: [
      {
        id: "A",
        title: "不對稱反制：下令網絡司令部瘫痪北韓所有境外代理服務器",
        description: "不向公眾隱瞞，直接啟動攻擊性網絡作戰「閃電打擊」，定點摧毀北韓在境外架設的全部非法服務主機、挖礦節點及指令通道。",
        feedback: "展現了極致的隱秘網絡反擊威懾，軍事防禦與產業實力得分極高，民意為國安有力反擊感到高度振奮。",
        effects: { military: 18, industry: 14, publicOpinion: 12, market: 5 }
      },
      {
        id: "B",
        title: "白宮特邀科技巨頭成立國家級網路安防聯合體",
        description: "召集微軟、谷歌、亞馬遜等雲端運算龍頭在24小時內進駐網絡特急防控指揮部，共同出資更新並全面託管聯邦與民生電網底層。",
        feedback: "美股基建與軟件安全股應聲瘋狂飆升，股市、科技與實體產業大獲歷史性利多，金融系統空前牢固。",
        effects: { market: 20, industry: 18, economy: 12, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "外交逼宮：要脅中方限期關閉北韓黑客網絡據點",
        description: "根據CIA情資，直指北韓黑客的物理IP多位於其接壤鄰國。向鄰國下達最後通牒，若不清除該等據點，美國將針對其跨境雲服務徵收重稅。",
        feedback: "高度有效的外交博弈。逼使鄰國不得不暗中切斷北韓秘密網絡租用線。外交實力與軍事防範均得到提升。",
        effects: { diplomacy: 18, military: 12, economy: 8, market: 5 }
      }
    ]
  },
  {
    id: "nk-3",
    title: "北韓在咸鏡北道豐溪里進行了第七次核試驗",
    category: "北韓飛彈",
    severity: "HIGH",
    description: "北韓突發引爆了一枚估計當量達到數十萬噸的地下氫彈核武器，多國地震局觀測到黎克特制 6.3 級人工地震。平壤宣稱已實現「戰術核彈頭標準化與量產」！",
    choices: [
      {
        id: "A",
        title: "在印太召開緊急防務峰會並提供常規反導核威懾保護傘",
        description: "美國財政、軍事首長共同赴東京，與日韓簽訂《全面防衛升級條約》，甚至允許研究在關島及琉球基地部署美軍核轟炸機常駐。",
        feedback: "鐵腕防禦！讓日本及南韓完全服膺美國防禦長城。軍事和外交威懾值直接拉滿。但也進一步激怒了印太對手，股市避險性下跌。",
        effects: { military: 22, diplomacy: 14, publicOpinion: 10, market: -10, economy: -5 }
      },
      {
        id: "B",
        title: "實施新一輪針對北航進出口、航運的全面海上登臨臨檢",
        description: "宣布成立多國籍海上安全聯合小組，在公海對一切進出北韓港口的疑似嫌疑走私與大宗煤炭船隻實施強硬臨檢查扣。",
        feedback: "實質性窒息其最後幾條外貿通道。軍事氣勢如虹，民意廣受鼓舞；但海上摩擦機率大幅增加。",
        effects: { military: 15, publicOpinion: 12, diplomacy: 8, economy: -5 }
      },
      {
        id: "C",
        title: "聯合盟友全球凍結一切與朝關聯的次級制裁金融網絡",
        description: "要求世界所有的主要银行機構，凡被情報局指認有過資金中繼與洗錢嫌疑的，美國將徹底切斷其全部美元跨境清算渠道。",
        feedback: "徹底斬斷其外匯命脈，美國主權貨幣實力展示！金融和股市、經濟防護層大增，各國避險情緒在塵埃落定後好轉。",
        effects: { economy: 12, market: 12, diplomacy: 10, industry: 5 }
      }
    ]
  },

  // 6. 台海軍事衝突 (Taiwan Strait Military Conflict)
  {
    id: "ts-1",
    title: "台海發生海上警巡編隊嚴重對峙事件",
    category: "台海軍事衝突",
    severity: "CRITICAL",
    description: "兩岸執法船與偵察驅逐艦在金門、澎湖敏感海域發生不慎意外碰撞，引發雙方海上警備編隊對峙。大批空軍戰略戰機緊急升空，情勢瀕臨全面開火边缘！",
    choices: [
      {
        id: "A",
        title: "宣布「太平洋高度戒備」，向台海派出多艘神盾驅逐艦",
        description: "白宮特急發表強硬安全聲明，命令印太司令部調撥神盾級驅逐艦高調通過台海，向各方重申不容許任何武力威脅現狀。",
        feedback: "向世界印證了美國絕不退縮的霸主精神。軍事和外交震懾急劇攀升，民意爆棚；但台海局部作戰風險引發華爾街大潰敗，股市、經濟受震感強烈。",
        effects: { military: 24, diplomacy: 12, publicOpinion: 15, market: -18, economy: -10 }
      },
      {
        id: "B",
        title: "緊急熱線北京召開特急停火協商談判",
        description: "繞開官僚程序，由總統親自接通北京高層熱線，雙方承諾自我克制、一線艦艇鳴笛退避，由外交部分頭起草新一輪臨時現狀備忘錄。",
        feedback: "一場毀滅性的地緣戰爭危機在最後一刻被驚險化解。全球三大金融市場爆發歷史性報復性大漲，經濟保全；但強硬派批評此舉為「綏靖與軟弱」，民意重挫。",
        effects: { market: 22, economy: 15, publicOpinion: -18, military: -12 }
      },
      {
        id: "C",
        title: "拉攏日、澳、菲及七國集團，發表多邊安全保護條約",
        description: "美國發起並聯合G7及印太海上五國盟邦發表聯合聲明，警告任何破壞台海半導體產線與航道的行為將引致集體關稅與航道全面禁運制裁。",
        feedback: "教科書般的多邊戰略威懾！既避免了直接前線交火，又展示了美國無與倫比的外交和同盟力量。經濟及產業防護層亦受到正向激勵。",
        effects: { diplomacy: 20, industry: 15, military: 10, economy: 8, market: 8 }
      }
    ]
  },
  {
    id: "ts-2",
    title: "台灣外海突發大範圍海底光纜意外中斷",
    category: "台海軍事衝突",
    severity: "HIGH",
    description: "據電信網絡核心監測，連接北美、台灣、日韓的三條太平洋海底高速光纖主纜，疑遭境外潛艇或拖網漁船不名原因「意外切斷」，台灣與日韓的金融通訊陷入癱瘓！",
    choices: [
      {
        id: "A",
        title: "下令美國海軍潛艇支援船，即刻執行海面武裝搶修與巡防",
        description: "不理會對手反對，由第七艦隊多艘武裝驅逐艦直接為美國與同盟通訊搶修船提供全程護航，強行在東亞海盆進行海床重組與接續工作。",
        feedback: "在危機中展示高強度執行力，軍事防衛感提升，外交信任感達到巔峰；但雙方海軍探測衝突隱患居高不下。",
        effects: { military: 18, diplomacy: 15, economy: -5, market: -5 }
      },
      {
        id: "B",
        title: "啟動全球星鏈及軍用微波高速應急冗餘網",
        description: "白宮特急簽署應急法案，授權太空軍、SpaceX及主流衛星運營商，將數千顆低軌衛星轉向覆蓋台海，無償保障其政府與金融指令不中斷。",
        feedback: "科技產業與SpaceX股價全面飆升。此等先進技術展示使得產業、股市、經濟防衛層面獲取劃時代巨額利多！",
        effects: { industry: 22, market: 15, economy: 10, military: 8, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "向境外發動極端嚴厲的半導體關稅限制懲罰",
        description: "懷疑海底光纖中斷是對手實施的混合戰術。白宮以此為名，宣布對該方涉嫌海底作業的全部敏感重工、航運與物流企業實施資產充公與最高關稅。",
        feedback: "經濟戰與國防重拳再次完美砸下，獲得本土實體製造業極佳好評，民意民情強烈沸腾；但地緣僵局更趨惡化。",
        effects: { publicOpinion: 15, industry: 12, diplomacy: -12, market: 5 }
      }
    ]
  },
  {
    id: "ts-3",
    title: "台海爆發大範圍海上實彈軍事演習禁航區",
    category: "台海軍事衝突",
    severity: "HIGH",
    description: "對手以「反恐與海上安全防衛演練」為名，突發劃設了覆蓋台灣南北咽喉及主要商船航道的六個實彈射擊禁航區，期限為期 5 天。全球晶片與對美航運當即停擺！",
    choices: [
      {
        id: "A",
        title: "白宮宣布派遣美海軍P-8A巡邏機與無人潛艇編隊，高調實施穿透性探測",
        description: "不承認禁航公告，指派美遠程巡邏機與不記名潛航器持續在預定禁航海盆實施不對稱情報掃描，直搗演訓核心。",
        feedback: "軍事作風強頂硬碰！向亞太乃至全球盟邦印證了美國主宰洋流的鐵壁誓言，軍事、民意和外交得到超強激增。",
        effects: { military: 22, publicOpinion: 12, diplomacy: 10, market: -10 }
      },
      {
        id: "B",
        title: "特急撥款 300 億美元加速北美「芯片法案2.0」本土代工鏈",
        description: "白宮宣布任何受此危機影響而推遲供應鏈的跨國企業，只要在 1 年內承諾把先進代工和封測產線移至亞利桑那或俄亥俄，可獲雙倍補貼補貼。",
        feedback: "北美晶片與大型地產、製造板塊集體狂歡！實體產業與本國經濟基礎被進一步夯實，股市也因長線資產安全上漲。",
        effects: { industry: 20, economy: 12, market: 10, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "啟動關稅終極底牌，全面加徵涉事方 60% 進口重稅",
        description: "直言演習威脅了半導體生命線與世界自由貿易，直接對該涉事國在美境內的全部出口商品即刻調至關稅最高上限，打擊其外貿主幹。",
        feedback: "這是典型的川普王牌殺手鐧。外貿政策的強橫落實，激發了極端狂熱的國內選民叫好，民意大漲，但對全球供應鏈有極大摩擦。",
        effects: { publicOpinion: 18, industry: 10, diplomacy: -15, market: 5 }
      }
    ]
  },

  // 7. 恐怖攻擊 (Terrorist Attack)
  {
    id: "ta-1",
    title: "美東大型液化天然氣港口爆發毀滅性恐怖爆炸",
    category: "恐怖攻擊",
    severity: "CRITICAL",
    description: "位於馬利蘭州寇弗角、向歐洲出口液化天然氣的重要戰略壓縮終端突發發生連環粉塵與化學品大爆炸，港口陷入火海、宣告癱瘓。調查指出背後疑有極端激進組織暗中安放炸彈！",
    choices: [
      {
        id: "A",
        title: "宣布全美能源與交通基礎設施進入「一級國家安全戒備」",
        description: "派駐國民警衛隊接管全美油管、港口與煉油廠，並啟動反恐防禦令，擴大邊境與過港商船查緝。",
        feedback: "國內防衛體制大為健全，軍事防制和民意安全感顯著上升。然而，嚴格的反恐盤查導致物流和關市物流效率大降，經濟受損。",
        effects: { military: 18, publicOpinion: 10, market: -12, economy: -8, industry: 5 }
      },
      {
        id: "B",
        title: "動用戰略重組配額，全面扶持中南部頁岩油與得州新港口",
        description: "宣布在得州及路易斯安那州緊急啟用多個預備裝卸終端，放寬開採與出口審查，允許頁岩氣企業 48 小時內填補寇弗角港口缺口。",
        feedback: "北美頁岩油與重工板塊迎來歷史性飆升，股市、實體產業大受鼓舞，經濟和市場大盤雙雙大漲！",
        effects: { industry: 18, market: 15, economy: 12, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "向源頭宣戰：對中東某境外秘密嫌疑基地發動定點空爆",
        description: "根據中央情報局特急情資，直指爆炸金主藏身境外。簽署空置指令，出動兩架B-2匿跡轟炸機長途奔襲炸平該組織核心大本營。",
        feedback: "鐵血反恐，揚威世界。展示了不惜一戰的霸王作風，軍事分值大幅暴漲，民心高亢，外交同盟信任感再次加固。",
        effects: { military: 22, publicOpinion: 14, diplomacy: 10, market: 5 }
      }
    ]
  },
  {
    id: "ta-2",
    title: "紐約曼哈頓地鐵樞紐突發不明生化毒氣驚魂",
    category: "恐怖攻擊",
    severity: "HIGH",
    description: "高峰時段的紐約時代廣場地鐵通道吸入大量刺鼻不明煙霧，數百名乘客出現嘔吐昏迷。警方緊急疏散了整個中城地鐵，百老匯全線暫退，恐慌蔓延至世界金融中心！",
    choices: [
      {
        id: "A",
        title: "宣布「國土警戒令」，暫停多國特別非移民簽證入境",
        description: "立刻下令國土安全部凍結對特定高風險、多爭端地區非移民與難民的簽證簽發，擴大聯邦特工追緝不法地下網絡。",
        feedback: "「建牆與嚴防」再度展示成效，保守派選民極其狂熱支持，民意上揚；但在國際上被批不人道，外交和金融股市流露出些許寒意。",
        effects: { publicOpinion: 15, diplomacy: -10, market: -8, military: 8 }
      },
      {
        id: "B",
        title: "特急撥款 100 億美元，全面升級美各州主要民生大樞紐安檢",
        description: "推出「安全樞紐建設計畫」，購買最新高敏感生化探測儀，委由國民兵在火車站、機場、商場實行常態聯合防衛盤查。",
        feedback: "民生安全網得到徹底加固。安全設備、地產和基建股份大受投行追捧，股市、產業、經濟獲取多重拉抬利多。",
        effects: { market: 15, industry: 12, economy: 8, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "與歐盟、國際刑警組織成立跨境大情報即時共享數據網",
        description: "外交召開全球聯合反恐會議，強勢要求西方十國同盟、東亞諸盟分享跨境資金洗錢與極端主義流動情報，實施海外防禦。",
        feedback: "這是一次極高水準的外交整合。外交關係融洽，反恐情資大獲成功，金融市場也為多邊協作感到安心與上升。",
        effects: { diplomacy: 18, military: 10, market: 8, economy: 5 }
      }
    ]
  },
  {
    id: "ta-3",
    title: "好萊塢大型跨國傳媒巨頭總部大樓突遭武裝分子劫持",
    category: "恐怖攻擊",
    severity: "MEDIUM",
    description: "一夥持重型武器、戴面罩的境外極端分子突襲了位於洛杉磯的好萊塢知名製片與新聞直播大樓，將數十名核心主播與高層挾持，要求全球同步直播其宣傳片！",
    choices: [
      {
        id: "A",
        title: "拒絕妥協：命令洛杉磯特警與聯邦人質救援隊強行發動索降強攻",
        description: "下達格殺勿論的進攻命令，不理人質受傷風險，派出陸軍特遣隊與 FBI 人質搜救隊實施多向震撼彈突入。",
        feedback: "強攻大獲成功，雖然人質有極微傷亡，但恐怖分子全數被殲滅。展現不妥協的硬漢本色，軍事威信和大眾民意迎來大振。",
        effects: { military: 18, publicOpinion: 12, diplomacy: 5, market: -5 }
      },
      {
        id: "B",
        title: "實施全面媒體戒嚴與網絡實名切斷，掐斷境外信號源",
        description: "利用通訊管理總署特急權限，臨時封鎖事發周圍全頻段通訊網絡與境外直播鏈路，進行物理信號源斷電，防止恐慌外溢。",
        feedback: "防止了極端主義意識形態的傳播危害，獲得實體安定，科技和電信巨頭配合白宮，產業與美股走勢平穩。",
        effects: { industry: 12, market: 10, economy: 5 }
      },
      {
        id: "C",
        title: "以此為藉口：推動對其境外培訓據點實施全球特種追殺與切斷金流",
        description: "發表慷慨激昂的全民大演講，與全球情報盟邦合作，立刻在瑞士、塞浦路斯跨境凍結十餘個該恐怖組織直接或間接的離岸賬戶。",
        feedback: "國際多邊合作大展宏圖。外交美名遠洋，多國攜手打擊影子恐怖帳戶，金融安全體系大大鞏固。",
        effects: { diplomacy: 15, market: 12, economy: 8, military: 5 }
      }
    ]
  },

  // 8. 網路攻擊 (Cyber Attack)
  {
    id: "ca-1",
    title: "美聯儲及美東主要證券結算所突遭高烈度勒索病毒攻擊",
    category: "網路攻擊",
    severity: "CRITICAL",
    description: "一組名為「闇夜魅影」(DarkPhantom)的隱秘黑客組織利用某未公開的 Windows 零日漏洞，將美聯儲內部核心資金轉帳清算系統(Fedwire)局部鎖死並勒索 50 億美元比特幣！",
    choices: [
      {
        id: "A",
        title: "拒絕交付，下令軍事網絡司令部啟動國家備份系統接管",
        description: "誓言絕不向網絡匪徒低頭。下達特急白宮令，啟用太空軍安全不對稱戰略網絡及聯邦後備冗餘中繼，在3小時內全面強制重置美聯儲底層結算。",
        feedback: "在驚濤駭浪中捍衛了合約精神與美國司法底線。軍事反擊極其耀眼，民意空前信賴，但中短期部分外溢交易可能因停擺而使短期股市受壓。",
        effects: { military: 22, publicOpinion: 12, industry: 10, market: -15, economy: -5 }
      },
      {
        id: "B",
        title: "協調微軟與各安全科技巨頭主導修復，在全美推動軟體自主硬升級",
        description: "由白宮召集全美前十大安全信安龍頭與芯片廠，推出特急信安專案，修復漏洞，全面清退全美所有政府部門與銀行的老舊代碼。",
        feedback: "信安龍頭、雲端與科技軟體股狂歡大漲。股市、科技和實體產業指標在危機中喜提驚人利多加持，經濟強勢！",
        effects: { market: 22, industry: 18, economy: 12, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "向境外潛在主事方發動強烈的外交警告與多邊抵制",
        description: "直接指控某地緣主要對手涉嫌暗中提供黑客庇護，以此宣佈对該方十餘家主要雲運營、電信及科技骨幹公司在海外清算機制全面孤立。",
        feedback: "發揮金融與外交重錘！獲得盟邦積極響應配合，多國共同築起科技防火牆，外交及全球主導地位傲人攀升。",
        effects: { diplomacy: 18, economy: 10, market: 8, military: 5 }
      }
    ]
  },
  {
    id: "ca-2",
    title: "五角大廈關鍵 F-35 戰略戰機部分機密設計藍圖流向暗網",
    category: "網路攻擊",
    severity: "HIGH",
    description: "一家美軍一級航空防務分包商的雲端伺服器突遭高敏感APT滲透。黑客成功竊取並在暗網高調展示 F-35 航空電子、隱身塗料核心代碼。軍事機密面臨滅頂洩露！",
    choices: [
      {
        id: "A",
        title: "撤換並嚴厲重罰該外包航企，將其剔除國防供應鏈",
        description: "直接將這家分包商拉入黑名單，重拾國防高度集中化法規，將所有的敏感軍事航空研發收回五角大廈與太空軍全權直轄。",
        feedback: "大快人心，對玩忽國安者零容忍獲得民眾大加讚賞，民心凝聚，軍事防線也在高壓整頓下迅速止漏鞏固。",
        effects: { publicOpinion: 15, military: 15, market: -5, industry: 5 }
      },
      {
        id: "B",
        title: "宣布加速研發下代「無人自主匿蹤六代機」頂尖儲備",
        description: "宣布原計劃的 F-35 被洩露部分已屬於上一代。白宮將與洛馬、波音等航空巨頭成立全新太空與深海無人六代機秘密基地，以技術斷代擊碎洩密影響。",
        feedback: "航空、不對稱無人機和頂尖科技板塊成交爆量暴升。股市、產業、經濟皆迎來新一輪由國防科技大採購帶來的極大繁榮！",
        effects: { industry: 18, market: 15, economy: 10, military: 10, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "聯手五眼聯盟展開特戰全球雷霆扣押與暗網斷網行動",
        description: "指令五眼聯盟特種網戰司令部聯手，攻入售賣代碼的暗網主要論壇與中轉硬碟，物理摧毀其主機，並在全球海捕非法交易分子。",
        feedback: "展示了美國統御西方同盟在無形網絡世界的無上追捕力量。外交盟友大加佩服，軍事與金融體系安全感上揚。",
        effects: { diplomacy: 18, military: 12, market: 10, economy: 5, publicOpinion: 5 }
      }
    ]
  },
  {
    id: "ca-3",
    title: "美國全境多個主要港口自動化吊裝起重控制系統癱瘓",
    category: "網路攻擊",
    severity: "HIGH",
    description: "一場代號為「暗湧」(DarkWave)的黑客指令突發植入全美主要深水貨運港起重機主控台（均由東亞某國出口），導致西雅圖、洛杉磯、紐約多港系統死機、罷工！",
    choices: [
      {
        id: "A",
        title: "下令海軍工兵與國民警衛隊物理接管重型吊裝，啟動緊急軍事物流",
        description: "派出海軍常設特種工程部隊進入各港口碼頭，以人工與半自動軍事備用系統逐步恢復基本裝載，優先保證軍需與主權糧食運輸。",
        feedback: "軍隊出馬，展示強大紀律與意志。確保了國防安全與核心民心穩定，軍事、民意和外交得到超前加固。",
        effects: { military: 18, publicOpinion: 12, diplomacy: 8, economy: -5 }
      },
      {
        id: "B",
        title: "白宮頒布「港口設備去風險化與北美起重機本土自造補貼法案」",
        description: "宣布撥款緊急資助全美碼頭購買美國產、加拿大產或歐洲產安全自動化吊裝硬件，要求在1個月內完成全部涉密硬件剔除。",
        feedback: "北美基礎裝備和本土港口重工製造狂飆突進。股市、產業、本國經濟迎來驚人且可持續的大幅反彈行情。",
        effects: { industry: 22, market: 15, economy: 10, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "對該設備出口國實施全面而嚴格的次級制裁禁令",
        description: "公開譴責對手透過自動化硬件植入惡意後門，宣布中止與該廠家的一切離岸商務與資金清算網結算。",
        feedback: "這是極其精準果決的川普牌巨錘。對該競爭對手的外貿主幹造成了沉重打擊，在國內愛國浪潮中收穫大量民意喝彩。",
        effects: { publicOpinion: 18, industry: 12, diplomacy: -12, market: 5 }
      }
    ]
  },

  // 9. 天災 (Natural Disaster)
  {
    id: "nd-1",
    title: "超級颶風「奧丁」襲擊得克薩斯州，全美 30% 煉油產能停擺",
    category: "天災",
    severity: "CRITICAL",
    description: "一場歷史罕見的 5 級颶風「奧丁」在得州休士頓港正面登陸。沿海多個大型煉油廠被淹、海上石油鑽井平台特急人員全部分散撤出，汽油期貨價格一秒飆升 25%！",
    choices: [
      {
        id: "A",
        title: "白宮特急宣布釋放「國家戰略石油儲備」(SPR)",
        description: "立即向市場每天投放 200 萬桶輕質原油，平抑油價瘋狂走勢，同時簽署緊急災區援助通令支持受災各州重建。",
        feedback: "汽油價格暴漲被成功遏制，民生怨氣大消，民意與經濟大受保全；但美國戰略原油庫存大幅下墜，降低了軍事能源備戰儲備。",
        effects: { publicOpinion: 15, economy: 12, market: 8, military: -12 }
      },
      {
        id: "B",
        title: "宣布「環境監管零容忍免除」，加速西部及阿拉斯加陸上開採",
        description: "簽署行政令，臨時廢除阿拉斯加及猶他州多個自然保護區的開採環保審查，允許本土油企在 24 小時內放量開採。",
        feedback: "北美油企和採礦重工股大受激勵，股市、實體與生產產業大獲利多，大盤迅速收復失地暴漲！",
        effects: { industry: 18, market: 15, economy: 10, publicOpinion: -5 }
      },
      {
        id: "C",
        title: "向中東及美洲石油夥伴施壓：要求即刻增產以分攤災損",
        description: "發動外交和能源大臣遊說沙特、阿聯及墨西哥，暗示若不在此時大幅增加多產原油外銷美國，將重估與各國的安全合作協議。",
        feedback: "地緣與能源利益再次深度捆綁。成功令中東盟友妥協加碼增產，外交威懾維持，金融市場穩定上升。",
        effects: { diplomacy: 18, economy: 10, market: 10, military: 5 }
      }
    ]
  },
  {
    id: "nd-2",
    title: "加州突發 7.2 級大地震重創矽谷核心科研帶",
    category: "天災",
    severity: "HIGH",
    description: "加州聖安德烈亞斯斷層發生 7.2 級劇烈地震。聖荷西、庫比蒂諾多處科研總部停電，多條先進封測和研發試驗晶圓產線硬件受損停產！",
    choices: [
      {
        id: "A",
        title: "宣布加州為「特急聯邦受災區」，調動工程兵即刻進駐搶通水電",
        description: "高效率撥付聯邦緊急紓困急難基金，調配美陸軍國民警衛工程兵高強度搶修公路、光纖、電網等科技高新專區基建。",
        feedback: "效率奇高，體現了強大組織執行力。獲得加州群眾及高新產業巨頭一致肯定，民心大振，國防軍事威信增加。",
        effects: { publicOpinion: 16, military: 12, economy: 8, industry: 5 }
      },
      {
        id: "B",
        title: "特急推行「科技企業內陸搬遷特別紅利法案」",
        description: "給予受災科技公司超常規抵稅與搬遷補貼，支持研發中心、中试芯片線在 1 個月內部分疏散移至得州、猶他州、田納西州等內陸穩固地帶。",
        feedback: "新興內陸科技新城蓬勃發展。極大刺激了內陸基建、物流與新工商業，股市行情與產業獲得全新爆點。",
        effects: { industry: 20, market: 15, economy: 12, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "以外交管道緊急委任歐亞先進盟國進行外包供應鏈頂替",
        description: "利用外交同盟體系，協調日韓與歐洲主要晶片代工巨頭，在 5 天內無縫承接多款關鍵北美晶片和封測訂單，保全供應鏈韌性。",
        feedback: "盟邦關係更加緊密，美國科技及電子行業在國外的支持下安全著陸，外交和股市指標高歌猛進。",
        effects: { diplomacy: 18, market: 12, economy: 8, industry: 5 }
      }
    ]
  },
  {
    id: "nd-3",
    title: "美中西部遭遇極端連續龍捲風重創全美大糧倉",
    category: "天災",
    severity: "HIGH",
    description: "十餘個高強度龍捲風集群席捲堪薩斯、內布拉斯加等農業支柱州。數百萬畝熟小麥和玉米大棚被毀，農業大型糧倉大批坍塌。糧食期貨在芝加哥當天暴漲 15%！",
    choices: [
      {
        id: "A",
        title: "宣布限制非盟友農產品出口，保證國內第一",
        description: "簽署白宮特令，暫停向一切非美國核心軍事同盟的第三方出口本國儲備糧，將所有的口糧保障完全優先留給國內零售平價超市。",
        feedback: "「美國第一」的口糧保證使得國內藍領與家庭選民淚流滿面，民意狂飆；但此舉威脅到國際多邊秩序的外交信譽。",
        effects: { publicOpinion: 20, diplomacy: -12, economy: 8, market: 5 }
      },
      {
        id: "B",
        title: "緊急授權引導大規模「多邊智慧抗災大温室本土融資」",
        description: "針對高科技無土、垂直農業基礎項目，提供超高比例低息無抵押聯邦貸款，輔助大型跨國農業巨頭整合中西部重組產線。",
        feedback: "美股農業高科技、自動化製造股狂歡大漲。股市、本國產業在逆境中驚喜開拓新科技板塊，經濟穩步上揚。",
        effects: { market: 15, industry: 15, economy: 10, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "使用外交底牌：要求鄰國加拿大與美洲盟友平價開放農副產品免關稅通道",
        description: "協商美墨加協定(USMCA)多方，要求加拿大、墨西哥利用其豐收庫存，即刻以歷史低價且免關稅平抑美國市場。",
        feedback: "展現了極致強橫的鄰國博弈和外交主導實力。外交成效斐然，國內物資價格回穩，多個經濟與股市指標恢復良好。",
        effects: { diplomacy: 18, economy: 12, market: 10, publicOpinion: 5 }
      }
    ]
  },

  // 10. 能源危機 (Energy Crisis)
  {
    id: "ec-1",
    title: "中東多個海運咽喉遭水雷封鎖，全球油價瞬間飆破 $140 桶",
    category: "能源危機",
    severity: "CRITICAL",
    description: "在庫密和波斯灣口，多艘油輪因碰撞水雷沉沒，多個石油輸出國組織港口宣佈不定期封港。布倫特原油飆破 140 美元，高油價引發全球性二次惡性通膨危機！",
    choices: [
      {
        id: "A",
        title: "下令海軍特遣編隊，執行「強制性公海掃雷解封航網行動」",
        description: "出動多艘掃雷艦以及多個海戰戰略編隊破局。誓言在 48 小時內消滅一切公海浮雷，為所有多國油輪提供全程武力護航。",
        feedback: "無懈可擊的超強軍事肌肉！軍事實力與外交主導地位得分爆滿。然而，由於仍存在實戰交火風險，股市大盤短期仍在寬幅震盪休整。",
        effects: { military: 24, diplomacy: 12, publicOpinion: 10, market: -15, economy: -5 }
      },
      {
        id: "B",
        title: "推出「北美無限自主開採綠燈行動」",
        description: "宣布暫停所有環境審查阻礙，給予本土開採與電網、核能基建超額行政減手續，宣布美國在2週內實現原油日產創歷史新高。",
        feedback: "得州油企和重工基建、電網股引導美股暴漲！實體生產業與經濟大盤獲得空前絕後的充沛利多推動。",
        effects: { industry: 22, market: 18, economy: 12, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "對相關暗中破壞海運的主事方實施終極高壓金融與關稅懲治",
        description: "直指爆炸封鎖背後有國家不法金主。白宮發布對涉事國及有關中島的一切出口、海外美元帳戶完全剝奪 SWIFT 准入特令。",
        feedback: "展示了無與倫比的外交和主權美元長臂審判力量。外交霸主地位和民心獲得極高激揚喝彩。",
        effects: { diplomacy: 20, publicOpinion: 15, market: 8, economy: 5 }
      }
    ]
  },
  {
    id: "ec-2",
    title: "美東最大精煉油管道遭史無前例的勒索軟體鎖死",
    category: "能源危機",
    severity: "HIGH",
    description: "連接得克薩斯與紐約的「殖民地油線」(Colonial Pipeline)再次遭遇高尖端網絡勒索，全部加壓閥與中控系統遭勒索軟件鎖定。美東加油站瞬間大排長龍，汽油斷供！",
    choices: [
      {
        id: "A",
        title: "宣布全美「特別能源戰備戒嚴令」，油罐車與後備軍隊物理投送",
        description: "動用國防部與國民警衛隊的陸路精裝物流網絡，派出多輛戰備油車打破民營管網障礙，對醫院、機場以及戰略要地物理配給柴汽油。",
        feedback: "軍隊的高效戒嚴配送保住了國防基業，獲得中產大眾的深沉安全感，民意與軍事同步大漲。",
        effects: { military: 18, publicOpinion: 12, industry: 5, economy: -5 }
      },
      {
        id: "B",
        title: "特急撥款 50 億美元，全面更換其網路內核中控硬體",
        description: "不支付贖金。白宮牽線與思科、微軟等龍頭在 48 小時內進駐重新刷寫工業協議(SCADA)，全面切換自產的安全網路硬體與PLC控制端。",
        feedback: "科技硬件、信安軟體板塊引爆大牛。股市與實體製造產業大受鼓舞上揚，金融大局在驚險中妥善安放。",
        effects: { industry: 18, market: 15, economy: 10, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "借機向東方主要競爭對手轉移責任，擴大外交與技術封鎖同盟",
        description: "宣稱這是國外代理人組織試圖顛覆美國內部的網絡預謀。利用外交壓力協調北約、印太同盟，對相關大國採取進一步的先進科技和能源限售合作。",
        feedback: "完美的外交政治牌。鞏固了以美國為首的反滲透同盟安全鏈，外交主宰權和民意滿意度迎來大幅增長。",
        effects: { diplomacy: 18, publicOpinion: 12, military: 8, market: 5 }
      }
    ]
  },
  {
    id: "ec-3",
    title: "委內瑞拉南部油田突發大規模地緣政局兵變",
    category: "能源危機",
    severity: "HIGH",
    description: "向美東及周邊提供重質稠油的核心南美大國，其主要武裝編隊突發與國內安全體系爆發內戰割裂，南部 60% 油井與出口碼頭設施因戰火付之一炬！",
    choices: [
      {
        id: "A",
        title: "向其石油特區派出精銳兩棲海軍陸戰隊護僑與維穩設施外圍",
        description: "以「維護印太與美洲主權僑民財產及環保安全」為由，派遣美海空編隊在其近海巡弋，並派部隊在港口外圍維持安防。",
        feedback: "極其膽大彪悍的軍事介入作風！向南美及全球證明了「後院」絕不容許破壞。軍事實力狂飆，民意與外交多方肯定。",
        effects: { military: 22, publicOpinion: 12, diplomacy: 8, market: -8 }
      },
      {
        id: "B",
        title: "與加拿大、墨西哥協調：重組美洲「 USMCA 三國能源互補協議」",
        description: "免除加拿大油砂重質油輸美的所有管線環評阻礙，重新給予其完全抵稅補貼，最大化以加國油砂重油替代南美稠油。",
        feedback: "美加、美墨實體製造與油服、重工板塊大幅跳空飆漲，經濟、股市及產業全面迎來結構性大豐收行情！",
        effects: { industry: 20, market: 15, economy: 12, publicOpinion: 5 }
      },
      {
        id: "C",
        title: "以外交金牌進行調停，委任當地特定代理利益集團和平收拾殘局",
        description: "秘密特使赴當地會商，承諾在局勢平穩及保障對美輸油穩固的前提下，給予調停勢力特定的合約保障與外交庇護。",
        feedback: "卓越的地緣與合約操盤。成功在零傷亡情況下保證了海外油罐航線回歸，外交和金融在懸崖邊雙雙飄紅回穩。",
        effects: { diplomacy: 18, economy: 10, market: 10, publicOpinion: 5 }
      }
    ]
  }
];
