(function (global) {
  "use strict";

  var timer = null;
  var armClear = false;

  function formatLive(slot) {
    if (!slot || !slot.startedAt) return "—";
    var end = slot.endedAt ? new Date(slot.endedAt) : new Date();
    var ms = end - new Date(slot.startedAt);
    if (isNaN(ms) || ms < 0) return "—";
    var text = (ms / 1000).toFixed(1).replace(".", ",") + " s";
    if (!slot.endedAt) text += " · em andamento";
    return text;
  }

  function statusOf(slot) {
    if (!slot || !slot.startedAt) return "Não iniciada";
    if (slot.completed) return "Concluída";
    return "Em andamento";
  }

  function dashboardHTML() {
    var data = TestLog.load();
    var current = data.current;
    var rows = TestLog.TASKS.map(function (task) {
      var slot = current && current.tasks[task] ? current.tasks[task] : null;
      return (
        "<tr>" +
        "<th scope=\"row\">" + TestLog.esc(TestLog.LABELS[task]) + "</th>" +
        "<td data-live=\"" + task + "-status\">" + TestLog.esc(statusOf(slot)) + "</td>" +
        "<td data-live=\"" + task + "-time\">" + TestLog.esc(formatLive(slot)) + "</td>" +
        "<td data-live=\"" + task + "-errors\">" + (slot ? slot.errors : 0) + "</td>" +
        "<td><button type=\"button\" class=\"btn btn-ghost btn-small\" data-admin=\"reset-task\" data-task=\"" + task + "\">Reiniciar</button></td>" +
        "</tr>"
      );
    }).join("");

    var past = (data.sessions || []).map(function (session) {
      var cells = TestLog.TASKS.map(function (task) {
        var slot = session.tasks[task] || {};
        var dur = TestLog.durationSeconds(slot);
        var label = slot.completed ? (dur ? dur + " s" : "ok") : "—";
        if (slot.errors) label += " · " + slot.errors + " erro" + (slot.errors > 1 ? "s" : "");
        return "<td>" + TestLog.esc(label) + "</td>";
      }).join("");
      return (
        "<tr><th scope=\"row\">" + TestLog.esc(session.id) + "</th>" +
        "<td>" + TestLog.esc(session.participant || "—") + "</td>" + cells + "</tr>"
      );
    }).join("");

    var events = [];
    if (current && current.events) {
      events = current.events.slice(-12).reverse().map(function (event) {
        var hora = "";
        try { hora = new Date(event.t).toLocaleTimeString("pt-BR"); } catch (e) { hora = ""; }
        return (
          "<tr><td>" + TestLog.esc(hora) + "</td><td>" + TestLog.esc(event.task) +
          "</td><td>" + TestLog.esc(event.type) + "</td><td>" + TestLog.esc(event.detail) + "</td></tr>"
        );
      }).join("");
    }

    var participant = current && current.participant ? current.participant : "";
    var sessionId = current ? current.id : "—";

    return (
      '<section class="admin">' +
      '<h1>Registro do teste</h1>' +
      '<p class="lead">Os tempos e os erros ficam só neste navegador. Senha, endereço e pagamento não entram neste registro.</p>' +
      '<ol class="admin-steps">' +
      '<li>Abra a loja em outra aba do mesmo navegador.</li>' +
      '<li>Digite um código (por exemplo P01) e comece uma nova sessão antes de cada pessoa.</li>' +
      '<li>Peça as tarefas: login, buscar, adicionar, remover e finalizar.</li>' +
      '<li>No fim, exporte o CSV. No Excel em português, o separador é ponto e vírgula.</li>' +
      "</ol>" +
      '<div class="admin-toolbar">' +
      '<div class="field">' +
      '<label for="participant">Código do participante</label>' +
      '<p class="hint" id="participant-hint">Evite nome completo. Um código basta.</p>' +
      '<input id="participant" maxlength="40" autocomplete="off" aria-describedby="participant-hint" value="' + TestLog.esc(participant) + '">' +
      "</div>" +
      '<div class="btn-row inline">' +
      '<button type="button" class="btn btn-add" data-admin="save-code">Salvar código</button>' +
      '<button type="button" class="btn btn-buy" data-admin="new-session">Começar nova sessão</button>' +
      "</div>" +
      '<p>Sessão atual: <strong id="session-id">' + TestLog.esc(sessionId) + "</strong></p>" +
      "</div>" +
      '<div class="table-wrap">' +
      '<table class="data">' +
      "<caption>Sessão atual</caption>" +
      "<thead><tr><th>Tarefa</th><th>Situação</th><th>Tempo</th><th>Erros</th><th></th></tr></thead>" +
      "<tbody>" + rows + "</tbody></table></div>" +
      '<h2>Quando o relógio começa</h2>' +
      "<ul>" +
      "<li><strong>Login:</strong> ao abrir a tela de entrada, até a pessoa entrar. Erro quando o e-mail ou a senha não passam.</li>" +
      "<li><strong>Buscar:</strong> ao digitar ou pesquisar, até aparecer um resultado ou a pessoa escolher uma sugestão. Erro em busca vazia ou sem resultado.</li>" +
      "<li><strong>Adicionar:</strong> ao abrir a página do produto, até colocar no carrinho.</li>" +
      "<li><strong>Remover:</strong> ao abrir o carrinho com itens, até remover. Desfazer conta como erro e reabre a tarefa.</li>" +
      "<li><strong>Finalizar:</strong> ao abrir o fechamento da compra, até a confirmação. Erro quando endereço ou pagamento não passam.</li>" +
      "</ul>" +
      '<div class="btn-row inline">' +
      '<button type="button" class="btn btn-add" data-admin="export">Exportar CSV</button>' +
      '<button type="button" class="btn btn-ghost" data-admin="export-events">Exportar eventos</button>' +
      '<button type="button" class="btn btn-ghost" id="clear-log" data-admin="clear">Apagar registros</button>' +
      "</div>" +
      (past
        ? '<h2>Sessões anteriores neste navegador</h2><div class="table-wrap"><table class="data"><thead><tr><th>Sessão</th><th>Código</th>' +
          TestLog.TASKS.map(function (t) { return "<th>" + TestLog.esc(TestLog.LABELS[t]) + "</th>"; }).join("") +
          "</tr></thead><tbody>" + past + "</tbody></table></div>"
        : '<p class="hint">Ainda não há sessões arquivadas. Ao começar uma nova, a atual vai para esta lista.</p>') +
      '<h2>Últimos eventos da sessão atual</h2>' +
      (events
        ? '<div class="table-wrap"><table class="data"><thead><tr><th>Hora</th><th>Tarefa</th><th>Tipo</th><th>Detalhe</th></tr></thead><tbody>' + events + "</tbody></table></div>"
        : "<p>Nenhum evento ainda.</p>") +
      "</section>"
    );
  }

  function tick(root) {
    if (!root || !root.isConnected) {
      unmount();
      return;
    }
    var data = TestLog.load();
    var current = data.current;
    TestLog.TASKS.forEach(function (task) {
      var slot = current && current.tasks[task] ? current.tasks[task] : null;
      var status = root.querySelector('[data-live="' + task + '-status"]');
      var time = root.querySelector('[data-live="' + task + '-time"]');
      var errors = root.querySelector('[data-live="' + task + '-errors"]');
      if (status) status.textContent = statusOf(slot);
      if (time) time.textContent = formatLive(slot);
      if (errors) errors.textContent = String(slot ? slot.errors : 0);
    });
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    var link = document.createElement("a");
    var url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function draw(root) {
    var focused = document.activeElement && document.activeElement.id === "participant";
    var draft = focused ? document.activeElement.value : null;
    root.innerHTML = dashboardHTML();
    if (draft != null) {
      var input = document.getElementById("participant");
      if (input) {
        input.value = draft;
        input.focus();
        var pos = draft.length;
        try { input.setSelectionRange(pos, pos); } catch (e) {}
      }
    }
  }

  function onClick(event) {
    var button = event.target.closest("[data-admin]");
    if (!button) return;
    var root = button.closest("[data-dashboard]");
    if (!root) return;
    var action = button.getAttribute("data-admin");
    var input = root.querySelector("#participant");
    var code = input ? input.value : "";
    if (action === "save-code") {
      TestLog.setParticipant(code);
      draw(root);
      announce("Código salvo nesta sessão.");
    } else if (action === "new-session") {
      TestLog.newSession(code);
      armClear = false;
      draw(root);
      announce("Nova sessão iniciada.");
    } else if (action === "reset-task") {
      TestLog.resetTask(button.getAttribute("data-task"));
      draw(root);
    } else if (action === "export") {
      download("loja-facil-teste.csv", TestLog.toCSV());
    } else if (action === "export-events") {
      download("loja-facil-eventos.csv", TestLog.eventsCSV());
    } else if (action === "clear") {
      if (!armClear) {
        armClear = true;
        button.textContent = "Clique de novo para apagar";
        setTimeout(function () {
          armClear = false;
          if (button.isConnected) button.textContent = "Apagar registros";
        }, 4000);
        return;
      }
      TestLog.clearAll();
      armClear = false;
      draw(root);
      announce("Registros apagados deste navegador.");
    }
  }

  function onKey(event) {
    if (event.key === "Enter" && event.target.id === "participant") {
      event.preventDefault();
      var root = event.target.closest("[data-dashboard]");
      if (!root) return;
      TestLog.setParticipant(event.target.value);
      announce("Código salvo nesta sessão.");
    }
  }

  function announce(message) {
    var live = document.getElementById("live");
    if (live) live.textContent = message;
  }

  var bound = false;

  function mount(root) {
    root.setAttribute("data-dashboard", "1");
    draw(root);
    if (timer) clearInterval(timer);
    timer = setInterval(function () { tick(root); }, 1000);
    if (!bound) {
      bound = true;
      document.addEventListener("click", onClick);
      document.addEventListener("keydown", onKey);
      window.addEventListener("storage", function (event) {
        if (event.key && event.key !== TestLog.KEY) return;
        var open = document.querySelector("[data-dashboard]");
        if (open && open.isConnected) draw(open);
      });
    }
  }

  function unmount() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  global.Dashboard = { mount: mount, unmount: unmount, draw: draw };
})(typeof window !== "undefined" ? window : globalThis);
