export const SHEET_ID = "1yiUqplHbOQye19wYsWuJbH0yZQcaEzcPRLyHR_XrrKA";
export const SHEET_ID_TRACKING = "1tKWJJcIaYvZgmjipqCzDSp8xahcb07hlZnaZ4Hwf-cQ";
export const REFRESH_MS = 45 * 60 * 1000;

export const LOJAS_LIST = [
  "GRUPO","1835","IGUATEMI","CAIS ANEXO","CAIS","CAIS TOTAL","PONTAL","BALI HAI","DE RUA","DELIVERY",
];
export const LOJAS_BASE = [
  "1835","IGUATEMI","CAIS ANEXO","CAIS","PONTAL","BALI HAI","DE RUA","DELIVERY",
];

export const MARCA: Record<string, { marca: string; modelo: string }> = {
  GRUPO:        { marca: "MBCO",  modelo: "GRUPO" },
  "1835":       { marca: "1835",  modelo: "FS" },
  IGUATEMI:     { marca: "20/9",  modelo: "FS" },
  "CAIS ANEXO": { marca: "20/9",  modelo: "FS" },
  CAIS:         { marca: "20/9",  modelo: "FS" },
  "CAIS TOTAL": { marca: "20/9",  modelo: "FS" },
  PONTAL:       { marca: "20/9",  modelo: "FS" },
  "BALI HAI":   { marca: "20/9",  modelo: "FS" },
  "DE RUA":     { marca: "SMILE", modelo: "QS" },
  DELIVERY:     { marca: "SMILE", modelo: "QS" },
};

export const SELETOR_GRUPOS = [
  { label: "Grupo", lojas: ["GRUPO"], marca: "MBCO" },
  { label: "1835",  lojas: ["1835"],  marca: "1835" },
  { label: "20/9",  lojas: ["IGUATEMI","CAIS ANEXO","CAIS","CAIS TOTAL","PONTAL","BALI HAI"], marca: "20/9" },
  { label: "Smile", lojas: ["DE RUA","DELIVERY"], marca: "SMILE" },
];

export const MARCA_COR: Record<string, { bg: string; ativa: string; texto: string; acento: string }> = {
  MBCO:  { bg: "rgba(255,255,255,.08)", ativa: "rgba(255,255,255,.18)", texto: "#fff",    acento: "#fff" },
  "1835":{ bg: "rgba(139,101,50,.15)",  ativa: "rgba(139,101,50,.4)",   texto: "#c8a96e", acento: "#c8a96e" },
  "20/9":{ bg: "rgba(180,30,30,.12)",   ativa: "rgba(180,30,30,.4)",    texto: "#e87070", acento: "#e87070" },
  SMILE: { bg: "rgba(220,170,0,.12)",   ativa: "rgba(220,170,0,.35)",   texto: "#f0c830", acento: "#f0c830" },
};

export const LOGO_B64: Record<string, string> = {
  "1835": "https://i.imgur.com/WR9TtaQ.png",
  "20/9": "https://i.imgur.com/3wWFKBa.png",
  SMILE:  "https://i.imgur.com/na1hnQk.png",
};

export const SA = {
  client_email: "painel-leitor@painel-mandabrasa.iam.gserviceaccount.com",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDcf/ekayYL2hDZ\nUk47CaMo/a/dB1SPF64ilUhFdQ+TuOuX5rYE2/LgO8ZNTPsbGy9m7hIWwLiAIzXs\nHB7aZklHm4ojtMGEJaz1rn1Fw7skdzeylxJ1waMHeYjkt0jqM94jELwJcuM+o82n\nsJYJEeYyZvyCkWJYc80YMdtWpaVttvS58/RHAnD+EKDdaXql2b7ld+Ajl4EelrMi\nbKuZvPDBDkt8NKq7thf7qTxivBgf/1fHm8KAzWNC3GdS3wz00zNYlit413SrGFQS\nT+A4RwHePuxkrXyCt9/MJPz9WTOa1knhLENf80h1zhayNwW2DG47rIIOEMSkPezM\n8UiH6/K7AgMBAAECggEAAUJrMVw5+71Yyp+muhLvBKVA+OaO0WvANIsHvlB8hfUm\nG1hXrSVtzgwUBjhXWCtKlQWXwtuCR5vBNhe0XBOo0tOM8XFEiF2yuYsv71MT4ZHG\nFqti5ptJiW8PR3HTOnXmDJXkN7rumK//f7gJfgRv0n/gwgTUkU7FWssGHAjsLfk9\nKdp9xc3GjtRkRb/N9C9KjUsI/vk+6daCoUzJQF1x9KeJFEjKtapiyiovGqWYkaF2\n8TtQnc7Itl8o5Nt/GMmjOpeMsuoVJ6T9qKPak5RjKAO+KWg6kUOD+XeGsfQp7qpH\nY1a6//P0oo/IeoK3+VZCBgUzRhjMdF+lwZXSm7j5aQKBgQD//wReic8TgUKd2OOG\nDhMEUMc2Fnavb0JPKMl9rcB3xyxxrquxubUVuGJd4HGaa+qiJbgy6VaR8XrbLnCE\ncrMcmtBSofvEMLPmvy4yRHju07rfnCpvjzl4digpympGH3u9tY1vUk420s0k/6ak\n32GytIiapBG8P1rlciI51Aih9wKBgQDcgNBhykZ+lXV+P4Mx6/RF69NYNRV/j88r\nV7qCnq/i6Oe7YR0mvjv3oMI9dNGGNf7jqQH7ygaIfeu86gjk3bggnVNwkmQwx1fo\n52lWzYhFX507o//DNgBoCCN3r7lvTvwiqHY/aVDG979DkAHMoEDwrjJK1GeEg9HX\nx5stj3jEXQKBgH8BBCfq8uNYY7ZwHiEp5mFjuhGpf2R2LE2djKlfhHdoRzJ3WBMq\ncR6/hX3Rlkroc1XSpNoNTbfGOA95sLTlOttcKzJzzrZ8+yPlgYPK2LyUKsg5cAw8\n4GRVKoPhOmxjvj5WTj8GdGtalhBfDUwKzyubyZH/CBV+0Re4UiaifU3tAoGADUo+\nRQaaBRsg/8D4OVQNXwF9tX1NlGioheY9uY2y8Cw1e1e5GBKzLpOj4WxfDIXInRQc\nqH5esm9UfAhnDNRIOr8AvnI0U7RQGhuIf9DXe8bthSC3U563m42SBa6zsH/ENpqM\ntfm1AqkAACR310t5XohBQ71Vl+kSBr1jHvXcw4kCgYB8C6Ex2El3y+CWhiW60+x+\nKQhq7FW/899Adn+CkrN7GSmVo6n2XIXl1HjukgO/GcB1CPo5z7nr0jXGEBZQJWGR\nKiFn51HWrWRAY0w9F3bHREQUDQgIYPq/VYHwS2Un89jDMvOCn5Pf87vCK7ZeGh8P\nTcrfGIjL/bg9MACmfsgZPw==\n-----END PRIVATE KEY-----\n",
};
