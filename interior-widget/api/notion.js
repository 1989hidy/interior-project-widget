const { Client } = require("@notionhq/client");

function getNotion() {
  if (!process.env.NOTION_TOKEN) throw new Error("NOTION_TOKEN 환경변수가 설정되지 않았습니다.");
  return new Client({ auth: process.env.NOTION_TOKEN });
}

function getText(property) {
  if (!property) return "";
  if (property.type === "title") return property.title.map((item) => item.plain_text).join("");
  if (property.type === "rich_text") return property.rich_text.map((item) => item.plain_text).join("");
  if (property.type === "select" || property.type === "status") return property[property.type]?.name || "";
  if (property.type === "number") return property.number ?? "";
  return "";
}

function getDate(property) {
  return property?.type === "date" && property.date ? property.date : null;
}

function sendError(response, error) {
  console.error(error);
  response.status(500).json({ error: "데이터를 불러오지 못했습니다." });
}

async function queryAll(notion, options) {
  const results = [];
  let start_cursor;
  do {
    const page = await notion.databases.query({ ...options, page_size: 100, start_cursor });
    results.push(...page.results);
    start_cursor = page.has_more ? page.next_cursor : undefined;
  } while (start_cursor);
  return results;
}

module.exports = { getNotion, getText, getDate, sendError, queryAll };
