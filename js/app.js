(function () {
  "use strict";

  var CART_KEY = "lojafacil_cart";
  var AUTH_KEY = "lojafacil_auth";
  var RETURN_KEY = "lojafacil_return";

  var UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

  var CATEGORIES = {
    eletronicos: "Eletrônicos",
    casa: "Casa",
    moda: "Moda",
    esporte: "Esporte"
  };

  function blankAddress() {
    return { nome: "", cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "", telefone: "" };
  }

  function sanitizeCart(data) {
    var items = [];
    var source = data && Array.isArray(data.items) ? data.items : [];
    source.forEach(function (item) {
      if (!item || !LojaSearch.getProduct(item.id)) return;
      var qty = parseInt(item.qty, 10);
      if (!qty || qty < 1) return;
      items.push({ id: item.id, qty: Math.min(5, qty) });
    });
    return { items: items };
  }

  function loadAuth() {
    try {
      var raw = sessionStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data.email !== "string" || typeof data.name !== "string") return null;
      return { email: data.email, name: data.name };
    } catch (e) {
      return null;
    }
  }

  var cart = { items: [] };
  try {
    cart = sanitizeCart(JSON.parse(sessionStorage.getItem(CART_KEY) || "{\"items\":[]}"));
  } catch (e) {
    cart = { items: [] };
  }

  var auth = loadAuth();
  var returnTo = "#/";
  try { returnTo = sessionStorage.getItem(RETURN_KEY) || "#/"; } catch (e) {}
  var keepReturn = false;

  var draft = {
    step: 1,
    address: blankAddress(),
    payment: { method: "cartao", holder: "", last4: "", expiry: "" }
  };
  var maxStep = 1;
  var cardBuffer = "";
  var cvvBuffer = "";
  var orders = [];
  var undoSnapshot = null;
  var toastAction = null;
  var toastTimer = null;
  var toastMs = 0;
  var suggestItems = [];
  var suggestIndex = -1;
  var suggestLock = false;
  var loginState = { step: "email", email: "", errors: {} };
  var formErrors = {};
  var focusField = "";
  var pendingFocus = "";
  var lastRouteKey = "";
  var modalOpener = null;

  function esc(value) { return TestLog.esc(value); }

  function digits(value) { return String(value || "").replace(/\D/g, ""); }

  function money(value) {
    return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function saveCart() {
    cart = sanitizeCart(cart);
    try { sessionStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    paintChrome();
  }

  function saveAuth() {
    try {
      if (auth) sessionStorage.setItem(AUTH_KEY, JSON.stringify({ email: auth.email, name: auth.name }));
      else sessionStorage.removeItem(AUTH_KEY);
    } catch (e) {}
    paintChrome();
  }

  function setReturn(hash) {
    returnTo = hash || "#/";
    try { sessionStorage.setItem(RETURN_KEY, returnTo); } catch (e2) {}
  }

  function cartCount() {
    return cart.items.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function cartTotal() {
    return cart.items.reduce(function (sum, item) {
      var product = LojaSearch.getProduct(item.id);
      return sum + (product ? product.price * item.qty : 0);
    }, 0);
  }

  function wipeSensitive() {
    cardBuffer = "";
    cvvBuffer = "";
    draft.address = blankAddress();
    draft.payment = { method: "cartao", holder: "", last4: "", expiry: "" };
    draft.step = 1;
    maxStep = 1;
  }

  function parseRoute() {
    var raw = (location.hash || "").replace(/^#/, "");
    if (!raw || raw === "/") return { name: "home", id: "", params: {} };
    if (raw.charAt(0) === "/") raw = raw.slice(1);
    var qIndex = raw.indexOf("?");
    var path = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
    var query = qIndex >= 0 ? raw.slice(qIndex + 1) : "";
    var params = {};
    if (query) new URLSearchParams(query).forEach(function (value, key) { params[key] = value; });
    var parts = path.split("/").filter(Boolean);
    return {
      name: parts[0] || "home",
      id: parts[1] ? decodeURIComponent(parts[1]) : "",
      params: params
    };
  }

  function go(hash) {
    if (!hash) hash = "#/";
    if (hash.charAt(0) !== "#") hash = "#" + hash;
    if ((location.hash || "#/") === hash) render();
    else location.hash = hash;
  }

  function stars(rating) {
    var html = '<span class="stars" aria-hidden="true">';
    for (var i = 1; i <= 5; i++) {
      var on = rating >= i - 0.25;
      html += '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path fill="' +
        (on ? "#c45500" : "none") + '" stroke="' + (on ? "#c45500" : "#555") +
        '" stroke-width="1.2" d="M10 1.8 12.2 7l5.6.5-4.2 3.6 1.3 5.5L10 13.8 5.1 16.6 6.4 11.1 2.2 7.5 7.8 7z"/></svg>';
    }
    return html + "</span>";
  }

  function ratingText(product) {
    return product.rating.toFixed(1).replace(".", ",") + " de 5 estrelas (" +
      product.reviews.toLocaleString("pt-BR") + " avaliações)";
  }

  function paintChrome() {
    var hello = document.getElementById("hello-line");
    var strong = document.getElementById("hello-strong");
    var short = document.getElementById("hello-short");
    var account = document.getElementById("account-link");
    if (!hello || !account) return;
    if (auth) {
      hello.textContent = "Olá, " + auth.name;
      strong.textContent = "Conta e pedidos";
      short.textContent = auth.name;
      account.setAttribute("href", "#/conta");
    } else {
      hello.textContent = "Olá, faça seu login";
      strong.textContent = "Conta e pedidos";
      short.textContent = "Entrar";
      account.setAttribute("href", "#/entrar");
    }
    var count = cartCount();
    var cartCountEl = document.getElementById("cart-count");
    var cartLink = document.getElementById("cart-link");
    if (cartCountEl) cartCountEl.textContent = String(count);
    if (cartLink) {
      cartLink.setAttribute("aria-label", "Carrinho, " + count + (count === 1 ? " item" : " itens"));
    }
    var route = parseRoute();
    document.querySelectorAll("[data-nav]").forEach(function (link) {
      var nav = link.getAttribute("data-nav");
      var on = nav === route.name || nav === route.id;
      if (on) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function setDept(open) {
    var panel = document.getElementById("dept-panel");
    var button = document.getElementById("todos-btn");
    if (!panel || !button) return;
    panel.hidden = !open;
    button.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function hideSuggestions() {
    var list = document.getElementById("suggestions");
    var input = document.getElementById("q");
    suggestItems = [];
    suggestIndex = -1;
    if (list) {
      list.hidden = true;
      list.innerHTML = "";
    }
    if (input) {
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }
  }

  function cardHTML(product) {
    return (
      '<article class="card">' +
      '<a class="card-link" href="#/produto/' + encodeURIComponent(product.id) + '">' +
      '<div class="card-img">' + LojaSearch.productArt(product.id) + "</div>" +
      (product.deal ? '<p><span class="badge">Oferta</span></p>' : "") +
      '<h3 class="card-title">' + esc(product.name) + "</h3>" +
      '<p class="rating">' + stars(product.rating) + "<span>" + esc(ratingText(product)) + "</span></p>" +
      '<p class="price"><span class="sr-only">Preço: </span>' + money(product.price) + "</p>" +
      '<p class="ship">Frete grátis</p></a>' +
      '<button type="button" class="btn btn-add btn-block" data-action="add" data-id="' + product.id + '">Adicionar ao carrinho</button>' +
      "</article>"
    );
  }

  function gridHTML(list) {
    if (!list.length) {
      return '<div class="empty"><h2>Nenhum produto nesta lista</h2><p>Escolha outro departamento ou volte ao início.</p></div>';
    }
    return '<div class="grid">' + list.map(cardHTML).join("") + "</div>";
  }

  function fieldInput(opts) {
    var error = opts.error || "";
    var described = [];
    if (opts.hint) described.push(opts.id + "-hint");
    if (error) described.push(opts.id + "-err");
    return (
      '<div class="field' + (error ? " has-error" : "") + '">' +
      "<label for=\"" + opts.id + "\">" + opts.label + "</label>" +
      (opts.hint ? '<p class="hint" id="' + opts.id + '-hint">' + opts.hint + "</p>" : "") +
      '<input id="' + opts.id + '" name="' + opts.id + '" type="' + (opts.type || "text") + '" value="' + esc(opts.value || "") + '"' +
      (opts.inputmode ? ' inputmode="' + opts.inputmode + '"' : "") +
      (opts.mask ? ' data-mask="' + opts.mask + '"' : "") +
      ' autocomplete="off" spellcheck="false"' +
      (error ? ' aria-invalid="true"' : "") +
      (described.length ? ' aria-describedby="' + described.join(" ") + '"' : "") + ">" +
      (error ? '<p class="error" id="' + opts.id + '-err">' + esc(error) + "</p>" : "") +
      "</div>"
    );
  }

  function errorSummary(errors) {
    var keys = Object.keys(errors || {});
    if (!keys.length) return "";
    return '<div class="banner-error" role="alert"><p><strong>Não deu para continuar.</strong> Corrija os campos abaixo.</p><ul>' +
      keys.map(function (key) { return "<li>" + esc(errors[key]) + "</li>"; }).join("") + "</ul></div>";
  }

  function stepsHTML(current) {
    var labels = ["Endereço", "Pagamento", "Revisão"];
    var html = '<ol class="steps" aria-label="Etapas da compra">';
    for (var i = 1; i <= 3; i++) {
      var cls = i === current ? "current" : i < current ? "done" : "";
      html += '<li class="' + cls + '"><button type="button" data-action="goto-step" data-step="' + i + '"' +
        (i > maxStep ? " disabled" : "") + (i === current ? ' aria-current="step"' : "") + ">" +
        '<span class="bubble">' + (i < current ? "✓" : String(i)) + "</span>" +
        '<span class="step-label">' + labels[i - 1] + "</span></button></li>";
    }
    return html + "</ol>";
  }

  function cartSummary() {
    var lines = cart.items.map(function (item) {
      var product = LojaSearch.getProduct(item.id);
      if (!product) return "";
      return "<p>" + esc(product.name) + " × " + item.qty + "<br><strong>" + money(product.price * item.qty) + "</strong></p>";
    }).join("");
    return '<aside class="panel"><h2>Seu pedido</h2>' + lines +
      "<p>Frete: <strong>Grátis</strong></p><p class=\"price\" id=\"total\">" + money(cartTotal()) + "</p></aside>";
  }

  function qtyOptions(selected) {
    var html = "";
    for (var i = 1; i <= 5; i++) html += '<option value="' + i + '"' + (i === selected ? " selected" : "") + ">" + i + "</option>";
    return html;
  }

  function emailError(value) {
    var email = String(value || "").trim();
    if (!email) return "Digite o e-mail para continuar.";
    if (/\s/.test(email)) return "O e-mail não pode ter espaço. Exemplo: maria@teste.com.";
    if (email.indexOf("@") === -1) return "Falta o @. Exemplo: maria@teste.com.";
    var parts = email.split("@");
    if (parts.length !== 2 || !parts[0] || !parts[1]) return "Esse e-mail não parece completo. Exemplo: maria@teste.com.";
    if (parts[1].indexOf(".") === -1 || parts[1].charAt(0) === "." || parts[1].charAt(parts[1].length - 1) === ".") {
      return "Falta o ponto do provedor. Exemplo: maria@teste.com.";
    }
    return "";
  }

  function passwordError(value) {
    var password = String(value || "");
    if (!password.trim()) return "Digite a senha para entrar.";
    if (password.trim().length < 6) {
      return "A senha precisa ter pelo menos 6 caracteres. A que você digitou tem " +
        password.trim().length + ". No teste, pode ser uma senha inventada.";
    }
    return "";
  }

  function nameFromEmail(email) {
    var local = email.split("@")[0].replace(/[._-]+/g, " ").trim();
    if (!local) return "Cliente";
    var name = local.split(" ").filter(Boolean).map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(" ");
    return name.length > 22 ? name.slice(0, 22) : name;
  }

  function luhn(num) {
    var sum = 0;
    var alt = false;
    for (var i = num.length - 1; i >= 0; i--) {
      var n = parseInt(num.charAt(i), 10);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function maskCep(value) {
    var d = digits(value).slice(0, 8);
    return d.length <= 5 ? d : d.slice(0, 5) + "-" + d.slice(5);
  }

  function maskCard(value) {
    return digits(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  }

  function maskExp(value) {
    var d = digits(value).slice(0, 4);
    return d.length <= 2 ? d : d.slice(0, 2) + "/" + d.slice(2);
  }

  function maskPhone(value) {
    var d = digits(value).slice(0, 11);
    if (d.length < 3) return d;
    if (d.length < 7) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  function validateAddress(address) {
    var errors = {};
    var first = "";
    function need(id, failed, message) {
      if (failed && !errors[id]) {
        errors[id] = message;
        if (!first) first = id;
      }
    }
    var nome = address.nome.trim().split(/\s+/).filter(function (word) { return word.length >= 2; });
    need("nome", nome.length < 2, "Escreva nome e sobrenome.");
    need("cep", digits(address.cep).length !== 8, "Digite o CEP com 8 números. Exemplo: 32600-000.");
    need("rua", address.rua.trim().length < 3, "Digite o nome da rua.");
    need("numero", !address.numero.trim(), "Informe o número. Se não houver, escreva s/n.");
    need("bairro", address.bairro.trim().length < 2, "Digite o bairro.");
    need("cidade", address.cidade.trim().length < 2, "Digite a cidade.");
    need("uf", !address.uf, "Escolha o estado.");
    var phone = digits(address.telefone);
    need("telefone", phone.length > 0 && (phone.length < 10 || phone.length > 11), "O telefone precisa ter DDD e número. Se não quiser informar, deixe em branco.");
    return { errors: errors, first: first };
  }

  function validatePayment() {
    var errors = {};
    var first = "";
    function need(id, failed, message) {
      if (failed && !errors[id]) {
        errors[id] = message;
        if (!first) first = id;
      }
    }
    if (draft.payment.method === "cartao") {
      var holderParts = draft.payment.holder.trim().split(/\s+/).filter(function (word) { return word.length >= 2; });
      need("holder", holderParts.length < 2, "Escreva o nome e o sobrenome do cartão. No teste, pode ser MARIA TESTE.");
      var number = digits(cardBuffer);
      need("card", number.length !== 16 || !luhn(number), "Confira os números do cartão. Para o teste, use 4242 4242 4242 4242.");
      var exp = digits(draft.payment.expiry);
      var expOk = false;
      if (exp.length === 4) {
        var month = parseInt(exp.slice(0, 2), 10);
        var year = 2000 + parseInt(exp.slice(2), 10);
        var now = new Date();
        var current = now.getFullYear() * 12 + now.getMonth();
        expOk = month >= 1 && month <= 12 && (year * 12 + month - 1) >= current;
      }
      need("exp", !expOk, "Digite mês e ano válidos, por exemplo 12/28.");
      var cvv = digits(cvvBuffer);
      need("cvv", cvv.length < 3 || cvv.length > 4, "O código de segurança tem 3 ou 4 números. No teste, use 123.");
    }
    return { errors: errors, first: first };
  }

  function showToast(message, opts) {
    opts = opts || {};
    if (!opts.keepsUndo) undoSnapshot = null;
    toastAction = opts.onAction || null;
    var toast = document.getElementById("toast");
    var action = document.getElementById("toast-action");
    if (!toast || !action) return;
    toast.hidden = false;
    document.getElementById("toast-text").textContent = message;
    if (opts.actionLabel) {
      action.hidden = false;
      action.textContent = opts.actionLabel;
    } else {
      action.hidden = true;
    }
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = null;
    toastMs = opts.sticky ? 0 : (opts.ms || 7000);
    if (toastMs) toastTimer = setTimeout(hideToast, toastMs);
    if (opts.focusAction && !action.hidden) action.focus();
  }

  function hideToast() {
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = null;
    toastMs = 0;
    var toast = document.getElementById("toast");
    if (toast) toast.hidden = true;
    toastAction = null;
  }

  function addToCart(id, qty) {
    var product = LojaSearch.getProduct(id);
    if (!product) return;
    var amount = parseInt(qty, 10);
    if (!amount || amount < 1) amount = 1;
    TestLog.startTask("adicionar");
    var found = null;
    cart.items.forEach(function (item) { if (item.id === id) found = item; });
    if (found) found.qty = Math.min(5, found.qty + amount);
    else cart.items.push({ id: id, qty: Math.min(5, amount) });
    saveCart();
    TestLog.completeTask("adicionar");
    showToast(product.name + " foi adicionado ao carrinho.", {
      actionLabel: "Ver carrinho",
      onAction: function () { go("#/carrinho"); }
    });
  }

  function qtyFor(id) {
    var select = document.getElementById("qty");
    if (select && select.getAttribute("data-id") === id) return parseInt(select.value, 10) || 1;
    return 1;
  }

  function updateQty(id, value) {
    var amount = parseInt(value, 10);
    if (!amount || amount < 1) amount = 1;
    if (amount > 5) amount = 5;
    cart.items.forEach(function (item) {
      if (item.id === id) item.qty = amount;
    });
    saveCart();
    var product = LojaSearch.getProduct(id);
    var line = document.getElementById("line-" + id);
    if (line && product) line.textContent = money(product.price * amount);
    var subtotal = document.getElementById("subtotal");
    if (subtotal) subtotal.textContent = money(cartTotal());
    var total = document.getElementById("total");
    if (total) total.textContent = money(cartTotal());
    var live = document.getElementById("live");
    if (live) live.textContent = "Quantidade atualizada para " + amount + ".";
  }

  function removeItem(id) {
    var product = LojaSearch.getProduct(id);
    var current = null;
    cart.items.forEach(function (item) { if (item.id === id) current = item; });
    if (!current) return;
    TestLog.startTask("remover");
    undoSnapshot = { id: current.id, qty: current.qty };
    cart.items = cart.items.filter(function (item) { return item.id !== id; });
    saveCart();
    TestLog.completeTask("remover");
    render();
    showToast((product ? product.name : "Item") + " saiu do carrinho.", {
      actionLabel: "Desfazer",
      sticky: true,
      keepsUndo: true,
      focusAction: true,
      onAction: undoRemove
    });
  }

  function undoRemove() {
    if (!undoSnapshot) return;
    var snap = undoSnapshot;
    undoSnapshot = null;
    var found = null;
    cart.items.forEach(function (item) { if (item.id === snap.id) found = item; });
    if (found) found.qty = Math.min(5, found.qty + snap.qty);
    else cart.items.push({ id: snap.id, qty: snap.qty });
    saveCart();
    TestLog.reopenTask("remover");
    TestLog.addError("remover", "Desfez a remoção");
    hideToast();
    render();
    var live = document.getElementById("live");
    if (live) live.textContent = "Item restaurado no carrinho.";
  }

  function submitSearch(forcedQuery) {
    var input = document.getElementById("q");
    var dept = document.getElementById("dept");
    var query = typeof forcedQuery === "string" ? forcedQuery : (input ? input.value : "");
    var cat = dept ? dept.value : "todos";
    if (input && typeof forcedQuery === "string") input.value = forcedQuery;
    hideSuggestions();
    var meaningful = LojaSearch.normalize(query);
    TestLog.startTask("buscar");
    var result = LojaSearch.searchProducts(query, cat);
    if (!meaningful && (!cat || cat === "todos")) TestLog.addError("buscar", "Busca vazia");
    else if (!result.items.length) TestLog.addError("buscar", "Nenhum resultado");
    else TestLog.completeTask("buscar");
    go("#/busca?q=" + encodeURIComponent(query) + "&cat=" + encodeURIComponent(cat || "todos"));
  }

  function onSearchInput() {
    var input = document.getElementById("q");
    var clearButton = document.getElementById("clear-q");
    if (!input) return;
    if (clearButton) clearButton.hidden = !input.value;
    if (LojaSearch.normalize(input.value).length < 2) {
      hideSuggestions();
      return;
    }
    TestLog.startTask("buscar");
    var cat = document.getElementById("dept").value;
    var result = LojaSearch.searchProducts(input.value, cat);
    var items = result.items.slice(0, 6).map(function (product) {
      return {
        productId: product.id,
        html: '<span class="sug-name">' + esc(product.name) + '</span><span class="sug-meta">' +
          esc(product.category) + " · " + money(product.price) + "</span>"
      };
    });
    if (!items.length && result.suggestion) {
      items = [{
        query: result.suggestion,
        html: '<span class="sug-name">Você quis dizer ' + esc(result.suggestion) + "</span>"
      }];
    }
    suggestItems = items;
    suggestIndex = -1;
    var list = document.getElementById("suggestions");
    list.innerHTML = items.map(function (item, index) {
      return '<li role="presentation"><button type="button" role="option" id="sug-' + index +
        '" data-action="pick-suggest" data-index="' + index + '">' + item.html + "</button></li>";
    }).join("");
    var open = items.length > 0;
    list.hidden = !open;
    input.setAttribute("aria-expanded", open ? "true" : "false");
    input.removeAttribute("aria-activedescendant");
  }

  function moveSuggest(delta) {
    if (!suggestItems.length) return;
    suggestIndex = (suggestIndex + delta + suggestItems.length) % suggestItems.length;
    var buttons = document.querySelectorAll("#suggestions button");
    buttons.forEach(function (button, index) {
      button.setAttribute("aria-selected", index === suggestIndex ? "true" : "false");
    });
    var input = document.getElementById("q");
    input.setAttribute("aria-activedescendant", "sug-" + suggestIndex);
  }

  function pickSuggest(index) {
    var item = suggestItems[index];
    if (!item) return;
    hideSuggestions();
    if (item.productId) {
      TestLog.startTask("buscar");
      TestLog.completeTask("buscar");
      go("#/produto/" + item.productId);
      return;
    }
    if (item.query) submitSearch(item.query);
  }

  function clearSearch() {
    var input = document.getElementById("q");
    input.value = "";
    var clearButton = document.getElementById("clear-q");
    if (clearButton) clearButton.hidden = true;
    hideSuggestions();
    input.focus();
  }

  function readAddress() {
    function val(id) {
      var el = document.getElementById(id);
      return el ? el.value : (draft.address[id] || "");
    }
    if (!document.getElementById("nome")) return;
    draft.address = {
      nome: val("nome"),
      cep: val("cep"),
      rua: val("rua"),
      numero: val("numero"),
      complemento: val("complemento"),
      bairro: val("bairro"),
      cidade: val("cidade"),
      uf: val("uf"),
      telefone: val("telefone")
    };
  }

  function readPayment() {
    var selected = document.querySelector('input[name="pay"]:checked');
    if (selected) draft.payment.method = selected.value;
    var holder = document.getElementById("holder");
    if (holder) draft.payment.holder = holder.value;
    var card = document.getElementById("card");
    if (card) cardBuffer = digits(card.value);
    var exp = document.getElementById("exp");
    if (exp) draft.payment.expiry = exp.value;
    var cvv = document.getElementById("cvv");
    if (cvv) cvvBuffer = digits(cvv.value);
  }

  function submitAddress() {
    readAddress();
    var result = validateAddress(draft.address);
    if (result.first) {
      TestLog.addError("finalizar", "Endereço incompleto");
      formErrors = result.errors;
      focusField = result.first;
      draft.step = 1;
      render();
      return;
    }
    formErrors = {};
    draft.step = 2;
    maxStep = Math.max(maxStep, 2);
    focusField = "";
    render();
  }

  function submitPayment() {
    readPayment();
    var result = validatePayment();
    if (result.first) {
      TestLog.addError("finalizar", "Pagamento incompleto");
      formErrors = result.errors;
      focusField = result.first;
      draft.step = 2;
      render();
      return;
    }
    if (draft.payment.method === "cartao") draft.payment.last4 = digits(cardBuffer).slice(-4);
    else {
      draft.payment.last4 = "";
      cardBuffer = "";
    }
    cvvBuffer = "";
    formErrors = {};
    draft.step = 3;
    maxStep = 3;
    render();
  }

  function gotoStep(step) {
    step = parseInt(step, 10);
    if (!step || step > maxStep || step === draft.step) return;
    if (step > draft.step) {
      if (draft.step === 1) submitAddress();
      else if (draft.step === 2) submitPayment();
      return;
    }
    if (draft.step === 1) readAddress();
    if (draft.step === 2) readPayment();
    draft.step = step;
    formErrors = {};
    render();
  }

  function submitLogin() {
    TestLog.startTask("login");
    if (loginState.step !== "password") {
      var emailInput = document.getElementById("login-email");
      var email = emailInput ? emailInput.value : "";
      var err = emailError(email);
      if (err) {
        TestLog.addError("login", email.trim() ? "E-mail inválido" : "E-mail vazio");
        loginState.email = email;
        loginState.errors = { email: err };
        focusField = "login-email";
        render();
        return;
      }
      loginState.email = email.trim();
      loginState.errors = {};
      loginState.step = "password";
      focusField = "login-password";
      render();
      return;
    }
    var passwordInput = document.getElementById("login-password");
    var typed = passwordInput ? passwordInput.value : "";
    var perr = passwordError(typed);
    typed = "";
    if (passwordInput) passwordInput.value = "";
    if (perr) {
      TestLog.addError("login", perr.indexOf("Digite a senha") === 0 ? "Senha vazia" : "Senha curta");
      loginState.errors = { password: perr };
      focusField = "login-password";
      render();
      return;
    }
    auth = { email: loginState.email, name: nameFromEmail(loginState.email) };
    saveAuth();
    TestLog.completeTask("login");
    var dest = returnTo && returnTo !== "#/entrar" ? returnTo : "#/";
    setReturn("#/");
    loginState.step = "email";
    loginState.errors = {};
    go(dest);
  }

  function placeOrder() {
    if (!auth) {
      setReturn("#/checkout");
      go("#/entrar");
      return;
    }
    if (!cart.items.length) {
      TestLog.addError("finalizar", "Carrinho vazio");
      go("#/carrinho");
      return;
    }
    var snapshot = cart.items.map(function (item) {
      var product = LojaSearch.getProduct(item.id);
      return { id: item.id, name: product.name, qty: item.qty, price: product.price };
    });
    var payLabel = draft.payment.method === "pix" ? "Pix (simulado)" :
      draft.payment.method === "boleto" ? "Boleto (simulado)" : "Cartão de crédito";
    var order = {
      id: "LF-" + String(Math.floor(100000 + Math.random() * 900000)),
      items: snapshot,
      total: cartTotal(),
      payLabel: payLabel,
      city: draft.address.cidade,
      uf: draft.address.uf,
      at: new Date().toLocaleString("pt-BR")
    };
    orders.push(order);
    cart.items = [];
    saveCart();
    cardBuffer = "";
    cvvBuffer = "";
    draft.address = blankAddress();
    draft.payment = { method: "cartao", holder: "", last4: "", expiry: "" };
    draft.step = 1;
    maxStep = 1;
    TestLog.startTask("finalizar");
    TestLog.completeTask("finalizar");
    go("#/pedido/" + order.id);
  }

  function logout() {
    auth = null;
    saveAuth();
    loginState = { step: "email", email: "", errors: {} };
    go("#/");
  }

  function openModal(title, body) {
    var modal = document.getElementById("modal");
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").innerHTML = body;
    modal.hidden = false;
    var page = document.getElementById("page");
    if ("inert" in page) page.inert = true;
    modalOpener = document.activeElement;
    document.getElementById("modal-close").focus();
  }

  function closeModal() {
    var modal = document.getElementById("modal");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    var page = document.getElementById("page");
    if ("inert" in page) page.inert = false;
    if (modalOpener && typeof modalOpener.focus === "function") modalOpener.focus();
    modalOpener = null;
  }

  function trapFocus(container, event) {
    var nodes = container.querySelectorAll("a, button, input, select, textarea");
    var list = [];
    nodes.forEach(function (node) {
      if (!node.disabled && node.offsetParent !== null) list.push(node);
    });
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function copyOrder(id) {
    function finish(ok) {
      showToast(ok ? "Número do pedido copiado." : "Selecione o número com o mouse e copie.", { ms: 5000 });
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(id).then(function () { finish(true); }).catch(function () { finish(false); });
    } else finish(false);
  }

  function viewHome() {
    var arts = ["fone-sem-fio", "jogo-panelas", "tenis-esportivo"].map(function (id) {
      return LojaSearch.productArt(id);
    }).join("");
    return {
      title: "Início",
      html:
        '<section class="hero"><div><h1>Seleção da semana</h1>' +
        "<p>Itens úteis para casa, trabalho e dia a dia. Frete grátis em todo o Brasil.</p>" +
        '<a class="btn btn-buy" href="#/ofertas">Ver ofertas</a></div>' +
        '<div class="hero-art" aria-hidden="true">' + arts + "</div></section>" +
        '<div class="tiles">' +
        '<a class="tile" href="#/c/eletronicos"><span class="tile-name">Eletrônicos</span><span class="tile-desc">Fones, som e informática</span></a>' +
        '<a class="tile" href="#/c/casa"><span class="tile-name">Casa</span><span class="tile-desc">Cozinha e dia a dia</span></a>' +
        '<a class="tile" href="#/c/moda"><span class="tile-name">Moda</span><span class="tile-desc">Mochila e relógio</span></a>' +
        '<a class="tile" href="#/c/esporte"><span class="tile-name">Esporte</span><span class="tile-desc">Tênis para caminhar</span></a>' +
        "</div><h2>Produtos em destaque</h2>" + gridHTML(PRODUCTS) +
        "<p>" + PRODUCTS.length + " produtos nesta loja de teste.</p>"
    };
  }

  function viewCategory(id) {
    var name = CATEGORIES[id];
    if (!name) return null;
    var list = PRODUCTS.filter(function (product) { return product.categoryId === id; });
    return {
      title: name,
      html: '<p class="crumbs"><a href="#/">Início</a> / ' + esc(name) + "</p><h1>" + esc(name) + "</h1>" + gridHTML(list)
    };
  }

  function viewOffers() {
    var list = PRODUCTS.filter(function (product) { return product.deal; });
    return {
      title: "Ofertas do dia",
      html: '<p class="crumbs"><a href="#/">Início</a> / Ofertas do dia</p><h1>Ofertas do dia</h1><p>Preço único, sem letrinhas miúdas.</p>' + gridHTML(list)
    };
  }

  function viewSearch(route) {
    var query = route.params.q || "";
    var cat = route.params.cat || "todos";
    var result = LojaSearch.searchProducts(query, cat);
    var meaningful = LojaSearch.normalize(query);
    if (meaningful && result.items.length) TestLog.completeTask("buscar");
    var banner = "";
    if (result.suggestion && (result.fuzzy || !result.items.length)) {
      var href = "#/busca?q=" + encodeURIComponent(result.suggestion) + "&cat=" + encodeURIComponent(cat);
      banner = '<p class="notice warn">Você quis dizer <a href="' + href + '"><strong>' + esc(result.suggestion) + "</strong></a>?</p>";
    }
    var titleQuery = query.trim() ? "Resultados para “" + query.trim() + "”" : "Busca";
    var body;
    if (!meaningful && cat === "todos") {
      body = '<div class="empty"><h1>Digite o que você procura</h1><p>Use a barra do topo. Exemplos: fone, panela, tênis ou cafeteira. Se a palavra sair errada, a loja sugere a correção.</p></div>';
    } else if (!result.items.length) {
      body = '<div class="empty"><h1>Não encontramos “' + esc(query.trim()) + '”</h1>' + banner +
        "<p>Tente uma palavra mais curta, como fone, panela, tênis ou cafeteira.</p>" +
        '<a class="btn btn-add" href="#/">Ver todos os produtos</a></div>';
      banner = "";
    } else {
      body = "<h1>" + esc(titleQuery) + "</h1>" + banner + "<p>" + result.items.length +
        (result.items.length === 1 ? " produto encontrado." : " produtos encontrados.") + "</p>" + gridHTML(result.items);
    }
    return { title: titleQuery, html: body };
  }

  function viewProduct(id) {
    var product = LojaSearch.getProduct(id);
    if (!product) return null;
    TestLog.startTask("adicionar");
    return {
      title: product.name,
      html:
        '<p class="crumbs"><a href="#/">Início</a> / <a href="#/c/' + product.categoryId + '">' + esc(product.category) + "</a> / " + esc(product.name) + "</p>" +
        '<article class="pdp"><div class="pdp-img">' + LojaSearch.productArt(product.id) + "</div>" +
        '<div class="pdp-info"><h1>' + esc(product.name) + "</h1>" +
        '<p class="rating">' + stars(product.rating) + "<span>" + esc(ratingText(product)) + "</span></p>" +
        "<p>" + esc(product.blurb) + "</p><ul class=\"bullets\">" +
        product.bullets.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") +
        "</ul></div><div class=\"pdp-buy buybox\"><p class=\"price\">" + money(product.price) + "</p>" +
        '<p class="ship">Frete grátis</p><p class="stock">Em estoque</p>' +
        '<div class="field"><label for="qty">Quantidade</label><select id="qty" data-id="' + product.id + '">' +
        qtyOptions(1) + "</select></div>" +
        '<div class="btn-row"><button type="button" class="btn btn-add btn-block" data-action="add" data-id="' + product.id + '">Adicionar ao carrinho</button>' +
        '<button type="button" class="btn btn-buy btn-block" data-action="buy" data-id="' + product.id + '">Comprar agora</button></div>' +
        "<p class=\"hint\">Comprar agora leva você ao endereço e ao pagamento. Se ainda não entrou, o login vem antes.</p></div></article>"
    };
  }

  function viewCart() {
    if (cart.items.length) TestLog.startTask("remover");
    if (!cart.items.length) {
      return {
        title: "Carrinho",
        html: '<div class="empty"><h1>Seu carrinho está vazio</h1><p>Quando você adicionar um produto, ele aparece aqui.</p><a class="btn btn-add" href="#/">Ver produtos</a></div>'
      };
    }
    var rows = cart.items.map(function (item) {
      var product = LojaSearch.getProduct(item.id);
      return '<article class="cart-item"><div>' + LojaSearch.productArt(product.id) + "</div><div>" +
        '<h2><a href="#/produto/' + product.id + '">' + esc(product.name) + "</a></h2>" +
        '<p class="price" id="line-' + product.id + '">' + money(product.price * item.qty) + "</p>" +
        '<div class="qty-line"><label for="qty-' + product.id + '">Quantidade</label>' +
        '<select id="qty-' + product.id + '" data-cart-qty="' + product.id + '">' + qtyOptions(item.qty) + "</select>" +
        '<button type="button" class="btn btn-ghost btn-small" data-action="remove" data-id="' + product.id + '">Remover</button></div></div></article>';
    }).join("");
    return {
      title: "Carrinho",
      html: "<h1>Carrinho</h1><div class=\"layout\"><div class=\"panel\">" + rows + "</div>" +
        '<aside class="panel buybox"><h2>Resumo</h2><p>Subtotal</p><p class="price" id="subtotal">' + money(cartTotal()) + "</p>" +
        "<p>Frete: <strong>Grátis</strong></p><p class=\"hint\">" +
        (auth ? "O próximo passo é o endereço de entrega." : "Você entra na conta antes de informar o endereço.") +
        '</p><button type="button" class="btn btn-add btn-block" data-action="checkout">Finalizar compra</button>' +
        '<a class="btn btn-ghost btn-block" href="#/">Continuar comprando</a></aside></div>'
    };
  }

  function viewLogin() {
    if (auth) {
      return {
        title: "Conta",
        html: '<div class="auth-wrap"><div class="auth-card"><h1>Você já entrou</h1><p>Olá, ' + esc(auth.name) +
          ". A senha não fica salva.</p>" +
          '<div class="btn-row"><a class="btn btn-add btn-block" href="' + esc(returnTo || "#/") + '">Continuar</a>' +
          '<a class="btn btn-ghost btn-block" href="#/carrinho">Ir ao carrinho</a>' +
          '<button type="button" class="btn btn-ghost btn-block" data-action="logout">Sair</button></div></div></div>'
      };
    }
    TestLog.startTask("login");
    var emailErr = loginState.errors.email || "";
    var passErr = loginState.errors.password || "";
    var body;
    if (loginState.step === "password") {
      body = '<p>Passo 2 de 2</p><h1>Digite sua senha</h1>' +
        '<p>' + esc(loginState.email) + ' <button type="button" class="btn btn-ghost btn-small" data-action="change-email">Trocar e-mail</button></p>' +
        errorSummary(passErr ? { password: passErr } : {}) +
        '<form id="login-form" novalidate autocomplete="off">' +
        fieldInput({
          id: "login-password",
          label: "Senha",
          hint: "Mínimo de 6 caracteres. Pode ser uma senha inventada. Ela não será gravada.",
          type: "password",
          error: passErr,
          attrs: ""
        }) +
        '<label class="check" for="show-pass"><input id="show-pass" type="checkbox"> <span>Mostrar senha</span></label>' +
        '<button class="btn btn-add btn-block" type="submit">Entrar</button></form>';
    } else {
      body = '<p>Passo 1 de 2</p><h1>Fazer login</h1>' +
        '<div class="notice warn"><strong>Não use sua senha real.</strong> Este é um protótipo de pesquisa. Qualquer e-mail válido serve, por exemplo maria@teste.com. Nada é enviado para a internet.</div>' +
        errorSummary(emailErr ? { email: emailErr } : {}) +
        '<form id="login-form" novalidate autocomplete="off">' +
        fieldInput({
          id: "login-email",
          label: "E-mail",
          hint: "Exemplo: maria@teste.com",
          type: "text",
          inputmode: "email",
          value: loginState.email,
          error: emailErr
        }) +
        '<button class="btn btn-add btn-block" type="submit">Continuar</button></form>' +
        '<p class="hint">Não precisa criar conta. O mesmo e-mail serve para entrar.</p>';
    }
    return { title: "Fazer login", html: '<div class="auth-wrap"><div class="auth-card">' + body + "</div></div>" };
  }

  function viewCheckout() {
    if (!cart.items.length) {
      return {
        title: "Finalizar compra",
        html: '<div class="empty"><h1>Seu carrinho está vazio</h1><p>Escolha um produto antes de finalizar a compra.</p><a class="btn btn-add" href="#/">Ver produtos</a></div>'
      };
    }
    if (!auth) {
      return {
        title: "Entrar para finalizar",
        html: '<div class="empty"><h1>Entre para finalizar a compra</h1><p>É rápido. Depois você volta para o endereço e o pagamento.</p>' +
          '<div class="btn-row inline"><button type="button" class="btn btn-add" data-action="go-login" data-dest="#/checkout">Fazer login</button>' +
          '<a class="btn btn-ghost" href="#/carrinho">Voltar ao carrinho</a></div></div>'
      };
    }
    TestLog.startTask("finalizar");
    var step = draft.step;
    if (step < 1 || step > 3) step = 1;
    var main = "";
    if (step === 1) {
      var a = draft.address;
      var e = formErrors;
      main = "<h1>Passo 1 de 3: Endereço</h1>" + stepsHTML(1) +
        '<div class="notice warn"><strong>O endereço não fica salvo.</strong> Ele só aparece nesta compra simulada e é apagado no fim. Nada é enviado.</div>' +
        errorSummary(e) +
        '<form id="address-form" novalidate autocomplete="off">' +
        fieldInput({ id: "nome", label: "Nome completo", hint: "Nome e sobrenome.", value: a.nome, error: e.nome }) +
        fieldInput({ id: "cep", label: "CEP", hint: "Exemplo: 32600-000.", value: a.cep, error: e.cep, inputmode: "numeric", mask: "cep" }) +
        fieldInput({ id: "rua", label: "Rua", value: a.rua, error: e.rua }) +
        '<div class="two">' +
        fieldInput({ id: "numero", label: "Número", hint: "Se não houver, escreva s/n.", value: a.numero, error: e.numero }) +
        fieldInput({ id: "complemento", label: "Complemento (opcional)", value: a.complemento, error: e.complemento }) +
        "</div>" +
        fieldInput({ id: "bairro", label: "Bairro", value: a.bairro, error: e.bairro }) +
        '<div class="two">' +
        fieldInput({ id: "cidade", label: "Cidade", value: a.cidade, error: e.cidade }) +
        ufField(e.uf) +
        "</div>" +
        fieldInput({ id: "telefone", label: "Telefone (opcional)", value: a.telefone, error: e.telefone, inputmode: "tel", mask: "phone" }) +
        '<button class="btn btn-add btn-block" type="submit">Continuar para pagamento</button></form>';
    } else if (step === 2) {
      var p = draft.payment;
      var pe = formErrors;
      var method = p.method || "cartao";
      main = "<h1>Passo 2 de 3: Pagamento</h1>" + stepsHTML(2) +
        '<div class="notice warn"><strong>Não use um cartão de verdade.</strong> Para o teste, use 4242 4242 4242 4242, validade 12/28 e código 123. Nada é enviado nem gravado.</div>' +
        errorSummary(pe) +
        '<form id="payment-form" novalidate autocomplete="off">' +
        '<fieldset class="choice-list"><legend class="sr-only">Forma de pagamento</legend>' +
        choice("cartao", "Cartão de crédito", method) +
        choice("pix", "Pix (simulado)", method) +
        choice("boleto", "Boleto (simulado)", method) +
        "</fieldset>" +
        '<div id="card-fields"' + (method === "cartao" ? "" : " hidden") + ">" +
        fieldInput({ id: "holder", label: "Nome impresso no cartão", hint: "No teste, pode ser MARIA TESTE.", value: p.holder, error: pe.holder }) +
        fieldInput({ id: "card", label: "Número do cartão", hint: "Para o teste: 4242 4242 4242 4242.", value: maskCard(cardBuffer), error: pe.card, inputmode: "numeric", mask: "card" }) +
        '<div class="two">' +
        fieldInput({ id: "exp", label: "Validade", hint: "Mês e ano, por exemplo 12/28.", value: p.expiry, error: pe.exp, inputmode: "numeric", mask: "exp" }) +
        fieldInput({ id: "cvv", label: "Código de segurança", hint: "3 ou 4 números. No teste, use 123. Não fica salvo.", value: "", error: pe.cvv, inputmode: "numeric", mask: "cvv" }) +
        "</div></div>" +
        '<div class="btn-row inline"><button type="button" class="btn btn-ghost" data-action="back-step">Voltar ao endereço</button>' +
        '<button class="btn btn-add" type="submit">Continuar para revisão</button></div></form>';
    } else {
      var payText = draft.payment.method === "pix" ? "Pix (simulado)" :
        draft.payment.method === "boleto" ? "Boleto (simulado)" :
        "Cartão de crédito terminado em " + esc(draft.payment.last4 || "••••");
      var addr = draft.address;
      main = "<h1>Passo 3 de 3: Revisão</h1>" + stepsHTML(3) +
        '<div class="notice ok"><strong>Confira antes de confirmar.</strong> A compra é simulada: nenhum valor será cobrado.</div>' +
        '<section class="panel"><h2>Entrega</h2><p>' + esc(addr.nome) + "<br>" + esc(addr.rua) + ", " + esc(addr.numero) +
        (addr.complemento ? " — " + esc(addr.complemento) : "") + "<br>" + esc(addr.bairro) + "<br>" +
        esc(addr.cidade) + " — " + esc(addr.uf) + "<br>CEP " + esc(addr.cep) + "</p>" +
        '<button type="button" class="btn btn-ghost btn-small" data-action="goto-step" data-step="1">Corrigir endereço</button></section>' +
        '<section class="panel"><h2>Pagamento</h2><p>' + payText + "</p>" +
        '<button type="button" class="btn btn-ghost btn-small" data-action="goto-step" data-step="2">Corrigir pagamento</button></section>' +
        '<form id="review-form" novalidate><button class="btn btn-buy btn-block" id="place-order" type="submit">Confirmar pedido</button></form>';
    }
    return {
      title: "Finalizar compra",
      html: "<div class=\"layout\"><div>" + main + "</div>" + cartSummary() + "</div>"
    };
  }

  function ufField(error) {
    var options = '<option value="">Selecione</option>' + UFS.map(function (uf) {
      return '<option value="' + uf + '"' + (draft.address.uf === uf ? " selected" : "") + ">" + uf + "</option>";
    }).join("");
    return '<div class="field' + (error ? " has-error" : "") + '"><label for="uf">Estado</label><select id="uf" name="uf"' +
      (error ? ' aria-invalid="true" aria-describedby="uf-err"' : "") + ">" + options + "</select>" +
      (error ? '<p class="error" id="uf-err">' + esc(error) + "</p>" : "") + "</div>";
  }

  function choice(value, label, current) {
    return '<label class="choice"><input type="radio" name="pay" value="' + value + '"' +
      (current === value ? " checked" : "") + "> <span>" + label + "</span></label>";
  }

  function viewOrder(id) {
    var order = null;
    orders.forEach(function (item) { if (item.id === id) order = item; });
    if (!order) {
      return {
        title: "Pedido",
        html: '<div class="empty"><h1>Pedido não encontrado</h1><p>Pedidos simulados ficam disponíveis só até você atualizar a página. De propósito, para não guardar dados.</p><a class="btn btn-add" href="#/">Ir ao início</a></div>'
      };
    }
    var items = order.items.map(function (item) {
      return "<li>" + esc(item.name) + " × " + item.qty + " — " + money(item.price * item.qty) + "</li>";
    }).join("");
    return {
      title: "Pedido confirmado",
      html: '<div class="confirm"><div class="check-badge" aria-hidden="true"><svg width="36" height="36" viewBox="0 0 24 24"><path fill="#fff" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg></div>' +
        "<h1>Pedido confirmado</h1><p>Guarde o número se quiser anotar.</p>" +
        '<p class="order-number" id="order-number">' + esc(order.id) + "</p>" +
        '<p><button type="button" class="btn btn-ghost btn-small" data-action="copy-order" data-id="' + esc(order.id) + '">Copiar número</button></p>' +
        "<p>Feito em " + esc(order.at) + (order.city ? ". Entrega simulada em " + esc(order.city) + " — " + esc(order.uf) + "." : ".") + "</p>" +
        "<p>Pagamento: " + esc(order.payLabel) + ".</p><ul class=\"bullets\">" + items + "</ul>" +
        '<p class="price">' + money(order.total) + "</p><p>Frete grátis.</p>" +
        '<div class="notice ok"><strong>Nenhum valor foi cobrado.</strong> Senha, endereço e dados de pagamento não foram gravados.</div>' +
        '<a class="btn btn-add" href="#/">Voltar ao início</a></div>'
    };
  }

  function viewOrders() {
    if (!auth) {
      return {
        title: "Pedidos",
        html: '<div class="empty"><h1>Entre para ver seus pedidos</h1><button type="button" class="btn btn-add" data-action="go-login" data-dest="#/pedidos">Fazer login</button></div>'
      };
    }
    if (!orders.length) {
      return {
        title: "Pedidos",
        html: '<div class="empty"><h1>Você ainda não fez pedidos nesta visita</h1><p>Quando finalizar uma compra simulada, ela aparece aqui até a página ser atualizada.</p><a class="btn btn-add" href="#/">Ver produtos</a></div>'
      };
    }
    var html = "<h1>Seus pedidos</h1>" + orders.slice().reverse().map(function (order) {
      return '<article class="panel"><h2><a href="#/pedido/' + order.id + '">' + esc(order.id) + "</a></h2><p>" +
        esc(order.at) + " · " + money(order.total) + "</p></article>";
    }).join("");
    return { title: "Pedidos", html: html };
  }

  function viewAccount() {
    if (!auth) {
      return {
        title: "Conta",
        html: '<div class="empty"><h1>Entre na sua conta</h1><p>Use um e-mail de teste. A senha não fica salva.</p><a class="btn btn-add" href="#/entrar">Fazer login</a></div>'
      };
    }
    return {
      title: "Sua conta",
      html: '<div class="panel"><h1>Olá, ' + esc(auth.name) + "</h1><p>E-mail usado nesta visita: " + esc(auth.email) + "</p>" +
        '<div class="notice ok">A senha não está salva. Ao fechar a aba, a entrada também acaba.</div>' +
        '<div class="btn-row inline"><a class="btn btn-add" href="#/pedidos">Ver pedidos</a>' +
        '<a class="btn btn-ghost" href="#/carrinho">Ver carrinho</a>' +
        '<button type="button" class="btn btn-ghost" data-action="logout">Sair</button></div></div>'
    };
  }

  function viewHelp() {
    return {
      title: "Ajuda",
      html: "<h1>Como comprar nesta loja</h1><p>Os passos são curtos. Se travar, chame a pessoa que está aplicando o teste.</p>" +
        "<ol class=\"help-list\">" +
        "<li><strong>Entrar.</strong> Clique em “Olá, faça seu login”. Digite um e-mail com @ e depois uma senha de 6 ou mais caracteres. Você pode marcar “Mostrar senha”. Não use sua senha real.</li>" +
        "<li><strong>Buscar.</strong> Escreva o produto na barra do topo e clique em Buscar. Se a palavra estiver errada, a loja mostra sugestões e “você quis dizer”.</li>" +
        "<li><strong>Adicionar.</strong> Abra o produto e clique no botão amarelo “Adicionar ao carrinho”.</li>" +
        "<li><strong>Remover.</strong> Abra o carrinho e clique em Remover. Se foi sem querer, clique em Desfazer.</li>" +
        "<li><strong>Finalizar.</strong> No carrinho, clique em “Finalizar compra”. Informe o endereço, escolha o pagamento e confirme. É uma simulação: nada é cobrado.</li>" +
        "</ol><h2>Atalhos do teclado</h2><p>Use Tab para ir de campo em campo, Enter para confirmar e Esc para fechar um aviso.</p>" +
        '<div class="btn-row inline"><a class="btn btn-add" href="#/entrar">Ir para o login</a>' +
        '<button type="button" class="btn btn-ghost" data-action="focus-search">Ir para a busca</button>' +
        '<a class="btn btn-ghost" href="#/carrinho">Ir ao carrinho</a></div>'
    };
  }

  function render() {
    var route = parseRoute();
    var key = route.name + "/" + (route.id || "");
    var entered = key !== lastRouteKey;
    if (route.name === "entrar" && entered) {
      if (!keepReturn) setReturn("#/");
      loginState.step = "email";
      loginState.errors = {};
    }
    if (route.name === "entrar") keepReturn = false;
    lastRouteKey = key;
    document.body.dataset.page = route.name;
    setDept(false);
    hideSuggestions();
    if (!undoSnapshot) hideToast();
    if (window.Dashboard) Dashboard.unmount();
    paintChrome();

    var input = document.getElementById("q");
    var dept = document.getElementById("dept");
    if (route.name === "busca" && input && document.activeElement !== input) {
      input.value = route.params.q || "";
      var clearButton = document.getElementById("clear-q");
      if (clearButton) clearButton.hidden = !input.value;
    }
    if (route.name === "busca" && dept && route.params.cat && document.activeElement !== dept) {
      var exists = false;
      Array.prototype.forEach.call(dept.options, function (option) {
        if (option.value === route.params.cat) exists = true;
      });
      if (exists) dept.value = route.params.cat;
    }

    var main = document.getElementById("conteudo");
    if (route.name === "admin") {
      document.title = "Registro do teste | Loja Fácil";
      Dashboard.mount(main);
      window.scrollTo(0, 0);
      var adminHeading = main.querySelector("h1");
      if (adminHeading) {
        adminHeading.setAttribute("tabindex", "-1");
        adminHeading.classList.add("route-focus");
        adminHeading.focus({ preventScroll: true });
      }
      return;
    }

    var view = null;
    if (route.name === "home") view = viewHome();
    else if (route.name === "c") view = viewCategory(route.id);
    else if (route.name === "ofertas") view = viewOffers();
    else if (route.name === "busca") view = viewSearch(route);
    else if (route.name === "produto") view = viewProduct(route.id);
    else if (route.name === "carrinho") view = viewCart();
    else if (route.name === "entrar") view = viewLogin();
    else if (route.name === "checkout") view = viewCheckout();
    else if (route.name === "pedido") view = viewOrder(route.id);
    else if (route.name === "pedidos") view = viewOrders();
    else if (route.name === "conta") view = viewAccount();
    else if (route.name === "ajuda") view = viewHelp();

    if (!view) {
      view = {
        title: "Página não encontrada",
        html: '<div class="empty"><h1>Não encontramos esta página</h1><p>O endereço não existe nesta loja.</p><a class="btn btn-add" href="#/">Ir ao início</a></div>'
      };
    }

    main.innerHTML = view.html;
    document.title = view.title + " | Loja Fácil";
    var field = focusField;
    var pending = pendingFocus;
    focusField = "";
    pendingFocus = "";
    formErrors = {};
    loginState.errors = {};

    window.scrollTo(0, 0);
    if (pending) {
      var target = document.querySelector(pending);
      if (target) {
        target.focus();
        return;
      }
    }
    if (field) {
      var invalid = document.getElementById(field);
      if (invalid) {
        invalid.focus();
        return;
      }
    }
    var heading = main.querySelector("h1");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.classList.add("route-focus");
      heading.focus({ preventScroll: true });
    }
  }

  function onSearchSubmit(event) {
    event.preventDefault();
    if (suggestIndex >= 0) {
      pickSuggest(suggestIndex);
      return;
    }
    submitSearch();
  }

  function handleAction(el) {
    var action = el.getAttribute("data-action");
    if (action === "add") addToCart(el.getAttribute("data-id"), qtyFor(el.getAttribute("data-id")));
    else if (action === "buy") {
      var buyId = el.getAttribute("data-id");
      addToCart(buyId, qtyFor(buyId));
      if (!auth) {
        setReturn("#/checkout");
        keepReturn = true;
        go("#/entrar");
      } else go("#/checkout");
    } else if (action === "remove") removeItem(el.getAttribute("data-id"));
    else if (action === "checkout") {
      if (!cart.items.length) {
        TestLog.addError("finalizar", "Carrinho vazio");
        showToast("Seu carrinho está vazio. Escolha um produto antes de finalizar.");
        return;
      }
      if (!auth) {
        setReturn("#/checkout");
        keepReturn = true;
        go("#/entrar");
      } else go("#/checkout");
    } else if (action === "toggle-dept") {
      var willOpen = document.getElementById("dept-panel").hidden;
      setDept(willOpen);
      if (willOpen) {
        var first = document.querySelector("#dept-panel a");
        if (first) first.focus();
      }
    } else if (action === "delivery") {
      openModal("Entrega nesta loja de teste", "<p>A entrega é simulada para todo o Brasil. Você informa o endereço só na hora de finalizar a compra, e ele não fica salvo.</p>");
    } else if (action === "top") {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      var logo = document.querySelector(".logo");
      if (logo) logo.focus({ preventScroll: true });
    } else if (action === "logout") logout();
    else if (action === "change-email") {
      loginState.step = "email";
      loginState.errors = {};
      focusField = "login-email";
      render();
    } else if (action === "goto-step") gotoStep(el.getAttribute("data-step"));
    else if (action === "back-step") gotoStep(draft.step - 1);
    else if (action === "go-login") {
      setReturn(el.getAttribute("data-dest") || "#/");
      keepReturn = true;
      go("#/entrar");
    } else if (action === "pick-suggest") pickSuggest(parseInt(el.getAttribute("data-index"), 10));
    else if (action === "copy-order") copyOrder(el.getAttribute("data-id"));
    else if (action === "focus-search") {
      pendingFocus = "#q";
      go("#/");
    }
  }

  function init() {
    paintChrome();
    if (new URLSearchParams(location.search).get("teste") === "1") {
      var bar = document.getElementById("testbar");
      if (bar) bar.hidden = false;
    }
    var toast = document.getElementById("toast");
    document.getElementById("search-form").addEventListener("submit", onSearchSubmit);
    document.getElementById("q").addEventListener("input", onSearchInput);
    document.getElementById("suggestions").addEventListener("mousedown", function () { suggestLock = true; });
    document.getElementById("q").addEventListener("blur", function () {
      setTimeout(function () {
        if (!suggestLock) hideSuggestions();
        suggestLock = false;
      }, 180);
    });
    document.getElementById("toast-action").addEventListener("click", function () {
      if (typeof toastAction === "function") toastAction();
    });
    document.getElementById("toast-close").addEventListener("click", function () {
      undoSnapshot = null;
      hideToast();
    });
    document.getElementById("modal-close").addEventListener("click", closeModal);
    document.getElementById("modal").addEventListener("click", function (event) {
      if (event.target.id === "modal") closeModal();
    });
    toast.addEventListener("mouseenter", function () {
      if (toastTimer) clearTimeout(toastTimer);
    });
    toast.addEventListener("focusin", function () {
      if (toastTimer) clearTimeout(toastTimer);
    });
    toast.addEventListener("mouseleave", resumeToast);
    toast.addEventListener("focusout", resumeToast);

    document.addEventListener("click", function (event) {
      if (event.target.closest("#clear-q")) {
        clearSearch();
        return;
      }
      var inDept = event.target.closest("#dept-panel") || event.target.closest("#todos-btn");
      var panel = document.getElementById("dept-panel");
      if (panel && !panel.hidden && !inDept) setDept(false);
      if (!event.target.closest(".search-wrap")) hideSuggestions();
      var actionEl = event.target.closest("[data-action]");
      if (!actionEl) return;
      handleAction(actionEl);
    });

    document.addEventListener("submit", function (event) {
      var form = event.target;
      if (!form || !form.id) return;
      if (form.id === "login-form" || form.id === "address-form" || form.id === "payment-form" || form.id === "review-form") {
        event.preventDefault();
      }
      if (form.id === "login-form") submitLogin();
      else if (form.id === "address-form") submitAddress();
      else if (form.id === "payment-form") submitPayment();
      else if (form.id === "review-form") placeOrder();
    });

    document.addEventListener("input", function (event) {
      var mask = event.target.getAttribute && event.target.getAttribute("data-mask");
      if (!mask) return;
      var next = event.target.value;
      if (mask === "cep") next = maskCep(next);
      else if (mask === "card") {
        cardBuffer = digits(next).slice(0, 16);
        next = maskCard(cardBuffer);
      } else if (mask === "exp") next = maskExp(next);
      else if (mask === "phone") next = maskPhone(next);
      else if (mask === "cvv") {
        cvvBuffer = digits(next).slice(0, 4);
        next = cvvBuffer;
      }
      if (next !== event.target.value) event.target.value = next;
    });

    document.addEventListener("change", function (event) {
      if (event.target.id === "show-pass") {
        var password = document.getElementById("login-password");
        if (password) password.type = event.target.checked ? "text" : "password";
        var live = document.getElementById("live");
        if (live) live.textContent = event.target.checked ? "Senha visível." : "Senha oculta.";
      }
      if (event.target.getAttribute && event.target.getAttribute("data-cart-qty")) {
        updateQty(event.target.getAttribute("data-cart-qty"), event.target.value);
      }
      if (event.target.name === "pay") {
        draft.payment.method = event.target.value;
        var box = document.getElementById("card-fields");
        if (box) box.hidden = event.target.value !== "cartao";
      }
      if (event.target.id === "dept") onSearchInput();
    });

    document.addEventListener("keydown", function (event) {
      var modal = document.getElementById("modal");
      if (event.key === "Escape") {
        if (modal && !modal.hidden) {
          closeModal();
          return;
        }
        var deptPanel = document.getElementById("dept-panel");
        if (deptPanel && !deptPanel.hidden) {
          setDept(false);
          document.getElementById("todos-btn").focus();
          return;
        }
        hideSuggestions();
      }
      if (modal && !modal.hidden && event.key === "Tab") trapFocus(document.querySelector(".modal-card"), event);
      if ((event.key === "ArrowDown" || event.key === "ArrowUp") && document.activeElement && document.activeElement.id === "q") {
        var list = document.getElementById("suggestions");
        if (list && !list.hidden) {
          event.preventDefault();
          moveSuggest(event.key === "ArrowDown" ? 1 : -1);
        }
      }
    });

    window.addEventListener("hashchange", render);
    window.addEventListener("pagehide", wipeSensitive);
    render();
  }

  function resumeToast() {
    if (!toastMs) return;
    setTimeout(function () {
      var toast = document.getElementById("toast");
      if (!toast || toast.hidden || !toastMs) return;
      if (toast.contains(document.activeElement) || toast.matches(":hover")) return;
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(hideToast, toastMs);
    }, 250);
  }

  init();
})();
