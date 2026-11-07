(function (global) {
  "use strict";

  var KEY = "lojafacil_teste_v1";
  var TASKS = ["login", "buscar", "adicionar", "remover", "finalizar"];
  var LABELS = {
    login: "Login",
    buscar: "Buscar",
    adicionar: "Adicionar",
    remover: "Remover",
    finalizar: "Finalizar"
  };
  var memoryLog = null;

  function blankTasks() {
    var tasks = {};
    TASKS.forEach(function (t) {
      tasks[t] = { startedAt: null, endedAt: null, errors: 0, completed: false };
    });
    return tasks;
  }

  function freshSession(participant) {
    return {
      id: "S" + Date.now().toString(36),
      participant: participant || "",
      startedAt: new Date().toISOString(),
      tasks: blankTasks(),
      events: []
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && typeof data === "object") {
          if (!Array.isArray(data.sessions)) data.sessions = [];
          memoryLog = data;
          return data;
        }
      }
    } catch (e) {
      /* arquivo local pode bloquear o armazenamento; segue na memória */
    }
    if (!memoryLog) memoryLog = { sessions: [], current: null };
    return memoryLog;
  }

  function save(data) {
    memoryLog = data;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      /* não interrompe a loja se o navegador recusar */
    }
  }

  function ensureCurrent() {
    var data = load();
    if (!data.current) {
      data.current = freshSession("");
      save(data);
    }
    TASKS.forEach(function (t) {
      if (!data.current.tasks[t]) data.current.tasks[t] = { startedAt: null, endedAt: null, errors: 0, completed: false };
    });
    if (!Array.isArray(data.current.events)) data.current.events = [];
    return data;
  }

  function pushEvent(data, task, type, detail) {
    data.current.events.push({
      t: new Date().toISOString(),
      task: task || "",
      type: type,
      detail: detail || ""
    });
    if (data.current.events.length > 400) data.current.events.shift();
  }

  function sessionHasActivity(session) {
    if (!session) return false;
    if (session.events && session.events.length) return true;
    return TASKS.some(function (t) {
      return session.tasks[t] && session.tasks[t].startedAt;
    });
  }

  function startTask(task) {
    if (TASKS.indexOf(task) === -1) return;
    var data = ensureCurrent();
    var slot = data.current.tasks[task];
    if (slot.completed || slot.startedAt) return;
    slot.startedAt = new Date().toISOString();
    pushEvent(data, task, "inicio", "");
    save(data);
  }

  function completeTask(task) {
    if (TASKS.indexOf(task) === -1) return;
    var data = ensureCurrent();
    var slot = data.current.tasks[task];
    if (slot.completed) return;
    if (!slot.startedAt) slot.startedAt = new Date().toISOString();
    slot.completed = true;
    slot.endedAt = new Date().toISOString();
    pushEvent(data, task, "conclusao", "");
    save(data);
  }

  function addError(task, detail) {
    if (TASKS.indexOf(task) === -1) return;
    var data = ensureCurrent();
    var slot = data.current.tasks[task];
    if (!slot.startedAt) slot.startedAt = new Date().toISOString();
    if (!slot.completed) slot.errors += 1;
    pushEvent(data, task, slot.completed ? "nota" : "erro", detail || "");
    save(data);
  }

  function reopenTask(task) {
    if (TASKS.indexOf(task) === -1) return;
    var data = ensureCurrent();
    var slot = data.current.tasks[task];
    slot.completed = false;
    slot.endedAt = null;
    save(data);
  }

  function resetTask(task) {
    if (TASKS.indexOf(task) === -1) return;
    var data = ensureCurrent();
    data.current.tasks[task] = { startedAt: null, endedAt: null, errors: 0, completed: false };
    pushEvent(data, task, "reinicio", "");
    save(data);
  }

  function setParticipant(name) {
    var data = ensureCurrent();
    data.current.participant = String(name || "").trim().slice(0, 40);
    save(data);
  }

  function newSession(participant) {
    var data = load();
    if (sessionHasActivity(data.current)) data.sessions.push(data.current);
    data.current = freshSession(String(participant || "").trim().slice(0, 40));
    save(data);
    return data.current;
  }

  function clearAll() {
    memoryLog = { sessions: [], current: null };
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
  }

  function csvEscape(value, sep) {
    var s = String(value == null ? "" : value);
    if (s.indexOf('"') !== -1 || s.indexOf(sep) !== -1 || /[\n\r]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function durationSeconds(slot) {
    if (!slot || !slot.startedAt || !slot.endedAt) return "";
    var ms = new Date(slot.endedAt) - new Date(slot.startedAt);
    if (isNaN(ms) || ms < 0) return "";
    return (ms / 1000).toFixed(1).replace(".", ",");
  }

  function allSessions(data) {
    var list = (data.sessions || []).slice();
    if (data.current) list.push(data.current);
    return list;
  }

  function toCSV() {
    var sep = ";";
    var data = load();
    var rows = [[
      "sessao", "participante", "inicio_sessao", "tarefa",
      "inicio_tarefa", "fim_tarefa", "duracao_segundos", "erros", "concluida"
    ]];
    allSessions(data).forEach(function (session) {
      TASKS.forEach(function (task) {
        var slot = session.tasks[task] || {};
        rows.push([
          session.id,
          session.participant || "",
          session.startedAt || "",
          task,
          slot.startedAt || "",
          slot.endedAt || "",
          durationSeconds(slot),
          slot.errors || 0,
          slot.completed ? "sim" : "nao"
        ]);
      });
    });
    return "\uFEFF" + rows.map(function (row) {
      return row.map(function (cell) { return csvEscape(cell, sep); }).join(sep);
    }).join("\r\n");
  }

  function eventsCSV() {
    var sep = ";";
    var data = load();
    var rows = [["sessao", "participante", "hora", "tarefa", "tipo", "detalhe"]];
    allSessions(data).forEach(function (session) {
      (session.events || []).forEach(function (event) {
        rows.push([
          session.id,
          session.participant || "",
          event.t || "",
          event.task || "",
          event.type || "",
          event.detail || ""
        ]);
      });
    });
    return "\uFEFF" + rows.map(function (row) {
      return row.map(function (cell) { return csvEscape(cell, sep); }).join(sep);
    }).join("\r\n");
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  global.TestLog = {
    KEY: KEY,
    TASKS: TASKS,
    LABELS: LABELS,
    load: load,
    startTask: startTask,
    completeTask: completeTask,
    addError: addError,
    reopenTask: reopenTask,
    resetTask: resetTask,
    setParticipant: setParticipant,
    newSession: newSession,
    clearAll: clearAll,
    toCSV: toCSV,
    eventsCSV: eventsCSV,
    durationSeconds: durationSeconds,
    esc: esc
  };
})(typeof window !== "undefined" ? window : globalThis);
