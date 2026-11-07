(function (global) {
  "use strict";

  var PRODUCTS = [
    {
      id: "fone-sem-fio",
      name: "Fone de ouvido sem fio",
      category: "Eletrônicos",
      categoryId: "eletronicos",
      price: 189.9,
      rating: 4.7,
      reviews: 412,
      deal: true,
      keywords: ["fone", "ouvido", "headphone", "headset", "bluetooth", "audio", "som", "earphone"],
      blurb: "Leve, macio na orelha e sem fio. Bom para música, chamadas e vídeos.",
      bullets: ["Conecta sem cabo", "Estojo que recarrega", "Almofadas macias"],
      bg: "#e7f0fb"
    },
    {
      id: "caixa-de-som",
      name: "Caixa de som portátil",
      category: "Eletrônicos",
      categoryId: "eletronicos",
      price: 129.9,
      rating: 4.5,
      reviews: 268,
      deal: false,
      keywords: ["caixa", "som", "alto-falante", "altofalante", "speaker", "bluetooth", "portatil", "musica"],
      blurb: "Som forte para a sala ou para levar. Recarrega por cabo USB.",
      bullets: ["Sem fio", "Alça para carregar", "Bateria de longa duração"],
      bg: "#fff3e4"
    },
    {
      id: "mouse-optico",
      name: "Mouse óptico com fio",
      category: "Eletrônicos",
      categoryId: "eletronicos",
      price: 45.9,
      rating: 4.4,
      reviews: 190,
      deal: true,
      keywords: ["mouse", "mause", "optica", "optico", "computador", "informatica", "usb"],
      blurb: "Mouse simples, com fio, para usar no computador sem complicação.",
      bullets: ["Cabo USB", "Clique silencioso", "Tamanho médio"],
      bg: "#eef2f5"
    },
    {
      id: "luminaria-led",
      name: "Luminária de mesa LED",
      category: "Casa",
      categoryId: "casa",
      price: 79.9,
      rating: 4.6,
      reviews: 154,
      deal: true,
      keywords: ["luminaria", "abajur", "lampada", "led", "mesa", "luz", "leitura"],
      blurb: "Luz clara para ler e trabalhar. A haste dobra para os dois lados.",
      bullets: ["Três níveis de luz", "Baixo consumo", "Base estável"],
      bg: "#fff8e6"
    },
    {
      id: "garrafa-termica",
      name: "Garrafa térmica 500 ml",
      category: "Casa",
      categoryId: "casa",
      price: 59.9,
      rating: 4.8,
      reviews: 503,
      deal: false,
      keywords: ["garrafa", "termica", "termico", "agua", "cafe", "squeeze", "500"],
      blurb: "Mantém a bebida quente ou fria. Cabe na bolsa e não vaza.",
      bullets: ["500 ml", "Tampa de rosca", "Aço inox"],
      bg: "#e6f6f2"
    },
    {
      id: "chaleira-eletrica",
      name: "Chaleira elétrica 1,7 L",
      category: "Casa",
      categoryId: "casa",
      price: 139.9,
      rating: 4.5,
      reviews: 221,
      deal: false,
      keywords: ["chaleira", "eletrica", "agua", "ferver", "cha", "cozinha"],
      blurb: "Ferve a água rápido e desliga sozinha quando acaba.",
      bullets: ["1,7 litro", "Desliga sozinha", "Base giratória"],
      bg: "#fdecea"
    },
    {
      id: "jogo-panelas",
      name: "Jogo de panelas antiaderente",
      category: "Casa",
      categoryId: "casa",
      price: 219.9,
      rating: 4.6,
      reviews: 176,
      deal: true,
      keywords: ["panela", "panelas", "frigideira", "cozinha", "antiaderente", "jogo"],
      blurb: "Três peças para o dia a dia. O antiaderente facilita a limpeza.",
      bullets: ["3 peças", "Cabos frios", "Serve em fogão comum"],
      bg: "#f3f1ea"
    },
    {
      id: "cafeteira",
      name: "Cafeteira elétrica 15 xícaras",
      category: "Casa",
      categoryId: "casa",
      price: 169.9,
      rating: 4.3,
      reviews: 142,
      deal: false,
      keywords: ["cafeteira", "cafe", "xicara", "xicaras", "cozinha", "eletrica"],
      blurb: "Prepara até 15 xícaras de uma vez. O jarro é transparente.",
      bullets: ["15 xícaras", "Jarro de vidro", "Filtro permanente"],
      bg: "#f6eee6"
    },
    {
      id: "mochila-notebook",
      name: "Mochila para notebook",
      category: "Moda",
      categoryId: "moda",
      price: 149.9,
      rating: 4.7,
      reviews: 318,
      deal: false,
      keywords: ["mochila", "notebook", "bolsa", "trabalho", "escolar", "costas"],
      blurb: "Cabe um notebook e o que você usa no dia. Alças acolchoadas.",
      bullets: ["Bolso para notebook", "Alças acolchoadas", "Vários compartimentos"],
      bg: "#e8eefb"
    },
    {
      id: "tenis-esportivo",
      name: "Tênis esportivo unissex",
      category: "Esporte",
      categoryId: "esporte",
      price: 199.9,
      rating: 4.4,
      reviews: 207,
      deal: true,
      keywords: ["tenis", "sapato", "calcado", "esporte", "corrida", "caminhada"],
      blurb: "Leve para caminhada e uso diário. Solado macio.",
      bullets: ["Solado macio", "Tecido respirável", "Unissex"],
      bg: "#eef6e8"
    },
    {
      id: "relogio-digital",
      name: "Relógio de pulso digital",
      category: "Moda",
      categoryId: "moda",
      price: 89.9,
      rating: 4.2,
      reviews: 96,
      deal: false,
      keywords: ["relogio", "pulso", "digital", "hora", "pulseira"],
      blurb: "Números grandes e luz no visor. Pulseira de silicone.",
      bullets: ["Números grandes", "Resistente a respingos", "Pulseira ajustável"],
      bg: "#f4eefb"
    },
    {
      id: "cobertor-casal",
      name: "Cobertor macio casal",
      category: "Casa",
      categoryId: "casa",
      price: 119.9,
      rating: 4.8,
      reviews: 388,
      deal: true,
      keywords: ["cobertor", "manta", "edredom", "cama", "casal", "soft"],
      blurb: "Quente e macio, tamanho casal. Fácil de lavar na máquina.",
      bullets: ["Tamanho casal", "Toque macio", "Pode ir à máquina"],
      bg: "#fdeef3"
    }
  ];

  var ARTS = {
    "fone-sem-fio":
      '<path d="M70 108 V90 a50 50 0 0 1 100 0 v18" fill="none" stroke="#1b2838" stroke-width="8" stroke-linecap="round"/>' +
      '<rect x="48" y="100" width="30" height="52" rx="12" fill="#1b2838"/>' +
      '<rect x="162" y="100" width="30" height="52" rx="12" fill="#1b2838"/>' +
      '<rect x="55" y="110" width="16" height="32" rx="6" fill="#7eb6ff"/>' +
      '<rect x="169" y="110" width="16" height="32" rx="6" fill="#7eb6ff"/>',
    "caixa-de-som":
      '<rect x="78" y="36" width="84" height="128" rx="18" fill="#243447"/>' +
      '<circle cx="120" cy="86" r="24" fill="none" stroke="#ff9900" stroke-width="7"/>' +
      '<circle cx="120" cy="86" r="8" fill="#ff9900"/>' +
      '<circle cx="120" cy="132" r="9" fill="#ffd814"/>',
    "mouse-optico":
      '<rect x="90" y="32" width="60" height="128" rx="30" fill="#2c3338"/>' +
      '<path d="M120 32 v40" stroke="#c5ced6" stroke-width="3"/>' +
      '<rect x="106" y="78" width="28" height="36" rx="8" fill="#ff9900"/>',
    "luminaria-led":
      '<path d="M72 78 h96 l-16 30 H88 z" fill="#f4c430"/>' +
      '<rect x="112" y="108" width="16" height="40" fill="#5c5346"/>' +
      '<rect x="80" y="148" width="80" height="12" rx="4" fill="#5c5346"/>' +
      '<circle cx="120" cy="70" r="6" fill="#fff4c2"/>',
    "garrafa-termica":
      '<rect x="104" y="34" width="32" height="16" rx="4" fill="#0f6e6e"/>' +
      '<path d="M90 62 h60 l12 16 v64 a18 18 0 0 1-18 18 H96 a18 18 0 0 1-18-18 V78 z" fill="#1a9b96"/>' +
      '<rect x="102" y="96" width="36" height="30" rx="4" fill="#e7fffb"/>' +
      '<rect x="98" y="54" width="44" height="12" rx="3" fill="#0f6e6e"/>',
    "chaleira-eletrica":
      '<path d="M70 78 h78 v58 a30 30 0 0 1-30 30 H96 a30 30 0 0 1-30-30 z" fill="#d64545"/>' +
      '<path d="M148 92 h18 a18 18 0 0 1 0 36 h-14" fill="none" stroke="#d64545" stroke-width="8"/>' +
      '<rect x="96" y="56" width="40" height="24" rx="4" fill="#8e2f2f"/>' +
      '<ellipse cx="108" cy="166" rx="46" ry="8" fill="#f0c2bc"/>',
    "jogo-panelas":
      '<ellipse cx="96" cy="118" rx="48" ry="18" fill="#3e4850"/>' +
      '<ellipse cx="96" cy="112" rx="40" ry="13" fill="#d5dde3"/>' +
      '<rect x="140" y="108" width="52" height="8" rx="4" fill="#2c3338"/>' +
      '<ellipse cx="132" cy="78" rx="32" ry="12" fill="#5c6770"/>' +
      '<ellipse cx="132" cy="74" rx="24" ry="8" fill="#e6ecef"/>' +
      '<rect x="160" y="70" width="36" height="7" rx="3" fill="#2c3338"/>',
    cafeteira:
      '<rect x="64" y="42" width="112" height="26" rx="6" fill="#2b2b2b"/>' +
      '<rect x="74" y="70" width="78" height="82" rx="8" fill="#fff" stroke="#2b2b2b" stroke-width="4"/>' +
      '<path d="M86 96 h52 v30 H86 z" fill="#6b4226"/>' +
      '<rect x="154" y="78" width="26" height="36" rx="4" fill="#6b4226"/>' +
      '<rect x="78" y="154" width="70" height="10" rx="2" fill="#2b2b2b"/>',
    "mochila-notebook":
      '<path d="M74 72 h92 v88 a16 16 0 0 1-16 16 H90 a16 16 0 0 1-16-16 z" fill="#243e73"/>' +
      '<path d="M96 72 v-14 a24 24 0 0 1 48 0 v14" fill="none" stroke="#243e73" stroke-width="8"/>' +
      '<rect x="96" y="104" width="48" height="36" rx="6" fill="#ff9900"/>' +
      '<rect x="108" y="80" width="24" height="12" rx="3" fill="#1b2c52"/>',
    "tenis-esportivo":
      '<path d="M40 126 h132 l18 22 H48 z" fill="#2f6b3a"/>' +
      '<path d="M54 126 c12-46 48-52 78-28 l32 28" fill="#3e8f4e"/>' +
      '<path d="M78 112 h36" stroke="#e8f5e9" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="176" cy="138" r="5" fill="#dff5e1"/>',
    "relogio-digital":
      '<rect x="104" y="32" width="32" height="26" rx="6" fill="#3d3154"/>' +
      '<rect x="82" y="54" width="76" height="88" rx="16" fill="#2a2438"/>' +
      '<rect x="94" y="68" width="52" height="40" rx="6" fill="#e4d4fb"/>' +
      '<path d="M120 88 v-10 M120 88 h12" stroke="#2a2438" stroke-width="3" stroke-linecap="round"/>' +
      '<rect x="104" y="142" width="32" height="22" rx="6" fill="#3d3154"/>',
    "cobertor-casal":
      '<path d="M46 58 h148 v92 H46 z" fill="#e7a0b4"/>' +
      '<path d="M46 58 q22 16 0 32 q22 16 0 32 q22 16 0 32" fill="none" stroke="#c46b86" stroke-width="6"/>' +
      '<path d="M194 58 q-22 16 0 32 q-22 16 0 32 q-22 16 0 32" fill="none" stroke="#c46b86" stroke-width="6"/>' +
      '<rect x="72" y="78" width="96" height="52" rx="8" fill="#f7d5df"/>'
  };

  function productArt(id) {
    var product = PRODUCTS.filter(function (p) { return p.id === id; })[0];
    var bg = product ? product.bg : "#f3f4f6";
    var inner = ARTS[id] || "";
    return (
      '<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      '<rect width="240" height="200" rx="0" fill="' + bg + '"/>' +
      inner +
      "</svg>"
    );
  }

  function getProduct(id) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].id === id) return PRODUCTS[i];
    }
    return null;
  }

  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    var la = a.length;
    var lb = b.length;
    if (!la) return lb;
    if (!lb) return la;
    if (Math.abs(la - lb) > 3 || la > 24 || lb > 24) return 9;
    var prev = new Array(lb + 1);
    var cur = new Array(lb + 1);
    var j;
    for (j = 0; j <= lb; j++) prev[j] = j;
    for (var i = 1; i <= la; i++) {
      cur[0] = i;
      var rowMin = cur[0];
      for (j = 1; j <= lb; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        var v = prev[j] + 1;
        if (cur[j - 1] + 1 < v) v = cur[j - 1] + 1;
        if (prev[j - 1] + cost < v) v = prev[j - 1] + cost;
        cur[j] = v;
        if (v < rowMin) rowMin = v;
      }
      if (rowMin > 3) return 9;
      for (j = 0; j <= lb; j++) prev[j] = cur[j];
    }
    return prev[lb];
  }

  var STOP = { de: 1, da: 1, do: 1, das: 1, dos: 1, e: 1, em: 1, para: 1, com: 1, a: 1, o: 1, um: 1, uma: 1, por: 1 };

  function wordsOf(product) {
    var bag = [product.name, product.category].concat(product.keywords);
    var seen = {};
    var out = [];
    normalize(bag.join(" ")).split(" ").forEach(function (w) {
      if (w && !seen[w]) {
        seen[w] = 1;
        out.push(w);
      }
    });
    return out;
  }

  function closestWord(token, words) {
    var best = null;
    var bestD = 9;
    var limit = token.length <= 4 ? 1 : token.length <= 8 ? 2 : 3;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (STOP[w]) continue;
      if (Math.abs(w.length - token.length) > limit) continue;
      var d = levenshtein(token, w);
      if (d < bestD) {
        bestD = d;
        best = w;
      }
    }
    if (bestD <= limit) return { word: best, distance: bestD };
    return null;
  }

  function searchProducts(query, categoryId) {
    var q = normalize(query);
    var tokens = q.split(" ").filter(function (t) { return t && !STOP[t]; });
    var list = PRODUCTS.filter(function (p) {
      return !categoryId || categoryId === "todos" || p.categoryId === categoryId;
    });

    if (!tokens.length) {
      return { items: list.slice(), suggestion: null, fuzzy: false, emptyQuery: !q };
    }

    var scored = [];
    list.forEach(function (p) {
      var words = wordsOf(p);
      var hay = words.join(" ");
      var score = 0;
      var fuzzy = false;
      var missed = false;
      if (hay.indexOf(q) !== -1) score += 40;
      tokens.forEach(function (t) {
        if (hay.indexOf(t) !== -1) {
          score += 12;
          words.forEach(function (w) {
            if (w.indexOf(t) === 0) score += 4;
          });
        } else {
          var near = closestWord(t, words);
          if (near) {
            score += 8 - near.distance * 2;
            fuzzy = true;
          } else {
            missed = true;
          }
        }
      });
      if (!missed && score > 0) scored.push({ p: p, score: score, fuzzy: fuzzy });
    });

    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.p.name.localeCompare(b.p.name, "pt");
    });

    var items = scored.map(function (s) { return s.p; });
    var suggestion = null;
    var allFuzzy = scored.length > 0 && scored.every(function (s) { return s.fuzzy; });

    if (!items.length || allFuzzy) {
      var dict = [];
      PRODUCTS.forEach(function (p) {
        wordsOf(p).forEach(function (w) {
          if (w.length >= 4 && dict.indexOf(w) === -1) dict.push(w);
        });
      });
      var anchor = tokens[0];
      var near = closestWord(anchor, dict);
      if (near && near.word !== anchor) suggestion = near.word;
      if (!suggestion && items[0]) suggestion = normalize(items[0].keywords[0] || items[0].name);
    }

    return {
      items: items,
      suggestion: suggestion,
      fuzzy: allFuzzy,
      emptyQuery: false
    };
  }

  global.PRODUCTS = PRODUCTS;
  global.LojaSearch = {
    searchProducts: searchProducts,
    normalize: normalize,
    productArt: productArt,
    getProduct: getProduct
  };
})(typeof window !== "undefined" ? window : globalThis);
