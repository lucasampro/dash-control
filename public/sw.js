// Service worker do Painel CONTROL — recebe os Web Push de lead novo e mostra
// a notificação nativa no celular, mesmo com o app fechado.

self.addEventListener("push", function (event) {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "Painel CONTROL", body: event.data.text() };
  }
  const options = {
    body: data.body,
    icon: "/logo-icon.png",
    badge: "/logo-icon.png",
    vibrate: [100, 50, 100],
    tag: data.tag || "novo-lead",
    data: { url: data.url || "/leads" },
  };
  event.waitUntil(self.registration.showNotification(data.title || "Painel CONTROL", options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const destino = (event.notification.data && event.notification.data.url) || "/leads";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (janelas) {
      // Se já tem uma aba do painel aberta, foca nela; senão abre uma nova.
      for (const janela of janelas) {
        if ("focus" in janela) {
          janela.navigate(destino).catch(() => {});
          return janela.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(destino);
    }),
  );
});
